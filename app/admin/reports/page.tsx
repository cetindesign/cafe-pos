import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  DATE_RANGE_LABELS,
  getDateRange,
  getCustomDateRange,
  isValidDateRange,
  isValidDateParam,
  formatCustomRangeLabel,
  type DateRange,
} from '@/lib/date-ranges'
import RangeSelector from './RangeSelector'
import { ArrowLeft, TrendingUp, ShoppingBag, Receipt, Wallet } from 'lucide-react'

type ProductStat = { name: string; quantity: number }
type CashierStat = { name: string; orders: number; revenue: number }

type OrderItem = {
  quantity: number
  unit_price: number
  product_id: string
  products: { name: string } | { name: string }[] | null
}

type OrderRow = {
  id: string
  cashier_id: string
  payment_method: 'cash' | 'card' | null
  closed_at: string | null
  order_items: OrderItem[] | null
  payments: { amount: number; method: 'cash' | 'card' }[] | null
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>
}) {
  const params = await searchParams
  const range: DateRange =
    params.range && isValidDateRange(params.range) ? params.range : 'today'

  // Özel aralık paramları (start/end) geçerliyse preset'i ezer.
  const startParam = params.start
  const endParam = params.end
  const hasCustomDates =
    !!startParam &&
    !!endParam &&
    isValidDateParam(startParam) &&
    isValidDateParam(endParam)

  // Başlangıç bitişten büyükse sorgu çalıştırmadan uyarı gösterilecek.
  const invalidCustomOrder = hasCustomDates && startParam! > endParam!
  const useCustom = hasCustomDates && !invalidCustomOrder

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'manager') redirect('/pos')

  // Özel aralık geçerliyse onu, değilse preset aralığını kullan.
  const { start, end } = useCustom
    ? getCustomDateRange(startParam!, endParam!)
    : getDateRange(range)

  // Başlık etiketi: özel aralıkta seçilen tarihler, değilse preset adı.
  const rangeLabel = useCustom
    ? formatCustomRangeLabel(startParam!, endParam!)
    : DATE_RANGE_LABELS[range]

  // Geçersiz aralıkta (başlangıç > bitiş) sorgu çalıştırmayız.
  const { data: orders } = invalidCustomOrder
    ? { data: [] }
    : await supabase
        .from('orders')
        .select(
          `
      id,
      cashier_id,
      payment_method,
      closed_at,
      order_items (
        quantity,
        unit_price,
        product_id,
        products ( name )
      ),
      payments (
        amount,
        method
      )
    `
        )
        .eq('status', 'paid')
        .gte('closed_at', start)
        .lte('closed_at', end)

  const { data: cashiers } = await supabase
    .from('profiles')
    .select('id, full_name')

  const cashierNames: Record<string, string> = {}
  for (const c of cashiers || []) {
    cashierNames[c.id] = c.full_name
  }

  const ordersList = (orders || []) as OrderRow[]

  let totalRevenue = 0
  let cashRevenue = 0
  let cardRevenue = 0

  const productSales: Record<string, ProductStat> = {}
  const cashierStats: Record<string, CashierStat> = {}

  for (const order of ordersList) {
    let orderTotal = 0
    for (const item of order.order_items || []) {
      const lineTotal = Number(item.unit_price) * item.quantity
      orderTotal += lineTotal

      const productName = Array.isArray(item.products)
        ? item.products[0]?.name
        : item.products?.name

      if (productName) {
        if (productSales[item.product_id]) {
          productSales[item.product_id].quantity += item.quantity
        } else {
          productSales[item.product_id] = {
            name: productName,
            quantity: item.quantity,
          }
        }
      }
    }

    totalRevenue += orderTotal

    // Nakit/kart dağılımı artık payments tablosundan hesaplanır
    // (orders.payment_method legacy). Bir siparişin birden çok ödemesi olabilir.
    for (const payment of order.payments || []) {
      const amount = Number(payment.amount)
      if (payment.method === 'cash') cashRevenue += amount
      if (payment.method === 'card') cardRevenue += amount
    }

    const cashierName = cashierNames[order.cashier_id] || 'Bilinmeyen'
    if (cashierStats[order.cashier_id]) {
      cashierStats[order.cashier_id].orders += 1
      cashierStats[order.cashier_id].revenue += orderTotal
    } else {
      cashierStats[order.cashier_id] = {
        name: cashierName,
        orders: 1,
        revenue: orderTotal,
      }
    }
  }

  const orderCount = ordersList.length
  const averageOrder = orderCount > 0 ? totalRevenue / orderCount : 0

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  const cashierList = Object.values(cashierStats).sort(
    (a, b) => b.revenue - a.revenue
  )

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-primary mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
              POS'a Dön
            </Link>
            <h1 className="font-serif text-3xl font-bold text-brand-primary">
              Raporlar
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {rangeLabel} için satış özeti
            </p>
          </div>
          <RangeSelector
            current={range}
            customStart={startParam}
            customEnd={endParam}
          />
        </div>

        {invalidCustomOrder ? (
          <div className="bg-white rounded-2xl border border-brand-border p-10 text-center">
            <p className="text-neutral-500">
              Başlangıç tarihi bitiş tarihinden sonra olamaz. Lütfen aralığı
              düzeltin.
            </p>
          </div>
        ) : orderCount === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-10 text-center">
            <p className="text-neutral-500">
              Bu aralıkta kapanmış sipariş yok.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard
                icon={TrendingUp}
                label="Toplam Ciro"
                value={totalRevenue.toFixed(2) + ' ₺'}
              />
              <KpiCard
                icon={ShoppingBag}
                label="Sipariş Sayısı"
                value={orderCount.toString()}
              />
              <KpiCard
                icon={Receipt}
                label="Ortalama Sipariş"
                value={averageOrder.toFixed(2) + ' ₺'}
              />
              <KpiCard
                icon={Wallet}
                label="Nakit / Kart"
                value={cashRevenue.toFixed(0) + ' / ' + cardRevenue.toFixed(0) + ' ₺'}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
                <div className="px-6 py-4 border-b border-brand-border">
                  <h2 className="font-serif text-lg font-semibold text-brand-primary">
                    En Çok Satan Ürünler
                  </h2>
                </div>
                {topProducts.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-neutral-400">
                    Veri yok.
                  </p>
                ) : (
                  <ul className="divide-y divide-brand-border">
                    {topProducts.map((p, i) => (
                      <li
                        key={p.name}
                        className="flex items-center justify-between px-6 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-serif text-base font-bold text-brand-accent w-6">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium text-brand-primary">
                            {p.name}
                          </span>
                        </div>
                        <span className="text-sm text-neutral-500">
                          {p.quantity} adet
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
                <div className="px-6 py-4 border-b border-brand-border">
                  <h2 className="font-serif text-lg font-semibold text-brand-primary">
                    Kasiyer Performansı
                  </h2>
                </div>
                {cashierList.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-neutral-400">
                    Veri yok.
                  </p>
                ) : (
                  <ul className="divide-y divide-brand-border">
                    {cashierList.map((c) => (
                      <li
                        key={c.name}
                        className="flex items-center justify-between px-6 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-brand-primary">
                            {c.name}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {c.orders} sipariş
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-brand-primary">
                          {c.revenue.toFixed(2)} ₺
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-brand-accent" strokeWidth={1.75} />
        <p className="text-xs text-neutral-500 uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p className="text-2xl font-bold text-brand-primary">
        {value}
      </p>
    </div>
  )
}
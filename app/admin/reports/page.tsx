import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  DATE_RANGE_LABELS,
  getDateRange,
  isValidDateRange,
  type DateRange,
} from '@/lib/date-ranges'
import RangeSelector from './RangeSelector'

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
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const params = await searchParams
  const range: DateRange =
    params.range && isValidDateRange(params.range) ? params.range : 'today'

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

  const { start, end } = getDateRange(range)

  const { data: orders } = await supabase
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
    if (order.payment_method === 'cash') cashRevenue += orderTotal
    if (order.payment_method === 'card') cardRevenue += orderTotal

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
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block"
            >
              ← Yönetici Paneli
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Raporlar</h1>
            <p className="text-sm text-gray-500 mt-1">
              {DATE_RANGE_LABELS[range]} için satış özeti
            </p>
          </div>
          <RangeSelector current={range} />
        </div>

        {orderCount === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-gray-500">
              Bu aralıkta kapanmış sipariş yok.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard label="Toplam Ciro" value={totalRevenue.toFixed(2) + ' ₺'} />
              <KpiCard label="Sipariş Sayısı" value={orderCount.toString()} />
              <KpiCard label="Ortalama Sipariş" value={averageOrder.toFixed(2) + ' ₺'} />
              <KpiCard label="Nakit / Kart" value={cashRevenue.toFixed(0) + ' / ' + cardRevenue.toFixed(0) + ' ₺'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    En Çok Satan Ürünler
                  </h2>
                </div>
                {topProducts.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-gray-400">Veri yok.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {topProducts.map((p, i) => (
                      <li key={p.name} className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-400 w-5">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {p.name}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {p.quantity} adet
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Kasiyer Performansı
                  </h2>
                </div>
                {cashierList.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-gray-400">Veri yok.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {cashierList.map((c) => (
                      <li key={c.name} className="flex items-center justify-between px-6 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {c.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {c.orders} sipariş
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
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

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
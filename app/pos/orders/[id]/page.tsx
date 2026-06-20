export const dynamic = 'force-dynamic'

import BackToTablesLink from '../../BackToTablesLink'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderWorkspace from '../../OrderWorkspace'
import CancelEmptyOrderButton from '../../CancelEmptyOrderButton'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 5 bağımsız sorgu PARALEL (önceden sıralı waterfall'dı). Hiçbiri diğerinin
  // sonucunu beklemiyor: order_items zaten order_id = [id] ile çekiliyor,
  // categories/products siparişten bağımsız. İrlanda round-trip'i 5 kez yerine
  // ~1 kez ödenir. Çekilen veri/alan/filtre/sıralama birebir aynı.
  const [
    {
      data: { user },
    },
    { data: order },
    { data: items },
    { data: categories },
    { data: products },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('orders')
      .select(
        '*, tables(name, section), payments(id, amount, method, created_at)'
      )
      .eq('id', id)
      .single(),
    supabase
      .from('order_items')
      .select('id, quantity, unit_price, product_id, note, products(name)')
      .eq('order_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('categories')
      .select('*')
      .eq('is_available', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('display_order', { ascending: true }),
  ])

  // Kontroller paralel sonrasında: davranış aynı (giriş yoksa login, sipariş
  // yoksa/kapalıysa 404).
  if (!user) redirect('/login')
  if (!order || order.status !== 'open') notFound()

  const normalizedItems = (items || []).map((item) => {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products
    return {
      id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      product_id: item.product_id,
      note: item.note,
      products: product ?? null,
    }
  })

  // Şimdiye kadar alınan ödemeler (modal'daki "Kalan" + ödeme listesi için).
  type RawPayment = {
    id: string
    amount: number | string
    method: string
    created_at: string
  }
  const orderPayments: RawPayment[] = Array.isArray(order.payments)
    ? order.payments
    : []
  const normalizedPayments = orderPayments.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    method: p.method as 'cash' | 'card',
    created_at: p.created_at,
  }))

  const tableInfo = Array.isArray(order.tables) ? order.tables[0] : order.tables
  const isEmpty = normalizedItems.length === 0

  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-brand-border flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
           <BackToTablesLink orderId={id} isEmpty={isEmpty} />
            <div className="border-l border-brand-border pl-4">
              <h1 className="font-serif text-xl font-bold text-brand-primary">
                {tableInfo?.name || 'Masa'}
              </h1>
              {tableInfo?.section && (
                <p className="text-xs text-neutral-500">{tableInfo.section}</p>
              )}
            </div>
          </div>

          {isEmpty && <CancelEmptyOrderButton orderId={id} />}
        </div>
      </header>

      <OrderWorkspace
        orderId={id}
        items={normalizedItems}
        payments={normalizedPayments}
        categories={categories || []}
        products={products || []}
      />
    </main>
  )
}
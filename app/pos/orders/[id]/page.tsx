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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select('*, tables(name, section)')
    .eq('id', id)
    .single()

  if (!order || order.status !== 'open') notFound()

  const { data: items } = await supabase
    .from('order_items')
    .select('id, quantity, unit_price, product_id, note, products(name)')
    .eq('order_id', id)
    .order('created_at', { ascending: true })

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_available', true)
    .order('display_order', { ascending: true })

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .order('display_order', { ascending: true })

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
        categories={categories || []}
        products={products || []}
      />
    </main>
  )
}
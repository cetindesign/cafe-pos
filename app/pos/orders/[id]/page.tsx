import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MenuGrid from '../../MenuGrid'
import OrderSummary from '../../OrderSummary'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Sipariş bilgisini ve masa adını çek
  const { data: order } = await supabase
    .from('orders')
    .select('*, tables(name, section)')
    .eq('id', id)
    .single()

  if (!order || order.status !== 'open') {
    notFound()
  }

  // Sipariş kalemleri (ürün adıyla beraber)
  const { data: items } = await supabase
    .from('order_items')
    .select('id, quantity, unit_price, product_id, products(name)')
    .eq('order_id', id)
    .order('created_at', { ascending: true })

  // Menü verileri
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

  // Supabase select syntax bazen array, bazen single object dönüyor.
  // TypeScript'i memnun etmek için normalize edelim.
  const normalizedItems = (items || []).map((item) => {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products
    return {
      id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      product_id: item.product_id,
      products: product ?? null,
    }
  })

  const tableInfo = Array.isArray(order.tables) ? order.tables[0] : order.tables

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      {/* Üst bar */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/pos"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Masalar
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {tableInfo?.name || 'Masa'}
              </h1>
              {tableInfo?.section && (
                <p className="text-xs text-gray-500">{tableInfo.section}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* İki kolon: solda menü, sağda sipariş */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 min-h-0">
        <MenuGrid
          orderId={id}
          categories={categories || []}
          products={products || []}
        />
        <OrderSummary orderId={id} items={normalizedItems} />
      </div>
    </main>
  )
}
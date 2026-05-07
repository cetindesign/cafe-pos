import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Category, Product } from '@/lib/types/database'
import {
  toggleCategoryVisibility,
  toggleProductVisibility,
} from './actions'

export default async function MenuPage() {
  const supabase = await createClient()

  // Auth kontrolü
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

  // Kategorileri ve ürünleri çek
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('display_order', { ascending: true })

  const productsByCategory = (categories || []).map((category: Category) => ({
    ...category,
    products: (products || []).filter(
      (p: Product) => p.category_id === category.id
    ),
  }))

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block"
            >
              ← Yönetici Paneli
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Menü Yönetimi</h1>
          </div>
          <Link
            href="/admin/menu/new-category"
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            + Kategori Ekle
          </Link>
        </div>

        <div className="space-y-6">
          {productsByCategory.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <p className="text-gray-500">
                Henüz kategori yok. Başlamak için bir kategori ekleyin.
              </p>
            </div>
          )}

          {productsByCategory.map((category) => {
            const toggleThisCategory = toggleCategoryVisibility.bind(
              null,
              category.id,
              category.is_available
            )

            return (
              <div
                key={category.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Kategori başlığı */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {category.name}
                    {!category.is_available && (
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        (gizli)
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-3 text-sm">
                    <Link
                      href={`/admin/menu/categories/${category.id}/edit`}
                      className="text-gray-700 hover:text-gray-900"
                    >
                      Düzenle
                    </Link>
                    <form action={toggleThisCategory}>
                      <button
                        type="submit"
                        className="text-gray-700 hover:text-gray-900"
                      >
                        {category.is_available ? 'Gizle' : 'Göster'}
                      </button>
                    </form>
                    <Link
                      href={`/admin/menu/new-product?category=${category.id}`}
                      className="text-gray-900 font-medium"
                    >
                      + Ürün Ekle
                    </Link>
                  </div>
                </div>

                {/* Ürün listesi */}
                {category.products.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-gray-400">
                    Bu kategoride henüz ürün yok.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {category.products.map((product) => {
                      const toggleThisProduct = toggleProductVisibility.bind(
                        null,
                        product.id,
                        product.is_available
                      )

                      return (
                        <li
                          key={product.id}
                          className="flex items-center justify-between px-6 py-4"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {product.name}
                              {!product.is_available && (
                                <span className="ml-2 text-xs text-gray-400 font-normal">
                                  (gizli)
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {Number(product.price).toFixed(2)} ₺
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Link
                              href={`/admin/menu/products/${product.id}/edit`}
                              className="text-gray-700 hover:text-gray-900"
                            >
                              Düzenle
                            </Link>
                            <form action={toggleThisProduct}>
                              <button
                                type="submit"
                                className="text-gray-700 hover:text-gray-900"
                              >
                                {product.is_available ? 'Gizle' : 'Göster'}
                              </button>
                            </form>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
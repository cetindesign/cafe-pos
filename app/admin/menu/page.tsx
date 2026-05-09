import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Category, Product } from '@/lib/types/database'
import {
  toggleCategoryVisibility,
  toggleProductVisibility,
} from './actions'
import { ArrowLeft, Plus, Pencil, EyeOff, Eye } from 'lucide-react'

export default async function MenuPage() {
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
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-primary mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
              POS'a Dön
            </Link>
            <h1 className="font-serif text-3xl font-bold text-brand-primary">
              Menü Yönetimi
            </h1>
          </div>
          <Link
            href="/admin/menu/new-category"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Kategori Ekle
          </Link>
        </div>

        <div className="space-y-4">
          {productsByCategory.length === 0 && (
            <div className="bg-white rounded-2xl border border-brand-border p-10 text-center">
              <p className="text-neutral-500">
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
                className="bg-white rounded-2xl border border-brand-border overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
                  <h2 className="font-serif text-xl font-semibold text-brand-primary">
                    {category.name}
                    {!category.is_available && (
                      <span className="ml-2 text-xs text-neutral-400 font-sans font-normal">
                        (gizli)
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/menu/categories/${category.id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-brand-muted transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Düzenle
                    </Link>
                    <form action={toggleThisCategory}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-brand-muted transition-colors"
                      >
                        {category.is_available ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} />
                            Gizle
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                            Göster
                          </>
                        )}
                      </button>
                    </form>
                    <Link
                      href={`/admin/menu/new-product?category=${category.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-muted px-3 py-1.5 text-xs font-medium text-brand-primary hover:bg-brand-border transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                      Ürün
                    </Link>
                  </div>
                </div>

                {category.products.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-neutral-400">
                    Bu kategoride henüz ürün yok.
                  </p>
                ) : (
                  <ul className="divide-y divide-brand-border">
                    {category.products.map((product) => {
                      const toggleThisProduct = toggleProductVisibility.bind(
                        null,
                        product.id,
                        product.is_available
                      )

                      return (
                        <li
                          key={product.id}
                          className="flex items-center justify-between px-6 py-3"
                        >
                          <div>
                            <p className="font-medium text-brand-primary">
                              {product.name}
                              {!product.is_available && (
                                <span className="ml-2 text-xs text-neutral-400 font-normal">
                                  (gizli)
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-neutral-500">
                              {Number(product.price).toFixed(2)} ₺
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/admin/menu/products/${product.id}/edit`}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-brand-muted transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                              Düzenle
                            </Link>
                            <form action={toggleThisProduct}>
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-brand-muted transition-colors"
                              >
                                {product.is_available ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} />
                                    Gizle
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                                    Göster
                                  </>
                                )}
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
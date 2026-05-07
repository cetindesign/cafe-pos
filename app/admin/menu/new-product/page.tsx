    import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createProduct } from '../actions'
import type { Category } from '@/lib/types/database'

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category: preselectedCategoryId } = await searchParams
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

  // Kategorileri çek (dropdown için)
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  if (!categories || categories.length === 0) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-md mx-auto">
          <Link
            href="/admin/menu"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            ← Menü Yönetimi
          </Link>
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Önce kategori ekleyin
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Ürün ekleyebilmek için en az bir kategori olmalı.
            </p>
            <Link
              href="/admin/menu/new-category"
              className="inline-block rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Kategori Ekle
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto">
        <Link
          href="/admin/menu"
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
        >
          ← Menü Yönetimi
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Yeni Ürün</h1>

          <form action={createProduct} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Ürün Adı
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoFocus
                placeholder="Örn. Espresso"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="category_id"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Kategori
              </label>
              <select
                id="category_id"
                name="category_id"
                required
                defaultValue={preselectedCategoryId || ''}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
              >
                <option value="" disabled>
                  Kategori seçin
                </option>
                {categories.map((cat: Category) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Fiyat (₺)
              </label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="65.00"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href="/admin/menu"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
              >
                İptal
              </Link>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                Ürün Ekle
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
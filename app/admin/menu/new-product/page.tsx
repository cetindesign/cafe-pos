import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createProduct } from '../actions'
import type { Category } from '@/lib/types/database'
import { ArrowLeft } from 'lucide-react'

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category: preselectedCategoryId } = await searchParams
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

  if (!categories || categories.length === 0) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-md mx-auto">
          <Link
            href="/admin/menu"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            Menü Yönetimi
          </Link>
          <div className="bg-white rounded-2xl border border-brand-border p-8 text-center">
            <h1 className="font-serif text-xl font-semibold text-brand-primary mb-2">
              Önce kategori ekleyin
            </h1>
            <p className="text-sm text-neutral-500 mb-6">
              Ürün ekleyebilmek için en az bir kategori olmalı.
            </p>
            <Link
              href="/admin/menu/new-category"
              className="inline-block rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
            >
              Kategori Ekle
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-md mx-auto">
        <Link
          href="/admin/menu"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-primary mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Menü Yönetimi
        </Link>

        <div className="bg-white rounded-2xl border border-brand-border p-8">
          <h1 className="font-serif text-2xl font-bold text-brand-primary mb-6">
            Yeni Ürün
          </h1>

          <form action={createProduct} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-brand-primary mb-1.5"
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
                className="w-full rounded-lg border border-brand-border px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label
                htmlFor="category_id"
                className="block text-sm font-medium text-brand-primary mb-1.5"
              >
                Kategori
              </label>
              <select
                id="category_id"
                name="category_id"
                required
                defaultValue={preselectedCategoryId || ''}
                className="w-full rounded-lg border border-brand-border px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow"
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
                className="block text-sm font-medium text-brand-primary mb-1.5"
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
                className="w-full rounded-lg border border-brand-border px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href="/admin/menu"
                className="flex-1 rounded-lg border border-brand-border px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-brand-muted transition-colors text-center"
              >
                İptal
              </Link>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
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
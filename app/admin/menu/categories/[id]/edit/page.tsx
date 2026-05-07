import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateCategory } from '../../../actions'

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  // Kategoriyi çek
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (!category) {
    notFound()
  }

  // Server Action'ı bu kategori için "bağla"
  const updateThisCategory = updateCategory.bind(null, id)

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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Kategoriyi Düzenle
          </h1>

          <form action={updateThisCategory} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Kategori Adı
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={category.name}
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
                Kaydet
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
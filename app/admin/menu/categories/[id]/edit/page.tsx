import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateCategory } from '../../../actions'
import { ArrowLeft } from 'lucide-react'

export default async function EditCategoryPage({
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'manager') redirect('/pos')

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (!category) notFound()

  const updateThisCategory = updateCategory.bind(null, id)

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
            Kategoriyi Düzenle
          </h1>

          <form action={updateThisCategory} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-brand-primary mb-1.5"
              >
                Kategori Adı
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={category.name}
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
                Kaydet
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
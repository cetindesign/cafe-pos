import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateTable } from '../../actions'

export default async function EditTablePage({
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

  const { data: table } = await supabase
    .from('tables')
    .select('*')
    .eq('id', id)
    .single()

  if (!table) {
    notFound()
  }

  // Mevcut bölgeleri çek
  const { data: existingTables } = await supabase
    .from('tables')
    .select('section')

  const uniqueSections = Array.from(
    new Set((existingTables || []).map((t) => t.section))
  ).sort()

  const updateThisTable = updateTable.bind(null, id)

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto">
        <Link
          href="/admin/tables"
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
        >
          ← Masa Yönetimi
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Masayı Düzenle
          </h1>

          <form action={updateThisTable} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Masa Adı
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={table.name}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="section"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Bölge
              </label>
              <input
                id="section"
                name="section"
                type="text"
                list="sections-list"
                defaultValue={table.section}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <datalist id="sections-list">
                {uniqueSections.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href="/admin/tables"
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
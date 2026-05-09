import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Table } from '@/lib/types/database'
import { toggleTableActive } from './actions'

export default async function TablesPage() {
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

  // Masaları çek, section ve display_order'a göre sırala
  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .order('section', { ascending: true })
    .order('display_order', { ascending: true })

  // Section'a göre grupla
  const tablesBySection = (tables || []).reduce<Record<string, Table[]>>(
    (acc, table) => {
      if (!acc[table.section]) {
        acc[table.section] = []
      }
      acc[table.section].push(table)
      return acc
    },
    {}
  )

  const sections = Object.keys(tablesBySection)

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
            <h1 className="text-3xl font-bold text-gray-900">Masa Yönetimi</h1>
          </div>
          <Link
            href="/admin/tables/new"
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            + Masa Ekle
          </Link>
        </div>

        {sections.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-gray-500">
              Henüz masa yok. Başlamak için bir masa ekleyin.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <div
                key={section}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {section}
                    <span className="ml-2 text-sm text-gray-400 font-normal">
                      ({tablesBySection[section].length} masa)
                    </span>
                  </h2>
                </div>

                <ul className="divide-y divide-gray-100">
                  {tablesBySection[section].map((table) => {
                    const toggleThisTable = toggleTableActive.bind(
                      null,
                      table.id,
                      table.is_active
                    )

                    return (
                      <li
                        key={table.id}
                        className="flex items-center justify-between px-6 py-4"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {table.name}
                            {!table.is_active && (
                              <span className="ml-2 text-xs text-gray-400 font-normal">
                                (pasif)
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Link
                            href={`/admin/tables/${table.id}/edit`}
                            className="text-gray-700 hover:text-gray-900"
                          >
                            Düzenle
                          </Link>
                          <form action={toggleThisTable}>
                            <button
                              type="submit"
                              className="text-gray-700 hover:text-gray-900"
                            >
                              {table.is_active
                                ? 'Pasifleştir'
                                : 'Aktifleştir'}
                            </button>
                          </form>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
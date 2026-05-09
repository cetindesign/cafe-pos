import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Table } from '@/lib/types/database'
import { toggleTableActive } from './actions'
import { ArrowLeft, Plus, Pencil, EyeOff, Eye } from 'lucide-react'

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

  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .order('section', { ascending: true })
    .order('display_order', { ascending: true })

  const tablesBySection = (tables || []).reduce<Record<string, Table[]>>(
    (acc, table) => {
      if (!acc[table.section]) acc[table.section] = []
      acc[table.section].push(table)
      return acc
    },
    {}
  )

  const sections = Object.keys(tablesBySection)

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
              Masa Yönetimi
            </h1>
          </div>
          <Link
            href="/admin/tables/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Masa Ekle
          </Link>
        </div>

        {sections.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-10 text-center">
            <p className="text-neutral-500">
              Henüz masa yok. Başlamak için bir masa ekleyin.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <div
                key={section}
                className="bg-white rounded-2xl border border-brand-border overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-brand-border">
                  <h2 className="font-serif text-xl font-semibold text-brand-primary">
                    {section}
                    <span className="ml-2 text-sm text-neutral-400 font-sans font-normal">
                      ({tablesBySection[section].length} masa)
                    </span>
                  </h2>
                </div>

                <ul className="divide-y divide-brand-border">
                  {tablesBySection[section].map((table) => {
                    const toggleThisTable = toggleTableActive.bind(
                      null,
                      table.id,
                      table.is_active
                    )

                    return (
                      <li
                        key={table.id}
                        className="flex items-center justify-between px-6 py-3"
                      >
                        <p className="font-medium text-brand-primary">
                          {table.name}
                          {!table.is_active && (
                            <span className="ml-2 text-xs text-neutral-400 font-normal">
                              (pasif)
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/tables/${table.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-brand-muted transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                            Düzenle
                          </Link>
                          <form action={toggleThisTable}>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-brand-muted transition-colors"
                            >
                              {table.is_active ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} />
                                  Pasifleştir
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                                  Aktifleştir
                                </>
                              )}
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
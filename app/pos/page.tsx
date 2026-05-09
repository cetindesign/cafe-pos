import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../actions'
import type { Table } from '@/lib/types/database'
import OpenTableButton from './OpenTableButton'

export default async function PosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Aktif masaları çek
  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .eq('is_active', true)
    .order('section', { ascending: true })
    .order('display_order', { ascending: true })

  // Açık siparişleri çek (table_id'si olanlar)
  const { data: openOrders } = await supabase
    .from('orders')
    .select('id, table_id')
    .eq('status', 'open')

  const openOrdersByTable = new Map(
    (openOrders || []).map((o) => [o.table_id, o.id])
  )

  // Masaları bölgelere göre grupla
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
    <main className="min-h-screen bg-gray-100">
      {/* Üst bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">POS</h1>
            <p className="text-xs text-gray-500">
              {profile.full_name} •{' '}
              {profile.role === 'manager' ? 'Yönetici' : 'Kasiyer'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {profile.role === 'manager' && (
              <Link
                href="/admin"
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Yönetici Paneli
              </Link>
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* İçerik */}
      <div className="max-w-7xl mx-auto p-6">
        {sections.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-gray-500">
              Henüz aktif masa yok. Yöneticiden masa eklemesini isteyin.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {section}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {tablesBySection[section].map((table) => {
                    const openOrderId = openOrdersByTable.get(table.id)
                    const isOccupied = !!openOrderId

                    return (
                      <OpenTableButton
                        key={table.id}
                        tableId={table.id}
                        tableName={table.name}
                        existingOrderId={openOrderId}
                        isOccupied={isOccupied}
                      />
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
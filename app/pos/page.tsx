import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../actions'
import type { Table } from '@/lib/types/database'
import OpenTableButton from './OpenTableButton'
import { Coffee, LogOut } from 'lucide-react'
import SettingsMenu from './SettingsMenu'

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

  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .eq('is_active', true)
    .order('section', { ascending: true })
    .order('display_order', { ascending: true })

  const { data: openOrders } = await supabase
    .from('orders')
    .select('id, table_id')
    .eq('status', 'open')

  const openOrdersByTable = new Map(
    (openOrders || []).map((o) => [o.table_id, o.id])
  )

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
    <main className="min-h-screen">
      <header className="bg-white border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary text-brand-accent">
              <Coffee className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-brand-primary">
                Cafe POS
              </h1>
              <p className="text-xs text-neutral-500">
                {profile.full_name} •{' '}
                {profile.role === 'manager' ? 'Yönetici' : 'Kasiyer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile.role === 'manager' && <SettingsMenu />}
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-brand-muted transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {sections.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-10 text-center">
            <p className="text-neutral-500">
              Henüz aktif masa yok. Yöneticiden masa eklemesini isteyin.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section}>
                <h2 className="font-serif text-xl font-bold text-brand-primary mb-4">
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
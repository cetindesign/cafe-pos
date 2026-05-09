import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createTable } from '../actions'
import { ArrowLeft } from 'lucide-react'

export default async function NewTablePage() {
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

  const { data: existingTables } = await supabase
    .from('tables')
    .select('section')

  const uniqueSections = Array.from(
    new Set((existingTables || []).map((t) => t.section))
  ).sort()

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-md mx-auto">
        <Link
          href="/admin/tables"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-primary mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Masa Yönetimi
        </Link>

        <div className="bg-white rounded-2xl border border-brand-border p-8">
          <h1 className="font-serif text-2xl font-bold text-brand-primary mb-6">
            Yeni Masa
          </h1>

          <form action={createTable} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-brand-primary mb-1.5"
              >
                Masa Adı
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoFocus
                placeholder="Örn. Sehpa, Sağ 1"
                className="w-full rounded-lg border border-brand-border px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label
                htmlFor="section"
                className="block text-sm font-medium text-brand-primary mb-1.5"
              >
                Bölge
              </label>
              <input
                id="section"
                name="section"
                type="text"
                list="sections-list"
                placeholder="Örn. Salon, Bahçe"
                defaultValue=""
                className="w-full rounded-lg border border-brand-border px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow"
              />
              <datalist id="sections-list">
                {uniqueSections.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <p className="mt-1.5 text-xs text-neutral-500">
                Boş bırakılırsa &ldquo;Genel&rdquo; olarak kaydedilir.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href="/admin/tables"
                className="flex-1 rounded-lg border border-brand-border px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-brand-muted transition-colors text-center"
              >
                İptal
              </Link>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
              >
                Masa Ekle
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
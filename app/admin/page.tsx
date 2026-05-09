import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../actions'
import { Coffee, BookOpen, LayoutGrid, BarChart3, LogOut } from 'lucide-react'

export default async function AdminPage() {
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

  if (!profile || profile.role !== 'manager') redirect('/pos')

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-primary text-brand-accent mb-4">
            <Coffee className="w-7 h-7" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-4xl font-bold text-brand-primary">
            Yönetici Paneli
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Hoş geldin,{' '}
            <span className="font-medium text-brand-primary">
              {profile.full_name}
            </span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm">
          <nav className="space-y-2">
            <NavLink href="/admin/menu" icon={BookOpen}>
              Menü Yönetimi
            </NavLink>
            <NavLink href="/admin/tables" icon={LayoutGrid}>
              Masa Yönetimi
            </NavLink>
            <NavLink href="/admin/reports" icon={BarChart3}>
              Raporlar
            </NavLink>
          </nav>

          <div className="border-t border-brand-border mt-4 pt-4">
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-3 w-full rounded-lg px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-brand-muted transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                Çıkış Yap
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-brand-primary hover:bg-brand-muted transition-colors"
    >
      <Icon className="w-5 h-5 text-brand-accent" strokeWidth={1.75} />
      {children}
    </Link>
  )
}
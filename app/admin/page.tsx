import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../actions'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'manager') {
    redirect('/pos')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Yönetici Paneli
        </h1>
        <p className="text-gray-600 mb-1">Hoş geldin,</p>
        <p className="text-lg font-medium text-gray-900 mb-8">
          {profile.full_name}
        </p>

        <div className="space-y-3 mb-8">
          <Link
            href="/admin/menu"
            className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Menü Yönetimi
          </Link>
          <Link
            href="/admin/tables"
            className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Masa Yönetimi
          </Link>
          <Link
            href="/admin/reports"
            className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Raporlar
          </Link>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Çıkış Yap
          </button>
        </form>
      </div>
    </main>
  )
}
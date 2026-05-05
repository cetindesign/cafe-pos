import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../actions'

export default async function PosPage() {
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

  if (!profile) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">POS Ekranı</h1>
        <p className="text-gray-600 mb-1">Hoş geldin,</p>
        <p className="text-lg font-medium text-gray-900 mb-1">
          {profile.full_name}
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Rol: {profile.role === 'manager' ? 'Yönetici' : 'Kasiyer'}
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Sprint 3&apos;te sipariş alma ekranı burada olacak.
        </p>

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
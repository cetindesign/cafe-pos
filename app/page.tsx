import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  // Oturum durumunu kontrol et
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Giriş yapmamışsa login sayfasına gönder
  if (!user) {
    redirect('/login')
  }

  // Profil bilgisini çek (rolü öğrenmek için)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <h1 className="text-xl font-semibold text-red-600 mb-2">
            Profil bulunamadı
          </h1>
          <p className="text-sm text-gray-600">
            Bu kullanıcı için profil oluşturulmamış. Yöneticinizle iletişime geçin.
          </p>
        </div>
      </main>
    )
  }

  // Role göre yönlendir
  if (profile.role === 'manager') {
    redirect('/admin')
  }

  if (profile.role === 'cashier') {
    redirect('/pos')
  }

  return null
}
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getSession()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Cafe POS</h1>
      <p className="text-lg text-gray-600 mb-8">Sprint 0 — Bağlantı Testi</p>

      <div className="bg-gray-100 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-3">Supabase Durumu</h2>
        {error ? (
          <p className="text-red-600">Hata: {error.message}</p>
        ) : (
          <p className="text-green-600">
            ✓ Supabase bağlantısı başarılı. Henüz oturum açılmamış.
          </p>
        )}
      </div>
    </main>
  )
}
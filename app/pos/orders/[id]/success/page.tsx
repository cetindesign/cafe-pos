import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string; total?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const method = params.method === 'card' ? 'Kart' : 'Nakit'
  const total = params.total || '0.00'

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Ödeme Alındı
        </h1>
        <p className="text-gray-500 mb-8">Hesap başarıyla kapatıldı.</p>

        <div className="bg-gray-50 rounded-xl p-5 mb-8 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Toplam</span>
            <span className="text-lg font-bold text-gray-900">{total} ₺</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Ödeme Yöntemi</span>
            <span className="text-sm font-medium text-gray-900">{method}</span>
          </div>
        </div>

        <Link
          href="/pos"
          className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Masalara Dön
        </Link>
      </div>
    </main>
  )
}
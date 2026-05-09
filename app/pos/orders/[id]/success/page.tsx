import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle2 } from 'lucide-react'

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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-brand-border p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-9 h-9 text-brand-accent" strokeWidth={1.5} />
        </div>

        <h1 className="font-serif text-3xl font-bold text-brand-primary mb-2">
          Ödeme Alındı
        </h1>
        <p className="text-neutral-500 mb-8">Hesap başarıyla kapatıldı.</p>

        <div className="bg-brand-muted rounded-xl p-5 mb-8 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-500">Toplam</span>
            <span className="font-serif text-xl font-bold text-brand-primary">
              {total} ₺
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-500">Ödeme Yöntemi</span>
            <span className="text-sm font-medium text-brand-primary">
              {method}
            </span>
          </div>
        </div>

        <Link
          href="/pos"
          className="block w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          Masalara Dön
        </Link>
      </div>
    </main>
  )
}
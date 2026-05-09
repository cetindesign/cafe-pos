'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Coffee } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg('E-posta veya şifre hatalı. Lütfen tekrar deneyin.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-primary text-brand-accent mb-4">
            <Coffee className="w-7 h-7" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-4xl font-bold text-brand-primary">
            OZ COFFEE SHELTER
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Devam etmek için giriş yapın
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-brand-border p-8 shadow-sm">
          {errorMsg && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-brand-primary mb-1.5"
              >
                E-posta
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-brand-border px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow"
                placeholder="ornek@cafe.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-brand-primary mb-1.5"
              >
                Şifre
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-brand-border px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-primary px-4 py-3 text-base font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
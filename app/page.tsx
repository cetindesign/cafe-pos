import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Profil yoksa login'e gönder (auth var ama profile yok edge case)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Herkes (yönetici dahil) doğrudan POS'a düşer
  // Yönetici ek menülere POS header'ından erişir
  redirect('/pos')
}
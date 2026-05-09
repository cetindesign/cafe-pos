'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function assertManager() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'manager') {
    redirect('/pos')
  }

  return supabase
}

export async function createTable(formData: FormData) {
  const supabase = await assertManager()

  const name = formData.get('name')?.toString().trim()
  const section = formData.get('section')?.toString().trim() || 'Genel'

  if (!name) {
    throw new Error('Masa adı boş bırakılamaz.')
  }

  const { error } = await supabase.from('tables').insert({ name, section })

  if (error) {
    throw new Error('Masa eklenirken bir hata oluştu.')
  }

  revalidatePath('/admin/tables')
  redirect('/admin/tables')
}

export async function updateTable(tableId: string, formData: FormData) {
  const supabase = await assertManager()

  const name = formData.get('name')?.toString().trim()
  const section = formData.get('section')?.toString().trim() || 'Genel'

  if (!name) {
    throw new Error('Masa adı boş bırakılamaz.')
  }

  const { error } = await supabase
    .from('tables')
    .update({ name, section })
    .eq('id', tableId)

  if (error) {
    throw new Error('Masa güncellenirken bir hata oluştu.')
  }

  revalidatePath('/admin/tables')
  redirect('/admin/tables')
}

export async function toggleTableActive(tableId: string, isActive: boolean) {
  const supabase = await assertManager()

  const { error } = await supabase
    .from('tables')
    .update({ is_active: !isActive })
    .eq('id', tableId)

  if (error) {
    throw new Error('Durum güncellenemedi.')
  }

  revalidatePath('/admin/tables')
}
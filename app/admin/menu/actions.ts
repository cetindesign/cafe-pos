'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Yardımcı: kullanıcının yönetici olduğunu doğrula
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

// ============= KATEGORİ İŞLEMLERİ =============

export async function createCategory(formData: FormData) {
  const supabase = await assertManager()

  const name = formData.get('name')?.toString().trim()

  if (!name) {
    throw new Error('Kategori adı boş bırakılamaz.')
  }

  const { error } = await supabase.from('categories').insert({ name })

  if (error) {
    throw new Error('Kategori eklenirken bir hata oluştu.')
  }

  revalidatePath('/admin/menu')
  redirect('/admin/menu')
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const supabase = await assertManager()

  const name = formData.get('name')?.toString().trim()

  if (!name) {
    throw new Error('Kategori adı boş bırakılamaz.')
  }

  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', categoryId)

  if (error) {
    throw new Error('Kategori güncellenirken bir hata oluştu.')
  }

  revalidatePath('/admin/menu')
  redirect('/admin/menu')
}

export async function toggleCategoryVisibility(
  categoryId: string,
  isAvailable: boolean
) {
  const supabase = await assertManager()

  const { error } = await supabase
    .from('categories')
    .update({ is_available: !isAvailable })
    .eq('id', categoryId)

  if (error) {
    throw new Error('Görünürlük güncellenemedi.')
  }

  revalidatePath('/admin/menu')
}

// ============= ÜRÜN İŞLEMLERİ =============

export async function createProduct(formData: FormData) {
  const supabase = await assertManager()

  const name = formData.get('name')?.toString().trim()
  const categoryId = formData.get('category_id')?.toString()
  const priceStr = formData.get('price')?.toString()

  if (!name || !categoryId || !priceStr) {
    throw new Error('Tüm alanlar zorunludur.')
  }

  const price = parseFloat(priceStr)
  if (isNaN(price) || price < 0) {
    throw new Error('Geçerli bir fiyat girin.')
  }

  const { error } = await supabase.from('products').insert({
    name,
    category_id: categoryId,
    price,
  })

  if (error) {
    throw new Error('Ürün eklenirken bir hata oluştu.')
  }

  revalidatePath('/admin/menu')
  redirect('/admin/menu')
}

export async function updateProduct(productId: string, formData: FormData) {
  const supabase = await assertManager()

  const name = formData.get('name')?.toString().trim()
  const categoryId = formData.get('category_id')?.toString()
  const priceStr = formData.get('price')?.toString()

  if (!name || !categoryId || !priceStr) {
    throw new Error('Tüm alanlar zorunludur.')
  }

  const price = parseFloat(priceStr)
  if (isNaN(price) || price < 0) {
    throw new Error('Geçerli bir fiyat girin.')
  }

  const { error } = await supabase
    .from('products')
    .update({ name, category_id: categoryId, price })
    .eq('id', productId)

  if (error) {
    throw new Error('Ürün güncellenirken bir hata oluştu.')
  }

  revalidatePath('/admin/menu')
  redirect('/admin/menu')
}

export async function toggleProductVisibility(
  productId: string,
  isAvailable: boolean
) {
  const supabase = await assertManager()

  const { error } = await supabase
    .from('products')
    .update({ is_available: !isAvailable })
    .eq('id', productId)

  if (error) {
    throw new Error('Görünürlük güncellenemedi.')
  }

  revalidatePath('/admin/menu')
}
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Yardımcı: kullanıcının giriş yaptığını doğrula
async function assertAuthenticated() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return { supabase, user }
}

/**
 * Bir masa için sipariş açar veya mevcut açık siparişi döner.
 * Kullanıcı masaya tıkladığında çağrılır.
 */
export async function getOrCreateOrderForTable(tableId: string) {
  const { supabase, user } = await assertAuthenticated()

  // Önce o masada açık sipariş var mı bak
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('table_id', tableId)
    .eq('status', 'open')
    .maybeSingle()

  if (existing) {
    return { orderId: existing.id }
  }

  // Yoksa yeni sipariş aç
  const { data: newOrder, error } = await supabase
    .from('orders')
    .insert({
      table_id: tableId,
      cashier_id: user.id,
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !newOrder) {
    throw new Error('Sipariş oluşturulamadı.')
  }

  return { orderId: newOrder.id }
}

/**
 * Bir siparişe ürün ekler veya zaten varsa miktarını artırır.
 */
export async function addProductToOrder(orderId: string, productId: string) {
  const { supabase } = await assertAuthenticated()

  // Bu üründen zaten kalem var mı?
  const { data: existing } = await supabase
    .from('order_items')
    .select('id, quantity')
    .eq('order_id', orderId)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    // Mevcut kalemin miktarını artır
    const { error } = await supabase
      .from('order_items')
      .update({ quantity: existing.quantity + 1 })
      .eq('id', existing.id)

    if (error) {
      throw new Error('Miktar güncellenemedi.')
    }
  } else {
    // Yeni kalem ekle, ürünün anlık fiyatını al
    const { data: product } = await supabase
      .from('products')
      .select('price')
      .eq('id', productId)
      .single()

    if (!product) {
      throw new Error('Ürün bulunamadı.')
    }

    const { error } = await supabase.from('order_items').insert({
      order_id: orderId,
      product_id: productId,
      quantity: 1,
      unit_price: product.price,
    })

    if (error) {
      throw new Error('Ürün eklenemedi.')
    }
  }

  revalidatePath(`/pos/orders/${orderId}`)
}

/**
 * Bir kalemin miktarını artırır.
 */
export async function increaseItemQuantity(itemId: string, orderId: string) {
  const { supabase } = await assertAuthenticated()

  const { data: item } = await supabase
    .from('order_items')
    .select('quantity')
    .eq('id', itemId)
    .single()

  if (!item) {
    throw new Error('Kalem bulunamadı.')
  }

  const { error } = await supabase
    .from('order_items')
    .update({ quantity: item.quantity + 1 })
    .eq('id', itemId)

  if (error) {
    throw new Error('Miktar güncellenemedi.')
  }

  revalidatePath(`/pos/orders/${orderId}`)
}

/**
 * Bir kalemin miktarını azaltır. 1'e düşerse tamamen siler.
 */
export async function decreaseItemQuantity(itemId: string, orderId: string) {
  const { supabase } = await assertAuthenticated()

  const { data: item } = await supabase
    .from('order_items')
    .select('quantity')
    .eq('id', itemId)
    .single()

  if (!item) {
    throw new Error('Kalem bulunamadı.')
  }

  if (item.quantity <= 1) {
    // 1'deyse tamamen sil
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      throw new Error('Kalem silinemedi.')
    }
  } else {
    const { error } = await supabase
      .from('order_items')
      .update({ quantity: item.quantity - 1 })
      .eq('id', itemId)

    if (error) {
      throw new Error('Miktar güncellenemedi.')
    }
  }

  revalidatePath(`/pos/orders/${orderId}`)
}

/**
 * Bir kalemi tamamen siler (çarpı butonu için).
 */
export async function removeItem(itemId: string, orderId: string) {
  const { supabase } = await assertAuthenticated()

  const { error } = await supabase
    .from('order_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    throw new Error('Kalem silinemedi.')
  }

  revalidatePath(`/pos/orders/${orderId}`)
}
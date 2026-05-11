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
 */
export async function getOrCreateOrderForTable(tableId: string) {
  const { supabase, user } = await assertAuthenticated()

  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('table_id', tableId)
    .eq('status', 'open')
    .maybeSingle()

  if (existing) {
    return { orderId: existing.id }
  }

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

  const { data: existing } = await supabase
    .from('order_items')
    .select('id, quantity')
    .eq('order_id', orderId)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('order_items')
      .update({ quantity: existing.quantity + 1 })
      .eq('id', existing.id)

    if (error) {
      throw new Error('Miktar güncellenemedi.')
    }
  } else {
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
 * Bir kalemi tamamen siler.
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

/**
 * Bir siparişi kapatır (ödendi durumuna geçirir).
 * Boş sipariş kapatılamaz.
 */
export async function closeOrder(
  orderId: string,
  paymentMethod: 'cash' | 'card'
) {
  const { supabase } = await assertAuthenticated()

  // Sipariş hâlâ açık mı kontrol et
  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single()

  if (!order) {
    throw new Error('Sipariş bulunamadı.')
  }

  if (order.status !== 'open') {
    throw new Error('Bu sipariş zaten kapatılmış.')
  }

  // Sipariş kalemleri var mı?
  const { count } = await supabase
    .from('order_items')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId)

  if (!count || count === 0) {
    throw new Error('Boş sipariş kapatılamaz. Önce ürün ekleyin.')
  }

  // Kapat
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_method: paymentMethod,
      closed_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    throw new Error('Sipariş kapatılamadı.')
  }

  revalidatePath('/pos')
  revalidatePath(`/pos/orders/${orderId}`)
}

/**
 * Bir siparişi iptal eder (sadece içinde kalem yoksa).
 * Yanlış masaya tıklama senaryosu için.
 */
export async function cancelEmptyOrder(orderId: string) {
  const { supabase } = await assertAuthenticated()

  // Kalem var mı kontrol et
  const { count } = await supabase
    .from('order_items')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId)

  if (count && count > 0) {
    throw new Error('Bu sipariş boş değil, iptal edilemez.')
  }

  const { error } = await supabase.from('orders').delete().eq('id', orderId)

  if (error) {
    throw new Error('Sipariş iptal edilemedi.')
  }

  revalidatePath('/pos')
}
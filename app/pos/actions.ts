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
 * Bir masanın adını günceller. Sadece isim değişir; section'a dokunulmaz.
 * Yetki (yalnızca manager yazabilir) kontrolü RLS tarafından yapılır.
 */
export async function renameTable(tableId: string, newName: string) {
  const { supabase } = await assertAuthenticated()

  const trimmed = newName.trim()
  if (!trimmed) {
    throw new Error('Masa adı boş olamaz.')
  }

  const { error } = await supabase
    .from('tables')
    .update({ name: trimmed })
    .eq('id', tableId)

  if (error) {
    throw new Error('Masa adı güncellenemedi.')
  }

  revalidatePath('/pos')
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
 * Bir kalemin notunu günceller. Boş not NULL'a çekilir (not temizlenir).
 * Yetki kontrolü RLS tarafından yapılır.
 */
export async function setItemNote(
  itemId: string,
  orderId: string,
  note: string
) {
  const { supabase } = await assertAuthenticated()

  const trimmed = note.trim()
  const value = trimmed === '' ? null : trimmed

  const { error } = await supabase
    .from('order_items')
    .update({ note: value })
    .eq('id', itemId)

  if (error) {
    throw new Error('Not kaydedilemedi.')
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
 * Bir siparişi atomik olarak kapatır ve ödemeleri payments tablosuna yazar.
 * Tüm doğrulama (ödemeler toplamı = hesap tutarı, zaten kapalı mı, boş mu)
 * close_order_with_payments RPC'si tarafından sunucuda yapılır; geçersizse
 * exception fırlatır. payment_method (legacy) artık burada set edilmez.
 */
export async function closeOrder(
  orderId: string,
  payments: { method: 'cash' | 'card'; amount: number }[]
) {
  const { supabase } = await assertAuthenticated()

  const { error } = await supabase.rpc('close_order_with_payments', {
    p_order_id: orderId,
    p_payments: payments,
  })

  if (error) {
    // RPC exception'ını kullanıcıya gösterilebilir nazik bir mesaja çevir.
    const message = error.message || ''
    if (message.includes('already') || message.includes('zaten')) {
      throw new Error('Bu sipariş zaten kapatılmış.')
    }
    if (message.includes('empty') || message.includes('boş')) {
      throw new Error('Boş sipariş kapatılamaz. Önce ürün ekleyin.')
    }
    if (message.includes('mismatch') || message.includes('amount')) {
      throw new Error('Ödeme tutarları hesap tutarıyla eşleşmiyor.')
    }
    throw new Error('Sipariş kapatılamadı. Lütfen tekrar deneyin.')
  }

  revalidatePath('/pos')
  revalidatePath(`/pos/orders/${orderId}`)
}

/**
 * Açık bir siparişin bakiyesine karşı TEK BİR ödeme alır (zaman içinde tahsilat).
 * Tüm doğrulama sunucuda add_payment_to_order RPC'sinde yapılır:
 * siparişi kilitler, kalanı yeniden hesaplar, fazla tahsilatı reddeder, ödemeyi
 * payments tablosuna yazar ve kalan 0'a inince siparişi atomik 'paid' yapar.
 * Dönüş: { remaining, closed } — UI bunu listeyi/kalanı güncellemek için kullanır.
 */
export async function addPayment(
  orderId: string,
  amount: number,
  method: 'cash' | 'card'
): Promise<{ remaining: number; closed: boolean }> {
  const { supabase } = await assertAuthenticated()

  const { data, error } = await supabase.rpc('add_payment_to_order', {
    p_order_id: orderId,
    p_amount: amount,
    p_method: method,
  })

  if (error) {
    // Gerçek hatayı sunucu loguna yaz (teşhis için sessiz kalmasın).
    console.error('add_payment_to_order error:', error.code, error.message)

    // RPC exception'ını kullanıcıya gösterilebilir nazik bir mesaja çevir.
    const message = error.message || ''
    if (
      message.includes('kalandan') ||
      message.includes('büyük') ||
      message.includes('overpay') ||
      message.includes('exceed')
    ) {
      throw new Error('Tahsil edilen tutar kalandan fazla olamaz.')
    }
    if (
      message.includes('zaten') ||
      message.includes('kapalı') ||
      message.includes('already') ||
      message.includes('paid')
    ) {
      throw new Error('Bu sipariş zaten kapatılmış.')
    }
    throw new Error('Ödeme alınamadı. Lütfen tekrar deneyin.')
  }

  // DİKKAT: Burada revalidatePath ÇAĞIRMA. Sipariş kapandığında bu, sipariş
  // ekranını anında yeniden çektirir; sipariş artık 'paid' olduğu için
  // page.tsx notFound() ile 404'e düşer ve başarı modalını siler. Modal zaten
  // her kapanışta tam sayfa reload (window.location.href) yapıp veriyi tazeliyor.

  // RPC jsonb döner: { "remaining": <numeric>, "closed": <bool> }
  const result = (data ?? {}) as { remaining?: number; closed?: boolean }
  return {
    remaining: Number(result.remaining ?? 0),
    closed: Boolean(result.closed),
  }
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

  // DİKKAT: Burada revalidatePath ÇAĞIRMA. Sipariş silindikten sonra bu, o anki
  // sipariş ekranını yeniden çektirir; sipariş artık yok olduğu için page.tsx
  // notFound() ile 404'e düşer (geri dönüşte görünen "arada 404" flash'ı buydu).
  // Çağıranlar (BackToTablesLink / CancelEmptyOrderButton) zaten window.location.href
  // ile /pos'a tam reload yapıyor, masa listesi taze geliyor.
}
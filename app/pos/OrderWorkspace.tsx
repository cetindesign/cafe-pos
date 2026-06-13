'use client'

import { useOptimistic, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  addProductToOrder,
  increaseItemQuantity,
  decreaseItemQuantity,
  removeItem,
} from './actions'
import type { Category, Product } from '@/lib/types/database'
import MenuGrid from './MenuGrid'
import OrderSummary from './OrderSummary'

// Sepet satırının görünüm modeli (DB satırı + ürün adı)
export type OrderItemWithProduct = {
  id: string
  quantity: number
  unit_price: number
  product_id: string
  note: string | null
  products: {
    name: string
  } | null
}

// Siparişe şimdiye kadar alınmış bir ödeme (payments tablosundan).
export type OrderPayment = {
  id: string
  amount: number
  method: 'cash' | 'card'
  created_at: string
}

// Optimistik sepet aksiyonları
type CartAction =
  | { type: 'increase'; id: string }
  | { type: 'decrease'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'add'; product: Product; tempId: string }

/**
 * Optimistik reducer — server action'ların GERÇEK davranışını birebir yansıtır.
 * - decrease: miktar 1 veya altına inince satırı SİLER (decreaseItemQuantity ile aynı).
 * - add: aynı product_id sepette VARSA satırın miktarını +1 yapar (yeni satır AÇMAZ),
 *   YOKSA geçici id'li yeni satır ekler (addProductToOrder merge davranışıyla aynı).
 */
function cartReducer(
  items: OrderItemWithProduct[],
  action: CartAction
): OrderItemWithProduct[] {
  switch (action.type) {
    case 'increase':
      return items.map((it) =>
        it.id === action.id ? { ...it, quantity: it.quantity + 1 } : it
      )
    case 'decrease':
      return items.flatMap((it) => {
        if (it.id !== action.id) return [it]
        // Server: quantity <= 1 ise satırı siler
        if (it.quantity <= 1) return []
        return [{ ...it, quantity: it.quantity - 1 }]
      })
    case 'remove':
      return items.filter((it) => it.id !== action.id)
    case 'add': {
      // Ürün zaten sepetteyse miktarını artır (merge), yeni satır açma
      const exists = items.some((it) => it.product_id === action.product.id)
      if (exists) {
        return items.map((it) =>
          it.product_id === action.product.id
            ? { ...it, quantity: it.quantity + 1 }
            : it
        )
      }
      // Yoksa geçici id'li yeni satır ekle
      return [
        ...items,
        {
          id: action.tempId,
          quantity: 1,
          unit_price: action.product.price,
          product_id: action.product.id,
          note: null,
          products: { name: action.product.name },
        },
      ]
    }
    default:
      return items
  }
}

type Props = {
  orderId: string
  items: OrderItemWithProduct[]
  payments: OrderPayment[]
  categories: Category[]
  products: Product[]
}

export default function OrderWorkspace({
  orderId,
  items,
  payments,
  categories,
  products,
}: Props) {
  const router = useRouter()

  // Optimistik sepet: hem menü (ekleme) hem özet (+/−/sil) buradan beslenir.
  const [optimisticItems, applyCart] = useOptimistic(items, cartReducer)
  const [, startCartTransition] = useTransition()
  const [cartError, setCartError] = useState<string | null>(null)

  // Sunucu çağrılarını sıraya alıp yarış durumunu (read-modify-write) önleyen kuyruk.
  const queueRef = useRef<Promise<void>>(Promise.resolve())

  // Ortak akış: önce optimistik güncelle, sonra sunucu işini sıraya koyup bekle,
  // başarıda router.refresh() ile gerçek veriyi getir; hatada uyar ve refresh YAPMA
  // (transition bitince optimistik değer otomatik geri alınır).
  function dispatchCart(action: CartAction, serverCall: () => Promise<void>) {
    setCartError(null)
    startCartTransition(async () => {
      applyCart(action)
      const run = queueRef.current.then(serverCall)
      // Bir iş hata verse bile kuyruğun devamı çalışsın diye hatayı yutuyoruz.
      queueRef.current = run.then(
        () => {},
        () => {}
      )
      try {
        await run
        router.refresh()
      } catch {
        setCartError('İşlem başarısız oldu. Lütfen tekrar deneyin.')
      }
    })
  }

  function handleIncrease(id: string) {
    dispatchCart({ type: 'increase', id }, () =>
      increaseItemQuantity(id, orderId)
    )
  }

  function handleDecrease(id: string) {
    dispatchCart({ type: 'decrease', id }, () =>
      decreaseItemQuantity(id, orderId)
    )
  }

  function handleRemove(id: string) {
    dispatchCart({ type: 'remove', id }, () => removeItem(id, orderId))
  }

  function handleAdd(productId: string) {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    // Geçici id; gerçek DB satırı geldiğinde refresh ile yerini alır.
    const tempId = `temp-${productId}-${Date.now()}`
    dispatchCart({ type: 'add', product, tempId }, () =>
      addProductToOrder(orderId, productId)
    )
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 min-h-0">
      <MenuGrid
        categories={categories}
        products={products}
        onAddProduct={handleAdd}
      />
      <OrderSummary
        orderId={orderId}
        items={optimisticItems}
        payments={payments}
        cartError={cartError}
        onIncrease={handleIncrease}
        onDecrease={handleDecrease}
        onRemove={handleRemove}
      />
    </div>
  )
}

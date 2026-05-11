'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  increaseItemQuantity,
  decreaseItemQuantity,
  removeItem,
  closeOrder,
} from './actions'
import { Plus, Minus, X, Loader2 } from 'lucide-react'

type OrderItemWithProduct = {
  id: string
  quantity: number
  unit_price: number
  product_id: string
  products: {
    name: string
  } | null
}

type Props = {
  orderId: string
  items: OrderItemWithProduct[]
}

export default function OrderSummary({ orderId, items }: Props) {
  const router = useRouter()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const total = items.reduce(
    (sum, item) => sum + Number(item.unit_price) * item.quantity,
    0
  )

  const hasItems = items.length > 0

  function handleConfirmPayment() {
    setError(null)
    startTransition(async () => {
      try {
        await closeOrder(orderId, paymentMethod)
        router.push(
          `/pos/orders/${orderId}/success?method=${paymentMethod}&total=${total.toFixed(2)}`
        )
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Ödeme işlemi başarısız.'
        setError(message)
      }
    })
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-brand-border flex flex-col h-full">
        <div className="px-6 py-4 border-b border-brand-border">
          <h2 className="font-serif text-lg font-bold text-brand-primary">
            Sipariş
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {items.length} farklı kalem
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-neutral-400">
                Soldaki menüden ürün ekleyin.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-brand-border">
              {items.map((item) => (
                <OrderItemRow key={item.id} item={item} orderId={orderId} />
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-brand-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">Toplam</span>
            <span className="text-2xl font-bold text-brand-primary">
              {total.toFixed(2)} ₺
            </span>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={!hasItems}
            className="w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
          >
            Hesap Kapat
          </button>
        </div>
      </div>

      {showPaymentModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => !isPending && setShowPaymentModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-brand-border shadow-xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-2xl font-bold text-brand-primary mb-2">
              Hesap Kapat
            </h3>
            <p className="text-sm text-neutral-500 mb-6">
              Toplam{' '}
              <span className="font-semibold text-brand-primary">
                {total.toFixed(2)} ₺
              </span>{' '}
              tahsil edilecek. Devam etmek istiyor musunuz?
            </p>

            <div className="space-y-2 mb-6">
              <p className="text-sm font-medium text-brand-primary">
                Ödeme Yöntemi
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  disabled={isPending}
                  className={`
                    rounded-lg border px-4 py-3 text-sm font-medium transition-colors
                    ${
                      paymentMethod === 'cash'
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-white text-neutral-600 border-brand-border hover:bg-brand-muted'
                    }
                    disabled:opacity-50
                  `}
                >
                  Nakit
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  disabled={isPending}
                  className={`
                    rounded-lg border px-4 py-3 text-sm font-medium transition-colors
                    ${
                      paymentMethod === 'card'
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-white text-neutral-600 border-brand-border hover:bg-brand-muted'
                    }
                    disabled:opacity-50
                  `}
                >
                  Kart
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-brand-border px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-brand-muted transition-colors disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? 'İşleniyor...' : 'Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function OrderItemRow({
  item,
  orderId,
}: {
  item: OrderItemWithProduct
  orderId: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const lineTotal = Number(item.unit_price) * item.quantity

  function handleIncrease() {
    startTransition(async () => {
      try {
        await increaseItemQuantity(item.id, orderId)
        router.refresh()
      } catch (e) {
        console.error(e)
      }
    })
  }

  function handleDecrease() {
    startTransition(async () => {
      try {
        await decreaseItemQuantity(item.id, orderId)
        router.refresh()
      } catch (e) {
        console.error(e)
      }
    })
  }

  function handleRemove() {
    startTransition(async () => {
      try {
        await removeItem(item.id, orderId)
        router.refresh()
      } catch (e) {
        console.error(e)
      }
    })
  }

  return (
    <li className={`px-6 py-3 ${isPending ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-brand-primary text-sm">
            {item.products?.name || 'Bilinmeyen ürün'}
          </p>
          <p className="text-xs text-neutral-500">
            {Number(item.unit_price).toFixed(2)} ₺
          </p>
        </div>
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="text-neutral-400 hover:text-red-600 transition-colors p-0.5"
          aria-label="Kalemi sil"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecrease}
            disabled={isPending}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-brand-border hover:bg-brand-muted transition-colors text-neutral-600 disabled:opacity-50"
            aria-label="Miktar azalt"
          >
            <Minus className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
          <span className="text-sm font-medium text-brand-primary min-w-[2rem] text-center">
            {item.quantity}
          </span>
          <button
            onClick={handleIncrease}
            disabled={isPending}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-brand-border hover:bg-brand-muted transition-colors text-neutral-600 disabled:opacity-50"
            aria-label="Miktar artır"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
        <span className="text-sm font-bold text-brand-primary">
          {lineTotal.toFixed(2)} ₺
        </span>
      </div>
    </li>
  )
}
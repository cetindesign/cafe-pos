'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  increaseItemQuantity,
  decreaseItemQuantity,
  removeItem,
  closeOrder,
} from './actions'

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
        // Başarı sayfasına yönlendir
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
      <div className="bg-white rounded-2xl shadow-sm flex flex-col h-full">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Sipariş</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {items.length} farklı kalem
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-400">
                Soldaki menüden ürün ekleyin.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <OrderItemRow key={item.id} item={item} orderId={orderId} />
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Toplam</span>
            <span className="text-2xl font-bold text-gray-900">
              {total.toFixed(2)} ₺
            </span>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={!hasItems}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Hesap Kapat
          </button>
        </div>
      </div>

      {/* Ödeme Modal */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => !isPending && setShowPaymentModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Hesap Kapat
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Toplam{' '}
              <span className="font-semibold text-gray-900">
                {total.toFixed(2)} ₺
              </span>{' '}
              tahsil edilecek. Devam etmek istiyor musunuz?
            </p>

            <div className="space-y-2 mb-6">
              <p className="text-sm font-medium text-gray-700">
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
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                    disabled:opacity-50
                  `}
                >
                  Kart
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isPending}
                className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
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

  const lineTotal = Number(item.unit_price) * item.quantity

  function handleIncrease() {
    startTransition(async () => {
      try {
        await increaseItemQuantity(item.id, orderId)
      } catch (e) {
        console.error(e)
      }
    })
  }

  function handleDecrease() {
    startTransition(async () => {
      try {
        await decreaseItemQuantity(item.id, orderId)
      } catch (e) {
        console.error(e)
      }
    })
  }

  function handleRemove() {
    startTransition(async () => {
      try {
        await removeItem(item.id, orderId)
      } catch (e) {
        console.error(e)
      }
    })
  }

  return (
    <li className={`px-6 py-3 ${isPending ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">
            {item.products?.name || 'Bilinmeyen ürün'}
          </p>
          <p className="text-xs text-gray-500">
            {Number(item.unit_price).toFixed(2)} ₺
          </p>
        </div>
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="text-gray-400 hover:text-red-600 transition-colors text-xs"
          aria-label="Kalemi sil"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecrease}
            disabled={isPending}
            className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50"
            aria-label="Miktar azalt"
          >
            −
          </button>
          <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
            {item.quantity}
          </span>
          <button
            onClick={handleIncrease}
            disabled={isPending}
            className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50"
            aria-label="Miktar artır"
          >
            +
          </button>
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {lineTotal.toFixed(2)} ₺
        </span>
      </div>
    </li>
  )
}
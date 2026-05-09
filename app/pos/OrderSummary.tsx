'use client'

import { useTransition } from 'react'
import {
  increaseItemQuantity,
  decreaseItemQuantity,
  removeItem,
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
  const total = items.reduce(
    (sum, item) => sum + Number(item.unit_price) * item.quantity,
    0
  )

  return (
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

      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">Toplam</span>
          <span className="text-2xl font-bold text-gray-900">
            {total.toFixed(2)} ₺
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Hesap kapatma Sprint 4&apos;te eklenecek
        </p>
      </div>
    </div>
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
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreateOrderForTable } from './actions'

type Props = {
  tableId: string
  tableName: string
  existingOrderId: string | undefined
  isOccupied: boolean
}

export default function OpenTableButton({
  tableId,
  tableName,
  existingOrderId,
  isOccupied,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)

    if (existingOrderId) {
      router.push(`/pos/orders/${existingOrderId}`)
      return
    }

    startTransition(async () => {
      try {
        const { orderId } = await getOrCreateOrderForTable(tableId)
        router.push(`/pos/orders/${orderId}`)
      } catch (e) {
        setError('Sipariş açılamadı. Tekrar deneyin.')
        console.error(e)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`
        relative aspect-square rounded-2xl p-4 text-left transition-all
        ${
          isOccupied
            ? 'bg-gray-900 text-white hover:bg-gray-800'
            : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2
      `}
    >
      <div className="flex flex-col h-full justify-between">
        <span className="text-base font-semibold">{tableName}</span>
        <span className="text-xs opacity-75">
          {isOccupied ? 'Açık sipariş' : 'Boş'}
        </span>
      </div>

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
          <span className="text-xs text-white">Açılıyor...</span>
        </div>
      )}

      {error && (
        <div className="absolute -bottom-8 left-0 right-0 text-xs text-red-600">
          {error}
        </div>
      )}
    </button>
  )
}
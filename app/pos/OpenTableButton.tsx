'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreateOrderForTable } from './actions'
import { Loader2 } from 'lucide-react'

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
        border
        ${
          isOccupied
            ? 'bg-brand-primary text-white border-brand-primary hover:bg-neutral-800'
            : 'bg-white text-brand-primary border-brand-border hover:border-brand-primary hover:shadow-sm'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
      `}
    >
      <div className="flex flex-col h-full justify-between">
        <span className="font-serif text-lg font-bold leading-tight">
          {tableName}
        </span>
        <span
          className={`text-xs ${
            isOccupied ? 'text-brand-accent' : 'text-neutral-400'
          }`}
        >
          {isOccupied ? '● Açık sipariş' : 'Boş'}
        </span>
      </div>

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
          <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
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
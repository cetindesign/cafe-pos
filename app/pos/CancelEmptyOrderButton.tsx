'use client'

import { useTransition } from 'react'
import { cancelEmptyOrder } from './actions'
import { Trash2, Loader2 } from 'lucide-react'

export default function CancelEmptyOrderButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Bu masayı boşaltmak istediğinize emin misiniz?')) return

    startTransition(async () => {
      try {
        await cancelEmptyOrder(orderId)
        window.location.href = '/pos'
      } catch (e) {
        console.error(e)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" strokeWidth={1.75} />
      )}
      {isPending ? 'Boşaltılıyor...' : 'Masayı Boşalt'}
    </button>
  )
}
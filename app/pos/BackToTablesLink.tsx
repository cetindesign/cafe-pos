'use client'

import { useTransition } from 'react'
import { cancelEmptyOrder } from './actions'
import { ArrowLeft } from 'lucide-react'

type Props = {
  orderId: string
  isEmpty: boolean
}

export default function BackToTablesLink({ orderId, isEmpty }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      if (isEmpty) {
        try {
          await cancelEmptyOrder(orderId)
        } catch (e) {
          console.error('Silme hatası:', e)
        }
      }
      // Tam sayfa yenilemesi — Next.js cache'i tamamen atla
      window.location.href = '/pos'
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-primary transition-colors disabled:opacity-50"
    >
      <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
      Masalar
    </button>
  )
}
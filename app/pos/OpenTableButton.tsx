'use client'

import { useEffect, useOptimistic, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreateOrderForTable, renameTable } from './actions'
import { Loader2 } from 'lucide-react'
import RenameTableButton from './RenameTableButton'

type Props = {
  tableId: string
  tableName: string
  existingOrderId: string | undefined
  currentTotal: number
  isOccupied: boolean
  canEdit: boolean
}

export default function OpenTableButton({
  tableId,
  tableName,
  existingOrderId,
  currentTotal,
  isOccupied,
  canEdit,
}: Props) {
  const router = useRouter()
  // Masaya dokunup siparişe geçerken pending feedback (hem boş hem dolu masada).
  const [isOpening, startOpening] = useTransition()
  // Masa adı düzenlemesi için ayrı transition (optimistic ismi taşır).
  const [, startRenaming] = useTransition()
  // Optimistic masa adı: rename sırasında kartta ANINDA yeni ad görünür; base
  // (tableName prop'u) değişmezse transition bitince eski ada geri döner.
  const [displayName, setOptimisticName] = useOptimistic(
    tableName,
    (_current, next: string) => next
  )
  const [error, setError] = useState<string | null>(null)

  // Dolu masada order route'u (id zaten belli) önceden prefetch et: route JS
  // chunk'ı + loading.tsx iskeleti hazır olur, dokununca anında geçer; geriye
  // yalnızca paralel veri sorgusu kalır. Boş masada id henüz yok, prefetch edilemez.
  useEffect(() => {
    if (existingOrderId) {
      router.prefetch(`/pos/orders/${existingOrderId}`)
    }
  }, [existingOrderId, router])

  function handleClick() {
    setError(null)
    // router.push'u transition içine alıyoruz ki varış yüklenene dek isPending
    // true kalsın (kart pending görünür, çift tık engellenir).
    startOpening(async () => {
      try {
        let targetId = existingOrderId
        if (!targetId) {
          const res = await getOrCreateOrderForTable(tableId)
          targetId = res.orderId
        }
        router.push(`/pos/orders/${targetId}`)
      } catch (e) {
        setError('Sipariş açılamadı. Tekrar deneyin.')
        console.error(e)
      }
    })
  }

  // RenameTableButton'dan çağrılır: optimistic güncelle + renameTable'ı arkada çalıştır.
  function handleRename(newName: string) {
    setError(null)
    startRenaming(async () => {
      setOptimisticName(newName) // kart adı anında değişir
      try {
        await renameTable(tableId, newName)
        // Başarı: base prop'u yeni isimle tazele; optimistic değer sabitlenir.
        router.refresh()
      } catch (e) {
        // Hata: optimistic değer transition bitince eski ada döner; mesajı göster.
        const message =
          e instanceof Error ? e.message : 'Masa adı güncellenemedi.'
        setError(message)
      }
    })
  }

  return (
    // Kart + kalem ikonu için göreli sarmalayıcı. Kalem ikonu <button>'ın DIŞINDA,
    // ayrı bir element olarak köşeye konumlanır.
    <div className="relative">
    <button
      onClick={handleClick}
      disabled={isOpening}
      className={`
        relative aspect-square w-full rounded-2xl p-4 text-left transition-all
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
          {displayName}
        </span>
        <div>
          {isOccupied && currentTotal > 0 && (
            <p className="text-xl font-bold text-brand-accent mb-1">
              {currentTotal.toFixed(2)} ₺
            </p>
          )}
          <span
            className={`text-xs ${
              isOccupied ? 'text-brand-accent/70' : 'text-neutral-400'
            }`}
          >
            {isOccupied ? '● Açık sipariş' : 'Boş'}
          </span>
        </div>
      </div>

      {isOpening && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-white/80 rounded-2xl">
          <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
          <span className="text-xs font-medium text-brand-primary">
            Açılıyor…
          </span>
        </div>
      )}

      {error && (
        <div className="absolute -bottom-8 left-0 right-0 text-xs text-red-600">
          {error}
        </div>
      )}
    </button>

      {/* Yalnızca manager'a görünür: masa adını düzenleme afordansı */}
      {canEdit && (
        <RenameTableButton tableName={displayName} onSave={handleRename} />
      )}
    </div>
  )
}

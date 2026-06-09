'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setItemNote, closeOrder } from './actions'
import { Plus, Minus, X, Loader2, StickyNote } from 'lucide-react'
import type { OrderItemWithProduct } from './OrderWorkspace'

type Props = {
  orderId: string
  // Zaten optimistik olan sepet (OrderWorkspace'ten gelir)
  items: OrderItemWithProduct[]
  cartError: string | null
  onIncrease: (id: string) => void
  onDecrease: (id: string) => void
  onRemove: (id: string) => void
}

export default function OrderSummary({
  orderId,
  items,
  cartError,
  onIncrease,
  onDecrease,
  onRemove,
}: Props) {
  const router = useRouter()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [splitMode, setSplitMode] = useState(false)
  const [personCount, setPersonCount] = useState(2)
  const [cashPersons, setCashPersons] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const total = items.reduce(
    (sum, item) => sum + Number(item.unit_price) * item.quantity,
    0
  )

  const hasItems = items.length > 0

  // Tutarları 2 ondalığa sabitle. Bölmede toplam birebir tutsun diye kart = kalan.
  const totalR = Number(total.toFixed(2))
  const personCountSafe = Math.max(2, Math.floor(personCount) || 2)
  const cashPersonsSafe = Math.min(
    personCountSafe,
    Math.max(0, Math.floor(cashPersons) || 0)
  )
  const perPerson = totalR / personCountSafe
  const splitCash =
    Math.round((cashPersonsSafe / personCountSafe) * totalR * 100) / 100
  const splitCard = Math.round((totalR - splitCash) * 100) / 100

  function handleConfirmPayment() {
    setError(null)

    // Moda göre nakit/kart tutarlarını belirle
    const cash = splitMode ? splitCash : paymentMethod === 'cash' ? totalR : 0
    const card = splitMode ? splitCard : paymentMethod === 'card' ? totalR : 0

    const payments: { method: 'cash' | 'card'; amount: number }[] = []
    if (cash > 0) payments.push({ method: 'cash', amount: cash })
    if (card > 0) payments.push({ method: 'card', amount: card })

    startTransition(async () => {
      try {
        await closeOrder(orderId, payments)
        router.push(
          `/pos/orders/${orderId}/success?total=${totalR.toFixed(
            2
          )}&cash=${cash.toFixed(2)}&card=${card.toFixed(2)}`
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
                <OrderItemRow
                  key={item.id}
                  item={item}
                  orderId={orderId}
                  onIncrease={() => onIncrease(item.id)}
                  onDecrease={() => onDecrease(item.id)}
                  onRemove={() => onRemove(item.id)}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-brand-border space-y-3">
          {cartError && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
              {cartError}
            </div>
          )}
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
                {totalR.toFixed(2)} ₺
              </span>{' '}
              tahsil edilecek.
            </p>

            {/* Mod seçimi: Tek ödeme / Böl */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={() => setSplitMode(false)}
                disabled={isPending}
                className={`
                  rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors
                  ${
                    !splitMode
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-white text-neutral-600 border-brand-border hover:bg-brand-muted'
                  }
                  disabled:opacity-50
                `}
              >
                Tek ödeme
              </button>
              <button
                onClick={() => setSplitMode(true)}
                disabled={isPending}
                className={`
                  rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors
                  ${
                    splitMode
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-white text-neutral-600 border-brand-border hover:bg-brand-muted'
                  }
                  disabled:opacity-50
                `}
              >
                Böl
              </button>
            </div>

            {!splitMode ? (
              /* TEK ÖDEME: Nakit / Kart */
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
            ) : (
              /* BÖL: eşit bölme, kaç kişi nakit ödüyor */
              <div className="space-y-4 mb-6">
                <div>
                  <label
                    htmlFor="person-count"
                    className="block text-sm font-medium text-brand-primary mb-1"
                  >
                    Kişi sayısı
                  </label>
                  <input
                    id="person-count"
                    type="number"
                    min={2}
                    value={personCount}
                    onChange={(e) => setPersonCount(Number(e.target.value))}
                    disabled={isPending}
                    className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow disabled:opacity-50"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Kişi başı: {perPerson.toFixed(2)} ₺
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="cash-persons"
                    className="block text-sm font-medium text-brand-primary mb-1"
                  >
                    Kaç kişi nakit ödüyor?
                  </label>
                  <input
                    id="cash-persons"
                    type="number"
                    min={0}
                    max={personCountSafe}
                    value={cashPersons}
                    onChange={(e) => setCashPersons(Number(e.target.value))}
                    disabled={isPending}
                    className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow disabled:opacity-50"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    {personCountSafe - cashPersonsSafe} kişi kart ödüyor
                  </p>
                </div>

                <div className="rounded-lg bg-brand-muted p-3 text-sm text-brand-primary">
                  Nakit:{' '}
                  <span className="font-semibold">
                    {splitCash.toFixed(2)} ₺
                  </span>{' '}
                  ·{' '}
                  Kart:{' '}
                  <span className="font-semibold">
                    {splitCard.toFixed(2)} ₺
                  </span>
                </div>
              </div>
            )}

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
  onIncrease,
  onDecrease,
  onRemove,
}: {
  item: OrderItemWithProduct
  orderId: string
  onIncrease: () => void
  onDecrease: () => void
  onRemove: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Not düzenleme için geçici UI state; kaynak yine DB (item.note).
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState(item.note ?? '')

  const lineTotal = Number(item.unit_price) * item.quantity

  function handleEditNote() {
    setNoteDraft(item.note ?? '')
    setIsEditingNote(true)
  }

  function handleCancelNote() {
    setNoteDraft(item.note ?? '')
    setIsEditingNote(false)
  }

  function handleSaveNote() {
    startTransition(async () => {
      try {
        await setItemNote(item.id, orderId, noteDraft)
        setIsEditingNote(false)
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
          {/* Not varsa ürün adının altında küçük/soluk göster */}
          {item.note && !isEditingNote && (
            <p className="flex items-start gap-1 mt-1 text-xs text-neutral-400">
              <StickyNote
                className="w-3 h-3 mt-0.5 flex-shrink-0"
                strokeWidth={1.75}
              />
              <span className="break-words">{item.note}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Not ekle/düzenle afordansı: not varsa vurgulu, yoksa soluk */}
          <button
            onClick={handleEditNote}
            disabled={isPending}
            className={`transition-colors p-0.5 disabled:opacity-50 ${
              item.note
                ? 'text-brand-accent hover:text-brand-primary'
                : 'text-neutral-300 hover:text-brand-primary'
            }`}
            aria-label={item.note ? 'Notu düzenle' : 'Not ekle'}
          >
            <StickyNote className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={onRemove}
            className="text-neutral-400 hover:text-red-600 transition-colors p-0.5"
            aria-label="Kalemi sil"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Kompakt not düzenleme alanı */}
      {isEditingNote && (
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Not (örn. az şekerli)"
            disabled={isPending}
            autoFocus
            className="flex-1 min-w-0 rounded-lg border border-brand-border px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSaveNote}
            disabled={isPending}
            className="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            Kaydet
          </button>
          <button
            type="button"
            onClick={handleCancelNote}
            disabled={isPending}
            className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-brand-muted transition-colors disabled:opacity-50"
          >
            İptal
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onDecrease}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-brand-border hover:bg-brand-muted transition-colors text-neutral-600"
            aria-label="Miktar azalt"
          >
            <Minus className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
          <span className="text-sm font-medium text-brand-primary min-w-[2rem] text-center">
            {item.quantity}
          </span>
          <button
            onClick={onIncrease}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-brand-border hover:bg-brand-muted transition-colors text-neutral-600"
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

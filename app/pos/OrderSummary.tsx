'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setItemNote, addPayment } from './actions'
import {
  Plus,
  Minus,
  X,
  Loader2,
  StickyNote,
  Banknote,
  CreditCard,
  Check,
} from 'lucide-react'
import type { OrderItemWithProduct, OrderPayment } from './OrderWorkspace'

type Props = {
  orderId: string
  // Zaten optimistik olan sepet (OrderWorkspace'ten gelir)
  items: OrderItemWithProduct[]
  // Siparişe şimdiye kadar alınmış ödemeler (sunucudan; modal lokal state'i bununla başlatır)
  payments: OrderPayment[]
  cartError: string | null
  onIncrease: (id: string) => void
  onDecrease: (id: string) => void
  onRemove: (id: string) => void
}

export default function OrderSummary({
  orderId,
  items,
  payments,
  cartError,
  onIncrease,
  onDecrease,
  onRemove,
}: Props) {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  // Açık modal için lokal ödeme listesi. Tek doğruluk kaynağı sunucudaki
  // add_payment_to_order; bu state yalnızca onu ekranda yansıtır.
  const [collected, setCollected] = useState<OrderPayment[]>(payments)
  const [payMethod, setPayMethod] = useState<'cash' | 'card'>('cash')
  const [amountInput, setAmountInput] = useState('')
  const [closed, setClosed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // Lokal ödeme satırlarına benzersiz key üretmek için sayaç.
  const localIdRef = useRef(0)

  const total = items.reduce(
    (sum, item) => sum + Number(item.unit_price) * item.quantity,
    0
  )
  const hasItems = items.length > 0

  // Tutarlar 2 haneye sabit. Kalan = round(toplam − alınan ödemeler).
  const totalR = Number(total.toFixed(2))
  const paid = Number(
    collected.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)
  )
  const remaining = Number((totalR - paid).toFixed(2))
  const progressPct =
    totalR > 0 ? Math.min(100, Math.max(0, (paid / totalR) * 100)) : 0

  const cashTotal = Number(
    collected
      .filter((p) => p.method === 'cash')
      .reduce((sum, p) => sum + Number(p.amount), 0)
      .toFixed(2)
  )
  const cardTotal = Number(
    collected
      .filter((p) => p.method === 'card')
      .reduce((sum, p) => sum + Number(p.amount), 0)
      .toFixed(2)
  )

  const parsedAmount = Number((amountInput || '').replace(',', '.'))
  const canCollect = !isPending && remaining > 0 && parsedAmount > 0

  function openPaymentModal() {
    setError(null)
    setClosed(false)
    setCollected(payments)
    setPayMethod('cash')
    // Varsayılan tutar = kalan (tek seferde kapatma kolaylığı için).
    const rem = Number((totalR - Number(
      payments.reduce((s, p) => s + Number(p.amount), 0).toFixed(2)
    )).toFixed(2))
    setAmountInput(rem > 0 ? rem.toFixed(2) : '')
    setShowPaymentModal(true)
  }

  // Modal her kapanışında TAM SAYFA reload: kapandıysa masa listesine (masa boşalsın),
  // kısmen ödenmiş açık kaldıysa mevcut siparişi tazele (diğer görünümler güncel olsun).
  function fullReload() {
    window.location.href = closed ? '/pos' : window.location.pathname
  }

  function handleCollect() {
    setError(null)
    if (!canCollect) return

    // Tutarı kalana kıs; 0/boşsa hiçbir şey yapma (sunucu da fazlayı reddeder).
    const amount = Number(Math.min(parsedAmount, remaining).toFixed(2))
    if (amount <= 0) return

    const method = payMethod

    startTransition(async () => {
      try {
        const result = await addPayment(orderId, amount, method)

        // Başarılı: ödemeyi lokal listeye ekle (kalan otomatik güncellenir).
        localIdRef.current += 1
        const newRemaining = Number((remaining - amount).toFixed(2))
        setCollected((prev) => [
          ...prev,
          {
            id: `local-${localIdRef.current}`,
            amount,
            method,
            created_at: '',
          },
        ])

        if (result.closed) {
          // Kalan 0'a indi: başarı ekranı + (Kapat'ta) tam sayfa reload.
          setClosed(true)
        } else {
          // Input'u yeni kalana sıfırla.
          setAmountInput(newRemaining > 0 ? newRemaining.toFixed(2) : '')
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Ödeme alınamadı.'
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
            onClick={openPaymentModal}
            disabled={!hasItems}
            className="w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
          >
            Hesap Kapat
          </button>
        </div>
      </div>

      {showPaymentModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => !isPending && fullReload()}
        >
          <div
            className="bg-white rounded-3xl border border-brand-border shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {closed ? (
              /* BAŞARI EKRANI: hesap kapandı */
              <div className="px-6 py-10 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-7 w-7" strokeWidth={2.5} />
                </span>
                <h3 className="font-serif text-xl font-bold text-brand-primary mt-4">
                  Hesap kapatıldı
                </h3>
                <p className="text-sm text-neutral-500 mt-2">
                  Nakit {cashTotal.toFixed(2)} ₺ · Kart {cardTotal.toFixed(2)} ₺
                </p>
                <button
                  onClick={fullReload}
                  className="mt-7 w-full rounded-xl bg-brand-primary px-4 py-3.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
                >
                  Kapat
                </button>
              </div>
            ) : (
              <>
                {/* Başlık + kapat */}
                <div className="flex items-center justify-between px-6 pt-5">
                  <h3 className="font-serif text-lg font-bold text-brand-primary">
                    Hesap Kapat
                  </h3>
                  <button
                    onClick={fullReload}
                    disabled={isPending}
                    className="-mr-1.5 rounded-full p-1.5 text-neutral-400 hover:bg-brand-muted hover:text-brand-primary transition-colors disabled:opacity-50"
                    aria-label="Kapat"
                  >
                    <X className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>

                {/* Kalan — en üstte, büyük, ortada, serif */}
                <div className="px-6 pt-4 pb-5 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                    Kalan
                  </p>
                  <p className="font-serif text-[2.75rem] leading-none font-bold text-brand-primary mt-2">
                    {remaining.toFixed(2)}{' '}
                    <span className="text-2xl text-brand-accent">₺</span>
                  </p>
                  {/* İlerleme çubuğu: tahsil edilen / toplam */}
                  <div className="mt-4">
                    <div className="h-1.5 w-full rounded-full bg-brand-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-accent transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">
                      {paid.toFixed(2)} ₺ / {totalR.toFixed(2)} ₺ tahsil edildi
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 space-y-5">
                  {/* Alınan ödemeler listesi (salt okunur) */}
                  {collected.length > 0 && (
                    <div className="rounded-2xl border border-brand-border divide-y divide-brand-border overflow-hidden">
                      {collected.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between px-4 py-2.5 text-sm"
                        >
                          <span className="flex items-center gap-2 text-neutral-600">
                            {p.method === 'cash' ? (
                              <Banknote className="w-4 h-4" strokeWidth={1.75} />
                            ) : (
                              <CreditCard
                                className="w-4 h-4"
                                strokeWidth={1.75}
                              />
                            )}
                            {p.method === 'cash' ? 'Nakit' : 'Kart'}
                          </span>
                          <span className="font-semibold text-brand-primary tabular-nums">
                            {Number(p.amount).toFixed(2)} ₺
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ödeme al */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-brand-primary">
                        Ödeme al
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setAmountInput(remaining > 0 ? remaining.toFixed(2) : '')
                        }
                        disabled={isPending || remaining <= 0}
                        className="text-xs font-medium text-brand-accent hover:text-brand-primary transition-colors disabled:opacity-40"
                      >
                        Kalanın tamamı
                      </button>
                    </div>

                    {/* Tutar input'u */}
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        disabled={isPending || remaining <= 0}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-brand-border bg-white pl-4 pr-9 py-3 text-lg font-semibold text-brand-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow disabled:opacity-50"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-accent">
                        ₺
                      </span>
                    </div>

                    {/* Nakit / Kart seçici (küçük) */}
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-brand-muted">
                      {[
                        { key: 'cash' as const, label: 'Nakit', Icon: Banknote },
                        {
                          key: 'card' as const,
                          label: 'Kart',
                          Icon: CreditCard,
                        },
                      ].map(({ key, label, Icon }) => {
                        const active = payMethod === key
                        return (
                          <button
                            key={key}
                            onClick={() => setPayMethod(key)}
                            disabled={isPending}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
                              active
                                ? 'bg-white text-brand-primary shadow-sm'
                                : 'text-neutral-500 hover:text-brand-primary'
                            }`}
                          >
                            <Icon className="w-4 h-4" strokeWidth={1.75} />
                            {label}
                          </button>
                        )
                      })}
                    </div>

                    {/* Tahsil et */}
                    <button
                      onClick={handleCollect}
                      disabled={!canCollect}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isPending ? 'İşleniyor...' : 'Tahsil et'}
                    </button>
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <p className="text-xs text-neutral-400 text-center">
                    Modalı kapatsan da sipariş kısmen ödenmiş açık kalır.
                  </p>
                </div>
              </>
            )}
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

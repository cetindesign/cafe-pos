'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'

type Props = {
  tableName: string
  // Optimistic kaydet: yeni adı parent uygular (anında) + renameTable'ı arkada çalıştırır.
  onSave: (newName: string) => void
}

/**
 * Masa kartının köşesinde duran kalem ikonu + isim düzenleme modalı.
 * Kartın <button>'ının DIŞINDA, üst katmanda ayrı bir element olarak durur;
 * böylece tıklama kartın sipariş-açma akışını tetiklemez.
 * Sadece manager'a render edilir (page.tsx karar verir).
 *
 * Kaydet OPTIMISTIC'tir: yeni ad anında uygulanır (parent onSave), modal hemen
 * kapanır; sunucu yanıtı beklenmez. Hata olursa parent eski ada geri döner.
 */
export default function RenameTableButton({ tableName, onSave }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(tableName)
  const [error, setError] = useState<string | null>(null)

  // Kalem tıklaması kartın altındaki sipariş-açma butonuna sızmasın.
  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    setName(tableName)
    setError(null)
    setOpen(true)
  }

  function handleSave() {
    const trimmed = name.trim()
    // Boş ad sunucuda da reddedilir; burada erken yakalayıp modalı açık tutuyoruz.
    if (!trimmed) {
      setError('Masa adı boş olamaz.')
      return
    }
    // Optimistic uygula + anında kapat. Aynı modal tekrar gönderilemez (kapandı).
    onSave(trimmed)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Masa adını düzenle"
        className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/90 border border-brand-border text-brand-primary shadow-sm hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-brand-border shadow-xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-2xl font-bold text-brand-primary mb-6">
              Masa Adını Düzenle
            </h3>

            <label
              htmlFor="table-name"
              className="block text-sm font-medium text-brand-primary mb-2"
            >
              Masa Adı
            </label>
            <input
              id="table-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              autoFocus
              className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow"
            />

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-brand-border px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-brand-muted transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

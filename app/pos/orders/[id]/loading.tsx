/**
 * Sipariş ekranına geçişte ANINDA gösterilen iskelet (Suspense fallback).
 * page.tsx'in veri çekmesi tamamlanana dek kullanıcı boş ekran görmez.
 * Yerleşim, gerçek sayfanın (header + menü | sipariş özeti) düzenini taklit eder.
 */
export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-brand-border flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="h-5 w-20 rounded bg-brand-muted animate-pulse" />
          <div className="border-l border-brand-border pl-4 space-y-2">
            <div className="h-6 w-32 rounded bg-brand-muted animate-pulse" />
            <div className="h-3 w-20 rounded bg-brand-muted animate-pulse" />
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 min-h-0">
        {/* Menü iskeleti */}
        <div className="space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-24 rounded-lg bg-brand-muted animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl bg-brand-muted animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Sipariş özeti iskeleti */}
        <div className="bg-white rounded-2xl border border-brand-border p-6 space-y-4">
          <div className="h-5 w-24 rounded bg-brand-muted animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-brand-muted animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

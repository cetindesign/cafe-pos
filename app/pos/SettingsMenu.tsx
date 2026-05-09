'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Settings, BookOpen, LayoutGrid, BarChart3 } from 'lucide-react'

export default function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Dışarı tıklayınca kapansın
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-brand-muted transition-colors"
        aria-label="Yönetim menüsü"
        aria-expanded={open}
      >
        <Settings className="w-4 h-4" strokeWidth={1.75} />
        Yönetim
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-brand-border shadow-lg overflow-hidden z-40">
          <Link
            href="/admin/menu"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-primary hover:bg-brand-muted transition-colors"
          >
            <BookOpen className="w-4 h-4 text-brand-accent" strokeWidth={1.75} />
            Menü Yönetimi
          </Link>
          <Link
            href="/admin/tables"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-primary hover:bg-brand-muted transition-colors"
          >
            <LayoutGrid className="w-4 h-4 text-brand-accent" strokeWidth={1.75} />
            Masa Yönetimi
          </Link>
          <Link
            href="/admin/reports"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-primary hover:bg-brand-muted transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-brand-accent" strokeWidth={1.75} />
            Raporlar
          </Link>
        </div>
      )}
    </div>
  )
}
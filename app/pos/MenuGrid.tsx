'use client'

import { useState, useTransition } from 'react'
import { addProductToOrder } from './actions'
import type { Category, Product } from '@/lib/types/database'
import { Loader2 } from 'lucide-react'

type Props = {
  orderId: string
  categories: Category[]
  products: Product[]
}

export default function MenuGrid({ orderId, categories, products }: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState(
    categories[0]?.id ?? null
  )
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filteredProducts = products.filter(
    (p) => p.category_id === activeCategoryId && p.is_available
  )

  function handleAddProduct(productId: string) {
    setPendingProductId(productId)
    startTransition(async () => {
      try {
        await addProductToOrder(orderId, productId)
      } catch (e) {
        console.error(e)
      } finally {
        setPendingProductId(null)
      }
    })
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-brand-border p-10 text-center">
        <p className="text-neutral-500">Menüde henüz ürün yok.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-border overflow-hidden flex flex-col h-full">
      <div className="flex overflow-x-auto border-b border-brand-border">
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`
                px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors
                ${
                  isActive
                    ? 'text-brand-primary border-b-2 border-brand-accent'
                    : 'text-neutral-500 hover:text-brand-primary border-b-2 border-transparent'
                }
              `}
            >
              {cat.name}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredProducts.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-10">
            Bu kategoride ürün yok.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const isPending = pendingProductId === product.id
              return (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product.id)}
                  disabled={isPending}
                  className={`
                    relative rounded-xl p-4 text-left border border-brand-border
                    bg-white hover:border-brand-primary hover:shadow-sm
                    transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1
                  `}
                >
                  <p className="font-medium text-brand-primary text-sm leading-tight mb-1">
                    {product.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {Number(product.price).toFixed(2)} ₺
                  </p>
                  {isPending && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import type { Category, Product } from '@/lib/types/database'

type Props = {
  categories: Category[]
  products: Product[]
  // Ürüne tıklanınca optimistik sepete ekleme; sunucu senkronu üst seviyede (OrderWorkspace).
  onAddProduct: (productId: string) => void
}

export default function MenuGrid({ categories, products, onAddProduct }: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState(
    categories[0]?.id ?? null
  )

  const filteredProducts = products.filter(
    (p) => p.category_id === activeCategoryId && p.is_available
  )

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
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onAddProduct(product.id)}
                className={`
                  relative rounded-xl p-4 text-left border border-brand-border
                  bg-white hover:border-brand-primary hover:shadow-sm
                  transition-all
                  focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1
                `}
              >
                <p className="font-medium text-brand-primary text-sm leading-tight mb-1">
                  {product.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {Number(product.price).toFixed(2)} ₺
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
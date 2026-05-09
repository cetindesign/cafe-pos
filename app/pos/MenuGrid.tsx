'use client'

import { useState, useTransition } from 'react'
import { addProductToOrder } from './actions'
import type { Category, Product } from '@/lib/types/database'

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
      <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
        <p className="text-gray-500">Menüde henüz ürün yok.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Kategori sekmeleri */}
      <div className="flex overflow-x-auto border-b border-gray-100">
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
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                }
              `}
            >
              {cat.name}
            </button>
          )
        })}
      </div>

      {/* Ürün grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProducts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">
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
                    rounded-xl p-4 text-left border border-gray-200
                    hover:bg-gray-50 hover:border-gray-300
                    transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1
                    ${isPending ? 'bg-gray-100' : 'bg-white'}
                  `}
                >
                  <p className="font-medium text-gray-900 text-sm leading-tight mb-1">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Number(product.price).toFixed(2)} ₺
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
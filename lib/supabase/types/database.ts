export type Category = {
  id: string
  name: string
  display_order: number
  is_available: boolean
  created_at: string
}

export type Product = {
  id: string
  category_id: string
  name: string
  price: number
  display_order: number
  is_available: boolean
  created_at: string
}

export type ProductWithCategory = Product & {
  categories: Pick<Category, 'name'> | null
}
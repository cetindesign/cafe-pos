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

export type Table = {
  id: string
  name: string
  section: string
  display_order: number
  is_active: boolean
  created_at: string
}

export type OrderStatus = 'open' | 'paid' | 'cancelled'

export type Order = {
  id: string
  table_id: string
  cashier_id: string
  status: OrderStatus
  created_at: string
  closed_at: string | null
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: string
}
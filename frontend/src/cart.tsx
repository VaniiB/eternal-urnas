import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type CartItem = {
  urnSlug: string
  urnName: string
  urnPriceCents: number
  plantSlug: string
  plantName: string
  plantPriceCents: number
  quantity: number
}

export function pairKey(item: Pick<CartItem, 'urnSlug' | 'plantSlug'>) {
  return `${item.urnSlug}|${item.plantSlug}`
}

type CartApi = {
  items: CartItem[]
  count: number
  totalCents: number
  add: (item: Omit<CartItem, 'quantity'>) => void
  setQty: (key: string, quantity: number) => void
  clear: () => void
}

const CartContext = createContext<CartApi | null>(null)

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem('eternal-cart')
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item.urnSlug && item.plantSlug && item.quantity > 0)
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart)

  useEffect(() => {
    localStorage.setItem('eternal-cart', JSON.stringify(items))
  }, [items])

  const api = useMemo<CartApi>(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      totalCents: items.reduce(
        (sum, item) => sum + (item.urnPriceCents + item.plantPriceCents) * item.quantity,
        0,
      ),
      add: (item) =>
        setItems((current) => {
          const key = pairKey(item)
          const found = current.find((entry) => pairKey(entry) === key)
          if (!found) return [...current, { ...item, quantity: 1 }]
          return current.map((entry) =>
            pairKey(entry) === key ? { ...entry, quantity: Math.min(10, entry.quantity + 1) } : entry,
          )
        }),
      setQty: (key, quantity) =>
        setItems((current) =>
          current.flatMap((entry) => {
            if (pairKey(entry) !== key) return [entry]
            if (quantity <= 0) return []
            return [{ ...entry, quantity: Math.min(10, quantity) }]
          }),
        ),
      clear: () => setItems([]),
    }),
    [items],
  )

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

export function useCart() {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('useCart tiene que usarse dentro del carrito')
  return cart
}

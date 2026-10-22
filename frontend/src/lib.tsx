import { staticApi } from './catalog'

export type Product = {
  slug: string
  name: string
  category: string
  kind: 'urna' | 'planta'
  priceCents: number
  blurb: string
  material: string
  seed: string
  stock: number
}

export type Impact = {
  treesPlanted: number
  urnsDonated: number
  partnerSites: number
}

export type Ceremony = {
  product: Pick<Product, 'slug' | 'name' | 'category' | 'blurb' | 'material' | 'seed'>
  memorial: string
  checklist: string[]
}

export type Order = {
  code: string
  customerName: string
  status: string
  totalCents: number
  createdAt: string
  items: { productName: string; quantity: number; unitPriceCents: number }[]
}

export const statusLabel: Record<string, string> = {
  pending_payment: 'Pago pendiente',
  paid: 'Pagado',
  preparing: 'En preparación',
  done: 'Entregado',
  cancelled: 'Cancelado',
}

export function money(cents: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

/** Fondos del banner por urna — usar en cards de toda la tienda */
export const urnTone: Record<string, string> = {
  raiz: '#F2E8D7',
  carton: '#F1E9DA',
  bruma: '#D9E3E9',
  cauce: '#DCE5E8',
  combo: '#D9E3E9',
}

export function toneForUrn(slug: string) {
  return urnTone[slug] ?? '#F1E9DA'
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? 'GET'
  const fallback = () => {
    const data = staticApi(path, method)
    if (data === undefined) throw new Error('No se pudo completar la acción')
    return data as T
  }

  try {
    const headers = new Headers(init?.headers)
    if (init?.body) headers.set('Content-Type', 'application/json')
    const token = sessionStorage.getItem('eternal-token')
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const response = await fetch(path, { ...init, headers })
    if (!response.ok) return fallback()
    return (await response.json()) as T
  } catch {
    return fallback()
  }
}

export const btn =
  'inline-flex items-center justify-center bg-moss px-7 py-3 text-xs font-medium tracking-[0.16em] uppercase text-bg disabled:opacity-40'
export const ghost =
  'inline-flex items-center justify-center border border-ink/25 px-7 py-3 text-xs font-medium tracking-[0.16em] uppercase'
export const field =
  'w-full border border-ink/15 bg-paper px-4 py-3 text-sm outline-none focus:border-moss'

export function Leaf() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
      <path
        d="M32 58c0-16 6-26 18-34-10 2-16 8-18 16 0-14-8-24-22-30 8 12 12 24 12 38 2-6 6-10 10-12-2 8-4 16-4 22h4Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function UrnArt({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <div className={large ? 'urn urn-lg' : 'urn'}>
      <div className="urn-lid" />
      <div className="urn-body">
        <Leaf />
        <p className="urn-name">{name}</p>
      </div>
    </div>
  )
}

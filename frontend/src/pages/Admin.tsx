import { useEffect, useState, type FormEvent } from 'react'
import { api, btn, field, ghost, money, statusLabel } from '../lib'

type AdminOrder = {
  id: number
  code: string
  customerName: string
  customerEmail: string
  customerPhone: string
  ceremonyNote: string | null
  status: string
  totalCents: number
  items: { productName: string; quantity: number }[]
}

type AdminProduct = {
  id: number
  slug: string
  name: string
  category: string
  kind: 'urna' | 'planta'
  priceCents: number
  blurb: string
  material: string
  seed: string
  stock: number
  active: boolean
}

type Impact = { treesPlanted: number; urnsDonated: number; partnerSites: number }

const statuses = ['paid', 'preparing', 'done', 'cancelled'] as const

export function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem('eternal-token') || '')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [impact, setImpact] = useState<Impact>({ treesPlanted: 0, urnsDonated: 0, partnerSites: 0 })

  async function load() {
    const [nextOrders, nextProducts, nextImpact] = await Promise.all([
      api<AdminOrder[]>('/api/admin/orders'),
      api<AdminProduct[]>('/api/admin/products'),
      api<Impact>('/api/admin/settings'),
    ])
    setOrders(nextOrders)
    setProducts(nextProducts)
    setImpact(nextImpact)
  }

  useEffect(() => {
    if (!token) return
    load().catch((reason: Error) => {
      sessionStorage.removeItem('eternal-token')
      setToken('')
      setError(reason.message)
    })
  }, [token])

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')
    try {
      const session = await api<{ token: string; name: string }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      })
      sessionStorage.setItem('eternal-token', session.token)
      setName(session.name)
      setToken(session.token)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo entrar')
    }
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="display text-5xl">Panel</h1>
        <form onSubmit={login} className="mt-8 space-y-4">
          <input name="email" type="email" required placeholder="Email" className={field} />
          <input name="password" type="password" required placeholder="Contraseña" className={field} />
          {error && <p className="text-sm text-red-800">{error}</p>}
          <button className={btn}>Entrar</button>
        </form>
      </main>
    )
  }

  return (
    <main className="space-y-16 px-5 py-12 md:px-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="display text-5xl">Panel</h1>
          <p className="mt-2 text-ink/60">{name || 'Sesión activa'}</p>
        </div>
        <button
          type="button"
          className={ghost}
          onClick={() => {
            sessionStorage.removeItem('eternal-token')
            setToken('')
          }}
        >
          Salir
        </button>
      </div>

      <section>
        <h2 className="display text-3xl">Pedidos</h2>
        <div className="mt-6 space-y-4">
          {orders.length === 0 && <p className="text-ink/50">Todavía no hay pedidos.</p>}
          {orders.map((order) => (
            <article key={order.id} className="border border-ink/10 bg-paper p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-moss">{order.code}</p>
                  <h3 className="display mt-1 text-2xl">{order.customerName}</h3>
                  <p className="text-sm text-ink/60">
                    {order.customerEmail} · {order.customerPhone}
                  </p>
                  <p className="mt-2 text-sm">{order.items.map((item) => `${item.productName} × ${item.quantity}`).join(' · ')}</p>
                  {order.ceremonyNote && <p className="mt-2 text-sm text-ink/50">{order.ceremonyNote}</p>}
                </div>
                <div className="text-right">
                  <p>{money(order.totalCents)}</p>
                  <select
                    className="mt-2 border border-ink/15 bg-bg px-3 py-2 text-sm"
                    value={order.status}
                    onChange={async (event) => {
                      await api(`/api/admin/orders/${order.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ status: event.target.value }),
                      })
                      await load()
                    }}
                  >
                    {!statuses.includes(order.status as (typeof statuses)[number]) && (
                      <option value={order.status}>{statusLabel[order.status] ?? order.status}</option>
                    )}
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="display text-3xl">Urnas y plantas</h2>
        <div className="mt-6 space-y-3">
          {products.map((product) => (
            <form
              key={`${product.id}-${product.name}-${product.kind}-${product.priceCents}-${product.stock}-${product.active}`}
              className="grid gap-3 border border-ink/10 bg-paper p-4 md:grid-cols-[1.4fr_0.8fr_0.6fr_0.5fr_auto]"
              onSubmit={async (event) => {
                event.preventDefault()
                const form = new FormData(event.currentTarget)
                await api(`/api/admin/products/${product.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({
                    name: form.get('name'),
                    category: form.get('category'),
                    priceCents: Math.round(Number(form.get('price')) * 100),
                    stock: Number(form.get('stock')),
                    active: form.get('active') === 'on',
                    kind: form.get('kind'),
                  }),
                })
                await load()
              }}
            >
              <div>
                <input name="name" defaultValue={product.name} className={field} />
                <select name="kind" defaultValue={product.kind} className={`${field} mt-2`}>
                  <option value="urna">Urna</option>
                  <option value="planta">Planta</option>
                </select>
              </div>
              <input name="category" defaultValue={product.category} className={field} />
              <input name="price" type="number" min={0} defaultValue={product.priceCents / 100} className={field} />
              <input name="stock" type="number" min={0} defaultValue={product.stock} className={field} />
              <div className="flex items-center gap-3">
                <label className="text-sm text-ink/70">
                  <input name="active" type="checkbox" defaultChecked={product.active} className="mr-2" />
                  Visible
                </label>
                <button className={btn}>Guardar</button>
              </div>
            </form>
          ))}
        </div>
      </section>

      <section className="max-w-xl">
        <h2 className="display text-3xl">Impacto</h2>
        <form
          key={`${impact.treesPlanted}-${impact.urnsDonated}-${impact.partnerSites}`}
          className="mt-6 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            await api('/api/admin/settings', {
              method: 'PATCH',
              body: JSON.stringify({
                treesPlanted: Number(form.get('trees')),
                urnsDonated: Number(form.get('urns')),
                partnerSites: Number(form.get('sites')),
              }),
            })
            await load()
          }}
        >
          <label className="block text-sm text-ink/60">
            Árboles plantados
            <input name="trees" type="number" min={0} defaultValue={impact.treesPlanted} className={`${field} mt-1`} />
          </label>
          <label className="block text-sm text-ink/60">
            Urnas donadas
            <input name="urns" type="number" min={0} defaultValue={impact.urnsDonated} className={`${field} mt-1`} />
          </label>
          <label className="block text-sm text-ink/60">
            Predios aliados
            <input name="sites" type="number" min={0} defaultValue={impact.partnerSites} className={`${field} mt-1`} />
          </label>
          <button className={btn}>Actualizar números</button>
        </form>
      </section>
    </main>
  )
}

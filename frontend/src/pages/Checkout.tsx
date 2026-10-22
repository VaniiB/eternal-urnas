import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../cart'
import { api, btn, field, money } from '../lib'

export function Checkout() {
  const cart = useCart()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSending(true)
    setError('')
    try {
      const order = await api<{ code: string; checkoutUrl: string | null }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: form.get('name'),
          customerEmail: form.get('email'),
          customerPhone: form.get('phone'),
          ceremonyNote: form.get('note') || undefined,
          items: cart.items.map((item) => ({
            urnSlug: item.urnSlug,
            plantSlug: item.plantSlug,
            quantity: item.quantity,
          })),
        }),
      })
      cart.clear()
      if (order.checkoutUrl) {
        window.location.href = order.checkoutUrl
        return
      }
      navigate(`/pedido/${order.code}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear el pedido')
      setSending(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <main className="px-5 py-16 md:px-12">
        <p>La cesta está vacía.</p>
        <Link to="/tienda" className="mt-4 inline-block text-moss">
          Ir a la tienda
        </Link>
      </main>
    )
  }

  return (
    <main className="grid gap-12 px-5 py-12 md:grid-cols-[1.1fr_0.9fr] md:px-12">
      <form onSubmit={submit} className="max-w-xl space-y-4">
        <h1 className="display text-5xl">Pedido</h1>
        <p className="text-ink/60">El precio final lo confirma la tienda al reservar el stock.</p>
        <input name="name" required minLength={3} placeholder="Nombre y apellido" className={field} />
        <input name="email" type="email" required placeholder="Email" className={field} />
        <input name="phone" required minLength={6} placeholder="Teléfono" className={field} />
        <textarea name="note" rows={4} placeholder="Nota para la ceremonia (opcional)" className={field} />
        {error && <p className="text-sm text-red-800">{error}</p>}
        <button className={btn} disabled={sending}>
          {sending ? 'Reservando…' : 'Confirmar pedido'}
        </button>
      </form>
      <aside className="h-fit border border-ink/10 bg-paper p-6">
        {cart.items.map((item) => (
          <p key={`${item.urnSlug}-${item.plantSlug}`} className="flex justify-between gap-4 py-2 text-sm">
            <span>
              {item.urnName} con semilla {item.plantName} × {item.quantity}
            </span>
            <span>{money((item.urnPriceCents + item.plantPriceCents) * item.quantity)}</span>
          </p>
        ))}
        <p className="mt-4 border-t border-ink/10 pt-4">Total estimado {money(cart.totalCents)}</p>
      </aside>
    </main>
  )
}

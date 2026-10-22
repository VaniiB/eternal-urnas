import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, money, statusLabel, type Order } from '../lib'

export function OrderPage() {
  const { code } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let stop = false
    let timer = 0
    const load = () => {
      api<Order>(`/api/orders/${code}`)
        .then((next) => {
          if (stop) return
          setOrder(next)
          if (next.status === 'pending_payment') timer = window.setTimeout(load, 4000)
        })
        .catch((reason: Error) => {
          if (!stop) setError(reason.message)
        })
    }
    load()
    return () => {
      stop = true
      window.clearTimeout(timer)
    }
  }, [code])

  if (error) return <main className="px-5 py-16 md:px-12">{error}</main>
  if (!order) return <main className="px-5 py-16 text-ink/50 md:px-12">Buscando el pedido…</main>

  return (
    <main className="px-5 py-12 md:px-12">
      <p className="text-[11px] uppercase tracking-[0.18em] text-moss">{order.code}</p>
      <h1 className="display mt-3 text-5xl">{statusLabel[order.status] ?? order.status}</h1>
      <p className="mt-4 max-w-xl text-ink/70">
        {order.customerName}, reservamos tu pedido.
        {order.status === 'pending_payment'
          ? ' Si el pago online está activo, esta página se actualiza sola cuando Mercado Pago confirma. Si todavía no, coordinamos el pago con vos.'
          : ' Te escribimos a tu email para seguir la ceremonia.'}
      </p>
      <ul className="mt-8 max-w-lg divide-y divide-white/10">
        {order.items.map((item, index) => (
          <li key={`${item.productName}-${index}`} className="flex justify-between py-3 text-sm">
            <span>
              {item.productName} × {item.quantity}
            </span>
            <span>{money(item.unitPriceCents * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4">Total {money(order.totalCents)}</p>
      <Link to="/" className="mt-8 inline-block text-sm text-moss">
        Volver al inicio
      </Link>
    </main>
  )
}

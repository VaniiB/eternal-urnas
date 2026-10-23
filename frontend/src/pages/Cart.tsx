import { Link } from 'react-router-dom'
import { pairKey, useCart } from '../cart'
import { PlantMark } from '../components/PlantMark'
import { UrnView } from '../components/UrnView'
import { btn, money, toneForUrn } from '../lib'

export function CartPage() {
  const cart = useCart()

  return (
    <main className="bg-[var(--page-bg)] px-4 pb-24 text-[var(--page-ink)] sm:px-5 md:px-12">
      <h1 className="pt-10 text-4xl sm:text-5xl md:text-6xl" style={{ fontFamily: 'Playfair Display, serif' }}>
        Cesta
      </h1>
      {cart.items.length === 0 ? (
        <p className="mt-6 text-[var(--page-muted)]">
          Todavía no hay pares.{' '}
          <Link to="/tienda" className="underline">
            Elegí una urna
          </Link>{' '}
          o{' '}
          <Link to="/plantas" className="underline">
            una planta
          </Link>
          .
        </p>
      ) : (
        <>
          <ul className="mx-auto mt-8 max-w-4xl space-y-6 sm:mt-10">
            {cart.items.map((item) => {
              const unit = item.urnPriceCents + item.plantPriceCents
              return (
                <li
                  key={pairKey(item)}
                  className="overflow-hidden border border-[var(--page-line)]"
                  style={{ backgroundColor: toneForUrn(item.urnSlug) }}
                >
                  <div className="border-b border-[var(--page-line)] px-4 py-3 sm:px-5">
                    <p className="text-xs tracking-[0.16em] uppercase text-[var(--page-muted)]">Par · urna + semilla</p>
                    <p className="mt-1 text-xl sm:text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {item.urnName} + {item.plantName}
                    </p>
                  </div>

                  <div className="grid gap-0 sm:grid-cols-2">
                    <div className="flex gap-3 border-b border-[var(--page-line)] p-4 sm:border-r sm:border-b-0 sm:p-5">
                      <div className="h-28 w-24 shrink-0 sm:h-32 sm:w-28">
                        <UrnView slug={item.urnSlug} quality="lite" className="pointer-events-none h-full w-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] tracking-[0.14em] uppercase text-[var(--page-muted)]">Producto 1 · Urna</p>
                        <p className="mt-1 text-lg sm:text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {item.urnName}
                        </p>
                        <Link to={`/tienda/${item.urnSlug}`} className="mt-1 inline-block text-xs underline text-[var(--page-muted)]">
                          Ver urna
                        </Link>
                        <p className="mt-3 text-sm font-semibold">{money(item.urnPriceCents)}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-4 sm:p-5">
                      <div className="aspect-square h-28 w-28 shrink-0 overflow-hidden bg-[var(--page-surface)] sm:h-32 sm:w-32">
                        <PlantMark slug={item.plantSlug} name={item.plantName} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] tracking-[0.14em] uppercase text-[var(--page-muted)]">Producto 2 · Semilla</p>
                        <p className="mt-1 text-lg sm:text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {item.plantName}
                        </p>
                        <Link to={`/plantas/${item.plantSlug}`} className="mt-1 inline-block text-xs underline text-[var(--page-muted)]">
                          Ver planta
                        </Link>
                        <p className="mt-3 text-sm font-semibold">{money(item.plantPriceCents)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-[var(--page-line)] bg-[var(--page-surface)]/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                      <p className="text-sm text-[var(--page-muted)]">
                        Subtotal del par {money(unit)}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs tracking-[0.12em] uppercase text-[var(--page-muted)]">Cantidad</span>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center border border-[var(--page-line)]"
                          onClick={() => cart.setQty(pairKey(item), item.quantity - 1)}
                          aria-label="Quitar uno"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-lg">{item.quantity}</span>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center border border-[var(--page-line)]"
                          onClick={() => cart.setQty(pairKey(item), item.quantity + 1)}
                          aria-label="Agregar uno"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end">
                      <p className="text-xl font-semibold">{money(unit * item.quantity)}</p>
                      <button
                        type="button"
                        className="text-xs tracking-[0.12em] uppercase text-[var(--page-muted)] hover:text-[var(--page-ink)]"
                        onClick={() => cart.setQty(pairKey(item), 0)}
                      >
                        Quitar par
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mx-auto mt-10 flex max-w-4xl flex-col items-center gap-4 border-t border-[var(--page-line)] pt-8 text-center">
            <p className="text-lg sm:text-xl">
              Total estimado <span className="font-semibold">{money(cart.totalCents)}</span>
            </p>
            <Link to="/checkout" className={btn}>
              Continuar
            </Link>
          </div>
        </>
      )}
    </main>
  )
}

import { useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useCart } from '../cart'
import { CompanionPick } from '../components/CompanionPick'
import { PlantCard } from '../components/PlantCard'
import { PlantMark } from '../components/PlantMark'
import { api, btn, money, type Product } from '../lib'

export function PlantPage() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const cart = useCart()
  const [plant, setPlant] = useState<Product | null>(null)
  const [urns, setUrns] = useState<Product[]>([])
  const [others, setOthers] = useState<Product[]>([])
  const [urnSlug, setUrnSlug] = useState(params.get('urna') ?? '')
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setAdded(false)
    setPlant(null)
    api<Product>(`/api/products/${slug}`)
      .then(setPlant)
      .catch((reason: Error) => setError(reason.message))
    api<Product[]>('/api/products?kind=urna')
      .then(setUrns)
      .catch(() => setUrns([]))
    api<Product[]>('/api/products?kind=planta')
      .then((list) => setOthers(list.filter((item) => item.slug !== slug).slice(0, 4)))
      .catch(() => setOthers([]))
  }, [slug])

  useEffect(() => {
    const fromQuery = params.get('urna')
    if (fromQuery && urns.some((item) => item.slug === fromQuery)) setUrnSlug(fromQuery)
  }, [params, urns])

  if (error) {
    return (
      <main className="px-5 py-16 text-center md:px-12">
        <p>{error}</p>
        <Link to="/plantas" className="mt-6 inline-block text-moss">
          Volver a las plantas
        </Link>
      </main>
    )
  }
  if (!plant) return <main className="px-5 py-24 text-center text-ink/50">Cargando…</main>
  if (plant.kind === 'urna') return <Navigate to={`/tienda/${plant.slug}`} replace />

  const urn = urns.find((item) => item.slug === urnSlug)
  const together = urn ? plant.priceCents + urn.priceCents : plant.priceCents

  return (
    <main className="bg-white pb-16 text-[#1c1c1c]">
      <div className="mx-auto max-w-6xl px-5 pt-24 md:px-8">
        <p className="text-xs text-black/45">
          <Link to="/" className="hover:text-black">
            Inicio
          </Link>
          <span> / </span>
          <Link to="/plantas" className="hover:text-black">
            Plantas
          </Link>
          <span> / {plant.name}</span>
        </p>
        <section className="mt-6 grid items-start gap-10 md:grid-cols-2">
          <div className="aspect-square overflow-hidden bg-[#f2f2f2]">
            <PlantMark slug={plant.slug} name={plant.name} className="h-full w-full" />
          </div>
          <div className="md:pt-4">
            <p className="text-xs text-black/45">{plant.category}</p>
            <h1 className="mt-2 text-4xl font-medium tracking-tight md:text-5xl">{plant.name}</h1>
            <p className="mt-4 text-xl font-medium">{money(plant.priceCents)}</p>
            <p className="mt-6 text-base leading-relaxed text-black/75">{plant.blurb}</p>
            <p className="mt-4 text-sm text-black/55">{plant.seed}</p>
          </div>
        </section>
      </div>

      <CompanionPick
        title="La urna que la acompaña"
        note="Esta semilla viaja dentro de la urna que elijas. El pedido guarda las dos juntas."
        items={urns}
        selected={urnSlug}
        onSelect={(next) => {
          setUrnSlug(next)
          setAdded(false)
        }}
        hrefFor={(next) => `/tienda/${next}?planta=${plant.slug}`}
      />

      <div className="mt-4 flex flex-col items-center gap-3">
        <p className="text-sm text-ink/70">
          {urn ? `${plant.name} con ${urn.name} · ${money(together)}` : 'Elegí una urna para cerrar el par'}
        </p>
        <button
          type="button"
          className={btn}
          disabled={!urn || plant.stock < 1 || urn.stock < 1}
          onClick={() => {
            if (!urn) return
            cart.add({
              urnSlug: urn.slug,
              urnName: urn.name,
              urnPriceCents: urn.priceCents,
              plantSlug: plant.slug,
              plantName: plant.name,
              plantPriceCents: plant.priceCents,
            })
            setAdded(true)
          }}
        >
          {added ? 'En la cesta' : 'Sumar urna y semilla'}
        </button>
      </div>

      {others.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pt-16 md:px-8">
          <h2 className="text-[1.7rem] font-medium tracking-tight">También te puede gustar</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {others.map((item) => (
              <PlantCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useCart } from '../cart'
import { CompanionPick } from '../components/CompanionPick'
import { UrnLineup } from '../components/UrnLineup'
import { preloadUrn, UrnView } from '../components/UrnView'
import { api, btn, money, toneForUrn, type Product } from '../lib'

function suggestedPlant(seed: string, plants: Product[]) {
  const text = seed.toLocaleLowerCase('es')
  return plants
    .map((plant) => ({ plant, at: text.indexOf(plant.name.toLocaleLowerCase('es')) }))
    .filter((item) => item.at >= 0)
    .sort((a, b) => a.at - b.at)[0]?.plant
}

export function ProductPage() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const cart = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [plants, setPlants] = useState<Product[]>([])
  const [plantSlug, setPlantSlug] = useState(params.get('planta') ?? '')
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setAdded(false)
    setProduct(null)
    if (slug) preloadUrn(slug)
    api<Product>(`/api/products/${slug}`)
      .then(setProduct)
      .catch((reason: Error) => setError(reason.message))
    api<Product[]>('/api/products?kind=planta')
      .then(setPlants)
      .catch(() => setPlants([]))
  }, [slug])

  useEffect(() => {
    if (!product || plants.length === 0) return
    const fromQuery = params.get('planta')
    if (fromQuery && plants.some((item) => item.slug === fromQuery)) {
      setPlantSlug(fromQuery)
      return
    }
    setPlantSlug(suggestedPlant(product.seed, plants)?.slug || '')
  }, [product, plants, params])

  if (error) {
    return (
      <main className="px-5 py-16 text-center md:px-12">
        <p>{error}</p>
        <Link to="/tienda" className="mt-6 inline-block text-moss">
          Volver a las urnas
        </Link>
      </main>
    )
  }
  if (!product) return <main className="px-5 py-24 text-center text-ink/50">Cargando…</main>
  if (product.kind === 'planta') return <Navigate to={`/plantas/${product.slug}`} replace />

  const plant = plants.find((item) => item.slug === plantSlug)
  const together = plant ? product.priceCents + plant.priceCents : product.priceCents

  return (
    <main>
      <UrnStage
        name={product.name}
        category={product.category}
        slug={product.slug}
        blurb={product.blurb}
        material={product.material}
      />

      <section className="mx-auto grid max-w-5xl gap-8 border-t border-ink/15 px-5 py-16 md:grid-cols-3 md:px-0">
        <Meta title="Material" body={product.material} />
        <Meta title="Sugerencia de semilla" body={product.seed} border />
        <Meta
          title="Precio"
          body={`${money(product.priceCents)} · ${product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}`}
          border
        />
      </section>

      <CompanionPick
        title="La semilla que va adentro"
        note="Elegí la planta de esta urna. En la cesta quedan juntas: esta pieza y esa semilla."
        items={plants}
        selected={plantSlug}
        onSelect={(next) => {
          setPlantSlug(next)
          setAdded(false)
        }}
        hrefFor={(next) => `/plantas/${next}?urna=${product.slug}`}
      >
        <p className="text-sm text-[#173E3A]/80">
          {plant ? `${product.name} con semilla ${plant.name} · ${money(together)}` : 'Elegí una semilla para cerrar el par'}
        </p>
        <button
          type="button"
          className={btn}
          disabled={product.stock < 1 || !plant || plant.stock < 1}
          onClick={() => {
            if (!plant) return
            cart.add({
              urnSlug: product.slug,
              urnName: product.name,
              urnPriceCents: product.priceCents,
              plantSlug: plant.slug,
              plantName: plant.name,
              plantPriceCents: plant.priceCents,
            })
            setAdded(true)
          }}
        >
          {added ? 'En la cesta' : 'Sumar urna y semilla'}
        </button>
      </CompanionPick>

      <UrnLineup title="La colección" />
    </main>
  )
}

function UrnStage({
  name,
  category,
  slug,
  blurb,
  material,
}: {
  name: string
  category: string
  slug: string
  blurb: string
  material: string
}) {
  const track = useRef<HTMLElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) {
      setProgress(1)
      return
    }
    let frame = 0
    const update = () => {
      const el = track.current
      if (!el) return
      const distance = el.offsetHeight - window.innerHeight
      const next = distance <= 0 ? 0 : Math.min(1, Math.max(0, (window.scrollY - el.offsetTop) / distance))
      setProgress(next)
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const titleLift = progress * 12
  const urnRise = progress * 22
  const story = Math.min(1, Math.max(0, (progress - 0.22) / 0.5))

  return (
    <section ref={track} className="relative h-[160vh] sm:h-[180vh]" style={{ backgroundColor: toneForUrn(slug) }}>
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="hero-grain" aria-hidden />
        <h1
          className="pointer-events-none absolute top-[8%] left-1/2 z-0 w-[96%] text-center text-[18vw] leading-[0.82] text-[#173E3A] uppercase sm:top-[10%] sm:text-[14vw] md:text-[10vw]"
          style={{
            fontFamily: 'Playfair Display, serif',
            transform: `translate(-50%, -${titleLift}vh)`,
          }}
        >
          {name}
        </h1>
        <p
          className="pointer-events-none absolute top-[28%] left-1/2 z-20 w-[min(36rem,88vw)] rounded-sm bg-[#F8F5EF]/88 px-3 py-2 text-center text-base leading-relaxed text-[#173E3A] sm:top-[30%] sm:px-5 sm:py-3 sm:text-xl md:text-[1.65rem]"
          style={{
            fontFamily: 'Playfair Display, serif',
            opacity: story,
            transform: `translate(-50%, ${(1 - story) * 36}px)`,
          }}
        >
          {blurb}
        </p>
        <div
          className="pointer-events-none absolute left-1/2 z-10 h-[100vh] w-[min(100vw,62rem)] sm:h-[125vh]"
          style={{
            bottom: `calc(-32vh + ${urnRise}vh)`,
            transform: 'translateX(-50%)',
          }}
        >
          <UrnView slug={slug} quality="full" className="h-full w-full" />
        </div>
        <div
          className="absolute inset-x-0 top-[46%] z-20 flex items-start justify-between gap-3 px-3 sm:top-[48%] sm:gap-8 sm:px-6 md:px-20"
          style={{ opacity: Math.max(0.35, 1 - story * 0.55) }}
        >
          <p className="rounded-sm bg-[#F8F5EF]/8 px-2 py-1 text-sm text-[#173E3A] sm:px-3 sm:text-2xl md:text-4xl" style={{ fontFamily: 'Playfair Display, serif' }}>
            {category}
          </p>
          <p className="max-w-[9rem] rounded-sm bg-[#F8F5EF]/8 px-2 py-1 text-right text-sm text-[#173E3A] sm:max-w-[16rem] sm:px-3 sm:text-2xl md:text-4xl" style={{ fontFamily: 'Playfair Display, serif' }}>
            {material}
          </p>
        </div>
      </div>
    </section>
  )
}

function Meta({ title, body, border = false }: { title: string; body: string; border?: boolean }) {
  return (
    <div className={border ? 'md:border-l md:border-ink/15 md:pl-8' : ''}>
      <p className="text-xs font-medium tracking-[0.16em] uppercase text-moss">{title}</p>
      <p className="mt-3 text-lg leading-relaxed">{body}</p>
    </div>
  )
}

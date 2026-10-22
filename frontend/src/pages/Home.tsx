import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlantMark } from '../components/PlantMark'
import { UrnView } from '../components/UrnView'
import { api, money, toneForUrn, urnTone, type Product } from '../lib'

function urnScale(steps: number, center: number) {
  const distance = Math.min(Math.abs(steps), 1)
  const side = 0.88
  const middle = Math.max(center, side + 0.38)
  return middle - distance * (middle - side)
}

function urnShift(steps: number, edgeGap: number, center: number, box: number) {
  const distance = Math.abs(steps)
  const whole = Math.floor(distance)
  let x = 0
  for (let step = 0; step < whole; step += 1) {
    x += (box * urnScale(step, center) + box * urnScale(step + 1, center)) / 2 + edgeGap
  }
  const fraction = distance - whole
  x += fraction * ((box * urnScale(whole, center) + box * urnScale(whole + 1, center)) / 2 + edgeGap)
  return steps < 0 ? -x : x
}

function mixColor(from: string, to: string, amount: number) {
  const read = (hex: string) => [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16))
  const mixed = read(from).map((channel, index) => Math.round(channel + (read(to)[index] - channel) * amount))
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

export function Home() {
  const [urns, setUrns] = useState<Product[]>([])
  const [plants, setPlants] = useState<Product[]>([])
  const [email, setEmail] = useState('')
  const [noted, setNoted] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hover, setHover] = useState<string | null>(null)
  const [width, setWidth] = useState(() => window.innerWidth)
  const [height, setHeight] = useState(() => window.innerHeight)
  const drag = useRef({ x: 0, start: 0, moved: false, active: false })
  const tones = urnTone
  const mobile = width < 640
  const tablet = width >= 640 && width < 900
  const urnBox = mobile ? Math.round(Math.min(260, width * 0.68)) : tablet ? 360 : 520
  const urnHeight = Math.round(urnBox * (mobile ? 1.35 : tablet ? 1.38 : 1.38))

  useEffect(() => {
    const onResize = () => {
      setWidth(window.innerWidth)
      setHeight(window.innerHeight)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    api<Product[]>('/api/products?kind=urna')
      .then(setUrns)
      .catch(() => setUrns([]))
    api<Product[]>('/api/products?kind=planta')
      .then(setPlants)
      .catch(() => setPlants([]))
  }, [])

  const uniqueUrns = urns.filter((product) => !['combo', 'humus', 'rosita', 'linterna'].includes(product.slug))
  const popular = [...uniqueUrns.slice(0, 2), ...plants.slice(0, 2)]
  const combo = urns.find((product) => product.slug === 'combo') ?? uniqueUrns[0]
  const featuredPlant = plants.find((product) => product.slug === 'lavanda') ?? plants[0]
  const sidePlants = plants.filter((product) => product.slug !== featuredPlant?.slug).slice(0, 2)
  const flowers = plants.filter((product) => !product.category.toLocaleLowerCase('es').includes('árbol'))
  const trees = plants.filter((product) => product.category.toLocaleLowerCase('es').includes('árbol'))
  const edgeGap = mobile ? -Math.round(urnBox * 0.08) : tablet ? 12 : Math.max(20, Math.min(40, (width - 1100) / 14))
  const heroH = Math.max(height, mobile ? 520 : 640)
  const nameBlock = mobile ? 48 : tablet ? 64 : 80
  const bottomPad = mobile ? 10 : 18
  const centerScale = Math.min(
    mobile ? 1.12 : tablet ? 1.28 : 1.42,
    Math.max(mobile ? 1.0 : tablet ? 1.12 : 1.24, (heroH - nameBlock - bottomPad * 2) / urnHeight),
  )
  const stackH = nameBlock + Math.round(urnHeight * centerScale)
  const topPad = Math.max(mobile ? 48 : 12, Math.round((heroH - stackH) / 2))
  const gap = (urnBox * urnScale(0, centerScale) + urnBox * urnScale(1, centerScale)) / 2 + edgeGap
  const count = uniqueUrns.length
  const cursor = count === 0 ? 0 : -offset / gap
  const toneFrom = Math.floor(cursor)
  const toneMix = cursor - toneFrom
  const toneIndex = ((toneFrom % count) + count) % count
  const toneNext = (toneIndex + 1) % count
  const stageFallback = '#F8F5EF'
  const stageColor =
    count === 0
      ? stageFallback
      : mixColor(tones[uniqueUrns[toneIndex].slug] ?? stageFallback, tones[uniqueUrns[toneNext].slug] ?? stageFallback, toneMix)

  return (
    <main className="bg-[var(--page-bg)] text-[var(--page-ink)]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
      <section
        className="relative h-svh cursor-grab overflow-hidden active:cursor-grabbing"
        style={{
          touchAction: 'none',
          backgroundColor: stageColor,
          backgroundImage:
            'radial-gradient(ellipse at 50% 38%, rgba(255,255,255,0.55), transparent 62%), linear-gradient(180deg, rgba(255,255,255,0.28), transparent 46%, rgba(90,70,50,0.07))',
          transition: drag.current.active ? 'none' : 'background-color 0.45s ease',
        }}
        onPointerDown={(event) => {
          if ((event.target as Element | null)?.closest?.('a,button')) return
          drag.current = { x: event.clientX, start: offset, moved: false, active: true }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (!drag.current.active) return
          const dx = event.clientX - drag.current.x
          if (Math.abs(dx) > 8) drag.current.moved = true
          setOffset(drag.current.start + dx)
        }}
        onPointerUp={() => {
          if (!drag.current.active) return
          drag.current.active = false
          setOffset((value) => Math.round(value / gap) * gap)
        }}
        onPointerCancel={() => {
          if (!drag.current.active) return
          drag.current.active = false
          setOffset((value) => Math.round(value / gap) * gap)
        }}
      >
        <div className="hero-grain" aria-hidden />
        <button
          type="button"
          aria-label="Anterior"
          className="absolute top-1/2 left-1.5 z-40 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--page-gold)] bg-[var(--page-surface)]/90 text-base text-[var(--page-ink)] sm:left-4 sm:h-12 sm:w-12 sm:text-2xl"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => setOffset((value) => value + gap)}
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Siguiente"
          className="absolute top-1/2 right-1.5 z-40 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--page-gold)] bg-[var(--page-surface)]/90 text-base text-[var(--page-ink)] sm:right-4 sm:h-12 sm:w-12 sm:text-2xl"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => setOffset((value) => value - gap)}
        >
          →
        </button>

        <div className="absolute inset-0 z-10">
          {uniqueUrns.map((product, i) => {
            let place = i + offset / gap
            place = ((place % count) + count) % count
            if (place >= count / 2) place -= count
            const steps = Math.abs(place)
            if (steps > (mobile ? 0.95 : 1.2)) return null
            const x = urnShift(place, edgeGap, centerScale, urnBox)
            const scale = urnScale(place, centerScale) * (mobile && steps > 0.35 ? 0.92 : 1)
            const rot = Math.sign(place) * Math.min(steps, 1) * (mobile ? 4 : 8)
            const centered = steps < 0.35
            const boxW = Math.round(urnBox * scale)
            const boxH = Math.round(urnHeight * scale)
            return (
              <Link
                key={product.slug}
                to={`/tienda/${product.slug}`}
                data-cursor="Ver urna"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  if (drag.current.moved) event.preventDefault()
                }}
                onPointerEnter={() => setHover(product.slug)}
                onPointerLeave={() => setHover((value) => (value === product.slug ? null : value))}
                className="absolute top-0 left-1/2 flex flex-col items-center"
                style={{
                  top: topPad,
                  width: boxW,
                  transform: `translateX(calc(-50% + ${x}px))`,
                  zIndex: centered ? 30 : 20 - Math.round(steps * 4),
                }}
              >
                <p
                  className="pointer-events-none mb-1 w-full truncate text-center leading-none tracking-wide text-[#173E3A] uppercase sm:mb-2"
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: centered ? (mobile ? '1.85rem' : tablet ? '2.8rem' : '3.85rem') : mobile ? '0.95rem' : tablet ? '1.35rem' : '1.85rem',
                    height: nameBlock - 8,
                    transform: `translate(${place > 0.2 ? (mobile ? 18 : 60) : place < -0.2 ? (mobile ? -8 : -16) : 0}px, ${mobile ? 12 : 24}px)`,
                  }}
                >
                  {product.name}
                </p>
                <div
                  className="block"
                  style={{
                    width: boxW,
                    height: boxH,
                    transform: `translateY(${centered ? (mobile ? -24 : -48) : mobile ? -12 : -28}px) rotate(${rot}deg)`,
                  }}
                >
                  <UrnView
                    slug={product.slug}
                    spin={hover === product.slug && !drag.current.active}
                    className="pointer-events-none h-full w-full"
                  />
                </div>
              </Link>
            )
          })}
        </div>

      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <h2 className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl" style={{ fontFamily: 'Playfair Display, serif' }}>
          Explorá por categoría
        </h2>
        <div className="mt-8 grid gap-6 md:mt-12 md:grid-cols-[180px_1fr] md:gap-8">
          <ul className="-mx-4 flex gap-5 overflow-x-auto px-4 text-sm whitespace-nowrap md:mx-0 md:block md:space-y-4 md:overflow-visible md:px-0 md:whitespace-normal">
            <li>
              <Link to="/tienda" className="hover:text-[#70908B]">
                Urnas
              </Link>
            </li>
            <li>
              <Link to="/plantas?tipo=flores" className="hover:text-[#70908B]">
                Flores
              </Link>
            </li>
            <li>
              <Link to="/plantas?tipo=arboles" className="hover:text-[#70908B]">
                Árboles
              </Link>
            </li>
            <li>
              <Link to="/asistente" className="hover:text-[#70908B]">
                Ceremonia
              </Link>
            </li>
          </ul>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <Link
              to="/tienda"
              className="relative flex min-h-52 items-end p-5 text-[#173E3A] sm:min-h-64 sm:p-6 md:row-span-2"
              style={{ backgroundColor: toneForUrn('bruma') }}
            >
              <div className="pointer-events-none absolute inset-0">
                <UrnView slug="bruma" className="h-full w-full" />
              </div>
              <span className="relative text-2xl sm:text-3xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                Urnas
              </span>
            </Link>
            <CategoryTile to="/plantas?tipo=flores" title="Flores" image={flowers[0]?.slug} />
            <CategoryTile to="/plantas?tipo=arboles" title="Árboles" image={trees[0]?.slug} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <h2 className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl" style={{ fontFamily: 'Playfair Display, serif' }}>
          Elegidas
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-4">
          {popular.map((product) => (
            <Link
              key={product.slug}
              to={product.kind === 'urna' ? `/tienda/${product.slug}` : `/plantas/${product.slug}`}
              className="relative flex min-h-56 flex-col justify-end overflow-hidden p-3 text-[#173E3A] sm:min-h-80 sm:p-5 md:min-h-96"
              style={{
                backgroundColor: product.kind === 'urna' ? toneForUrn(product.slug) : '#E2E8F1',
              }}
            >
              {product.kind === 'urna' ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center pt-2 pb-14">
                  <UrnView slug={product.slug} className="h-full w-full scale-110" />
                </div>
              ) : (
                <PlantMark
                  slug={product.slug}
                  name={product.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className={`relative ${product.kind === 'planta' ? 'bg-[#FDFBF8]/85 px-2 py-1.5 sm:px-3 sm:py-2' : ''}`}>
                <p className="text-base sm:text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {product.name}
                </p>
                <p className="mt-1 text-xs font-semibold sm:text-sm">{money(product.priceCents)}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/tienda" className="inline-flex rounded-full bg-[#274C4A] px-6 py-2.5 text-sm text-white">
            Ver la tienda
          </Link>
        </div>
      </section>

      {combo && (
        <section className="mx-auto grid max-w-6xl items-center gap-5 px-4 py-12 sm:gap-8 sm:px-6 sm:py-16 md:grid-cols-2">
          <div className="p-5 sm:p-6" style={{ backgroundColor: toneForUrn(combo.slug) }}>
            <div className="h-56 sm:h-80">
              <UrnView slug={combo.slug} className="h-full w-full" />
            </div>
            <h2 className="mt-5 text-2xl sm:mt-6 sm:text-3xl" style={{ fontFamily: 'Playfair Display, serif' }}>
              {combo.name}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#274C4A]/75">{combo.blurb}</p>
            <p className="mt-4 font-semibold">{money(combo.priceCents)}</p>
            <Link to={`/tienda/${combo.slug}`} className="mt-5 inline-flex rounded-full bg-[#274C4A] px-5 py-2 text-sm text-white">
              Ver este conjunto
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 self-stretch sm:gap-4 md:grid-cols-1 md:grid-rows-2">
            {sidePlants.map((plant) => (
              <Link
                key={plant.slug}
                to={`/plantas/${plant.slug}`}
                className="relative flex min-h-40 items-end overflow-hidden sm:min-h-48 md:min-h-0"
                data-cursor="Ver planta"
              >
                <PlantMark
                  slug={plant.slug}
                  name={plant.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="relative m-2 bg-[#FDFBF8]/90 px-2 py-2 text-[#173E3A] sm:m-4 sm:px-4 sm:py-3">
                  <p className="text-lg sm:text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {plant.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold sm:text-sm">{money(plant.priceCents)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featuredPlant && (
        <section className="mx-auto grid max-w-6xl gap-3 px-4 pb-12 sm:gap-4 sm:px-6 sm:pb-16 md:grid-cols-[1.4fr_1fr]">
          <Link to={`/plantas/${featuredPlant.slug}`} className="relative flex min-h-56 items-end overflow-hidden bg-[#274C4A] p-5 text-white sm:min-h-80 sm:p-8">
            <img src={`/plants/${featuredPlant.slug}.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
            <span className="relative text-3xl sm:text-4xl" style={{ fontFamily: 'Playfair Display, serif' }}>
              {featuredPlant.name}
            </span>
          </Link>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-1">
            {plants
              .filter((plant) => plant.slug !== featuredPlant.slug)
              .slice(0, 2)
              .map((plant) => (
                <Link key={plant.slug} to={`/plantas/${plant.slug}`} className="relative min-h-28 overflow-hidden bg-[#EEF1F0] sm:min-h-36">
                  <img src={`/plants/${plant.slug}.jpg`} alt={plant.name} className="h-full w-full object-cover" />
                </Link>
              ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-center text-3xl sm:text-4xl" style={{ fontFamily: 'Playfair Display, serif' }}>
          Para la ceremonia
        </h2>
        <div className="mt-8 grid gap-8 sm:mt-12 md:grid-cols-3">
          {[
            ['La urna vuelve a la tierra', 'Está hecha para biodegradarse. No queda un objeto de más.'],
            ['La semilla va adentro', 'Flores o árboles. Se elige cuál crece con esa pieza.'],
            ['El pedido las guarda juntas', 'Queda escrito qué semilla viaja con cuál urna.'],
          ].map(([title, text]) => (
            <article key={title} className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E4F1E1] text-lg text-[#274C4A] sm:h-14 sm:w-14 sm:text-xl">
                ✦
              </span>
              <h3 className="mt-4 text-lg sm:text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#274C4A]/70">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#E4F1E1] px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl sm:text-4xl" style={{ fontFamily: 'Playfair Display, serif' }}>
            Recibí novedades
          </h2>
          <p className="mt-3 text-sm text-[#274C4A]/75">Piezas nuevas y semillas de estación.</p>
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              const address = email.trim()
              if (!address) return
              setNoted(true)
              window.location.href = `mailto:vaniibalbastro@gmail.com?subject=${encodeURIComponent('Novedades Eternal')}&body=${encodeURIComponent(address)}`
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Tu correo"
              className="flex-1 border border-[#274C4A]/15 bg-white px-4 py-3 text-sm outline-none"
            />
            <button type="submit" className="rounded-full bg-[#274C4A] px-6 py-3 text-sm text-white">
              Anotarme
            </button>
          </form>
          {noted && <p className="mt-3 text-sm">Se abre el correo para dejar tu dirección.</p>}
        </div>
      </section>
    </main>
  )
}

function CategoryTile({ to, title, image }: { to: string; title: string; image?: string }) {
  return (
    <Link to={to} className="relative flex min-h-32 items-end overflow-hidden bg-[#E2E8F1] p-4 text-[#274C4A] sm:min-h-40 sm:p-5">
      {image && <img src={`/plants/${image}.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <span className="relative bg-[#FDFBF8]/85 px-2 py-1 text-xl sm:px-3 sm:text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>
        {title}
      </span>
    </Link>
  )
}

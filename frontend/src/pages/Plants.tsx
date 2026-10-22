import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PlantCard } from '../components/PlantCard'
import { api, type Product } from '../lib'

const filters = ['Todas', 'Flores', 'Árboles'] as const
type Filter = (typeof filters)[number]
type Sort = 'destacadas' | 'precio-asc' | 'precio-desc' | 'az'

const featuredSlugs = ['lavanda', 'rosa-eterna', 'jacaranda', 'girasol', 'ceibo', 'jazmin']

function groupOf(category: string) {
  return category.toLocaleLowerCase('es').includes('árbol') ? 'Árboles' : 'Flores'
}

export function Plants() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState('')
  const [params] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('Todas')
  const [sort, setSort] = useState<Sort>('destacadas')

  useEffect(() => {
    const tipo = params.get('tipo')
    if (tipo === 'flores') setFilter('Flores')
    if (tipo === 'arboles') setFilter('Árboles')
  }, [params])

  useEffect(() => {
    api<Product[]>('/api/products?kind=planta')
      .then(setProducts)
      .catch((reason: Error) => setError(reason.message))
  }, [])

  const featured = featuredSlugs
    .map((slug) => products?.find((item) => item.slug === slug))
    .filter((item): item is Product => Boolean(item))

  const visible = useMemo(() => {
    const list = (products ?? []).filter((item) => filter === 'Todas' || groupOf(item.category) === filter)
    const sorted = [...list]
    if (sort === 'precio-asc') sorted.sort((a, b) => a.priceCents - b.priceCents)
    if (sort === 'precio-desc') sorted.sort((a, b) => b.priceCents - a.priceCents)
    if (sort === 'az') sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    return sorted
  }, [products, filter, sort])

  const cover = (group: Filter) => products?.find((item) => groupOf(item.category) === group)

  return (
    <main className="bg-white pt-20 pb-20 text-[#1c1c1c]">
      <p className="bg-[#f3f3f3] px-5 py-2.5 text-center text-[13px]">
        Elegí la semilla acá. Viaja dentro de la urna que elijas.
      </p>

      <section className="relative h-[46vh] min-h-[300px] overflow-hidden bg-[#e7e2da]">
        <img src="/plants/lavanda.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <p className="text-xs tracking-[0.22em] uppercase">Semillas para la ceremonia</p>
          <h1 className="mt-3 text-5xl font-medium tracking-tight md:text-7xl">Plantas</h1>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-14 md:px-8">
        <h2 className="text-[1.7rem] font-medium tracking-tight">Más elegidas</h2>
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
          {featured.map((product) => (
            <PlantCard key={product.slug} product={product} className="w-[240px] shrink-0" />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-16 md:px-8">
        <h2 className="text-[1.7rem] font-medium tracking-tight">Categorías</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(['Flores', 'Árboles'] as const).map((group) => {
            const photo = cover(group)
            return (
              <button
                key={group}
                type="button"
                onClick={() => {
                  setFilter(group)
                  document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="relative h-64 overflow-hidden bg-[#eceae6] text-left text-white md:h-80"
              >
                {photo && (
                  <img src={`/plants/${photo.slug}.jpg`} alt="" className="h-full w-full object-cover" />
                )}
                <span className="absolute inset-0 bg-black/25" />
                <span className="absolute inset-0 flex items-center justify-center text-3xl font-medium tracking-tight">
                  {group}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-6xl px-5 pt-16 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <h2 className="text-[1.7rem] font-medium tracking-tight">Todas las semillas</h2>
            <div className="mt-3 flex gap-2">
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`px-3 py-1.5 text-xs ${filter === item ? 'bg-[#1c1c1c] text-white' : 'bg-[#f3f3f3] text-[#333]'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <label className="text-sm text-black/60">
            Ordenar por{' '}
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              className="bg-transparent text-[#1c1c1c] outline-none"
            >
              <option value="destacadas">Destacadas</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="az">A - Z</option>
            </select>
          </label>
        </div>

        {error && <p className="mt-6 text-red-800">{error}</p>}
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((product) => (
            <PlantCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <p className="mx-auto mt-16 max-w-3xl px-5 text-center text-xs leading-relaxed text-black/40">
        Fotos de Pexels: Adeniuso Gomes, Andy Lee, Astrid, Carlos Torres, Cast Pics, Cigdem Ersen, Emre Atesoglu,
        Ishahid Sultan, Lan Nguyen Tran, Palancky, Paolo Sanchez, Photo Share07, Pua Tresia, Renkgezgini,
        Sergey Korolev y Shyam Srivastava.
      </p>
    </main>
  )
}

import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { UrnView } from '../components/UrnView'
import { api, money, toneForUrn, type Product } from '../lib'

export function Shop() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('Todas')

  useEffect(() => {
    api<Product[]>('/api/products?kind=urna')
      .then(setProducts)
      .catch((reason: Error) => setError(reason.message))
  }, [])

  const unique = products?.filter((item) => item.slug !== 'combo') ?? []
  const categories = ['Todas', ...new Set(unique.map((item) => item.category))]
  const visible = unique.filter((item) => filter === 'Todas' || item.category === filter)

  return (
    <main className="px-5 pb-8 md:px-12">
      <h1 className="display pt-8 text-center text-4xl uppercase leading-none text-moss sm:text-6xl md:text-8xl">Urnas</h1>
      <p className="mx-auto mt-6 max-w-xl text-center text-lg text-ink/75">
        Elegí la pieza. En la ficha asociás la semilla que va a crecer adentro.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`px-4 py-2 text-xs tracking-[0.16em] uppercase ${filter === item ? 'bg-moss text-bg' : 'text-ink/70'}`}
          >
            {item}
          </button>
        ))}
      </div>
      {error && <p className="mt-6 text-center text-red-800">{error}</p>}
      <div className="mx-auto mt-16 grid max-w-6xl gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {visible?.map((product) => (
          <Link
            key={product.slug}
            to={`/tienda/${product.slug}`}
            className="flex flex-col items-center p-6 text-center text-[#173E3A]"
            style={{ backgroundColor: toneForUrn(product.slug) }}
            data-cursor="Ver urna"
          >
            <UrnView slug={product.slug} className="pointer-events-none h-64 w-56" />
            <p className="mt-6 text-xs tracking-[0.16em] uppercase text-[#173E3A]/70">{product.category}</p>
            <h2 className="mt-2 text-2xl uppercase sm:text-4xl" style={{ fontFamily: 'Playfair Display, serif' }}>
              {product.name}
            </h2>
            <p className="mt-2 text-sm font-semibold">{money(product.priceCents)}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}

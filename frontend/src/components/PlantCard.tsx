import { Link } from 'react-router-dom'
import { money, type Product } from '../lib'
import { PlantMark } from './PlantMark'

export function PlantCard({ product, className = '' }: { product: Product; className?: string }) {
  return (
    <Link to={`/plantas/${product.slug}`} className={`group block ${className}`} data-cursor="Ver planta">
      <div className="aspect-square overflow-hidden bg-[#f2f2f2]">
        <PlantMark
          slug={product.slug}
          name={product.name}
          className="h-full w-full transition duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <p className="mt-3 text-sm leading-snug text-[#222]">{product.name}</p>
      <p className="mt-1 text-sm font-medium text-[#111]">{money(product.priceCents)}</p>
      <p className="mt-1 text-xs text-black/45">{product.category}</p>
    </Link>
  )
}

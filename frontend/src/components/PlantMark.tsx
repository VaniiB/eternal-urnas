import { useState } from 'react'

export function PlantMark({
  slug,
  name,
  className = '',
  priority = false,
}: {
  slug: string
  name: string
  className?: string
  priority?: boolean
}) {
  const [ok, setOk] = useState(false)
  return (
    <div className={`overflow-hidden bg-[#d7e0e6] ${className}`}>
      <picture>
        <source srcSet={`/plants/${slug}.webp`} type="image/webp" />
        <img
          src={`/plants/${slug}.jpg`}
          alt={name}
          width={800}
          height={800}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'low'}
          onLoad={() => setOk(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${ok ? 'opacity-100' : 'opacity-0'}`}
        />
      </picture>
    </div>
  )
}

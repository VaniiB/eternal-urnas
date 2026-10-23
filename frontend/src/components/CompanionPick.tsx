import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { money, toneForUrn, type Product } from '../lib'
import { PlantMark } from './PlantMark'
import { UrnView } from './UrnView'

export function CompanionPick({
  title,
  note,
  items,
  selected,
  onSelect,
  hrefFor,
  children,
}: {
  title: string
  note: string
  items: Product[]
  selected: string
  onSelect: (slug: string) => void
  hrefFor: (slug: string) => string
  children?: ReactNode
}) {
  return (
    <section className="relative overflow-hidden px-5 py-14 md:px-12" style={{ backgroundColor: '#E8EFEA' }}>
      <div className="hero-grain opacity-40" aria-hidden />
      <h2
        className="relative text-center text-4xl uppercase leading-none text-[#173E3A] md:text-6xl"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        {title}
      </h2>
      <p className="relative mx-auto mt-4 max-w-xl text-center text-base text-[#173E3A]/80 md:text-lg">{note}</p>
      <div className="relative mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const on = item.slug === selected
          return (
            <article
              key={item.slug}
              className={`rounded-sm px-3 py-4 text-center ${on ? 'ring-2 ring-[#173E3A]' : 'ring-1 ring-[#173E3A]/15'}`}
              style={{
                backgroundColor: item.kind === 'urna' ? toneForUrn(item.slug) : on ? '#F8F5EF' : '#FDFBF8',
              }}
            >
              <button type="button" className="w-full" onClick={() => onSelect(item.slug)} data-cursor="Elegir">
                {item.kind === 'planta' ? (
                  <div className="mx-auto aspect-square w-full max-w-[14rem] overflow-hidden bg-[#f2f2f2]">
                    <PlantMark slug={item.slug} name={item.name} className="h-full w-full" />
                  </div>
                ) : (
                  <UrnView slug={item.slug} quality="lite" className="pointer-events-none mx-auto h-40 w-40" />
                )}
                <p
                  className="mt-4 text-2xl leading-tight text-[#173E3A] uppercase md:text-3xl"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {item.name}
                </p>
                <p className="mt-2 text-sm text-ink/70">{money(item.priceCents)}</p>
                <p className="mt-1 text-[11px] tracking-[0.14em] uppercase text-moss">{item.category}</p>
              </button>
              <Link to={hrefFor(item.slug)} className="mt-3 inline-block text-xs tracking-[0.14em] uppercase text-ink/55" data-cursor="Ver">
                Ver ficha
              </Link>
            </article>
          )
        })}
      </div>
      {children ? (
        <div className="relative mx-auto mt-12 flex w-full max-w-6xl flex-col items-center justify-center gap-3 text-center">
          {children}
        </div>
      ) : null}
    </section>
  )
}

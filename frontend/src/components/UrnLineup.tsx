import { Link } from 'react-router-dom'
import { toneForUrn } from '../lib'
import { UrnView } from './UrnView'

const lineup = [
  { slug: 'raiz', name: 'Raíz' },
  { slug: 'bruma', name: 'Bruma' },
  { slug: 'cauce', name: 'Cauce' },
  { slug: 'carton', name: 'Arena' },
] as const

/** Composición de la colección actual (reemplaza el render viejo de brand). */
export function UrnLineup({ title = 'La colección' }: { title?: string }) {
  return (
    <section className="px-5 py-16 md:px-12">
      <h2
        className="text-center text-3xl uppercase leading-none text-moss sm:text-5xl md:text-6xl"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-center text-sm text-ink/65 md:text-base">
        Raíz, Bruma, Cauce y Arena — las piezas actuales, listas para elegir.
      </p>
      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {lineup.map((item) => (
          <Link
            key={item.slug}
            to={`/tienda/${item.slug}`}
            className="flex flex-col items-center rounded-sm p-4 text-center text-[#173E3A] transition hover:brightness-[0.98]"
            style={{ backgroundColor: toneForUrn(item.slug) }}
            data-cursor="Ver urna"
          >
            <UrnView slug={item.slug} quality="lite" className="pointer-events-none h-44 w-full sm:h-52" />
            <p className="mt-3 text-xl uppercase md:text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>
              {item.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}

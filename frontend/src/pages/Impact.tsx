import { useEffect, useState } from 'react'
import { api, type Impact } from '../lib'

const labels: { key: keyof Impact; label: string }[] = [
  { key: 'treesPlanted', label: 'Árboles plantados' },
  { key: 'urnsDonated', label: 'Urnas donadas' },
  { key: 'partnerSites', label: 'Predios aliados' },
]

export function ImpactPage() {
  const [impact, setImpact] = useState<Impact | null>(null)

  useEffect(() => {
    api<Impact>('/api/impact').then(setImpact).catch(() => setImpact(null))
  }, [])

  return (
    <main className="px-5 pb-24 md:px-12">
      <h1 className="display mt-10 text-3xl sm:text-5xl">Impacto</h1>
      <p className="mt-4 max-w-xl text-ink/70">
        Cada urna que vuelve a la tierra suma acá. Los números salen de la base y se actualizan desde el panel.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {labels.map((item) => (
          <div key={item.key} className="border-t border-moss/40 pt-6">
            <p className="display text-5xl text-moss">{impact ? impact[item.key].toLocaleString('es-AR') : '—'}</p>
            <p className="mt-2 text-sm">{item.label}</p>
          </div>
        ))}
      </div>
    </main>
  )
}

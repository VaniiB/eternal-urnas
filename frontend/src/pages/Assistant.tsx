import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, btn, field, type Ceremony } from '../lib'

export function Assistant() {
  const [result, setResult] = useState<Ceremony | null>(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const context = String(new FormData(event.currentTarget).get('context') || '')
    setSending(true)
    setError('')
    try {
      setResult(await api<Ceremony>('/api/ceremony', { method: 'POST', body: JSON.stringify({ context }) }))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo sugerir')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="display text-3xl sm:text-5xl">Asistente de ceremonia</h1>
      <p className="mt-3 text-ink/70">
        Contá el vínculo, el lugar y el tono. Recibís una urna, un texto y un checklist. Sin apuro de venta.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <textarea
          name="context"
          required
          minLength={8}
          rows={5}
          className={field}
          placeholder="Ej: una despedida íntima en el jardín de la familia, pocos, con un árbol"
          defaultValue="Una ceremonia íntima en el jardín, para la familia, con un árbol nativo"
        />
        {error && <p className="text-sm text-red-800">{error}</p>}
        <button className={btn} disabled={sending}>
          {sending ? 'Pensando…' : 'Sugerir'}
        </button>
      </form>
      {result && (
        <section className="mt-10 space-y-6 border-t border-ink/10 pt-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-moss">Urna sugerida</p>
            <h2 className="display mt-2 text-4xl">{result.product.name}</h2>
            <p className="mt-2 text-ink/70">{result.product.blurb}</p>
            <Link to={`/tienda/${result.product.slug}`} className="mt-3 inline-block text-sm text-moss">
              Ver esta urna
            </Link>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-moss">Texto memorial</p>
            <p className="mt-2 leading-relaxed">{result.memorial}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-moss">Checklist</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink/80">
              {result.checklist.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  )
}

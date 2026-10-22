import { Router } from 'express'
import { z } from 'zod'
import { env } from '../env.js'
import { pool } from '../db.js'

export const ceremony = Router()
export const impact = Router()

type Product = { slug: string; name: string; category: string; blurb: string; material: string; seed: string }

ceremony.post('/', async (req, res, next) => {
  const parsed = z.object({ context: z.string().trim().min(8, 'Contame un poco más').max(800) }).safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Texto inválido' })
    return
  }
  try {
    const result = await pool.request().query<Product>(`
      SELECT Slug AS slug, Name AS name, Category AS category, Blurb AS blurb, Material AS material, Seed AS seed
      FROM Products WHERE Active = 1 AND Kind = N'urna'
    `)
    const catalog = result.recordset
    const suggestion = env.openaiKey
      ? await suggestWithModel(parsed.data.context, catalog).catch(() => suggestLocal(parsed.data.context, catalog))
      : suggestLocal(parsed.data.context, catalog)
    res.json(suggestion)
  } catch (error) {
    next(error)
  }
})

impact.get('/', async (_req, res, next) => {
  try {
    const { readSettings } = await import('./admin.js')
    res.json(await readSettings())
  } catch (error) {
    next(error)
  }
})

function suggestLocal(context: string, catalog: Product[]) {
  const text = context.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  const pick = (slug: string) => catalog.find((product) => product.slug === slug) ?? catalog[0]
  const product = text.includes('agua') || text.includes('rio') || text.includes('mar')
    ? pick('cauce')
    : text.includes('jardin') || text.includes('arbol') || text.includes('bosque')
      ? pick('raiz')
      : text.includes('pocos') || text.includes('intima') || text.includes('familia')
        ? pick('linterna')
        : text.includes('simple') || text.includes('sencill')
          ? pick('humus')
          : pick('bruma')

  const intimate = text.includes('pocos') || text.includes('intima') || text.includes('familia')
  return {
    product,
    memorial: intimate
      ? 'Volviste a la tierra como volviste siempre a casa: sin prisa, con las manos llenas de lo que importaba. Que este lugar florezca con tu nombre.'
      : 'Que este adiós sea semilla. Donde hubo un cuerpo, que haya raíz, sombra y un árbol que recuerde por nosotros.',
    checklist: [
      'Definir lugar de siembra y permiso del predio',
      'Elegir un texto breve y quién lo lee',
      'Preparar urna, semilla y carta de despedida',
      'Confirmar traslado y horario de luz natural',
      'Cerrar con un gesto simple: agua, tierra, silencio',
    ],
    source: 'local' as const,
  }
}

async function suggestWithModel(context: string, catalog: Product[]) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.openaiModel,
      response_format: { type: 'json_object' },
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: `Sos el asistente de ceremonia de Eternal, una marca de urnas biodegradables en Argentina.
Hablás en español rioplatense, con calma y respeto. No vendés con apuro, no das consejos médicos ni legales.
Elegí una sola urna del catálogo y devolvé JSON con las claves slug, memorial y checklist (array de 5 pasos cortos).
Catálogo: ${JSON.stringify(catalog.map((product) => ({ slug: product.slug, name: product.name, blurb: product.blurb })))}`,
        },
        { role: 'user', content: context },
      ],
    }),
  })
  if (!response.ok) throw new Error('El asistente no respondió')
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  const raw = data.choices?.[0]?.message?.content
  if (!raw) throw new Error('Respuesta vacía')
  const parsed = JSON.parse(raw) as { slug?: string; memorial?: string; checklist?: string[] }
  const product = catalog.find((item) => item.slug === parsed.slug) ?? catalog[0]
  return {
    product,
    memorial: String(parsed.memorial || '').slice(0, 700),
    checklist: Array.isArray(parsed.checklist) ? parsed.checklist.map(String).slice(0, 6) : [],
    source: 'model' as const,
  }
}

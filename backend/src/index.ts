import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './env.js'
import { poolReady } from './db.js'
import { admin } from './routes/admin.js'
import { ceremony, impact } from './routes/ceremony.js'
import { orders } from './routes/orders.js'
import { products } from './routes/products.js'

const app = express()
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: env.frontendUrl }))
app.use(express.json({ limit: '32kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/products', products)
app.use('/api/impact', impact)
app.use('/api/ceremony', rateLimit({ windowMs: 10 * 60 * 1000, max: 30 }), ceremony)
app.use('/api/orders', rateLimit({ windowMs: 10 * 60 * 1000, max: 30 }), orders)
app.use('/api/admin', admin)

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error)
  res.status(500).json({ error: 'Algo falló de nuestro lado. Probá de nuevo en un rato.' })
})

await poolReady
app.listen(env.port, () => {
  console.log(`API de Eternal en http://localhost:${env.port}`)
})

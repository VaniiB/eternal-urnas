import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import sql from 'mssql'
import { z } from 'zod'
import { requireAdmin, signToken } from '../auth.js'
import { pool } from '../db.js'
import { restoreStock } from '../payments.js'

export const admin = Router()

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Demasiados intentos. Esperá un rato.' } })

admin.post('/login', loginLimit, async (req, res, next) => {
  const parsed = z
    .object({
      email: z.string().trim().email(),
      password: z.string().min(1),
    })
    .safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Email o contraseña inválidos' })
    return
  }
  try {
    const result = await pool
      .request()
      .input('email', sql.NVarChar, parsed.data.email.toLowerCase())
      .query<{ Id: number; PasswordHash: string; Role: string; FullName: string }>(`
        SELECT Id, PasswordHash, Role, FullName FROM Users WHERE Email = @email
      `)
    const user = result.recordset[0]
    const ok = user ? await bcrypt.compare(parsed.data.password, user.PasswordHash) : false
    if (!user || !ok || user.Role !== 'admin') {
      res.status(401).json({ error: 'Email o contraseña incorrectos' })
      return
    }
    res.json({ token: signToken({ id: user.Id, role: user.Role }), name: user.FullName })
  } catch (error) {
    next(error)
  }
})

admin.use(requireAdmin)

admin.get('/orders', async (_req, res, next) => {
  try {
    const result = await pool.request().query(`
      SELECT o.Id AS id, o.Code AS code, o.CustomerName AS customerName, o.CustomerEmail AS customerEmail,
             o.CustomerPhone AS customerPhone, o.CeremonyNote AS ceremonyNote, o.Status AS status,
             o.TotalCents AS totalCents, o.CreatedAt AS createdAt,
             i.ProductName AS productName, i.Quantity AS quantity, i.UnitPriceCents AS unitPriceCents
      FROM Orders o
      JOIN OrderItems i ON i.OrderId = o.Id
      ORDER BY o.CreatedAt DESC, i.Id
    `)
    res.json(groupOrders(result.recordset))
  } catch (error) {
    next(error)
  }
})

admin.patch('/orders/:id', async (req, res, next) => {
  const parsed = z.object({ status: z.enum(['paid', 'preparing', 'done', 'cancelled']) }).safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Estado inválido' })
    return
  }
  try {
    const found = await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .query<{ Code: string }>('SELECT Code FROM Orders WHERE Id = @id')
    const order = found.recordset[0]
    if (!order) {
      res.status(404).json({ error: 'Pedido no encontrado' })
      return
    }
    if (parsed.data.status === 'cancelled') {
      await restoreStock(order.Code)
    } else {
      await pool
        .request()
        .input('id', sql.Int, Number(req.params.id))
        .input('status', sql.NVarChar, parsed.data.status)
        .query(`UPDATE Orders SET Status = @status WHERE Id = @id AND Status <> N'cancelled'`)
    }
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

admin.get('/products', async (_req, res, next) => {
  try {
    const result = await pool.request().query(`
      SELECT Id AS id, Slug AS slug, Name AS name, Category AS category, Kind AS kind, PriceCents AS priceCents,
             Blurb AS blurb, Material AS material, Seed AS seed, Stock AS stock, Active AS active
      FROM Products
      ORDER BY Name
    `)
    res.json(result.recordset)
  } catch (error) {
    next(error)
  }
})

const productSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/, 'El slug usa solo minúsculas, números y guiones'),
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(60),
  priceCents: z.number().int().min(0),
  blurb: z.string().trim().min(4).max(600),
  material: z.string().trim().min(2).max(200),
  seed: z.string().trim().min(2).max(200),
  stock: z.number().int().min(0),
  active: z.boolean(),
  kind: z.enum(['urna', 'planta']).optional(),
})

admin.post('/products', async (req, res, next) => {
  const parsed = productSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }
  const product = parsed.data
  try {
    await pool
      .request()
      .input('slug', sql.NVarChar, product.slug)
      .input('name', sql.NVarChar, product.name)
      .input('category', sql.NVarChar, product.category)
      .input('price', sql.Int, product.priceCents)
      .input('blurb', sql.NVarChar, product.blurb)
      .input('material', sql.NVarChar, product.material)
      .input('seed', sql.NVarChar, product.seed)
      .input('stock', sql.Int, product.stock)
      .input('active', sql.Bit, product.active)
      .query(`
        INSERT INTO Products (Slug, Name, Category, PriceCents, Blurb, Material, Seed, Stock, Active)
        VALUES (@slug, @name, @category, @price, @blurb, @material, @seed, @stock, @active)
      `)
    res.status(201).json({ ok: true })
  } catch (error) {
    next(error)
  }
})

admin.patch('/products/:id', async (req, res, next) => {
  const parsed = productSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }
  const product = parsed.data
  const sets: string[] = []
  const request = pool.request().input('id', sql.Int, Number(req.params.id))
  const text: [keyof typeof product, string][] = [
    ['slug', 'Slug'],
    ['name', 'Name'],
    ['category', 'Category'],
    ['blurb', 'Blurb'],
    ['material', 'Material'],
    ['seed', 'Seed'],
  ]
  for (const [key, column] of text) {
    const value = product[key]
    if (typeof value === 'string') {
      sets.push(`${column} = @${key}`)
      request.input(key, sql.NVarChar, value)
    }
  }
  if (product.priceCents !== undefined) {
    sets.push('PriceCents = @priceCents')
    request.input('priceCents', sql.Int, product.priceCents)
  }
  if (product.stock !== undefined) {
    sets.push('Stock = @stock')
    request.input('stock', sql.Int, product.stock)
  }
  if (product.active !== undefined) {
    sets.push('Active = @active')
    request.input('active', sql.Bit, product.active)
  }
  if (product.kind !== undefined) {
    sets.push('Kind = @kind')
    request.input('kind', sql.NVarChar, product.kind)
  }
  if (sets.length === 0) {
    res.json({ ok: true })
    return
  }
  try {
    const result = await request.query(`UPDATE Products SET ${sets.join(', ')} WHERE Id = @id`)
    if (!result.rowsAffected[0]) {
      res.status(404).json({ error: 'Producto no encontrado' })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

admin.get('/settings', async (_req, res, next) => {
  try {
    res.json(await readSettings())
  } catch (error) {
    next(error)
  }
})

admin.patch('/settings', async (req, res, next) => {
  const parsed = z
    .object({
      treesPlanted: z.number().int().min(0),
      urnsDonated: z.number().int().min(0),
      partnerSites: z.number().int().min(0),
    })
    .safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Números inválidos' })
    return
  }
  try {
    const pairs = [
      ['trees_planted', parsed.data.treesPlanted],
      ['urns_donated', parsed.data.urnsDonated],
      ['partner_sites', parsed.data.partnerSites],
    ] as const
    for (const [key, value] of pairs) {
      await pool
        .request()
        .input('key', sql.NVarChar, key)
        .input('value', sql.NVarChar, String(value))
        .query(`
          MERGE Settings AS t
          USING (SELECT @key AS [Key], @value AS Value) AS s
          ON t.[Key] = s.[Key]
          WHEN MATCHED THEN UPDATE SET Value = s.Value
          WHEN NOT MATCHED THEN INSERT ([Key], Value) VALUES (s.[Key], s.Value);
        `)
    }
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

export async function readSettings() {
  const result = await pool.request().query<{ Key: string; Value: string }>('SELECT [Key], Value FROM Settings')
  const map = Object.fromEntries(result.recordset.map((row) => [row.Key, Number(row.Value) || 0]))
  return {
    treesPlanted: map.trees_planted ?? 0,
    urnsDonated: map.urns_donated ?? 0,
    partnerSites: map.partner_sites ?? 0,
  }
}

type OrderRow = {
  id: number
  code: string
  customerName: string
  customerEmail: string
  customerPhone: string
  ceremonyNote: string | null
  status: string
  totalCents: number
  createdAt: Date
  productName: string
  quantity: number
  unitPriceCents: number
}

function groupOrders(rows: OrderRow[]) {
  const orders = new Map<number, Omit<OrderRow, 'productName' | 'quantity' | 'unitPriceCents'> & { items: { productName: string; quantity: number; unitPriceCents: number }[] }>()
  for (const row of rows) {
    let order = orders.get(row.id)
    if (!order) {
      order = {
        id: row.id,
        code: row.code,
        customerName: row.customerName,
        customerEmail: row.customerEmail,
        customerPhone: row.customerPhone,
        ceremonyNote: row.ceremonyNote,
        status: row.status,
        totalCents: row.totalCents,
        createdAt: row.createdAt,
        items: [],
      }
      orders.set(row.id, order)
    }
    order.items.push({
      productName: row.productName,
      quantity: row.quantity,
      unitPriceCents: row.unitPriceCents,
    })
  }
  return [...orders.values()]
}

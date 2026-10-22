import { Router } from 'express'
import sql from 'mssql'
import { z } from 'zod'
import { pool } from '../db.js'
import { createPreference, syncPayment } from '../payments.js'

export const orders = Router()

const orderSchema = z.object({
  customerName: z.string().trim().min(3, 'El nombre es muy corto').max(200),
  customerEmail: z.string().trim().email('El email no es válido').max(200),
  customerPhone: z.string().trim().min(6, 'El teléfono es muy corto').max(40),
  ceremonyNote: z.string().trim().max(800).optional(),
  items: z
    .array(
      z.object({
        urnSlug: z.string().trim().min(1).max(80),
        plantSlug: z.string().trim().min(1).max(80),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1, 'La cesta está vacía')
    .max(12),
})

function orderCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let tail = ''
  for (let i = 0; i < 8; i += 1) tail += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `ET-${tail}`
}

orders.post('/', async (req, res, next) => {
  const parsed = orderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
    return
  }
  const body = parsed.data
  const merged = new Map<string, { urnSlug: string; plantSlug: string; quantity: number }>()
  for (const item of body.items) {
    const key = `${item.urnSlug}|${item.plantSlug}`
    const found = merged.get(key)
    if (found) found.quantity += item.quantity
    else merged.set(key, { ...item })
  }

  const tx = new sql.Transaction(pool)
  try {
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE)
    type Stocked = { Id: number; Name: string; PriceCents: number; Stock: number; Active: boolean; Kind: string }
    const bySlug = new Map<string, Stocked>()
    const slugs = new Set<string>()
    for (const pair of merged.values()) {
      slugs.add(pair.urnSlug)
      slugs.add(pair.plantSlug)
    }
    for (const slug of slugs) {
      const found = await new sql.Request(tx)
        .input('slug', sql.NVarChar, slug)
        .query<Stocked>(`
          SELECT Id, Name, PriceCents, Stock, Active, Kind
          FROM Products WITH (UPDLOCK, ROWLOCK)
          WHERE Slug = @slug
        `)
      const product = found.recordset[0]
      if (!product || !product.Active) {
        throw Object.assign(new Error('Hay un producto que ya no está disponible'), { status: 400 })
      }
      bySlug.set(slug, product)
    }

    const pairs: {
      urn: Stocked
      plant: Stocked
      quantity: number
    }[] = []
    const needed = new Map<number, { name: string; quantity: number }>()
    for (const pair of merged.values()) {
      const urn = bySlug.get(pair.urnSlug)
      const plant = bySlug.get(pair.plantSlug)
      if (!urn || urn.Kind !== 'urna') {
        throw Object.assign(new Error('Elegí una urna para armar el pedido'), { status: 400 })
      }
      if (!plant || plant.Kind !== 'planta') {
        throw Object.assign(new Error('Elegí la semilla que va con la urna'), { status: 400 })
      }
      pairs.push({ urn, plant, quantity: pair.quantity })
      for (const product of [urn, plant]) {
        const current = needed.get(product.Id)
        needed.set(product.Id, {
          name: product.Name,
          quantity: (current?.quantity ?? 0) + pair.quantity,
        })
      }
    }
    for (const product of bySlug.values()) {
      const ask = needed.get(product.Id)
      if (ask && product.Stock < ask.quantity) {
        throw Object.assign(new Error(`No hay stock suficiente de ${ask.name}`), { status: 400 })
      }
    }

    const totalCents = pairs.reduce(
      (sum, pair) => sum + (pair.urn.PriceCents + pair.plant.PriceCents) * pair.quantity,
      0,
    )
    const code = orderCode()
    const created = await new sql.Request(tx)
      .input('code', sql.NVarChar, code)
      .input('name', sql.NVarChar, body.customerName)
      .input('email', sql.NVarChar, body.customerEmail.toLowerCase())
      .input('phone', sql.NVarChar, body.customerPhone)
      .input('note', sql.NVarChar, body.ceremonyNote || null)
      .input('total', sql.Int, totalCents)
      .query<{ Id: number }>(`
        INSERT INTO Orders (Code, CustomerName, CustomerEmail, CustomerPhone, CeremonyNote, Status, TotalCents)
        OUTPUT INSERTED.Id
        VALUES (@code, @name, @email, @phone, @note, N'pending_payment', @total)
      `)
    const orderId = created.recordset[0].Id

    for (const pair of pairs) {
      const rows = [
        { product: pair.urn, name: pair.urn.Name, price: pair.urn.PriceCents },
        {
          product: pair.plant,
          name: `${pair.plant.Name} · semilla de ${pair.urn.Name}`,
          price: pair.plant.PriceCents,
        },
      ]
      for (const row of rows) {
        await new sql.Request(tx)
          .input('orderId', sql.Int, orderId)
          .input('productId', sql.Int, row.product.Id)
          .input('name', sql.NVarChar, row.name)
          .input('price', sql.Int, row.price)
          .input('qty', sql.Int, pair.quantity)
          .query(`
            INSERT INTO OrderItems (OrderId, ProductId, ProductName, UnitPriceCents, Quantity)
            VALUES (@orderId, @productId, @name, @price, @qty)
          `)
      }
    }
    for (const [productId, ask] of needed) {
      await new sql.Request(tx)
        .input('productId', sql.Int, productId)
        .input('qty', sql.Int, ask.quantity)
        .query('UPDATE Products SET Stock = Stock - @qty WHERE Id = @productId')
    }

    await tx.commit()

    let checkoutUrl: string | null = null
    try {
      const preference = await createPreference({
        code,
        items: pairs.map((pair) => ({
          title: `${pair.urn.Name} con semilla ${pair.plant.Name}`,
          quantity: pair.quantity,
          unitPriceCents: pair.urn.PriceCents + pair.plant.PriceCents,
        })),
      })
      if (preference) {
        checkoutUrl = preference.initPoint
        await pool
          .request()
          .input('id', sql.NVarChar, preference.id)
          .input('code', sql.NVarChar, code)
          .query('UPDATE Orders SET MpPreferenceId = @id WHERE Code = @code')
      }
    } catch (error) {
      console.error('Mercado Pago no pudo crear el pago', error)
    }

    res.status(201).json({ code, totalCents, checkoutUrl })
  } catch (error) {
    await tx.rollback().catch(() => undefined)
    const status = (error as { status?: number }).status
    if (status) {
      res.status(status).json({ error: error instanceof Error ? error.message : 'No se pudo crear el pedido' })
      return
    }
    next(error)
  }
})

orders.get('/:code', async (req, res, next) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase()
    const result = await pool
      .request()
      .input('code', sql.NVarChar, req.params.code)
      .query<{
        Code: string
        CustomerEmail: string
        CustomerName: string
        Status: string
        TotalCents: number
        MpPaymentId: string | null
        CreatedAt: Date
      }>(`
        SELECT Code, CustomerEmail, CustomerName, Status, TotalCents, MpPaymentId, CreatedAt
        FROM Orders WHERE Code = @code
      `)
    const order = result.recordset[0]
    if (!order || (email && order.CustomerEmail !== email)) {
      res.status(404).json({ error: 'No encontramos ese pedido' })
      return
    }
    if (order.Status === 'pending_payment') await syncPayment(order.Code)
    const fresh = await pool
      .request()
      .input('code', sql.NVarChar, order.Code)
      .query(`
        SELECT o.Code AS code, o.CustomerName AS customerName, o.Status AS status,
               o.TotalCents AS totalCents, o.CreatedAt AS createdAt,
               i.ProductName AS productName, i.Quantity AS quantity, i.UnitPriceCents AS unitPriceCents
        FROM Orders o
        JOIN OrderItems i ON i.OrderId = o.Id
        WHERE o.Code = @code
      `)
    const rows = fresh.recordset as {
      code: string
      customerName: string
      status: string
      totalCents: number
      createdAt: Date
      productName: string
      quantity: number
      unitPriceCents: number
    }[]
    const first = rows[0]
    res.json({
      code: first.code,
      customerName: first.customerName,
      status: first.status,
      totalCents: first.totalCents,
      createdAt: first.createdAt,
      items: rows.map((row) => ({
        productName: row.productName,
        quantity: row.quantity,
        unitPriceCents: row.unitPriceCents,
      })),
    })
  } catch (error) {
    next(error)
  }
})

orders.post('/payments/webhook', async (req, res) => {
  const id = req.body?.data?.id || req.query['data.id'] || req.query.id
  if (id) {
    try {
      await syncPayment(undefined, String(id))
    } catch (error) {
      console.error('Webhook de Mercado Pago', error)
    }
  }
  res.sendStatus(200)
})

import { Router } from 'express'
import sql from 'mssql'
import { pool } from '../db.js'

export const products = Router()

const publicColumns = `
  Slug AS slug, Name AS name, Category AS category, Kind AS kind, PriceCents AS priceCents,
  Blurb AS blurb, Material AS material, Seed AS seed, Stock AS stock
`

products.get('/', async (req, res, next) => {
  const kind = req.query.kind
  if (kind !== undefined && kind !== 'urna' && kind !== 'planta') {
    res.status(400).json({ error: 'El tipo de producto no es válido' })
    return
  }
  try {
    const request = pool.request()
    if (typeof kind === 'string') request.input('kind', sql.NVarChar, kind)
    const result = await request.query(`
      SELECT ${publicColumns}
      FROM Products
      WHERE Active = 1 ${typeof kind === 'string' ? 'AND Kind = @kind' : ''}
      ORDER BY PriceCents
    `)
    res.json(result.recordset)
  } catch (error) {
    next(error)
  }
})

products.get('/:slug', async (req, res, next) => {
  try {
    const result = await pool
      .request()
      .input('slug', sql.NVarChar, req.params.slug)
      .query(`SELECT ${publicColumns} FROM Products WHERE Slug = @slug AND Active = 1`)
    const product = result.recordset[0]
    if (!product) {
      res.status(404).json({ error: 'No encontramos ese producto' })
      return
    }
    res.json(product)
  } catch (error) {
    next(error)
  }
})

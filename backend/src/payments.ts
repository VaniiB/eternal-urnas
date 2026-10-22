import sql from 'mssql'
import { env } from './env.js'
import { pool } from './db.js'

type PreferenceItem = { title: string; quantity: number; unitPriceCents: number }

export async function createPreference(order: { code: string; items: PreferenceItem[] }) {
  if (!env.mpToken) return null
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.mpToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: order.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPriceCents / 100,
        currency_id: 'ARS',
      })),
      external_reference: order.code,
      back_urls: {
        success: `${env.frontendUrl}/pedido/${order.code}`,
        pending: `${env.frontendUrl}/pedido/${order.code}`,
        failure: `${env.frontendUrl}/pedido/${order.code}`,
      },
      auto_return: 'approved',
      notification_url: env.apiPublicUrl ? `${env.apiPublicUrl}/api/orders/payments/webhook` : undefined,
    }),
  })
  if (!response.ok) {
    throw new Error(`Mercado Pago respondió ${response.status}`)
  }
  const data = (await response.json()) as { id: string; init_point: string }
  return { id: data.id, initPoint: data.init_point }
}

export async function syncPayment(code?: string, paymentId?: string) {
  if (!env.mpToken) return
  let id = paymentId
  if (!id && code) {
    const stored = await pool
      .request()
      .input('code', sql.NVarChar, code)
      .query<{ MpPaymentId: string | null }>('SELECT MpPaymentId FROM Orders WHERE Code = @code')
    id = stored.recordset[0]?.MpPaymentId ?? undefined
  }
  if (!id) return

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${env.mpToken}` },
  })
  if (!response.ok) return
  const payment = (await response.json()) as { id: number; status: string; external_reference?: string }
  const orderCode = payment.external_reference
  if (!orderCode) return

  if (payment.status === 'approved') {
    await pool
      .request()
      .input('code', sql.NVarChar, orderCode)
      .input('paymentId', sql.NVarChar, String(payment.id))
      .query(`
        UPDATE Orders
        SET Status = N'paid', MpPaymentId = @paymentId
        WHERE Code = @code AND Status = N'pending_payment'
      `)
    return
  }

  if (payment.status === 'rejected' || payment.status === 'cancelled') {
    await restoreStock(orderCode, String(payment.id))
  }
}

export async function restoreStock(code: string, paymentId?: string) {
  const tx = new sql.Transaction(pool)
  await tx.begin()
  try {
    const found = await new sql.Request(tx)
      .input('code', sql.NVarChar, code)
      .query<{ Id: number; Status: string; StockReturned: boolean }>(`
        SELECT Id, Status, StockReturned FROM Orders WITH (UPDLOCK, ROWLOCK) WHERE Code = @code
      `)
    const order = found.recordset[0]
    if (!order || order.StockReturned || order.Status === 'done' || order.Status === 'preparing') {
      await tx.commit()
      return
    }
    const items = await new sql.Request(tx)
      .input('id', sql.Int, order.Id)
      .query<{ ProductId: number; Quantity: number }>('SELECT ProductId, Quantity FROM OrderItems WHERE OrderId = @id')
    for (const item of items.recordset) {
      await new sql.Request(tx)
        .input('productId', sql.Int, item.ProductId)
        .input('qty', sql.Int, item.Quantity)
        .query('UPDATE Products SET Stock = Stock + @qty WHERE Id = @productId')
    }
    await new sql.Request(tx)
      .input('id', sql.Int, order.Id)
      .input('paymentId', sql.NVarChar, paymentId ?? null)
      .query(`
        UPDATE Orders
        SET Status = N'cancelled', StockReturned = 1, MpPaymentId = COALESCE(@paymentId, MpPaymentId)
        WHERE Id = @id
      `)
    await tx.commit()
  } catch (error) {
    await tx.rollback().catch(() => undefined)
    throw error
  }
}

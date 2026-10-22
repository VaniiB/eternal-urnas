import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from './env.js'

type TokenPayload = { sub: number; role: string }

export function signToken(user: { id: number; role: string }) {
  const payload: TokenPayload = { sub: user.id, role: user.role }
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '12h' })
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Tenés que iniciar sesión' })
    return
  }
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as unknown as TokenPayload
    if (payload.role !== 'admin') {
      res.status(403).json({ error: 'No autorizado' })
      return
    }
    res.locals.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'La sesión venció. Volvé a entrar.' })
  }
}

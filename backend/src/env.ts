import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta ${name} en backend/.env`)
  return value
}

function flag(name: string, fallback: boolean): boolean {
  const value = process.env[name]
  if (value === undefined || value === '') return fallback
  return value === 'true' || value === '1'
}

export const env = {
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  apiPublicUrl: process.env.API_PUBLIC_URL || '',
  db: {
    server: process.env.DB_SERVER || 'localhost',
    instance: process.env.DB_INSTANCE || '',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    name: process.env.DB_NAME || 'Eternal',
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    encrypt: flag('DB_ENCRYPT', false),
    trustCert: flag('DB_TRUST_CERT', true),
  },
  adminDb: {
    user: process.env.DB_ADMIN_USER || 'sa',
    password: process.env.DB_ADMIN_PASSWORD || '',
  },
  seedAdmin: {
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
  },
  jwtSecret: required('JWT_SECRET'),
  mpToken: process.env.MP_ACCESS_TOKEN || '',
  openaiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
}

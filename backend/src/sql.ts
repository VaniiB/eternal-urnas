import sql from 'mssql'
import { env } from './env.js'

export function sqlConfig(database: string, user: string, password: string): sql.config {
  return {
    server: env.db.server,
    port: env.db.port,
    database,
    user,
    password,
    options: {
      encrypt: env.db.encrypt,
      trustServerCertificate: env.db.trustCert,
      instanceName: env.db.port ? undefined : env.db.instance || undefined,
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  }
}

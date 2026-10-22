import sql from 'mssql'
import { sqlConfig } from './sql.js'
import { env } from './env.js'

export const pool = new sql.ConnectionPool(sqlConfig(env.db.name, env.db.user, env.db.password))
export const poolReady = pool.connect()

export { sqlConfig }

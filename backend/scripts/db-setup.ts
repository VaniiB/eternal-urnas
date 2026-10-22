import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import sql from 'mssql'
import { sqlConfig } from '../src/sql.ts'
import { env } from '../src/env.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const products = [
  {
    slug: 'raiz',
    name: 'Raíz',
    category: 'Premium',
    priceCents: 8_600_000,
    stock: 12,
    blurb: 'Urna de fibra y semilla nativa. Pensada para jardín o bosque, con un árbol que continúa el nombre.',
    material: 'Fibra vegetal y arcilla',
    seed: 'Cebil o jacarandá, según región',
  },
  {
    slug: 'bruma',
    name: 'Bruma',
    category: 'Esencial',
    priceCents: 6_400_000,
    stock: 20,
    blurb: 'Forma suave, tono piedra. Para una ceremonia serena, sin ornamento de más.',
    material: 'Papel de algodón y tierra',
    seed: 'Lavanda y romero',
  },
  {
    slug: 'linterna',
    name: 'Linterna',
    category: 'Íntima',
    priceCents: 7_200_000,
    stock: 10,
    blurb: 'Pequeña, para pocos. Se entrega con carta y un gesto de luz al anochecer.',
    material: 'Madera de reuso y cera',
    seed: 'Jazmín',
  },
  {
    slug: 'cauce',
    name: 'Cauce',
    category: 'Premium',
    priceCents: 9_100_000,
    stock: 8,
    blurb: 'Para despedidas junto al agua. Se disuelve con respeto y deja un recuerdo vegetal.',
    material: 'Sal compactada y algas',
    seed: 'Ceibo',
  },
  {
    slug: 'humus',
    name: 'Humus',
    category: 'Básica',
    priceCents: 4_800_000,
    stock: 24,
    blurb: 'La opción más simple y honesta. Tierra que vuelve a ser tierra.',
    material: 'Celulosa y compost',
    seed: 'Mix de nativas',
  },
  {
    slug: 'combo',
    name: 'Combo sereno',
    category: 'Combo',
    priceCents: 11_800_000,
    stock: 10,
    blurb: 'Urna Bruma, semilla, carta impresa y coordinación de siembra en predio aliado.',
    material: 'Según urna',
    seed: 'A elección',
  },
]

const extraUrns = [
  {
    slug: 'rosita',
    name: 'Rosita',
    category: 'Íntima',
    priceCents: 7_400_000,
    stock: 14,
    blurb: 'Rosa suave, para una despedida con flores. Cabe en las manos y deja el color en la tierra.',
    material: 'Fibra teñida y arcilla',
    seed: 'Rosa eterna',
  },
  {
    slug: 'carton',
    name: 'Arena',
    category: 'Esencial',
    priceCents: 5_200_000,
    stock: 22,
    blurb: 'Tono arena, forma limpia. Una pieza quieta que se desarma con la humedad y vuelve a ser tierra.',
    material: 'Fibra vegetal y celulosa',
    seed: 'Girasol',
  },
]

const plants = [
  {
    slug: 'rosa-eterna',
    name: 'Rosa eterna',
    category: 'Flor premium',
    priceCents: 1_800_000,
    stock: 30,
    blurb: 'Una rosa para sembrar con la urna. El color queda en el jardín después de la ceremonia.',
    material: 'Semilla de flor',
    seed: 'Maceta o cantero con sol.',
  },
  {
    slug: 'girasol',
    name: 'Girasol',
    category: 'Flor',
    priceCents: 900_000,
    stock: 40,
    blurb: 'Sigue la luz. Para una despedida al aire libre, con una flor alta y simple.',
    material: 'Semilla de flor',
    seed: 'Tierra suelta y bastante sol.',
  },
  {
    slug: 'amapola',
    name: 'Amapola',
    category: 'Flor',
    priceCents: 800_000,
    stock: 40,
    blurb: 'Silvestre y breve. Un gesto chico en la tierra, sin ocupar el jardín.',
    material: 'Semilla de flor',
    seed: 'Cantero silvestre.',
  },
  {
    slug: 'lavanda',
    name: 'Lavanda',
    category: 'Flor',
    priceCents: 1_100_000,
    stock: 36,
    blurb: 'Perfume suave para una ceremonia serena. Acompaña bien a las urnas más quietas.',
    material: 'Semilla de flor',
    seed: 'Suelo aireado, poco riego.',
  },
  {
    slug: 'jazmin',
    name: 'Jazmín',
    category: 'Flor',
    priceCents: 1_400_000,
    stock: 28,
    blurb: 'Florece de noche. Para una despedida íntima, de pocas personas.',
    material: 'Semilla de flor',
    seed: 'Muro, pérgola o maceta grande.',
  },
  {
    slug: 'petrea',
    name: 'Petrea',
    category: 'Flor',
    priceCents: 1_200_000,
    stock: 24,
    blurb: 'Racimos violetas. Una enredadera para dejar el recuerdo sobre un muro.',
    material: 'Semilla de enredadera',
    seed: 'Apoyo para trepar y sol de mañana.',
  },
  {
    slug: 'jacaranda',
    name: 'Jacarandá',
    category: 'Árbol',
    priceCents: 2_400_000,
    stock: 20,
    blurb: 'Árbol de sombra violeta. Pide espacio y paciencia, y después cubre el lugar de flores.',
    material: 'Semilla de árbol',
    seed: 'Jardín o vereda ancha.',
  },
  {
    slug: 'ceibo',
    name: 'Ceibo',
    category: 'Árbol',
    priceCents: 2_200_000,
    stock: 22,
    blurb: 'La flor nacional. Para sembrar cerca del agua o en un patio que reciba sol.',
    material: 'Semilla de árbol',
    seed: 'Suelo húmedo y sol.',
  },
  {
    slug: 'cebil',
    name: 'Cebil',
    category: 'Árbol',
    priceCents: 2_000_000,
    stock: 18,
    blurb: 'Nativo del norte. Crece con fuerza donde hay sol y tierra profunda.',
    material: 'Semilla de árbol',
    seed: 'Clima cálido, predio amplio.',
  },
  {
    slug: 'lapacho',
    name: 'Lapacho',
    category: 'Árbol premium',
    priceCents: 3_200_000,
    stock: 14,
    blurb: 'Flor rosada en primavera. Una especie de porte, para un predio que pueda sostenerla.',
    material: 'Semilla de árbol',
    seed: 'Parque o jardín grande.',
  },
  {
    slug: 'cerezo',
    name: 'Cerezo',
    category: 'Árbol premium',
    priceCents: 3_600_000,
    stock: 12,
    blurb: 'Floración corta y muy visible. Para quien amaba la primavera.',
    material: 'Semilla de árbol',
    seed: 'Suelo fresco y sol suave.',
  },
  {
    slug: 'cipres',
    name: 'Ciprés',
    category: 'Árbol',
    priceCents: 2_600_000,
    stock: 16,
    blurb: 'Vertical y sobrio. Marca el lugar sin ocupar todo el jardín.',
    material: 'Semilla de árbol',
    seed: 'Tierra drenada.',
  },
]

async function main() {
  if (!env.adminDb.password) throw new Error('Falta DB_ADMIN_PASSWORD en backend/.env')

  const master = await sql.connect(sqlConfig('master', env.adminDb.user, env.adminDb.password))
  await master.request().query(`IF DB_ID(N'${env.db.name.replace(/'/g, "''")}') IS NULL CREATE DATABASE [${env.db.name.replace(/]/g, '')}]`)
  await master.close()

  const db = await sql.connect(sqlConfig(env.db.name, env.adminDb.user, env.adminDb.password))
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  for (const batch of schema.split(/^\s*GO\s*$/gim)) {
    if (batch.trim()) await db.request().query(batch)
  }

  const password = env.db.password.replace(/'/g, "''")
  await db.request().query(`
    IF EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'eternal_app')
      ALTER LOGIN eternal_app WITH PASSWORD = N'${password}', CHECK_POLICY = ON;
    ELSE
      CREATE LOGIN eternal_app WITH PASSWORD = N'${password}', CHECK_POLICY = ON;

    IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'eternal_app')
      CREATE USER eternal_app FOR LOGIN eternal_app;

    IF NOT EXISTS (
      SELECT 1
      FROM sys.database_role_members drm
      JOIN sys.database_principals r ON r.principal_id = drm.role_principal_id
      JOIN sys.database_principals m ON m.principal_id = drm.member_principal_id
      WHERE r.name = N'db_datareader' AND m.name = N'eternal_app'
    )
      ALTER ROLE db_datareader ADD MEMBER eternal_app;

    IF NOT EXISTS (
      SELECT 1
      FROM sys.database_role_members drm
      JOIN sys.database_principals r ON r.principal_id = drm.role_principal_id
      JOIN sys.database_principals m ON m.principal_id = drm.member_principal_id
      WHERE r.name = N'db_datawriter' AND m.name = N'eternal_app'
    )
      ALTER ROLE db_datawriter ADD MEMBER eternal_app;
  `)

  const count = await db.request().query<{ n: number }>('SELECT COUNT(*) AS n FROM Products')
  if (count.recordset[0].n === 0) {
    for (const product of products) {
      await db
        .request()
        .input('slug', sql.NVarChar, product.slug)
        .input('name', sql.NVarChar, product.name)
        .input('category', sql.NVarChar, product.category)
        .input('price', sql.Int, product.priceCents)
        .input('blurb', sql.NVarChar, product.blurb)
        .input('material', sql.NVarChar, product.material)
        .input('seed', sql.NVarChar, product.seed)
        .input('stock', sql.Int, product.stock)
        .query(`
          INSERT INTO Products (Slug, Name, Category, PriceCents, Blurb, Material, Seed, Stock)
          VALUES (@slug, @name, @category, @price, @blurb, @material, @seed, @stock)
        `)
    }
    console.log(`Productos de ejemplo cargados: ${products.length}`)
  }

  let addedUrns = 0
  for (const product of extraUrns) {
    const exists = await db
      .request()
      .input('slug', sql.NVarChar, product.slug)
      .query<{ Id: number }>('SELECT Id FROM Products WHERE Slug = @slug')
    if (exists.recordset.length > 0) continue
    await db
      .request()
      .input('slug', sql.NVarChar, product.slug)
      .input('name', sql.NVarChar, product.name)
      .input('category', sql.NVarChar, product.category)
      .input('price', sql.Int, product.priceCents)
      .input('blurb', sql.NVarChar, product.blurb)
      .input('material', sql.NVarChar, product.material)
      .input('seed', sql.NVarChar, product.seed)
      .input('stock', sql.Int, product.stock)
      .query(`
        INSERT INTO Products (Slug, Name, Category, PriceCents, Blurb, Material, Seed, Stock, Kind)
        VALUES (@slug, @name, @category, @price, @blurb, @material, @seed, @stock, N'urna')
      `)
    addedUrns += 1
  }
  if (addedUrns > 0) console.log(`Urnas nuevas: ${addedUrns}`)

  let planted = 0
  for (const plant of plants) {
    const exists = await db
      .request()
      .input('slug', sql.NVarChar, plant.slug)
      .query<{ Id: number }>('SELECT Id FROM Products WHERE Slug = @slug')
    if (exists.recordset.length > 0) continue
    await db
      .request()
      .input('slug', sql.NVarChar, plant.slug)
      .input('name', sql.NVarChar, plant.name)
      .input('category', sql.NVarChar, plant.category)
      .input('price', sql.Int, plant.priceCents)
      .input('blurb', sql.NVarChar, plant.blurb)
      .input('material', sql.NVarChar, plant.material)
      .input('seed', sql.NVarChar, plant.seed)
      .input('stock', sql.Int, plant.stock)
      .query(`
        INSERT INTO Products (Slug, Name, Category, PriceCents, Blurb, Material, Seed, Stock, Kind)
        VALUES (@slug, @name, @category, @price, @blurb, @material, @seed, @stock, N'planta')
      `)
    planted += 1
  }
  if (planted > 0) console.log(`Plantas cargadas: ${planted}`)

  const settings = await db.request().query<{ n: number }>('SELECT COUNT(*) AS n FROM Settings')
  if (settings.recordset[0].n === 0) {
    await db.request().query(`
      INSERT INTO Settings ([Key], Value) VALUES
      (N'trees_planted', N'0'),
      (N'urns_donated', N'0'),
      (N'partner_sites', N'0')
    `)
  }

  if (!env.seedAdmin.email || !env.seedAdmin.password) {
    throw new Error('Faltan ADMIN_EMAIL y ADMIN_PASSWORD para crear la cuenta del panel')
  }
  const users = await db.request().query<{ n: number }>('SELECT COUNT(*) AS n FROM Users')
  if (users.recordset[0].n === 0) {
    const hash = await bcrypt.hash(env.seedAdmin.password, 12)
    await db
      .request()
      .input('email', sql.NVarChar, env.seedAdmin.email.toLowerCase())
      .input('hash', sql.NVarChar, hash)
      .query(`
        INSERT INTO Users (Email, PasswordHash, FullName, Role)
        VALUES (@email, @hash, N'Vanina Balbastro', N'admin')
      `)
    console.log(`Admin creado: ${env.seedAdmin.email}`)
  }

  await db.close()
  console.log('Base Eternal lista.')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

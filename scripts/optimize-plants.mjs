import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const dir = join(import.meta.dirname, '..', 'frontend', 'public', 'plants')
const files = (await readdir(dir)).filter((name) => name.endsWith('.jpg'))

for (const name of files) {
  const input = join(dir, name)
  const webp = join(dir, name.replace(/\.jpg$/i, '.webp'))
  await sharp(input)
    .rotate()
    .resize(900, 900, { fit: 'cover', withoutEnlargement: true })
    .webp({ quality: 68 })
    .toFile(webp)
  const after = await stat(webp)
  console.log(name, '→ webp', Math.round(after.size / 1024) + 'kb')
}

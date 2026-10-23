import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, draco, prune, simplify, textureCompress } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import draco3d from 'draco3dgltf'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Jimp from 'jimp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const urnDir = path.join(__dirname, '../public/urnas')
const outDir = path.join(urnDir, 'lite')
const maxEdge = 768

fs.mkdirSync(outDir, { recursive: true })

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  })

const files = fs.readdirSync(urnDir).filter((name) => name.endsWith('.glb') && !name.startsWith('_'))

async function resizeWithJimp(slots, _encoder) {
  // custom texture pipeline via textureCompress encoder option won't work; do manual
  return null
}

for (const file of files) {
  const src = path.join(urnDir, file)
  const dest = path.join(outDir, file)
  const document = await io.read(src)

  for (const texture of document.getRoot().listTextures()) {
    const mime = texture.getMimeType() || 'image/png'
    const image = texture.getImage()
    if (!image) continue
    try {
      const jimp = await Jimp.read(Buffer.from(image))
      const w = jimp.getWidth()
      const h = jimp.getHeight()
      if (Math.max(w, h) <= maxEdge) continue
      const scale = maxEdge / Math.max(w, h)
      jimp.resize(Math.round(w * scale), Math.round(h * scale))
      const outMime = mime.includes('jpeg') || mime.includes('jpg') ? 'image/jpeg' : 'image/png'
      const buf =
        outMime === 'image/jpeg'
          ? await jimp.quality(78).getBufferAsync(Jimp.MIME_JPEG)
          : await jimp.deflateLevel(8).getBufferAsync(Jimp.MIME_PNG)
      texture.setImage(buf)
      texture.setMimeType(outMime)
    } catch (error) {
      console.warn(`  texture skip ${file}:`, error instanceof Error ? error.message : error)
    }
  }

  await document.transform(
    dedup(),
    prune(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.45, error: 0.002 }),
    draco({ method: 'edgebreaker' }),
  )

  await io.write(dest, document)
  const before = fs.statSync(src).size
  const after = fs.statSync(dest).size
  console.log(
    `${file}: ${(before / 1e6).toFixed(2)}MB → ${(after / 1e6).toFixed(2)}MB (${Math.round((after / before) * 100)}%)`,
  )
}

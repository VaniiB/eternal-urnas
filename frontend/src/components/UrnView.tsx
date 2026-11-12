import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Box3, Group, MathUtils, Mesh, PerspectiveCamera, Vector3 } from 'three'
import { toneForUrn } from '../lib'

const modelBySlug: Record<string, string> = {
  raiz: '/urnas/raiz.glb',
  bruma: '/urnas/bruma.glb',
  linterna: '/urnas/linterna.glb',
  cauce: '/urnas/cauce.glb',
  humus: '/urnas/humus.glb',
  rosita: '/urnas/rosita.glb',
  carton: '/urnas/carton.glb',
  combo: '/urnas/bruma.glb',
}

const homeSlugs = ['raiz', 'bruma', 'cauce', 'carton'] as const

function modelUrl(slug: string) {
  return modelBySlug[slug] ?? modelBySlug.bruma
}

function UrnPlaceholder({ slug, className = '' }: { slug: string; className?: string }) {
  return (
    <div className={`grid place-items-center ${className}`} style={{ background: 'transparent' }}>
      <svg viewBox="0 0 120 160" className="h-[72%] w-[58%] animate-pulse" aria-hidden>
        <path
          d="M38 18h44l6 22c8 10 12 22 12 36 0 28-14 52-40 52S20 104 20 76c0-14 4-26 12-36z"
          fill={toneForUrn(slug)}
          stroke="#173E3A22"
          strokeWidth="1.5"
        />
        <rect x="34" y="10" width="52" height="12" rx="4" fill="#173E3A18" />
      </svg>
    </div>
  )
}

function UrnModel({ url, spin, onReady }: { url: string; spin: boolean; onReady: () => void }) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => scene.clone(true), [scene])
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const view = useThree((state) => state.size)
  const invalidate = useThree((state) => state.invalidate)
  const pivot = useRef<Group>(null)
  const spinRef = useRef(spin)
  const angle = useRef(0)
  const [shadowY, setShadowY] = useState(-0.5)
  spinRef.current = spin

  useFrame((_, delta) => {
    const node = pivot.current
    if (!node) return
    if (spinRef.current) angle.current += delta * 0.9
    else {
      const rest = 0
      const deltaAngle = Math.atan2(Math.sin(angle.current - rest), Math.cos(angle.current - rest))
      angle.current = rest + MathUtils.damp(deltaAngle, 0, 4, delta)
    }
    node.rotation.y = angle.current
  })

  useLayoutEffect(() => {
    model.position.set(0, 0, 0)
    model.rotation.set(0, 0, 0)
    model.scale.set(1, 1, 1)
    model.traverse((child) => {
      if ((child as PerspectiveCamera).isCamera || /camera/i.test(child.name)) child.visible = false
      else child.visible = true
    })
    model.updateMatrixWorld(true)

    const box = new Box3()
    model.traverse((child) => {
      if (!(child instanceof Mesh) || !child.visible || !child.geometry) return
      if (!child.geometry.boundingBox) child.geometry.computeBoundingBox()
      const piece = child.geometry.boundingBox!.clone()
      piece.applyMatrix4(child.matrixWorld)
      box.union(piece)
    })
    if (box.isEmpty()) return

    const body = new Box3()
    model.traverse((child) => {
      if (!(child instanceof Mesh) || !child.visible || !child.geometry) return
      if (!/envase/i.test(child.name)) return
      if (!child.geometry.boundingBox) child.geometry.computeBoundingBox()
      const piece = child.geometry.boundingBox!.clone()
      piece.applyMatrix4(child.matrixWorld)
      body.union(piece)
    })
    const anchor = body.isEmpty() ? box.getCenter(new Vector3()) : body.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    const scale = 1 / Math.max(size.x, size.y, size.z)
    model.scale.setScalar(scale)
    model.position.set(-anchor.x * scale, -anchor.y * scale, -anchor.z * scale)
    model.updateMatrixWorld(true)

    const fitted = new Box3()
    model.traverse((child) => {
      if (!(child instanceof Mesh) || !child.visible || !child.geometry) return
      const piece = child.geometry.boundingBox!.clone()
      piece.applyMatrix4(child.matrixWorld)
      fitted.union(piece)
    })
    setShadowY(fitted.min.y + 0.01)

    const vFov = (camera.fov * Math.PI) / 180
    const aspect = view.width / Math.max(view.height, 1)
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
    const extentX = Math.max(Math.abs(fitted.min.x), Math.abs(fitted.max.x))
    const extentY = Math.max(Math.abs(fitted.min.y), Math.abs(fitted.max.y))
    const distance = Math.max(extentY / Math.tan(vFov / 2), extentX / Math.tan(hFov / 2)) * 1.28
    camera.position.set(0, extentY * 0.04, distance)
    camera.near = 0.01
    camera.far = distance * 8
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    onReady()
    invalidate()
  }, [camera, invalidate, model, onReady, view.height, view.width])

  return (
    <group ref={pivot}>
      <primitive object={model} />
      <ContactShadows position={[0, shadowY, 0]} opacity={0.28} scale={3} blur={2.2} far={2.4} />
    </group>
  )
}

export function UrnView({
  slug = 'bruma',
  className = '',
  spin = false,
  quality = 'full',
  priority = false,
}: {
  slug?: string
  className?: string
  spin?: boolean
  quality?: 'full' | 'lite'
  priority?: boolean
}) {
  const url = modelUrl(slug)
  const root = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(priority)
  const [ready, setReady] = useState(false)
  const lite = quality === 'lite'

  useEffect(() => {
    if (priority) {
      setVisible(true)
      return
    }
    const node = root.current
    if (!node) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '120px' },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [priority])

  useEffect(() => {
    setReady(false)
  }, [url])

  return (
    <div ref={root} className={`relative ${className}`}>
      {!ready && <UrnPlaceholder slug={slug} className="absolute inset-0 z-10" />}
      {visible && (
        <Canvas
          key={url}
          className={ready ? 'opacity-100 transition-opacity duration-500' : 'opacity-0'}
          camera={{ position: [0, 0.04, 4.2], fov: 28 }}
          dpr={lite ? [1, 1.5] : [1, 2]}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          frameloop={spin || !lite ? 'always' : 'demand'}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
            gl.toneMappingExposure = lite ? 0.88 : 1
          }}
        >
          <hemisphereLight color="#fff6ee" groundColor="#c4b5a4" intensity={0.72} />
          <ambientLight intensity={0.18} />
          <directionalLight position={[2.2, 3.4, 5.2]} intensity={1.35} />
          <directionalLight position={[-2.2, 1.2, 2.4]} intensity={0.32} />
          <Suspense fallback={null}>
            <UrnModel url={url} spin={spin} onReady={() => setReady(true)} />
            {!lite && <Environment preset="studio" environmentIntensity={0.55} />}
          </Suspense>
        </Canvas>
      )}
    </div>
  )
}

export function preloadUrn(slug: string) {
  useGLTF.preload(modelUrl(slug))
}

if (typeof window !== 'undefined') {
  const warm = () => {
    for (const slug of homeSlugs) useGLTF.preload(modelBySlug[slug])
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(warm)
  else window.setTimeout(warm, 500)
}

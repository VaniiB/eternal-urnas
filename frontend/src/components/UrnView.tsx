import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Box3, Group, MathUtils, Mesh, PerspectiveCamera, Vector3 } from 'three'

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

function modelUrl(slug: string) {
  return modelBySlug[slug] ?? modelBySlug.bruma
}

function UrnModel({
  url,
  spin,
  lite,
}: {
  url: string
  spin: boolean
  lite: boolean
}) {
  const { scene } = useGLTF(url, true)
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
    if (spinRef.current) {
      angle.current += delta * 0.75
      node.rotation.y = angle.current
      invalidate()
      return
    }
    if (Math.abs(angle.current) < 0.002) {
      angle.current = 0
      node.rotation.y = 0
      return
    }
    const rest = 0
    const deltaAngle = Math.atan2(Math.sin(angle.current - rest), Math.cos(angle.current - rest))
    angle.current = rest + MathUtils.damp(deltaAngle, 0, 4, delta)
    node.rotation.y = angle.current
    invalidate()
  })

  useLayoutEffect(() => {
    model.position.set(0, 0, 0)
    model.rotation.set(0, 0, 0)
    model.scale.set(1, 1, 1)
    model.traverse((child) => {
      if ((child as PerspectiveCamera).isCamera || /camera/i.test(child.name)) child.visible = false
      else child.visible = true
      if (child instanceof Mesh) {
        child.castShadow = false
        child.receiveShadow = false
        if (lite) {
          const mats = Array.isArray(child.material) ? child.material : [child.material]
          for (const mat of mats) {
            if (!mat) continue
            if ('normalMap' in mat) (mat as { normalMap: unknown }).normalMap = null
            if ('aoMap' in mat) (mat as { aoMap: unknown }).aoMap = null
            if ('roughnessMap' in mat) (mat as { roughnessMap: unknown }).roughnessMap = null
            mat.needsUpdate = true
          }
        }
      }
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
    invalidate()
  }, [camera, invalidate, lite, model, view.height, view.width])

  return (
    <group ref={pivot}>
      <primitive object={model} />
      {!lite ? (
        <ContactShadows position={[0, shadowY, 0]} opacity={0.22} scale={2.6} blur={1.8} far={1.8} frames={1} />
      ) : null}
    </group>
  )
}

function useInView(active: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(!active)

  useEffect(() => {
    if (!active) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true)
      },
      { rootMargin: '120px', threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [active])

  return { ref, visible }
}

export function UrnView({
  slug = 'bruma',
  className = '',
  spin = false,
  quality = 'lite',
}: {
  slug?: string
  className?: string
  spin?: boolean
  /** lite: cards/grids (sin HDR, sin sombras dinámicas). full: ficha / hero. */
  quality?: 'lite' | 'full'
}) {
  const url = modelUrl(slug)
  const full = quality === 'full'
  const { ref, visible } = useInView(true)

  return (
    <div ref={ref} className={className}>
      {!visible ? (
        <div className="h-full w-full animate-pulse rounded-sm bg-[#173E3A]/06" aria-hidden />
      ) : (
        <Canvas
          key={url}
          camera={{ position: [0, 0.04, 4.2], fov: 28 }}
          dpr={full ? [1, 1.35] : [1, 1]}
          frameloop={spin ? 'always' : 'demand'}
          gl={{
            alpha: true,
            antialias: full,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
            gl.toneMappingExposure = 0.82
          }}
        >
          <hemisphereLight color="#fff6ee" groundColor="#c4b5a4" intensity={full ? 0.78 : 0.95} />
          <ambientLight intensity={full ? 0.22 : 0.35} />
          <directionalLight position={[2.2, 3.4, 5.2]} intensity={full ? 1.25 : 1.05} />
          {full ? <directionalLight position={[-2.2, 1.2, 2.4]} intensity={0.28} /> : null}
          <Suspense fallback={null}>
            <UrnModel url={url} spin={spin} lite={!full} />
          </Suspense>
        </Canvas>
      )}
    </div>
  )
}

/** Precarga selectiva: solo la urna de la ficha o la del centro del carrusel. */
export function preloadUrn(slug: string) {
  const url = modelUrl(slug)
  useGLTF.preload(url, true)
}

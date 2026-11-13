import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, useGLTF } from '@react-three/drei'
import { Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react'
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

function UrnModel({ url, spin }: { url: string; spin: boolean }) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => scene.clone(true), [scene])
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const view = useThree((state) => state.size)
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
  }, [camera, model, view.height, view.width])

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
}: {
  slug?: string
  className?: string
  spin?: boolean
}) {
  const url = modelUrl(slug)
  return (
    <div className={className}>
      <Canvas
        key={url}
        camera={{ position: [0, 0.04, 4.2], fov: 28 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          gl.toneMappingExposure = 0.78
        }}
      >
        <hemisphereLight color="#fff6ee" groundColor="#c4b5a4" intensity={0.72} />
        <ambientLight intensity={0.18} />
        <directionalLight position={[2.2, 3.4, 5.2]} intensity={1.35} />
        <directionalLight position={[-2.2, 1.2, 2.4]} intensity={0.32} />
        <Suspense fallback={null}>
          <UrnModel url={url} spin={spin} />
          <Environment preset="studio" environmentIntensity={0.32} />
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload(modelBySlug.bruma)

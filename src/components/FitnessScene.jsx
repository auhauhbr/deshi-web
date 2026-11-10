import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function createGymObjects() {
  const group = new THREE.Group()
  const graphite = new THREE.MeshStandardMaterial({ color: '#343b3a', roughness: 0.34, metalness: 0.58 })
  const dark = new THREE.MeshStandardMaterial({ color: '#171e1c', roughness: 0.42, metalness: 0.3 })
  const steel = new THREE.MeshStandardMaterial({ color: '#a8b5af', roughness: 0.25, metalness: 0.8 })
  const green = new THREE.MeshStandardMaterial({ color: '#8eea23', roughness: 0.3, metalness: 0.16 })
  const brightGreen = new THREE.MeshStandardMaterial({ color: '#00d9a0', roughness: 0.24, metalness: 0.1, emissive: '#007b55', emissiveIntensity: 0.18 })

  function cylinder(parent, radiusTop, radiusBottom, height, material, position, rotationZ = 0) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 40), material)
    mesh.position.set(...position)
    mesh.rotation.z = rotationZ
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }

  // Main object: an angled, plate-loaded dumbbell.
  const dumbbell = new THREE.Group()
  cylinder(dumbbell, 0.065, 0.065, 1.8, steel, [0, 0, 0], Math.PI / 2)
  cylinder(dumbbell, 0.085, 0.085, 0.55, dark, [0, 0, 0], Math.PI / 2)
  for (const side of [-1, 1]) {
    cylinder(dumbbell, 0.39, 0.39, 0.2, graphite, [side * 0.77, 0, 0], Math.PI / 2)
    cylinder(dumbbell, 0.32, 0.32, 0.12, dark, [side * 0.91, 0, 0], Math.PI / 2)
    cylinder(dumbbell, 0.11, 0.11, 0.07, green, [side * 0.99, 0, 0], Math.PI / 2)
  }
  dumbbell.position.set(-0.15, 0.15, 0.55)
  dumbbell.rotation.z = -0.16
  group.add(dumbbell)

  // Kettlebell with a thick, open handle.
  const kettlebell = new THREE.Group()
  const kettleBody = new THREE.Mesh(new THREE.SphereGeometry(0.42, 40, 28), graphite)
  kettleBody.scale.set(1, 0.92, 0.9)
  kettleBody.position.y = -0.12
  kettleBody.castShadow = true
  kettlebell.add(kettleBody)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.055, 16, 48), green)
  handle.position.y = 0.32
  handle.castShadow = true
  kettlebell.add(handle)
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.12, 40), brightGreen)
  collar.position.y = 0.24
  kettlebell.add(collar)
  kettlebell.position.set(1.2, -0.27, 0.22)
  kettlebell.scale.setScalar(0.8)
  group.add(kettlebell)

  // Reusable water bottle with a lime lid.
  const bottle = new THREE.Group()
  cylinder(bottle, 0.25, 0.32, 0.95, brightGreen, [0, -0.1, 0])
  cylinder(bottle, 0.16, 0.2, 0.17, green, [0, 0.46, 0])
  cylinder(bottle, 0.19, 0.19, 0.14, dark, [0, 0.6, 0])
  const bottleCap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.09, 40), graphite)
  bottleCap.position.y = 0.7
  bottle.add(bottleCap)
  bottle.position.set(-1.35, -0.28, 0.42)
  bottle.scale.setScalar(0.8)
  group.add(bottle)

  // Exercise ball and subtle molded rings.
  const ball = new THREE.Group()
  const ballBody = new THREE.Mesh(new THREE.SphereGeometry(0.45, 40, 32), green)
  ballBody.castShadow = true
  ball.add(ballBody)
  for (const y of [-0.21, 0, 0.21]) {
    const ringRadius = Math.sqrt(0.45 ** 2 - y ** 2) + 0.008
    const ring = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, 0.009, 8, 56), brightGreen)
    ring.position.y = y
    ball.add(ring)
  }
  ball.position.set(1.67, 0.82, -0.25)
  ball.scale.setScalar(0.72)
  group.add(ball)

  // Low training bench in the background to echo the equipment board.
  const bench = new THREE.Group()
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.14, 0.4), dark)
  cushion.position.y = 0.18
  cushion.castShadow = true
  bench.add(cushion)
  const cushionTop = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.06, 0.36), green)
  cushionTop.position.set(0, 0.28, 0)
  cushionTop.castShadow = true
  bench.add(cushionTop)
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.5, 0.09), graphite)
    leg.position.set(side * 0.36, -0.1, 0)
    leg.rotation.z = side * -0.12
    leg.castShadow = true
    bench.add(leg)
  }
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.07, 0.12), dark)
  foot.position.set(0, -0.37, 0)
  bench.add(foot)
  bench.position.set(0, -0.72, -0.65)
  bench.rotation.y = -0.12
  bench.scale.setScalar(0.78)
  group.add(bench)

  group.userData.floatingParts = [kettlebell, bottle, ball]
  group.userData.floatingParts.forEach((part) => {
    part.userData.floatBaseY = part.position.y
  })
  group.userData.materials = [graphite, dark, steel, green, brightGreen]
  return group
}

function FitnessScene() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!canvas || !container) return undefined

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    } catch {
      canvas.dataset.webgl = 'unavailable'
      return undefined
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0.1, 2.45, 8.1)
    camera.lookAt(0, 0, 0)

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15

    scene.add(new THREE.HemisphereLight('#effff7', '#52635a', 2.1))
    const keyLight = new THREE.DirectionalLight('#ffffff', 2.6)
    keyLight.position.set(-3.5, 5, 5)
    scene.add(keyLight)
    const greenLight = new THREE.PointLight('#75f731', 3.8, 7)
    greenLight.position.set(2.5, 2.5, 2.8)
    scene.add(greenLight)
    const fillLight = new THREE.PointLight('#20d9aa', 2.1, 8)
    fillLight.position.set(-3, 0, 2)
    scene.add(fillLight)

    const platform = new THREE.Mesh(
      new THREE.CircleGeometry(2.7, 64),
      new THREE.MeshBasicMaterial({ color: '#6fe6aa', transparent: true, opacity: 0.17, depthWrite: false }),
    )
    platform.rotation.x = -Math.PI / 2
    platform.position.set(0, -1.12, 0)
    platform.scale.set(1.25, 0.63, 1)
    scene.add(platform)

    const equipment = createGymObjects()
    scene.add(equipment)

    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.position.z = width < 480 ? 8.8 : 8.1
      camera.updateProjectionMatrix()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const clock = new THREE.Clock()
    let frameId
    const renderFrame = () => {
      const elapsed = clock.getElapsedTime()
      if (!reducedMotion.matches) {
        equipment.rotation.y = Math.sin(elapsed * 0.28) * 0.13
        equipment.rotation.x = Math.sin(elapsed * 0.2) * 0.025
        equipment.userData.floatingParts.forEach((part, index) => {
          part.position.y = part.userData.floatBaseY + Math.sin(elapsed * 1.25 + index * 1.7) * 0.08
        })
      }
      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(renderFrame)
    }
    renderFrame()

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      equipment.traverse((object) => {
        if (object.geometry) object.geometry.dispose()
      })
      equipment.userData.materials.forEach((material) => material.dispose())
      platform.geometry.dispose()
      platform.material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fitness-scene-canvas"
      role="img"
      aria-label="Cena 3D com halter, kettlebell, garrafa, bola de exercício e banco de treino"
    />
  )
}

export default FitnessScene

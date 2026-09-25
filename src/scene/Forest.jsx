import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { DAWN_Z, EDGE_Z, groundY, pathX } from '../lib/path.js'
import { rand } from '../lib/util.js'
import { swayingMaterial } from './Terrain.jsx'
import { CAMPFIRE } from './Campfire.jsx'

function paint(geo, hex) {
  const c = new THREE.Color(hex)
  const n = geo.attributes.position.count
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3)
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3))
  return geo
}

// A low-poly spruce: trunk plus four stacked cones, merged into one geometry.
function spruceGeometry() {
  const parts = [paint(new THREE.CylinderGeometry(0.09, 0.15, 1.8, 6).translate(0, 0.9, 0), '#3a2a1e')]
  const tiers = [
    [1.45, 2.3, 1.1, '#23382a'],
    [1.12, 2.0, 2.2, '#26402d'],
    [0.82, 1.7, 3.2, '#2a4731'],
    [0.52, 1.4, 4.1, '#2f4f35'],
  ]
  for (const [r, h, y, col] of tiers) parts.push(paint(new THREE.ConeGeometry(r, h, 7, 1).translate(0, y + h / 2, 0), col))
  return mergeGeometries(parts)
}

// A dead, leafless tree for variety.
function deadGeometry() {
  const parts = [paint(new THREE.CylinderGeometry(0.06, 0.16, 5, 5).translate(0, 2.5, 0), '#3b322a')]
  for (let i = 0; i < 5; i++) {
    const b = new THREE.CylinderGeometry(0.02, 0.05, 1.4, 4)
    b.translate(0, 0.7, 0)
    b.rotateZ((i % 2 ? 1 : -1) * (0.6 + i * 0.12))
    b.rotateY(i * 1.3)
    b.translate(0, 1.8 + i * 0.6, 0)
    parts.push(paint(b, '#3b322a'))
  }
  return mergeGeometries(parts)
}

function scatter() {
  const spruce = []
  const dead = []
  for (let z = 36; z > EDGE_Z + 2; z -= 2.5) {
    for (let x = -64; x < 64; x += 2.5) {
      const px = x + rand(-1.1, 1.1)
      const pz = z + rand(-1.1, 1.1)
      const dp = Math.abs(px - pathX(pz))
      if (dp < 2.3 + Math.random() * 1.6) continue
      if (Math.random() < 0.17) continue
      if (Math.hypot(px - CAMPFIRE.x, pz - CAMPFIRE.z) < 6) continue
      // open a widening gap from where you wake at dawn out to the beach
      if (pz < DAWN_Z + 4 && dp < 2.6 + (DAWN_Z + 4 - pz) * 0.26) continue
      if (pz < -191 && Math.random() < (-191 - pz) / 8) continue
      const t = { x: px, z: pz, y: groundY(px, pz) - 0.1, s: rand(0.9, 2.5), w: rand(0.85, 1.15), r: rand(0, Math.PI * 2), shade: rand(0.6, 1.1) }
      if (Math.random() < 0.04) dead.push(t)
      else spruce.push(t)
    }
  }
  return { spruce, dead }
}

function Instances({ geometry, items, strength }) {
  const ref = useRef()
  const mat = useMemo(
    () => swayingMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }, strength),
    [strength],
  )
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3()
    const p = new THREE.Vector3()
    const e = new THREE.Euler()
    const c = new THREE.Color()
    items.forEach((t, i) => {
      p.set(t.x, t.y, t.z)
      q.setFromEuler(e.set(rand(-0.04, 0.04), t.r, rand(-0.04, 0.04)))
      s.set(t.s * t.w, t.s, t.s * t.w)
      ref.current.setMatrixAt(i, m.compose(p, q, s))
      ref.current.setColorAt(i, c.setScalar(t.shade))
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
  }, [items])
  return <instancedMesh ref={ref} args={[geometry, mat, items.length]} frustumCulled={false} />
}

export default function Forest() {
  const { spruceGeo, deadGeo, spruce, dead } = useMemo(() => {
    const { spruce, dead } = scatter()
    return { spruceGeo: spruceGeometry(), deadGeo: deadGeometry(), spruce, dead }
  }, [])
  return (
    <>
      <Instances geometry={spruceGeo} items={spruce} strength={0.004} />
      <Instances geometry={deadGeo} items={dead} strength={0.003} />
    </>
  )
}

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { EDGE_Z, groundY, pathX } from '../lib/path.js'
import { env } from '../lib/store.js'
import { rand, ss } from '../lib/util.js'

// Ground: forest floor, a muddy trail, then sand sloping into the sea.
export function Ground() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(300, 330, 150, 180)
    g.rotateX(-Math.PI / 2)
    g.translate(0, 0, -105)
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const forest = new THREE.Color('#1a2117')
    const moss = new THREE.Color('#223020')
    const trail = new THREE.Color('#3a2f24')
    const sand = new THREE.Color('#a48c6b')
    const wet = new THREE.Color('#5f5142')
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setY(i, groundY(x, z))
      const dp = Math.abs(x - pathX(z))
      c.copy(forest).lerp(moss, Math.random() * 0.6).multiplyScalar(0.8 + Math.random() * 0.35)
      c.lerp(trail, ss(2.2, 0.7, dp) * 0.9)
      c.lerp(sand, ss(EDGE_Z + 4, EDGE_Z - 4, z))
      c.lerp(wet, ss(-214, -222, z))
      colors.set([c.r, c.g, c.b], i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial vertexColors roughness={1} />
    </mesh>
  )
}

function swayingMaterial(props, strength) {
  const mat = new THREE.MeshStandardMaterial(props)
  mat.onBeforeCompile = s => {
    s.uniforms.uTime = env.time
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec2 ip = vec2(instanceMatrix[3].x, instanceMatrix[3].z);
        float sway = sin(uTime * 1.6 + ip.x * .4 + ip.y * .3) * .6 + sin(uTime * 3.1 + ip.y * .7) * .3;
        transformed.x += sway * position.y * position.y * ${strength.toFixed(3)};`,
      )
  }
  return mat
}

// Clumps of tall grass along the trail and at the forest edge.
export function Grass() {
  const ref = useRef()
  const { geo, mat, items } = useMemo(() => {
    const verts = []
    const cols = []
    const base = new THREE.Color('#1d2616')
    const tip = new THREE.Color('#5b6a3a')
    for (let b = 0; b < 6; b++) {
      const a = (b / 6) * Math.PI + rand(-0.3, 0.3)
      const h = rand(0.35, 0.7)
      const w = 0.035
      const ox = rand(-0.12, 0.12)
      const oz = rand(-0.12, 0.12)
      const lean = rand(-0.12, 0.12)
      const dx = Math.cos(a) * w
      const dz = Math.sin(a) * w
      verts.push(ox - dx, 0, oz - dz, ox + dx, 0, oz + dz, ox + lean, h, oz + lean * 0.5)
      cols.push(base.r, base.g, base.b, base.r, base.g, base.b, tip.r, tip.g, tip.b)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(verts.length).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3))

    const list = []
    const place = (count, z0, z1, minD, maxD) => {
      for (let i = 0; i < count; i++) {
        const z = rand(z1, z0)
        const side = Math.random() < 0.5 ? -1 : 1
        const x = pathX(z) + side * rand(minD, maxD)
        list.push({ x, z, y: groundY(x, z), s: rand(0.5, 1.15), r: rand(0, Math.PI * 2) })
      }
    }
    place(4200, 30, -60, 1.4, 16)
    place(900, -60, -196, 0.9, 5)
    place(900, -180, -199, 0.8, 26)
    return {
      geo: g,
      mat: swayingMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 }, 0.16),
      items: list,
    }
  }, [])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3()
    const p = new THREE.Vector3()
    const e = new THREE.Euler()
    items.forEach((it, i) => {
      p.set(it.x, it.y, it.z)
      q.setFromEuler(e.set(0, it.r, 0))
      s.setScalar(it.s)
      ref.current.setMatrixAt(i, m.compose(p, q, s))
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [items])

  return <instancedMesh ref={ref} args={[geo, mat, items.length]} frustumCulled={false} />
}

export { swayingMaterial }

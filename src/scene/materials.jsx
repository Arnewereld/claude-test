import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

const mats = new Map()

// Shared materials, one per color/finish.
export function mat(color, roughness = 0.62, metalness = 0) {
  const key = `${color}|${roughness}|${metalness}`
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }))
  return mats.get(key)
}

const geos = new Map()
export function rounded(w, h, d, r = 0.06, seg = 3) {
  const key = `${w}|${h}|${d}|${r}|${seg}`
  if (!geos.has(key)) geos.set(key, new RoundedBoxGeometry(w, h, d, seg, r))
  return geos.get(key)
}

// Tiny helpers so models read like a parts list.
export function Box({ size, color, rough, metal, ...props }) {
  return (
    <mesh castShadow receiveShadow material={mat(color, rough, metal)} {...props}>
      <boxGeometry args={size} />
    </mesh>
  )
}

export function RBox({ size, radius = 0.06, color, rough, metal, ...props }) {
  return <mesh castShadow receiveShadow geometry={rounded(...size, radius)} material={mat(color, rough, metal)} {...props} />
}

export function Cyl({ r, rTop, h, seg = 20, color, rough, metal, ...props }) {
  return (
    <mesh castShadow receiveShadow material={mat(color, rough, metal)} {...props}>
      <cylinderGeometry args={[rTop ?? r, r, h, seg]} />
    </mesh>
  )
}

// Canvas-drawn texture (labels, signs, belt pattern).
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

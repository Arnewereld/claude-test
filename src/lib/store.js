import * as THREE from 'three'

// Per-frame shared state. Kept outside React so the render loop never triggers re-renders.

export const pointer = { x: 0, y: 0, moved: false } // normalized device coords, -1..1

export const SUN_DIR = new THREE.Vector3(0.24, 0.05, -1).normalize()
export const MOON_DIR = new THREE.Vector3(0.38, 0.33, -1).normalize()

export const env = {
  dawn: 0, // 0 = rainy night, 1 = sunrise on the coast
  warp: 0, // 0..1 while running (stretches rain into streaks)
  flash: 0, // lightning brightness
  lightOn: 1,
  lightPos: new THREE.Vector3(),
  lightDir: new THREE.Vector3(0, 0, -1),
  skyTop: new THREE.Color(),
  skyHor: new THREE.Color(),
  time: { value: 0 }, // shared shader uniform
}

if (typeof window !== 'undefined') {
  const track = e => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
  }
  window.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') pointer.moved = true
    track(e)
  }, { passive: true })
  window.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') { pointer.moved = true; track(e) }
  }, { passive: true })
}

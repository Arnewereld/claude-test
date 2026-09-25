import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { hash, KRAFT } from '../lib/parcel.js'
import { BOX } from './layout.js'
import { rounded } from './materials.jsx'

function drawLabel(g, w, h, email) {
  g.clearRect(0, 0, w, h)
  g.fillStyle = '#ffffff'
  g.beginPath()
  g.roundRect(0, 0, w, h, 18)
  g.fill()
  g.fillStyle = '#2563eb'
  g.beginPath()
  g.roundRect(22, 20, 44, 44, 10)
  g.fill()
  g.fillStyle = '#0f172a'
  g.font = '800 34px "Plus Jakarta Sans Variable", system-ui, sans-serif'
  g.textBaseline = 'middle'
  g.fillText('Depot', 80, 44)
  g.fillStyle = '#64748b'
  g.font = '700 20px "Plus Jakarta Sans Variable", system-ui, sans-serif'
  g.fillText('SHIP TO', 24, 98)
  g.fillStyle = '#0f172a'
  let size = 34
  g.font = `700 ${size}px "Plus Jakarta Sans Variable", system-ui, sans-serif`
  const text = email || 'you@example.com'
  while (g.measureText(text).width > w - 48 && size > 16) {
    size -= 2
    g.font = `700 ${size}px "Plus Jakarta Sans Variable", system-ui, sans-serif`
  }
  g.fillText(text, 24, 136)
  // barcode from the email hash
  let hsh = hash(text)
  let x = 24
  g.fillStyle = '#0f172a'
  while (x < w - 30) {
    const bw = 2 + (hsh & 3) * 2
    g.fillRect(x, 170, bw, 62)
    x += bw + 3 + ((hsh >> 2) & 3) * 2
    hsh = Math.imul(hsh ^ (hsh >>> 13), 0x5bd1e995) >>> 0
  }
}

// The parcel. Its color, position and squash are driven by the director.
export default function Parcel({ rig, email }) {
  const { boxMat, tapeMat, labelMat, labelTex, canvas } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const labelTex = new THREE.CanvasTexture(canvas)
    labelTex.colorSpace = THREE.SRGBColorSpace
    labelTex.anisotropy = 4
    const boxMat = new THREE.MeshStandardMaterial({ color: KRAFT, roughness: 0.75 })
    const tapeMat = new THREE.MeshStandardMaterial({ color: KRAFT, roughness: 0.35 })
    const labelMat = new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.6, transparent: true })
    rig.parcelMat = boxMat
    rig.tapeMat = tapeMat
    return { boxMat, tapeMat, labelMat, labelTex, canvas }
  }, [rig])

  useEffect(() => {
    drawLabel(canvas.getContext('2d'), canvas.width, canvas.height, email)
    labelTex.needsUpdate = true
    // redraw once the web font has loaded
    document.fonts?.ready.then(() => {
      drawLabel(canvas.getContext('2d'), canvas.width, canvas.height, email)
      labelTex.needsUpdate = true
    })
  }, [email, canvas, labelTex])

  const geo = rounded(BOX.w, BOX.h, BOX.d, 0.05, 3)
  return (
    <group ref={el => { rig.parcel = el }} visible={false}>
      <group ref={el => { rig.parcelBody = el }}>
        <mesh geometry={geo} material={boxMat} castShadow receiveShadow />
        <mesh material={tapeMat} castShadow>
          <boxGeometry args={[BOX.w + 0.012, BOX.h + 0.012, 0.16]} />
        </mesh>
        <mesh material={labelMat} position={[0, 0.02, BOX.d / 2 + 0.004]}>
          <planeGeometry args={[0.6, 0.3]} />
        </mesh>
        <mesh material={labelMat} position={[0.14, BOX.h / 2 + 0.008, 0.26]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.52, 0.26]} />
        </mesh>
      </group>
    </group>
  )
}

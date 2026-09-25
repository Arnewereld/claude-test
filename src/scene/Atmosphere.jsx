import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MOON_DIR, SUN_DIR, env } from '../lib/store.js'
import { Sound } from '../lib/sound.js'
import { pathX } from '../lib/path.js'
import { rand, reduceMotion } from '../lib/util.js'
import { NOISE } from './glsl.js'

const NIGHT = {
  top: new THREE.Color('#020409'),
  hor: new THREE.Color('#141c25'),
  hemiSky: new THREE.Color('#3b4e66'),
  hemiGround: new THREE.Color('#0b0d0b'),
  hemi: 0.75,
  key: new THREE.Color('#8ea4c8'),
  keyI: 0.35,
  fog: 0.05,
}
const DAWN = {
  top: new THREE.Color('#34445f'),
  hor: new THREE.Color('#e3a47c'),
  hemiSky: new THREE.Color('#d8b39a'),
  hemiGround: new THREE.Color('#3b3126'),
  hemi: 1.6,
  key: new THREE.Color('#ffc48a'),
  keyI: 2.4,
  fog: 0.0105,
}


const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`
const skyFrag = /* glsl */ `
  uniform vec3 uTop, uHor, uSunDir, uMoonDir;
  uniform float uDawn, uTime, uFlash;
  varying vec3 vDir;
  ${NOISE}
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    float night = 1. - uDawn;
    vec3 col = mix(uHor, uTop, smoothstep(-0.02, 0.5, h));

    float sd = max(dot(d, uSunDir), 0.);
    col += uDawn * (vec3(1., .5, .25) * pow(sd, 6.) * .5 + vec3(1., .72, .42) * pow(sd, 60.) * .9
                    + vec3(1., .92, .78) * smoothstep(.9993, .9996, sd) * 3.);

    float md = max(dot(d, uMoonDir), 0.);
    vec3 sp = d * 380.;
    float r = hash13(floor(sp));
    float star = step(.9966, r) * smoothstep(.35, 0., length(fract(sp) - .5));
    star *= (.55 + .45 * sin(uTime * (1.5 + r * 3.) + r * 50.)) * smoothstep(.03, .25, h);

    vec2 cp = d.xz / (h + .12) * .9 + vec2(uTime * .012, uTime * .004);
    float cover = smoothstep(.42, .78, fbm(cp * 1.4)) * smoothstep(-.02, .2, h);

    float moonDisc = smoothstep(.99955, .99975, md);
    float craters = .82 + .18 * vnoise(d.xy * 900.);
    col += night * (vec3(.8, .85, 1.) * star * (1. - cover)
                  + vec3(.9, .9, .84) * moonDisc * craters * (1. - cover * .75) * 1.3
                  + vec3(.25, .3, .38) * pow(md, 180.) * .9
                  + vec3(.05, .07, .1) * pow(md, 12.));

    vec3 cloudNight = mix(uHor * 1.25, uHor * .55, smoothstep(0., .4, h)) + vec3(.1, .11, .13) * pow(md, 8.);
    vec3 cloudDawn = mix(vec3(.6, .4, .42), vec3(1., .7, .48), pow(sd, 3.)) * mix(1., .72, smoothstep(0., .5, h));
    col = mix(col, mix(cloudNight, cloudDawn, uDawn), cover * .92);
    col += uFlash * vec3(.5, .55, .72) * (.35 + .9 * cover) * smoothstep(-.1, .3, h);

    gl_FragColor = vec4(col, 1.);
    #include <colorspace_fragment>
  }
`

function drawBolt(ctx, w, h) {
  ctx.clearRect(0, 0, w, h)
  const seg = (x1, y1, x2, y2, disp) => {
    if (disp < 3) { ctx.lineTo(x2, y2); return }
    const mx = (x1 + x2) / 2 + rand(-disp, disp) * 0.5
    const my = (y1 + y2) / 2 + rand(-disp, disp) * 0.2
    seg(x1, y1, mx, my, disp / 2)
    seg(mx, my, x2, y2, disp / 2)
  }
  ctx.strokeStyle = 'rgba(235,242,255,1)'
  ctx.shadowColor = 'rgba(160,190,255,1)'
  ctx.shadowBlur = 18
  ctx.lineCap = 'round'
  ctx.lineWidth = 4
  const x = w * rand(0.35, 0.65)
  ctx.beginPath()
  ctx.moveTo(x, 0)
  seg(x, 0, w * rand(0.3, 0.7), h, 160)
  ctx.stroke()
  ctx.lineWidth = 1.6
  for (let i = 0; i < 3; i++) {
    const bx = x + rand(-40, 40), by = h * rand(0.2, 0.6)
    ctx.beginPath()
    ctx.moveTo(bx, by)
    seg(bx, by, bx + rand(-120, 120), by + rand(80, 200), 60)
    ctx.stroke()
  }
}

// Flash envelope over ~0.8s: bright, dim, bright again, fade.
const flashCurve = t =>
  t < 0.04 ? t / 0.04 : t < 0.16 ? 1 - ((t - 0.04) / 0.12) * 0.85 : t < 0.24 ? 0.15 + ((t - 0.16) / 0.08) * 0.7 : Math.max(0, 0.85 * (1 - (t - 0.24) / 0.55))

export default function Atmosphere({ time, stormy }) {
  const { scene, camera } = useThree()
  const hemi = useRef()
  const key = useRef()
  const sky = useRef()
  const bolt = useRef()
  const strike = useRef({ at: -10, next: 4 })

  const fog = useMemo(() => new THREE.FogExp2(NIGHT.hor.clone(), NIGHT.fog), [])
  useEffect(() => {
    scene.fog = fog
    return () => { scene.fog = null }
  }, [scene, fog])

  const skyMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color() },
      uHor: { value: new THREE.Color() },
      uSunDir: { value: SUN_DIR },
      uMoonDir: { value: MOON_DIR },
      uDawn: { value: 0 },
      uTime: env.time,
      uFlash: { value: 0 },
    },
    vertexShader: skyVert,
    fragmentShader: skyFrag,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  }), [])

  const boltCanvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 512
    return c
  }, [])
  const boltMat = useMemo(() => new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(boltCanvas),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }), [boltCanvas])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    env.time.value = t
    env.dawn = THREE.MathUtils.damp(env.dawn, time === 'dawn' ? 1 : 0, 2.4, dt)
    const d = env.dawn

    // lightning
    const s = strike.current
    if (stormy && !reduceMotion && d < 0.05 && t > s.next) {
      s.at = t
      s.next = t + rand(9, 19)
      drawBolt(boltCanvas.getContext('2d'), boltCanvas.width, boltCanvas.height)
      boltMat.map.needsUpdate = true
      const yaw = rand(-0.7, 0.7)
      const fwd = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw))
      bolt.current.position.copy(camera.position).addScaledVector(fwd, 170).setY(58)
      bolt.current.lookAt(camera.position.x, 58, camera.position.z)
      Sound.thunder(rand(0.5, 1.6))
    }
    env.flash = t - s.at < 0.8 ? flashCurve(t - s.at) : 0
    boltMat.opacity = env.flash

    env.skyTop.copy(NIGHT.top).lerp(DAWN.top, d)
    env.skyHor.copy(NIGHT.hor).lerp(DAWN.hor, d)
    fog.color.copy(env.skyHor)
    fog.density = THREE.MathUtils.lerp(NIGHT.fog, DAWN.fog, d) * (1 - env.flash * 0.35)

    const u = skyMat.uniforms
    u.uTop.value.copy(env.skyTop)
    u.uHor.value.copy(env.skyHor)
    u.uDawn.value = d
    u.uFlash.value = env.flash
    sky.current.position.copy(camera.position)

    hemi.current.color.copy(NIGHT.hemiSky).lerp(DAWN.hemiSky, d)
    hemi.current.groundColor.copy(NIGHT.hemiGround).lerp(DAWN.hemiGround, d)
    hemi.current.intensity = THREE.MathUtils.lerp(NIGHT.hemi, DAWN.hemi, d) + env.flash * 5
    key.current.color.copy(NIGHT.key).lerp(DAWN.key, d)
    key.current.intensity = THREE.MathUtils.lerp(NIGHT.keyI, DAWN.keyI, d) + env.flash * 2
    const dir = d > 0.5 ? SUN_DIR : MOON_DIR
    key.current.position.copy(camera.position).addScaledVector(dir, 100)
    key.current.target.position.copy(camera.position)
    key.current.target.updateMatrixWorld()
  })

  return (
    <>
      <mesh ref={sky} material={skyMat} renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[600, 48, 24]} />
      </mesh>
      <mesh ref={bolt} material={boltMat} frustumCulled={false}>
        <planeGeometry args={[60, 120]} />
      </mesh>
      <hemisphereLight ref={hemi} />
      <directionalLight ref={key} />
      <Beacon />
    </>
  )
}

// Blinking red light on a far-away radio tower, visible through the fog.
function Beacon() {
  const ref = useRef()
  const mat = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    grd.addColorStop(0, 'rgba(255,255,255,1)')
    grd.addColorStop(0.15, 'rgba(255,90,80,.9)')
    grd.addColorStop(1, 'rgba(255,0,0,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 64, 64)
    return new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c),
      color: '#ff4040',
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  }, [])
  useFrame(({ clock }) => {
    const on = clock.elapsedTime % 2.4 < 0.3
    mat.opacity = (on ? 1 : 0.06) * (1 - env.dawn)
  })
  return <sprite ref={ref} material={mat} position={[pathX(-130) + 42, 34, -130]} scale={[7, 7, 1]} />
}

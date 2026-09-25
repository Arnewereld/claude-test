import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { KRAFT } from '../lib/parcel.js'
import { clamp, easeIn, easeInOut, easeOut, lerp, pointer, reduceMotion } from '../lib/util.js'
import * as L from './layout.js'

const DUR = { drop: 0.95, approach: 2.6, lift: 0.8, reverse: 2.0, toTruck: 2.4, load: 1.1, backoff: 1.1, door: 1.0, drive: 3.4, arrive: 3.0, reopen: 0.9 }
const DOOR_H = 2.4
const DRIVE_DIST = 40
const kraft = new THREE.Color(KRAFT)
const want = new THREE.Color()
const focusWant = new THREE.Vector3()
const camDir = new THREE.Vector3(-0.3, 0.5, 1).normalize()

// Quadratic bezier on the floor plane, with its tangent.
function bez(p0, c, p1, t) {
  const u = 1 - t
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    z: u * u * p0.z + 2 * u * t * c.z + t * t * p1.z,
    dx: 2 * u * (c.x - p0.x) + 2 * t * (p1.x - c.x),
    dz: 2 * u * (c.z - p0.z) + 2 * t * (p1.z - c.z),
  }
}

/**
 * Plays the whole show, one step at a time:
 * idle → drop → belt (painted) → ready → approach → lift → holding
 *      → reverse → toTruck → load → backoff → door → drive → done → arrive → reopen → idle
 * `target` says how far the UI allows it to go: 1 email ok, 2 password typed, 3 submitted, -1 sign out.
 */
export default function Director({ rig, target, colorHex, onStep }) {
  const props = useRef({})
  props.current = { target, colorHex, onStep }
  const s = useRef({
    step: 'idle',
    t: 0,
    box: new THREE.Vector3(L.HOPPER_X, 3.1, L.BELT_Z),
    boxRot: 0,
    boxRotOffset: 0,
    boxLocal: 0,
    boxVisible: false,
    squash: 0,
    attach: 'belt',
    paint: 0,
    painted: false,
    color: new THREE.Color(KRAFT),
    shown: new THREE.Color(KRAFT),
    lastHex: null,
    burst: 0,
    loadFrom: new THREE.Vector3(),
    fork: { x: L.PARK.x, z: L.PARK.z, h: L.PARK.h, y: L.FORK_TRAVEL, spin: 0 },
    truck: { x: L.TRUCK_X, door: 0 },
    focus: new THREE.Vector3(0.6, 0.9, -0.6),
    intro: 1,
  }).current

  // Keep the action centered in the space next to (or above) the login card.
  const { camera, size } = useThree()
  const fit = useRef(1)
  useEffect(() => {
    const wide = size.width >= 900
    const sx = wide ? Math.min(290, size.width * 0.22) : 0
    const sy = wide ? 0 : size.height * 0.31
    camera.setViewOffset(size.width, size.height, -sx, sy, size.width, size.height)
    camera.updateProjectionMatrix()
    const eff = (size.width - 2 * sx) / (size.height - 2 * sy)
    fit.current = clamp(1.5 / eff, 1, 2.8)
  }, [camera, size])

  const go = step => {
    s.step = step
    s.t = 0
    props.current.onStep?.(step)
  }

  const driveFork = (p, reverse) => {
    const f = s.fork
    const dist = Math.hypot(p.x - f.x, p.z - f.z)
    if (Math.hypot(p.dx, p.dz) > 1e-5) f.h = Math.atan2(p.dx, p.dz) + (reverse ? Math.PI : 0)
    f.spin += (dist / 0.28) * (reverse ? -1 : 1)
    f.x = p.x
    f.z = p.z
  }

  useFrame((state, dtRaw) => {
    if (!rig.forklift || !rig.truck || !rig.parcel || !rig.spray || !rig.door || !rig.carriage || !rig.beltTex) return
    const dt = Math.min(dtRaw, 0.05)
    const now = state.clock.elapsedTime
    const { target, colorHex } = props.current
    const early = ['drop', 'belt', 'approach', 'lift'].includes(s.step)
    const speed = reduceMotion ? 2.5 : target >= 3 && early ? 1.7 : 1
    const d = dt * speed
    s.t += d
    const k = name => clamp(s.t / DUR[name], 0, 1)
    const spray = rig.spray
    spray.emit = 0

    if (colorHex) s.color.set(colorHex)
    if (colorHex && s.painted && s.lastHex && colorHex !== s.lastHex) s.burst = 0.5
    if (colorHex) s.lastHex = colorHex

    switch (s.step) {
      case 'idle':
        if (target >= 1) {
          s.box.set(L.HOPPER_X, 3.1, L.BELT_Z)
          s.boxRot = 0
          s.boxVisible = true
          s.attach = 'belt'
          s.paint = 0
          s.painted = false
          s.shown.copy(kraft)
          go('drop')
        }
        break
      case 'drop': {
        const rest = L.BELT_TOP + L.BOX.h / 2
        const tf = 0.55
        if (s.t < tf) {
          const u = s.t / tf
          s.box.y = lerp(3.1, rest, u * u)
          s.squash = 0
        } else {
          s.box.y = rest
          const tau = s.t - tf
          s.squash = Math.exp(-7 * tau) * Math.cos(tau * 18) * 0.16
        }
        if (s.t >= DUR.drop) {
          s.squash = 0
          go('belt')
        }
        break
      }
      case 'belt': {
        s.box.x = Math.min(s.box.x + L.BELT_SPEED * d, L.BOX_REST_X)
        s.paint = Math.max(s.paint, clamp((s.box.x - (L.PAINT_X - 0.55)) / 1.1, 0, 1))
        if (Math.abs(s.box.x - L.PAINT_X) < 0.8) {
          spray.emit = 1
          spray.at.set(L.PAINT_X, 2.08, L.BELT_Z)
          spray.spread = 0.5
        }
        if (s.paint >= 1 && !s.painted) {
          s.painted = true
          props.current.onStep?.('painted')
        }
        if (s.box.x >= L.BOX_REST_X) go('ready')
        break
      }
      case 'ready':
        if (target >= 2) go('approach')
        break
      case 'approach': {
        const u = easeInOut(k('approach'))
        driveFork(bez(L.PARK, { x: L.PARK.x, z: L.PICK.z }, L.PICK, u), false)
        s.fork.y = lerp(L.FORK_TRAVEL, L.FORK_BELT, clamp((u - 0.4) / 0.5, 0, 1))
        if (k('approach') >= 1) {
          s.boxRotOffset = s.boxRot - s.fork.h
          go('lift')
        }
        break
      }
      case 'lift':
        s.fork.y = lerp(L.FORK_BELT, L.FORK_CARRY, easeInOut(k('lift')))
        s.attach = 'fork'
        if (k('lift') >= 1) go('holding')
        break
      case 'holding':
        if (target >= 3) go('reverse')
        break
      case 'reverse':
        driveFork(bez(L.PICK, { x: L.TURN.x, z: L.PICK.z }, L.TURN, easeInOut(k('reverse'))), true)
        if (k('reverse') >= 1) go('toTruck')
        break
      case 'toTruck': {
        const u = easeInOut(k('toTruck'))
        driveFork(bez(L.TURN, { x: L.TURN.x, z: L.DOCK.z }, L.DOCK, u), false)
        s.fork.y = lerp(L.FORK_CARRY, L.FORK_TRUCK, clamp((u - 0.3) / 0.6, 0, 1))
        if (k('toTruck') >= 1) {
          s.attach = 'free'
          s.loadFrom.copy(s.box)
          go('load')
        }
        break
      }
      case 'load': {
        const u = easeInOut(k('load'))
        s.box.x = lerp(s.loadFrom.x, L.TRUCK_X + 1.7, u)
        s.box.y = lerp(s.loadFrom.y, L.TRUCK_FLOOR + L.BOX.h / 2, clamp(u * 1.6, 0, 1))
        s.box.z = lerp(s.loadFrom.z, L.TRUCK_Z, u)
        s.fork.y = lerp(L.FORK_TRUCK, L.FORK_TRUCK - 0.08, u)
        if (k('load') >= 1) {
          s.attach = 'truck'
          s.boxLocal = s.box.x - s.truck.x
          go('backoff')
        }
        break
      }
      case 'backoff': {
        const u = easeInOut(k('backoff'))
        driveFork({ x: lerp(L.DOCK.x, L.BACKOFF.x, u), z: L.DOCK.z, dx: -1, dz: 0 }, true)
        s.fork.y = lerp(L.FORK_TRUCK - 0.08, L.FORK_TRAVEL, u)
        if (k('backoff') >= 1) go('door')
        break
      }
      case 'door':
        s.truck.door = easeInOut(k('door'))
        if (k('door') >= 1) go('drive')
        break
      case 'drive': {
        s.truck.x = L.TRUCK_X + easeIn(k('drive')) * DRIVE_DIST
        driveFork(bez(L.BACKOFF, { x: L.PARK.x, z: L.BACKOFF.z }, L.PARK, easeInOut(clamp(s.t / 2.6, 0, 1))), true)
        if (k('drive') >= 1) go('done')
        break
      }
      case 'done':
        if (target < 0) {
          s.boxVisible = false
          go('arrive')
        }
        break
      case 'arrive':
        s.truck.x = L.TRUCK_X + (1 - easeOut(k('arrive'))) * DRIVE_DIST
        if (k('arrive') >= 1) go('reopen')
        break
      case 'reopen':
        s.truck.door = 1 - easeInOut(k('reopen'))
        if (k('reopen') >= 1) go('idle')
        break
    }

    // parcel follows whatever is carrying it
    const f = s.fork
    if (s.attach === 'fork') {
      s.box.x = f.x + Math.sin(f.h) * L.FORK_REACH
      s.box.z = f.z + Math.cos(f.h) * L.FORK_REACH
      s.box.y = Math.max(L.BELT_TOP, f.y) + L.BOX.h / 2
      s.boxRot = f.h + s.boxRotOffset
    } else if (s.attach === 'truck') {
      s.box.x = s.truck.x + s.boxLocal
    }

    // paint: kraft → your color as it passes the booth; quick re-spray if the email changes
    want.copy(kraft).lerp(s.color, s.paint)
    s.shown.lerp(want, 1 - Math.exp(-dt * 10))
    rig.parcelMat.color.copy(s.shown)
    rig.tapeMat.color.copy(s.shown).multiplyScalar(0.78)
    if (s.burst > 0) {
      s.burst -= dt
      spray.emit = 1
      spray.at.set(s.box.x, s.box.y + 1.3, s.box.z)
      spray.spread = 0.35
    }
    spray.color.copy(s.color)
    if (rig.lampMat) rig.lampMat.emissiveIntensity = THREE.MathUtils.damp(rig.lampMat.emissiveIntensity, spray.emit ? 1.6 : 0.05, 8, dt)

    // apply transforms
    rig.parcel.visible = s.boxVisible
    rig.parcel.position.copy(s.box)
    rig.parcel.rotation.y = s.boxRot
    rig.parcelBody.scale.set(1 + s.squash * 0.6, 1 - s.squash, 1 + s.squash * 0.6)
    rig.parcelBody.position.y = (-s.squash * L.BOX.h) / 2

    rig.forklift.position.set(f.x, 0, f.z)
    rig.forklift.rotation.y = f.h
    rig.carriage.position.y = f.y
    rig.forkWheels.forEach(w => (w.rotation.x = f.spin))
    rig.beacon.rotation.y += dt * 5
    rig.beaconMat.emissiveIntensity = 0.5 + Math.max(0, Math.sin(now * 9)) * 1.2

    rig.truck.position.x = s.truck.x
    rig.truck.position.y = Math.sin(now * 38) * 0.004
    rig.truckWheels.forEach(w => (w.rotation.z = -(s.truck.x - L.TRUCK_X) / 0.5))
    rig.door.visible = s.truck.door > 0.01
    rig.door.scale.y = Math.max(s.truck.door, 0.001)
    rig.door.position.y = (-DOOR_H * s.truck.door) / 2

    const beltSpeed = s.step === 'belt' || s.step === 'drop' ? L.BELT_SPEED * speed : 0.35
    rig.beltTex.offset.x -= (beltSpeed * dt) / 0.5

    // camera: follow the action, ease in on load, drift with the mouse
    switch (s.step) {
      case 'drop': focusWant.set(-6.6, 1.1, -1); break
      case 'belt': focusWant.set(clamp(s.box.x + 1.2, -6.6, -1.2), 1.0, -0.8); break
      case 'ready': case 'approach': case 'lift': case 'holding': focusWant.set(-0.2, 0.9, -0.2); break
      case 'reverse': case 'toTruck': focusWant.set(clamp(f.x + 0.8, 0.5, 4), 1.0, -0.3); break
      case 'load': case 'backoff': case 'door': focusWant.set(4.6, 1.3, -0.6); break
      case 'drive': case 'arrive': case 'reopen': focusWant.set(Math.min(s.truck.x + 2, 11), 1.3, -0.8); break
      default: focusWant.set(0.6, 0.9, -0.6)
    }
    s.focus.lerp(focusWant, 1 - Math.exp(-dt * 1.6))
    s.intro = reduceMotion ? 0 : THREE.MathUtils.damp(s.intro, 0, 1.4, dt)
    s.zoom = THREE.MathUtils.damp(s.zoom ?? 1, s.step === 'idle' || s.step === 'done' ? 1 : 0.84, 1.2, dt)
    const dist = 15.5 * s.zoom * fit.current * (1 + easeInOut(s.intro) * 0.9)
    camera.position.copy(s.focus).addScaledVector(camDir, dist)
    camera.position.x += pointer.x * 0.9
    camera.position.y += pointer.y * 0.5 + s.intro * 4
    camera.lookAt(s.focus)
  })

  return null
}

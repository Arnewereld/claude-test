import { ss } from './util.js'

// The forest trail winds along -Z from the start clearing to the coast.
export const pathX = z => Math.sin(z * 0.035) * 4 + Math.sin(z * 0.011 + 1.3) * 6

export const START_Z = 12 // where you stand at the login screen
export const EDGE_Z = -196 // forest ends, beach begins
export const DAWN_Z = -181 // where you wake up after logging in, just inside the treeline
export const SEA_Y = -0.9 // shoreline lands around z = -222

export function groundY(x, z) {
  const dp = Math.abs(x - pathX(z))
  const bumps = (Math.sin(x * 0.13) + Math.cos(z * 0.11) + Math.sin((x + z) * 0.05)) * 0.22
  let y = bumps * ss(3, 12, dp) * ss(-198, -188, z)
  if (z < EDGE_Z) y -= (EDGE_Z - z) * 0.035
  return y
}

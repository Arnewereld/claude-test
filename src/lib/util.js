export const wait = ms => new Promise(r => setTimeout(r, ms))
export const rand = (a, b) => a + Math.random() * (b - a)
export const pick = arr => arr[Math.floor(Math.random() * arr.length)]
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t

// smoothstep that also works with a > b (falls instead of rises)
export const ss = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

export const reduceMotion =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
export const finePointer = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches

export const store = {
  get(k) { try { return localStorage.getItem(k) } catch { return null } },
  set(k, v) { try { localStorage.setItem(k, v) } catch { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k) } catch { /* private mode */ } },
}

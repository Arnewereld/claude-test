export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const BRAND = '#2563eb'
export const KRAFT = '#c9a06b'

// Every email gets its own parcel color.
export const PALETTE = [
  { hex: '#ff7a59', name: 'Tangerine' },
  { hex: '#4da3ff', name: 'Sky blue' },
  { hex: '#2fbf8a', name: 'Mint' },
  { hex: '#9b6dff', name: 'Lavender' },
  { hex: '#ffc53d', name: 'Sunflower' },
  { hex: '#ff5c8a', name: 'Bubblegum' },
  { hex: '#22b8cf', name: 'Lagoon' },
  { hex: '#7c8cf8', name: 'Periwinkle' },
  { hex: '#f76707', name: 'Pumpkin' },
  { hex: '#51cf66', name: 'Lime' },
]

export function hash(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export const parcelFor = email => PALETTE[hash(email.trim().toLowerCase()) % PALETTE.length]

export function trackingNumber(email) {
  const h = hash(email.trim().toLowerCase() + Date.now())
  const n = String(h).padStart(10, '0')
  return `DPT-${n.slice(0, 4)}-${n.slice(4, 8)}`
}

// Whichever of dark or white text contrasts more with the color.
export function inkOn(hex) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  const vsWhite = 1.05 / (lum + 0.05)
  const vsDark = (lum + 0.05) / 0.059
  return vsDark > vsWhite ? '#0f172a' : '#ffffff'
}

// SVG turbulence rendered by the browser once, then used as a CSS background.
const svgURL = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`

function noise(w, h, freq, octaves, seed, matrix) {
  return svgURL(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${octaves}" seed="${seed}" stitchTiles="stitch"/><feColorMatrix values="${matrix}"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
  )
}

export const grainTexture = noise(240, 240, '.85', 2, 5, '.33 .33 .33 0 0  .33 .33 .33 0 0  .33 .33 .33 0 0  0 0 0 0 1')
export const fogTexture = noise(900, 600, '.004 .01', 4, 42, '0 0 0 0 .82  0 0 0 0 .86  0 0 0 0 .88  1.8 0 0 0 -.66')

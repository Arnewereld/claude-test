// Every sound is synthesized with Web Audio: no audio files to load.
// Nothing plays until the user turns sound on (browsers block autoplay anyway).

export const Sound = {
  ctx: null,
  on: false,
  raining: true,

  init() {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return false
    const ctx = (this.ctx = new AC())
    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(ctx.destination)

    const len = ctx.sampleRate * 2
    this.white = ctx.createBuffer(1, len, ctx.sampleRate)
    const w = this.white.getChannelData(0)
    for (let i = 0; i < len; i++) w[i] = Math.random() * 2 - 1
    this.brown = ctx.createBuffer(1, len, ctx.sampleRate)
    const b = this.brown.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
      b[i] = last * 3.5
    }

    // rain
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 900
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 7000
    this.rainGain = ctx.createGain()
    this.rainGain.gain.value = this.raining ? 0.12 : 0
    this.loop(this.white).connect(hp).connect(lp).connect(this.rainGain).connect(this.master)

    // wind
    const wl = ctx.createBiquadFilter()
    wl.type = 'lowpass'
    wl.frequency.value = 480
    const windGain = ctx.createGain()
    windGain.gain.value = 0.3
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.07
    const lfoAmt = ctx.createGain()
    lfoAmt.gain.value = 0.2
    lfo.connect(lfoAmt).connect(windGain.gain)
    lfo.start()
    this.loop(this.brown).connect(wl).connect(windGain).connect(this.master)

    // sea (only audible at dawn)
    const sl = ctx.createBiquadFilter()
    sl.type = 'lowpass'
    sl.frequency.value = 700
    this.seaGain = ctx.createGain()
    this.seaGain.gain.value = this.raining ? 0 : 0.25
    const swell = ctx.createOscillator()
    swell.frequency.value = 0.11
    const swellAmt = ctx.createGain()
    swellAmt.gain.value = 0.15
    swell.connect(swellAmt).connect(this.seaGain.gain)
    swell.start()
    this.loop(this.brown).connect(sl).connect(this.seaGain).connect(this.master)
    return true
  },

  loop(buf) {
    const s = this.ctx.createBufferSource()
    s.buffer = buf
    s.loop = true
    s.start(0, Math.random() * 1.5)
    return s
  },

  toggle() {
    if (!this.ctx && !this.init()) return false
    this.on = !this.on
    if (this.ctx.state === 'suspended') this.ctx.resume()
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setTargetAtTime(this.on ? 0.9 : 0, t, 0.35)
    return this.on
  },

  weather(rain) {
    this.raining = rain
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.rainGain.gain.setTargetAtTime(rain ? 0.12 : 0, t, 1.2)
    this.seaGain.gain.setTargetAtTime(rain ? 0 : 0.25, t, 1.5)
  },

  env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(peak, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  },

  thunder(delay = 0) {
    if (!this.on) return
    const ctx = this.ctx
    const t = ctx.currentTime + delay
    const s = ctx.createBufferSource()
    s.buffer = this.brown
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(900, t)
    lp.frequency.exponentialRampToValueAtTime(110, t + 2.8)
    const g = ctx.createGain()
    this.env(g, t, 1.8, 0.08, 3.8)
    s.connect(lp).connect(g).connect(this.master)
    s.start(t)
    s.stop(t + 4.2)
  },

  thump(t, v) {
    const o = this.ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(72, t)
    o.frequency.exponentialRampToValueAtTime(38, t + 0.16)
    const g = this.ctx.createGain()
    this.env(g, t, v, 0.018, 0.22)
    o.connect(g).connect(this.master)
    o.start(t)
    o.stop(t + 0.3)
  },

  beat(n = 1, bpm = 62) {
    if (!this.on) return
    let t = this.ctx.currentTime + 0.03
    for (let i = 0; i < n; i++) {
      this.thump(t, 0.9)
      this.thump(t + 0.24, 0.55)
      t += 60 / bpm
    }
  },

  whoosh(dur = 2.8) {
    if (!this.on) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const s = ctx.createBufferSource()
    s.buffer = this.white
    s.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.1
    bp.frequency.setValueAtTime(260, t)
    bp.frequency.exponentialRampToValueAtTime(2600, t + dur)
    const g = ctx.createGain()
    this.env(g, t, 0.55, dur * 0.85, dur * 0.2)
    s.connect(bp).connect(g).connect(this.master)
    s.start(t)
    s.stop(t + dur * 1.1)
  },

  // footsteps on wet ground while running
  steps(n = 8, interval = 0.34) {
    if (!this.on) return
    const ctx = this.ctx
    for (let i = 0; i < n; i++) {
      const t = ctx.currentTime + 0.1 + i * interval * Math.max(0.55, 1 - i * 0.06)
      const s = ctx.createBufferSource()
      s.buffer = this.white
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 500 + Math.random() * 300
      const g = ctx.createGain()
      this.env(g, t, 0.35, 0.01, 0.12)
      s.connect(bp).connect(g).connect(this.master)
      s.start(t, Math.random())
      s.stop(t + 0.2)
    }
  },

  groan() {
    if (!this.on) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(95 + Math.random() * 30, t)
    o.frequency.linearRampToValueAtTime(70, t + 1.3)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(380, t)
    lp.frequency.linearRampToValueAtTime(900, t + 0.4)
    lp.frequency.linearRampToValueAtTime(300, t + 1.3)
    lp.Q.value = 6
    const g = ctx.createGain()
    this.env(g, t, 0.22, 0.25, 1.1)
    o.connect(lp).connect(g).connect(this.master)
    o.start(t)
    o.stop(t + 1.5)
  },

  blip(f = 1200, v = 0.02) {
    if (!this.on) return
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    o.type = 'square'
    o.frequency.value = f
    const g = this.ctx.createGain()
    this.env(g, t, v, 0.004, 0.03)
    o.connect(g).connect(this.master)
    o.start(t)
    o.stop(t + 0.05)
  },
}

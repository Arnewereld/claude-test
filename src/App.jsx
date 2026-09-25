import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, animate, motion } from 'motion/react'
import World from './scene/World.jsx'
import Intro from './ui/Intro.jsx'
import LoginPanel from './ui/LoginPanel.jsx'
import Loading from './ui/Loading.jsx'
import Welcome from './ui/Welcome.jsx'
import Hud from './ui/Hud.jsx'
import Toast from './ui/Toast.jsx'
import { Sound } from './lib/sound.js'
import { pick, reduceMotion, wait } from './lib/util.js'
import { fogTexture, grainTexture } from './lib/textures.js'

const SPAWNS = {
  Chernarus: ['Kamyshovo', 'Solnichniy', 'Prigorodki', 'Kamenka', 'Berezino', 'Balota'],
  Livonia: ['Topolin', 'Brena', 'Nadbór'],
}
const spawnFor = server =>
  SPAWNS[server] ? `${server === 'Livonia' ? 'Riverbank' : 'Coast'} near ${pick(SPAWNS[server])}` : 'The frozen coast'

// Flow: intro → waking → login → running → loading → waking2 → welcome → leaving → login …
export default function App() {
  const [phase, setPhaseState] = useState('intro')
  const phaseRef = useRef('intro')
  const setPhase = useCallback(p => {
    phaseRef.current = p
    setPhaseState(p)
  }, [])
  const [time, setTime] = useState('night')
  const [session, setSession] = useState(null)
  const [fog, setFog] = useState(false)
  const [black, setBlack] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const [toast, setToast] = useState(null)

  const worldRef = useRef(null)
  const lidTop = useRef(null)
  const lidBot = useRef(null)
  const hurtRef = useRef(null)

  // Eyelids blink open while the world comes into focus.
  const openEyes = useCallback(async slow => {
    const duration = reduceMotion ? 0.01 : slow ? 2.8 : 1.1
    const top = slow ? ['0%', '-36%', '-6%', '-58%', '-3%', '-115%'] : ['0%', '-115%']
    const bot = top.map(v => (v.startsWith('-') ? v.slice(1) : v))
    const times = slow ? [0, 0.24, 0.4, 0.62, 0.7, 1] : [0, 1]
    await Promise.all([
      animate(lidTop.current, { y: top }, { duration, times, ease: 'easeInOut' }),
      animate(lidBot.current, { y: bot }, { duration, times, ease: 'easeInOut' }),
      animate(worldRef.current, { filter: ['blur(14px) brightness(0.4)', 'blur(0px) brightness(1)'] }, { duration, ease: [0.3, 0, 0.2, 1] }),
    ])
    worldRef.current.style.filter = 'none'
  }, [])

  const closeEyes = useCallback(async (duration = 0.65) => {
    const o = { duration: reduceMotion ? 0.01 : duration, ease: [0.6, 0, 0.4, 1] }
    await Promise.all([animate(lidTop.current, { y: '0%' }, o), animate(lidBot.current, { y: '0%' }, o)])
  }, [])

  const finishIntro = useCallback(async skipped => {
    if (phaseRef.current !== 'intro') return
    setPhase('waking')
    await openEyes(!skipped && !reduceMotion)
    setPhase('login')
  }, [openEyes, setPhase])

  const login = useCallback(async ({ name, server }) => {
    if (phaseRef.current !== 'login') return
    setSession({ name, server, spawn: spawnFor(server) })
    setPhase('running')
    Sound.whoosh(3.6)
    Sound.beat(6, 124)
    Sound.steps(9)
    if (!reduceMotion) {
      await wait(2800)
      setFog(true)
      await wait(950)
    }
    setBlack(true)
    await wait(500)
    setFog(false)
    setTime('dawn')
    Sound.weather(false)
    setPhase('loading')
  }, [setPhase])

  const loadingDone = useCallback(async () => {
    await closeEyes(0)
    setBlack(false)
    setPhase('waking2')
    await wait(500)
    await openEyes(!reduceMotion)
    setPhase('welcome')
    Sound.beat(2, 60)
  }, [closeEyes, openEyes, setPhase])

  const logout = useCallback(async () => {
    if (phaseRef.current !== 'welcome') return
    setPhase('leaving')
    await wait(400)
    await closeEyes()
    setTime('night')
    Sound.weather(true)
    await wait(900)
    await openEyes(false)
    setPhase('login')
  }, [closeEyes, openEyes, setPhase])

  const hurt = useCallback(() => {
    animate(hurtRef.current, { opacity: [0, 1, 0.3, 0.75, 0] }, { duration: 1.1, times: [0, 0.12, 0.38, 0.52, 1] })
    Sound.beat(2, 140)
    navigator.vibrate?.([40, 60, 40])
  }, [])

  const showToast = useCallback(msg => setToast({ msg, id: Date.now() }), [])
  const clearToast = useCallback(() => setToast(null), [])
  const toggleSound = useCallback(() => setSoundOn(Sound.toggle()), [])

  return (
    <>
      <div className="world" ref={worldRef} aria-hidden="true">
        <World phase={phase} time={time} />
      </div>
      <div className="vignette" />
      <div className="hurt" ref={hurtRef} />

      <AnimatePresence>
        {(phase === 'login' || phase === 'welcome') && (
          <Hud key={'hud-' + time} time={time} cold={session?.server === 'Sakhal'} soundOn={soundOn} onToggleSound={toggleSound} />
        )}
      </AnimatePresence>

      <main className="stage">
        <AnimatePresence>
          {phase === 'login' && <LoginPanel key="login" onSubmit={login} onHurt={hurt} onToast={showToast} />}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {phase === 'welcome' && session && (
          <Welcome
            key="welcome"
            session={session}
            onLogout={logout}
            onEnter={() => showToast('Demo only: nothing was sent anywhere. Hook this up to your server’s real login.')}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="veil fog"
        style={{ backgroundImage: fogTexture }}
        initial={false}
        animate={{ opacity: fog ? 1 : 0, scale: fog ? 1 : 1.8 }}
        transition={{ duration: fog ? 1 : 0 }}
      />
      <motion.div className="veil black" initial={false} animate={{ opacity: black ? 1 : 0 }} transition={{ duration: black ? 0.45 : 0 }} />

      <AnimatePresence>
        {phase === 'loading' && session && <Loading key="loading" server={session.server} onDone={loadingDone} />}
      </AnimatePresence>

      <div className="lid top" ref={lidTop} />
      <div className="lid bot" ref={lidBot} />

      <AnimatePresence>
        {phase === 'intro' && <Intro key="intro" onDone={finishIntro} soundOn={soundOn} onToggleSound={toggleSound} />}
      </AnimatePresence>

      <Toast toast={toast} onClear={clearToast} />
      <div className="grain" style={{ backgroundImage: grainTexture }} />
    </>
  )
}

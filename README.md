# claude-test
this is a test with claud tot se what it can make

## DayZ survivor login: Vite + React + Three.js

A fan-made, animated 3D login screen for DayZ. The background is a real 3D scene (React Three Fiber), and the UI is animated with Motion.

### Run it

```bash
npm install
npm run dev
```

Then open the link Vite prints (usually http://localhost:5173).

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run build:single` | Build everything into one HTML file (`dist-single/index.html`) you can double-click to open |

### The flow

1. **Intro**: typewriter text and a heartbeat line. Press any key to skip.
2. **Wake up**: your eyelids blink open and the 3D forest comes into focus.
3. **Login**: you're standing on a forest trail at night in the rain.
   - Your mouse aims a real 3D **flashlight**. It lights up the trees, rain and mist.
   - Point it at the **infected** and they notice you, groan and start walking toward you.
   - Other details: a campfire with sparks, a blinking radio tower in the distance, lightning, and trees swaying in the wind.
   - The login panel flies in from the fog, tilts in 3D with your mouse, and its letters flip in.
4. **Wrong input**: the panel shakes and the screen flashes red.
5. **Log in**: the camera **sprints down the trail** (head bob, rain streaks, FOV kick), runs straight through the login panel into the fog, then the loading screen appears.
6. **Welcome**: you wake up at **sunrise at the edge of the forest, facing the sea**, with your survivor stats. **Log out** closes your eyes and takes you back to the night.

Sound is off by default. The **Sound** button turns on synthesized rain, wind, thunder, footsteps, heartbeat, the sea, and infected groans.

### Project layout

```
src/
  App.jsx            flow / state machine (intro → login → run → loading → dawn)
  scene/             3D world: sky + lightning, forest, grass, rain, mist, sea,
                     campfire, infected, camera rig, flashlight
  ui/                intro, login panel, loading screen, welcome screen, HUD, toast
  lib/               sound engine, trail path + terrain height, shared state
```

The form doesn't send anything anywhere. To make it real, replace the `await wait(900)` in `src/ui/LoginPanel.jsx` with a call to your backend.

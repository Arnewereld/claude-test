# claude-test
this is a test with claud tot se what it can make

## Depot: 3D warehouse login (Vite + React + Three.js)

A light-themed login page where your account ships as a parcel through a 3D warehouse.

### Run it

```bash
npm install
npm run dev
```

Then open the link Vite prints (usually http://localhost:5173).

| Command | What it does |
| --- | --- |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run build:single` | Build everything into one HTML file (`dist-single/index.html`) you can open directly |

### What happens

1. **Type your email**: a cardboard parcel with your shipping label drops out of the hopper onto the **conveyor belt**. It rolls through the **paint booth** and gets sprayed in *your* color. Each email always gets the same color, and the whole login card switches to it.
2. **Type your password**: the **forklift** drives over, slides its forks under the parcel and lifts it off the belt.
3. **Press Sign in**: the forklift turns around, drives to the **truck** and loads the parcel. The roll-up door closes and the truck drives off.
4. **You're signed in**: a success card with a tracking number and your parcel color. **Sign out** brings in a new truck.

The camera follows the parcel the whole way. The progress steps (Packed → Picked up → Shipped) and the status line under the button tell you what's happening.

### Project layout

```
src/
  App.jsx             form state, and how far the warehouse is allowed to go
  scene/
    Warehouse.jsx     canvas, lights, shadows
    Director.jsx      the animation timeline + camera
    Conveyor.jsx      belt, hopper, paint booth
    Forklift.jsx      forklift with driver and moving forks
    Truck.jsx         box truck with roll-up door
    Parcel.jsx        the parcel and its shipping label
    Spray.jsx         paint mist particles
    Props.jsx         floor markings, racks, cones, pallets
  ui/                 sign-in form, progress steps, success card, icons
  lib/parcel.js       email → parcel color, tracking numbers
```

The form doesn't send anything anywhere. To make it real, call your backend in `submit()` in `src/App.jsx` and only set `submitted` once the login succeeds.

# FORGE — Interactive 3D PC Configurator

A presentation sample: a dark, studio-style configurator where a desktop PC is
assembled, inspected and customised in real time inside a WebGL viewport.

> This is a demonstration build, not a production platform. Prices are
> illustrative, and the compatibility checker is demo-level validation over a
> seeded catalogue.

## Quick start

```bash
cd FORGE
npm install
npm run dev        # http://localhost:5173
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | Type-check only |
| `npm test` | Vitest: domain logic, UI wiring and headless 3D geometry |

Requires Node 20+ and a WebGL-capable browser.

## What you can do

**Viewport** — left-drag orbits, wheel zooms, right-drag pans. Hovering any part
tints it, clicking selects it, double-clicking frames it. The control cluster
toggles the tempered-glass side panel and the exploded view, focuses the current
selection and returns to the establishing shot.

**Components** — the left rail lists every slot (case, motherboard, CPU, GPU,
memory, cooling, storage, power, case fans) with drawn thumbnails, prices and
equipped state. Equipping swaps the real geometry: the fans' count and diameter,
the DIMM count, the board's form factor and the cooler's design all change with
the product.

**Inspector** — brand, specification table, dimensions, price, part-specific
compatibility checks, and Replace/Remove. The second tab holds the appearance
controls: RGB off/static/rainbow with colour swatches and intensity, scene light
level, and three environment themes.

**Bottom bar** — live total, filled slot count and the compatibility verdict,
which opens onto every issue with the reasoning behind it.

**Top bar** — editable build name, save (persists to this device), reset (with
confirmation) and fullscreen.

Below 1024 px the side rails become overlay drawers so the viewport keeps the
full width.

## Architecture

```
src/
  components/
    brand/        FORGE mark, procedural SVG product thumbnails
    layout/       TopNav, ViewportStage, BottomBar (shell chrome)
    ui/           shadcn/ui primitives
  features/
    configurator/ StudioShell, ComponentBrowser, InspectorPanel, RightRail,
                  AppearancePanel, ViewportControls
  three/
    Studio.tsx       canvas, lighting rig, environment, floor, camera
    PcRig.tsx        assembles the nine slots from store state
    PartGroup.tsx    slot anchor: hit-testing tag, install/removal choreography,
                     exploded-view offset
    parts/           procedural hardware (case, board, CPU, GPU, memory,
                     cooler, PSU, storage, fans)
    appearance.ts    RGB colour maths, explode offsets, environment themes
    cameraFocus.ts   framing maths and camera tweens
  lib/            types, seeded catalogue, compatibility rules, formatting
  stores/         Zustand build store + derived selectors
```

Two rules keep the scene honest:

1. **The store is the only source of truth.** Slots, selection, hover, panel and
   exploded state, appearance and camera intents all live in one Zustand store;
   the 3D scene, the browser, the inspector and the bottom bar are projections of
   it, so price, geometry and compatibility can never disagree.
2. **Geometry follows the product.** Each part reads real fields from the
   catalogue (`fanCount`, `modules`, `formFactor`, `lengthMm`, `radiatorMm`), so
   a swap changes the mesh, not just its colour.

Scene scale is **1 unit = 1 cm**, which lets hardware dimensions be used directly
(an ATX board is 30.5 × 24.4 units, a 336 mm card is 33.6 long).

## Decisions that differ from the original brief

These were explicit decisions for this sample, not omissions:

- **Hardware is modelled procedurally in React Three Fiber, not downloaded.**
  Every free-asset route (Sketchfab, GrabCAD, Free3D, Poly Pizza) needs an
  account and an interactive download, so shipping downloaded GLBs would have
  meant per-asset licence verification and unknown scale/orientation. Building
  the parts from primitives gives real, separable meshes — fans with pitched
  blades, DIMM slots, PCIe slots, fin stacks, hoses — with no third-party licence
  obligations, no Blender, and no conversion pipeline. No model loader exists in
  the app.
- **Frontend only.** There is no Express server, Prisma schema or PostgreSQL in
  this build. The catalogue ships as typed seed data in `src/lib/catalog.ts`, and
  "Save build" persists the configuration to `localStorage`. The brief's backend
  section (§11) and `backend/` directory (§12) are deferred; the store's data
  shapes are already the ones an API would serve.
- **Prices are illustrative demo prices**, labelled as such in the UI.
- **Compatibility is demo validation** — nine rules over the seeded catalogue
  (socket, memory generation, DIMM count, board form factor, GPU clearance,
  cooler height, radiator support, cooler rating, PSU wattage). Every surface
  that shows a verdict says so.

## Testing

`npm test` runs 74 tests in jsdom across four levels:

- **Domain**: price totals, compatibility rules per scenario, store actions,
  persistence and rehydration sanitisation.
- **Geometry**: headless renders via `@react-three/test-renderer` assert that
  parts measure what their products claim (a 336 mm card is 33–35 units long, a
  4-module kit has twice the DIMM meshes, the 360 radiator is wider than the air
  tower is tall), that removal animates before geometry is released, and that the
  glass panel swings clear of the chassis.
- **Interaction**: pointer events resolve a hit mesh to its slot and reach the
  store, and camera framing keeps the current view angle while fitting the part.
- **UI**: browser, inspector, appearance, viewport toggles, compatibility
  surfacing and top-nav actions (save, reset with confirmation, rename,
  fullscreen) against real store state.

## Known limitations

- No backend: builds live in this browser only.
- One case product; the catalogue is a sample, not inventory.
- Hardware is representative rather than manufacturer-accurate.
- The production bundle is a single chunk (~1.3 MB) because three.js dominates;
  route-level splitting is not worthwhile for a one-screen app.
- WebGL is required; there is no 2D fallback.

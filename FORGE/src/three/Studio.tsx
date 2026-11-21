import { Suspense, useCallback, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  OrbitControls,
} from '@react-three/drei'
import { MOUSE } from 'three'
import { ForgeMark } from '@/components/brand/ForgeMark'
import { useBuildStore } from '@/stores/useBuildStore'
import { AppearanceRig, ExplodeRig } from './AppearanceRig'
import { CameraRig } from './CameraRig'
import { HighlightLayer } from './HighlightLayer'
import { PcRig } from './PcRig'
import { BACKGROUND_THEMES } from './appearance'
import { CAMERA } from './mounts'

/**
 * Product-design studio.
 *
 * Lighting is fully procedural: a key spot, a cool rim and a violet fill sit
 * outside the rig, while a set of `Lightformer` panels is baked into a small
 * environment map so brushed aluminium, anodised shrouds and glass all pick up
 * believable reflections without downloading an HDRI. Contact shadows pin the
 * chassis to the floor and a subtly reflective deck finishes the stage.
 *
 * Background, deck and light levels follow the appearance settings.
 */

export function Studio() {
  const [ready, setReady] = useState(false)
  const handleCreated = useCallback(() => setReady(true), [])

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows="percentage"
        dpr={[1, 1.75]}
        camera={{
          fov: 35,
          near: 0.5,
          far: 500,
          position: CAMERA.home.toArray(),
        }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMappingExposure: 1.22 }}
        onCreated={handleCreated}
        onPointerMissed={() => useBuildStore.getState().selectCategory(null)}
      >
        <Suspense fallback={null}>
          <StudioScene />
        </Suspense>
      </Canvas>

      <BootOverlay visible={!ready} />
    </div>
  )
}

function StudioScene() {
  return (
    <>
      <StageEnvironment />
      <StudioEnvironment />
      <StudioLights />
      <PcRig />
      <HighlightLayer />
      <CameraRig />
      <AppearanceRig />
      <ExplodeRig />
      <StudioFloor />
      <StudioControls />
    </>
  )
}

/** Backdrop and fog follow the chosen environment theme. */
function StageEnvironment() {
  const background = useBuildStore((state) => state.appearance.background)
  const theme = BACKGROUND_THEMES[background]

  return (
    <>
      <color attach="background" args={[theme.background]} />
      <fog attach="fog" args={[theme.fog, 150, 340]} />
    </>
  )
}

/** Baked reflection probes: a soft top box, a cool left panel and a violet rim. */
function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1} background={false}>
      <color attach="background" args={['#05070b']} />

      <Lightformer
        form="rect"
        intensity={9}
        color="#ffffff"
        position={[0, 34, 6]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[46, 30, 1]}
      />
      <Lightformer
        form="rect"
        intensity={4.2}
        color="#9fe8ff"
        position={[-26, 18, 16]}
        rotation={[0, Math.PI / 3, 0]}
        scale={[30, 22, 1]}
      />
      <Lightformer
        form="rect"
        intensity={5}
        color="#b69bff"
        position={[26, 14, -20]}
        rotation={[0, -Math.PI / 2.6, 0]}
        scale={[28, 24, 1]}
      />
      <Lightformer
        form="circle"
        intensity={1.6}
        color="#ffffff"
        position={[10, 6, 30]}
        rotation={[0, Math.PI, 0]}
        scale={[16, 16, 1]}
      />
      <Lightformer
        form="rect"
        intensity={0.8}
        color="#1c2b3a"
        position={[0, -6, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[50, 50, 1]}
      />
    </Environment>
  )
}

/** Key, rim and fill — the three lights that actually shade the hardware. */
function StudioLights() {
  const lightIntensity = useBuildStore((state) => state.appearance.lightIntensity)

  return (
    <>
      <ambientLight intensity={0.72 * lightIntensity} />

      <spotLight
        position={[38, 52, 34]}
        angle={0.62}
        penumbra={0.85}
        intensity={3800 * lightIntensity}
        distance={190}
        color="#eef6ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-near={20}
        shadow-camera-far={180}
      />

      <directionalLight
        position={[-34, 26, 24]}
        intensity={2 * lightIntensity}
        color="#9fe8ff"
      />
      <spotLight
        position={[-46, 44, 18]}
        angle={0.9}
        penumbra={1}
        intensity={3000 * lightIntensity}
        distance={210}
        color="#ffffff"
      />
      <directionalLight
        position={[16, 34, -40]}
        intensity={1.5 * lightIntensity}
        color="#b69bff"
      />
      <pointLight
        position={[-18, 8, -6]}
        intensity={340 * lightIntensity}
        distance={95}
        color="#22d3ee"
      />
      <pointLight
        position={[22, 6, 18]}
        intensity={220 * lightIntensity}
        distance={85}
        color="#8b5cf6"
      />
    </>
  )
}

/** Reflective deck plus contact shadows, tinted by the environment theme. */
function StudioFloor() {
  const background = useBuildStore((state) => state.appearance.background)
  const theme = BACKGROUND_THEMES[background]

  return (
    <group position={[0, -0.02, 0]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={() => useBuildStore.getState().selectCategory(null)}
      >
        <planeGeometry args={[420, 420]} />
        <MeshReflectorMaterial
          resolution={256}
          mixBlur={1}
          mixStrength={9}
          blur={[320, 90]}
          mirror={theme.mirror}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          roughness={0.82}
          metalness={0.68}
          color={theme.floor}
        />
      </mesh>

      <ContactShadows
        position={[0, 0.02, 0]}
        scale={128}
        resolution={1024}
        far={70}
        blur={2.6}
        opacity={0.7}
        color="#000208"
      />
    </group>
  )
}

/**
 * Studio camera. Left drag orbits, wheel zooms, right drag pans — the mapping the
 * brief specifies — with damping so the rig feels weighted rather than snappy.
 */
function StudioControls() {
  return (
    <OrbitControls
      makeDefault
      target={CAMERA.target.toArray()}
      enableDamping
      dampingFactor={0.075}
      rotateSpeed={0.72}
      zoomSpeed={0.85}
      panSpeed={0.7}
      minDistance={CAMERA.minDistance}
      maxDistance={CAMERA.maxDistance}
      minPolarAngle={0.18}
      maxPolarAngle={Math.PI / 2 - 0.03}
      mouseButtons={{
        LEFT: MOUSE.ROTATE,
        MIDDLE: MOUSE.DOLLY,
        RIGHT: MOUSE.PAN,
      }}
    />
  )
}

/** Boot state shown until the first WebGL frame lands. */
function BootOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <ForgeMark className="size-10 animate-pulse text-foreground/70" />
        <div className="flex flex-col items-center gap-2">
          <span className="micro text-muted-foreground">Initialising studio</span>
          <div className="h-px w-32 overflow-hidden bg-border/60">
            <div className="h-full w-1/2 animate-[forge-boot_1.4s_ease-in-out_infinite] bg-gradient-to-r from-forge-cyan to-forge-violet" />
          </div>
        </div>
      </div>
    </div>
  )
}

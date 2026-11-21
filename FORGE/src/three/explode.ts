import gsap from 'gsap'

/**
 * Exploded-view progress shared by every slot anchor.
 *
 * A single GSAP tween drives this scalar; each `PartGroup` reads it in
 * `useFrame` and offsets itself, so the explosion stays in step with the glass
 * hinge and install animations instead of fighting them with per-part tweens.
 */
export const explodeState = { value: 0 }

export function tweenExploded(exploded: boolean, duration = 0.9): void {
  gsap.killTweensOf(explodeState)
  gsap.to(explodeState, {
    value: exploded ? 1 : 0,
    duration,
    ease: 'power3.inOut',
  })
}

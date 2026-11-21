import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { Vector3, type Group } from 'three'
import type { CategoryId } from '@/lib/types'
import { explodeOffset } from './appearance'
import { explodeState } from './explode'
import { EXPLODE_OFFSETS } from './mounts'
import { registerPart, unregisterPart } from './partRegistry'

/** Distance a component travels while being installed or pulled. */
const INSTALL_TRAVEL = 16
const INSTALL_DURATION = 0.55
const REMOVAL_DURATION = 0.26

type PartGroupProps = {
  category: CategoryId
  /** Current product id, or null when the slot is empty. */
  productId: string | null
  position?: [number, number, number]
  rotation?: [number, number, number]
  children: React.ReactNode
}

/**
 * Slot anchor and installation choreography.
 *
 * A swap mounts the incoming component immediately while a snapshot of the
 * outgoing one plays a short exit, then releases it — so replacing a GPU reads as
 * hardware being unseated and a new card dropping in, rather than geometry
 * teleporting. The snapshot is captured in a layout effect (after the previous
 * commit), so live props on the incoming part — glass open, RGB — keep flowing.
 *
 * Travel direction is the slot's exploded direction: parts leave and enter through
 * the side they are actually fitted from. The group also tags its subtree with the
 * category used by hit-testing and publishes itself for highlighting and focus.
 */
export function PartGroup({
  category,
  productId,
  position,
  rotation,
  children,
}: PartGroupProps) {
  const groupRef = useRef<Group>(null)
  const incomingRef = useRef<Group>(null)
  const outgoingRef = useRef<Group>(null)

  const [outgoingNode, setOutgoingNode] = useState<React.ReactNode>(null)

  // Last committed render's inputs, used to detect a swap without reading refs
  // during render.
  const appliedProgress = useRef(-1)
  const previousIdRef = useRef(productId ?? '')
  const previousChildrenRef = useRef<React.ReactNode>(children)
  const mountedRef = useRef(false)

  const direction = useMemo(() => {
    const vector = new Vector3(...EXPLODE_OFFSETS[category])
    if (vector.lengthSq() === 0) vector.set(0, 1, 0)
    return vector.normalize()
  }, [category])

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    registerPart(category, group)
    return () => unregisterPart(category, group)
  }, [category])

  useLayoutEffect(() => {
    const currentId = productId ?? ''
    const swapped = previousIdRef.current !== currentId
    const previousChildren = previousChildrenRef.current

    previousIdRef.current = currentId
    previousChildrenRef.current = children

    if (swapped && previousChildren) setOutgoingNode(previousChildren)
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }

    // The build opens already assembled; only later installs play the motion.
    const node = incomingRef.current
    if (!swapped || !currentId || !node) return

    gsap.killTweensOf(node.position)
    gsap.killTweensOf(node.scale)
    node.position.set(
      direction.x * INSTALL_TRAVEL,
      direction.y * INSTALL_TRAVEL,
      direction.z * INSTALL_TRAVEL,
    )
    node.scale.setScalar(0.94)

    const tweens = [
      gsap.to(node.position, {
        x: 0,
        y: 0,
        z: 0,
        duration: INSTALL_DURATION,
        ease: 'power3.out',
        delay: 0.05,
      }),
      gsap.to(node.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: INSTALL_DURATION,
        ease: 'power2.out',
        delay: 0.05,
      }),
    ]

    return () => tweens.forEach((tween) => tween.kill())
  }, [productId, children, direction])

  // Exit: pull the snapshot away, then release its geometry.
  useLayoutEffect(() => {
    if (!outgoingNode) return
    const node = outgoingRef.current
    if (!node) return

    node.position.set(0, 0, 0)
    node.scale.setScalar(1)

    const timeline = gsap.timeline({
      onComplete: () => setOutgoingNode(null),
    })

    timeline.to(
      node.position,
      {
        x: direction.x * INSTALL_TRAVEL * 0.75,
        y: direction.y * INSTALL_TRAVEL * 0.75,
        z: direction.z * INSTALL_TRAVEL * 0.75,
        duration: REMOVAL_DURATION,
        ease: 'power2.in',
      },
      0,
    )
    timeline.to(
      node.scale,
      { x: 0.9, y: 0.9, z: 0.9, duration: REMOVAL_DURATION, ease: 'power2.in' },
      0,
    )

    return () => {
      timeline.kill()
    }
  }, [outgoingNode, direction])

  // Exploded view: offset the anchor from the shared progress scalar.
  useFrame(() => {
    const group = groupRef.current
    if (!group || explodeState.value === appliedProgress.current) return
    appliedProgress.current = explodeState.value

    const [x, y, z] = explodeOffset(category, explodeState.value)
    group.position.set(
      (position?.[0] ?? 0) + x,
      (position?.[1] ?? 0) + y,
      (position?.[2] ?? 0) + z,
    )
  })

  return (
    <group
      ref={groupRef}
      userData={{ category }}
      position={position}
      rotation={rotation}
    >
      <group ref={incomingRef} userData={{ role: 'installed' }}>
        {children}
      </group>
      {outgoingNode ? (
        <group ref={outgoingRef} userData={{ role: 'outgoing' }}>
          {outgoingNode}
        </group>
      ) : null}
    </group>
  )
}

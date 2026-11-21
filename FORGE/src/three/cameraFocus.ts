import gsap from 'gsap'
import {
  Box3,
  PerspectiveCamera,
  Sphere,
  Vector3,
  type Camera,
  type Object3D,
} from 'three'
import { CAMERA } from './mounts'

/** The slice of OrbitControls the camera animation needs. */
export type ControlsLike = {
  target: Vector3
  enabled: boolean
  update: () => void
}

export type CameraFrame = {
  position: Vector3
  target: Vector3
}

/** Nothing closer than this, so focusing a small part does not clip into it. */
const MIN_FOCUS_DISTANCE = 15

/** Slack around the fitted radius; 1 = tangent fit, >1 leaves breathing room. */
const FIT_FACTOR = 1.28

/**
 * Camera placement that frames an object without changing the viewing angle.
 *
 * The object's bounding sphere is fitted to the vertical field of view, then the
 * camera is pushed out from the object's centre along the direction it already
 * looks from — so a double-click zooms in while keeping the user's orbit position
 * instead of snapping to a fixed angle.
 */
export function computeFocusFrame(
  camera: Camera,
  currentTarget: Vector3,
  object: Object3D,
): CameraFrame | null {
  const box = new Box3().setFromObject(object)
  if (box.isEmpty()) return null

  const sphere = box.getBoundingSphere(new Sphere())
  const fov = camera instanceof PerspectiveCamera ? camera.fov : 35
  const radius = Math.max(sphere.radius, 0.5)
  const fitDistance = (radius / Math.tan((fov * Math.PI) / 360)) * FIT_FACTOR
  const distance = Math.min(
    Math.max(fitDistance, MIN_FOCUS_DISTANCE),
    CAMERA.maxDistance * 1.5,
  )

  const direction = new Vector3().subVectors(camera.position, currentTarget)
  if (direction.lengthSq() < 1e-6) direction.set(1, 0.55, 1)
  direction.normalize()

  const target = sphere.center.clone()
  const position = target.clone().addScaledVector(direction, distance)

  return { position, target }
}

/** Frames and tweens to a part, e.g. after a double-click in the viewport. */
export function focusOnObject(
  camera: Camera,
  controls: ControlsLike | null,
  object: Object3D,
  duration = 0.8,
): void {
  const frame = computeFocusFrame(camera, controls?.target ?? CAMERA.target, object)
  if (!frame) return
  animateCamera(camera, controls, frame, duration)
}

/** Returns the camera to the studio's establishing shot. */
export function resetCameraToHome(
  camera: Camera,
  controls: ControlsLike | null,
  duration = 0.9,
): void {
  animateCamera(
    camera,
    controls,
    { position: CAMERA.home.clone(), target: CAMERA.target.clone() },
    duration,
  )
}

/**
 * Tweens camera position and orbit target together, with controls disabled for
 * the duration so user input cannot fight the animation.
 */
export function animateCamera(
  camera: Camera,
  controls: ControlsLike | null,
  frame: CameraFrame,
  duration: number,
): void {
  const tweenedTarget = controls?.target ?? frame.target.clone()

  gsap.killTweensOf(camera.position)
  gsap.killTweensOf(tweenedTarget)
  if (controls) controls.enabled = false

  const sync = () => controls?.update()

  gsap.to(camera.position, {
    x: frame.position.x,
    y: frame.position.y,
    z: frame.position.z,
    duration,
    ease: 'power3.inOut',
    onUpdate: sync,
    onComplete: () => {
      if (controls) controls.enabled = true
      sync()
    },
  })

  if (controls) {
    gsap.to(tweenedTarget, {
      x: frame.target.x,
      y: frame.target.y,
      z: frame.target.z,
      duration,
      ease: 'power3.inOut',
      onUpdate: sync,
    })
  }
}

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useBuildStore } from '@/stores/useBuildStore'
import { getPartObject } from './partRegistry'
import {
  focusOnObject,
  resetCameraToHome,
  type ControlsLike,
} from './cameraFocus'

/**
 * Translation of UI/store intent into camera motion.
 *
 * Lives inside the canvas because only here is the active camera and the orbit
 * controls are reachable; the store carries a token per request so repeated
 * focus or reset clicks each replay the animation.
 */
export function CameraRig() {
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls) as ControlsLike | null

  const resetToken = useBuildStore((state) => state.cameraResetToken)
  const focusRequest = useBuildStore((state) => state.focusRequest)

  useEffect(() => {
    if (!resetToken) return
    resetCameraToHome(camera, controls)
  }, [resetToken, camera, controls])

  useEffect(() => {
    if (!focusRequest) return
    const object = getPartObject(focusRequest.category)
    if (!object) return
    focusOnObject(camera, controls, object)
  }, [focusRequest, camera, controls])

  return null
}

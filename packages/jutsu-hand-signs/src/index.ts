export { default as CameraView } from "./components/CameraView";
export { default as DetectionResult } from "./components/DetectionResult";

export {
  createConfirmController,
  detectConfirm,
  isConfirmPose,
  resetConfirmController,
} from "./gestures/confirmController";
export type { ConfirmState } from "./gestures/confirmController";

export {
  detectHandPose,
  detectTwoHandPose,
} from "./gestures/gestureDetector";

export {
  createMovementController,
  detectMovement,
  recalibrateMovement,
} from "./gestures/handController";
export type {
  HandMovement,
  MovementControllerState,
} from "./gestures/handController";

export {
  boarSeal,
  dogSeal,
  horseSeal,
  tigerSeal,
} from "./gestures/narutoSeals";
export type { NarutoSeal } from "./gestures/narutoSeals";

export type {
  DetectionResult as DetectionResultData,
  FingerState,
  HandGesture,
  HandLandmarks,
  HandPose,
  PalmData,
  Point,
  TwoHandPose,
  Vector3,
} from "./gestures/types";

export { useHandTracking } from "./hooks/useHandTracking";
export type {
  HandEvent,
  HandEventPayload,
  SealName,
  UseHandTrackingOptions,
} from "./hooks/useHandTracking";

import type { HandPose } from "./types";

export type HandMovement =
  | "left"
  | "right"
  | "up"
  | "down"
  | "idle"
  | "preparing";

export type MovementControllerState = {
  neutralX: number;
  neutralY: number;

  initialized: boolean;

  preparing: boolean;
  preparationStartTime: number;
  samplesX: number;
  samplesY: number;
  sampleCount: number;

  recalibrating: boolean;
  recalibrationStartTime: number;
  recalibrationSamplesX: number;
  recalibrationSamplesY: number;
  recalibrationSampleCount: number;
};

const MOVEMENT_THRESHOLD = 0.12;

const DEAD_ZONE = 0.05;

const NEUTRAL_ADAPTATION = 0.02;

const PREPARATION_TIME = 2000;
const RECALIBRATION_TIME = 1500;

export function createMovementController(): MovementControllerState {
  return {
    neutralX: 0,
    neutralY: 0,

    initialized: false,

    preparing: false,
    preparationStartTime: 0,
    samplesX: 0,
    samplesY: 0,
    sampleCount: 0,

    recalibrating: false,
    recalibrationStartTime: 0,
    recalibrationSamplesX: 0,
    recalibrationSamplesY: 0,
    recalibrationSampleCount: 0,
  };
}

export function recalibrateMovement(
  state: MovementControllerState,
  hand: HandPose
): boolean {
  const { x, y } = hand.palm.center;

  if (!state.recalibrating) {
    state.recalibrating = true;
    state.recalibrationStartTime =
      performance.now();

    state.recalibrationSamplesX = 0;
    state.recalibrationSamplesY = 0;
    state.recalibrationSampleCount = 0;

    console.log("Recalibration started");
  }

  state.recalibrationSamplesX += x;
  state.recalibrationSamplesY += y;
  state.recalibrationSampleCount++;

  const elapsed =
    performance.now() -
    state.recalibrationStartTime;

  if (elapsed < RECALIBRATION_TIME) {
    return false;
  }

  state.neutralX =
    state.recalibrationSamplesX /
    state.recalibrationSampleCount;

  state.neutralY =
    state.recalibrationSamplesY /
    state.recalibrationSampleCount;

  /*
   * Ручная калибровка полностью
   * заменяет первоначальную.
   */
  state.initialized = true;
  state.preparing = false;

  state.recalibrating = false;

  console.log("Recalibration completed:", {
    neutralX: state.neutralX,
    neutralY: state.neutralY,
  });

  return true;
}

export function detectMovement(
  hand: HandPose,
  state: MovementControllerState
): HandMovement {
  const { x, y } = hand.palm.center;

  /*
   * ============================
   * INITIAL PREPARATION
   * ============================
   */

  if (!state.initialized) {
    if (!state.preparing) {
      state.preparing = true;

      state.preparationStartTime =
        performance.now();

      state.samplesX = 0;
      state.samplesY = 0;
      state.sampleCount = 0;
    }

    state.samplesX += x;
    state.samplesY += y;
    state.sampleCount++;

    const elapsed =
      performance.now() -
      state.preparationStartTime;

    if (elapsed < PREPARATION_TIME) {
      return "preparing";
    }

    state.neutralX =
      state.samplesX /
      state.sampleCount;

    state.neutralY =
      state.samplesY /
      state.sampleCount;

    state.initialized = true;
    state.preparing = false;

    console.log("Initial preparation completed:", {
      neutralX: state.neutralX,
      neutralY: state.neutralY,
    });

    return "idle";
  }

  /*
   * ============================
   * DISTANCE FROM NEUTRAL
   * ============================
   */

  const deltaX =
    x - state.neutralX;

  const deltaY =
    y - state.neutralY;

  const absX =
    Math.abs(deltaX);

  const absY =
    Math.abs(deltaY);

  /*
   * ============================
   * DEAD ZONE
   * ============================
   */

  if (
    absX < DEAD_ZONE &&
    absY < DEAD_ZONE
  ) {
    state.neutralX +=
      (x - state.neutralX) *
      NEUTRAL_ADAPTATION;

    state.neutralY +=
      (y - state.neutralY) *
      NEUTRAL_ADAPTATION;

    return "idle";
  }

  /*
   * ============================
   * HORIZONTAL MOVEMENT
   * ============================
   */

  if (absX > absY) {
    /*
     * Front camera:
     *
     * deltaX > 0 → physical LEFT
     * deltaX < 0 → physical RIGHT
     */

    if (
      deltaX >
      MOVEMENT_THRESHOLD
    ) {
      return "left";
    }

    if (
      deltaX <
      -MOVEMENT_THRESHOLD
    ) {
      return "right";
    }
  }

  /*
   * ============================
   * VERTICAL MOVEMENT
   * ============================
   */

  if (absY > absX) {
    if (
      deltaY >
      MOVEMENT_THRESHOLD
    ) {
      return "down";
    }

    if (
      deltaY <
      -MOVEMENT_THRESHOLD
    ) {
      return "up";
    }
  }

  return "idle";
}
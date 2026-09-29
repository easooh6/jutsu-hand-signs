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
};

const MOVEMENT_THRESHOLD = 0.12;

// Размер зоны, внутри которой рука считается неподвижной
const DEAD_ZONE = 0.05;

// Скорость адаптации нейтральной позиции
const NEUTRAL_ADAPTATION = 0.02;

const PREPARATION_TIME = 2000;

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
  };
}

export function detectMovement(
  hand: HandPose,
  state: MovementControllerState
): HandMovement {
  const { x, y } = hand.palm.center;

  /*
   * ============================
   * PREPARATION
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
        state.samplesX / state.sampleCount;

    state.neutralY =
        state.samplesY / state.sampleCount;

    state.initialized = true;
    state.preparing = false;

    return "idle";
    }

  /*
   * ============================
   * DISTANCE FROM NEUTRAL
   * ============================
   */

  const deltaX = x - state.neutralX;
  const deltaY = y - state.neutralY;

  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  /*
   * ============================
   * DEAD ZONE
   * ============================
   *
   * Если рука находится рядом
   * с нейтральной точкой —
   * считаем, что движения нет.
   */

  if (
    absX < DEAD_ZONE &&
    absY < DEAD_ZONE
  ) {
    /*
     * Медленно двигаем neutral
     * к текущему положению руки.
     *
     * Это позволяет компенсировать
     * естественное смещение руки.
     */

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
   * MOVEMENT
   * ============================
   */

  if (absX > absY) {
    /*
     * ВАЖНО:
     * X инвертирован из-за фронтальной камеры.
     */

    if (deltaX > MOVEMENT_THRESHOLD) {
      return "left";
    }

    if (deltaX < -MOVEMENT_THRESHOLD) {
      return "right";
    }
  }

  if (absY > absX) {
    if (deltaY > MOVEMENT_THRESHOLD) {
      return "down";
    }

    if (deltaY < -MOVEMENT_THRESHOLD) {
      return "up";
    }
  }

  return "idle";
}
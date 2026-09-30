import type { HandMovement } from "../gestures/handController";

import type {
  HandEvent,
  SealName,
} from "../hooks/useHandTracking";

export type TutorialStep =
  | "calibration"
  | "left"
  | "right"
  | "up"
  | "down"
  | "seals"
  | "completed";

export type TutorialState = {
  step: TutorialStep;

  movementFrames: number;

  lastEventId: number | null;

  sealIndex: number;
};

export type TutorialResult = {
  step: TutorialStep;

  sealIndex: number;

  movementCompleted: boolean;

  sealCompleted: boolean;

  tutorialCompleted: boolean;
};

const REQUIRED_MOVEMENT_FRAMES = 5;

const TUTORIAL_SEALS: SealName[] = [
  "tiger",
  "dog",
  "boar",
  "horse",
];

export function createTutorialState(): TutorialState {
  return {
    step: "calibration",

    movementFrames: 0,

    lastEventId: null,

    sealIndex: 0,
  };
}

export function getExpectedSeal(
  state: TutorialState
): SealName | null {
  if (
    state.sealIndex >=
    TUTORIAL_SEALS.length
  ) {
    return null;
  }

  return TUTORIAL_SEALS[state.sealIndex];
}

export function processTutorialStep(
  state: TutorialState,
  movement: HandMovement,
  event: HandEvent | null
): TutorialResult {
  let movementCompleted = false;
  let sealCompleted = false;
  let tutorialCompleted = false;

  /*
   * Tutorial already completed.
   */

  if (state.step === "completed") {
    return {
      step: state.step,
      sealIndex: state.sealIndex,
      movementCompleted: false,
      sealCompleted: false,
      tutorialCompleted: false,
    };
  }

  /*
   * Calibration.
   */

  if (state.step === "calibration") {
    return {
      step: state.step,
      sealIndex: state.sealIndex,
      movementCompleted: false,
      sealCompleted: false,
      tutorialCompleted: false,
    };
  }

  /*
   * Movement tutorial.
   */

  if (
    state.step === "left" ||
    state.step === "right" ||
    state.step === "up" ||
    state.step === "down"
  ) {
    const requiredMovement =
      state.step;

    /*
     * Correct movement.
     */

    if (
      movement === requiredMovement
    ) {
      state.movementFrames++;
    } else {
      /*
       * Movement was interrupted.
       * Start counting again.
       */

      state.movementFrames = 0;
    }

    /*
     * Movement was held long enough.
     */

    if (
      state.movementFrames >=
      REQUIRED_MOVEMENT_FRAMES
    ) {
      state.movementFrames = 0;

      movementCompleted = true;

      switch (state.step) {
        case "left":
          state.step = "right";
          break;

        case "right":
          state.step = "up";
          break;

        case "up":
          state.step = "down";
          break;

        case "down":
          state.step = "seals";
          break;
      }
    }

    return {
      step: state.step,
      sealIndex: state.sealIndex,
      movementCompleted,
      sealCompleted: false,
      tutorialCompleted: false,
    };
  }

  /*
   * Seal tutorial.
   */

  if (state.step === "seals") {
    const expectedSeal =
      getExpectedSeal(state);

    /*
     * Nothing to do if all seals
     * have already been completed.
     */

    if (!expectedSeal) {
      state.step = "completed";

      return {
        step: state.step,
        sealIndex: state.sealIndex,
        movementCompleted: false,
        sealCompleted: false,
        tutorialCompleted: true,
      };
    }

    /*
     * No new event.
     */

    if (!event) {
      return {
        step: state.step,
        sealIndex: state.sealIndex,
        movementCompleted: false,
        sealCompleted: false,
        tutorialCompleted: false,
      };
    }

    /*
     * Ignore the same event.
     */

    if (
      event.id === state.lastEventId
    ) {
      return {
        step: state.step,
        sealIndex: state.sealIndex,
        movementCompleted: false,
        sealCompleted: false,
        tutorialCompleted: false,
      };
    }

    /*
     * Remember that we processed
     * this event.
     */

    state.lastEventId = event.id;

    /*
     * We only care about seal events.
     */

    if (event.type !== "seal") {
      return {
        step: state.step,
        sealIndex: state.sealIndex,
        movementCompleted: false,
        sealCompleted: false,
        tutorialCompleted: false,
      };
    }

    /*
     * Wrong seal.
     *
     * Do absolutely nothing.
     * The user must make the expected seal.
     */

    if (event.seal !== expectedSeal) {
      return {
        step: state.step,
        sealIndex: state.sealIndex,
        movementCompleted: false,
        sealCompleted: false,
        tutorialCompleted: false,
      };
    }

    /*
     * Correct seal.
     */

    state.sealIndex++;

    sealCompleted = true;

    /*
     * All seals completed.
     */

    if (
      state.sealIndex >=
      TUTORIAL_SEALS.length
    ) {
      state.step = "completed";

      tutorialCompleted = true;
    }

    return {
      step: state.step,
      sealIndex: state.sealIndex,
      movementCompleted: false,
      sealCompleted,
      tutorialCompleted,
    };
  }

  return {
    step: state.step,
    sealIndex: state.sealIndex,
    movementCompleted: false,
    sealCompleted: false,
    tutorialCompleted: false,
  };
}
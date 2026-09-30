
import type { Advice } from "./adviceTypes";

export type AdviceStabilizerState = {
  currentType: Advice["type"] | null;
  currentMessage: string | null;
  frames: number;
  lastEmittedType: Advice["type"] | null;
  lastEmittedMessage: string | null;
};

const REQUIRED_FRAMES = 5;

export function createAdviceStabilizer(): AdviceStabilizerState {
  return {
    currentType: null,
    currentMessage: null,
    frames: 0,
    lastEmittedType: null,
    lastEmittedMessage: null,
  };
}

export function updateAdviceStabilizer(
  state: AdviceStabilizerState,
  advice: Advice
): Advice | null {
  /*
   * The same advice is still being detected.
   */
  if (
    state.currentType === advice.type &&
    state.currentMessage === advice.message
  ) {
    state.frames++;
  } else {
    /*
     * A new advice appeared.
     *
     * Start counting from the first frame.
     */
    state.currentType = advice.type;
    state.currentMessage = advice.message;
    state.frames = 1;
  }

  /*
   * We have not seen the same advice
   * enough times yet.
   */
  if (state.frames < REQUIRED_FRAMES) {
    return null;
  }

  /*
   * Do not emit the same advice again
   * while it remains active.
   */
  if (
    state.lastEmittedType === advice.type &&
    state.lastEmittedMessage ===
      advice.message
  ) {
    return null;
  }

  /*
   * Remember that this advice has already
   * been emitted.
   */
  state.lastEmittedType = advice.type;
  state.lastEmittedMessage = advice.message;

  return advice;
}

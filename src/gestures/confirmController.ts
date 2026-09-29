import type { HandPose } from "./types";

export type ConfirmState = {
  previousFist: boolean;
  fistFrames: number;
};

const REQUIRED_FIST_FRAMES = 5;

export function createConfirmController(): ConfirmState {
  return {
    previousFist: false,
    fistFrames: 0,
  };
}

function isFist(hand: HandPose): boolean {
  return (
    !hand.fingers.index.extended &&
    !hand.fingers.middle.extended &&
    !hand.fingers.ring.extended &&
    !hand.fingers.pinky.extended
  );
}

export function detectConfirm(
  hand: HandPose,
  state: ConfirmState
): boolean {
  const currentFist = isFist(hand);

  if (currentFist) {
    state.fistFrames++;
  } else {
    state.fistFrames = 0;
  }

  const stableFist =
    state.fistFrames >= REQUIRED_FIST_FRAMES;

  const confirmed =
    stableFist && !state.previousFist;

  state.previousFist = stableFist;

  return confirmed;
}
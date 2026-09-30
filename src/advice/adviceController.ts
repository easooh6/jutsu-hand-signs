
import type { HandPose } from "../gestures/types";

import {
  calculateDistance,
} from "../gestures/palmUtils";

import type {
  Advice,
  FingerName,
  FingerRequirement,
  SealAdviceConfig,
} from "./adviceTypes";

import type { SealName } from "../hooks/useHandTracking";

/*
 * Configuration for every seal.
 *
 * true  = finger should be extended
 * false = finger should be bent
 */
const SEAL_CONFIGS: Record<
  SealName,
  SealAdviceConfig
> = {
  tiger: {
    left: {
      index: true,
      middle: true,
      ring: false,
      pinky: false,
    },

    right: {
      index: true,
      middle: true,
      ring: false,
      pinky: false,
    },

    maxDistance: 0.20,
    maxYDifference: 0.10,
  },

  dog: {
    left: {
      index: true,
      middle: true,
      ring: true,
      pinky: true,
    },

    right: {
      index: false,
      middle: false,
      ring: false,
      pinky: false,
    },

    maxDistance: 0.25,
    maxYDifference: 0.15,
  },

  boar: {
    left: {
      index: false,
      middle: false,
      ring: false,
      pinky: false,
    },

    right: {
      index: false,
      middle: false,
      ring: false,
      pinky: false,
    },

    maxDistance: 0.20,
  },

  horse: {
    left: {
      index: true,
      middle: false,
      ring: false,
      pinky: false,
    },

    right: {
      index: true,
      middle: false,
      ring: false,
      pinky: false,
    },

    maxDistance: 0.20,
    maxYDifference: 0.10,
  },
};

/*
 * Finds fingers whose current state does not
 * match the expected state for the seal.
 */
function findWrongFingers(
  hand: HandPose,
  requirements: FingerRequirement
): FingerName[] {
  const wrong: FingerName[] = [];

  if (
    hand.fingers.index.extended !==
    requirements.index
  ) {
    wrong.push("index");
  }

  if (
    hand.fingers.middle.extended !==
    requirements.middle
  ) {
    wrong.push("middle");
  }

  if (
    hand.fingers.ring.extended !==
    requirements.ring
  ) {
    wrong.push("ring");
  }

  if (
    hand.fingers.pinky.extended !==
    requirements.pinky
  ) {
    wrong.push("pinky");
  }

  return wrong;
}

/*
 * Converts a finger name to a human-readable name.
 */
function getFingerName(
  finger: FingerName
): string {
  switch (finger) {
    case "index":
      return "index";

    case "middle":
      return "middle";

    case "ring":
      return "ring";

    case "pinky":
      return "pinky";
  }
}

/*
 * Creates a message for one or several wrong fingers.
 */
function getFingerAdvice(
  wrongFingers: FingerName[]
): Advice {
  if (wrongFingers.length === 0) {
    return {
      type: "correct",
      message: "Perfect!",
    };
  }

  if (wrongFingers.length === 1) {
    return {
      type: "wrong_fingers",
      message:
        `Adjust your ${getFingerName(
          wrongFingers[0]
        )} finger.`,
    };
  }

  const names = wrongFingers.map(
    getFingerName
  );

  const last = names[names.length - 1];

  const firstNames =
    names.slice(0, -1);

  return {
    type: "wrong_fingers",
    message:
      `Adjust your ${firstNames.join(
        ", "
      )} and ${last} fingers.`,
  };
}

/*
 * Checks the relative position of both hands.
 *
 * This is intentionally checked before fingers.
 * If the hands are very far apart, we first ask
 * the player to fix the hand position.
 */
function getPositionAdvice(
  left: HandPose,
  right: HandPose,
  config: SealAdviceConfig
): Advice | null {
  const distance = calculateDistance(
    left.palm.center,
    right.palm.center
  );

  if (
    config.maxDistance !== undefined &&
    distance > config.maxDistance
  ) {
    return {
      type: "hands_too_far",
      message:
        "Bring your hands closer together.",
    };
  }

  if (
    config.minDistance !== undefined &&
    distance < config.minDistance
  ) {
    return {
      type: "hands_too_close",
      message:
        "Move your hands slightly apart.",
    };
  }

  const yDifference = Math.abs(
    left.palm.center.y -
      right.palm.center.y
  );

  if (
    config.maxYDifference !== undefined &&
    yDifference >
      config.maxYDifference
  ) {
    return {
      type: "hands_not_aligned",
      message:
        "Align your hands horizontally.",
    };
  }

  return null;
}

/*
 * Main advice function.
 *
 * Tutorial and Game should both use this function.
 *
 * It does NOT know anything about React,
 * UI or TutorialPage.
 */
export function getSealAdvice(
  expectedSeal: SealName,
  hands: HandPose[]
): Advice {
  /*
   * No hands detected.
   */
  if (hands.length === 0) {
    return {
      type: "no_hands",
      message:
        "Show both hands to form the seal.",
    };
  }

  /*
   * Naruto seals currently require two hands.
   */
  if (hands.length !== 2) {
    return {
      type: "wrong_hand_count",
      message:
        "Show both hands to form the seal.",
    };
  }

  const left = hands.find(
    (hand) =>
      hand.handedness === "Left"
  );

  const right = hands.find(
    (hand) =>
      hand.handedness === "Right"
  );

  if (!left || !right) {
    return {
      type: "wrong_hand_count",
      message:
        "Show both hands to form the seal.",
    };
  }

  const config =
    SEAL_CONFIGS[expectedSeal];

  /*
   * First check hand position.
   */
  const positionAdvice =
    getPositionAdvice(
      left,
      right,
      config
    );

  if (positionAdvice) {
    return positionAdvice;
  }

  /*
   * Then check fingers.
   */
  const leftWrongFingers =
    findWrongFingers(
      left,
      config.left
    );

  const rightWrongFingers =
    findWrongFingers(
      right,
      config.right
    );

  const wrongFingers = [
    ...leftWrongFingers,
    ...rightWrongFingers,
  ];

  if (wrongFingers.length > 0) {
    return getFingerAdvice(
      wrongFingers
    );
  }

  /*
   * Everything required by this basic
   * advice configuration is correct.
   */
  return {
    type: "correct",
    message: "Perfect!",
  };
}


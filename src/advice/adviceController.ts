import type { HandPose } from "../gestures/types";

import {
  sealDefinitions,
  type SealName,
  type SealIssue,
} from "../gestures/sealDefinitions";

import type {
  Advice,
  SealSimilarity,
} from "./adviceTypes";

function getHands(
  hands: HandPose[]
): {
  left: HandPose;
  right: HandPose;
} | null {
  if (hands.length !== 2) {
    return null;
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
    return null;
  }

  return {
    left,
    right,
  };
}

function getIssueMessage(
  issue: SealIssue
): string {
  switch (issue) {
    case "hands_too_far":
      return "Bring your hands closer together.";

    case "hands_too_close":
      return "Move your hands slightly apart.";

    case "hands_not_aligned":
      return "Align your hands with each other.";

    case "hands_wrong_position":
      return "Adjust the position of your hands.";

    case "wrong_fingers":
      return "Adjust your fingers.";

    default:
      return "Adjust your hands.";
  }
}

export function getSealAdvice(
  expectedSeal: SealName,
  hands: HandPose[]
): Advice {
  if (hands.length === 0) {
    return {
      type: "no_hands",
      message:
        "Show both hands to form the seal.",
    };
  }

  if (hands.length !== 2) {
    return {
      type: "wrong_hand_count",
      message:
        "Show both hands to form the seal.",
    };
  }

  const definition =
    sealDefinitions.find(
      (seal) =>
        seal.name === expectedSeal
    );

  if (!definition) {
    return {
      type: "wrong_seal",
      message:
        "Try to form the required seal.",
    };
  }

  const pose = createTwoHandPose(
    hands
  );

  if (!pose) {
    return {
      type: "wrong_hand_count",
      message:
        "Show both hands to form the seal.",
    };
  }

  /*
   * If the actual seal is already correct,
   * tell the user that everything is good.
   */
  if (definition.check(pose)) {
    return {
      type: "correct",
      message: "Perfect!",
    };
  }

  /*
   * Ask the same seal definition what
   * is currently wrong.
   */
  const issues =
    definition.getIssues(pose);

  if (issues.length === 0) {
    return {
      type: "wrong_seal",
      message:
        "Adjust your hands to match the seal.",
    };
  }

  /*
   * Position problems have priority.
   * It is more useful to tell the user
   * about a major hand-position problem
   * before individual fingers.
   */
  const priority: SealIssue[] = [
    "hands_too_far",
    "hands_too_close",
    "hands_wrong_position",
    "hands_not_aligned",
    "wrong_fingers",
  ];

  for (const issue of priority) {
    if (issues.includes(issue)) {
      return {
        type: issue === "wrong_fingers"
          ? "wrong_fingers"
          : issue === "hands_too_far"
          ? "hands_too_far"
          : issue === "hands_too_close"
          ? "hands_too_close"
          : issue === "hands_not_aligned"
          ? "hands_not_aligned"
          : "wrong_hand_position",

        message:
          getIssueMessage(issue),
      };
    }
  }

  return {
    type: "wrong_seal",
    message:
      "Adjust your hands to match the seal.",
  };
}

function createTwoHandPose(
  hands: HandPose[]
) {
  if (hands.length !== 2) {
    return null;
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
    return null;
  }

  const distance = Math.sqrt(
    (left.palm.center.x -
      right.palm.center.x) ** 2 +
    (left.palm.center.y -
      right.palm.center.y) ** 2 +
    (left.palm.center.z -
      right.palm.center.z) ** 2
  );

  const dot =
    left.palm.normal.x *
      right.palm.normal.x +
    left.palm.normal.y *
      right.palm.normal.y +
    left.palm.normal.z *
      right.palm.normal.z;

  return {
    hands,
    distance,
    alignment: Math.abs(dot),
  };
}

const MIN_ATTEMPT_SCORE = 0.60;

export function detectAttemptedSeal(
  hands: HandPose[]
): SealSimilarity | null {
  const pose =
    createTwoHandPose(hands);

  if (!pose) {
    return null;
  }

  const similarities =
    sealDefinitions.map(
      (definition) => ({
        seal: definition.name,
        score: definition.score(pose),
      })
    );

  similarities.sort(
    (a, b) =>
      b.score - a.score
  );

  const best =
    similarities[0];

  if (!best) {
    return null;
  }

  if (
    best.score <
    MIN_ATTEMPT_SCORE
  ) {
    return null;
  }

  return best;
}
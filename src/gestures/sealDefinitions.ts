import {
  calculateDotProduct,
} from "./palmUtils";

import type {
  HandPose,
  TwoHandPose,
} from "./types";

export type SealName =
  | "tiger"
  | "dog"
  | "boar"
  | "horse";

export type FingerName =
  | "index"
  | "middle"
  | "ring"
  | "pinky";

export type SealIssue =
  | "hands_too_far"
  | "hands_too_close"
  | "hands_not_aligned"
  | "hands_wrong_position"
  | "wrong_fingers";

export type SealDefinition = {
  name: SealName;

  check: (
    pose: TwoHandPose
  ) => boolean;

  score: (
    pose: TwoHandPose
  ) => number;

  getIssues: (
    pose: TwoHandPose
  ) => SealIssue[];
};

function getHands(
  pose: TwoHandPose
): {
  left: HandPose;
  right: HandPose;
} | null {
  const left = pose.hands.find(
    (hand) =>
      hand.handedness === "Left"
  );

  const right = pose.hands.find(
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

function isClosed(
  hand: HandPose
): boolean {
  return (
    !hand.fingers.index.extended &&
    !hand.fingers.middle.extended &&
    !hand.fingers.ring.extended &&
    !hand.fingers.pinky.extended
  );
}

function isOpen(
  hand: HandPose
): boolean {
  return (
    hand.fingers.index.extended &&
    hand.fingers.middle.extended &&
    hand.fingers.ring.extended &&
    hand.fingers.pinky.extended
  );
}

function getFingerMatch(
  hand: HandPose,
  finger: FingerName,
  expected: boolean
): boolean {
  return (
    hand.fingers[finger].extended ===
    expected
  );
}

function countFingerMatches(
  hand: HandPose,
  requirements: Record<
    FingerName,
    boolean
  >
): number {
  let matches = 0;

  const fingers: FingerName[] = [
    "index",
    "middle",
    "ring",
    "pinky",
  ];

  for (const finger of fingers) {
    if (
      getFingerMatch(
        hand,
        finger,
        requirements[finger]
      )
    ) {
      matches++;
    }
  }

  return matches;
}

function scoreDistance(
  distance: number,
  maxDistance: number
): number {
  if (distance <= maxDistance) {
    return 1;
  }

  const difference =
    distance - maxDistance;

  return Math.max(
    0,
    1 - difference / 0.30
  );
}

function scoreDifference(
  difference: number,
  maxDifference: number
): number {
  if (difference <= maxDifference) {
    return 1;
  }

  const extra =
    difference - maxDifference;

  return Math.max(
    0,
    1 - extra / 0.25
  );
}

/*
 * TIGER
 *
 * Both hands:
 * index  = extended
 * middle = extended + > 170°
 * ring   = bent
 * pinky  = bent
 *
 * Hands:
 * distance < 0.20
 * Y difference < 0.10
 */
export const tigerDefinition: SealDefinition = {
  name: "tiger",

  check: (pose) => {
    const hands = getHands(pose);

    if (!hands) {
      return false;
    }

    const {
      left,
      right,
    } = hands;

    const leftTiger =
      left.fingers.index.extended &&
      left.fingers.middle.extended &&
      !left.fingers.ring.extended &&
      !left.fingers.pinky.extended;

    const rightTiger =
      right.fingers.index.extended &&
      right.fingers.middle.extended &&
      !right.fingers.ring.extended &&
      !right.fingers.pinky.extended;

    const leftMiddleStraight =
      left.fingers.middle.angle > 170;

    const rightMiddleStraight =
      right.fingers.middle.angle > 170;

    const handsAligned =
      Math.abs(
        left.palm.center.y -
        right.palm.center.y
      ) < 0.10;

    const handsClose =
      pose.distance < 0.20;

    return (
      leftTiger &&
      rightTiger &&
      leftMiddleStraight &&
      rightMiddleStraight &&
      handsAligned &&
      handsClose
    );
  },

  score: (pose) => {
    const hands = getHands(pose);

    if (!hands) {
      return 0;
    }

    const {
      left,
      right,
    } = hands;

    const leftFingerScore =
      countFingerMatches(left, {
        index: true,
        middle: true,
        ring: false,
        pinky: false,
      }) / 4;

    const rightFingerScore =
      countFingerMatches(right, {
        index: true,
        middle: true,
        ring: false,
        pinky: false,
      }) / 4;

    const fingerScore =
      (leftFingerScore +
        rightFingerScore) /
      2;

    const leftMiddleScore =
      Math.min(
        1,
        Math.max(
          0,
          (left.fingers.middle.angle -
            145) /
            25
        )
      );

    const rightMiddleScore =
      Math.min(
        1,
        Math.max(
          0,
          (right.fingers.middle.angle -
            145) /
            25
        )
      );

    const middleScore =
      (leftMiddleScore +
        rightMiddleScore) /
      2;

    const distanceScore =
      scoreDistance(
        pose.distance,
        0.20
      );

    const alignmentScore =
      scoreDifference(
        Math.abs(
          left.palm.center.y -
          right.palm.center.y
        ),
        0.10
      );

    return (
      fingerScore * 0.50 +
      middleScore * 0.20 +
      distanceScore * 0.20 +
      alignmentScore * 0.10
    );
  },

  getIssues: (pose) => {
    const hands = getHands(pose);

    if (!hands) {
      return [
        "hands_wrong_position",
      ];
    }

    const {
      left,
      right,
    } = hands;

    const issues: SealIssue[] = [];

    if (pose.distance > 0.20) {
      issues.push("hands_too_far");
    }

    if (
      Math.abs(
        left.palm.center.y -
        right.palm.center.y
      ) >= 0.10
    ) {
      issues.push("hands_not_aligned");
    }

    const fingersCorrect =
      countFingerMatches(left, {
        index: true,
        middle: true,
        ring: false,
        pinky: false,
      }) === 4 &&
      countFingerMatches(right, {
        index: true,
        middle: true,
        ring: false,
        pinky: false,
      }) === 4;

    const middleCorrect =
      left.fingers.middle.angle > 170 &&
      right.fingers.middle.angle > 170;

    if (
      !fingersCorrect ||
      !middleCorrect
    ) {
      issues.push("wrong_fingers");
    }

    return issues;
  },
};

/*
 * DOG
 *
 * Left:
 * open
 *
 * Right:
 * closed
 *
 * Hands:
 * distance < 0.25
 * left above right
 * X difference < 0.15
 */
export const dogDefinition: SealDefinition = {
  name: "dog",

  check: (pose) => {
    const hands = getHands(pose);

    if (!hands) {
      return false;
    }

    const {
      left,
      right,
    } = hands;

    const leftOpen =
      isOpen(left);

    const rightClosed =
      isClosed(right);

    const handsClose =
      pose.distance < 0.25;

    const leftAboveRight =
      left.palm.center.y <
      right.palm.center.y;

    const horizontalAlignment =
      Math.abs(
        left.palm.center.x -
        right.palm.center.x
      ) < 0.15;

    return (
      leftOpen &&
      rightClosed &&
      handsClose &&
      leftAboveRight &&
      horizontalAlignment
    );
  },

  score: (pose) => {
    const hands = getHands(pose);

    if (!hands) {
      return 0;
    }

    const {
      left,
      right,
    } = hands;

    const leftFingerScore =
      countFingerMatches(left, {
        index: true,
        middle: true,
        ring: true,
        pinky: true,
      }) / 4;

    const rightFingerScore =
      countFingerMatches(right, {
        index: false,
        middle: false,
        ring: false,
        pinky: false,
      }) / 4;

    const fingerScore =
      (leftFingerScore +
        rightFingerScore) /
      2;

    const distanceScore =
      scoreDistance(
        pose.distance,
        0.25
      );

    /*
     * 1 when left is above right.
     * Becomes smaller when the order is wrong.
     */
    const verticalDifference =
      right.palm.center.y -
      left.palm.center.y;

    const verticalScore =
      verticalDifference > 0
        ? Math.min(
            1,
            verticalDifference / 0.10
          )
        : 0;

    const horizontalDifference =
      Math.abs(
        left.palm.center.x -
        right.palm.center.x
      );

    const horizontalScore =
      scoreDifference(
        horizontalDifference,
        0.15
      );

    return (
      fingerScore * 0.50 +
      distanceScore * 0.20 +
      verticalScore * 0.15 +
      horizontalScore * 0.15
    );
  },

  getIssues: (pose) => {
    const hands = getHands(pose);

    if (!hands) {
      return [
        "hands_wrong_position",
      ];
    }

    const {
      left,
      right,
    } = hands;

    const issues: SealIssue[] = [];

    if (pose.distance > 0.25) {
      issues.push("hands_too_far");
    }

    if (
      left.palm.center.y >=
      right.palm.center.y
    ) {
      issues.push(
        "hands_wrong_position"
      );
    }

    if (
      Math.abs(
        left.palm.center.x -
        right.palm.center.x
      ) >= 0.15
    ) {
      issues.push(
        "hands_not_aligned"
      );
    }

    const fingersCorrect =
      isOpen(left) &&
      isClosed(right);

    if (!fingersCorrect) {
      issues.push("wrong_fingers");
    }

    return issues;
  },
};

/*
 * BOAR
 *
 * Both hands:
 * closed
 *
 * Hands:
 * distance < 0.20
 * palms pointing down
 */
export const boarDefinition: SealDefinition = {
  name: "boar",

  check: (pose) => {
    const hands = getHands(pose);

    if (!hands) {
      return false;
    }

    const {
      left,
      right,
    } = hands;

    const leftClosed =
      isClosed(left);

    const rightClosed =
      isClosed(right);

    const handsClose =
      pose.distance < 0.20;

    const downReference = {
      x: 0,
      y: 1,
      z: 0,
    };

    const leftDirection =
      calculateDotProduct(
        left.palm.direction,
        downReference
      );

    const rightDirection =
      calculateDotProduct(
        right.palm.direction,
        downReference
      );

    const leftPointingDown =
      leftDirection > 0.7;

    const rightPointingDown =
      rightDirection > 0.7;

    return (
      leftClosed &&
      rightClosed &&
      handsClose &&
      leftPointingDown &&
      rightPointingDown
    );
  },

  score: (pose) => {
    const hands = getHands(pose);

    if (!hands) {
      return 0;
    }

    const {
      left,
      right,
    } = hands;

    const leftFingerScore =
      countFingerMatches(left, {
        index: false,
        middle: false,
        ring: false,
        pinky: false,
      }) / 4;

    const rightFingerScore =
      countFingerMatches(right, {
        index: false,
        middle: false,
        ring: false,
        pinky: false,
      }) / 4;

    const fingerScore =
      (leftFingerScore +
        rightFingerScore) /
      2;

    const distanceScore =
      scoreDistance(
        pose.distance,
        0.20
      );

    const downReference = {
      x: 0,
      y: 1,
      z: 0,
    };

    const leftDirection =
      calculateDotProduct(
        left.palm.direction,
        downReference
      );

    const rightDirection =
      calculateDotProduct(
        right.palm.direction,
        downReference
      );

    const leftDownScore =
      Math.min(
        1,
        Math.max(
          0,
          (leftDirection + 1) /
            1.7
        )
      );

    const rightDownScore =
      Math.min(
        1,
        Math.max(
          0,
          (rightDirection + 1) /
            1.7
        )
      );

    const downScore =
      (leftDownScore +
        rightDownScore) /
      2;

    return (
      fingerScore * 0.55 +
      distanceScore * 0.20 +
      downScore * 0.25
    );
  },

  getIssues: (pose) => {
    const hands = getHands(pose);

    if (!hands) {
      return [
        "hands_wrong_position",
      ];
    }

    const {
      left,
      right,
    } = hands;

    const issues: SealIssue[] = [];

    if (pose.distance > 0.20) {
      issues.push("hands_too_far");
    }

    if (
      !isClosed(left) ||
      !isClosed(right)
    ) {
      issues.push("wrong_fingers");
    }

    const downReference = {
      x: 0,
      y: 1,
      z: 0,
    };

    const leftDirection =
      calculateDotProduct(
        left.palm.direction,
        downReference
      );

    const rightDirection =
      calculateDotProduct(
        right.palm.direction,
        downReference
      );

    if (
      leftDirection <= 0.7 ||
      rightDirection <= 0.7
    ) {
      issues.push(
        "hands_wrong_position"
      );
    }

    return issues;
  },
};

/*
 * HORSE
 *
 * Both hands:
 * index > 170°
 * middle < 145°
 * ring < 145°
 * pinky < 145°
 *
 * Hands:
 * distance < 0.20
 * Y difference < 0.10
 */
export const horseDefinition: SealDefinition = {
  name: "horse",

  check: (pose) => {
    const hands = getHands(pose);

    if (!hands) {
      return false;
    }

    const {
      left,
      right,
    } = hands;

    const leftIndexStraight =
      left.fingers.index.angle > 170;

    const rightIndexStraight =
      right.fingers.index.angle > 170;

    const leftMiddleBent =
      left.fingers.middle.angle < 145;

    const rightMiddleBent =
      right.fingers.middle.angle < 145;

    const leftRingBent =
      left.fingers.ring.angle < 145;

    const rightRingBent =
      right.fingers.ring.angle < 145;

    const leftPinkyBent =
      left.fingers.pinky.angle < 145;

    const rightPinkyBent =
      right.fingers.pinky.angle < 145;

    const handsClose =
      pose.distance < 0.20;

    const handsAligned =
      Math.abs(
        left.palm.center.y -
        right.palm.center.y
      ) < 0.10;

    return (
      leftIndexStraight &&
      rightIndexStraight &&
      leftMiddleBent &&
      rightMiddleBent &&
      leftRingBent &&
      rightRingBent &&
      leftPinkyBent &&
      rightPinkyBent &&
      handsClose &&
      handsAligned
    );
  },

  score: (pose) => {
    const hands = getHands(pose);

    if (!hands) {
      return 0;
    }

    const {
      left,
      right,
    } = hands;

    const indexScore =
      (
        Math.min(
          1,
          Math.max(
            0,
            (left.fingers.index.angle -
              145) /
              25
          )
        ) +
        Math.min(
          1,
          Math.max(
            0,
            (right.fingers.index.angle -
              145) /
              25
          )
        )
      ) / 2;

    const leftBentScore =
      (
        Math.min(
          1,
          Math.max(
            0,
            (170 -
              left.fingers.middle.angle) /
              25
          )
        ) +
        Math.min(
          1,
          Math.max(
            0,
            (170 -
              left.fingers.ring.angle) /
              25
          )
        ) +
        Math.min(
          1,
          Math.max(
            0,
            (170 -
              left.fingers.pinky.angle) /
              25
          )
        )
      ) / 3;

    const rightBentScore =
      (
        Math.min(
          1,
          Math.max(
            0,
            (170 -
              right.fingers.middle.angle) /
              25
          )
        ) +
        Math.min(
          1,
          Math.max(
            0,
            (170 -
              right.fingers.ring.angle) /
              25
          )
        ) +
        Math.min(
          1,
          Math.max(
            0,
            (170 -
              right.fingers.pinky.angle) /
              25
          )
        )
      ) / 3;

    const bentScore =
      (leftBentScore +
        rightBentScore) /
      2;

    const distanceScore =
      scoreDistance(
        pose.distance,
        0.20
      );

    const alignmentScore =
      scoreDifference(
        Math.abs(
          left.palm.center.y -
          right.palm.center.y
        ),
        0.10
      );

    return (
      indexScore * 0.25 +
      bentScore * 0.45 +
      distanceScore * 0.20 +
      alignmentScore * 0.10
    );
  },

  getIssues: (pose) => {
    const hands = getHands(pose);

    if (!hands) {
      return [
        "hands_wrong_position",
      ];
    }

    const {
      left,
      right,
    } = hands;

    const issues: SealIssue[] = [];

    if (pose.distance > 0.20) {
      issues.push("hands_too_far");
    }

    if (
      Math.abs(
        left.palm.center.y -
        right.palm.center.y
      ) >= 0.10
    ) {
      issues.push("hands_not_aligned");
    }

    const fingersCorrect =
      left.fingers.index.angle > 170 &&
      right.fingers.index.angle > 170 &&
      left.fingers.middle.angle < 145 &&
      right.fingers.middle.angle < 145 &&
      left.fingers.ring.angle < 145 &&
      right.fingers.ring.angle < 145 &&
      left.fingers.pinky.angle < 145 &&
      right.fingers.pinky.angle < 145;

    if (!fingersCorrect) {
      issues.push("wrong_fingers");
    }

    return issues;
  },
};

export const sealDefinitions: SealDefinition[] = [
  tigerDefinition,
  dogDefinition,
  boarDefinition,
  horseDefinition,
];
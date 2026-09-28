// import { isFingerExtended, analyzeFingers } from "./fingerUtils";
import { analyzeFingers } from "./fingerUtils";
import {
  calculateDistance,
  calculateDotProduct,
  analyzePalm,
} from "./palmUtils";

import type { Point } from "./palmUtils";

import type {
  HandGesture,
  HandLandmarks,
  HandPose,
  TwoHandPose,
} from "./types";

// export function detectHandGesture(
//   landmarks: HandLandmarks
// ): HandGesture {
//   return {
//     index: isFingerExtended(landmarks, 8, 6),
//     middle: isFingerExtended(landmarks, 12, 10),
//     ring: isFingerExtended(landmarks, 16, 14),
//     pinky: isFingerExtended(landmarks, 20, 18),
//   };
// }

export function detectHandPose(
  landmarks: Point[],
  handedness: "Left" | "Right"
): HandPose {
  return {
    fingers: analyzeFingers(landmarks, handedness),
    palm: analyzePalm(landmarks),
    handedness,
  };
}

export function detectTwoHandPose(
  hands: HandPose[]
): TwoHandPose | null {
  if (hands.length !== 2) {
    return null;
  }

  const left = hands.find(
    (hand) => hand.handedness === "Left"
  );

  const right = hands.find(
    (hand) => hand.handedness === "Right"
  );

  if (!left || !right) {
    return null;
  }

  const distance = calculateDistance(
    left.palm.center,
    right.palm.center
  );

  const dot = calculateDotProduct(
    left.palm.normal,
    right.palm.normal
  );

  const alignment = Math.abs(dot);

  // Эталонное направление для правильного положения рук
  const leftReference = {
    x: 0.10,
    y: -0.99,
    z: -0.07,
  };

  const rightReference = {
    x: 0.03,
    y: -1.00,
    z: -0.07,
  };

  const leftDirectionAlignment =
    calculateDotProduct(
      left.palm.direction,
      leftReference
    );

  const rightDirectionAlignment =
    calculateDotProduct(
      right.palm.direction,
      rightReference
    );

  return {
    hands,
    distance,
    alignment,
  };
}
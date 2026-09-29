import { calculateDotProduct } from "./palmUtils";
import type { TwoHandPose } from "./types";

export type NarutoSeal = {
  name: string;
  tip: string;
  check: (pose: TwoHandPose) => boolean;
};
export const tigerSeal: NarutoSeal = {
  name: "Tiger",
  tip: "Index and middle fingers extended, ring and pinky fingers bent",

  check: (pose) => {
    const left = pose.hands.find(
      (hand) => hand.handedness === "Left"
    );

    const right = pose.hands.find(
      (hand) => hand.handedness === "Right"
    );

    if (!left || !right) {
      return false;
    }

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

    // Middle finger должен быть действительно прямым,
    // а не просто немного выше порога 160°
    const leftMiddleStraight =
      left.fingers.middle.angle > 170;

    const rightMiddleStraight =
      right.fingers.middle.angle > 170;

    // Обе руки должны находиться примерно на одной высоте
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
};

export const dogSeal: NarutoSeal = {
  name: "Dog",
  tip: "Left open palm covers the right fist",

  check: (pose) => {
    const left = pose.hands.find(
      (hand) => hand.handedness === "Left"
    );

    const right = pose.hands.find(
      (hand) => hand.handedness === "Right"
    );

    if (!left || !right) {
      return false;
    }

    const leftOpen =
      left.fingers.index.extended &&
      left.fingers.middle.extended &&
      left.fingers.ring.extended &&
      left.fingers.pinky.extended;

    const rightClosed =
      !right.fingers.index.extended &&
      !right.fingers.middle.extended &&
      !right.fingers.ring.extended &&
      !right.fingers.pinky.extended;

    const handsClose =
      pose.distance < 0.25;

    const leftAboveRight =
      left.palm.center.y < right.palm.center.y;

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
};

export const boarSeal: NarutoSeal = {
  name: "Boar",
  tip: "Both hands are closed and pointing downward",

  check: (pose) => {
    const left = pose.hands.find(
      (hand) => hand.handedness === "Left"
    );

    const right = pose.hands.find(
      (hand) => hand.handedness === "Right"
    );

    if (!left || !right) {
      return false;
    }

    const leftClosed =
      !left.fingers.index.extended &&
      !left.fingers.middle.extended &&
      !left.fingers.ring.extended &&
      !left.fingers.pinky.extended;

    const rightClosed =
      !right.fingers.index.extended &&
      !right.fingers.middle.extended &&
      !right.fingers.ring.extended &&
      !right.fingers.pinky.extended;

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
};
export const horseSeal: NarutoSeal = {
  name: "Horse",
  tip: "Index fingers extended, middle, ring and pinky fingers bent",

  check: (pose) => {
    const left = pose.hands.find(
      (hand) => hand.handedness === "Left"
    );

    const right = pose.hands.find(
      (hand) => hand.handedness === "Right"
    );

    if (!left || !right) {
      return false;
    }

    // Index должен быть явно выпрямлен
    const leftIndexStraight =
      left.fingers.index.angle > 170;

    const rightIndexStraight =
      right.fingers.index.angle > 170;

    // Middle должен быть явно согнут.
    // Просто !extended недостаточно.
    const leftMiddleBent =
      left.fingers.middle.angle < 145;

    const rightMiddleBent =
      right.fingers.middle.angle < 145;

    // Ring и pinky тоже должны быть согнуты
    const leftRingBent =
      left.fingers.ring.angle < 145;

    const rightRingBent =
      right.fingers.ring.angle < 145;

    const leftPinkyBent =
      left.fingers.pinky.angle < 145;

    const rightPinkyBent =
      right.fingers.pinky.angle < 145;

    // Обе руки близко
    const handsClose =
      pose.distance < 0.20;

    // Руки примерно на одной высоте
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
};
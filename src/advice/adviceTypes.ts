
import type { HandPose } from "../gestures/types";

import type { SealName } from "../hooks/useHandTracking";

export type FingerName =
  | "index"
  | "middle"
  | "ring"
  | "pinky";

export type AdviceType =
  | "no_hands"
  | "wrong_hand_count"
  | "hands_too_far"
  | "hands_too_close"
  | "hands_not_aligned"
  | "wrong_fingers"
  | "wrong_hand_position"
  | "wrong_seal"
  | "correct";

export type Advice = {
  type: AdviceType;
  message: string;
};

export type FingerRequirement = {
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
};

export type SealAdviceConfig = {
  left: FingerRequirement;
  right: FingerRequirement;

  maxDistance?: number;
  minDistance?: number;
  maxYDifference?: number;
};

export type SealSimilarity = {
  seal: SealName;
  score: number;
};

export type AdviceContext = {
  expectedSeal: SealName | null;
  hands: HandPose[];
};

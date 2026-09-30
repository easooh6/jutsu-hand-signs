import type { TwoHandPose } from "./types";

import {
  tigerDefinition,
  dogDefinition,
  boarDefinition,
  horseDefinition,
} from "./sealDefinitions";

export type NarutoSeal = {
  name: string;
  tip: string;
  check: (
    pose: TwoHandPose
  ) => boolean;
};

export const tigerSeal: NarutoSeal = {
  name: "Tiger",
  tip: "Index and middle fingers extended, ring and pinky fingers bent",
  check: tigerDefinition.check,
};

export const dogSeal: NarutoSeal = {
  name: "Dog",
  tip: "Left open palm covers the right fist",
  check: dogDefinition.check,
};

export const boarSeal: NarutoSeal = {
  name: "Boar",
  tip: "Both hands are closed and pointing downward",
  check: boarDefinition.check,
};

export const horseSeal: NarutoSeal = {
  name: "Horse",
  tip: "Index fingers extended, middle, ring and pinky fingers bent",
  check: horseDefinition.check,
};
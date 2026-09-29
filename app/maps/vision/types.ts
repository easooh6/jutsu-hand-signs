import type { WalkDirection } from "@/components/walk-sprite";
import type { GridPosition } from "../actors";

export type VisionObserver = {
  direction: WalkDirection;
  position: GridPosition;
};

export type VisionTunnel = {
  length: number;
  width: number;
};

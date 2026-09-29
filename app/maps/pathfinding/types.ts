import type { GridPosition } from "../actors";

export type PathPoint = GridPosition;

export type AStarGrid = {
  height: number;
  isWalkable: (x: number, y: number) => boolean;
  width: number;
};

export type AStarOptions = {
  maxVisited?: number;
};

export type MapPathOptions = AStarOptions & {
  allowOccupiedGoal?: boolean;
  occupied?: readonly GridPosition[];
};

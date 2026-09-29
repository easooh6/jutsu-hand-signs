import type { WalkDirection } from "@/components/walk-sprite";
import type { GridPosition } from "../actors";
import { canWalk } from "../map/collision";
import type { GameMap } from "../map/types";
import { findAStarPath } from "./aStar";
import type { MapPathOptions, PathPoint } from "./types";

function positionKey(position: GridPosition): string {
  return `${position.x}:${position.y}`;
}

export function findMapPath(
  map: GameMap,
  start: GridPosition,
  goal: GridPosition,
  options: MapPathOptions = {},
): PathPoint[] | null {
  const occupied = new Set((options.occupied ?? []).map(positionKey));
  const goalKey = positionKey(goal);

  return findAStarPath(
    {
      height: map.height,
      isWalkable(x, y) {
        if (!canWalk(map, x, y)) return false;
        const key = positionKey({ x, y });
        return (
          !occupied.has(key) ||
          (options.allowOccupiedGoal === true && key === goalKey)
        );
      },
      width: map.width,
    },
    start,
    goal,
    options,
  );
}

export function pathToDirections(
  path: readonly PathPoint[],
): WalkDirection[] {
  const directions: WalkDirection[] = [];

  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1]!;
    const current = path[index]!;
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;

    if (dx === 0 && dy === -1) directions.push("up");
    else if (dx === -1 && dy === 0) directions.push("left");
    else if (dx === 1 && dy === 0) directions.push("right");
    else if (dx === 0 && dy === 1) directions.push("down");
    else throw new Error("Path contains non-adjacent points");
  }

  return directions;
}

export function findMapRoute(
  map: GameMap,
  start: GridPosition,
  goal: GridPosition,
  options?: MapPathOptions,
): WalkDirection[] | null {
  const path = findMapPath(map, start, goal, options);
  return path ? pathToDirections(path) : null;
}

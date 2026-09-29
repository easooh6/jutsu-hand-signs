import type { WalkDirection } from "@/components/walk-sprite";
import type { GridPosition } from "../types";
import type { GameMap } from "../../map/types";
import { canWalk } from "../../map/collision";
import { findMapRoute } from "../../pathfinding";

export const WANDER_RADIUS = 5;
export const WANDER_DELAY_MIN = 2_000;
export const WANDER_DELAY_MAX = 5_000;

const DIRECTIONS: readonly WalkDirection[] = [
  "up",
  "left",
  "right",
  "down",
];

export function randomWanderDelay(random = Math.random): number {
  return Math.round(
    WANDER_DELAY_MIN +
      random() * (WANDER_DELAY_MAX - WANDER_DELAY_MIN),
  );
}

export function randomTurnDirection(
  current: WalkDirection,
  random = Math.random,
): WalkDirection {
  const choices = DIRECTIONS.filter((direction) => direction !== current);
  return choices[Math.floor(random() * choices.length)]!;
}

export function findRandomWanderRoute(
  map: GameMap,
  start: GridPosition,
  occupied: readonly GridPosition[] = [],
  random = Math.random,
): WalkDirection[] | null {
  const candidates: GridPosition[] = [];

  for (let dy = -WANDER_RADIUS; dy <= WANDER_RADIUS; dy += 1) {
    for (let dx = -WANDER_RADIUS; dx <= WANDER_RADIUS; dx += 1) {
      const distance = Math.abs(dx) + Math.abs(dy);
      if (distance === 0 || distance > WANDER_RADIUS) continue;

      const point = { x: start.x + dx, y: start.y + dy };
      if (canWalk(map, point.x, point.y)) candidates.push(point);
    }
  }

  while (candidates.length > 0) {
    const index = Math.floor(random() * candidates.length);
    const [goal] = candidates.splice(index, 1);
    const route = findMapRoute(map, start, goal!, { occupied });
    if (route && route.length <= WANDER_RADIUS) return route;
  }

  return null;
}

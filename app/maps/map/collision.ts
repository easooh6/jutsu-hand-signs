import type { GameMap } from "./types";

export function canWalk(map: GameMap, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
    return false;
  }

  const object = map.objects[y]?.[x];
  if (object && !object.walkable) {
    return false;
  }

  return map.ground[y]?.[x]?.walkable ?? false;
}

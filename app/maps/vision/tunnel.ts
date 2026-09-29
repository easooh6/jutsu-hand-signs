import type { WalkDirection } from "@/components/walk-sprite";
import type { GridPosition } from "../actors";
import type { VisionObserver, VisionTunnel } from "./types";

export const DEFAULT_VISION_TUNNEL: VisionTunnel = {
  length: 5,
  width: 3,
};

const FORWARD: Record<WalkDirection, GridPosition> = {
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
};

function normalizedTunnel(tunnel: VisionTunnel): VisionTunnel {
  const width = Math.max(1, Math.floor(tunnel.width));
  return {
    length: Math.max(0, Math.floor(tunnel.length)),
    width: width % 2 === 0 ? width + 1 : width,
  };
}

export function isPositionInVisionTunnel(
  observer: VisionObserver,
  target: GridPosition,
  tunnel: VisionTunnel = DEFAULT_VISION_TUNNEL,
): boolean {
  const area = normalizedTunnel(tunnel);
  const forward = FORWARD[observer.direction];
  const side = { x: -forward.y, y: forward.x };
  const delta = {
    x: target.x - observer.position.x,
    y: target.y - observer.position.y,
  };
  const forwardDistance = delta.x * forward.x + delta.y * forward.y;
  const sideDistance = delta.x * side.x + delta.y * side.y;

  return (
    forwardDistance >= 1 &&
    forwardDistance <= area.length &&
    Math.abs(sideDistance) <= Math.floor(area.width / 2)
  );
}

export function getVisionTunnelCells(
  observer: VisionObserver,
  tunnel: VisionTunnel = DEFAULT_VISION_TUNNEL,
): GridPosition[] {
  const area = normalizedTunnel(tunnel);
  const forward = FORWARD[observer.direction];
  const side = { x: -forward.y, y: forward.x };
  const sideRadius = Math.floor(area.width / 2);
  const cells: GridPosition[] = [];

  for (let distance = 1; distance <= area.length; distance += 1) {
    for (let offset = -sideRadius; offset <= sideRadius; offset += 1) {
      cells.push({
        x:
          observer.position.x +
          forward.x * distance +
          side.x * offset,
        y:
          observer.position.y +
          forward.y * distance +
          side.y * offset,
      });
    }
  }

  return cells;
}

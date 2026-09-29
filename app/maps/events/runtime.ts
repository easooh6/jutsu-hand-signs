"use client";

import { useCallback } from "react";
import { useHandConfirm } from "@/components/hand-camera";
import type { WalkDirection } from "@/components/walk-sprite";
import type { GridPosition } from "../actors";
import type { GameMap } from "../map";
import type { EventDatabase, EventEntity, EventInteraction } from "./types";

const DIRECTION_OFFSETS: Record<WalkDirection, GridPosition> = {
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
};

export function findEventEntityAt(
  map: GameMap,
  database: EventDatabase,
  position: GridPosition,
  interaction: EventInteraction,
): EventEntity | null {
  const references = map.events[position.y]?.[position.x] ?? [];

  for (const reference of references) {
    const entity = database.events.find(
      (candidate) => candidate.id === reference.eventId,
    );
    if (entity?.interaction === interaction) return entity;
  }

  return null;
}

export function resolveTransitDestination(
  database: EventDatabase,
  source: EventEntity,
): EventEntity | null {
  const transit = source.scripts.find(
    (script) =>
      script.type === "transit" && script.connectedDestinationId !== null,
  );
  if (!transit || transit.type !== "transit") return null;

  return (
    database.events.find((event) =>
      event.scripts.some(
        (script) =>
          script.type === "destination" &&
          script.id === transit.connectedDestinationId,
      ),
    ) ?? null
  );
}

type UseInteractEventOptions = {
  database: EventDatabase;
  direction: WalkDirection;
  enabled: boolean;
  map: GameMap;
  onTrigger: (event: EventEntity) => void;
  position: GridPosition;
};

export function useInteractEvent({
  database,
  direction,
  enabled,
  map,
  onTrigger,
  position,
}: UseInteractEventOptions) {
  const interact = useCallback(() => {
    const offset = DIRECTION_OFFSETS[direction];
    const target = {
      x: position.x + offset.x,
      y: position.y + offset.y,
    };
    const event = findEventEntityAt(map, database, target, "interact");

    if (event) {
      onTrigger(event);
    }
  }, [database, direction, map, onTrigger, position.x, position.y]);

  useHandConfirm(interact, enabled);
}

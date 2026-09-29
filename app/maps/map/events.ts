import type { GameMap, MapEvent, MapEventCell } from "./types";
import type { EventDatabase, EventScript } from "../events";

const NO_EVENTS: MapEventCell = [];

export function getMapEvents(
  map: GameMap,
  x: number,
  y: number,
): MapEventCell {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
    return NO_EVENTS;
  }

  return map.events[y]?.[x] ?? NO_EVENTS;
}

export function findMapEvent(
  map: GameMap,
  type: string,
): { event: MapEvent; x: number; y: number } | null {
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const event = map.events[y]?.[x]?.find(
        (candidate) => candidate.type === type,
      );

      if (event) {
        return { event, x, y };
      }
    }
  }

  return null;
}

export function findMapEventByScript(
  map: GameMap,
  database: EventDatabase,
  scriptType: EventScript["type"],
): { event: MapEvent; x: number; y: number } | null {
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const event = map.events[y]?.[x]?.find((reference) =>
        database.events
          .find((entity) => entity.id === reference.eventId)
          ?.scripts.some((script) => script.type === scriptType),
      );

      if (event) return { event, x, y };
    }
  }

  return null;
}

export function findMapEventByEntityId(
  map: GameMap,
  eventId: number,
): { event: MapEvent; x: number; y: number } | null {
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const event = map.events[y]?.[x]?.find(
        (candidate) => candidate.eventId === eventId,
      );

      if (event) return { event, x, y };
    }
  }

  return null;
}

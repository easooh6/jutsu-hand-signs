import { getTile } from "../tiles";
import type { TileSheetId } from "../tiles";
import type {
  GameMap,
  MapActorLayer,
  MapActorSpawn,
  MapEvent,
  MapEventLayer,
  MapLayer,
} from "./types";

export type SerializedTile = {
  index: number;
  sheet: TileSheetId;
};

export type SerializedMapEvent = MapEvent;
export type SerializedMapActor = MapActorSpawn;

export type SerializedGameMap = {
  actors?: (SerializedMapActor | null)[][];
  events: SerializedMapEvent[][][];
  ground: (SerializedTile | null)[][];
  height: number;
  objects: (SerializedTile | null)[][];
  overhead: (SerializedTile | null)[][];
  tileSize: number;
  width: number;
};

function hydrateLayer(layer: SerializedGameMap["ground"]): MapLayer {
  return layer.map((row) =>
    row.map((tile) => (tile ? getTile(tile.sheet, tile.index) : null)),
  );
}

function hydrateEvents(events: SerializedGameMap["events"]): MapEventLayer {
  return events;
}

function hydrateActors(source: SerializedGameMap): MapActorLayer {
  return (
    source.actors ??
    Array.from({ length: source.height }, () =>
      Array.from({ length: source.width }, () => null),
    )
  );
}

export function loadGameMap(source: SerializedGameMap): GameMap {
  return {
    actors: hydrateActors(source),
    events: hydrateEvents(source.events),
    ground: hydrateLayer(source.ground),
    height: source.height,
    objects: hydrateLayer(source.objects),
    overhead: hydrateLayer(source.overhead),
    tileSize: source.tileSize,
    width: source.width,
  };
}

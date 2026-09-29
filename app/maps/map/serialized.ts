import { getTile } from "../tiles";
import type { TileSheetId } from "../tiles";
import type { GameMap, MapEvent, MapEventLayer, MapLayer } from "./types";

export type SerializedTile = {
  index: number;
  sheet: TileSheetId;
};

export type SerializedMapEvent = MapEvent;

export type SerializedGameMap = {
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

export function loadGameMap(source: SerializedGameMap): GameMap {
  return {
    events: hydrateEvents(source.events),
    ground: hydrateLayer(source.ground),
    height: source.height,
    objects: hydrateLayer(source.objects),
    overhead: hydrateLayer(source.overhead),
    tileSize: source.tileSize,
    width: source.width,
  };
}

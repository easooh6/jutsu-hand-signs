import type { Tile } from "../tiles";

export type MapCell = Tile | null;
export type MapLayer = MapCell[][];

export type MapEvent = {
  eventId: number;
  id: string;
  type: "entity";
};

export type MapEventCell = readonly MapEvent[];
export type MapEventLayer = MapEventCell[][];

export type GameMap = {
  events: MapEventLayer;
  ground: MapLayer;
  height: number;
  objects: MapLayer;
  overhead: MapLayer;
  tileSize: number;
  width: number;
};

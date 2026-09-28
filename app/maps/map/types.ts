import type { Tile } from "../tiles";

export type MapCell = Tile | null;
export type MapLayer = MapCell[][];

export type MapEventTrigger = "enter" | "interact";

export type MapEvent = {
  id: string;
  type: string;
  trigger: MapEventTrigger;
  data?: Readonly<Record<string, unknown>>;
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

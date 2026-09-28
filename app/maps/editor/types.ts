import type {
  SerializedGameMap,
  SerializedMapEvent,
  SerializedTile,
} from "../map";

export type EditorLayer = "ground" | "objects" | "overhead" | "events";

export type EditorTile = SerializedTile;

export type EditorEvent = SerializedMapEvent & {
  type: "player-spawn";
};

export type EditorMap = Omit<SerializedGameMap, "events" | "tileSize"> & {
  events: EditorEvent[][][];
  tileSize: 48;
};

export type EditorBrush =
  | { kind: "erase" }
  | { event: EditorEvent; kind: "event" }
  | { kind: "tile"; tile: EditorTile };

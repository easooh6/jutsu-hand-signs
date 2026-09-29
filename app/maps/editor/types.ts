import type {
  SerializedGameMap,
  SerializedMapActor,
  SerializedMapEvent,
  SerializedTile,
} from "../map";

export type EditorLayer =
  | "ground"
  | "objects"
  | "overhead"
  | "actors"
  | "events";

export type EditorTile = SerializedTile;

export type EditorEvent = SerializedMapEvent;
export type EditorActor = SerializedMapActor;

export type EditorMap = Omit<
  SerializedGameMap,
  "actors" | "events" | "tileSize"
> & {
  actors: (EditorActor | null)[][];
  events: EditorEvent[][][];
  tileSize: 48;
};

export type EditorBrush =
  | { kind: "erase" }
  | { actor: EditorActor; kind: "actor" }
  | { kind: "event" }
  | { kind: "tile"; tile: EditorTile };

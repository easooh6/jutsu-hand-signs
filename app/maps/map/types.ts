import type { WalkDirection } from "@/components/walk-sprite";
import type { ActorDefinitionId } from "../actors/definitions";
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

export type MapActorSpawn = {
  actorId: ActorDefinitionId;
  direction: WalkDirection;
  instanceId: string;
};

export type MapActorLayer = (MapActorSpawn | null)[][];

export type GameMap = {
  actors: MapActorLayer;
  events: MapEventLayer;
  ground: MapLayer;
  height: number;
  objects: MapLayer;
  overhead: MapLayer;
  tileSize: number;
  width: number;
};

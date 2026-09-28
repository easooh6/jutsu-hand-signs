import type { TileSheetDefinition } from "./types";

export const WALL_1_TILES = {
  top: {
    leftTurn: 0,
    straight: 1,
    rightTurn: 2,
  },
  middle: {
    leftTurn: 3,
    straight: 4,
    rightTurn: 5,
  },
  bottom: {
    leftTurn: 6,
    straight: 7,
    rightTurn: 8,
  },
} as const;

export const DOOR_1_WALKABLE = [] as const;

export const DOOR_1_TILES = {
  top: {
    solidLeft: 0,
    passage: 1,
    solidRight: 2,
  },
  middle: {
    solidLeft: 3,
    passage: 4,
    solidRight: 5,
  },
  bottom: {
    solidLeft: 6,
    passage: 7,
    solidRight: 8,
  },
} as const;

export const FLOOR_1_TILES = {
  stone: 0,
  alternate: 1,
} as const;

export const TILE_SHEETS: readonly TileSheetDefinition[] = [
  {
    id: "wall_1",
    src: "/tiles/wall_1.png",
    columns: 3,
    rows: 3,
    tileWidth: 48,
    tileHeight: 48,
    defaultLayer: "objects",
    walkable: [],
  },
  {
    id: "floor_1",
    src: "/tiles/floor_1.png",
    columns: 2,
    rows: 1,
    tileWidth: 48,
    tileHeight: 48,
    defaultLayer: "ground",
    walkable: "all",
  },
  {
    id: "door_1",
    src: "/tiles/door_1.png",
    columns: 3,
    rows: 3,
    tileWidth: 48,
    tileHeight: 48,
    defaultLayer: "objects",
    walkable: DOOR_1_WALKABLE,
  },
  {
    id: "back_overhead",
    src: "/tiles/back_overhead.png",
    columns: 9,
    rows: 3,
    tileWidth: 48,
    tileHeight: 48,
    defaultLayer: "overhead",
    walkable: "all",
  },
] as const;

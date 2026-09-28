export type TileSheetId =
  | "wall_1"
  | "floor_1"
  | "door_1"
  | "back_overhead";

export type TilePlacement = "ground" | "objects" | "overhead";

export type WalkableTiles = "all" | readonly number[];

export type TileSheetDefinition = {
  id: TileSheetId;
  src: string;
  columns: number;
  rows: number;
  tileWidth: number;
  tileHeight: number;
  defaultLayer: TilePlacement;
  walkable: WalkableTiles;
};

export type Tile = {
  sheet: TileSheetId;
  index: number;
  src: string;
  col: number;
  row: number;
  walkable: boolean;
};

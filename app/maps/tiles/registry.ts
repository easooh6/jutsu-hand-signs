import { TILE_SHEETS } from "./tileData";
import type { Tile, TileSheetDefinition, TileSheetId } from "./types";

const registry = new Map<TileSheetId, Tile[]>();
const definitions = new Map<TileSheetId, TileSheetDefinition>(
  TILE_SHEETS.map((sheet) => [sheet.id, sheet]),
);

let initialized = false;

export function initTiles(): void {
  if (initialized) {
    return;
  }

  for (const sheet of TILE_SHEETS) {
    const total = sheet.columns * sheet.rows;
    const walkableIndexes =
      sheet.walkable === "all" ? null : new Set(sheet.walkable);

    const tiles = Array.from({ length: total }, (_, index): Tile => ({
      sheet: sheet.id,
      index,
      src: sheet.src,
      col: index % sheet.columns,
      row: Math.floor(index / sheet.columns),
      walkable: walkableIndexes === null || walkableIndexes.has(index),
    }));

    registry.set(sheet.id, tiles);
  }

  initialized = true;
}

export function getTile(sheet: TileSheetId, index: number): Tile {
  initTiles();

  const tiles = registry.get(sheet);
  if (!tiles) {
    throw new Error(`Unknown tilesheet: ${sheet}`);
  }

  const tile = tiles[index];
  if (!tile) {
    throw new Error(`Unknown tile ${index} in ${sheet}`);
  }

  return tile;
}

export function getTileAt(
  sheet: TileSheetId,
  column: number,
  row: number,
): Tile {
  const definition = getTileSheet(sheet);

  if (
    !Number.isInteger(column) ||
    !Number.isInteger(row) ||
    column < 0 ||
    row < 0 ||
    column >= definition.columns ||
    row >= definition.rows
  ) {
    throw new RangeError(
      `Unknown tile at column ${column}, row ${row} in ${sheet}`,
    );
  }

  return getTile(sheet, row * definition.columns + column);
}

export function getTileSheet(sheet: TileSheetId): TileSheetDefinition {
  const definition = definitions.get(sheet);
  if (!definition) {
    throw new Error(`Unknown tilesheet: ${sheet}`);
  }

  return definition;
}

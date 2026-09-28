import type { CSSProperties, ReactNode } from "react";
import { getTileSheet } from "../tiles";
import type { Tile } from "../tiles";
import type { GameMap } from "./types";
import styles from "./MapRenderer.module.css";

type MapRendererProps = {
  children?: ReactNode;
  map: GameMap;
  scale?: number;
};

function tileStyle(tile: Tile, scale: number): CSSProperties {
  const sheet = getTileSheet(tile.sheet);
  const tileWidth = sheet.tileWidth * scale;
  const tileHeight = sheet.tileHeight * scale;

  return {
    width: tileWidth,
    height: tileHeight,
    backgroundImage: `url("${tile.src}")`,
    backgroundPosition: `${-tile.col * tileWidth}px ${-tile.row * tileHeight}px`,
    backgroundSize: `${sheet.columns * tileWidth}px ${sheet.rows * tileHeight}px`,
  };
}

export function MapRenderer({ children, map, scale = 1 }: MapRendererProps) {
  const safeScale = Math.max(scale, 0.1);
  const renderedTileSize = map.tileSize * safeScale;

  return (
    <div
      aria-label="Dungeon map"
      className={styles.map}
      role="img"
      style={{
        gridTemplateColumns: `repeat(${map.width}, ${renderedTileSize}px)`,
        gridTemplateRows: `repeat(${map.height}, ${renderedTileSize}px)`,
      }}
    >
      {map.ground.map((row, y) =>
        row.map((ground, x) => {
          const object = map.objects[y]?.[x];

          return (
            <div className={styles.cell} key={`${x}:${y}`}>
              {ground && (
                <span
                  className={styles.tile}
                  style={tileStyle(ground, safeScale)}
                />
              )}
              {object && (
                <span
                  className={`${styles.tile} ${styles.object}`}
                  style={tileStyle(object, safeScale)}
                />
              )}
            </div>
          );
        }),
      )}
      {children}
    </div>
  );
}

export function MapOverheadRenderer({ map, scale = 1 }: MapRendererProps) {
  const safeScale = Math.max(scale, 0.1);
  const renderedTileSize = map.tileSize * safeScale;

  return (
    <div
      aria-hidden="true"
      className={`${styles.map} ${styles.overheadMap}`}
      style={{
        gridTemplateColumns: `repeat(${map.width}, ${renderedTileSize}px)`,
        gridTemplateRows: `repeat(${map.height}, ${renderedTileSize}px)`,
      }}
    >
      {map.overhead.map((row, y) =>
        row.map((tile, x) => (
          <div className={styles.cell} key={`${x}:${y}`}>
            {tile && (
              <span className={styles.tile} style={tileStyle(tile, safeScale)} />
            )}
          </div>
        )),
      )}
    </div>
  );
}

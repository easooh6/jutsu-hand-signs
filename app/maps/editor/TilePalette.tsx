"use client";

import type { CSSProperties } from "react";
import { getTile, TILE_SHEETS } from "../tiles";
import type { EditorBrush, EditorLayer } from "./types";
import styles from "./editor.module.css";

type TilePaletteProps = {
  activeLayer: EditorLayer;
  brush: EditorBrush;
  onLayerChange: (layer: EditorLayer) => void;
  onBrushChange: (brush: EditorBrush) => void;
};

const LAYERS: readonly EditorLayer[] = [
  "ground",
  "objects",
  "overhead",
  "events",
];

export function tilePreviewStyle(
  sheetId: Parameters<typeof getTile>[0],
  index: number,
): CSSProperties {
  const sheet = TILE_SHEETS.find((candidate) => candidate.id === sheetId)!;
  const tile = getTile(sheetId, index);

  return {
    backgroundImage: `url("${tile.src}")`,
    backgroundPosition: `${-tile.col * 48}px ${-tile.row * 48}px`,
    backgroundSize: `${sheet.columns * 48}px ${sheet.rows * 48}px`,
  };
}

export function TilePalette({
  activeLayer,
  brush,
  onBrushChange,
  onLayerChange,
}: TilePaletteProps) {
  return (
    <aside className={styles.palette}>
      <div className={styles.layerTabs}>
        {LAYERS.map((layer) => (
          <button
            className={activeLayer === layer ? styles.activeTab : styles.tab}
            key={layer}
            onClick={() => onLayerChange(layer)}
            type="button"
          >
            {layer}
          </button>
        ))}
      </div>

      <button
        className={brush.kind === "erase" ? styles.activeTool : styles.tool}
        onClick={() => onBrushChange({ kind: "erase" })}
        type="button"
      >
        ERASER
      </button>

      {activeLayer === "events" ? (
        <div className={styles.tileGroup}>
          <span className={styles.sheetName}>EVENTS</span>
          <button
            className={
              brush.kind === "event" ? styles.activeTileButton : styles.tileButton
            }
            onClick={() =>
              onBrushChange({
                event: { id: "player-spawn", type: "player-spawn" },
                kind: "event",
              })
            }
            title="Player spawn"
            type="button"
          >
            <span className={styles.spawnTile}>P</span>
          </button>
        </div>
      ) : (
        TILE_SHEETS.filter(
          (sheet) => sheet.defaultLayer === activeLayer,
        ).map((sheet) => (
          <div className={styles.tileGroup} key={sheet.id}>
            <span className={styles.sheetName}>{sheet.id}</span>
            <div className={styles.tiles}>
              {Array.from({ length: sheet.columns * sheet.rows }, (_, index) => {
                const selected =
                  brush.kind === "tile" &&
                  brush.tile.sheet === sheet.id &&
                  brush.tile.index === index;

                return (
                  <button
                    className={selected ? styles.activeTileButton : styles.tileButton}
                    key={index}
                    onClick={() =>
                      onBrushChange({
                        kind: "tile",
                        tile: { index, sheet: sheet.id },
                      })
                    }
                    title={`${sheet.id}: ${index}`}
                    type="button"
                  >
                    <span
                      className={styles.tilePreview}
                      style={tilePreviewStyle(sheet.id, index)}
                    />
                    <small>{index}</small>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </aside>
  );
}

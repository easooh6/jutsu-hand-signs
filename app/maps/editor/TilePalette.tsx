"use client";

import type { CSSProperties } from "react";
import { ACTOR_DEFINITIONS } from "../actors";
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
  "actors",
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

      {activeLayer === "actors" ? (
        <div className={styles.tileGroup}>
          <span className={styles.sheetName}>ACTORS</span>
          <div className={styles.actorTiles}>
            {ACTOR_DEFINITIONS.map((actor) => {
              const selected =
                brush.kind === "actor" &&
                brush.actor.actorId === actor.id;

              return (
                <button
                  className={
                    selected ? styles.activeActorButton : styles.actorButton
                  }
                  key={actor.id}
                  onClick={() =>
                    onBrushChange({
                      actor: { actorId: actor.id, direction: "down" },
                      kind: "actor",
                    })
                  }
                  title={`${actor.name} — HOSTILE`}
                  type="button"
                >
                  <img alt="" src={actor.iconSrc} />
                  <span>{actor.name}</span>
                  <small>FRIENDLY: 0</small>
                </button>
              );
            })}
          </div>
        </div>
      ) : activeLayer === "events" ? (
        <div className={styles.tileGroup}>
          <span className={styles.sheetName}>EVENTS</span>
          <div className={styles.tiles}>
            <button
              className={
                brush.kind === "event"
                  ? styles.activeTileButton
                  : styles.tileButton
              }
              onClick={() =>
                onBrushChange({
                  kind: "event",
                })
              }
              title="Event entity"
              type="button"
            >
              <span className={styles.transitionTile}>+</span>
            </button>
          </div>
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

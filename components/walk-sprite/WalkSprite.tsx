"use client";

import { useState } from "react";
import type { CSSProperties, SyntheticEvent } from "react";
import type { WalkDirection, WalkSpriteProps } from "./types";
import styles from "./WalkSprite.module.css";

const COLUMNS = 3;
const ROWS = 4;

const DIRECTION_ROWS: Record<WalkDirection, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};

// A completed tile alternates the leading foot. Idle is rendered separately
// at the exact moment the character reaches the tile.
const WALK_FRAMES = [0, 2] as const;
const IDLE_FRAME = 1;

type SheetSize = { height: number; src: string; width: number };

export function WalkSprite({
  action = "idle",
  alt,
  cycle = 0,
  direction = "down",
  scale = 1,
  src,
}: WalkSpriteProps) {
  const [sheetSize, setSheetSize] = useState<SheetSize | null>(null);
  const currentSheetSize = sheetSize?.src === src ? sheetSize : null;

  const safeScale = Math.max(scale, 0.1);
  const stepIndex = Math.max(cycle - 1, 0) % WALK_FRAMES.length;
  const frame = action === "walk" ? WALK_FRAMES[stepIndex] : IDLE_FRAME;
  const row = DIRECTION_ROWS[direction];
  const frameWidth = (currentSheetSize?.width ?? 0) / COLUMNS;
  const frameHeight = (currentSheetSize?.height ?? 0) / ROWS;
  const renderedWidth = frameWidth * safeScale;
  const renderedHeight = frameHeight * safeScale;
  const spriteStyle: CSSProperties = {
    height: renderedHeight,
    width: renderedWidth,
  };
  const sheetStyle: CSSProperties = {
    height: (currentSheetSize?.height ?? 0) * safeScale,
    transform: `translate(${-frame * renderedWidth}px, ${-row * renderedHeight}px)`,
    width: (currentSheetSize?.width ?? 0) * safeScale,
  };

  function readSheetSize(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    setSheetSize({
      height: image.naturalHeight,
      src,
      width: image.naturalWidth,
    });
  }

  return (
    <span
      aria-label={alt}
      className={styles.sprite}
      role="img"
      style={spriteStyle}
    >
      <img
        alt=""
        className={styles.sheet}
        draggable={false}
        onLoad={readSheetSize}
        src={src}
        style={sheetStyle}
      />
    </span>
  );
}

"use client";

import type { CSSProperties } from "react";
import type { WalkDirection, WalkSpriteProps } from "./types";
import styles from "./WalkSprite.module.css";

const FRAME_WIDTH = 80;
const FRAME_HEIGHT = 110;
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

type SpriteStyle = CSSProperties & {
  "--frame-height": string;
  "--frame-width": string;
  "--sprite-image": string;
};

export function WalkSprite({
  action = "idle",
  alt,
  cycle = 0,
  direction = "down",
  scale = 1,
  src,
}: WalkSpriteProps) {
  const safeScale = Math.max(scale, 0.1);
  const stepIndex = Math.max(cycle - 1, 0) % WALK_FRAMES.length;
  const frame = action === "walk" ? WALK_FRAMES[stepIndex] : IDLE_FRAME;
  const row = DIRECTION_ROWS[direction];
  const renderedWidth = FRAME_WIDTH * safeScale;
  const renderedHeight = FRAME_HEIGHT * safeScale;
  const spriteStyle: SpriteStyle = {
    "--frame-height": `${renderedHeight}px`,
    "--frame-width": `${renderedWidth}px`,
    "--sprite-image": `url("${src}")`,
    backgroundPosition: `${-frame * renderedWidth}px ${-row * renderedHeight}px`,
    backgroundSize: `${COLUMNS * renderedWidth}px ${ROWS * renderedHeight}px`,
  };

  return (
    <span
      aria-label={alt}
      className={styles.sprite}
      role="img"
      style={spriteStyle}
    />
  );
}

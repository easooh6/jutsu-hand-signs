"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import type { SpellDefinition, SpellSeal } from "./types";
import styles from "./Spell.module.css";

type SpriteStyle = CSSProperties & {
  "--sprite-image": string;
};

type SpellProps = SpellDefinition & {
  onSequenceChange?: (seals: readonly SpellSeal[] | null) => void;
};

export function Spell({
  columns,
  description,
  frameDuration = 90,
  id,
  iconFrame = 1,
  name,
  phases,
  rows,
  seals,
  showDetails = true,
  spriteSrc,
  onSequenceChange,
}: SpellProps) {
  const [isActive, setIsActive] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);

  const frames = useMemo(
    () =>
      phases.flatMap((phase) =>
        Array.from({ length: phase.frames }, (_, column) => ({
          column,
          row: phase.row,
        })),
      ),
    [phases],
  );

  const iconFrameIndex =
    iconFrame === "last"
      ? Math.max(frames.length - 1, 0)
      : Math.min(Math.max(iconFrame - 1, 0), Math.max(frames.length - 1, 0));

  useEffect(() => {
    if (!isActive || frames.length < 2) return;

    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, frameDuration);

    return () => window.clearInterval(timer);
  }, [frameDuration, frames.length, isActive]);

  const visibleFrameIndex = isActive ? frameIndex : iconFrameIndex;
  const frame = frames[visibleFrameIndex] ?? { column: 0, row: 0 };
  const x = columns > 1 ? (frame.column / (columns - 1)) * 100 : 0;
  const y = rows > 1 ? (frame.row / (rows - 1)) * 100 : 0;
  const detailsId = `${id}-details`;
  const spriteStyle: SpriteStyle = {
    "--sprite-image": `url("${spriteSrc}")`,
    backgroundPosition: `${x}% ${y}%`,
    backgroundSize: `${columns * 100}% ${rows * 100}%`,
  };

  return (
    <article
      className={`${styles.spell} ${isActive ? styles.active : ""}`}
      onMouseEnter={() => {
        setIsActive(true);
        onSequenceChange?.(seals);
      }}
      onMouseLeave={() => {
        setIsActive(false);
        setFrameIndex(0);
        onSequenceChange?.(null);
      }}
    >
      <div
        aria-label={`${name}: анимация спела`}
        className={styles.slotButton}
        role="img"
      >
        <span className={styles.slotFrame}>
          <span className={styles.sprite} style={spriteStyle} />
        </span>
      </div>

      {showDetails && (
        <div className={styles.card} id={detailsId}>
          <h2>{name}</h2>
          <p>{description}</p>
        </div>
      )}
    </article>
  );
}

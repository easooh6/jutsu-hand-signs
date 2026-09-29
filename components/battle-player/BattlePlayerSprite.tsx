"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import {
  BATTLE_PLAYER_ANIMATION_DURATION_MS,
  BATTLE_PLAYER_COLUMNS,
  BATTLE_PLAYER_ROWS,
  BATTLE_PLAYER_ROWS_COUNT,
} from "./data";
import type { BattlePlayerAnimation } from "./types";
import styles from "./BattlePlayerSprite.module.css";

type BattlePlayerStyle = CSSProperties & {
  "--battle-player-height": string;
  "--battle-player-image": string;
  "--battle-player-width": string;
  "--battle-player-x": string;
  "--battle-player-y": string;
};

type FrameSize = { height: number; width: number };

export type BattlePlayerSpriteProps = {
  alt: string;
  animation?: BattlePlayerAnimation;
  className?: string;
  onAnimationComplete?: () => void;
  /** Change this value to replay the same animation. */
  playbackKey?: string | number;
  scale?: number;
  spriteSrc: string;
};

export function BattlePlayerSprite({
  alt,
  animation = "idle",
  className,
  onAnimationComplete,
  playbackKey = 0,
  scale = 1,
  spriteSrc,
}: BattlePlayerSpriteProps) {
  const [frame, setFrame] = useState(0);
  const [frameSize, setFrameSize] = useState<FrameSize | null>(null);
  const onCompleteRef = useRef(onAnimationComplete);

  useEffect(() => {
    onCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  useEffect(() => {
    const image = new window.Image();
    image.onload = () => {
      setFrameSize({
        width: image.naturalWidth / BATTLE_PLAYER_COLUMNS,
        height: image.naturalHeight / BATTLE_PLAYER_ROWS_COUNT,
      });
    };
    image.src = spriteSrc;

    return () => {
      image.onload = null;
    };
  }, [spriteSrc]);

  useEffect(() => {
    let requestId = 0;
    if (animation === "idle") {
      requestId = requestAnimationFrame(() => setFrame(0));
      return () => cancelAnimationFrame(requestId);
    }

    const startedAt = performance.now();
    const frameDuration =
      BATTLE_PLAYER_ANIMATION_DURATION_MS / BATTLE_PLAYER_COLUMNS;

    const update = (now: number) => {
      const elapsed = now - startedAt;
      if (elapsed >= BATTLE_PLAYER_ANIMATION_DURATION_MS) {
        setFrame(BATTLE_PLAYER_COLUMNS - 1);
        onCompleteRef.current?.();
        return;
      }

      setFrame(Math.floor(elapsed / frameDuration));
      requestId = requestAnimationFrame(update);
    };

    requestId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestId);
  }, [animation, playbackKey, spriteSrc]);

  if (!frameSize) return null;

  const row = BATTLE_PLAYER_ROWS[animation];
  const style: BattlePlayerStyle = {
    "--battle-player-height": `${frameSize.height * scale}px`,
    "--battle-player-image": `url("${spriteSrc}")`,
    "--battle-player-width": `${frameSize.width * scale}px`,
    "--battle-player-x": `${frame / (BATTLE_PLAYER_COLUMNS - 1) * 100}%`,
    "--battle-player-y": `${row / (BATTLE_PLAYER_ROWS_COUNT - 1) * 100}%`,
  };

  return (
    <span
      aria-label={alt}
      className={[styles.sprite, className].filter(Boolean).join(" ")}
      role="img"
      style={style}
    />
  );
}

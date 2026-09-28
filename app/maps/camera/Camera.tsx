"use client";

import type { CSSProperties, ReactNode } from "react";
import type { GridPosition } from "../actors";
import styles from "./Camera.module.css";

type CameraProps = {
  children: ReactNode;
  focus: GridPosition;
  overhead?: ReactNode;
  overlay?: ReactNode;
  transitionDuration?: number;
  zoom?: number;
};

const PLAYER_WIDTH = 80;
const PLAYER_HEIGHT = 110;

export function Camera({
  children,
  focus,
  overhead,
  overlay,
  transitionDuration = 480,
  zoom = 2,
}: CameraProps) {
  const safeZoom = Math.max(zoom, 0.1);
  const worldStyle: CSSProperties = {
    transform: `translate(${-focus.x * safeZoom}px, ${-focus.y * safeZoom}px) scale(${safeZoom})`,
    transitionDuration: `${transitionDuration}ms`,
  };
  const subjectStyle: CSSProperties = {
    width: PLAYER_WIDTH * safeZoom,
    height: PLAYER_HEIGHT * safeZoom,
  };
  const subjectContentStyle: CSSProperties = {
    transform: `scale(${safeZoom})`,
  };

  return (
    <div className={styles.camera}>
      <div className={styles.world} style={worldStyle}>
        {children}
      </div>
      {overlay && (
        <div className={styles.subject} style={subjectStyle}>
          <div className={styles.subjectContent} style={subjectContentStyle}>
            {overlay}
          </div>
        </div>
      )}
      {overhead && (
        <div className={styles.overheadWorld} style={worldStyle}>
          {overhead}
        </div>
      )}
      <div className={styles.vision} aria-hidden="true" />
    </div>
  );
}

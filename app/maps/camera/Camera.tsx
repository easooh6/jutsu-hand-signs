"use client";

import type { CSSProperties, ReactNode } from "react";
import type { GridPosition } from "../actors";
import styles from "./Camera.module.css";

type CameraProps = {
  children: ReactNode;
  focus: GridPosition;
  overhead?: ReactNode;
  transitionDuration?: number;
  zoom?: number;
};

export function Camera({
  children,
  focus,
  overhead,
  transitionDuration = 480,
  zoom = 2,
}: CameraProps) {
  const safeZoom = Math.max(zoom, 0.1);
  const worldStyle: CSSProperties = {
    transform: `translate(${-focus.x * safeZoom}px, ${-focus.y * safeZoom}px) scale(${safeZoom})`,
    transitionDuration: `${transitionDuration}ms`,
  };

  return (
    <div className={styles.camera}>
      <div className={styles.world} style={worldStyle}>
        {children}
      </div>
      {overhead && (
        <div className={styles.overheadWorld} style={worldStyle}>
          {overhead}
        </div>
      )}
      <div className={styles.vision} aria-hidden="true" />
    </div>
  );
}

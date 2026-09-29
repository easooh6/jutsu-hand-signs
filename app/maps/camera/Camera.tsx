"use client";

import { useLayoutEffect, useRef, useState } from "react";
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

export function Camera({
  children,
  focus,
  overhead,
  overlay,
  transitionDuration = 480,
  zoom = 2,
}: CameraProps) {
  const subjectContent = useRef<HTMLDivElement>(null);
  const [subjectHeight, setSubjectHeight] = useState(0);
  const safeZoom = Math.max(zoom, 0.1);
  const effectiveFocus = overlay
    ? {
        x: focus.x,
        y: focus.y - subjectHeight / 2,
      }
    : focus;
  const worldStyle: CSSProperties = {
    transform: `translate(${-effectiveFocus.x * safeZoom}px, ${-effectiveFocus.y * safeZoom}px) scale(${safeZoom})`,
    transitionDuration: `${transitionDuration}ms`,
  };
  const subjectStyle: CSSProperties = {
    transform: `translate(-50%, -50%) scale(${safeZoom})`,
  };

  useLayoutEffect(() => {
    const element = subjectContent.current;
    if (!element) return;

    const updateSize = () => {
      setSubjectHeight(element.offsetHeight);
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    updateSize();
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.camera}>
      <div className={styles.world} style={worldStyle}>
        {children}
      </div>
      {overlay && (
        <div className={styles.subject} style={subjectStyle}>
          <div className={styles.subjectContent} ref={subjectContent}>
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

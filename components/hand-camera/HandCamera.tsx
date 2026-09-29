"use client";

import {
  CameraView,
} from "@zjd/jutsu-hand-signs";
import { useHandTrackingState } from "./HandTrackingProvider";
import styles from "./HandCamera.module.css";

export function HandCamera() {
  const {
    activeSeal,
    error,
    isConfirming,
    isPreparing,
    isReady,
    isRecalibrating,
    landmarks,
    movement,
    recalibrate,
    videoRef,
  } = useHandTrackingState();

  let status = "NOTHING";

  if (error) {
    status = "CAMERA ERROR";
  } else if (activeSeal) {
    status = activeSeal.toUpperCase();
  } else if (landmarks.length === 1) {
    if (isRecalibrating) {
      status = "CALIBRATING";
    } else if (isPreparing) {
      status = "PREPARING";
    } else if (isConfirming) {
      status = "CONFIRM";
    } else {
      status = movement.toUpperCase();
    }
  }

  const hasDetection =
    activeSeal !== null || landmarks.length === 1;

  return (
    <aside className={styles.panel} aria-label="Hand sign camera">
      <div className={styles.viewport}>
        <CameraView landmarks={landmarks} videoRef={videoRef} />
        {!isReady && (
          <div className={styles.loading} role="status">
            {error ? "CAMERA UNAVAILABLE" : "CAMERA LOADING..."}
          </div>
        )}
      </div>

      <button
        className={styles.recalibrateButton}
        disabled={!isReady || isPreparing || isRecalibrating}
        onClick={recalibrate}
        type="button"
      >
        {isRecalibrating ? "CALIBRATING..." : "RECALIBRATE"}
      </button>

      <div
        className={`${styles.status} ${hasDetection ? styles.detected : ""} ${error ? styles.error : ""}`}
        aria-live="polite"
      >
        {status}
      </div>
    </aside>
  );
}

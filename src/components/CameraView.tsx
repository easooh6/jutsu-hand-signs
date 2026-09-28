import { useEffect, useRef } from "react";
import {
  DrawingUtils,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement>;
  landmarks: any[][];
};

export default function CameraView({
  videoRef,
  landmarks,
}: Props) {
  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const drawingUtils =
      new DrawingUtils(ctx);

    for (const hand of landmarks) {
      drawingUtils.drawConnectors(
        hand,
        HandLandmarker.HAND_CONNECTIONS,
        {
          color: "#00ff88",
          lineWidth: 3,
        }
      );

      drawingUtils.drawLandmarks(
        hand,
        {
          color: "#ff0055",
          lineWidth: 1,
          radius: 4,
        }
      );
    }
  }, [landmarks, videoRef]);

  return (
    <div
      style={{
        position: "relative",
        width: "640px",
        maxWidth: "100%",
        aspectRatio: "4 / 3",
        overflow: "hidden",
        borderRadius: "16px",
        background: "#000",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)",
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          transform: "scaleX(-1)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import {
  HandLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

import {
  detectHandPose,
  detectTwoHandPose,
} from "../gestures/gestureDetector";

import {
  tigerSeal,
  dogSeal,
  boarSeal,
  horseSeal
} from "../gestures/narutoSeals";

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [landmarks, setLandmarks] = useState<any[][]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    async function init() {
      try {
        const vision =
          await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
          );

        handLandmarker =
          await HandLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath: "/hand_landmarker.task",
                delegate: "GPU",
              },
              runningMode: "VIDEO",
              numHands: 2,
            }
          );

        stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: 640,
              height: 480,
            },
          });

        if (!videoRef.current) {
          return;
        }

        videoRef.current.srcObject = stream;

        videoRef.current.onloadeddata = () => {
          setIsReady(true);
          predictLoop();
        };
      } catch (err) {
        console.error(err);

        setError(
          "Не удалось запустить камеру или MediaPipe"
        );
      }
    }

    function predictLoop() {
      if (
        !videoRef.current ||
        !handLandmarker
      ) {
        return;
      }

      const results =
        handLandmarker.detectForVideo(
          videoRef.current,
          performance.now()
        );

      setLandmarks(results.landmarks ?? []);

      if (results.landmarks.length > 0) {
        const poses = results.landmarks.map(
          (hand, index) => {
            const handedness =
              results.handedness[index][0]
                .categoryName as "Left" | "Right";

            return detectHandPose(
              hand,
              handedness
            );
          }
        );

        const twoHandPose =
          detectTwoHandPose(poses);

        if (twoHandPose) {
            const isTiger =
                tigerSeal.check(twoHandPose);

            const isDog =
                dogSeal.check(twoHandPose);

            const isOx =
                boarSeal.check(twoHandPose);
            const isHorse =
            horseSeal.check(twoHandPose);

            if (isHorse) {
            console.log("HORSE!");
            }
            if (isTiger) {
                console.log("TIGER!");
            }

            if (isDog) {
                console.log("DOG!");
            }

            if (isOx) {
                console.log("BEAR!");
            }
            }
            
        }
      animationFrameId =
        requestAnimationFrame(predictLoop);
    }

    init();

    return () => {
      cancelAnimationFrame(animationFrameId);

      stream?.getTracks().forEach((track) => {
        track.stop();
      });

      handLandmarker?.close();
    };
  }, []);

  return {
    videoRef,
    landmarks,
    isReady,
    error,
  };
}
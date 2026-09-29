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
  horseSeal,
} from "../gestures/narutoSeals";

import {
  createMovementController,
  detectMovement,
  type HandMovement,
} from "../gestures/handController";

import {
  createConfirmController,
  detectConfirm,
} from "../gestures/confirmController";

export type SealName =
  | "tiger"
  | "dog"
  | "boar"
  | "horse";

export type HandEvent =
  | {
      type: "confirm";
      id: number;
    }
  | {
      type: "seal";
      seal: SealName;
      id: number;
    };

export type HandEventPayload =
  | {
      type: "confirm";
    }
  | {
      type: "seal";
      seal: SealName;
    };

export function useHandTracking() {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const [landmarks, setLandmarks] =
    useState<any[][]>([]);

  const [isReady, setIsReady] =
    useState(false);

  const [error, setError] =
    useState("");

  const [movement, setMovement] =
    useState<HandMovement>("preparing");

  const [event, setEvent] =
    useState<HandEvent | null>(null);

  const [isPreparing, setIsPreparing] =
    useState(true);

  const eventIdRef = useRef(0);

  /*
   * Last seal that was already emitted.
   */
  const previousSealRef =
    useRef<SealName | null>(null);

  /*
   * Seal that is currently being
   * considered as a candidate.
   */
  const candidateSealRef =
    useRef<SealName | null>(null);

  /*
   * How many consecutive frames
   * the candidate seal was detected.
   */
  const candidateSealFramesRef =
    useRef(0);
  const previousMovementRef =
    useRef<HandMovement | null>(null);
  useEffect(() => {
    let handLandmarker:
      | HandLandmarker
      | null = null;

    let animationFrameId: number;

    let stream:
      | MediaStream
      | null = null;

    const movementController =
      createMovementController();

    const confirmController =
      createConfirmController();
    
    const REQUIRED_SEAL_FRAMES = 5;

    function emitEvent(
      payload: HandEventPayload
    ) {
      eventIdRef.current += 1;

      if (payload.type === "confirm") {
        setEvent({
          type: "confirm",
          id: eventIdRef.current,
        });

        return;
      }

      setEvent({
        type: "seal",
        seal: payload.seal,
        id: eventIdRef.current,
      });
    }

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
                modelAssetPath:
                  "/hand_landmarker.task",
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

        videoRef.current.srcObject =
          stream;

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
function processControl(
  hand: ReturnType<
    typeof detectHandPose
  >
    ) {
      const currentMovement =
        detectMovement(
          hand,
          movementController
        );

      if (
        currentMovement !==
        previousMovementRef.current
      ) {
        console.log(
          "MOVEMENT:",
          currentMovement
        );

        previousMovementRef.current =
          currentMovement;
      }

      setMovement(currentMovement);

      setIsPreparing(
        currentMovement === "preparing"
      );

      const confirmed =
        detectConfirm(
          hand,
          confirmController
        );

      if (confirmed) {
        emitEvent({
          type: "confirm",
        });
      }
    }

    function processSeals(
      twoHandPose: ReturnType<
        typeof detectTwoHandPose
      >
    ) {
      if (!twoHandPose) {
        return;
      }

      let currentSeal:
        | SealName
        | null = null;

      /*
       * Determine which seal is currently
       * detected by the two hands.
       */
      if (tigerSeal.check(twoHandPose)) {
        currentSeal = "tiger";
      } else if (dogSeal.check(twoHandPose)) {
        currentSeal = "dog";
      } else if (boarSeal.check(twoHandPose)) {
        currentSeal = "boar";
      } else if (horseSeal.check(twoHandPose)) {
        currentSeal = "horse";
      }

      /*
       * No seal detected.
       *
       * We reset the candidate because
       * the current pose is not stable.
       */
      if (currentSeal === null) {
        candidateSealRef.current = null;
        candidateSealFramesRef.current = 0;

        return;
      }

      /*
       * Same candidate as previous frame.
       */
      if (
        candidateSealRef.current ===
        currentSeal
      ) {
        candidateSealFramesRef.current++;
      } else {
        /*
         * A different seal appeared.
         *
         * Start counting it from frame 1.
         */
        candidateSealRef.current =
          currentSeal;

        candidateSealFramesRef.current = 1;
      }

      /*
       * Wait until the same seal is detected
       * for several consecutive frames.
       */
      if (
        candidateSealFramesRef.current <
        REQUIRED_SEAL_FRAMES
      ) {
        return;
      }

      /*
       * Emit only if this seal wasn't
       * already emitted.
       */
      if (
        previousSealRef.current !==
        currentSeal
      ) {
        emitEvent({
          type: "seal",
          seal: currentSeal,
        });

        previousSealRef.current =
          currentSeal;
      }
    }

    function resetSealDetection() {
      previousSealRef.current = null;
      candidateSealRef.current = null;
      candidateSealFramesRef.current = 0;
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

      setLandmarks(
        results.landmarks ?? []
      );

      /*
       * No hands
       */
      if (
        results.landmarks.length === 0
      ) {
        setMovement("idle");

        setIsPreparing(false);

        resetSealDetection();

        animationFrameId =
          requestAnimationFrame(
            predictLoop
          );

        return;
      }

      /*
       * Convert MediaPipe landmarks
       * into our HandPose objects.
       */
      const poses =
        results.landmarks.map(
          (hand, index) => {
            const handedness =
              results.handedness[index][0]
                .categoryName as
                | "Left"
                | "Right";

            return detectHandPose(
              hand,
              handedness
            );
          }
        );

      /*
       * One hand:
       *
       * Right hand =
       * movement + confirm
       */
      if (poses.length === 1) {
        const controlHand =
          poses.find(
            (hand) =>
              hand.handedness ===
              "Right"
          );

        if (controlHand) {
          processControl(
            controlHand
          );
        } else {
          /*
           * Only left hand is visible.
           * It is not a control hand.
           */
          setMovement("idle");
        }

        /*
         * Leaving two-hand mode.
         *
         * Reset seal detection completely.
         */
        resetSealDetection();
      }

      /*
       * Two hands:
       *
       * Naruto seals only.
       */
      if (poses.length === 2) {
        const twoHandPose =
          detectTwoHandPose(poses);

        processSeals(
          twoHandPose
        );

        /*
         * Movement and confirm
         * do not work in seal mode.
         */
        setMovement("idle");

        setIsPreparing(false);
      }

      animationFrameId =
        requestAnimationFrame(
          predictLoop
        );
    }

    init();

    return () => {
      cancelAnimationFrame(
        animationFrameId
      );

      stream?.getTracks().forEach(
        (track) => {
          track.stop();
        }
      );

      handLandmarker?.close();
    };
  }, []);

  return {
    videoRef,
    landmarks,

    isReady,
    error,

    movement,
    event,
    isPreparing,
  };
}
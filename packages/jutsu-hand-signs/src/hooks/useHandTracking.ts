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
  recalibrateMovement,
  type HandMovement,
} from "../gestures/handController";

import {
  createConfirmController,
  detectConfirm,
  isConfirmPose,
  resetConfirmController,
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

export type UseHandTrackingOptions = {
  modelAssetPath?: string;
  wasmPath?: string;
};

const DEFAULT_MODEL_ASSET_PATH = "/hand_landmarker.task";
const DEFAULT_WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

export function useHandTracking({
  modelAssetPath = DEFAULT_MODEL_ASSET_PATH,
  wasmPath = DEFAULT_WASM_PATH,
}: UseHandTrackingOptions = {}) {
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

  const [activeSeal, setActiveSeal] =
    useState<SealName | null>(null);

  const [isConfirming, setIsConfirming] =
    useState(false);

  const [isPreparing, setIsPreparing] =
    useState(true);

  const [isRecalibrating, setIsRecalibrating] =
  useState(false);
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
  const recalibrateRequestedRef =
    useRef(false);
  
  function recalibrate() {
    recalibrateRequestedRef.current = true;
    setIsRecalibrating(true);
    setMovement("preparing");
  }
  useEffect(() => {
    let disposed = false;
    let handLandmarker:
      | HandLandmarker
      | null = null;

    let animationFrameId: number | null = null;

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
            wasmPath
          );

        handLandmarker =
          await HandLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath,
                delegate: "GPU",
              },

              runningMode: "VIDEO",

              numHands: 2,
            }
          );

        if (disposed) {
          handLandmarker.close();
          handLandmarker = null;
          return;
        }

        const cameraStream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: 640,
              height: 480,
            },
          });

        if (disposed) {
          cameraStream.getTracks().forEach((track) => track.stop());
          return;
        }

        stream = cameraStream;

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
        if (disposed) return;

        console.error(err);

        setError(
          "Не удалось запустить камеру или MediaPipe"
        );
      }
    }
function processControl(
  hand: ReturnType<typeof detectHandPose>
  ) {
    if (recalibrateRequestedRef.current) {
      setIsRecalibrating(true);

      const completed =
        recalibrateMovement(
          movementController,
          hand
        );

      setMovement("preparing");

      if (completed) {
        recalibrateRequestedRef.current = false;
        setIsRecalibrating(false);

        console.log("Movement recalibrated");
      }

      return;
    }

    const currentMovement =
      detectMovement(
        hand,
        movementController
      );

    setMovement(currentMovement);

    setIsPreparing(
      currentMovement === "preparing"
    );

    const confirmed =
      detectConfirm(
        hand,
        confirmController
      );

    setIsConfirming(isConfirmPose(hand));

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
        setActiveSeal(null);
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

      setActiveSeal(currentSeal);

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
        setActiveSeal(null);
        setIsConfirming(false);
        setMovement("idle");

        setIsPreparing(false);

        resetSealDetection();
        resetConfirmController(confirmController);

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
        setActiveSeal(null);
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
          setIsConfirming(false);
          resetConfirmController(confirmController);
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
        setIsConfirming(false);
        resetConfirmController(confirmController);
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
      disposed = true;

      if (animationFrameId !== null) {
        cancelAnimationFrame(
          animationFrameId
        );
      }

      stream?.getTracks().forEach(
        (track) => {
          track.stop();
        }
      );

      handLandmarker?.close();
    };
  }, [modelAssetPath, wasmPath]);

  return {
    videoRef,
    landmarks,
    isReady,
    error,
    movement,
    event,
    activeSeal,
    isConfirming,
    isPreparing,
    isRecalibrating,
    recalibrate,
  };
}

import { useEffect, useRef, useState } from "react";

import { useHandTracking } from "../hooks/useHandTracking";

import {
  createTutorialState,
  getExpectedSeal,
  processTutorialStep,
  type TutorialStep,
} from "./tutorialController";

import "./tutorial.css";

type SealInfo = {
  name: string;
  image: string;
};

const SEAL_INFO: Record<string, SealInfo> = {
  tiger: {
    name: "Tiger",
    image: "/tutorial/tiger.png",
  },

  dog: {
    name: "Dog",
    image: "/tutorial/dog.png",
  },

  boar: {
    name: "Boar",
    image: "/tutorial/boar.png",
  },

  horse: {
    name: "Horse",
    image: "/tutorial/horse.png",
  },
};

export function TutorialPage() {
  const {
    videoRef,
    movement,
    event,
    isRecalibrating,
    recalibrate,
  } = useHandTracking();

  /*
   * Internal tutorial state.
   */

  const tutorialStateRef = useRef(
    createTutorialState()
  );

  /*
   * Current tutorial step.
   */

  const [step, setStep] =
    useState<TutorialStep>("calibration");

  /*
   * Current seal.
   */

  const [sealIndex, setSealIndex] =
    useState(0);

  /*
   * Calibration state.
   *
   * calibrationStarted:
   * user pressed Start calibration.
   *
   * calibrationWasActive:
   * recalibration actually started.
   *
   * We need both because otherwise
   * the tutorial could immediately think
   * calibration is finished before
   * recalibrate() has started.
   */

  const [
    calibrationStarted,
    setCalibrationStarted,
  ] = useState(false);

  const calibrationWasActiveRef =
    useRef(false);

  /*
   * Success message.
   */

  const [
    showSuccess,
    setShowSuccess,
  ] = useState(false);

  const [
    successText,
    setSuccessText,
  ] = useState("");

  const successTimeoutRef =
    useRef<number | null>(null);

  /*
   * Start calibration.
   */

  function handleCalibration() {
    setCalibrationStarted(true);

    calibrationWasActiveRef.current =
      false;

    recalibrate();
  }

  /*
   * Show temporary success message.
   */

  function showCorrect(message: string) {
    setSuccessText(message);

    setShowSuccess(true);

    if (
      successTimeoutRef.current !== null
    ) {
      window.clearTimeout(
        successTimeoutRef.current
      );
    }

    successTimeoutRef.current =
      window.setTimeout(() => {
        setShowSuccess(false);
      }, 1000);
  }

  /*
   * Calibration.
   *
   * IMPORTANT:
   *
   * We do NOT use movement === "idle"
   * here.
   *
   * The calibration controller itself
   * tells us when calibration is running
   * and when it has finished.
   */

  useEffect(() => {
    /*
     * Nothing to do until the user
     * presses Start calibration.
     */

    if (!calibrationStarted) {
      return;
    }

    /*
     * Calibration has actually started.
     */

    if (isRecalibrating) {
      calibrationWasActiveRef.current =
        true;

      return;
    }

    /*
     * We only finish calibration if
     * it was actually running before.
     *
     * This prevents the tutorial from
     * immediately jumping to Move left.
     */

    if (
      !calibrationWasActiveRef.current
    ) {
      return;
    }

    /*
     * Calibration is now finished.
     */

    calibrationWasActiveRef.current =
      false;

    tutorialStateRef.current.step =
      "left";

    tutorialStateRef.current.movementFrames =
      0;

    setStep("left");

    showCorrect(
      "Calibration complete!"
    );
  }, [
    calibrationStarted,
    isRecalibrating,
  ]);

  /*
   * Process movement and seals.
   *
   * We check every 50ms because
   * movement can stay the same
   * for several frames.
   */

  useEffect(() => {
    if (showSuccess) {
      return;
    }

    const interval =
      window.setInterval(() => {
        const state =
          tutorialStateRef.current;

        /*
         * Calibration is handled
         * separately above.
         */

        if (
          state.step === "calibration"
        ) {
          return;
        }

        /*
         * Tutorial completed.
         */

        if (
          state.step === "completed"
        ) {
          return;
        }

        /*
         * Process current movement
         * and seal event.
         */

        const result =
          processTutorialStep(
            state,
            movement,
            event
          );

        /*
         * Update React state.

         * sealIndex is especially important
         * because all seals share the same
         * "seals" step.
         */

        setStep(result.step);

        setSealIndex(
          result.sealIndex
        );

        /*
         * Movement completed.
         */

        if (
          result.movementCompleted
        ) {
          showCorrect("Correct!");
        }

        /*
         * Correct seal completed.
         */

        if (
          result.sealCompleted
        ) {
          /*
           * Last seal.
           */

          if (
            result.tutorialCompleted
          ) {
            showCorrect(
              "Tutorial completed!"
            );
          } else {
            /*
             * Move to next seal.
             */

            showCorrect("Correct!");
          }
        }
      }, 50);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    movement,
    event,
    showSuccess,
  ]);

  /*
   * Cleanup success timeout.
   */

  useEffect(() => {
    return () => {
      if (
        successTimeoutRef.current !== null
      ) {
        window.clearTimeout(
          successTimeoutRef.current
        );
      }
    };
  }, []);

  /*
   * Current expected seal.
   */

  const expectedSeal =
    getExpectedSeal(
      tutorialStateRef.current
    );

  const currentSealInfo =
    expectedSeal
      ? SEAL_INFO[expectedSeal]
      : null;

  return (
    <div className="tutorial-page">

      {/* CAMERA */}

      <div className="tutorial-camera">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />
      </div>

      {/* CONTENT */}

      <div className="tutorial-content">

        <h1>Tutorial</h1>

        {/* SUCCESS */}

        {showSuccess && (
          <div className="tutorial-success">
            <h2>
              ✓ {successText}
            </h2>
          </div>
        )}

        {/* CALIBRATION */}

        {!showSuccess &&
          step === "calibration" && (
            <>
              <h2>Calibration</h2>

              {!calibrationStarted && (
                <>
                  <p>
                    Place your right hand
                    in the center.
                  </p>

                  <p>
                    Keep your hand still
                    and press the button
                    below.
                  </p>

                  <button
                    onClick={
                      handleCalibration
                    }
                  >
                    Start calibration
                  </button>
                </>
              )}

              {calibrationStarted &&
                isRecalibrating && (
                  <>
                    <p>
                      Keep your right hand
                      in the center.
                    </p>

                    <p>
                      Stay still...
                    </p>

                    <p>
                      Calibrating...
                    </p>
                  </>
                )}
            </>
          )}

        {/* LEFT */}

        {!showSuccess &&
          step === "left" && (
            <>
              <h2>Move left</h2>

              <p>
                Move your right hand
                to the left.
              </p>

              <p>
                Detected: {movement}
              </p>
            </>
          )}

        {/* RIGHT */}

        {!showSuccess &&
          step === "right" && (
            <>
              <h2>Move right</h2>

              <p>
                Move your right hand
                to the right.
              </p>

              <p>
                Detected: {movement}
              </p>
            </>
          )}

        {/* UP */}

        {!showSuccess &&
          step === "up" && (
            <>
              <h2>Move up</h2>

              <p>
                Move your right hand up.
              </p>

              <p>
                Detected: {movement}
              </p>
            </>
          )}

        {/* DOWN */}

        {!showSuccess &&
          step === "down" && (
            <>
              <h2>Move down</h2>

              <p>
                Move your right hand down.
              </p>

              <p>
                Detected: {movement}
              </p>
            </>
          )}

        {/* SEALS */}

        {!showSuccess &&
          step === "seals" &&
          currentSealInfo && (
            <>
              <h2>
                {currentSealInfo.name} seal
              </h2>

              <p>
                Make the seal shown below.
              </p>

              <img
                src={
                  currentSealInfo.image
                }
                alt={
                  `${currentSealInfo.name} seal`
                }
                className="tutorial-seal-image"
              />

              <p>
                Show the{" "}
                {currentSealInfo.name}{" "}
                seal with both hands.
              </p>

              {event?.type === "seal" && (
                <p>
                  Detected:{" "}
                  {event.seal}
                </p>
              )}

              <p>
                Seal {sealIndex + 1} / 4
              </p>
            </>
          )}

        {/* COMPLETED */}

        {!showSuccess &&
          step === "completed" && (
            <>
              <h2>
                Tutorial completed!
              </h2>

              <p>
                You are ready to play.
              </p>
            </>
          )}

      </div>
    </div>
  );
}
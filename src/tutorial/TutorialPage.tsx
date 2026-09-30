import { useEffect, useRef, useState } from "react";

import { useHandTracking } from "../hooks/useHandTracking";

import {
  getExpectedSeal,
  processTutorialStep,
  type TutorialState,
} from "./tutorialController";

import {
  detectAttemptedSeal,
  getSealAdvice,
} from "../advice/adviceController";

import {
  createAdviceStabilizer,
  updateAdviceStabilizer,
} from "../advice/adviceStabilizer";

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
    hands,
    isReady,
    error,
    isRecalibrating,
    recalibrate,
  } = useHandTracking();

  /*
   * Tutorial controller state.
   */

  const tutorialStateRef = useRef<TutorialState>({
    step: "calibration",
    movementFrames: 0,
    lastEventId: null,
    sealIndex: 0,
  });

  /*
   * Current tutorial step.
   */

  const [step, setStep] =
    useState<TutorialState["step"]>("calibration");

  /*
   * Current seal.
   */

  const [sealIndex, setSealIndex] =
    useState(0);

  /*
   * Calibration state.
   */

  const [calibrationStarted, setCalibrationStarted] =
    useState(false);

  const calibrationWasActiveRef =
    useRef(false);

  /*
   * Success message.
   */

  const [showSuccess, setShowSuccess] =
    useState(false);

  const [successText, setSuccessText] =
    useState("");

  const successTimeoutRef =
    useRef<number | null>(null);

  /*
   * Advice.
   */

  const [adviceMessage, setAdviceMessage] =
    useState<string | null>(null);

  const adviceStabilizerRef =
    useRef(
      createAdviceStabilizer()
    );

  /*
   * Debug information.
   *
   * Kept internally so the recognition
   * logic can still be inspected while
   * developing, but it is not displayed
   * in the main tutorial window.
   */

  const [attemptedSeal, setAttemptedSeal] =
    useState<string | null>(null);

  const [attemptedScore, setAttemptedScore] =
    useState<number | null>(null);

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
   * We wait for:
   *
   * false → true → false
   *
   * before considering calibration
   * complete.
   */

  useEffect(() => {
    if (!calibrationStarted) {
      return;
    }

    if (isRecalibrating) {
      calibrationWasActiveRef.current =
        true;

      return;
    }

    if (
      !calibrationWasActiveRef.current
    ) {
      return;
    }

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
   * Tutorial progression.
   *
   * `hands` is included because
   * movement can stay the same for
   * multiple MediaPipe frames.
   */

  useEffect(() => {
    if (
      step === "calibration" ||
      step === "completed"
    ) {
      return;
    }

    if (showSuccess) {
      return;
    }

    const state =
      tutorialStateRef.current;

    /*
     * Save the state before the
     * controller processes this frame.
     *
     * This allows us to detect:
     *
     * left → right
     *
     * or:
     *
     * seal 1 → seal 2
     */

    const previousStep =
      state.step;

    const previousSealIndex =
      state.sealIndex;

    const result =
      processTutorialStep(
        state,
        movement,
        event
      );

    /*
     * Movement completed.
     */

    if (
      result.step !== previousStep &&
      previousStep !== "seals"
    ) {
      setStep(result.step);

      if (
        result.step === "completed"
      ) {
        showCorrect(
          "Tutorial completed!"
        );
      } else {
        showCorrect("Correct!");
      }

      return;
    }

    /*
     * Seal completed.
     *
     * All seals use the same "seals"
     * step, so we detect completion
     * through sealIndex changing.
     */

    if (
      result.step === "seals" &&
      result.sealIndex !==
        previousSealIndex
    ) {
      setStep(result.step);

      setSealIndex(
        result.sealIndex
      );

      if (
        result.tutorialCompleted
      ) {
        showCorrect(
          "Tutorial completed!"
        );
      } else {
        showCorrect("Correct!");
      }

      return;
    }

    /*
     * Tutorial completed without
     * another intermediate step.
     */

    if (
      result.tutorialCompleted
    ) {
      setStep("completed");

      showCorrect(
        "Tutorial completed!"
      );

      return;
    }

    /*
     * Keep normal state synchronized.
     */

    if (
      result.step !== step
    ) {
      setStep(result.step);
    }

    if (
      result.step === "seals"
    ) {
      setSealIndex(
        result.sealIndex
      );
    }
  }, [
    movement,
    event,
    hands,
    step,
    showSuccess,
  ]);

  /*
   * Advice.
   *
   * This runs only during the seal
   * part of the tutorial.
   */

  useEffect(() => {
    if (step !== "seals") {
      setAttemptedSeal(null);
      setAttemptedScore(null);
      setAdviceMessage(null);

      adviceStabilizerRef.current =
        createAdviceStabilizer();

      return;
    }

    /*
     * Do not replace the success
     * animation with advice.
     */

    if (showSuccess) {
      return;
    }

    /*
     * Detect what seal the user is
     * currently trying to make.
     */

    const attempted =
      detectAttemptedSeal(hands);

    if (!attempted) {
      setAttemptedSeal(null);
      setAttemptedScore(null);
      setAdviceMessage(null);

      adviceStabilizerRef.current =
        createAdviceStabilizer();

      return;
    }

    setAttemptedSeal(
      attempted.seal
    );

    setAttemptedScore(
      attempted.score
    );

    /*
     * IMPORTANT:
     *
     * The tutorial remains strict.
     *
     * We give advice for the seal
     * that the tutorial currently
     * expects, not for whatever seal
     * the user accidentally made.
     */

    const expectedSeal =
      getExpectedSeal(
        tutorialStateRef.current
      );

    if (!expectedSeal) {
      return;
    }

    const advice =
      getSealAdvice(
        expectedSeal,
        hands
      );

    const stableAdvice =
      updateAdviceStabilizer(
        adviceStabilizerRef.current,
        advice
      );

    if (stableAdvice) {
      setAdviceMessage(
        stableAdvice.message
      );
    }
  }, [
    hands,
    step,
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

  /*
   * Keep debug values available
   * for development without displaying
   * them in the main UI.
   */

  void attemptedSeal;
  void attemptedScore;

  return (
    <div className="tutorial-page">

      {/* ================================= */}
      {/* CAMERA                            */}
      {/* ================================= */}

      <div className="tutorial-camera">

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />

        {!isReady && !error && (
          <div className="tutorial-camera-message">
            Starting camera...
          </div>
        )}

        {error && (
          <div className="tutorial-camera-error">
            {error}
          </div>
        )}

        {isRecalibrating && (
          <div className="tutorial-camera-overlay">
            Keep your hand still...
          </div>
        )}

      </div>

      {/* ================================= */}
      {/* CONTENT                           */}
      {/* ================================= */}

      <div className="tutorial-content">

        <h1>
          Tutorial
        </h1>

        {/* ================================= */}
        {/* SUCCESS                            */}
        {/* ================================= */}

        {showSuccess && (
          <div className="tutorial-success">
            <h2>
              ✓ {successText}
            </h2>
          </div>
        )}

        {/* ================================= */}
        {/* CALIBRATION                        */}
        {/* ================================= */}

        {!showSuccess &&
          step === "calibration" && (
            <>
              <h2>
                Calibration
              </h2>

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
                    type="button"
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

        {/* ================================= */}
        {/* LEFT                              */}
        {/* ================================= */}

        {!showSuccess &&
          step === "left" && (
            <>
              <h2>
                Move left
              </h2>

              <p>
                Move your right hand
                to the left.
              </p>

              <p>
                Detected: {movement}
              </p>
            </>
          )}

        {/* ================================= */}
        {/* RIGHT                             */}
        {/* ================================= */}

        {!showSuccess &&
          step === "right" && (
            <>
              <h2>
                Move right
              </h2>

              <p>
                Move your right hand
                to the right.
              </p>

              <p>
                Detected: {movement}
              </p>
            </>
          )}

        {/* ================================= */}
        {/* UP                                */}
        {/* ================================= */}

        {!showSuccess &&
          step === "up" && (
            <>
              <h2>
                Move up
              </h2>

              <p>
                Move your right hand up.
              </p>

              <p>
                Detected: {movement}
              </p>
            </>
          )}

        {/* ================================= */}
        {/* DOWN                              */}
        {/* ================================= */}

        {!showSuccess &&
          step === "down" && (
            <>
              <h2>
                Move down
              </h2>

              <p>
                Move your right hand down.
              </p>

              <p>
                Detected: {movement}
              </p>
            </>
          )}

        {/* ================================= */}
        {/* SEALS                              */}
        {/* ================================= */}

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

              {/* Advice */}

              {adviceMessage && (
                <p className="tutorial-advice">
                  {adviceMessage}
                </p>
              )}

              <p>
                Seal {sealIndex + 1} / 4
              </p>
            </>
          )}

        {/* ================================= */}
        {/* COMPLETED                          */}
        {/* ================================= */}

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
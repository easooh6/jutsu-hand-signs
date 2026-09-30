
import {
  useEffect,
  useRef,
  useState,
} from "react";

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

const SEAL_IMAGES = {
  tiger: "/tutorial/tiger.png",
  dog: "/tutorial/dog.png",
  boar: "/tutorial/boar.png",
  horse: "/tutorial/horse.png",
};

const SEAL_NAMES = {
  tiger: "Tiger",
  dog: "Dog",
  boar: "Boar",
  horse: "Horse",
};

export default function TutorialPage() {
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

  const [step, setStep] =
    useState<TutorialState["step"]>("calibration");

  const [sealIndex, setSealIndex] =
    useState(0);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [calibrationStarted, setCalibrationStarted] =
    useState(false);

  const [calibrationCompleted, setCalibrationCompleted] =
    useState(false);

  /*
   * Used to detect the real
   * recalibration cycle:
   *
   * false → true → false
   */
  const calibrationWasActiveRef =
    useRef(false);

  /*
   * Tutorial controller state.
   */
  const tutorialStateRef =
    useRef<TutorialState>({
      step: "calibration",
      movementFrames: 0,
      lastEventId: null,
      sealIndex: 0,
    });

  /*
   * Advice stabilizer.
   */
  const adviceStabilizerRef =
    useRef(
      createAdviceStabilizer()
    );

  /*
   * Debug information.
   */
  const [attemptedSeal, setAttemptedSeal] =
    useState<string | null>(null);

  const [attemptedScore, setAttemptedScore] =
    useState<number | null>(null);

  const [adviceMessage, setAdviceMessage] =
    useState<string | null>(null);

  /*
   * Start calibration.
   */
  function handleStartCalibration() {
    setCalibrationStarted(true);
    setCalibrationCompleted(false);

    calibrationWasActiveRef.current =
      false;

    recalibrate();
  }

  /*
   * Calibration state.
   *
   * We wait for:
   *
   * false → true → false
   *
   * before considering calibration complete.
   */
  useEffect(() => {
    if (!calibrationStarted) {
      return;
    }

    /*
     * Recalibration has actually started.
     */
    if (isRecalibrating) {
      calibrationWasActiveRef.current =
        true;

      return;
    }

    /*
     * Recalibration has finished.
     */
    if (
      calibrationWasActiveRef.current &&
      !isRecalibrating
    ) {
      calibrationWasActiveRef.current =
        false;

      setCalibrationCompleted(true);

      tutorialStateRef.current.step =
        "left";

      tutorialStateRef.current.movementFrames =
        0;

      setStep("left");
    }
  }, [
    isRecalibrating,
    calibrationStarted,
  ]);

  /*
   * Tutorial progression.
   *
   * IMPORTANT:
   *
   * `movement` can stay the same value
   * for many camera frames.
   *
   * Therefore we also depend on `hands`.
   *
   * Every new `hands` array represents
   * a new MediaPipe frame, allowing
   * processTutorialStep() to count:
   *
   * left → frame 1
   * left → frame 2
   * left → frame 3
   * left → frame 4
   * left → frame 5
   */
  useEffect(() => {
    if (
      step === "calibration" ||
      step === "completed"
    ) {
      return;
    }

    const state =
      tutorialStateRef.current;

    const result = processTutorialStep(
      state,
      movement,
      event
    );

    /*
     * Controller already changed
     * the tutorial step.
     */
    if (result.step !== step) {
      setStep(result.step);
    }

    /*
     * Keep seal index synchronized.
     */
    if (
      result.step === "seals"
    ) {
      setSealIndex(
        result.sealIndex
      );
    }

    /*
     * Tutorial finished.
     */
    if (result.tutorialCompleted) {
      setStep("completed");

      setSuccessMessage(
        "Tutorial completed!"
      );
    }
  }, [
    movement,
    event,
    step,
    hands,
  ]);

  /*
   * Keep sealIndex synchronized with
   * the tutorial controller.
   */
  useEffect(() => {
    if (step !== "seals") {
      return;
    }

    setSealIndex(
      tutorialStateRef.current.sealIndex
    );
  }, [step]);

  /*
   * Seal advice / debug.
   *
   * The tutorial sequence remains strict.
   *
   * detectAttemptedSeal() is only used
   * to understand what the user is
   * currently trying to make.
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

    const attempted =
      detectAttemptedSeal(hands);

    /*
     * No recognizable seal attempt.
     */
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
     * Tutorial still has a strict
     * expected seal.
     *
     * Advice is therefore generated
     * for the expected seal, not
     * necessarily the attempted one.
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
  ]);

  /*
   * Current expected seal.
   */
  const expectedSeal =
    step === "seals"
      ? getExpectedSeal(
          tutorialStateRef.current
        )
      : null;

  /*
   * Current expected seal image.
   */
  const expectedSealImage =
    expectedSeal
      ? SEAL_IMAGES[expectedSeal]
      : null;

  /*
   * Current expected seal name.
   */
  const expectedSealName =
    expectedSeal
      ? SEAL_NAMES[expectedSeal]
      : null;

  /*
   * Keep React state used for
   * tutorial progression.
   *
   * The actual controller remains
   * the source of truth.
   */
  void sealIndex;

  return (
    <div className="tutorial-page">

      {/* ================================= */}
      {/* HEADER                            */}
      {/* ================================= */}

      <header className="tutorial-header">
        <h1>
          JUTSU TRAINING
        </h1>

        <p>
          Learn to control your chakra
        </p>
      </header>

      {/* ================================= */}
      {/* MAIN                              */}
      {/* ================================= */}

      <main className="tutorial-content">

        {/* ================================= */}
        {/* CAMERA                            */}
        {/* ================================= */}

        <section className="tutorial-camera-section">

          <div className="tutorial-camera-wrapper">

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="tutorial-camera"
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
          {/* DEBUG                              */}
          {/* ================================= */}

          {step === "seals" && (
            <div className="advice-debug">

              <div className="advice-debug-title">
                SEAL DEBUG
              </div>

              <div>
                Expected:{" "}
                <strong>
                  {expectedSealName ??
                    "NONE"}
                </strong>
              </div>

              <div>
                Attempt:{" "}
                <strong>
                  {attemptedSeal
                    ? attemptedSeal.toUpperCase()
                    : "NONE"}
                </strong>
              </div>

              <div>
                Score:{" "}
                <strong>
                  {attemptedScore !== null
                    ? `${Math.round(
                        attemptedScore * 100
                      )}%`
                    : "--"}
                </strong>
              </div>

              <div>
                Advice:{" "}
                <strong>
                  {adviceMessage ??
                    "Waiting..."}
                </strong>
              </div>

            </div>
          )}

        </section>

        {/* ================================= */}
        {/* CALIBRATION                        */}
        {/* ================================= */}

        {step === "calibration" && (
          <section className="tutorial-step">

            <h2>
              CALIBRATION
            </h2>

            <p>
              Place your right hand
              in the center.
            </p>

            {!calibrationStarted && (
              <button
                type="button"
                onClick={
                  handleStartCalibration
                }
                className="tutorial-button"
              >
                Start calibration
              </button>
            )}

            {calibrationStarted &&
              isRecalibrating && (
                <p>
                  Keep your hand still...
                </p>
              )}

            {calibrationCompleted && (
              <p>
                Calibration complete!
              </p>
            )}

          </section>
        )}

        {/* ================================= */}
        {/* MOVEMENT                           */}
        {/* ================================= */}

        {step === "left" && (
          <section className="tutorial-step">

            <h2>
              MOVE LEFT
            </h2>

            <p>
              Move your right hand
              to the left.
            </p>

            <p>
              Detected movement:{" "}
              <strong>
                {movement}
              </strong>
            </p>

          </section>
        )}

        {step === "right" && (
          <section className="tutorial-step">

            <h2>
              MOVE RIGHT
            </h2>

            <p>
              Move your right hand
              to the right.
            </p>

            <p>
              Detected movement:{" "}
              <strong>
                {movement}
              </strong>
            </p>

          </section>
        )}

        {step === "up" && (
          <section className="tutorial-step">

            <h2>
              MOVE UP
            </h2>

            <p>
              Move your right hand
              upward.
            </p>

            <p>
              Detected movement:{" "}
              <strong>
                {movement}
              </strong>
            </p>

          </section>
        )}

        {step === "down" && (
          <section className="tutorial-step">

            <h2>
              MOVE DOWN
            </h2>

            <p>
              Move your right hand
              downward.
            </p>

            <p>
              Detected movement:{" "}
              <strong>
                {movement}
              </strong>
            </p>

          </section>
        )}

        {/* ================================= */}
        {/* SEALS                              */}
        {/* ================================= */}

        {step === "seals" &&
          expectedSeal && (
            <section className="tutorial-step tutorial-seal-step">

              <h2>
                FORM THE SEAL
              </h2>

              <p>
                Make the{" "}
                <strong>
                  {expectedSealName}
                </strong>{" "}
                seal.
              </p>

              {expectedSealImage && (
                <img
                  src={expectedSealImage}
                  alt={`${expectedSealName} seal`}
                  className="tutorial-seal-image"
                />
              )}

              {adviceMessage && (
                <p className="tutorial-advice">
                  {adviceMessage}
                </p>
              )}

            </section>
          )}

        {/* ================================= */}
        {/* COMPLETED                          */}
        {/* ================================= */}

        {step === "completed" && (
          <section className="tutorial-step tutorial-completed">

            <h2>
              TRAINING COMPLETE
            </h2>

            <p>
              You have learned
              the basic controls.
            </p>

            {successMessage && (
              <p>
                {successMessage}
              </p>
            )}

          </section>
        )}

      </main>

    </div>
  );
}
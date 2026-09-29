"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import styles from "./ScreenTransition.module.css";

const FADE_DURATION = 500;
const BATTLE_FLASH_DURATION = 260;

type TransitionAction = () => void | Promise<void>;

type ScreenTransitionContextValue = {
  isTransitioning: boolean;
  runBattleTransition: (action: TransitionAction) => Promise<void>;
  runTransition: (action: TransitionAction) => Promise<void>;
};

const ScreenTransitionContext =
  createContext<ScreenTransitionContextValue | null>(null);

function wait(duration: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, duration));
}

function nextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

export function ScreenTransitionProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isInstantDark, setIsInstantDark] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const runningTransition = useRef<Promise<void> | null>(null);

  const startTransition = useCallback((action: TransitionAction, flash: boolean) => {
    if (runningTransition.current) return runningTransition.current;

    const transition = (async () => {
      setIsTransitioning(true);
      if (flash) {
        setIsFlashing(true);
        await wait(BATTLE_FLASH_DURATION);
        setIsFlashing(false);
        setIsInstantDark(true);
        setIsDark(true);
        await nextPaint();
      } else {
        setIsDark(true);
        await wait(FADE_DURATION);
      }

      try {
        await action();
        await nextPaint();
      } finally {
        if (flash) {
          setIsInstantDark(false);
          await nextPaint();
        }
        setIsDark(false);
        setIsFlashing(false);
        await wait(FADE_DURATION);
        setIsInstantDark(false);
        setIsTransitioning(false);
        runningTransition.current = null;
      }
    })();

    runningTransition.current = transition;
    return transition;
  }, []);
  const runTransition = useCallback(
    (action: TransitionAction) => startTransition(action, false),
    [startTransition],
  );
  const runBattleTransition = useCallback(
    (action: TransitionAction) => startTransition(action, true),
    [startTransition],
  );

  const value = useMemo(
    () => ({ isTransitioning, runBattleTransition, runTransition }),
    [isTransitioning, runBattleTransition, runTransition],
  );

  return (
    <ScreenTransitionContext.Provider value={value}>
      {children}
      <div
        aria-hidden="true"
        className={`${styles.overlay} ${isDark ? styles.overlayActive : ""} ${isInstantDark ? styles.overlayInstant : ""} ${isTransitioning ? styles.overlayBlocking : ""}`}
      />
      <div
        aria-hidden="true"
        className={`${styles.flash} ${isFlashing ? styles.flashActive : ""}`}
      />
    </ScreenTransitionContext.Provider>
  );
}

export function useScreenTransition() {
  const context = useContext(ScreenTransitionContext);

  if (!context) {
    throw new Error(
      "useScreenTransition must be used inside ScreenTransitionProvider",
    );
  }

  return context;
}

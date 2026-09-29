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

type TransitionAction = () => void | Promise<void>;

type ScreenTransitionContextValue = {
  isTransitioning: boolean;
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const runningTransition = useRef<Promise<void> | null>(null);

  const runTransition = useCallback((action: TransitionAction) => {
    if (runningTransition.current) return runningTransition.current;

    const transition = (async () => {
      setIsTransitioning(true);
      setIsDark(true);
      await wait(FADE_DURATION);

      try {
        await action();
        await nextPaint();
      } finally {
        setIsDark(false);
        await wait(FADE_DURATION);
        setIsTransitioning(false);
        runningTransition.current = null;
      }
    })();

    runningTransition.current = transition;
    return transition;
  }, []);

  const value = useMemo(
    () => ({ isTransitioning, runTransition }),
    [isTransitioning, runTransition],
  );

  return (
    <ScreenTransitionContext.Provider value={value}>
      {children}
      <div
        aria-hidden="true"
        className={`${styles.overlay} ${isDark ? styles.overlayActive : ""} ${isTransitioning ? styles.overlayBlocking : ""}`}
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

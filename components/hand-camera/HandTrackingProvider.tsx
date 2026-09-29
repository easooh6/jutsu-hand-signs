"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useHandTracking } from "@zjd/jutsu-hand-signs";
import type { HandEvent, HandMovement } from "@zjd/jutsu-hand-signs";
import type { WalkDirection } from "@/components/walk-sprite";

type HandTrackingState = ReturnType<typeof useHandTracking>;

const HandTrackingContext = createContext<HandTrackingState | null>(null);
const HandMovementContext = createContext<HandMovement | null>(null);
const HandEventContext = createContext<HandEvent | null | undefined>(undefined);

export function HandTrackingProvider({ children }: { children: ReactNode }) {
  const tracking = useHandTracking({
    modelAssetPath: "/models/hand_landmarker.task",
  });

  return (
    <HandEventContext.Provider value={tracking.event}>
      <HandMovementContext.Provider value={tracking.movement}>
        <HandTrackingContext.Provider value={tracking}>
          {children}
        </HandTrackingContext.Provider>
      </HandMovementContext.Provider>
    </HandEventContext.Provider>
  );
}

export function useHandTrackingState() {
  const tracking = useContext(HandTrackingContext);

  if (!tracking) {
    throw new Error(
      "useHandTrackingState must be used inside HandTrackingProvider",
    );
  }

  return tracking;
}

export function useHandDirection(): WalkDirection | null {
  const movement = useContext(HandMovementContext);

  if (movement === null) {
    throw new Error(
      "useHandDirection must be used inside HandTrackingProvider",
    );
  }

  if (
    movement === "up" ||
    movement === "down" ||
    movement === "left" ||
    movement === "right"
  ) {
    return movement;
  }

  return null;
}

export function useHandConfirm(
  onConfirm: () => void,
  enabled = true,
): void {
  const event = useContext(HandEventContext);
  const lastEventId = useRef(event?.id ?? 0);
  const onConfirmRef = useRef(onConfirm);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    if (event === undefined) {
      throw new Error(
        "useHandConfirm must be used inside HandTrackingProvider",
      );
    }

    if (!event || event.id === lastEventId.current) return;

    lastEventId.current = event.id;
    if (enabled && event.type === "confirm") {
      onConfirmRef.current();
    }
  }, [enabled, event]);
}

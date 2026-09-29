"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WalkDirection } from "@/components/walk-sprite";
import { canWalk } from "../map";
import type { GameMap } from "../map";
import type {
  ActorController,
  ActorMovementState,
  GridPosition,
} from "./types";

const DIRECTION_OFFSETS: Record<WalkDirection, GridPosition> = {
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
};

type UseActorMovementOptions = {
  controller: ActorController;
  enabled?: boolean;
  initialDirection?: WalkDirection;
  initialPosition: GridPosition;
  isPositionBlocked?: (position: GridPosition) => boolean;
  map: GameMap;
  onStepComplete?: (position: GridPosition) => boolean | void;
  stepDuration: number;
};

export function useActorMovement({
  controller,
  enabled = true,
  initialDirection = "down",
  initialPosition,
  isPositionBlocked,
  map,
  onStepComplete,
  stepDuration,
}: UseActorMovementOptions): ActorMovementState {
  const [movement, setMovement] = useState<ActorMovementState>({
    action: "idle",
    cycle: 0,
    direction: initialDirection,
    moving: false,
    position: initialPosition,
  });
  const position = useRef(initialPosition);
  const requestedDirection = useRef<WalkDirection | null>(null);
  const isMoving = useRef(false);
  const idleFrameTimer = useRef<number | null>(null);
  const stepTimer = useRef<number | null>(null);
  const startStepRef = useRef<(direction: WalkDirection) => void>(() => {});
  const onStepCompleteRef = useRef(onStepComplete);

  useEffect(() => {
    onStepCompleteRef.current = onStepComplete;
  }, [onStepComplete]);

  const startStep = useCallback(
    (direction: WalkDirection) => {
      if (isMoving.current) {
        return;
      }

      const offset = DIRECTION_OFFSETS[direction];
      const nextPosition = {
        x: position.current.x + offset.x,
        y: position.current.y + offset.y,
      };

      if (
        !canWalk(map, nextPosition.x, nextPosition.y) ||
        isPositionBlocked?.(nextPosition)
      ) {
        setMovement((current) => ({
          ...current,
          action: "idle",
          direction,
          moving: false,
        }));
        return;
      }

      isMoving.current = true;
      position.current = nextPosition;
      setMovement((current) => ({
        action: "walk",
        cycle: current.cycle + 1,
        direction,
        moving: true,
        position: nextPosition,
      }));

      idleFrameTimer.current = window.setTimeout(() => {
        setMovement((current) => ({ ...current, action: "idle" }));
      }, stepDuration * 0.5);

      stepTimer.current = window.setTimeout(() => {
        isMoving.current = false;
        setMovement((current) => ({ ...current, moving: false }));
        const shouldContinue =
          onStepCompleteRef.current?.(position.current) !== false;

        if (!shouldContinue) {
          requestedDirection.current = null;
          return;
        }

        controller.onStepComplete?.();

        if (requestedDirection.current) {
          startStepRef.current(requestedDirection.current);
        }
      }, stepDuration);
    },
    [controller, isPositionBlocked, map, stepDuration],
  );

  useEffect(() => {
    startStepRef.current = startStep;
  }, [startStep]);

  useEffect(() => {
    if (!enabled) {
      requestedDirection.current = null;
      return;
    }

    return controller.connect(
      (direction) => {
        requestedDirection.current = direction;

        if (direction) {
          startStepRef.current(direction);
        }
      },
      (direction) => {
        if (isMoving.current) return;
        setMovement((current) => ({ ...current, direction }));
      },
    );
  }, [controller, enabled]);

  useEffect(
    () => () => {
      if (stepTimer.current !== null) {
        window.clearTimeout(stepTimer.current);
      }
      if (idleFrameTimer.current !== null) {
        window.clearTimeout(idleFrameTimer.current);
      }
    },
    [],
  );

  return movement;
}

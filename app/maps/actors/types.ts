import type { WalkAction, WalkDirection } from "@/components/walk-sprite";

export type GridPosition = {
  x: number;
  y: number;
};

export type ActorMovementState = {
  action: WalkAction;
  cycle: number;
  direction: WalkDirection;
  moving: boolean;
  position: GridPosition;
};

type ActorControllerLifecycle = {
  connect: (
    onDirectionChange: (direction: WalkDirection | null) => void,
    onFacingChange?: (direction: WalkDirection) => void,
  ) => () => void;
  onStepComplete?: () => void;
};

export type PlayerActorController = ActorControllerLifecycle & {
  kind: "player";
  setDirection: (direction: WalkDirection | null) => void;
};

export type AIActorController = ActorControllerLifecycle & {
  face: (direction: WalkDirection) => void;
  friendly: boolean;
  kind: "ai";
  setRoute: (route: readonly WalkDirection[]) => void;
  stop: () => void;
};

export type ActorController = PlayerActorController | AIActorController;

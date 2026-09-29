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
  ) => () => void;
  onStepComplete?: () => void;
};

export type PlayerActorController = ActorControllerLifecycle & {
  kind: "player";
};

export type AIActorController = ActorControllerLifecycle & {
  friendly: boolean;
  kind: "ai";
};

export type ActorController = PlayerActorController | AIActorController;

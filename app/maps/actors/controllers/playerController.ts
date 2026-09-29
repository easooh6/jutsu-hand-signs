import type { WalkDirection } from "@/components/walk-sprite";
import type { PlayerActorController } from "../types";

export function createPlayerController(): PlayerActorController {
  let currentDirection: WalkDirection | null = null;
  let directionListener:
    | ((direction: WalkDirection | null) => void)
    | null = null;

  return {
    kind: "player",
    connect(onDirectionChange) {
      directionListener = onDirectionChange;
      onDirectionChange(currentDirection);

      return () => {
        if (directionListener === onDirectionChange) {
          directionListener = null;
        }
      };
    },
    setDirection(direction) {
      if (currentDirection === direction) return;

      currentDirection = direction;
      directionListener?.(direction);
    },
  };
}

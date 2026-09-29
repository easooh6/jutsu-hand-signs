import type { WalkDirection } from "@/components/walk-sprite";
import type { AIActorController } from "../types";

type AIControllerOptions = {
  friendly: boolean;
  loop?: boolean;
  route?: readonly WalkDirection[];
};

export function createAIController({
  friendly,
  loop = false,
  route: initialRoute = [],
}: AIControllerOptions): AIActorController {
  let route = initialRoute;
  let currentIndex = 0;
  let emitDirection: ((direction: WalkDirection | null) => void) | null = null;
  let emitFacing: ((direction: WalkDirection) => void) | null = null;

  function currentDirection(): WalkDirection | null {
    return route[currentIndex] ?? null;
  }

  return {
    face(direction) {
      if (friendly) return;
      emitFacing?.(direction);
    },
    friendly,
    kind: "ai",
    connect(onDirectionChange, onFacingChange) {
      emitDirection = onDirectionChange;
      emitFacing = onFacingChange ?? null;
      queueMicrotask(() => {
        if (!friendly) emitDirection?.(currentDirection());
      });

      return () => {
        emitDirection = null;
        emitFacing = null;
      };
    },
    onStepComplete() {
      if (route.length === 0) {
        emitDirection?.(null);
        return;
      }

      const nextIndex = currentIndex + 1;
      currentIndex = loop ? nextIndex % route.length : nextIndex;
      emitDirection?.(currentDirection());
    },
    setRoute(nextRoute) {
      if (friendly) return;
      route = [...nextRoute];
      currentIndex = 0;
      emitDirection?.(currentDirection());
    },
    stop() {
      route = [];
      currentIndex = 0;
      emitDirection?.(null);
    },
  };
}

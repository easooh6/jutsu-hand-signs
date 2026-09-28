import type { WalkDirection } from "@/components/walk-sprite";
import type { AIActorController } from "../types";

type AIControllerOptions = {
  friendly: boolean;
  loop?: boolean;
  route: readonly WalkDirection[];
};

export function createAIController({
  friendly,
  loop = true,
  route,
}: AIControllerOptions): AIActorController {
  let currentIndex = 0;
  let emitDirection: ((direction: WalkDirection | null) => void) | null = null;

  function currentDirection(): WalkDirection | null {
    return route[currentIndex] ?? null;
  }

  return {
    friendly,
    kind: "ai",
    connect(onDirectionChange) {
      emitDirection = onDirectionChange;
      queueMicrotask(() => emitDirection?.(currentDirection()));

      return () => {
        emitDirection = null;
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
  };
}

import type { WalkDirection } from "@/components/walk-sprite";
import type { PlayerActorController } from "../types";

const KEY_DIRECTIONS: Record<string, WalkDirection> = {
  KeyW: "up",
  KeyA: "left",
  KeyS: "down",
  KeyD: "right",
};

export function createPlayerController(): PlayerActorController {
  return {
    kind: "player",
    connect(onDirectionChange) {
      let pressedDirections: WalkDirection[] = [];

      function press(event: KeyboardEvent) {
        const direction = KEY_DIRECTIONS[event.code];
        if (!direction) {
          return;
        }

        event.preventDefault();

        if (!pressedDirections.includes(direction)) {
          pressedDirections = [...pressedDirections, direction];
        }

        onDirectionChange(direction);
      }

      function release(event: KeyboardEvent) {
        const direction = KEY_DIRECTIONS[event.code];
        if (!direction) {
          return;
        }

        pressedDirections = pressedDirections.filter(
          (pressed) => pressed !== direction,
        );
        onDirectionChange(pressedDirections.at(-1) ?? null);
      }

      function releaseAll() {
        pressedDirections = [];
        onDirectionChange(null);
      }

      window.addEventListener("keydown", press);
      window.addEventListener("keyup", release);
      window.addEventListener("blur", releaseAll);

      return () => {
        window.removeEventListener("keydown", press);
        window.removeEventListener("keyup", release);
        window.removeEventListener("blur", releaseAll);
      };
    },
  };
}

"use client";

import { useEffect } from "react";
import { playOneShot } from "./playOneShot";

const INTERACTIVE_SELECTOR = 'button, a, [role="button"]';
const SILENT_PATHS = ["/maps/editor"];

function isUiAudioDisabled() {
  return SILENT_PATHS.some((path) => window.location.pathname.startsWith(path));
}

function findInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<HTMLElement>(INTERACTIVE_SELECTOR)
    : null;
}

export function UiAudio() {
  useEffect(() => {
    function handlePointerOver(event: PointerEvent) {
      if (isUiAudioDisabled()) return;
      const interactive = findInteractiveTarget(event.target);
      if (!interactive) return;

      if (
        event.relatedTarget instanceof Node &&
        interactive.contains(event.relatedTarget)
      ) {
        return;
      }

      playOneShot("/audio/ui/Cursor2.ogg");
    }

    function handleClick(event: MouseEvent) {
      if (isUiAudioDisabled()) return;
      if (!findInteractiveTarget(event.target)) return;
      playOneShot("/audio/ui/fnh_choice2.ogg");
    }

    document.addEventListener("pointerover", handlePointerOver);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
}

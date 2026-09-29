"use client";

import { useEffect, useRef, useState } from "react";
import { useHandTrackingState } from "@/components/hand-camera";
import type {
  SpellSeal,
  SpellSealSequence,
} from "./types";

const HOLD_DURATION_MS = 500;
const RELEASE_DURATION_MS = 500;
const EMPTY_SEQUENCE: SpellSealSequence = [null, null, null];

type SpellCastHandler = (
  seals: readonly [SpellSeal, SpellSeal, SpellSeal],
) => boolean;

export function useSpellCasting({
  enabled,
  onCast,
}: {
  enabled: boolean;
  onCast: SpellCastHandler;
}) {
  const { activeSeal } = useHandTrackingState();
  const [sequence, setSequence] =
    useState<SpellSealSequence>(EMPTY_SEQUENCE);
  const sequenceRef = useRef<SpellSealSequence>(EMPTY_SEQUENCE);
  const armedRef = useRef(false);
  const onCastRef = useRef(onCast);

  useEffect(() => {
    onCastRef.current = onCast;
  }, [onCast]);

  useEffect(() => {
    if (!enabled) {
      armedRef.current = false;
      return;
    }

    if (activeSeal === null) {
      if (armedRef.current) return;

      const releaseTimer = window.setTimeout(() => {
        armedRef.current = true;
      }, RELEASE_DURATION_MS);

      return () => window.clearTimeout(releaseTimer);
    }

    if (!armedRef.current) return;

    const holdTimer = window.setTimeout(() => {
      armedRef.current = false;

      if (activeSeal === "boar") {
        const [first, second, third] = sequenceRef.current;

        if (
          first !== null &&
          second !== null &&
          third !== null &&
          onCastRef.current([first, second, third])
        ) {
          sequenceRef.current = [null, null, null];
          setSequence(sequenceRef.current);
        }

        return;
      }

      const nextSequence: SpellSealSequence = [
        activeSeal,
        sequenceRef.current[0],
        sequenceRef.current[1],
      ];

      sequenceRef.current = nextSequence;
      setSequence(nextSequence);
    }, HOLD_DURATION_MS);

    return () => window.clearTimeout(holdTimer);
  }, [activeSeal, enabled]);

  return sequence;
}

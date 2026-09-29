"use client";

import { useCallback, useState } from "react";
import { SPELLS } from "./data";
import { Spell } from "./Spell";
import { SpellCastAnimation } from "./SpellCastAnimation";
import { SpellSequence } from "./SpellSequence";
import type { SpellDefinition, SpellSeal } from "./types";
import { useSpellCasting } from "./useSpellCasting";

function hasSameSeals(
  spell: SpellDefinition,
  seals: readonly SpellSeal[],
) {
  return spell.seals.every((seal, index) => seal === seals[index]);
}

export function SpellGuide({ className }: { className?: string }) {
  const [hoverSequence, setHoverSequence] = useState<
    readonly SpellSeal[] | null
  >(null);
  const [cast, setCast] = useState<{
    id: number;
    spell: SpellDefinition;
  } | null>(null);

  const castSequence = useCallback((seals: readonly SpellSeal[]) => {
    const spell = SPELLS.find((candidate) => hasSameSeals(candidate, seals));
    if (!spell) return false;

    setCast({ id: Date.now(), spell });
    return true;
  }, []);

  const completeCast = useCallback(() => {
    setCast(null);
  }, []);

  const capturedSequence = useSpellCasting({
    enabled: hoverSequence === null,
    onCast: castSequence,
  });

  return (
    <>
      <SpellSequence seals={hoverSequence ?? capturedSequence} />

      {cast && (
        <SpellCastAnimation
          key={cast.id}
          onComplete={completeCast}
          spell={cast.spell}
        />
      )}

      <section className={className} aria-label="Spells">
        {SPELLS.map((spell) => (
          <Spell
            key={spell.id}
            {...spell}
            onSequenceChange={setHoverSequence}
          />
        ))}
      </section>
    </>
  );
}

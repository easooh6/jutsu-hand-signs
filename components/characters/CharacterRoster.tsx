"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { playOneShot } from "@/components/audio";
import { useScreenTransition } from "@/components/screen-transition";
import { CharacterFrame } from "./CharacterFrame";
import { CHARACTERS } from "./data";
import type { CharacterDefinition } from "./types";
import { saveCharacterChoice } from "./selection";
import styles from "./CharacterRoster.module.css";

export function CharacterRoster() {
  const router = useRouter();
  const { isTransitioning, runTransition } = useScreenTransition();
  const [hoveredCharacter, setHoveredCharacter] =
    useState<CharacterDefinition | null>(null);

  function selectCharacter(character: CharacterDefinition) {
    if (isTransitioning) return;

    playOneShot("/audio/oldedgar__jared-s-gate-to-hell_03.ogg");

    void runTransition(() => {
      saveCharacterChoice(character.id);
      router.push("/maps/map/entrance");
    });
  }

  return (
    <section className={styles.roster} aria-label="Characters">
      <div className={styles.row}>
        {CHARACTERS.map((character) => (
          <CharacterFrame
            character={character}
            key={character.id}
            onHoverChange={setHoveredCharacter}
            onSelect={selectCharacter}
          />
        ))}
      </div>

      <div className={styles.hoveredName} aria-live="polite">
        {hoveredCharacter?.name ?? ""}
      </div>
    </section>
  );
}

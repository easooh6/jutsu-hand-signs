"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CharacterFrame } from "./CharacterFrame";
import { CHARACTERS } from "./data";
import type { CharacterDefinition } from "./types";
import { saveCharacterChoice } from "./selection";
import styles from "./CharacterRoster.module.css";

export function CharacterRoster() {
  const router = useRouter();
  const [hoveredCharacter, setHoveredCharacter] =
    useState<CharacterDefinition | null>(null);

  function selectCharacter(character: CharacterDefinition) {
    saveCharacterChoice(character.id);
    router.push("/maps/map/entrance");
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

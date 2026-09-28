"use client";

import type { CharacterDefinition } from "./types";
import styles from "./CharacterFrame.module.css";

type CharacterFrameProps = {
  character: CharacterDefinition;
  onHoverChange: (character: CharacterDefinition | null) => void;
  onSelect: (character: CharacterDefinition) => void;
};

export function CharacterFrame({
  character,
  onHoverChange,
  onSelect,
}: CharacterFrameProps) {
  return (
    <button
      aria-label={character.name}
      className={styles.frame}
      onClick={() => onSelect(character)}
      onMouseEnter={() => onHoverChange(character)}
      onMouseLeave={() => onHoverChange(null)}
      type="button"
    >
      <div className={styles.portrait}>
        <img
          alt={character.alt}
          height={360}
          src={character.imageSrc}
          width={182}
        />
      </div>
    </button>
  );
}

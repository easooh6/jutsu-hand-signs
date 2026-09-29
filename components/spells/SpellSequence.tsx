import type { CSSProperties } from "react";
import type { SpellSealSlot } from "./types";
import styles from "./SpellSequence.module.css";

const EMPTY_SEQUENCE = [null, null, null] as const;

type SealStyle = CSSProperties & {
  "--seal-index": number;
};

export function SpellSequence({
  seals,
  compact = false,
}: {
  seals: readonly SpellSealSlot[] | null;
  compact?: boolean;
}) {
  const slots = seals ?? EMPTY_SEQUENCE;

  return (
    <div className={`${styles.sequence} ${compact ? styles.compact : ""}`} aria-label="Spell hand-sign sequence">
      {slots.map((seal, index) => (
        <div
          aria-label={seal ? `${index + 1}: ${seal}` : `${index + 1}: empty`}
          className={`${styles.sphere} ${seal ? `${styles.filled} ${styles[seal]}` : ""}`}
          key={index}
          role="img"
          title={seal ? `${seal}: удерживай печать 0.5 сек; boar — каст` : "Печать 0.5 сек → NOTHING 0.5 сек. Boar — каст."}
          style={{ "--seal-index": index } as SealStyle}
        >
          <span className={styles.energy} />
        </div>
      ))}
    </div>
  );
}

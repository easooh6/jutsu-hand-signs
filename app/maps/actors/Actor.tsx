"use client";

import { WalkSprite } from "@/components/walk-sprite";
import type { ActorMovementState } from "./types";
import styles from "./Actor.module.css";

type ActorProps = {
  movement: ActorMovementState;
  name: string;
  spriteSrc: string;
};

export function Actor({ movement, name, spriteSrc }: ActorProps) {
  return (
    <div className={styles.actor}>
      <WalkSprite
        action={movement.action}
        alt={name}
        cycle={movement.cycle}
        direction={movement.direction}
        src={spriteSrc}
      />
    </div>
  );
}

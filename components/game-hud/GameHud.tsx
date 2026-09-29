"use client";

import { useCallback } from "react";
import { PLAYER_SPELLS } from "@/components/spells/data";
import { Spell } from "@/components/spells/Spell";
import { SpellSequence } from "@/components/spells/SpellSequence";
import { useSpellCasting } from "@/components/spells/useSpellCasting";
import type { SpellSeal } from "@/components/spells/types";
import { useCombatStore } from "@/components/combat/CombatProvider";
import { canAct, getStatusIcon } from "@/components/combat/runtime";
import type { CombatActor, StatusId } from "@/components/combat/runtime";
import { remainingCooldown } from "@/components/combat/casting";
import { useScreenTransition } from "@/components/screen-transition";
import styles from "./GameHud.module.css";

const STATUS_HINTS: Record<StatusId, string> = {
  poisoned: "Отравление: −40% точности, −7% максимального HP за ход",
  bleeding: "Кровотечение: −20% атаки и сопротивления, −5% максимального HP за ход",
  burning: "Горение: −10% максимального HP за ход",
  stunned: "Стан: пропуск одного хода",
};

export function GameHud({ actor, actorId, characterId }: { actor: CombatActor; actorId: string; characterId: string }) {
  const { state, cast } = useCombatStore();
  const { isTransitioning } = useScreenTransition();
  const onCast = useCallback((seals: readonly SpellSeal[]) => {
    const spell = PLAYER_SPELLS.find((candidate) => candidate.seals.every((seal, index) => seal === seals[index]));
    if (!spell) return false;
    return cast(actorId, spell.id, state.encounter ? [state.encounter.enemyId] : []);
  }, [actorId, cast, state.encounter]);
  const sequence = useSpellCasting({ enabled: !isTransitioning && canAct(actor), onCast });
  const statuses = actor.statuses.map((status) => status.id);
  if (characterId === "armored" && !statuses.includes("bleeding")) statuses.push("bleeding");

  return <aside className={styles.hud} aria-label="Player interface">
    <SpellSequence seals={sequence} compact />
    <div className={styles.row}>
      <div className={styles.vitals}>
        <div className={styles.statuses} aria-label="Status effects">
          {statuses.map((id) => {
            const icon = getStatusIcon(id);
            const passive = characterId === "armored" && id === "bleeding";
            const hint = passive ? `Iron Maiden: постоянная пассивка −4.5% HP за ход, не снимается.${actor.statuses.some((status) => status.id === "bleeding") ? ` Дополнительно: ${STATUS_HINTS[id]}` : ""}` : STATUS_HINTS[id];
            return <span key={id} role="img" aria-label={hint} title={hint} className={styles.statusIcon} style={{ backgroundImage: `url(${icon.src})`, backgroundPosition: `${-icon.x}px ${-icon.y}px` }} />;
          })}
        </div>
        <div className={styles.health} role="progressbar" aria-label="Health" aria-valuemin={0} aria-valuemax={actor.maxHealth} aria-valuenow={actor.health}>
          <div className={styles.fill} style={{ width: `${actor.health / actor.maxHealth * 100}%` }} />
          <span>{Math.ceil(actor.health)} / {actor.maxHealth} HP</span>
        </div>
      </div>
      <div className={styles.spells} aria-label="Spells">
        {PLAYER_SPELLS.map((spell) => {
          const cooldown = remainingCooldown(state, actorId, spell.id);
          return <div key={spell.id} className={styles.spell}>
            <Spell {...spell} compact showDetails={false} />
            {cooldown > 0 && <span className={styles.cooldown} title={`Кулдаун: ${cooldown} хода`}>{cooldown}</span>}
          </div>;
        })}
      </div>
    </div>
  </aside>;
}

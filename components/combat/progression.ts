import type { CharacterId } from "@/components/characters";
import { increaseMaxHealthPercent } from "./runtime";
import type { CombatActor, Modifiers, Passive } from "./runtime";

function addModifier(
  actor: CombatActor,
  modifier: keyof Modifiers,
  amount: number,
): CombatActor {
  return {
    ...actor,
    modifiers: {
      ...actor.modifiers,
      [modifier]: (actor.modifiers[modifier] ?? 0) + amount,
    },
  };
}

function upgradeSkeletonRevival(passives: Passive[]): Passive[] {
  return passives.map((passive) => passive.type === "surviveLethal"
    ? {
        ...passive,
        healthPercent: passive.healthPercent + 10,
        uses: passive.uses + 1,
      }
    : passive);
}

function increaseRegeneration(passives: Passive[]): Passive[] {
  return passives.map((passive) => passive.type === "healthPerTurn"
    ? { ...passive, percent: passive.percent + 2 }
    : passive);
}

export function applyVictoryUpgrade(
  actor: CombatActor,
  characterId: CharacterId,
): CombatActor {
  switch (characterId) {
    case "armored":
      return addModifier(increaseMaxHealthPercent(actor, 35), "resistance", 10);
    case "skeleton":
      return {
        ...increaseMaxHealthPercent(actor, 20),
        passives: upgradeSkeletonRevival(actor.passives),
      };
    case "hounds":
      return addModifier(increaseMaxHealthPercent(actor, 15), "evasion", 10);
    case "bloodied":
      return {
        ...increaseMaxHealthPercent(actor, 25),
        passives: increaseRegeneration(actor.passives),
      };
  }
}

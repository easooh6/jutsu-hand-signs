import statusData from "./statuses.json";
import profileData from "./profiles.json";

export type StatusId = keyof typeof statusData;
export type Modifiers = typeof profileData.defaults;
export type Passive =
  | { type: "surviveLethal"; healthPercent: number; uses: number }
  | { type: "healthPerTurn"; percent: number }
  | { type: "castStatuses"; chance: number; statuses: StatusId[] }
  | { type: "repeatCast"; count: number };
export type CombatProfile = {
  health: number;
  immunities: StatusId[];
  modifiers: Partial<Modifiers>;
  passives: Passive[];
};
export type CombatActor = CombatProfile & {
  maxHealth: number;
  statuses: { id: StatusId; remainingTurns: number | null }[];
};
type StatusDefinition = {
  tile: number;
  durationTurns: number | null;
  modifiers: Partial<Modifiers>;
  healthPercentPerTurn: number;
  skipTurn: boolean;
};
export const STATUSES: Record<StatusId, StatusDefinition> = statusData;
export const STATUS_SPRITE_SRC = "/effects/effects.png";
export function getStatusIcon(id: StatusId) {
  return { src: STATUS_SPRITE_SRC, width: 32, height: 32, x: (STATUSES[id].tile - 1) * 32, y: 0 };
}
export const PROFILES = profileData.profiles as Record<string, CombatProfile>;

export function createCombatActor(profile: CombatProfile): CombatActor {
  return {
    ...profile,
    immunities: [...profile.immunities],
    modifiers: { ...profile.modifiers },
    passives: profile.passives.map((passive) => ({ ...passive })),
    maxHealth: profile.health,
    statuses: [],
  };
}
export function applyStatus(actor: CombatActor, id: StatusId): CombatActor {
  if (actor.health <= 0 || actor.immunities.includes(id) || actor.statuses.some((status) => status.id === id)) return actor;
  return { ...actor, statuses: [...actor.statuses, { id, remainingTurns: STATUSES[id].durationTurns }] };
}
export function removeStatus(actor: CombatActor, id: StatusId): CombatActor {
  return { ...actor, statuses: actor.statuses.filter((status) => status.id !== id) };
}
export function getModifierBonuses(actor: CombatActor): Modifiers {
  const result = Object.fromEntries(
    (Object.keys(profileData.defaults) as (keyof Modifiers)[]).map((key) => [key, 0]),
  ) as Modifiers;
  for (const key of Object.keys(result) as (keyof Modifiers)[]) {
    result[key] += actor.modifiers[key] ?? 0;
    for (const status of actor.statuses) result[key] += STATUSES[status.id].modifiers[key] ?? 0;
  }
  return result;
}
export function getModifiers(actor: CombatActor): Modifiers {
  const bonuses = getModifierBonuses(actor);
  const result = { ...profileData.defaults };
  for (const key of Object.keys(result) as (keyof Modifiers)[]) {
    result[key] += bonuses[key];
    result[key] = Math.max(key === "resistance" ? 1 : 0, result[key]);
  }
  result.accuracy = Math.min(100, result.accuracy);
  result.evasion = Math.min(100, result.evasion);
  return result;
}
export function canAct(actor: CombatActor): boolean {
  return actor.health > 0 && !actor.statuses.some((status) => STATUSES[status.id].skipTurn);
}
export function takeDamage(actor: CombatActor, amount: number, directHit = true): CombatActor {
  if (actor.health <= 0) return actor;
  let health = Math.max(0, actor.health - Math.max(0, amount));
  const survival = actor.passives.find((passive) => passive.type === "surviveLethal");
  if (health === 0 && directHit && survival?.type === "surviveLethal" && survival.uses > 0) {
    health = actor.maxHealth * survival.healthPercent / 100;
    return {
      ...actor,
      health,
      passives: actor.passives.map((passive) => passive === survival
        ? { ...passive, uses: passive.uses - 1 }
        : passive),
    };
  }
  return { ...actor, health };
}
export function restoreHealthPercent(actor: CombatActor, percent: number): CombatActor {
  if (actor.health <= 0 || percent <= 0) return actor;
  return {
    ...actor,
    health: Math.min(actor.maxHealth, actor.health + actor.maxHealth * percent / 100),
  };
}
export function increaseMaxHealthPercent(actor: CombatActor, percent: number): CombatActor {
  if (percent <= 0) return actor;
  return { ...actor, maxHealth: actor.maxHealth * (1 + percent / 100) };
}
export function resolveHit(attacker: CombatActor, target: CombatActor, baseDamage: number, random = Math.random): CombatActor {
  if (!canAct(attacker) || target.health <= 0) return target;
  const offense = getModifiers(attacker);
  const defense = getModifiers(target);
  if (random() * 100 >= offense.accuracy || random() * 100 < defense.evasion) return target;
  const attackMultiplier = offense.attack / 100;
  const resistanceMultiplier = defense.resistance / 100;
  return takeDamage(target, baseDamage * attackMultiplier / resistanceMultiplier);
}
export function getCastCount(actor: CombatActor): number {
  if (!canAct(actor)) return 0;
  return actor.passives.reduce((count, passive) => passive.type === "repeatCast" ? Math.max(count, passive.count) : count, 1);
}
export function tickActor(actor: CombatActor): CombatActor {
  if (actor.health <= 0) return actor;
  const statusPercent = actor.statuses.reduce(
    (sum, status) => sum + STATUSES[status.id].healthPercentPerTurn,
    0,
  );
  const resistanceMultiplier = getModifiers(actor).resistance / 100;
  const resistedStatusPercent = statusPercent < 0
    ? statusPercent / resistanceMultiplier
    : statusPercent;
  const passivePercent = actor.passives.reduce(
    (sum, passive) => sum + (passive.type === "healthPerTurn" ? passive.percent : 0),
    0,
  );
  const percent = resistedStatusPercent + passivePercent;
  return {
    ...actor,
    health: Math.max(0, Math.min(actor.maxHealth, actor.health + actor.maxHealth * percent / 100)),
    statuses: actor.statuses.flatMap((status) => status.remainingTurns === null ? [status] : status.remainingTurns > 1 ? [{ ...status, remainingTurns: status.remainingTurns - 1 }] : []),
  };
}

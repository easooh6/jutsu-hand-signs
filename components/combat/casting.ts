import config from "./spellRules.json";
import { applyStatus, canAct, getCastCount, removeStatus, resolveHit, tickActor } from "./runtime";
import type { CombatActor, StatusId } from "./runtime";

export type SpellRule = {
  target?: "self" | "single" | "all";
  baseDamage?: number;
  statuses?: StatusId[];
  purges?: StatusId[];
  selfPurges?: StatusId[];
  healPercent?: number;
  npcHealPercent?: number;
  selfHealPercent?: number;
  npcCooldownTurns?: number;
};
export const SPELL_RULES = config.rules as Record<string, SpellRule>;
export type PendingCast = { casterId: string; spellId: string; targetIds: string[]; dueTurn: number };
export type CastEvent = { id: number; casterId: string; spellId: string };
export type CombatState = {
  actors: Record<string, CombatActor>;
  turn: number;
  readyAt: Record<string, Record<string, number>>;
  pending: PendingCast[];
  animations: CastEvent[];
  nextEventId: number;
  encounter: { playerId: string; enemyId: string; spellIds: string[] } | null;
};
export function createCombatState(): CombatState {
  return { actors: {}, turn: 0, readyAt: {}, pending: [], animations: [], nextEventId: 1, encounter: null };
}
export function remainingCooldown(state: CombatState, actorId: string, spellId: string) {
  return Math.max(0, (state.readyAt[actorId]?.[spellId] ?? 0) - state.turn);
}
export function performCast(state: CombatState, cast: PendingCast, repeated = false, random = Math.random): CombatState {
  const caster = state.actors[cast.casterId];
  if (!caster || !canAct(caster) || (!repeated && remainingCooldown(state, cast.casterId, cast.spellId) > 0)) return state;
  const rule = SPELL_RULES[cast.spellId] ?? {};
  const actors = { ...state.actors };
  const cooldownTurns = cast.casterId.startsWith("npc:") ? rule.npcCooldownTurns ?? config.cooldownTurns : config.cooldownTurns;
  if (rule.selfHealPercent) actors[cast.casterId] = { ...caster, health: Math.min(caster.maxHealth, caster.health + caster.maxHealth * rule.selfHealPercent / 100) };
  if (rule.baseDamage) {
    for (const targetId of cast.targetIds.slice(0, 1)) {
      const target = actors[targetId];
      if (target) actors[targetId] = resolveHit(caster, target, rule.baseDamage, random);
    }
  }
  const targets = rule.target === "self" ? [cast.casterId] : rule.target === "all" ? [...new Set([cast.casterId, ...cast.targetIds])] : cast.targetIds.slice(0, 1);
  for (const status of rule.selfPurges ?? []) actors[cast.casterId] = removeStatus(actors[cast.casterId], status);
  for (const targetId of targets) {
    let target = actors[targetId];
    if (!target || target.health <= 0) continue;
    for (const status of rule.purges ?? []) target = removeStatus(target, status);
    const healPercent = cast.casterId.startsWith("npc:") ? rule.npcHealPercent ?? rule.healPercent : rule.healPercent;
    if (healPercent) target = { ...target, health: Math.min(target.maxHealth, target.health + target.maxHealth * healPercent / 100) };
    for (const status of rule.statuses ?? []) target = applyStatus(target, status);
    actors[targetId] = target;
  }
  // Cast passives also proc when the spell itself heals or cleanses its caster.
  for (const passive of caster.passives) {
    if (passive.type !== "castStatuses" || random() >= passive.chance) continue;
    for (const targetId of new Set(cast.targetIds)) {
      if (targetId === cast.casterId || !actors[targetId]) continue;
      for (const status of passive.statuses) actors[targetId] = applyStatus(actors[targetId], status);
    }
  }
  return {
    ...state, actors,
    readyAt: repeated ? state.readyAt : { ...state.readyAt, [cast.casterId]: { ...state.readyAt[cast.casterId], [cast.spellId]: state.turn + cooldownTurns } },
    pending: !repeated && getCastCount(caster) > 1 ? [...state.pending, { ...cast, dueTurn: state.turn + 1 }] : state.pending,
    animations: [...state.animations, { id: state.nextEventId, casterId: cast.casterId, spellId: cast.spellId }],
    nextEventId: state.nextEventId + 1,
  };
}
export function chooseEnemySpell(state: CombatState, actorId: string, spellIds: readonly string[], random = Math.random): string | null {
  const actor = state.actors[actorId];
  if (!actor || !canAct(actor)) return null;
  const available = spellIds.filter((id) => remainingCooldown(state, actorId, id) === 0);
  const cleanses = available.filter((id) => [...(SPELL_RULES[id]?.purges ?? []), ...(SPELL_RULES[id]?.selfPurges ?? [])].some((status) => actor.statuses.some((current) => current.id === status)));
  const others = available.filter((id) => !cleanses.includes(id));
  const pool = cleanses.length && (others.length === 0 || random() < 0.4) ? cleanses : others.length ? others : available;
  return pool.length ? pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] : null;
}

export function advanceCombatTurn(state: CombatState, random = Math.random): CombatState {
  const blocked = new Set(Object.entries(state.actors).filter(([, actor]) => !canAct(actor)).map(([id]) => id));
  let next: CombatState = { ...state, turn: state.turn + 1, actors: Object.fromEntries(Object.entries(state.actors).map(([id, actor]) => [id, tickActor(actor)])), pending: [] };
  for (const cast of state.pending) {
    if (cast.dueTurn > next.turn) next.pending.push(cast);
    else if (!blocked.has(cast.casterId)) next = performCast(next, cast, true, random);
  }
  const encounter = next.encounter;
  if (encounter && (next.actors[encounter.playerId]?.health <= 0 || next.actors[encounter.enemyId]?.health <= 0)) next.encounter = null;
  if (encounter && next.actors[encounter.playerId]?.health > 0 && next.actors[encounter.enemyId]?.health > 0 && !blocked.has(encounter.enemyId)) {
    const spellId = chooseEnemySpell(next, encounter.enemyId, encounter.spellIds, random);
    if (spellId) next = performCast(next, { casterId: encounter.enemyId, spellId, targetIds: [encounter.playerId], dueTurn: next.turn }, false, random);
  }
  return next;
}

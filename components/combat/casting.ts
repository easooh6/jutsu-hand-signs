import config from "./spellRules.json";
import { applyStatus, canAct, getCastCount, removeStatus, resolveHit, restoreHealthPercent, tickActor } from "./runtime";
import type { CombatActor, StatusId } from "./runtime";

export type SpellRule = {
  target?: "self" | "single" | "all";
  baseDamage?: number;
  cooldownTurns?: number;
  statuses?: StatusId[];
  targetStatuses?: StatusId[];
  purges?: StatusId[];
  selfPurges?: StatusId[];
  healPercent?: number;
  npcHealPercent?: number;
  selfHealPercent?: number;
  npcCooldownTurns?: number;
};
export const SPELL_RULES = config.rules as Record<string, SpellRule>;
export type PendingCast = { casterId: string; spellId: string; targetIds: string[]; dueTurn: number };
export type CastEvent = {
  casterId: string;
  damagedTargetIds: string[];
  id: number;
  missedTargetIds: string[];
  repeated: boolean;
  spellId: string;
  stage: "casting" | "resolved";
  targetIds: string[];
};
export type EncounterPhase = "player" | "enemy";
export type CombatEncounter = {
  enemyDefinitionId: string;
  enemyId: string;
  phase: EncounterPhase;
  playerId: string;
  spellIds: string[];
};
export type CombatState = {
  actors: Record<string, CombatActor>;
  turn: number;
  readyAt: Record<string, Record<string, number>>;
  pending: PendingCast[];
  animations: CastEvent[];
  nextEventId: number;
  encounter: CombatEncounter | null;
};
export function createCombatState(): CombatState {
  return { actors: {}, turn: 0, readyAt: {}, pending: [], animations: [], nextEventId: 1, encounter: null };
}
export function remainingCooldown(state: CombatState, actorId: string, spellId: string) {
  return Math.max(0, (state.readyAt[actorId]?.[spellId] ?? 0) - state.turn);
}
export function isEncounterOver(state: CombatState): boolean {
  const encounter = state.encounter;
  if (!encounter) return false;
  return (state.actors[encounter.playerId]?.health ?? 0) <= 0
    || (state.actors[encounter.enemyId]?.health ?? 0) <= 0;
}

function haltEncounterActions(state: CombatState): CombatState {
  if (!isEncounterOver(state)) return state;
  return {
    ...state,
    animations: state.animations.filter((event) => event.stage === "resolved"),
    pending: [],
  };
}

export function beginCast(state: CombatState, cast: PendingCast, repeated = false): CombatState {
  if (isEncounterOver(state)) return haltEncounterActions(state);
  const caster = state.actors[cast.casterId];
  if (!caster || !canAct(caster) || (!repeated && remainingCooldown(state, cast.casterId, cast.spellId) > 0)) return state;
  return {
    ...state,
    animations: [...state.animations, {
      casterId: cast.casterId,
      damagedTargetIds: [],
      id: state.nextEventId,
      missedTargetIds: [],
      repeated,
      spellId: cast.spellId,
      stage: "casting",
      targetIds: [...cast.targetIds],
    }],
    nextEventId: state.nextEventId + 1,
  };
}
export function performCast(state: CombatState, cast: PendingCast, repeated = false, random = Math.random): CombatState {
  const caster = state.actors[cast.casterId];
  if (!caster || !canAct(caster) || (!repeated && remainingCooldown(state, cast.casterId, cast.spellId) > 0)) return state;
  const rule = SPELL_RULES[cast.spellId] ?? {};
  const actors = { ...state.actors };
  const healthBefore = Object.fromEntries(
    cast.targetIds.map((targetId) => [targetId, actors[targetId]?.health]),
  );
  const attackedTargetIds = rule.baseDamage
    ? cast.targetIds.filter((targetId) => (actors[targetId]?.health ?? 0) > 0)
    : [];
  const cooldownTurns = cast.casterId.startsWith("npc:")
    ? rule.npcCooldownTurns ?? rule.cooldownTurns ?? config.cooldownTurns
    : rule.cooldownTurns ?? config.cooldownTurns;
  if (rule.selfHealPercent) actors[cast.casterId] = restoreHealthPercent(caster, rule.selfHealPercent);
  if (rule.baseDamage) {
    for (const targetId of cast.targetIds.slice(0, 1)) {
      const target = actors[targetId];
      if (target) actors[targetId] = resolveHit(caster, target, rule.baseDamage, random);
    }
  }
  const directlyDamaged = new Set(attackedTargetIds.filter((targetId) => {
    const previous = healthBefore[targetId];
    return previous !== undefined && (actors[targetId]?.health ?? previous) < previous;
  }));
  const targets = rule.target === "self" ? [cast.casterId] : rule.target === "all" ? [...new Set([cast.casterId, ...cast.targetIds])] : cast.targetIds.slice(0, 1);
  for (const status of rule.selfPurges ?? []) actors[cast.casterId] = removeStatus(actors[cast.casterId], status);
  for (const targetId of targets) {
    let target = actors[targetId];
    if (!target || target.health <= 0) continue;
    const isOpponentTarget = cast.targetIds.includes(targetId);
    const effectsLand = !isOpponentTarget || !rule.baseDamage || directlyDamaged.has(targetId);
    if (!effectsLand) continue;
    for (const status of rule.purges ?? []) target = removeStatus(target, status);
    const healPercent = cast.casterId.startsWith("npc:") ? rule.npcHealPercent ?? rule.healPercent : rule.healPercent;
    if (healPercent) target = restoreHealthPercent(target, healPercent);
    for (const status of rule.statuses ?? []) target = applyStatus(target, status);
    if (directlyDamaged.has(targetId)) {
      for (const status of rule.targetStatuses ?? []) target = applyStatus(target, status);
    }
    actors[targetId] = target;
  }
  // Cast passives also proc when the spell itself heals or cleanses its caster.
  for (const passive of caster.passives) {
    if (passive.type !== "castStatuses" || random() >= passive.chance) continue;
    for (const targetId of new Set(cast.targetIds)) {
      if (targetId === cast.casterId || !actors[targetId]) continue;
      if (rule.baseDamage && !directlyDamaged.has(targetId)) continue;
      for (const status of passive.statuses) actors[targetId] = applyStatus(actors[targetId], status);
    }
  }
  return {
    ...state, actors,
    readyAt: repeated ? state.readyAt : { ...state.readyAt, [cast.casterId]: { ...state.readyAt[cast.casterId], [cast.spellId]: state.turn + cooldownTurns } },
    pending: !repeated && getCastCount(caster) > 1 ? [...state.pending, { ...cast, dueTurn: state.turn + 1 }] : state.pending,
    animations: [...state.animations, {
      id: state.nextEventId,
      casterId: cast.casterId,
      damagedTargetIds: cast.targetIds.filter((targetId) => {
        const previous = healthBefore[targetId];
        return previous !== undefined && (actors[targetId]?.health ?? previous) < previous;
      }),
      missedTargetIds: attackedTargetIds.filter((targetId) => {
        const previous = healthBefore[targetId];
        return previous !== undefined && (actors[targetId]?.health ?? previous) === previous;
      }),
      repeated,
      spellId: cast.spellId,
      stage: "resolved",
      targetIds: [...cast.targetIds],
    }],
    nextEventId: state.nextEventId + 1,
  };
}
export function resolveCastEvent(state: CombatState, event: CastEvent, random = Math.random): CombatState {
  if (event.stage !== "casting") return state;
  const eventIndex = state.animations.findIndex((candidate) => candidate.id === event.id);
  if (eventIndex < 0) return state;
  const beforeEvent = state.animations.slice(0, eventIndex);
  const afterEvent = state.animations.slice(eventIndex + 1);
  const withoutCastingEvent = { ...state, animations: [] };
  const resolved = performCast(withoutCastingEvent, {
    casterId: event.casterId,
    dueTurn: state.turn,
    spellId: event.spellId,
    targetIds: event.targetIds,
  }, event.repeated, random);
  if (resolved === withoutCastingEvent) return { ...state, animations: [...beforeEvent, ...afterEvent] };
  const resolution = resolved.animations[resolved.animations.length - 1];
  let next: CombatState = {
    ...resolved,
    animations: [...beforeEvent, resolution, ...afterEvent],
  };
  if (state.encounter?.enemyId === event.casterId && !event.repeated) {
    next = isEncounterOver(next) ? haltEncounterActions(next) : finishEnemyRound(next);
  }
  return haltEncounterActions(next);
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

export function performEnemyTurn(state: CombatState, random = Math.random): CombatState {
  if (isEncounterOver(state)) return haltEncounterActions(state);
  const encounter = state.encounter;
  if (!encounter || encounter.phase !== "enemy" || state.animations.length > 0) return state;
  const enemy = state.actors[encounter.enemyId];
  const player = state.actors[encounter.playerId];
  if (!enemy || !player || enemy.health <= 0 || player.health <= 0) return state;

  const next = state;
  if (canAct(enemy)) {
    const spellId = chooseEnemySpell(next, encounter.enemyId, encounter.spellIds, random);
    if (spellId) return beginCast(next, {
      casterId: encounter.enemyId,
      dueTurn: next.turn,
      spellId,
      targetIds: [encounter.playerId],
    });
  }
  return finishEnemyRound(next);
}

function finishEnemyRound(state: CombatState): CombatState {
  if (isEncounterOver(state)) return haltEncounterActions(state);
  const encounter = state.encounter;
  if (!encounter) return state;
  let next = state;
  const playerSkipsTurn = !canAct(next.actors[encounter.playerId]);
  next = advanceCombatTurn(next);
  return haltEncounterActions({
    ...next,
    encounter: next.encounter ? {
      ...next.encounter,
      phase: playerSkipsTurn ? "enemy" : "player",
    } : null,
  });
}

function advanceTurn(state: CombatState, tickStatuses: boolean): CombatState {
  if (isEncounterOver(state)) return haltEncounterActions(state);
  const blocked = new Set(Object.entries(state.actors).filter(([, actor]) => !canAct(actor)).map(([id]) => id));
  let next: CombatState = {
    ...state,
    turn: state.turn + 1,
    actors: tickStatuses
      ? Object.fromEntries(Object.entries(state.actors).map(([id, actor]) => [id, tickActor(actor)]))
      : state.actors,
    pending: [],
  };
  for (const cast of state.pending) {
    if (cast.dueTurn > next.turn) next.pending.push(cast);
    else if (!blocked.has(cast.casterId)) next = beginCast(next, cast, true);
  }
  return haltEncounterActions(next);
}

export function advanceCombatTurn(state: CombatState): CombatState {
  return advanceTurn(state, true);
}

export function advanceWorldCooldown(state: CombatState): CombatState {
  return advanceTurn(state, false);
}

export function tickWorldEffects(state: CombatState): CombatState {
  if (isEncounterOver(state)) return haltEncounterActions(state);
  return {
    ...state,
    actors: Object.fromEntries(
      Object.entries(state.actors).map(([id, actor]) => [id, tickActor(actor)]),
    ),
  };
}

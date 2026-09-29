"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { createCombatActor } from "./runtime";
import {
  advanceWorldCooldown,
  beginCast,
  createCombatState,
  performEnemyTurn,
  resolveCastEvent,
  tickWorldEffects,
} from "./casting";
import type { CombatState } from "./casting";
import { getSpellDefinition } from "@/components/spells/data";
import { SpellCastAnimation } from "@/components/spells/SpellCastAnimation";
import type { CombatActor, CombatProfile } from "./runtime";

type CombatStore = {
  state: CombatState;
  register: (id: string, profile: CombatProfile) => void;
  update: (id: string, change: (actor: CombatActor) => CombatActor) => void;
  cast: (id: string, spellId: string, targets: string[]) => boolean;
  beginEncounter: (playerId: string, enemyId: string, enemyDefinitionId: string, spellIds: string[]) => void;
  enemyTurn: () => void;
  endEncounter: () => void;
};
const Context = createContext<CombatStore | null>(null);

export function CombatProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(createCombatState);
  const current = useRef(state);
  const change = useCallback((operation: (state: CombatState) => CombatState) => {
    const next = operation(current.current);
    current.current = next;
    setState(next);
    return next;
  }, []);
  const register = useCallback((id: string, profile: CombatProfile) => {
    change((value) => value.actors[id] ? value : { ...value, actors: { ...value.actors, [id]: createCombatActor(profile) } });
  }, [change]);
  const update = useCallback((id: string, operation: (actor: CombatActor) => CombatActor) => {
    change((value) => value.actors[id] ? { ...value, actors: { ...value.actors, [id]: operation(value.actors[id]) } } : value);
  }, [change]);
  const cast = useCallback((id: string, spellId: string, targets: string[]) => {
    let accepted = false;
    change((value) => {
      const encounter = value.encounter;
      if (value.animations.length > 0) return value;
      if (encounter && (encounter.phase !== "player" || encounter.playerId !== id)) return value;
      if (!encounter && id.startsWith("npc:")) return value;

      const targetIds = encounter
        ? [encounter.enemyId]
        : targets.length === 0 ? targets : [];
      const next = beginCast(value, { casterId: id, spellId, targetIds, dueTurn: value.turn });
      if (next === value) return value;
      accepted = true;
      return encounter ? { ...next, encounter: { ...encounter, phase: "enemy" } } : next;
    });
    return accepted;
  }, [change]);
  const beginEncounter = useCallback((playerId: string, enemyId: string, enemyDefinitionId: string, spellIds: string[]) => {
    change((value) => value.encounter ? value : { ...value, encounter: { playerId, enemyId, enemyDefinitionId, phase: "player", spellIds } });
  }, [change]);
  const enemyTurn = useCallback(() => {
    change(performEnemyTurn);
  }, [change]);
  const endEncounter = useCallback(() => {
    change((value) => ({ ...value, animations: [], encounter: null, pending: [] }));
  }, [change]);
  const completeAnimation = useCallback(() => {
    change((value) => {
      const event = value.animations[0];
      return event?.stage === "casting" ? resolveCastEvent(value, event) : value;
    });
  }, [change]);
  useEffect(() => {
    const cooldownTimer = window.setInterval(() => {
      change((value) => value.encounter ? value : advanceWorldCooldown(value));
    }, 3_000);
    const effectsTimer = window.setInterval(() => {
      change((value) => value.encounter ? value : tickWorldEffects(value));
    }, 10_000);
    return () => {
      window.clearInterval(cooldownTimer);
      window.clearInterval(effectsTimer);
    };
  }, [change]);
  const animation = state.animations[0];
  useEffect(() => {
    if (animation?.stage !== "resolved") return;
    const timer = window.setTimeout(() => {
      change((value) => value.animations[0]?.id === animation.id
        ? { ...value, animations: value.animations.slice(1) }
        : value);
    }, 1_000);
    return () => window.clearTimeout(timer);
  }, [animation, change]);
  return <Context.Provider value={{ state, register, update, cast, beginEncounter, enemyTurn, endEncounter }}>
    {children}
    {animation?.stage === "casting" && <SpellCastAnimation key={animation.id} spell={getSpellDefinition(animation.spellId)} onComplete={completeAnimation} />}
  </Context.Provider>;
}

export function useCombatStore() {
  const store = useContext(Context);
  if (!store) throw new Error("CombatProvider is required");
  return store;
}
export function useCombatActor(id: string, profile: CombatProfile) {
  const store = useCombatStore();
  const { register } = store;
  useEffect(() => register(id, profile), [id, profile, register]);
  return {
    actor: store.state.actors[id] ?? createCombatActor(profile),
    update: (change: (actor: CombatActor) => CombatActor) => store.update(id, change),
  };
}

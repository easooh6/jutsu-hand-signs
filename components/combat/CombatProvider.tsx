"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { createCombatActor } from "./runtime";
import { advanceCombatTurn, createCombatState, performCast } from "./casting";
import type { CombatState } from "./casting";
import { getSpellDefinition } from "@/components/spells/data";
import { SpellCastAnimation } from "@/components/spells/SpellCastAnimation";
import type { CombatActor, CombatProfile } from "./runtime";

type CombatStore = {
  state: CombatState;
  register: (id: string, profile: CombatProfile) => void;
  update: (id: string, change: (actor: CombatActor) => CombatActor) => void;
  cast: (id: string, spellId: string, targets: string[]) => boolean;
  beginEncounter: (playerId: string, enemyId: string, spellIds: string[]) => void;
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
    const previous = current.current;
    return change((value) => performCast(value, { casterId: id, spellId, targetIds: targets, dueTurn: value.turn })) !== previous;
  }, [change]);
  const beginEncounter = useCallback((playerId: string, enemyId: string, spellIds: string[]) => {
    change((value) => value.encounter ? value : { ...value, encounter: { playerId, enemyId, spellIds } });
  }, [change]);
  const endEncounter = useCallback(() => {
    change((value) => ({ ...value, encounter: null }));
  }, [change]);
  const completeAnimation = useCallback(() => {
    change((value) => ({ ...value, animations: value.animations.slice(1) }));
  }, [change]);
  useEffect(() => {
    const timer = window.setInterval(() => change(advanceCombatTurn), 5000);
    return () => window.clearInterval(timer);
  }, [change]);
  const animation = state.animations[0];
  return <Context.Provider value={{ state, register, update, cast, beginEncounter, endEncounter }}>
    {children}
    {animation && <SpellCastAnimation key={animation.id} spell={getSpellDefinition(animation.spellId)} onComplete={completeAnimation} />}
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

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { createCombatActor, tickActor } from "./runtime";
import type { CombatActor, CombatProfile } from "./runtime";

type CombatStore = {
  actors: Record<string, CombatActor>;
  register: (id: string, profile: CombatProfile) => void;
  update: (id: string, change: (actor: CombatActor) => CombatActor) => void;
};
const Context = createContext<CombatStore | null>(null);

export function CombatProvider({ children }: { children: ReactNode }) {
  const [actors, setActors] = useState<Record<string, CombatActor>>({});
  const register = useCallback((id: string, profile: CombatProfile) => {
    setActors((current) => current[id] ? current : { ...current, [id]: createCombatActor(profile) });
  }, []);
  const update = useCallback((id: string, change: (actor: CombatActor) => CombatActor) => {
    setActors((current) => current[id] ? { ...current, [id]: change(current[id]) } : current);
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setActors((current) => Object.fromEntries(
      Object.entries(current).map(([id, actor]) => [id, tickActor(actor)]),
    )), 5000);
    return () => window.clearInterval(timer);
  }, []);
  return <Context.Provider value={{ actors, register, update }}>{children}</Context.Provider>;
}

export function useCombatActor(id: string, profile: CombatProfile) {
  const store = useContext(Context);
  if (!store) throw new Error("CombatProvider is required");
  const { register } = store;
  useEffect(() => register(id, profile), [id, profile, register]);
  return {
    actor: store.actors[id] ?? createCombatActor(profile),
    update: (change: (actor: CombatActor) => CombatActor) => store.update(id, change),
  };
}

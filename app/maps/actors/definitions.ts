import actorData from "../data/actors.json";

export type ActorDefinitionId = string;

export type ActorDefinition = {
  battleEnterSound: string;
  friendly: boolean;
  health: number;
  iconSrc: string;
  id: ActorDefinitionId;
  moveDuration: number;
  name: string;
  walkSpriteSrc: string;
};

export type ActorDatabase = {
  actors: ActorDefinition[];
};

export const ACTOR_DATABASE = actorData as ActorDatabase;
export const ACTOR_DEFINITIONS: readonly ActorDefinition[] =
  ACTOR_DATABASE.actors;

export function getActorDefinition(id: ActorDefinitionId): ActorDefinition {
  const definition = ACTOR_DEFINITIONS.find((actor) => actor.id === id);
  if (!definition) throw new Error(`Unknown actor definition: ${id}`);
  return definition;
}

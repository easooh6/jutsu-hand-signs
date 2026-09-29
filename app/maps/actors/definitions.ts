export type ActorDefinitionId =
  | "guard1"
  | "blackangel"
  | "ironshakespeare";

export type ActorDefinition = {
  friendly: boolean;
  iconSrc: string;
  id: ActorDefinitionId;
  name: string;
  walkSpriteSrc: string;
};

export const ACTOR_DEFINITIONS: readonly ActorDefinition[] = [
  {
    friendly: false,
    iconSrc: "/characters/guard1.png",
    id: "guard1",
    name: "Guard",
    walkSpriteSrc: "/walk/$guard1.png",
  },
  {
    friendly: false,
    iconSrc: "/characters/black_angel.png",
    id: "blackangel",
    name: "Black Angel",
    walkSpriteSrc: "/walk/$black_angel2.png",
  },
  {
    friendly: false,
    iconSrc: "/characters/iron_shakespere.png",
    id: "ironshakespeare",
    name: "Iron Shakespeare",
    walkSpriteSrc: "/walk/$iron_shakespeare.png",
  },
];

export function getActorDefinition(id: ActorDefinitionId): ActorDefinition {
  const definition = ACTOR_DEFINITIONS.find((actor) => actor.id === id);
  if (!definition) throw new Error(`Unknown actor definition: ${id}`);
  return definition;
}

export type SpellPhase = {
  frames: number;
  row: number;
};

export type SpellSeal = "horse" | "dog" | "tiger";

export type SpellCaster = "player" | "npc" | "shared";
export type SpellDefinitionId = string;

export type SpellSealSlot = SpellSeal | null;

export type SpellSealSequence = [
  SpellSealSlot,
  SpellSealSlot,
  SpellSealSlot,
];

type BaseSpellDefinition = {
  animationDurationSeconds: number;
  castSoundSrc: string;
  columns: number;
  description: string;
  frameDuration?: number;
  id: SpellDefinitionId;
  iconFrame?: number | "last";
  name: string;
  phases: SpellPhase[];
  rows: number;
  showDetails?: boolean;
  spriteSrc: string;
};

export type PlayerSpellDefinition = BaseSpellDefinition & {
  caster: "player" | "shared";
  seals: [SpellSeal, SpellSeal, SpellSeal];
};

export type NpcSpellDefinition = BaseSpellDefinition & {
  caster: "npc";
};

export type SpellDefinition =
  | PlayerSpellDefinition
  | NpcSpellDefinition;

export type SpellDatabase = {
  spells: SpellDefinition[];
};

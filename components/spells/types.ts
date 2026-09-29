export type SpellPhase = {
  frames: number;
  row: number;
};

export type SpellSeal = "horse" | "dog" | "tiger";

export type SpellSealSlot = SpellSeal | null;

export type SpellSealSequence = [
  SpellSealSlot,
  SpellSealSlot,
  SpellSealSlot,
];

export type SpellDefinition = {
  columns: number;
  description: string;
  frameDuration?: number;
  id: string;
  iconFrame?: number | "last";
  name: string;
  phases: SpellPhase[];
  rows: number;
  seals: [SpellSeal, SpellSeal, SpellSeal];
  showDetails?: boolean;
  spriteSrc: string;
};

export type SpellDatabase = {
  spells: SpellDefinition[];
};

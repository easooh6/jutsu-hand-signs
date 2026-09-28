export type SpellPhase = {
  frames: number;
  row: number;
};

export type SpellDefinition = {
  columns: number;
  description: string;
  frameDuration?: number;
  id: string;
  iconFrame?: number | "last";
  name: string;
  phases: SpellPhase[];
  rows: number;
  showDetails?: boolean;
  spriteSrc: string;
};

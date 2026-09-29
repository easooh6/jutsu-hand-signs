export type CharacterId = "skeleton" | "armored" | "hounds" | "bloodied";

export type CharacterDefinition = {
  alt: string;
  health: number;
  id: CharacterId;
  imageSrc: string;
  moveDuration: number;
  name: string;
  sanity: number;
  walkSpriteSrc: string;
};

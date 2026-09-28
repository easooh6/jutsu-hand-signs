import type { CharacterDefinition } from "./types";

export const CHARACTERS: CharacterDefinition[] = [
  {
    id: "skeleton",
    name: "Mr Bones",
    alt: "Skeleton character",
    imageSrc: "/characters/actor-2-8.png",
    moveDuration: 480,
    walkSpriteSrc: "/walk/skeleton1.png",
  },
  {
    id: "armored",
    name: "Iron Maiden",
    alt: "Armored character",
    imageSrc: "/characters/actor-3-2.png",
    moveDuration: 400,
    walkSpriteSrc: "/walk/penance.png",
  },
  {
    id: "hounds",
    name: "Furball",
    alt: "Hound character",
    imageSrc: "/characters/actor-2-2.png",
    moveDuration: 480,
    walkSpriteSrc: "/walk/moonless.png",
  },
  {
    id: "bloodied",
    name: "Lord Zombie",
    alt: "Bloodied character",
    imageSrc: "/characters/actor-1-6.png",
    moveDuration: 480,
    walkSpriteSrc: "/walk/$ghoul1.png",
  },
];

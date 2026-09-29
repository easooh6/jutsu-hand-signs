import spellData from "./spells.json";
import type {
  PlayerSpellDefinition,
  SpellDatabase,
  SpellDefinitionId,
} from "./types";

export const SPELL_DATABASE = spellData as SpellDatabase;
export const SPELLS = SPELL_DATABASE.spells;
export const PLAYER_SPELLS = SPELLS.filter(
  (spell): spell is PlayerSpellDefinition => spell.caster === "player" || spell.caster === "shared",
);
export const NPC_SPELLS = SPELLS.filter(
  (spell) => spell.caster === "npc" || spell.caster === "shared",
);

export function getSpellDefinition(id: SpellDefinitionId) {
  const spell = SPELLS.find((candidate) => candidate.id === id);
  if (!spell) throw new Error(`Unknown spell definition: ${id}`);
  return spell;
}

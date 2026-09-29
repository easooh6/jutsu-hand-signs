import spellData from "./spells.json";
import type { SpellDatabase } from "./types";

export const SPELL_DATABASE = spellData as SpellDatabase;
export const SPELLS = SPELL_DATABASE.spells;

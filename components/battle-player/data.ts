import type { BattlePlayerAnimation, BattlePlayerCharacterId } from "./types";

export const BATTLE_PLAYER_SPRITES: Record<BattlePlayerCharacterId, string> = {
  skeleton: "/battle/skeleton.png",
  armored: "/battle/iron_maiden.png",
  hounds: "/battle/furball.png",
  bloodied: "/battle/zombie.png",
};

export const BATTLE_PLAYER_ROWS: Record<BattlePlayerAnimation, number> = {
  idle: 0,
  cast: 0,
  hurt: 1,
  death: 2,
};

export const BATTLE_PLAYER_COLUMNS = 9;
export const BATTLE_PLAYER_ROWS_COUNT = 3;
export const BATTLE_PLAYER_ANIMATION_DURATION_MS = 1_000;


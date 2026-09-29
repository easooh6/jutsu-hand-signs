import { BATTLE_PLAYER_SPRITES } from "./data";
import { BattlePlayerSprite } from "./BattlePlayerSprite";
import type { BattlePlayerCharacterId } from "./types";
import type { BattlePlayerSpriteProps } from "./BattlePlayerSprite";

export type BattlePlayerProps = Omit<BattlePlayerSpriteProps, "spriteSrc"> & {
  characterId: BattlePlayerCharacterId;
};

export function BattlePlayer({ characterId, ...props }: BattlePlayerProps) {
  return (
    <BattlePlayerSprite
      {...props}
      spriteSrc={BATTLE_PLAYER_SPRITES[characterId]}
    />
  );
}


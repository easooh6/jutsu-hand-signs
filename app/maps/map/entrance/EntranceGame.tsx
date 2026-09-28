"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CHARACTERS,
  readCharacterChoice,
} from "@/components/characters";
import type { CharacterDefinition } from "@/components/characters";
import {
  Actor,
  createPlayerController,
  useActorMovement,
} from "../../actors";
import type { GridPosition } from "../../actors";
import { Camera } from "../../camera";
import { MapOverheadRenderer, MapRenderer } from "../MapRenderer";
import { findMapEvent } from "../events";
import { entranceMap } from "./map";

const FALLBACK_POSITION: GridPosition = { x: 4, y: 4 };

export function EntranceGame() {
  const router = useRouter();
  const [character, setCharacter] = useState<CharacterDefinition | null>(null);

  useEffect(() => {
    const selectedId = readCharacterChoice();
    const selectedCharacter = CHARACTERS.find(
      (candidate) => candidate.id === selectedId,
    );

    if (!selectedCharacter) {
      router.replace("/play");
      return;
    }

    setCharacter(selectedCharacter);
  }, [router]);

  if (!character) {
    return null;
  }

  return <EntranceSession character={character} />;
}

function EntranceSession({ character }: { character: CharacterDefinition }) {
  const controller = useMemo(() => createPlayerController(), []);
  const spawn = findMapEvent(entranceMap, "player-spawn");
  const initialPosition = spawn
    ? { x: spawn.x, y: spawn.y }
    : FALLBACK_POSITION;
  const movement = useActorMovement({
    controller,
    initialPosition,
    map: entranceMap,
    stepDuration: character.moveDuration,
  });

  return (
    <Camera
      focus={{
        x: movement.position.x * entranceMap.tileSize + entranceMap.tileSize / 2,
        y: movement.position.y * entranceMap.tileSize - 7,
      }}
      overlay={
        <Actor
          movement={movement}
          name={character.name}
          spriteSrc={character.walkSpriteSrc}
        />
      }
      overhead={<MapOverheadRenderer map={entranceMap} />}
      transitionDuration={character.moveDuration}
      zoom={2}
    >
      <MapRenderer map={entranceMap} />
    </Camera>
  );
}

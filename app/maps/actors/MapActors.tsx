"use client";

import { useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { useCombatActor, useCombatStore } from "@/components/combat/CombatProvider";
import { canAct } from "@/components/combat/runtime";
import { useScreenTransition } from "@/components/screen-transition";
import type { CSSProperties } from "react";
import type { GameMap, MapActorSpawn } from "../map/types";
import { Actor } from "./Actor";
import { createAIController } from "./controllers";
import { getActorDefinition } from "./definitions";
import { useAIBehavior } from "./ai";
import { useActorMovement } from "./useActorMovement";
import type { ActorMovementState, GridPosition } from "./types";
import styles from "./MapActors.module.css";

export type PlayerMapActor = {
  actorId: string;
  health: number;
  moveDuration: number;
  movement: ActorMovementState;
  name: string;
  sanity: number;
  spriteSrc: string;
};

type PositionedActorProps = {
  friendly: boolean;
  health: number;
  map: GameMap;
  moveDuration: number;
  movement: ActorMovementState;
  name: string;
  sanity?: number;
  spriteSrc: string;
};

function PositionedActor({
  friendly,
  health,
  map,
  moveDuration,
  movement,
  name,
  sanity,
  spriteSrc,
}: PositionedActorProps) {
  const positionStyle: CSSProperties = {
    left: (movement.position.x + 0.5) * map.tileSize,
    top: (movement.position.y + 1) * map.tileSize,
    transitionDuration: `${moveDuration}ms`,
    zIndex: movement.position.y + 1,
  };

  return (
    <div
      className={styles.spawn}
      data-friendly={friendly ? "1" : "0"}
      data-health={health}
      data-sanity={sanity}
      style={positionStyle}
    >
      <Actor movement={movement} name={name} spriteSrc={spriteSrc} />
    </div>
  );
}

type SpawnedActorProps = {
  playerId: string;
  mapId: string;
  map: GameMap;
  onPositionChange: (
    instanceId: string,
    position: GridPosition | null,
  ) => void;
  occupied: readonly GridPosition[];
  playerPosition: GridPosition;
  spawn: MapActorSpawn;
  x: number;
  y: number;
};

function SpawnedActor({
  playerId,
  mapId,
  map,
  onPositionChange,
  occupied,
  playerPosition,
  spawn,
  x,
  y,
}: SpawnedActorProps) {
  const definition = getActorDefinition(spawn.actorId);
  const { actor } = useCombatActor(`npc:${mapId}:${spawn.instanceId}`, definition);
  const { beginEncounter, state } = useCombatStore();
  const { runBattleTransition } = useScreenTransition();
  const onContact = useCallback(() => {
    void runBattleTransition(() => {
      beginEncounter(playerId, `npc:${mapId}:${spawn.instanceId}`, definition.id, definition.spellIds);
    });
  }, [beginEncounter, playerId, mapId, spawn.instanceId, definition.id, definition.spellIds, runBattleTransition]);
  const controller = useMemo(
    () =>
      createAIController({
        friendly: definition.friendly,
      }),
    [definition.friendly],
  );
  const movement = useActorMovement({
    controller,
    enabled: canAct(actor) && state.encounter === null,
    initialDirection: spawn.direction,
    initialPosition: { x, y },
    map,
    stepDuration: definition.moveDuration,
  });
  useAIBehavior({
    enabled: canAct(actor) && state.encounter === null,
    onContact,
    controller,
    map,
    movement,
    occupied,
    playerPosition,
  });

  useEffect(() => {
    onPositionChange(spawn.instanceId, movement.position);
  }, [movement.position, onPositionChange, spawn.instanceId]);

  useEffect(
    () => () => onPositionChange(spawn.instanceId, null),
    [onPositionChange, spawn.instanceId],
  );
  if (actor.health <= 0) {
    const positionStyle: CSSProperties = {
      left: (movement.position.x + 0.5) * map.tileSize,
      top: (movement.position.y + 1) * map.tileSize,
      zIndex: movement.position.y + 1,
    };
    return (
      <div className={`${styles.spawn} ${styles.dead}`} style={positionStyle}>
        <Image
          alt={`${definition.name} dead`}
          className={styles.deadSprite}
          height={definition.deadSpriteSize.height}
          src={definition.deadSpriteSrc}
          unoptimized
          width={definition.deadSpriteSize.width}
        />
      </div>
    );
  }

  return (
    <PositionedActor
      friendly={controller.friendly}
      health={actor.health}
      map={map}
      moveDuration={definition.moveDuration}
      movement={movement}
      name={definition.name}
      spriteSrc={definition.walkSpriteSrc}
    />
  );
}

export function MapActors({
  mapId,
  map,
  onActorPositionChange,
  player,
  playerPosition,
}: {
  mapId: string;
  map: GameMap;
  onActorPositionChange: (
    instanceId: string,
    position: GridPosition | null,
  ) => void;
  player: PlayerMapActor;
  playerPosition: GridPosition;
}) {
  const occupied = useMemo(
    () =>
      map.actors.flatMap((row, y) =>
        row.flatMap((spawn, x) => (spawn ? [{ x, y }] : [])),
      ),
    [map],
  );

  return (
    <div className={styles.actorLayer}>
      {map.actors.flatMap((row, y) =>
        row.map((spawn, x) =>
          spawn ? (
            <SpawnedActor
              playerId={player.actorId}
              mapId={mapId}
              key={spawn.instanceId}
              map={map}
              onPositionChange={onActorPositionChange}
              occupied={occupied}
              playerPosition={playerPosition}
              spawn={spawn}
              x={x}
              y={y}
            />
          ) : null,
        ),
      )}
      <PositionedActor
        friendly
        health={player.health}
        map={map}
        moveDuration={player.moveDuration}
        movement={player.movement}
        name={player.name}
        sanity={player.sanity}
        spriteSrc={player.spriteSrc}
      />
    </div>
  );
}

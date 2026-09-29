"use client";

import { useEffect, useMemo } from "react";
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
  moveDuration: number;
  movement: ActorMovementState;
  name: string;
  spriteSrc: string;
};

type PositionedActorProps = {
  friendly: boolean;
  map: GameMap;
  moveDuration: number;
  movement: ActorMovementState;
  name: string;
  spriteSrc: string;
};

function PositionedActor({
  friendly,
  map,
  moveDuration,
  movement,
  name,
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
      style={positionStyle}
    >
      <Actor movement={movement} name={name} spriteSrc={spriteSrc} />
    </div>
  );
}

type SpawnedActorProps = {
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
  map,
  onPositionChange,
  occupied,
  playerPosition,
  spawn,
  x,
  y,
}: SpawnedActorProps) {
  const definition = getActorDefinition(spawn.actorId);
  const controller = useMemo(
    () =>
      createAIController({
        friendly: definition.friendly,
      }),
    [definition.friendly],
  );
  const movement = useActorMovement({
    controller,
    initialDirection: spawn.direction,
    initialPosition: { x, y },
    map,
    stepDuration: definition.moveDuration,
  });
  useAIBehavior({
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
  return (
    <PositionedActor
      friendly={controller.friendly}
      map={map}
      moveDuration={definition.moveDuration}
      movement={movement}
      name={definition.name}
      spriteSrc={definition.walkSpriteSrc}
    />
  );
}

export function MapActors({
  map,
  onActorPositionChange,
  player,
  playerPosition,
}: {
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
        map={map}
        moveDuration={player.moveDuration}
        movement={player.movement}
        name={player.name}
        spriteSrc={player.spriteSrc}
      />
    </div>
  );
}

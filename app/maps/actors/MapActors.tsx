"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { GameMap, MapActorSpawn } from "../map/types";
import { Actor } from "./Actor";
import { createAIController } from "./controllers";
import { getActorDefinition } from "./definitions";
import { useActorMovement } from "./useActorMovement";
import styles from "./MapActors.module.css";

type SpawnedActorProps = {
  map: GameMap;
  spawn: MapActorSpawn;
  x: number;
  y: number;
};

function SpawnedActor({ map, spawn, x, y }: SpawnedActorProps) {
  const definition = getActorDefinition(spawn.actorId);
  const controller = useMemo(
    () =>
      createAIController({
        friendly: definition.friendly,
        route: [],
      }),
    [definition.friendly],
  );
  const movement = useActorMovement({
    controller,
    initialDirection: spawn.direction,
    initialPosition: { x, y },
    map,
    stepDuration: 700,
  });
  const positionStyle: CSSProperties = {
    left: (movement.position.x + 0.5) * map.tileSize,
    top: (movement.position.y + 1) * map.tileSize,
    zIndex: movement.position.y + 2,
  };

  return (
    <div
      className={styles.spawn}
      data-friendly={controller.friendly ? "1" : "0"}
      style={positionStyle}
    >
      <Actor
        movement={movement}
        name={definition.name}
        spriteSrc={definition.walkSpriteSrc}
      />
    </div>
  );
}

export function MapActors({ map }: { map: GameMap }) {
  return map.actors.flatMap((row, y) =>
    row.map((spawn, x) =>
      spawn ? (
        <SpawnedActor
          key={`${spawn.actorId}:${x}:${y}`}
          map={map}
          spawn={spawn}
          x={x}
          y={y}
        />
      ) : null,
    ),
  );
}

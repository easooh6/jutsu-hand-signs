"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CHARACTERS,
  readCharacterChoice,
} from "@/components/characters";
import type { CharacterDefinition } from "@/components/characters";
import { Dialogue } from "@/components/dialogue";
import type { DialogueAnswer } from "@/components/dialogue";
import {
  Actor,
  createPlayerController,
  MapActors,
  useActorMovement,
} from "../../actors";
import type { GridPosition } from "../../actors";
import { Camera } from "../../camera";
import { readMapProject } from "../../data/client";
import eventDatabaseData from "../../data/events.json";
import {
  findEventEntityAt,
  resolveTransitDestination,
  useInteractEvent,
} from "../../events";
import type { EventDatabase, EventEntity } from "../../events";
import type { GameMap } from "../index";
import { loadGameMap } from "../serialized";
import { MapOverheadRenderer, MapRenderer } from "../MapRenderer";
import {
  findMapEventByEntityId,
  findMapEventByScript,
} from "../events";
import { entranceMap } from "./map";

const FALLBACK_POSITION: GridPosition = { x: 4, y: 4 };
const EVENT_DATABASE = eventDatabaseData as EventDatabase;

type MapSession = {
  initialPosition: GridPosition;
  map: GameMap;
  mapId: string;
  revision: number;
};

function getSpawnPosition(
  map: GameMap,
  database: EventDatabase,
): GridPosition {
  const spawn = findMapEventByScript(map, database, "spawn");
  return spawn ? { x: spawn.x, y: spawn.y } : FALLBACK_POSITION;
}

export function EntranceGame() {
  const router = useRouter();
  const [character, setCharacter] = useState<CharacterDefinition | null>(null);
  const [database, setDatabase] = useState(EVENT_DATABASE);
  const [maps, setMaps] = useState<Record<string, GameMap>>({
    entrance: entranceMap,
  });
  const [session, setSession] = useState<MapSession>(() => ({
    initialPosition: getSpawnPosition(entranceMap, EVENT_DATABASE),
    map: entranceMap,
    mapId: "entrance",
    revision: 0,
  }));

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

  useEffect(() => {
    void readMapProject()
      .then((project) => {
        const loadedMaps = Object.fromEntries(
          project.maps.map((document) => [
            document.id,
            loadGameMap(document.map),
          ]),
        );
        const loadedEntrance = loadedMaps.entrance ?? entranceMap;

        setDatabase(project.eventDatabase);
        setMaps(loadedMaps);
        setSession({
          initialPosition: getSpawnPosition(
            loadedEntrance,
            project.eventDatabase,
          ),
          map: loadedEntrance,
          mapId: "entrance",
          revision: 0,
        });
      })
      .catch(() => {
        // The statically imported entrance remains playable without the
        // development JSON filesystem endpoint.
      });
  }, []);

  const executeEvent = useCallback(
    (event: EventEntity, _answer: DialogueAnswer | null): boolean => {
      const destination = resolveTransitDestination(database, event);
      if (!destination) return false;

      const destinationMap = maps[destination.mapId];
      if (!destinationMap) return false;

      const destinationCell = findMapEventByEntityId(
        destinationMap,
        destination.id,
      );
      if (!destinationCell) return false;

      setSession((current) => ({
        initialPosition: {
          x: destinationCell.x,
          y: destinationCell.y,
        },
        map: destinationMap,
        mapId: destination.mapId,
        revision: current.revision + 1,
      }));
      return true;
    },
    [database, maps],
  );

  if (!character) {
    return null;
  }

  return (
    <EntranceSession
      character={character}
      database={database}
      initialPosition={session.initialPosition}
      key={`${session.mapId}:${session.revision}`}
      map={session.map}
      onExecute={executeEvent}
    />
  );
}

function EntranceSession({
  character,
  database,
  initialPosition,
  map,
  onExecute,
}: {
  character: CharacterDefinition;
  database: EventDatabase;
  initialPosition: GridPosition;
  map: GameMap;
  onExecute: (
    event: EventEntity,
    answer: DialogueAnswer | null,
  ) => boolean;
}) {
  const controller = useMemo(() => createPlayerController(), []);
  const [dialogueEvent, setDialogueEvent] = useState<EventEntity | null>(null);

  const executeEvent = useCallback(
    (event: EventEntity, answer: DialogueAnswer | null) => {
      return onExecute(event, answer);
    },
    [onExecute],
  );

  const triggerEvent = useCallback(
    (event: EventEntity): boolean => {
      if (event.dialogue.enabled) {
        setDialogueEvent(event);
        return false;
      }

      return !executeEvent(event, null);
    },
    [executeEvent],
  );

  const handleStepComplete = useCallback(
    (position: GridPosition) => {
      const event = findEventEntityAt(
        map,
        database,
        position,
        "step",
      );

      return event ? triggerEvent(event) : true;
    },
    [database, map, triggerEvent],
  );

  const movement = useActorMovement({
    controller,
    enabled: dialogueEvent === null,
    initialPosition,
    map,
    onStepComplete: handleStepComplete,
    stepDuration: character.moveDuration,
  });

  useInteractEvent({
    database,
    direction: movement.direction,
    enabled: dialogueEvent === null && !movement.moving,
    map,
    onTrigger: triggerEvent,
    position: movement.position,
  });

  const answerDialogue = useCallback(
    (answer: DialogueAnswer) => {
      if (!dialogueEvent) return;
      executeEvent(dialogueEvent, answer);
      setDialogueEvent(null);
    },
    [dialogueEvent, executeEvent],
  );

  return (
    <>
      <Camera
        focus={{
          x: movement.position.x * map.tileSize + map.tileSize / 2,
          y: (movement.position.y + 1) * map.tileSize,
        }}
        overlay={
          <Actor
            movement={movement}
            name={character.name}
            spriteSrc={character.walkSpriteSrc}
          />
        }
        overhead={<MapOverheadRenderer map={map} />}
        transitionDuration={character.moveDuration}
        zoom={2}
      >
        <MapRenderer map={map}>
          <MapActors map={map} />
        </MapRenderer>
      </Camera>

      {dialogueEvent && (
        <Dialogue
          no={dialogueEvent.dialogue.no}
          onAnswer={answerDialogue}
          question={dialogueEvent.dialogue.question}
          yes={dialogueEvent.dialogue.yes}
        />
      )}
    </>
  );
}

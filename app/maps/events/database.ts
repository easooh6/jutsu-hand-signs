import type { EventDatabase, EventEntity, EventScript } from "./types";

export const EMPTY_EVENT_DATABASE: EventDatabase = {
  events: [],
  nextEventId: 1,
  nextScriptId: 1,
};

export function createEventEntity(
  database: EventDatabase,
  mapId: string,
): { database: EventDatabase; event: EventEntity } {
  const event: EventEntity = {
    dialogue: {
      enabled: false,
      no: "",
      question: "",
      yes: "",
    },
    id: database.nextEventId,
    interaction: "none",
    mapId,
    scripts: [],
  };

  return {
    database: {
      events: [...database.events, event],
      nextEventId: database.nextEventId + 1,
      nextScriptId: database.nextScriptId,
    },
    event,
  };
}

export function addEventScript(
  database: EventDatabase,
  eventId: number,
  type: EventScript["type"],
): EventDatabase {
  const script: EventScript =
    type === "transit"
      ? { connectedDestinationId: null, id: database.nextScriptId, type }
      : type === "spawn"
      ? { id: database.nextScriptId, type }
      : { id: database.nextScriptId, type };

  return {
    events: database.events.map((event) =>
      event.id === eventId
        ? { ...event, scripts: [...event.scripts, script] }
        : event,
    ),
    nextEventId: database.nextEventId,
    nextScriptId: database.nextScriptId + 1,
  };
}

export function connectTransitScript(
  database: EventDatabase,
  eventId: number,
  scriptId: number,
  destinationId: number,
): EventDatabase | null {
  const source = database.events.find((event) => event.id === eventId);
  const destinationEvent = database.events.find((event) =>
    event.scripts.some(
      (script) => script.id === destinationId && script.type === "destination",
    ),
  );

  if (!source || !destinationEvent || source.mapId === destinationEvent.mapId) {
    return null;
  }

  return {
    ...database,
    events: database.events.map((event) =>
      event.id === eventId
        ? {
            ...event,
            scripts: event.scripts.map((script) =>
              script.id === scriptId && script.type === "transit"
                ? { ...script, connectedDestinationId: destinationId }
                : script,
            ),
          }
        : event,
    ),
  };
}

export function removeEventScript(
  database: EventDatabase,
  eventId: number,
  scriptId: number,
): EventDatabase {
  return {
    ...database,
    events: database.events.map((event) => ({
      ...event,
      scripts:
        event.id === eventId
          ? event.scripts.filter((script) => script.id !== scriptId)
          : event.scripts.map((script) =>
              script.type === "transit" &&
              script.connectedDestinationId === scriptId
                ? { ...script, connectedDestinationId: null }
                : script,
            ),
    })),
  };
}

export function removeEventEntity(
  database: EventDatabase,
  id: number,
): EventDatabase {
  return {
    ...database,
    events: database.events
      .filter((event) => event.id !== id)
      .map((event) =>
        ({
          ...event,
          scripts: event.scripts.map((script) =>
            script.type === "transit" &&
            database.events
              .find((candidate) => candidate.id === id)
              ?.scripts.some(
                (removedScript) =>
                  removedScript.id === script.connectedDestinationId,
              )
              ? { ...script, connectedDestinationId: null }
              : script,
          ),
        }),
      ),
  };
}

export {
  addEventScript,
  connectTransitScript,
  createEventEntity,
  EMPTY_EVENT_DATABASE,
  removeEventEntity,
  removeEventScript,
} from "./database";
export {
  findEventEntityAt,
  resolveTransitDestination,
  useInteractEvent,
} from "./runtime";
export type {
  DestinationScript,
  EventDatabase,
  EventDialogue,
  EventEntity,
  EventInteraction,
  EventScript,
  SpawnScript,
  TransitScript,
} from "./types";

export type EventInteraction = "step" | "interact" | "none";

export type EventDialogue = {
  enabled: boolean;
  no: string;
  question: string;
  yes: string;
};

export type SpawnScript = {
  id: number;
  type: "spawn";
};

export type DestinationScript = {
  id: number;
  type: "destination";
};

export type TransitScript = {
  connectedDestinationId: number | null;
  id: number;
  type: "transit";
};

export type EventScript = DestinationScript | SpawnScript | TransitScript;

export type EventEntity = {
  dialogue: EventDialogue;
  id: number;
  interaction: EventInteraction;
  mapId: string;
  scripts: EventScript[];
};

export type EventDatabase = {
  events: EventEntity[];
  nextEventId: number;
  nextScriptId: number;
};

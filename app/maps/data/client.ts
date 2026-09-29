import type { EventDatabase } from "../events";
import type { SerializedGameMap } from "../map";

const API_ROOT = "/__zjd-data";

export type MapFileDocument = {
  id: string;
  map: SerializedGameMap;
  name: string;
};

export type MapProjectData = {
  eventDatabase: EventDatabase;
  maps: MapFileDocument[];
};

async function requireSuccess(response: Response) {
  if (response.ok) return;
  const result = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  throw new Error(result?.error ?? `Request failed: ${response.status}`);
}

export async function readMapProject(): Promise<MapProjectData> {
  const response = await fetch(`${API_ROOT}/project`, { cache: "no-store" });
  await requireSuccess(response);
  return response.json() as Promise<MapProjectData>;
}

export async function saveMapJson(id: string, map: SerializedGameMap) {
  const response = await fetch(`${API_ROOT}/maps/${encodeURIComponent(id)}`, {
    body: JSON.stringify(map),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });
  await requireSuccess(response);
  return response.json() as Promise<{ id: string; name: string }>;
}

export async function createMapJson(name: string, map: SerializedGameMap) {
  const response = await fetch(`${API_ROOT}/maps/${encodeURIComponent(name)}`, {
    body: JSON.stringify(map),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  await requireSuccess(response);
  return response.json() as Promise<{ id: string; name: string }>;
}

export async function saveEventDatabaseJson(database: EventDatabase) {
  const response = await fetch(`${API_ROOT}/events`, {
    body: JSON.stringify(database),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });
  await requireSuccess(response);
}

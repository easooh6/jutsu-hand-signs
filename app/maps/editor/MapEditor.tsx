"use client";

import type {
  CSSProperties,
  PointerEvent,
} from "react";
import { useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/navigation";
import { ACTOR_DEFINITIONS } from "../actors";
import entranceData from "../data/entrance.json";
import eventDatabaseData from "../data/events.json";
import {
  createMapJson,
  readMapProject,
  saveEventDatabaseJson,
  saveMapJson,
} from "../data/client";
import type { MapFileDocument } from "../data/client";
import {
  addEventScript,
  connectTransitScript,
  createEventEntity,
  removeEventEntity,
  removeEventScript,
} from "../events";
import type {
  EventDatabase,
  EventEntity,
  EventScript,
} from "../events";
import { EventEntityModal } from "./EventEntityModal";
import { TilePalette, tilePreviewStyle } from "./TilePalette";
import type {
  EditorActor,
  EditorBrush,
  EditorEvent,
  EditorLayer,
  EditorMap,
  EditorTile,
} from "./types";
import styles from "./editor.module.css";

type MapDocument = Omit<MapFileDocument, "map"> & { map: EditorMap };

const ENTRANCE_DOCUMENT: MapDocument = {
  id: "entrance",
  map: normalizeMap(entranceData),
  name: "entrance",
};
const BASE_EVENT_DATABASE = eventDatabaseData as EventDatabase;

function grid<T>(width: number, height: number, value: () => T): T[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, value),
  );
}

function normalizeMap(source: unknown): EditorMap {
  const map = structuredClone(source) as EditorMap;
  map.actors ??= grid(map.width, map.height, () => null);
  return map;
}

function createMap(width: number, height: number): EditorMap {
  return {
    actors: grid(width, height, () => null),
    events: grid(width, height, () => []),
    ground: grid(width, height, () => null),
    height,
    objects: grid(width, height, () => null),
    overhead: grid(width, height, () => null),
    tileSize: 48,
    width,
  };
}

function resizeLayer<T>(
  layer: T[][],
  oldHeight: number,
  width: number,
  height: number,
  emptyCell: () => T,
): T[][] {
  const horizontallyResized = layer.map((row) => {
    const nextRow = row.slice(0, width);
    while (nextRow.length < width) nextRow.push(emptyCell());
    return nextRow;
  });

  if (height < oldHeight) {
    return horizontallyResized.slice(oldHeight - height);
  }

  const rowsToAdd = height - oldHeight;
  return [
    ...grid(width, rowsToAdd, emptyCell),
    ...horizontallyResized,
  ];
}

function resizeMap(current: EditorMap, width: number, height: number): EditorMap {
  return {
    ...current,
    actors: resizeLayer(
      current.actors,
      current.height,
      width,
      height,
      () => null,
    ),
    events: resizeLayer(
      current.events,
      current.height,
      width,
      height,
      () => [],
    ),
    ground: resizeLayer(
      current.ground,
      current.height,
      width,
      height,
      () => null,
    ),
    height,
    objects: resizeLayer(
      current.objects,
      current.height,
      width,
      height,
      () => null,
    ),
    overhead: resizeLayer(
      current.overhead,
      current.height,
      width,
      height,
      () => null,
    ),
    width,
  };
}

function CellTile({ tile }: { tile: EditorTile | null }) {
  if (!tile) return null;
  return <span className={styles.cellTile} style={tilePreviewStyle(tile.sheet, tile.index)} />;
}

function EventMarker({ events }: { events: readonly EditorEvent[] }) {
  if (events.length === 0) return null;
  const labels = events.map((event) => event.eventId);
  return <span className={styles.eventMarker}>{labels.join("/")}</span>;
}

function ActorMarker({ actor }: { actor: EditorActor | null }) {
  if (!actor) return null;
  const definition = ACTOR_DEFINITIONS.find(
    (candidate) => candidate.id === actor.actorId,
  );
  if (!definition) return null;

  return (
    <img
      alt={definition.name}
      className={styles.actorMarker}
      src={definition.iconSrc}
    />
  );
}

export function MapEditor() {
  const [widthInput, setWidthInput] = useState(entranceData.width);
  const [heightInput, setHeightInput] = useState(entranceData.height);
  const [map, setMap] = useState(
    () => normalizeMap(entranceData),
  );
  const [documents, setDocuments] = useState<MapDocument[]>([
    ENTRANCE_DOCUMENT,
  ]);
  const [selectedMapId, setSelectedMapId] = useState("entrance");
  const [mapsOpen, setMapsOpen] = useState(false);
  const [addingMap, setAddingMap] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [eventDatabase, setEventDatabase] = useState<EventDatabase>(
    () => structuredClone(BASE_EVENT_DATABASE),
  );
  const eventDatabaseRef = useRef<EventDatabase>(
    structuredClone(BASE_EVENT_DATABASE),
  );
  const eventSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const [contextEventId, setContextEventId] = useState<number | null>(null);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panGesture = useRef<{
    pointerId: number;
    x: number;
    y: number;
  } | null>(null);
  const [activeLayer, setActiveLayer] = useState<EditorLayer>("ground");
  const [brush, setBrush] = useState<EditorBrush>({ kind: "erase" });
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [status, setStatus] = useState("UNSAVED");

  useEffect(() => {
    void readMapProject()
      .then((project) => {
        const nextDocuments = project.maps.map((document) => ({
          ...document,
          map: normalizeMap(document.map),
        }));
        setDocuments(nextDocuments);
        eventDatabaseRef.current = project.eventDatabase;
        setEventDatabase(project.eventDatabase);

        const selected =
          nextDocuments.find((document) => document.id === selectedMapId) ??
          nextDocuments[0];
        if (selected) selectMapDocument(selected);
      })
      .catch(() => setStatus("FAILED TO READ JSON DATA"));
  }, []);

  function commitEventDatabase(database: EventDatabase) {
    eventDatabaseRef.current = database;
    setEventDatabase(database);
    eventSaveQueue.current = eventSaveQueue.current
      .then(() => saveEventDatabaseJson(database))
      .catch(() => setStatus("FAILED TO WRITE EVENTS.JSON"));
  }

  function chooseLayer(layer: EditorLayer) {
    setActiveLayer(layer);
    setBrush({ kind: "erase" });
  }

  function paint(x: number, y: number) {
    const currentCellEvents = map.events[y]?.[x] ?? [];

    if (activeLayer === "events" && brush.kind === "event") {
      if (currentCellEvents.length === 0) {
        const created = createEventEntity(
          eventDatabaseRef.current,
          selectedMapId,
        );
        commitEventDatabase(created.database);
        setMap((current) => {
          const next = structuredClone(current);
          next.events[y]![x] = [
            {
              eventId: created.event.id,
              id: `event-${created.event.id}`,
              type: "entity",
            },
          ];
          return next;
        });
      }

      setStatus("UNSAVED");
      return;
    }

    if (activeLayer === "events" && brush.kind === "erase") {
      let nextDatabase = eventDatabaseRef.current;
      for (const event of currentCellEvents) {
        nextDatabase = removeEventEntity(nextDatabase, event.eventId);
      }
      if (currentCellEvents.length > 0) commitEventDatabase(nextDatabase);
    }

    setMap((current) => {
      const next = structuredClone(current);

      if (activeLayer === "events") {
        if (brush.kind === "erase") {
          next.events[y]![x] = [];
        }
      } else if (activeLayer === "actors" && brush.kind === "actor") {
        next.actors[y]![x] = brush.actor;
      } else if (activeLayer === "actors" && brush.kind === "erase") {
        next.actors[y]![x] = null;
      } else if (
        activeLayer !== "actors" &&
        brush.kind === "tile"
      ) {
        next[activeLayer][y]![x] = brush.tile;
      } else if (activeLayer !== "actors" && brush.kind === "erase") {
        next[activeLayer][y]![x] = null;
      }

      return next;
    });
    setStatus("UNSAVED");
  }

  function dragPaint(event: PointerEvent<HTMLButtonElement>, x: number, y: number) {
    if (event.buttons === 1) paint(x, y);
  }

  function beginPan(event: PointerEvent<HTMLElement>) {
    if (event.button !== 1) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    panGesture.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    setIsPanning(true);
  }

  function movePan(event: PointerEvent<HTMLElement>) {
    const gesture = panGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - gesture.x;
    const deltaY = event.clientY - gesture.y;
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    setCameraOffset((current) => ({
      x: current.x + deltaX,
      y: current.y + deltaY,
    }));
  }

  function endPan(event: PointerEvent<HTMLElement>) {
    if (panGesture.current?.pointerId !== event.pointerId) return;
    panGesture.current = null;
    setIsPanning(false);
  }

  function changeWidth(value: number) {
    if (!Number.isFinite(value)) return;
    const width = Math.min(40, Math.max(1, Math.floor(value)));
    setWidthInput(width);
    setMap((current) => resizeMap(current, width, current.height));
    setStatus("RESIZED RIGHT");
  }

  function changeHeight(value: number) {
    if (!Number.isFinite(value)) return;
    const height = Math.min(40, Math.max(1, Math.floor(value)));
    setHeightInput(height);
    setMap((current) => resizeMap(current, current.width, height));
    setStatus("RESIZED TOP");
  }

  async function saveMap() {
    setStatus("SAVING JSON...");
    try {
      await saveMapJson(selectedMapId, map);
      setDocuments((current) =>
        current.map((document) =>
          document.id === selectedMapId
            ? { ...document, map: structuredClone(map) }
            : document,
        ),
      );
      setStatus("JSON SAVED");
    } catch {
      setStatus("FAILED TO WRITE MAP JSON");
    }
  }

  function selectMapDocument(document: MapDocument) {
    setSelectedMapId(document.id);
    setMap(structuredClone(document.map));
    setWidthInput(document.map.width);
    setHeightInput(document.map.height);
    setMapsOpen(false);
    setAddingMap(false);
    setStatus(`OPENED ${document.name.toUpperCase()}`);
  }

  async function createNamedMap() {
    const name = newMapName.trim();
    if (!name) return;

    try {
      const newMap = createMap(widthInput, heightInput);
      const created = await createMapJson(name, newMap);
      const document: MapDocument = { ...created, map: newMap };
      setDocuments((current) => [...current, document]);
      setNewMapName("");
      selectMapDocument(document);
      setStatus(`CREATED ${created.name.toUpperCase()}.JSON`);
    } catch {
      setStatus("FAILED TO CREATE MAP JSON");
    }
  }

  async function copyMap() {
    await navigator.clipboard.writeText(JSON.stringify(map, null, 2));
    setStatus("JSON COPIED");
  }

  function openEventModal(events: readonly EditorEvent[]) {
    const event = events[0];
    if (event) setContextEventId(event.eventId);
  }

  function updateEventDefinition(updated: EventEntity) {
    commitEventDatabase({
      ...eventDatabaseRef.current,
      events: eventDatabaseRef.current.events.map((event) =>
        event.id === updated.id ? updated : event,
      ),
    });
    setStatus(`EVENT #${updated.id} UPDATED`);
  }

  function addScript(type: EventScript["type"]) {
    if (contextEventId === null) return;
    const nextDatabase = addEventScript(
      eventDatabaseRef.current,
      contextEventId,
      type,
    );
    commitEventDatabase(nextDatabase);
    setStatus(`${type.toUpperCase()} ADDED TO EVENT #${contextEventId}`);
  }

  function connectEvent(scriptId: number, targetId: number) {
    if (contextEventId === null) return;
    const connected = connectTransitScript(
      eventDatabaseRef.current,
      contextEventId,
      scriptId,
      targetId,
    );

    if (!connected) {
      setStatus("CONNECT REQUIRES DESTINATION ON ANOTHER MAP");
      return;
    }

    commitEventDatabase(connected);
    setStatus(`TRANSIT CONNECTED TO DESTINATION #${targetId}`);
  }

  function deleteScript(scriptId: number) {
    if (contextEventId === null) return;
    commitEventDatabase(
      removeEventScript(eventDatabaseRef.current, contextEventId, scriptId),
    );
    setStatus(`SCRIPT #${scriptId} DELETED`);
  }

  const canvasStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${map.width}, 48px)`,
    gridTemplateRows: `repeat(${map.height}, 48px)`,
    transform: `translate(-50%, -50%) translate(${cameraOffset.x}px, ${cameraOffset.y}px)`,
  };
  const inspectedCell = hoveredCell
    ? {
        actor: map.actors[hoveredCell.y]?.[hoveredCell.x] ?? null,
        events: map.events[hoveredCell.y]?.[hoveredCell.x] ?? [],
        ground: map.ground[hoveredCell.y]?.[hoveredCell.x] ?? null,
        objects: map.objects[hoveredCell.y]?.[hoveredCell.x] ?? null,
        overhead: map.overhead[hoveredCell.y]?.[hoveredCell.x] ?? null,
      }
    : null;
  const tileName = (tile: EditorTile | null) =>
    tile ? `${tile.sheet} #${tile.index}` : "EMPTY";
  const actorName = (actor: EditorActor | null) =>
    actor
      ? ACTOR_DEFINITIONS.find((candidate) => candidate.id === actor.actorId)
          ?.name ?? actor.actorId
      : "EMPTY";
  const selectedMapName =
    documents.find((document) => document.id === selectedMapId)?.name ??
    "entrance";
  const contextEvent =
    contextEventId === null
      ? null
      : eventDatabase.events.find((event) => event.id === contextEventId) ??
        null;

  return (
    <main className={styles.editor}>
      <BackButton href="/" />
      <header className={styles.header}>
        <h1>MAP EDITOR</h1>
        <div className={styles.createControls}>
          <label>
            W
            <input
              max={40}
              min={1}
              onChange={(event) => changeWidth(Number(event.target.value))}
              type="number"
              value={widthInput}
            />
          </label>
          <label>
            H
            <input
              max={40}
              min={1}
              onChange={(event) => changeHeight(Number(event.target.value))}
              type="number"
              value={heightInput}
            />
          </label>
          <div className={styles.mapSelector}>
            <button
              aria-expanded={mapsOpen}
              onClick={() => setMapsOpen((open) => !open)}
              type="button"
            >
              MAP: {selectedMapName} ▾
            </button>
            {mapsOpen && (
              <div className={styles.mapDropdown}>
                <div className={styles.mapList}>
                  {documents.map((document) => (
                    <button
                      className={
                        document.id === selectedMapId
                          ? styles.selectedMap
                          : styles.mapOption
                      }
                      key={document.id}
                      onClick={() => selectMapDocument(document)}
                      type="button"
                    >
                      {document.name}
                    </button>
                  ))}
                </div>
                {addingMap ? (
                  <input
                    autoFocus
                    className={styles.newMapInput}
                    onChange={(event) => setNewMapName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") createNamedMap();
                      if (event.key === "Escape") setAddingMap(false);
                    }}
                    placeholder="MAP NAME + ENTER"
                    value={newMapName}
                  />
                ) : (
                  <button
                    className={styles.addMap}
                    onClick={() => setAddingMap(true)}
                    type="button"
                  >
                    +
                  </button>
                )}
              </div>
            )}
          </div>
          <button onClick={saveMap} type="button">SAVE</button>
          <button onClick={copyMap} type="button">COPY JSON</button>
          <output>{status}</output>
        </div>
      </header>

      <section className={styles.inspector} aria-live="polite">
        <strong>
          CURSOR {hoveredCell ? `${hoveredCell.x}, ${hoveredCell.y}` : "—"}
        </strong>
        <span>GROUND: {tileName(inspectedCell?.ground ?? null)}</span>
        <span>OBJECTS: {tileName(inspectedCell?.objects ?? null)}</span>
        <span>OVERHEAD: {tileName(inspectedCell?.overhead ?? null)}</span>
        <span>ACTOR: {actorName(inspectedCell?.actor ?? null)}</span>
        <span>
          EVENTS:{" "}
          {inspectedCell?.events.length
            ? inspectedCell.events
                .map((event) => `#${event.eventId}`)
                .join(", ")
            : "EMPTY"}
        </span>
      </section>

      <div className={styles.workspace}>
        <TilePalette
          activeLayer={activeLayer}
          brush={brush}
          onBrushChange={setBrush}
          onLayerChange={chooseLayer}
        />

        <section
          className={`${styles.canvasScroll} ${isPanning ? styles.panning : ""}`}
          aria-label="Map canvas"
          onAuxClick={(event) => event.preventDefault()}
          onPointerCancel={endPan}
          onPointerDown={beginPan}
          onPointerLeave={() => setHoveredCell(null)}
          onPointerMove={movePan}
          onPointerUp={endPan}
        >
          <div className={styles.canvas} style={canvasStyle}>
            {Array.from({ length: map.height }, (_, y) =>
              Array.from({ length: map.width }, (_, x) => (
                <button
                  className={styles.cell}
                  key={`${x}:${y}`}
                  onPointerDown={(event) => {
                    if (event.button === 0) paint(x, y);
                  }}
                  onPointerEnter={(event) => {
                    setHoveredCell({ x, y });
                    dragPaint(event, x, y);
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    openEventModal(map.events[y]![x]!);
                  }}
                  title={`${x}, ${y}`}
                  type="button"
                >
                  <CellTile tile={map.ground[y]![x]!} />
                  <CellTile tile={map.objects[y]![x]!} />
                  <CellTile tile={map.overhead[y]![x]!} />
                  <ActorMarker actor={map.actors[y]![x]!} />
                  <EventMarker events={map.events[y]![x]!} />
                </button>
              )),
            )}
          </div>
          <span className={styles.panHint}>HOLD MIDDLE MOUSE — PAN</span>
        </section>
      </div>

      {contextEvent && (
        <EventEntityModal
          event={contextEvent}
          onAddScript={addScript}
          onClose={() => setContextEventId(null)}
          onConnect={connectEvent}
          onDeleteScript={deleteScript}
          onUpdate={updateEventDefinition}
        />
      )}
    </main>
  );
}

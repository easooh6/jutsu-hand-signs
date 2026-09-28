"use client";

import type { CSSProperties, PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/navigation";
import entranceData from "../data/entrance.json";
import { TilePalette, tilePreviewStyle } from "./TilePalette";
import type {
  EditorBrush,
  EditorEvent,
  EditorLayer,
  EditorMap,
  EditorTile,
} from "./types";
import styles from "./editor.module.css";

const STORAGE_KEY = "zjd-map-editor-maps";

type MapDocument = {
  id: string;
  map: EditorMap;
  name: string;
};

const ENTRANCE_DOCUMENT: MapDocument = {
  id: "entrance",
  map: entranceData as EditorMap,
  name: "entrance",
};

function grid<T>(width: number, height: number, value: () => T): T[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, value),
  );
}

function createMap(width: number, height: number): EditorMap {
  return {
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
  if (!events.some((event) => event.type === "player-spawn")) return null;
  return <span className={styles.eventMarker}>P</span>;
}

export function MapEditor() {
  const [widthInput, setWidthInput] = useState(entranceData.width);
  const [heightInput, setHeightInput] = useState(entranceData.height);
  const [map, setMap] = useState(
    () => structuredClone(entranceData) as EditorMap,
  );
  const [documents, setDocuments] = useState<MapDocument[]>([
    ENTRANCE_DOCUMENT,
  ]);
  const [selectedMapId, setSelectedMapId] = useState("entrance");
  const [mapsOpen, setMapsOpen] = useState(false);
  const [addingMap, setAddingMap] = useState(false);
  const [newMapName, setNewMapName] = useState("");
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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as MapDocument[];
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      const entrance = parsed.find((document) => document.id === "entrance");
      const nextDocuments = entrance
        ? parsed
        : [ENTRANCE_DOCUMENT, ...parsed];
      setDocuments(nextDocuments);

      const selected = nextDocuments.find(
        (document) => document.id === selectedMapId,
      );
      if (selected) selectMapDocument(selected);
    } catch {
      setStatus("INVALID MAP STORAGE");
    }
  }, []);

  function chooseLayer(layer: EditorLayer) {
    setActiveLayer(layer);
    setBrush({ kind: "erase" });
  }

  function paint(x: number, y: number) {
    setMap((current) => {
      const next = structuredClone(current);

      if (activeLayer === "events") {
        if (brush.kind === "event") {
          for (const row of next.events) {
            for (let column = 0; column < row.length; column += 1) {
              row[column] = row[column]!.filter(
                (event) => event.type !== "player-spawn",
              );
            }
          }
          next.events[y]![x] = [brush.event];
        } else if (brush.kind === "erase") {
          next.events[y]![x] = [];
        }
      } else if (brush.kind === "tile") {
        next[activeLayer][y]![x] = brush.tile;
      } else if (brush.kind === "erase") {
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

  function saveMap() {
    const nextDocuments = documents.map((document) =>
      document.id === selectedMapId
        ? { ...document, map: structuredClone(map) }
        : document,
    );
    setDocuments(nextDocuments);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDocuments));
    setStatus("SAVED");
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

  function createNamedMap() {
    const name = newMapName.trim();
    if (!name) return;

    const document: MapDocument = {
      id: `${name.toLowerCase().replace(/[^a-z0-9_-]+/g, "-") || "map"}-${Date.now()}`,
      map: createMap(widthInput, heightInput),
      name,
    };
    const nextDocuments = [...documents, document];
    setDocuments(nextDocuments);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDocuments));
    setNewMapName("");
    selectMapDocument(document);
    setStatus(`CREATED ${name.toUpperCase()}`);
  }

  async function copyMap() {
    await navigator.clipboard.writeText(JSON.stringify(map, null, 2));
    setStatus("JSON COPIED");
  }

  const canvasStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${map.width}, 48px)`,
    gridTemplateRows: `repeat(${map.height}, 48px)`,
    transform: `translate(-50%, -50%) translate(${cameraOffset.x}px, ${cameraOffset.y}px)`,
  };
  const inspectedCell = hoveredCell
    ? {
        events: map.events[hoveredCell.y]?.[hoveredCell.x] ?? [],
        ground: map.ground[hoveredCell.y]?.[hoveredCell.x] ?? null,
        objects: map.objects[hoveredCell.y]?.[hoveredCell.x] ?? null,
        overhead: map.overhead[hoveredCell.y]?.[hoveredCell.x] ?? null,
      }
    : null;
  const tileName = (tile: EditorTile | null) =>
    tile ? `${tile.sheet} #${tile.index}` : "EMPTY";
  const selectedMapName =
    documents.find((document) => document.id === selectedMapId)?.name ??
    "entrance";

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
        <span>
          EVENTS:{" "}
          {inspectedCell?.events.length
            ? inspectedCell.events.map((event) => event.type).join(", ")
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
                  title={`${x}, ${y}`}
                  type="button"
                >
                  <CellTile tile={map.ground[y]![x]!} />
                  <CellTile tile={map.objects[y]![x]!} />
                  <CellTile tile={map.overhead[y]![x]!} />
                  <EventMarker events={map.events[y]![x]!} />
                </button>
              )),
            )}
          </div>
          <span className={styles.panHint}>HOLD MIDDLE MOUSE — PAN</span>
        </section>
      </div>
    </main>
  );
}

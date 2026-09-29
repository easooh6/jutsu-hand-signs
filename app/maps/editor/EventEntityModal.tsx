"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import { useState } from "react";
import {
  PixelContextMenu,
  useContextMenu,
} from "@/components/context-menu";
import type {
  EventEntity,
  EventInteraction,
  EventScript,
} from "../events";
import styles from "./editor.module.css";

type EventEntityModalProps = {
  event: EventEntity;
  onAddScript: (type: EventScript["type"]) => void;
  onClose: () => void;
  onConnect: (scriptId: number, destinationId: number) => void;
  onDeleteScript: (scriptId: number) => void;
  onUpdate: (event: EventEntity) => void;
};

export function EventEntityModal({
  event,
  onAddScript,
  onClose,
  onConnect,
  onDeleteScript,
  onUpdate,
}: EventEntityModalProps) {
  const [addingScript, setAddingScript] = useState(false);
  const [contextScript, setContextScript] = useState<EventScript | null>(null);
  const [connectScriptId, setConnectScriptId] = useState<number | null>(null);
  const [targetEventId, setTargetEventId] = useState("");
  const scriptMenu = useContextMenu();

  function openScriptMenu(
    pointerEvent: ReactMouseEvent<HTMLButtonElement>,
    script: EventScript,
  ) {
    setContextScript(script);
    setTargetEventId(
      script.type === "transit"
        ? script.connectedDestinationId?.toString() ?? ""
        : "",
    );
    scriptMenu.openContextMenu(pointerEvent);
  }

  function setInteraction(interaction: EventInteraction) {
    onUpdate({ ...event, interaction });
  }

  return (
    <div
      className={styles.eventModalBackdrop}
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) onClose();
      }}
    >
      <section
        aria-label={`Event ${event.id}`}
        aria-modal="true"
        className={styles.eventModal}
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
        role="dialog"
      >
        <header className={styles.eventModalHeader}>
          <div>
            <small>EVENT ENTITY</small>
            <strong>#{event.id}</strong>
          </div>
          <button onClick={onClose} type="button">×</button>
        </header>

        <div className={styles.scriptSection}>
          <div className={styles.scriptSectionHeader}>
            <h2>SCRIPTS</h2>
            <button
              aria-expanded={addingScript}
              onClick={() => setAddingScript((open) => !open)}
              type="button"
            >
              +
            </button>
          </div>

          {addingScript && (
            <div className={styles.addScriptMenu}>
              <button
                onClick={() => {
                  onAddScript("spawn");
                  setAddingScript(false);
                }}
                type="button"
              >
                SPAWN
              </button>
              <button
                onClick={() => {
                  onAddScript("transit");
                  setAddingScript(false);
                }}
                type="button"
              >
                TRANSIT
              </button>
              <button
                onClick={() => {
                  onAddScript("destination");
                  setAddingScript(false);
                }}
                type="button"
              >
                DESTINATION
              </button>
            </div>
          )}

          <div className={styles.scriptList}>
            {event.scripts.length === 0 ? (
              <span className={styles.emptyScripts}>NO SCRIPTS</span>
            ) : (
              event.scripts.map((script) => (
                <button
                  className={styles.scriptItem}
                  key={script.id}
                  onContextMenu={(pointerEvent) =>
                    openScriptMenu(pointerEvent, script)
                  }
                  title={
                    script.type === "transit"
                      ? "Right click to connect"
                      : "Right click to delete"
                  }
                  type="button"
                >
                  <strong>{script.type.toUpperCase()}</strong>
                  <span>
                    {script.type === "transit"
                      ? script.connectedDestinationId
                        ? `→ DESTINATION #${script.connectedDestinationId}`
                        : "NOT CONNECTED"
                      : script.type === "destination"
                        ? `DESTINATION ID #${script.id}`
                        : "PLAYER SPAWN"}
                  </span>
                </button>
              ))
            )}
          </div>

          {connectScriptId !== null && (
            <label className={styles.connectEditor}>
              CONNECT TRANSIT TO DESTINATION ID
              <input
                inputMode="numeric"
                onChange={(inputEvent) => setTargetEventId(inputEvent.target.value)}
                onKeyDown={(keyboardEvent) => {
                  if (keyboardEvent.key !== "Enter") return;
                  const parsed = Number(targetEventId);
                  if (Number.isInteger(parsed)) {
                    onConnect(connectScriptId, parsed);
                  }
                }}
                placeholder="ID + ENTER"
                value={targetEventId}
              />
            </label>
          )}
        </div>

        <div className={styles.eventConfiguration}>
          <div className={styles.interactionSettings}>
            <h2>EVENT TYPE</h2>
            {(["step", "interact", "none"] as const).map((interaction) => (
              <button
                className={
                  event.interaction === interaction ? styles.selectedSetting : ""
                }
                key={interaction}
                onClick={() => setInteraction(interaction)}
                type="button"
              >
                {interaction === "step"
                  ? "ON STEP"
                  : interaction === "interact"
                    ? "ON INTERACT"
                    : "NO INTERACTION"}
              </button>
            ))}
          </div>

          <div className={styles.dialogueSettings}>
            <h2>DIALOGUE</h2>
            <label className={styles.dialogueToggle}>
              <input
                checked={event.dialogue.enabled}
                onChange={(inputEvent) =>
                  onUpdate({
                    ...event,
                    dialogue: {
                      ...event.dialogue,
                      enabled: inputEvent.target.checked,
                    },
                  })
                }
                type="checkbox"
              />
              {event.dialogue.enabled ? "ON" : "OFF"}
            </label>
            {(["question", "yes", "no"] as const).map((field) => (
              <label key={field}>
                {field.toUpperCase()}
                <input
                  disabled={!event.dialogue.enabled}
                  onChange={(inputEvent) =>
                    onUpdate({
                      ...event,
                      dialogue: {
                        ...event.dialogue,
                        [field]: inputEvent.target.value,
                      },
                    })
                  }
                  value={event.dialogue[field]}
                />
              </label>
            ))}
          </div>
        </div>
      </section>

      <PixelContextMenu
        items={[
          ...(contextScript?.type === "transit"
            ? [
                {
                  id: "connect",
                  label: "CONNECT",
                  onSelect: () => setConnectScriptId(contextScript.id),
                },
              ]
            : []),
          {
            danger: true,
            id: "delete",
            label: "DELETE",
            onSelect: () => {
              if (contextScript) onDeleteScript(contextScript.id);
              setConnectScriptId(null);
            },
            separatorBefore: contextScript?.type === "transit",
          },
        ]}
        onClose={scriptMenu.closeContextMenu}
        position={scriptMenu.contextMenuPosition}
      />
    </div>
  );
}

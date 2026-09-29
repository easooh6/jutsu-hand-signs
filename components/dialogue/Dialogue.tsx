"use client";

import { useEffect, useState } from "react";
import { useHandConfirm } from "@/components/hand-camera";
import styles from "./Dialogue.module.css";

export type DialogueAnswer = "yes" | "no";

type DialogueProps = {
  no: string;
  onAnswer: (answer: DialogueAnswer) => void;
  question: string;
  yes: string;
};

export function Dialogue({
  no,
  onAnswer,
  question,
  yes,
}: DialogueProps) {
  const [selected, setSelected] = useState<DialogueAnswer>("yes");

  useHandConfirm(() => onAnswer(selected));

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat) return;

      if (
        event.code === "ArrowLeft" ||
        event.code === "ArrowRight" ||
        event.code === "KeyA" ||
        event.code === "KeyD"
      ) {
        event.preventDefault();
        setSelected((current) => (current === "yes" ? "no" : "yes"));
      }

    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={styles.backdrop}>
      <section aria-modal="true" className={styles.dialogue} role="dialog">
        <p>{question || "..."}</p>
        <div className={styles.answers}>
          <button
            className={selected === "yes" ? styles.selected : undefined}
            onClick={() => onAnswer("yes")}
            onMouseEnter={() => setSelected("yes")}
            type="button"
          >
            {yes || "YES"}
          </button>
          <button
            className={selected === "no" ? styles.selected : undefined}
            onClick={() => onAnswer("no")}
            onMouseEnter={() => setSelected("no")}
            type="button"
          >
            {no || "NO"}
          </button>
        </div>
        <small>← → SELECT · FIST CONFIRM</small>
      </section>
    </div>
  );
}

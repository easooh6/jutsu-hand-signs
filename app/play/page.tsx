import { CharacterRoster } from "@/components/characters";
import { BackButton } from "@/components/navigation";
import styles from "./play.module.css";

export default function PlayPage() {
  return (
    <main className={styles.characterSelect} aria-labelledby="character-title">
      <div className={styles.backdrop} aria-hidden="true" />
      <div className={styles.veil} aria-hidden="true" />

      <header className={styles.header}>
        <BackButton />
        <h1 id="character-title">CHOOSE YOUR CHARACTER</h1>
      </header>

      <CharacterRoster />
    </main>
  );
}

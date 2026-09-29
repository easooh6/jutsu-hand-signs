import { BackButton } from "@/components/navigation";
import { SpellGuide } from "@/components/spells";
import styles from "./guide.module.css";

export default function GuidePage() {
  return (
    <main className={styles.guide} aria-labelledby="guide-title">
      <div className={styles.backdrop} aria-hidden="true" />
      <div className={styles.veil} aria-hidden="true" />

      <header className={styles.header}>
        <BackButton />
        <h1 id="guide-title">JUTSU GUIDE</h1>
      </header>

      <SpellGuide className={styles.spellGrid} />
    </main>
  );
}

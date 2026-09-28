import { EntranceGame } from "./EntranceGame";
import styles from "./entrance.module.css";

export default function Entrance() {
  return (
    <main className={styles.screen}>
      <EntranceGame />
    </main>
  );
}

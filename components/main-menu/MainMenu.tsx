import { MenuButton } from "./MenuButton";
import styles from "./MainMenu.module.css";

export function MainMenu() {
  return (
    <nav className={styles.menu} aria-label="Main menu">
      <MenuButton href="/play">PLAY</MenuButton>
      <MenuButton href="/guide">GUIDE</MenuButton>
      <MenuButton href="/maps/editor">MAP EDITOR</MenuButton>
    </nav>
  );
}

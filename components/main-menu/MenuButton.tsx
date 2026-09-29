import type { ReactNode } from "react";
import { TransitionLink } from "@/components/screen-transition";
import styles from "./MainMenu.module.css";

type MenuButtonProps = {
  children: ReactNode;
  href?: string;
};

export function MenuButton({ children, href }: MenuButtonProps) {
  if (href) {
    return (
      <TransitionLink className={styles.button} href={href}>
        {children}
      </TransitionLink>
    );
  }

  return (
    <button className={styles.button} type="button">
      {children}
    </button>
  );
}

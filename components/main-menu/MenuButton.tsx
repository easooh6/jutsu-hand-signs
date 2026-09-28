import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./MainMenu.module.css";

type MenuButtonProps = {
  children: ReactNode;
  href?: string;
};

export function MenuButton({ children, href }: MenuButtonProps) {
  if (href) {
    return (
      <Link className={styles.button} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={styles.button} type="button">
      {children}
    </button>
  );
}

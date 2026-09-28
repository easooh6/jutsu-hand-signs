import Link from "next/link";
import styles from "./BackButton.module.css";

type BackButtonProps = {
  href?: string;
  label?: string;
};

export function BackButton({ href = "/", label = "BACK" }: BackButtonProps) {
  return (
    <Link className={styles.backButton} href={href}>
      &lt; {label}
    </Link>
  );
}

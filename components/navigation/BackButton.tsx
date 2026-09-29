import { TransitionLink } from "@/components/screen-transition";
import styles from "./BackButton.module.css";

type BackButtonProps = {
  href?: string;
  label?: string;
};

export function BackButton({ href = "/", label = "BACK" }: BackButtonProps) {
  return (
    <TransitionLink className={styles.backButton} href={href}>
      &lt; {label}
    </TransitionLink>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { useScreenTransition } from "./ScreenTransitionProvider";

type TransitionLinkProps = ComponentProps<typeof Link>;

export function TransitionLink({ href, onClick, ...props }: TransitionLinkProps) {
  const router = useRouter();
  const { isTransitioning, runTransition } = useScreenTransition();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    if (isTransitioning) return;

    void runTransition(() => {
      router.push(href.toString());
    });
  }

  return <Link {...props} href={href} onClick={handleClick} />;
}

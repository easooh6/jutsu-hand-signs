"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { useScreenTransition } from "./ScreenTransitionProvider";

type TransitionLinkProps = ComponentProps<typeof Link>;

const ROUTER_NAVIGATION_TIMEOUT_MS = 300;

function waitForNavigation(destination: string) {
  const targetUrl = new URL(destination, window.location.href).href;
  const startedAt = performance.now();

  return new Promise<void>((resolve) => {
    function checkLocation() {
      if (window.location.href === targetUrl) {
        resolve();
        return;
      }

      if (performance.now() - startedAt >= ROUTER_NAVIGATION_TIMEOUT_MS) {
        window.location.assign(targetUrl);
        return;
      }

      window.requestAnimationFrame(checkLocation);
    }

    window.requestAnimationFrame(checkLocation);
  });
}

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

    void runTransition(async () => {
      const destination = href.toString();
      router.push(destination);
      await waitForNavigation(destination);
    });
  }

  return <Link {...props} href={href} onClick={handleClick} />;
}

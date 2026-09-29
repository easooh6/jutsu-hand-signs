"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useState } from "react";
import type { ContextMenuPosition } from "./types";

export function useContextMenu() {
  const [position, setPosition] = useState<ContextMenuPosition | null>(null);

  const openContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      event.preventDefault();
      setPosition({ x: event.clientX, y: event.clientY });
    },
    [],
  );

  const closeContextMenu = useCallback(() => setPosition(null), []);

  return {
    closeContextMenu,
    contextMenuPosition: position,
    isContextMenuOpen: position !== null,
    openContextMenu,
  };
}

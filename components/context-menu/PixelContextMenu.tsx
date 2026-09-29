"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ContextMenuItem, ContextMenuPosition } from "./types";
import styles from "./PixelContextMenu.module.css";

type PixelContextMenuProps = {
  items: readonly ContextMenuItem[];
  onClose: () => void;
  position: ContextMenuPosition | null;
};

const VIEWPORT_MARGIN = 8;

export function PixelContextMenu({
  items,
  onClose,
  position,
}: PixelContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] =
    useState<ContextMenuPosition | null>(position);

  useLayoutEffect(() => {
    if (!position || !menuRef.current) {
      setAdjustedPosition(position);
      return;
    }

    const bounds = menuRef.current.getBoundingClientRect();
    setAdjustedPosition({
      x: Math.max(
        VIEWPORT_MARGIN,
        Math.min(position.x, window.innerWidth - bounds.width - VIEWPORT_MARGIN),
      ),
      y: Math.max(
        VIEWPORT_MARGIN,
        Math.min(position.y, window.innerHeight - bounds.height - VIEWPORT_MARGIN),
      ),
    });
  }, [items, position]);

  useEffect(() => {
    if (!position) return;

    function closeOnPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    }

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);

    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose, position]);

  if (!position || !adjustedPosition || typeof document === "undefined") {
    return null;
  }

  function moveFocus(event: KeyboardEvent<HTMLDivElement>, offset: number) {
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        'button:not([disabled])',
      ),
    );
    if (buttons.length === 0) return;

    const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + offset + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(event, 1);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(event, -1);
    }
  }

  const menuStyle: CSSProperties = {
    left: adjustedPosition.x,
    top: adjustedPosition.y,
  };

  return createPortal(
    <div
      aria-label="Context menu"
      className={styles.menu}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={handleKeyDown}
      ref={menuRef}
      role="menu"
      style={menuStyle}
    >
      {items.map((item) => (
        <div
          className={item.separatorBefore ? styles.separated : undefined}
          key={item.id}
          role="none"
        >
          <button
            className={item.danger ? styles.dangerItem : styles.item}
            disabled={item.disabled}
            onClick={() => {
              item.onSelect();
              onClose();
            }}
            role="menuitem"
            type="button"
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

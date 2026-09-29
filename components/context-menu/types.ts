export type ContextMenuItem = {
  danger?: boolean;
  disabled?: boolean;
  id: string;
  label: string;
  onSelect: () => void;
  separatorBefore?: boolean;
};

export type ContextMenuPosition = {
  x: number;
  y: number;
};

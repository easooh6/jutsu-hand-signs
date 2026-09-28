export type WalkDirection = "down" | "left" | "right" | "up";

export type WalkAction = "idle" | "walk";

export type WalkSpriteProps = {
  action?: WalkAction;
  alt: string;
  cycle?: number;
  direction?: WalkDirection;
  scale?: number;
  src: string;
};

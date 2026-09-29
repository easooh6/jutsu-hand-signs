import type { AStarGrid, AStarOptions, PathPoint } from "./types";

type OpenNode = {
  f: number;
  g: number;
  h: number;
  index: number;
  order: number;
};

const NEIGHBORS = [
  { x: 0, y: -1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
] as const;

function compare(left: OpenNode, right: OpenNode): number {
  return left.f - right.f || left.h - right.h || left.order - right.order;
}

class MinHeap {
  private readonly nodes: OpenNode[] = [];

  get size() {
    return this.nodes.length;
  }

  push(node: OpenNode) {
    this.nodes.push(node);
    let index = this.nodes.length - 1;

    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (compare(this.nodes[parent]!, node) <= 0) break;
      this.nodes[index] = this.nodes[parent]!;
      index = parent;
    }

    this.nodes[index] = node;
  }

  pop(): OpenNode | null {
    const first = this.nodes[0];
    const last = this.nodes.pop();
    if (!first || !last) return first ?? null;
    if (this.nodes.length === 0) return first;

    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= this.nodes.length) break;

      const child =
        right < this.nodes.length &&
        compare(this.nodes[right]!, this.nodes[left]!) < 0
          ? right
          : left;
      if (compare(last, this.nodes[child]!) <= 0) break;
      this.nodes[index] = this.nodes[child]!;
      index = child;
    }

    this.nodes[index] = last;
    return first;
  }
}

function manhattan(from: PathPoint, to: PathPoint): number {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

function isInside(grid: AStarGrid, point: PathPoint): boolean {
  return (
    Number.isInteger(point.x) &&
    Number.isInteger(point.y) &&
    point.x >= 0 &&
    point.y >= 0 &&
    point.x < grid.width &&
    point.y < grid.height
  );
}

function restorePath(
  cameFrom: Int32Array,
  endIndex: number,
  width: number,
): PathPoint[] {
  const path: PathPoint[] = [];
  let index = endIndex;

  while (index >= 0) {
    path.push({ x: index % width, y: Math.floor(index / width) });
    index = cameFrom[index]!;
  }

  return path.reverse();
}

/** Returns a shortest orthogonal path including both start and goal. */
export function findAStarPath(
  grid: AStarGrid,
  start: PathPoint,
  goal: PathPoint,
  options: AStarOptions = {},
): PathPoint[] | null {
  if (
    !Number.isInteger(grid.width) ||
    !Number.isInteger(grid.height) ||
    grid.width <= 0 ||
    grid.height <= 0 ||
    !isInside(grid, start) ||
    !isInside(grid, goal)
  ) {
    return null;
  }

  const total = grid.width * grid.height;
  const startIndex = start.y * grid.width + start.x;
  const goalIndex = goal.y * grid.width + goal.x;
  if (startIndex === goalIndex) return [{ ...start }];
  if (!grid.isWalkable(goal.x, goal.y)) return null;

  const maxVisited = Math.max(0, options.maxVisited ?? total);
  const cameFrom = new Int32Array(total);
  cameFrom.fill(-1);
  const scores = new Float64Array(total);
  scores.fill(Number.POSITIVE_INFINITY);
  scores[startIndex] = 0;
  const closed = new Uint8Array(total);
  const open = new MinHeap();
  let insertionOrder = 0;
  const startHeuristic = manhattan(start, goal);
  open.push({
    f: startHeuristic,
    g: 0,
    h: startHeuristic,
    index: startIndex,
    order: insertionOrder,
  });
  let visited = 0;

  while (open.size > 0 && visited < maxVisited) {
    const current = open.pop()!;
    if (closed[current.index] || current.g !== scores[current.index]) continue;
    if (current.index === goalIndex) {
      return restorePath(cameFrom, goalIndex, grid.width);
    }

    closed[current.index] = 1;
    visited += 1;
    const currentX = current.index % grid.width;
    const currentY = Math.floor(current.index / grid.width);

    for (const offset of NEIGHBORS) {
      const x = currentX + offset.x;
      const y = currentY + offset.y;
      if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) continue;

      const neighborIndex = y * grid.width + x;
      if (closed[neighborIndex] || !grid.isWalkable(x, y)) continue;

      const score = current.g + 1;
      if (score >= scores[neighborIndex]!) continue;

      scores[neighborIndex] = score;
      cameFrom[neighborIndex] = current.index;
      const heuristic = manhattan({ x, y }, goal);
      insertionOrder += 1;
      open.push({
        f: score + heuristic,
        g: score,
        h: heuristic,
        index: neighborIndex,
        order: insertionOrder,
      });
    }
  }

  return null;
}

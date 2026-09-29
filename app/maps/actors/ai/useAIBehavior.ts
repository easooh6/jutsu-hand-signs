"use client";

import { useEffect, useRef } from "react";
import type { GridPosition } from "../types";
import type { AIActorController, ActorMovementState } from "../types";
import type { GameMap } from "../../map/types";
import { findMapRoute } from "../../pathfinding";
import { isPositionInVisionTunnel } from "../../vision";
import {
  findRandomWanderRoute,
  randomTurnDirection,
  randomWanderDelay,
} from "./wander";
import { playChaseSound } from "./chaseAudio";

type UseAIBehaviorOptions = {
  onContact?: () => void;
  enabled?: boolean;
  controller: AIActorController;
  map: GameMap;
  movement: ActorMovementState;
  occupied?: readonly GridPosition[];
  playerPosition: GridPosition;
};

export function useAIBehavior({
  onContact,
  enabled = true,
  controller,
  map,
  movement,
  occupied = [],
  playerPosition,
}: UseAIBehaviorOptions) {
  const chasing = useRef(false);
  const playerVisible = isPositionInVisionTunnel(
    {
      direction: movement.direction,
      position: movement.position,
    },
    playerPosition,
  );

  useEffect(() => {
    if (!controller.friendly) return;
    controller.stop();
  }, [controller]);

  useEffect(() => {
    if (controller.friendly || !enabled) return;

    const timer = window.setTimeout(() => {
      if (chasing.current || movement.moving) return;

      if (Math.random() < 0.5) {
        controller.face(randomTurnDirection(movement.direction));
        return;
      }

      const route = findRandomWanderRoute(
        map,
        movement.position,
        [...occupied, playerPosition],
      );
      if (route) controller.setRoute(route);
      else controller.face(randomTurnDirection(movement.direction));
    }, randomWanderDelay());

    return () => window.clearTimeout(timer);
  }, [
    controller,
    enabled,
    map,
    movement.direction,
    movement.moving,
    movement.position,
    occupied,
    playerPosition,
  ]);

  useEffect(() => {
    if (controller.friendly || !enabled) return;
    if (playerVisible && !chasing.current) {
      chasing.current = true;
      playChaseSound();
    }
    if (!chasing.current || movement.moving) return;

    if (Math.abs(movement.position.x - playerPosition.x) + Math.abs(movement.position.y - playerPosition.y) <= 1) onContact?.();

    const route = findMapRoute(
      map,
      movement.position,
      playerPosition,
      {
        allowOccupiedGoal: true,
        occupied: [...occupied, playerPosition],
      },
    );

    // Keep the actor adjacent to its opponent while the encounter runs.
    controller.setRoute(route ? route.slice(0, -1) : []);
  }, [
    controller,
    enabled,
    onContact,
    map,
    movement.position,
    movement.moving,
    occupied,
    playerPosition,
    playerVisible,
  ]);

}

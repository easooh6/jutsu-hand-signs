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

type UseAIBehaviorOptions = {
  controller: AIActorController;
  map: GameMap;
  movement: ActorMovementState;
  occupied?: readonly GridPosition[];
  playerPosition: GridPosition;
};

export function useAIBehavior({
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
    if (controller.friendly) return;

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
    map,
    movement.direction,
    movement.moving,
    movement.position,
    occupied,
    playerPosition,
  ]);

  useEffect(() => {
    if (controller.friendly) return;
    if (playerVisible) chasing.current = true;
    if (!chasing.current || movement.moving) return;

    const route = findMapRoute(
      map,
      movement.position,
      playerPosition,
      {
        allowOccupiedGoal: true,
        occupied: [...occupied, playerPosition],
      },
    );

    // Combat is not implemented yet, so pursuit stops next to the player.
    controller.setRoute(route ? route.slice(0, -1) : []);
  }, [
    controller,
    map,
    movement.position,
    movement.moving,
    occupied,
    playerPosition,
    playerVisible,
  ]);

}

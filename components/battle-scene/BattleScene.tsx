"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { CharacterDefinition } from "@/components/characters";
import { BattlePlayer } from "@/components/battle-player";
import type { BattlePlayerAnimation } from "@/components/battle-player";
import { useCombatStore } from "@/components/combat/CombatProvider";
import { applyVictoryUpgrade } from "@/components/combat/progression";
import { getStatusIcon } from "@/components/combat/runtime";
import { getActorDefinition } from "@/app/maps/actors";
import { useScreenTransition } from "@/components/screen-transition";
import { playOneShot } from "@/components/audio";
import styles from "./BattleScene.module.css";

type PlayerPlayback = {
  animation: BattlePlayerAnimation;
  key: string | number;
};

const BATTLE_CHARACTER_SCALE = 2.5;

type BattleSceneStyle = CSSProperties & {
  "--battle-character-scale": number;
};

export function BattleScene({ character }: { character: CharacterDefinition }) {
  const router = useRouter();
  const { runTransition } = useScreenTransition();
  const { state, enemyTurn, endEncounter, update } = useCombatStore();
  const encounter = state.encounter;
  const [playerPlayback, setPlayerPlayback] = useState<PlayerPlayback>({
    animation: "idle",
    key: "idle",
  });
  const exiting = useRef(false);
  const activeEncounter = useRef<string | null>(null);
  const deathSoundPlayed = useRef(false);
  const deathAnimationStarted = useRef(false);
  const deathAnimationCompleted = useRef(false);
  const animation = state.animations[0];
  const definition = useMemo(
    () => encounter ? getActorDefinition(encounter.enemyDefinitionId) : null,
    [encounter],
  );
  const player = encounter ? state.actors[encounter.playerId] : null;
  const enemy = encounter ? state.actors[encounter.enemyId] : null;

  useEffect(() => {
    if (!encounter || !player || player.health <= 0 || !animation) return;
    const nextAnimation = animation.stage === "casting" && animation.casterId === encounter.playerId
      ? "cast"
      : animation.stage === "resolved" && animation.damagedTargetIds.includes(encounter.playerId)
        ? "hurt"
        : null;
    if (!nextAnimation) return;

    const frame = requestAnimationFrame(() => {
      setPlayerPlayback({ animation: nextAnimation, key: animation.id });
    });
    return () => cancelAnimationFrame(frame);
  }, [animation, encounter, player]);

  useEffect(() => {
    if (!encounter || !definition || activeEncounter.current === encounter.enemyId) return;
    activeEncounter.current = encounter.enemyId;
    exiting.current = false;
    deathSoundPlayed.current = false;
    deathAnimationStarted.current = false;
    deathAnimationCompleted.current = false;
    playOneShot(definition.battleEnterSound);
  }, [definition, encounter]);

  useEffect(() => {
    if (!animation || !encounter) return;
    if (
      animation.missedTargetIds.includes(encounter.playerId) ||
      animation.missedTargetIds.includes(encounter.enemyId)
    ) playOneShot("/audio/combat/miss_swoosh.ogg");
  }, [animation, encounter]);

  useEffect(() => {
    if (!player || !enemy || (player.health > 0 && enemy.health > 0) || deathSoundPlayed.current) return;
    deathSoundPlayed.current = true;
    playOneShot("/audio/game/horror_chord.ogg");
  }, [enemy, player]);

  useEffect(() => {
    if (!player || player.health > 0 || deathAnimationStarted.current) return;
    deathAnimationStarted.current = true;
    const frame = requestAnimationFrame(() => {
      setPlayerPlayback({ animation: "death", key: "death" });
    });
    return () => cancelAnimationFrame(frame);
  }, [player]);

  useEffect(() => {
    if (
      !encounter ||
      !enemy ||
      !player ||
      encounter.phase !== "enemy" ||
      state.animations.length > 0 ||
      enemy.health <= 0 ||
      player.health <= 0
    ) return;

    const timer = window.setTimeout(enemyTurn, 450);
    return () => window.clearTimeout(timer);
  }, [encounter, enemy, enemyTurn, player, state.animations.length]);

  useEffect(() => {
    if (!encounter || !enemy || !player || enemy.health > 0 || player.health <= 0 || exiting.current) return;
    exiting.current = true;
    void runTransition(() => {
      update(encounter.playerId, (actor) => applyVictoryUpgrade(actor, character.id));
      endEncounter();
    });
  }, [character.id, encounter, endEncounter, enemy, player, runTransition, update]);

  const completePlayerAnimation = useCallback(() => {
    if (!player) return;
    if (player.health <= 0) {
      if (playerPlayback.animation !== "death" || deathAnimationCompleted.current || exiting.current) return;
      deathAnimationCompleted.current = true;
      exiting.current = true;
      void runTransition(() => router.push("/"));
      return;
    }
    setPlayerPlayback({ animation: "idle", key: `idle:${state.turn}` });
  }, [player, playerPlayback.animation, router, runTransition, state.turn]);

  if (!encounter || !definition || !player || !enemy) return null;

  const enemyDamageEvent = animation?.stage === "resolved" && animation.damagedTargetIds.includes(encounter.enemyId)
    ? animation.id
    : null;
  const playerDamageEvent = animation?.stage === "resolved" && animation.damagedTargetIds.includes(encounter.playerId)
    ? animation.id
    : null;
  const enemyMissEvent = animation?.stage === "resolved" && animation.missedTargetIds.includes(encounter.enemyId)
    ? animation.id
    : null;
  const playerMissEvent = animation?.stage === "resolved" && animation.missedTargetIds.includes(encounter.playerId)
    ? animation.id
    : null;
  const healthPercent = Math.max(0, enemy.health / enemy.maxHealth * 100);
  const displayedPhase = animation?.casterId === encounter.playerId
    ? "player"
    : animation?.casterId === encounter.enemyId
      ? "enemy"
      : encounter.phase;

  return (
    <section
      aria-label={`Battle with ${definition.name}`}
      className={styles.scene}
      style={{ "--battle-character-scale": BATTLE_CHARACTER_SCALE } as BattleSceneStyle}
    >
      <div className={styles.turn}>
        {displayedPhase === "player" ? "YOUR TURN" : "ENEMY TURN"}
      </div>
      <div
        className={`${styles.player} ${playerDamageEvent !== null ? styles.playerHit : ""}`}
        key={playerDamageEvent ?? "player"}
      >
        {playerMissEvent !== null && <span className={styles.miss} key={playerMissEvent}>MISS</span>}
        <BattlePlayer
          alt={character.name}
          animation={playerPlayback.animation}
          characterId={character.id}
          onAnimationComplete={completePlayerAnimation}
          playbackKey={playerPlayback.key}
          scale={1.3 * BATTLE_CHARACTER_SCALE}
        />
      </div>
      <div
        className={`${styles.enemy} ${enemyDamageEvent !== null ? styles.enemyHit : ""}`}
        key={enemyDamageEvent ?? "enemy"}
      >
        {enemyMissEvent !== null && <span className={styles.miss} key={enemyMissEvent}>MISS</span>}
        <Image
          alt={definition.name}
          className={styles.enemyArt}
          height={definition.battleSpriteSize.height}
          priority
          sizes="(max-width: 700px) 12rem, 27vw"
          src={definition.iconSrc}
          unoptimized
          width={definition.battleSpriteSize.width}
        />
        <div className={styles.enemyInfo}>
          <strong className={styles.enemyName}>{definition.name}</strong>
          {enemy.statuses.length > 0 && (
            <div className={styles.enemyStatuses} aria-label="Enemy status effects">
              {enemy.statuses.map((status) => {
                const icon = getStatusIcon(status.id);
                return (
                  <span
                    aria-label={status.id}
                    className={styles.statusIcon}
                    key={status.id}
                    role="img"
                    style={{
                      backgroundImage: `url(${icon.src})`,
                      backgroundPosition: `${-icon.x}px ${-icon.y}px`,
                    }}
                    title={status.id}
                  />
                );
              })}
            </div>
          )}
          <div className={styles.health} role="progressbar" aria-label={`${definition.name} health`} aria-valuemin={0} aria-valuemax={enemy.maxHealth} aria-valuenow={enemy.health}>
            <div className={styles.healthFill} style={{ width: `${healthPercent}%` }} />
            <span className={styles.healthText}>{Math.ceil(enemy.health)} / {enemy.maxHealth} HP</span>
          </div>
        </div>
      </div>
    </section>
  );
}

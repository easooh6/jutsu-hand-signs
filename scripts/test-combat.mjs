import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

function loadTypeScript(source) {
  const compiled = ts.transpileModule(readFileSync(source, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const runtimeModule = { exports: {} };
  const require = createRequire(fileURLToPath(source));
  const resolve = (id) => id.startsWith(".") && !id.endsWith(".json") ? loadTypeScript(new URL(`${id}.ts`, source)) : require(id);
  new Function("require", "module", "exports", compiled)(resolve, runtimeModule, runtimeModule.exports);
  return runtimeModule.exports;
}
const { PROFILES, createCombatActor, applyStatus, removeStatus, tickActor, getModifiers, takeDamage, canAct, getCastCount, resolveHit } = loadTypeScript(new URL("../components/combat/runtime.ts", import.meta.url));
const { SPELL_RULES, createCombatState, performCast, advanceCombatTurn, remainingCooldown, chooseEnemySpell } = loadTypeScript(new URL("../components/combat/casting.ts", import.meta.url));
const skeleton = createCombatActor(PROFILES.skeleton);
assert.equal(skeleton.health, 120);
assert.equal(applyStatus(skeleton, "poisoned"), skeleton);
assert.equal(applyStatus(skeleton, "bleeding"), skeleton);
assert.equal(applyStatus(skeleton, "burning"), skeleton);
assert.equal(takeDamage(skeleton, 200).health, 36);
assert.equal(takeDamage(skeleton, 200, false).health, 0);
assert.equal(canAct(applyStatus(skeleton, "stunned")), false);
assert.equal(canAct(tickActor(applyStatus(skeleton, "stunned"))), true);
const maiden = createCombatActor(PROFILES.armored);
assert.equal(tickActor(maiden).health, 191);
assert.equal(applyStatus(maiden, "stunned"), maiden);
assert.deepEqual(getModifiers(maiden), { accuracy: 65, attack: 130, resistance: 130, evasion: 0 });
let victim = createCombatActor({ health: 100, immunities: [], modifiers: {}, passives: [] });
for (const id of ["poisoned", "bleeding", "burning"]) victim = applyStatus(victim, id);
assert.equal(tickActor(victim).health, 78);
assert.equal(tickActor(victim).statuses.length, 3);
assert.equal(applyStatus(victim, "poisoned"), victim);
assert.equal(removeStatus(victim, "poisoned").statuses.length, 2);
assert.deepEqual(getModifiers(victim), { accuracy: 50, attack: 80, resistance: 80, evasion: 10 });
const zombie = createCombatActor(PROFILES.bloodied);
assert.equal(tickActor({ ...zombie, health: 100 }).health, 107.5);
assert.equal(tickActor(zombie).health, 150);
assert.equal(tickActor({ ...zombie, health: 0 }).health, 0);
assert.equal(getCastCount(createCombatActor(PROFILES.hounds)), 2);
assert.equal(getCastCount(applyStatus(skeleton, "stunned")), 0);
const defender = createCombatActor({ health: 500, immunities: [], modifiers: { resistance: 100, evasion: -10 }, passives: [] });
assert.equal(resolveHit(maiden, defender, 100, () => 0).health, 435);
const generic = () => createCombatActor({ health: 100, immunities: [], modifiers: {}, passives: [] });
let state = { ...createCombatState(), actors: { player: createCombatActor(PROFILES.hounds), enemy: generic() } };
const cast = { casterId: "player", spellId: "gas_attack", targetIds: ["enemy"], dueTurn: 0 };
state = performCast(state, cast);
assert.equal(state.animations.length, 1);
assert.equal(state.pending.length, 1);
assert.equal(state.actors.player.statuses[0].id, "poisoned");
assert.equal(state.actors.enemy.statuses[0].id, "poisoned");
assert.equal(remainingCooldown(state, "player", "gas_attack"), 2);
assert.equal(performCast(state, cast), state);
state.actors.enemy = removeStatus(state.actors.enemy, "poisoned");
state = advanceCombatTurn(state);
assert.equal(state.animations.length, 2);
assert.equal(state.pending.length, 0);
assert.equal(state.actors.enemy.statuses[0].id, "poisoned");
assert.equal(remainingCooldown(state, "player", "gas_attack"), 1);
state = advanceCombatTurn(state);
assert.equal(remainingCooldown(state, "player", "gas_attack"), 0);
let clean = { ...createCombatState(), actors: { player: applyStatus(generic(), "poisoned"), enemy: generic() } };
clean = performCast(clean, { ...cast, spellId: "hurting" });
assert.deepEqual(clean.actors.player.statuses.map((s) => s.id), ["bleeding"]);
assert.deepEqual(clean.actors.enemy.statuses.map((s) => s.id), ["bleeding"]);
clean.actors.player = applyStatus(clean.actors.player, "burning");
clean.actors.enemy = applyStatus(clean.actors.enemy, "burning");
clean = performCast(clean, { ...cast, spellId: "torrent" });
assert.equal(clean.actors.player.statuses.some((s) => s.id === "burning"), false);
assert.equal(clean.actors.enemy.statuses.some((s) => s.id === "burning"), false);
let healing = { ...createCombatState(), actors: { player: { ...generic(), health: 20 }, "npc:enemy": { ...generic(), health: 20 } } };
healing = performCast(healing, { ...cast, spellId: "solace" });
healing = performCast(healing, { ...cast, casterId: "npc:enemy", spellId: "solace" });
assert.equal(healing.actors.player.health, 50);
assert.equal(healing.actors["npc:enemy"].health, 35);
const selection = { ...createCombatState(), actors: { enemy: applyStatus(generic(), "poisoned") } };
assert.equal(chooseEnemySpell(selection, "enemy", ["hatchet", "hurting"], () => 0.39), "hurting");
assert.equal(chooseEnemySpell(selection, "enemy", ["hatchet", "hurting"], () => 0.4), "hatchet");
const definitions = JSON.parse(readFileSync(new URL("../app/maps/data/actors.json", import.meta.url), "utf8")).actors;
const guard = createCombatActor(definitions.find((actor) => actor.id === "guard1"));
const angel = createCombatActor(definitions.find((actor) => actor.id === "blackangel"));
const shakespeare = createCombatActor(definitions.find((actor) => actor.id === "ironshakespeare"));
assert.deepEqual(getModifiers(guard), { accuracy: 65, attack: 100, resistance: 120, evasion: 0 });
assert.deepEqual(getModifiers(angel), { accuracy: 100, attack: 100, resistance: 115, evasion: 15 });
assert.deepEqual(getModifiers(shakespeare), { accuracy: 75, attack: 100, resistance: 135, evasion: 0 });
const passiveState = { ...createCombatState(), actors: { "npc:angel": angel, player: generic() } };
const passiveCast = { casterId: "npc:angel", spellId: "solace", targetIds: ["player"], dueTurn: 0 };
assert.equal(performCast(passiveState, passiveCast, false, () => 0.29).actors.player.statuses[0].id, "poisoned");
assert.equal(performCast(passiveState, passiveCast, false, () => 0.30).actors.player.statuses.length, 0);
const stunnedEncounter = { ...createCombatState(), actors: { player: generic(), enemy: applyStatus(guard, "stunned") }, encounter: { playerId: "player", enemyId: "enemy", spellIds: ["hatchet"] } };
const skipped = advanceCombatTurn(stunnedEncounter, () => 0);
assert.equal(skipped.animations.length, 0);
assert.equal(skipped.actors.enemy.statuses.length, 0);
assert.equal(advanceCombatTurn(skipped, () => 0).animations.length, 1);
for (const spellId of ["fire-ball", "fire_attack_1"]) {
  const fire = performCast({ ...createCombatState(), actors: { player: generic(), enemy: generic() } }, { ...cast, spellId });
  assert.equal(fire.actors.player.statuses[0].id, "burning");
  assert.equal(fire.actors.enemy.statuses[0].id, "burning");
}
for (const spellId of ["hatchet", "horizontal_slash"]) {
  const slash = performCast({ ...createCombatState(), actors: { player: generic(), enemy: generic() } }, { ...cast, spellId });
  assert.equal(slash.actors.player.statuses.length, 0);
  assert.equal(slash.actors.enemy.statuses[0].id, "bleeding");
}
const goldCast = { casterId: "npc:shakespeare", spellId: "molten_gold", targetIds: ["player"], dueTurn: 0 };
let gold = performCast({ ...createCombatState(), actors: { "npc:shakespeare": { ...shakespeare, health: 500 }, player: generic() } }, goldCast, false, () => 1);
assert.equal(gold.actors["npc:shakespeare"].health, 680);
assert.equal(gold.actors.player.health, 100);
assert.equal(gold.actors.player.statuses[0].id, "burning");
assert.equal(remainingCooldown(gold, "npc:shakespeare", "molten_gold"), 4);
for (let turn = 0; turn < 3; turn++) gold = advanceCombatTurn(gold);
assert.equal(performCast(gold, goldCast), gold);
gold = advanceCombatTurn(gold);
assert.equal(remainingCooldown(gold, "npc:shakespeare", "molten_gold"), 0);
const expectedDamage = {
  hurting: 35,
  "fire-ball": 50,
  torrent: 30,
  solace: 0,
  hatchet: 55,
  fire_attack_1: 45,
  molten_gold: 35,
  horizontal_slash: 45,
  poison_cloud: 20,
  gas_attack: 15,
};
assert.deepEqual(Object.fromEntries(Object.entries(SPELL_RULES).map(([id, rule]) => [id, rule.baseDamage])), expectedDamage);
for (const [spellId, baseDamage] of Object.entries(expectedDamage)) {
  if (baseDamage === 0) continue;
  const rolls = [0, 0.99];
  const damageState = performCast(
    { ...createCombatState(), actors: { player: generic(), enemy: generic() } },
    { casterId: "player", spellId, targetIds: ["enemy"], dueTurn: 0 },
    false,
    () => rolls.shift() ?? 0.99,
  );
  assert.equal(damageState.actors.enemy.health, 100 - baseDamage, `${spellId} damage`);
  assert.equal(damageState.actors.player.health, 100, `${spellId} must not directly damage its caster`);
}
console.log("Combat checks passed: profiles, damage, status stacking, immunity, passives, next-turn repeat, cooldowns, AOE, healing and 40% cleanse priority.");

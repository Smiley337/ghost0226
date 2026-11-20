"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const config = require("../config.js");
const { GameEngine, addMoney, multiplyMoney, compareMoney, formatMoney, drawCompass } = require("../core.js");

function harness(saved, value = 0.75) {
  let clock = 1000;
  let draws = 0;
  const engine = new GameEngine(saved, { random: () => { draws += 1; return value; }, now: () => clock });
  return { engine, advance: (ms) => { clock += ms; }, draws: () => draws };
}

test("첫 뒷면은 정확히 0.5만두를 지급하고 그 면을 유지한다", () => {
  const { engine } = harness();
  const flip = engine.beginFlip();
  assert.equal(flip.side, "tails");
  assert.equal(flip.reward, "0.5");
  assert.equal(engine.state.balance, "0");
  assert.equal(engine.finishFlip(flip.id), flip);
  assert.equal(engine.state.balance, "0.5");
  assert.equal(engine.state.lastSide, "tails");
});

test("앞면과 뒷면 수익 업그레이드는 서로 영향을 주지 않는다", () => {
  const { engine } = harness({ balance: "100" });
  assert.deepEqual([engine.upgradeInfo("tails").current, engine.upgradeInfo("tails").next], ["0.5", "0.75"]);
  assert.equal(engine.buyUpgrade("heads"), true);
  assert.equal(engine.effects().headsReward, "1.5");
  assert.equal(engine.effects().tailsReward, "0.5");
  assert.equal(engine.buyUpgrade("tails"), true);
  assert.equal(engine.effects().headsReward, "1.5");
  assert.equal(engine.effects().tailsReward, "0.75");
  const flip = engine.beginFlip();
  assert.equal(flip.reward, "0.75");
});

test("모든 나침반 경계와 100개 구간은 49/49/1/1로 고정된다", () => {
  for (const [integer, direction] of [[0, "north"], [48, "north"], [49, "south"], [97, "south"], [98, "east"], [99, "west"]]) {
    assert.equal(drawCompass(integer).direction, direction);
  }
  const counts = { north: 0, south: 0, east: 0, west: 0 };
  for (let index = 0; index < 100; index += 1) counts[drawCompass(index).direction] += 1;
  assert.deepEqual(counts, { north: 49, south: 49, east: 1, west: 1 });
  assert.throws(() => drawCompass(-1), RangeError);
  assert.throws(() => drawCompass(100), RangeError);
});

test("나침반은 행운에 관계없이 한 번 추첨하고 미리보기와 같은 잔액을 정산한다", () => {
  for (const [random, direction, expected] of [[0, "north", "10"], [0.48, "north", "10"], [0.49, "south", "150"], [0.97, "south", "150"], [0.98, "east", "100"], [0.99, "west", "500"]]) {
    const { engine, draws } = harness({ balance: "100", levels: { luck: 16 } }, random);
    const preview = engine.previewCompass();
    assert.equal(preview.balance, "100");
    assert.equal(engine.beginFlip(), null);
    assert.equal(engine.buyUpgrade("heads"), false);
    assert.equal(engine.state.balance, "100");
    const spin = engine.beginCompass();
    assert.equal(spin.direction, direction);
    assert.equal(spin.result, expected);
    assert.equal(preview.outcomes.find((entry) => entry.direction === direction).result, expected);
    assert.equal(engine.beginCompass(), null);
    assert.equal(engine.beginFlip(), null);
    assert.equal(engine.buyUpgrade("tails"), false);
    assert.equal(engine.cancelCompass(), false);
    assert.equal(draws(), 1);
    assert.equal(engine.finishCompass(spin.id), spin);
    assert.equal(engine.finishCompass(spin.id), null);
    assert.equal(engine.state.balance, expected);
  }
});

test("입력 연타와 중복 완료 콜백에도 한 번만 지급하고 500ms를 기다린다", () => {
  const { engine, advance, draws } = harness();
  const first = engine.beginFlip();
  assert.equal(Object.isFrozen(first), true);
  for (let count = 0; count < 100; count += 1) assert.equal(engine.beginFlip(), null);
  assert.equal(engine.finishFlip(first.id + 1), null);
  engine.finishFlip(first.id);
  for (let count = 0; count < 100; count += 1) assert.equal(engine.finishFlip(first.id), null);
  assert.equal(engine.state.balance, "0.5");
  assert.equal(engine.state.flips, 1);
  assert.equal(draws(), 1);
  advance(499);
  assert.equal(engine.beginFlip(), null);
  advance(1);
  assert.equal(engine.phase, "idle");
  const next = engine.beginFlip();
  assert.equal(next.startSide, "tails");
  assert.equal(draws(), 2);
  engine.finishFlip(next.id);
  assert.equal(engine.state.balance, "1");
});

test("소수 금액, 큰 정수, 반복 손실을 부동소수점 오차 없이 보존한다", () => {
  assert.equal(addMoney("0.1", "0.2"), "0.3");
  assert.equal(multiplyMoney("0.5", "0.1"), "0.05");
  assert.equal(addMoney("999999999999999999.99", "0.01"), "1000000000000000000");
  assert.equal(compareMoney("0.000000000000001", "0"), 1);
  assert.equal(formatMoney("1000000000000000000.500"), "1,000,000,000,000,000,000.50");
  let balance = "1";
  for (let count = 0; count < 30; count += 1) balance = multiplyMoney(balance, "0.1");
  assert.equal(balance, "0." + "0".repeat(29) + "1");
});

test("금액 표시는 두 자리로 반올림하고 내부 잔액은 정확하게 보존한다", () => {
  for (const [value, expected] of [
    ["0", "0.00"], ["1", "1.00"], ["0.5", "0.50"],
    ["0.0049", "0.00"], ["0.005", "0.01"], ["1.005", "1.01"],
    ["9.995", "10.00"], ["999999999999999999.995", "1,000,000,000,000,000,000.00"],
    ["-0.001", "0.00"], ["-1.005", "-1.01"]
  ]) assert.equal(formatMoney(value), expected);
  const { engine } = harness({ balance: "0.005" }, 0.99);
  const preview = engine.previewCompass();
  assert.equal(formatMoney(preview.balance), "0.01");
  const spin = engine.beginCompass();
  engine.finishCompass(spin.id);
  assert.equal(engine.state.balance, "0.025");
  assert.equal(formatMoney(engine.state.balance), "0.03");
  assert.equal(new GameEngine(engine.serialize()).state.balance, "0.025");
});

test("행운 상한, 최소 대기 시간, 업그레이드 비용을 지킨다", () => {
  const { engine } = harness({ balance: "10000000" });
  assert.equal(engine.upgradeInfo("heads").cost, "5");
  engine.buyUpgrade("heads");
  assert.equal(engine.upgradeInfo("heads").cost, "8");
  for (let count = 0; count < config.upgrades.luck.maxLevel; count += 1) assert.equal(engine.buyUpgrade("luck"), true);
  for (let count = 0; count < config.upgrades.speed.maxLevel; count += 1) assert.equal(engine.buyUpgrade("speed"), true);
  assert.equal(engine.effects().headsChance, 0.9);
  assert.equal(engine.effects().cooldownMs, 100);
  assert.equal(engine.buyUpgrade("luck"), false);
  assert.equal(engine.buyUpgrade("speed"), false);
});

test("취소한 미리보기는 추첨하지 않고 잔액을 변경하지 않는다", () => {
  const { engine, draws } = harness({ balance: "0.5" });
  engine.previewCompass();
  assert.equal(engine.phase, "compass-preview");
  assert.equal(engine.cancelCompass(), true);
  assert.equal(engine.state.balance, "0.5");
  assert.equal(engine.phase, "idle");
  assert.equal(draws(), 0);
});

test("저장과 복원은 잔액, 업그레이드, 마지막 면을 유지한다", () => {
  const { engine } = harness({ balance: "100" });
  engine.buyUpgrade("heads");
  engine.buyUpgrade("tails");
  const flip = engine.beginFlip();
  engine.finishFlip(flip.id);
  const restored = new GameEngine(JSON.parse(JSON.stringify(engine.serialize())));
  assert.deepEqual(restored.state, engine.state);
  assert.equal(restored.state.lastSide, "tails");
  assert.equal(restored.state.balance, "91.75");
});

test("던지기 중 새로고침해도 이미 뽑힌 보상과 면을 한 번만 복원한다", () => {
  const { engine } = harness();
  engine.beginFlip();
  const restored = new GameEngine(JSON.parse(JSON.stringify(engine.serialize())), { random: () => { throw new Error("복원은 추첨하지 않습니다."); } });
  assert.equal(restored.state.balance, "0.5");
  assert.equal(restored.state.lastSide, "tails");
  assert.equal(restored.state.flips, 1);
  assert.equal(restored.serialize().pending, null);
  assert.deepEqual(new GameEngine(restored.serialize()).state, restored.state);
});

test("나침반 회전 중 새로고침해도 확정 잔액을 재추첨 없이 복원한다", () => {
  const { engine } = harness({ balance: "0.5" }, 0);
  engine.previewCompass();
  engine.beginCompass();
  const restored = new GameEngine(JSON.parse(JSON.stringify(engine.serialize())), { random: () => { throw new Error("복원은 추첨하지 않습니다."); } });
  assert.equal(restored.state.balance, "0.05");
  assert.equal(restored.serialize().pending, null);
  assert.equal(new GameEngine(restored.serialize()).state.balance, "0.05");
});

test("잘못된 저장 항목은 안전한 초기값으로 복원한다", () => {
  const engine = new GameEngine({ balance: "NaN", levels: { luck: -1, heads: "4", tails: 999, speed: 0.5 }, lastSide: "unknown", flips: -5 });
  assert.equal(engine.state.balance, "0");
  assert.deepEqual(engine.state.levels, { luck: 0, heads: 0, tails: 100, speed: 0 });
  assert.equal(engine.state.lastSide, "heads");
  assert.equal(engine.state.flips, 0);
});

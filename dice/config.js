(function (root, factory) {
  "use strict";
  const config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  root.COIN_CONFIG = config;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // 첫 플레이 테스트용 수치를 한곳에서 조절합니다. 금액은 소수 오차를 막도록 문자열입니다.
  const config = {
    version: 1,
    storageKey: "ghost0226.coin-game.v1",
    initialBalance: "0",
    baseReward: "1",
    initialHeadsChance: 0.5,
    headsChanceCap: 0.9,
    initialHeadsMultiplier: "1",
    initialTailsMultiplier: "0.5",
    baseCooldownMs: 500,
    minCooldownMs: 100,
    flipDurationMs: 1400,
    compassDurationMs: 2600,
    maxImageBytes: 8 * 1024 * 1024,
    defaultImages: {
      heads: "../coin/앞면1.gif",
      tails: "../coin/뒷면1.gif"
    },
    upgrades: {
      luck: { label: "Luck", baseCost: "8", costGrowth: "1.6", increment: 0.025, maxLevel: 16 },
      heads: { label: "Heads payout", baseCost: "5", costGrowth: "1.6", increment: "0.5", maxLevel: 100 },
      tails: { label: "Tails payout", baseCost: "4", costGrowth: "1.6", increment: "0.25", maxLevel: 100 },
      speed: { label: "Flip speed", baseCost: "6", costGrowth: "1.6", increment: 40, maxLevel: 10 }
    },
    // 구간 끝을 포함합니다. 동전의 행운 수치는 이 표에 관여하지 않습니다.
    compass: [
      { direction: "north", label: "North", probability: 0.49, multiplier: "0.1", min: 0, max: 48, angle: 0 },
      { direction: "south", label: "South", probability: 0.49, multiplier: "1.5", min: 49, max: 97, angle: 180 },
      { direction: "east", label: "East", probability: 0.01, multiplier: "1", min: 98, max: 98, angle: 90 },
      { direction: "west", label: "West", probability: 0.01, multiplier: "5", min: 99, max: 99, angle: 270 }
    ]
  };

  function freezeDeep(value) {
    Object.values(value).forEach(function (child) {
      if (child && typeof child === "object") freezeDeep(child);
    });
    return Object.freeze(value);
  }
  return freezeDeep(config);
});

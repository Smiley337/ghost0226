(function (root, factory) {
  "use strict";
  const config = typeof module === "object" && module.exports ? require("./config.js") : root.COIN_CONFIG;
  const core = factory(config);
  if (typeof module === "object" && module.exports) module.exports = core;
  root.CoinGameCore = core;
})(typeof globalThis !== "undefined" ? globalThis : this, function (config) {
  "use strict";

  // 금액 = 정수(BigInt) / 10^소수자리수로 표현해 0.1 + 0.2도 정확하게 보존합니다.
  function parseMoney(value) {
    const text = String(value);
    if (!/^-?\d+(?:\.\d+)?$/.test(text)) throw new TypeError("Invalid dumpling amount.");
    const negative = text[0] === "-";
    const parts = (negative ? text.slice(1) : text).split(".");
    const fraction = parts[1] || "";
    return { units: BigInt(parts[0] + fraction) * (negative ? -1n : 1n), scale: fraction.length };
  }

  function decimalString(units, scale) {
    const negative = units < 0n;
    let digits = (negative ? -units : units).toString().padStart(scale + 1, "0");
    if (scale) digits = digits.slice(0, -scale) + "." + digits.slice(-scale);
    digits = digits.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
    return (negative && units !== 0n ? "-" : "") + digits;
  }

  function normalizeMoney(value) {
    const amount = parseMoney(value);
    return decimalString(amount.units, amount.scale);
  }

  function addMoney(left, right) {
    const a = parseMoney(left);
    const b = parseMoney(right);
    const scale = Math.max(a.scale, b.scale);
    return decimalString(a.units * 10n ** BigInt(scale - a.scale) + b.units * 10n ** BigInt(scale - b.scale), scale);
  }

  function multiplyMoney(left, right) {
    const a = parseMoney(left);
    const b = parseMoney(right);
    return decimalString(a.units * b.units, a.scale + b.scale);
  }

  function compareMoney(left, right) {
    const difference = parseMoney(addMoney(left, multiplyMoney(right, "-1"))).units;
    return difference < 0n ? -1 : difference > 0n ? 1 : 0;
  }

  function formatMoney(value) {
    // 화면에만 소수 두 자리를 표시합니다. 실제 정산값과 저장값은 반올림하지 않습니다.
    // BigInt로 반올림하므로 1.005와 아주 큰 금액도 부동소수점 오차가 없습니다.
    const amount = parseMoney(value);
    const magnitude = amount.units < 0n ? -amount.units : amount.units;
    const divisor = 10n ** BigInt(Math.max(0, amount.scale - 2));
    const cents = amount.scale <= 2
      ? magnitude * 10n ** BigInt(2 - amount.scale)
      : (magnitude + divisor / 2n) / divisor;
    const digits = cents.toString().padStart(3, "0");
    const whole = digits.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (amount.units < 0n && cents > 0n ? "-" : "") + whole + "." + digits.slice(-2);
  }

  function ceilMoney(value) {
    const amount = parseMoney(value);
    const divisor = 10n ** BigInt(amount.scale);
    return ((amount.units + divisor - 1n) / divisor).toString();
  }

  function safeBalance(value, fallback) {
    try {
      const balance = normalizeMoney(value);
      return compareMoney(balance, "0") >= 0 ? balance : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function drawCompass(integer) {
    if (!Number.isInteger(integer) || integer < 0 || integer > 99) throw new RangeError("Compass draws must be integers from 0 to 99.");
    return config.compass.find(function (outcome) { return integer >= outcome.min && integer <= outcome.max; });
  }

  function cloneState(state) {
    return { balance: state.balance, levels: { ...state.levels }, lastSide: state.lastSide, flips: state.flips };
  }

  class GameEngine {
    constructor(saved, options) {
      const settings = options || {};
      this._random = settings.random || Math.random;
      this._bonusRandom = settings.bonusRandom || Math.random;
      this._now = settings.now || Date.now;
      this._phase = "idle";
      this._cooldownUntil = 0;
      this._pending = null;
      this._preview = null;
      this._nextId = 1;
      this._fever = null;
      this._golden = { nextAt: this._now() + config.fever.firstAppearanceMs, visibleUntil: 0, queued: false };

      // 저장 형식에 문제가 있어도 기본 상태로 시작하며, 개별 유효 항목은 살립니다.
      const source = saved && typeof saved === "object" ? (saved.state || saved) : {};
      const levels = {};
      Object.keys(config.upgrades).forEach(function (key) {
        const level = source.levels && source.levels[key];
        levels[key] = Number.isInteger(level) && level >= 0 ? Math.min(level, config.upgrades[key].maxLevel) : 0;
      });
      this.state = {
        balance: safeBalance(source.balance, config.initialBalance),
        levels: levels,
        lastSide: source.lastSide === "tails" ? "tails" : "heads",
        flips: Number.isSafeInteger(source.flips) && source.flips >= 0 ? source.flips : 0
      };
      if (saved && Number.isSafeInteger(saved.nextId) && saved.nextId > 0) this._nextId = saved.nextId;
      this._recoverPending(saved && saved.pending);
      this._restoreBonus(saved);
    }

    get phase() {
      if (this._phase === "cooldown" && this._now() >= this._cooldownUntil) this._phase = "idle";
      if (this._phase === "fever" && this._now() >= this._fever.endsAt) this._phase = "fever-landing";
      return this._phase;
    }

    _scheduleGolden(after) {
      const random = Math.min(1, Math.max(0, Number(this._bonusRandom()) || 0));
      const delay = config.fever.appearanceMinMs + Math.floor(random * (config.fever.appearanceMaxMs - config.fever.appearanceMinMs));
      this._golden = { nextAt: after + delay, visibleUntil: 0, queued: false };
    }

    goldenInfo() {
      return { ...this._golden, visible: this._golden.visibleUntil > this._now() };
    }

    updateGolden() {
      const now = this._now();
      if (this._golden.queued || this._fever) return this.goldenInfo();
      if (this._golden.visibleUntil && now >= this._golden.visibleUntil) this._scheduleGolden(now);
      if (!this._golden.visibleUntil && now >= this._golden.nextAt && ["idle", "cooldown", "flipping"].includes(this.phase)) {
        this._golden.visibleUntil = now + config.fever.visibleMs;
      }
      return this.goldenInfo();
    }

    claimGolden() {
      if (!this.goldenInfo().visible || !["idle", "cooldown", "flipping"].includes(this.phase)) return false;
      // 클릭 첫 순간에 만두를 소모합니다. 연타로 피버 시간을 늘리거나 두 번 시작할 수 없습니다.
      this._golden.visibleUntil = 0;
      if (this.phase === "flipping") this._golden.queued = true;
      else this._startFever();
      return true;
    }

    _startFever() {
      const now = this._now();
      this._fever = { id: this._nextId++, endsAt: now + config.fever.durationMs, flips: 0, reward: "0" };
      this._scheduleGolden(this._fever.endsAt);
      this._phase = "fever";
      this._cooldownUntil = 0;
    }

    feverInfo() {
      if (!this._fever) return null;
      return { ...this._fever, remainingMs: Math.max(0, this._fever.endsAt - this._now()), phase: this.phase };
    }

    rollFever() {
      if (this.phase !== "fever") return null;
      const effects = this.effects();
      const side = this._roll() < effects.headsChance ? "heads" : "tails";
      const event = Object.freeze({ id: this._nextId++, side: side, reward: side === "heads" ? effects.headsReward : effects.tailsReward });
      // 애니메이션 완료를 기다리지 않고 입력 하나를 즉시 한 번 정산합니다.
      this.state.balance = addMoney(this.state.balance, event.reward);
      this.state.lastSide = side;
      this.state.flips += 1;
      this._fever.flips += 1;
      this._fever.reward = addMoney(this._fever.reward, event.reward);
      return event;
    }

    finishFever(id) {
      if (this.phase !== "fever-landing" || this._fever.id !== id) return null;
      const result = { ...this._fever, side: this.state.lastSide };
      this._fever = null;
      this._phase = "idle";
      return result;
    }

    _restoreBonus(saved) {
      const golden = saved && saved.golden;
      if (golden && Number.isFinite(golden.nextAt) && Number.isFinite(golden.visibleUntil)) {
        this._golden = { nextAt: golden.nextAt, visibleUntil: golden.visibleUntil, queued: golden.queued === true };
      }
      const fever = saved && saved.fever;
      if (fever && Number.isSafeInteger(fever.id) && fever.id > 0 && Number.isFinite(fever.endsAt)) {
        this._nextId = Math.max(this._nextId, fever.id + 1);
        if (fever.endsAt > this._now() && fever.endsAt <= this._now() + config.fever.durationMs) {
          this._fever = { id: fever.id, endsAt: fever.endsAt, flips: Number.isSafeInteger(fever.flips) && fever.flips >= 0 ? fever.flips : 0, reward: safeBalance(fever.reward, "0") };
          this._phase = "fever";
          this._golden.visibleUntil = 0;
          this._golden.queued = false;
        }
      } else if (this._golden.queued) {
        // 일반 던지기 중 만두를 획득했다면 그 던지기 정산을 복원한 뒤 피버를 시작합니다.
        this._startFever();
      }
    }

    effects() {
      return this._effectsAt(this.state.levels);
    }

    _effectsAt(levels) {
      const headsMultiplier = addMoney(config.initialHeadsMultiplier, multiplyMoney(config.upgrades.heads.increment, String(levels.heads)));
      const tailsMultiplier = addMoney(config.initialTailsMultiplier, multiplyMoney(config.upgrades.tails.increment, String(levels.tails)));
      return {
        headsChance: Math.min(config.headsChanceCap, Number((config.initialHeadsChance + config.upgrades.luck.increment * levels.luck).toFixed(12))),
        headsReward: multiplyMoney(config.baseReward, headsMultiplier),
        tailsReward: multiplyMoney(config.baseReward, tailsMultiplier),
        cooldownMs: Math.max(config.minCooldownMs, config.baseCooldownMs - config.upgrades.speed.increment * levels.speed)
      };
    }

    upgradeInfo(key) {
      const upgrade = config.upgrades[key];
      if (!upgrade) throw new RangeError("Unknown upgrade.");
      const level = this.state.levels[key];
      const maxed = level >= upgrade.maxLevel;
      const currentEffects = this.effects();
      const nextEffects = this._effectsAt({ ...this.state.levels, [key]: Math.min(level + 1, upgrade.maxLevel) });
      const field = { luck: "headsChance", heads: "headsReward", tails: "tailsReward", speed: "cooldownMs" }[key];
      let rawCost = upgrade.baseCost;
      for (let count = 0; count < level; count += 1) rawCost = multiplyMoney(rawCost, upgrade.costGrowth);
      // 가격은 계산을 마친 뒤 한 번만 올림합니다. 수익과 잔액은 반올림하지 않습니다.
      const cost = ceilMoney(rawCost);
      return { level: level, current: currentEffects[field], next: nextEffects[field], cost: cost, maxed: maxed, affordable: !maxed && compareMoney(this.state.balance, cost) >= 0 };
    }

    buyUpgrade(key) {
      if (this.phase !== "idle") return false;
      const info = this.upgradeInfo(key);
      if (!info.affordable) return false;
      this.state.balance = addMoney(this.state.balance, multiplyMoney(info.cost, "-1"));
      this.state.levels[key] += 1;
      return true;
    }

    _roll() {
      const value = this._random();
      if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("Random values must be at least 0 and less than 1.");
      return value;
    }

    beginFlip() {
      if (this.phase !== "idle") return null;
      const effects = this.effects();
      const side = this._roll() < effects.headsChance ? "heads" : "tails";
      const event = Object.freeze({ id: this._nextId++, side: side, startSide: this.state.lastSide, reward: side === "heads" ? effects.headsReward : effects.tailsReward });
      this._pending = { kind: "flip", event: event };
      this._phase = "flipping";
      return event;
    }

    finishFlip(id) {
      if (this.phase !== "flipping" || !this._pending || this._pending.event.id !== id) return null;
      const event = this._pending.event;
      this.state.balance = addMoney(this.state.balance, event.reward);
      this.state.lastSide = event.side;
      this.state.flips += 1;
      // 먼저 정산 기록을 지워 연속 클릭이나 애니메이션 콜백 중복에도 한 번만 지급합니다.
      this._pending = null;
      this._phase = "cooldown";
      this._cooldownUntil = this._now() + this.effects().cooldownMs;
      if (this._golden.queued) this._startFever();
      return event;
    }

    previewCompass() {
      if (this.phase !== "idle") return null;
      const balance = this.state.balance;
      const outcomes = config.compass.map(function (outcome) {
        return Object.freeze({ ...outcome, result: multiplyMoney(balance, outcome.multiplier) });
      });
      this._preview = Object.freeze({ balance: balance, outcomes: Object.freeze(outcomes) });
      this._phase = "compass-preview";
      return this._preview;
    }

    cancelCompass() {
      if (this.phase !== "compass-preview") return false;
      this._preview = null;
      this._phase = "idle";
      return true;
    }

    beginCompass() {
      if (this.phase !== "compass-preview" || !this._preview) return null;
      // 정확히 한 번 추첨합니다. 미리보기 시점의 잔액을 정산 기준으로 고정합니다.
      const outcome = drawCompass(Math.floor(this._roll() * 100));
      const balance = this._preview.balance;
      const event = Object.freeze({ id: this._nextId++, direction: outcome.direction, label: outcome.label, probability: outcome.probability, multiplier: outcome.multiplier, balance: balance, result: multiplyMoney(balance, outcome.multiplier), angle: outcome.angle });
      this._pending = { kind: "compass", event: event };
      this._preview = null;
      this._phase = "compass-spinning";
      return event;
    }

    finishCompass(id) {
      if (this.phase !== "compass-spinning" || !this._pending || this._pending.event.id !== id) return null;
      const event = this._pending.event;
      this.state.balance = event.result;
      this._pending = null;
      this._phase = "idle";
      return event;
    }

    serialize() {
      return {
        version: config.version,
        state: cloneState(this.state),
        nextId: this._nextId,
        golden: { ...this._golden },
        // 보상은 이미 state에 들어 있습니다. 남은 실제 시간만 복원하고 재지급하지 않습니다.
        fever: this._fever ? { ...this._fever } : null,
        // 브라우저가 애니메이션 중 닫혀도 이미 결정된 결과를 다시 추첨하지 않습니다.
        pending: this._pending ? { kind: this._pending.kind, event: { ...this._pending.event } } : null
      };
    }

    _recoverPending(pending) {
      if (!pending || !pending.event || !Number.isSafeInteger(pending.event.id) || pending.event.id < 1) return;
      const event = pending.event;
      this._nextId = Math.max(this._nextId, event.id + 1);
      if (pending.kind === "flip" && (event.side === "heads" || event.side === "tails")) {
        const reward = safeBalance(event.reward, null);
        if (reward === null) return;
        this.state.balance = addMoney(this.state.balance, reward);
        this.state.lastSide = event.side;
        this.state.flips += 1;
      } else if (pending.kind === "compass") {
        const outcome = config.compass.find(function (item) { return item.direction === event.direction; });
        const balance = safeBalance(event.balance, null);
        if (!outcome || balance === null) return;
        this.state.balance = multiplyMoney(balance, outcome.multiplier);
      }
      // 복원 직후 serialize()를 저장하면 pending이 제거되어 다음 새로고침에 중복 정산되지 않습니다.
    }
  }

  return Object.freeze({ GameEngine: GameEngine, addMoney: addMoney, multiplyMoney: multiplyMoney, compareMoney: compareMoney, formatMoney: formatMoney, drawCompass: drawCompass });
});

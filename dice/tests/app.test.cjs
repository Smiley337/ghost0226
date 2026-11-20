"use strict";

// 실제 app.js의 이벤트 연결을 검사하는 작은 Node DOM 어댑터입니다.
// 브라우저 렌더링, 이미지 디코딩, IndexedDB 구현은 이 테스트의 검증 범위가 아닙니다.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const source = name => fs.readFileSync(path.join(root, name), "utf8");
const copy = value => value == null ? value : JSON.parse(JSON.stringify(value));

async function fixture(options = {}) {
  let now = options.now ?? 1000;
  let random = options.random ?? 0.99;
  let randomCalls = 0;
  let nextTimer = 0;
  let nextUrl = 0;
  const timers = new Map();
  const frames = [];
  const errors = [];
  const urls = new Map();
  const backing = options.backing || { game: options.saved || null, photos: new Map() };

  class Target {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(listener);
    }
    emit(type, values = {}) {
      const event = { type, target: this, code: "", defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...values };
      for (const listener of this.listeners.get(type) || []) {
        const result = listener(event);
        if (result && result.catch) result.catch(error => errors.push(error));
      }
      return event;
    }
  }

  class Element extends Target {
    constructor(tag = "div") {
      super();
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.attributes = {};
      this.style = {};
      this.textContent = "";
      this.className = "";
      this.disabled = false;
      this.open = false;
      this.clientHeight = 400;
      this.offsetTop = 300;
      this.files = [];
      this.classList = {
        add: name => { this.className = [...new Set([...this.className.split(" "), name])].join(" "); },
        remove: name => { this.className = this.className.split(" ").filter(item => item !== name).join(" "); }
      };
    }
    setAttribute(name, value) { this.attributes[name] = value; }
    appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
    replaceChildren() { this.children = []; }
    set innerHTML(value) {
      this.children = [];
      // 업그레이드 카드와 방위 행의 정적 조각만 읽으며, 범용 HTML 파서는 구현하지 않습니다.
      for (const match of value.matchAll(/<([a-z]+)\b([^>]*)>/gi)) {
        const child = new Element(match[1]);
        for (const attribute of match[2].matchAll(/([\w-]+)="([^"]*)"/g)) child.attributes[attribute[1]] = attribute[2];
        child.className = child.attributes.class || "";
        this.appendChild(child);
      }
    }
    querySelector(selector) {
      return this.children.find(child => selector[0] === "." ? child.className.split(" ").includes(selector.slice(1)) : child.tagName === selector.toUpperCase()) || null;
    }
    closest() {
      return ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"].includes(this.tagName) || "contenteditable" in this.attributes || this.attributes.role === "button" ? this : this.parentElement?.closest() || null;
    }
    click() { if (!this.disabled) return this.emit("click"); }
    showModal() { this.open = true; }
    close() { this.open = false; queueMicrotask(() => this.emit("close")); }
  }

  const document = new Target();
  const elements = new Map();
  for (const match of html.matchAll(/<([a-z]+)\b[^>]*\bid="([^"]+)"[^>]*>/gi)) elements.set(match[2], new Element(match[1]));
  document.body = new Element("body");
  document.hidden = false;
  document.getElementById = id => { assert.ok(elements.has(id), "실제 index.html에 존재하는 ID: " + id); return elements.get(id); };
  document.createElement = tag => new Element(tag);
  const windowEvents = new Target();
  const sandbox = {
    document, Blob, console,
    Date: class extends Date { static now() { return now; } },
    Math: Object.assign(Object.create(Math), { random: () => { randomCalls += 1; return random; } }),
    performance: { now: () => now },
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: callback => frames.push(callback),
    setTimeout: (callback, delay) => { const id = ++nextTimer; timers.set(id, { callback, due: now + delay }); return id; },
    clearTimeout: id => timers.delete(id),
    URL: { createObjectURL: blob => { const url = "blob:adapter/" + (++nextUrl); urls.set(url, blob); return url; }, revokeObjectURL: url => urls.delete(url) },
    addEventListener: windowEvents.addEventListener.bind(windowEvents),
    CoinGameStorage: {
      LocalStore: class {
        loadGame() { return copy(backing.game); }
        saveGame(game) { backing.game = copy(game); }
        async getPhoto(side) { return backing.photos.get(side); }
        async setPhoto(side, blob) { backing.photos.set(side, blob); }
        async resetPhoto(side) { backing.photos.delete(side); }
      },
      // 업로드 콜백의 상태 전환만 검사하며 이미지 형식 검사는 storage 테스트에서 다룹니다.
      validatePhoto: async blob => blob
    }
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  for (const name of ["config.js", "core.js"]) vm.runInContext(source(name), context, { filename: name });
  await vm.runInContext(source("app.js"), context, { filename: "app.js" });
  const flush = async () => { for (let count = 0; count < 8; count += 1) await Promise.resolve(); assert.deepEqual(errors, []); };
  return {
    backing, urls, config: sandbox.COIN_CONFIG, get: id => elements.get(id), saved: () => copy(backing.game), draws: () => randomCalls, now: () => now,
    hide: value => { document.hidden = value; },
    random: value => { random = value; },
    upgrade: key => elements.get("upgrades").children.map(card => card.querySelector("button")).find(button => button.attributes["data-upgrade"] === key),
    key: (target = document.body, type = "keydown", repeat = false) => document.emit(type, { target, code: "Space", repeat }),
    flush,
    async advance(ms) {
      now += ms;
      for (const callback of frames.splice(0)) callback(now);
      await flush();
      for (const [id, timer] of [...timers]) if (timer.due <= now) { timers.delete(id); timer.callback(); }
      await flush();
    }
  };
}

test("Node DOM 어댑터: 실제 클릭·스페이스 콜백의 동시 입력과 키 유지가 중복 보상을 막는다", async () => {
  const fx = await fixture();
  assert.equal(fx.get("balance").textContent, "0.00");
  fx.get("coinButton").click();
  fx.key();
  for (let count = 0; count < 30; count += 1) { fx.get("coinButton").emit("click"); fx.key(undefined, "keydown", true); }
  assert.equal(fx.draws(), 1);
  assert.equal(fx.saved().state.balance, "0");
  await fx.advance(700);
  assert.notEqual(fx.get("coinLift").style.transform, "translateY(0px)");
  assert.ok(Number(fx.get("coinShadow").style.opacity) < 0.42);
  await fx.advance(700);
  assert.equal(fx.saved().state.balance, "0.5");
  assert.equal(fx.get("balance").textContent, "0.50");
  assert.equal(fx.get("coinResult").textContent, "Tails +0.50 dumplings");
  assert.equal(fx.get("coinRotor").style.transform, "rotateX(1620deg)");
  assert.equal(fx.get("coinButton").disabled, true);
  await fx.advance(500);
  assert.equal(fx.get("coinButton").disabled, false);
  fx.key(undefined, "keydown", true);
  fx.key();
  assert.equal(fx.draws(), 1);
  fx.key(undefined, "keyup");
  fx.key();
  fx.key(undefined, "keyup");
  await fx.advance(1400);
  assert.equal(fx.draws(), 2);
  assert.equal(fx.saved().state.balance, "1");
  assert.equal(fx.saved().state.flips, 2);
});

test("Node DOM 어댑터: 두 자리 표시와 나침반 정산·새로고침이 미세 잔액을 보존한다", async () => {
  let fx = await fixture({ saved: { balance: "0.005" }, random: 0.99 });
  assert.equal(fx.get("balance").textContent, "0.01");
  assert.equal(fx.get("cooldownValue").textContent, "0.5s");
  assert.equal(fx.upgrade("tails").textContent, "Upgrade · 4.00 dumplings");
  fx.get("compassButton").click();
  assert.equal(fx.get("compassBaseBalance").textContent, "0.01 dumplings");
  assert.deepEqual(fx.get("compassOutcomes").children.map(row => row.children[2].textContent), ["0.00 dumplings", "0.01 dumplings", "0.01 dumplings", "0.03 dumplings"]);
  fx.get("confirmCompass").click();
  await fx.advance(2600);
  assert.equal(fx.saved().state.balance, "0.025");
  assert.equal(fx.get("compassResult").textContent, "West · 0.01 → 0.03 dumplings");
  fx = await fixture({ backing: fx.backing });
  assert.equal(fx.get("balance").textContent, "0.03");
  assert.equal(fx.saved().state.balance, "0.025");
});

test("Node DOM 어댑터: 설정·업그레이드 대상 키 입력을 분리하고 앞뒤 수익을 독립 표시한다", async () => {
  const fx = await fixture({ saved: { balance: "100" } });
  fx.key(fx.upgrade("heads"));
  fx.upgrade("heads").click();
  fx.key(fx.upgrade("heads"), "keyup");
  assert.equal(fx.get("headsReward").textContent, "+1.50 dumplings");
  assert.equal(fx.get("tailsReward").textContent, "+0.50 dumplings");
  assert.match(fx.upgrade("tails").parentElement.querySelector(".upgrade-effect").textContent, /0\.50 dumplings → 0\.75 dumplings/);
  fx.upgrade("tails").click();
  assert.equal(fx.get("headsReward").textContent, "+1.50 dumplings");
  assert.equal(fx.get("tailsReward").textContent, "+0.75 dumplings");
  fx.key(fx.get("settingsButton"));
  fx.get("settingsButton").click();
  fx.key();
  fx.get("coinButton").emit("click");
  assert.equal(fx.draws(), 0);
  assert.equal(fx.get("settingsDialog").open, true);
  assert.equal(fx.saved().state.flips, 0);
  fx.get("closeSettings").click();
  await fx.flush();
  assert.equal(fx.get("coinButton").disabled, false);
});

test("Node DOM 어댑터: 나침반 미리보기·회전 중 실제 콜백이 잔액을 잠그고 한 번 정산한다", async () => {
  const fx = await fixture({ saved: { balance: "100", levels: { luck: 16 } }, random: 0.49 });
  fx.get("compassButton").click();
  assert.equal(fx.get("compassDialog").open, true);
  assert.equal(fx.get("compassBaseBalance").textContent, "100.00 dumplings");
  assert.deepEqual(fx.get("compassOutcomes").children.map(row => row.children[1].textContent), ["49% · ×0.1", "49% · ×1.5", "1% · ×1", "1% · ×5"]);
  assert.deepEqual(fx.get("compassOutcomes").children.map(row => row.children[2].textContent), ["10.00 dumplings", "150.00 dumplings", "100.00 dumplings", "500.00 dumplings"]);
  fx.key(); fx.get("coinButton").emit("click"); fx.upgrade("heads").emit("click");
  assert.equal(fx.saved().state.balance, "100");
  assert.equal(fx.saved().state.levels.heads, 0);
  assert.equal(fx.draws(), 0);
  fx.get("confirmCompass").click();
  assert.equal(fx.saved().pending.event.direction, "south");
  fx.get("coinButton").emit("click"); fx.upgrade("heads").emit("click"); fx.get("confirmCompass").emit("click");
  assert.equal(fx.draws(), 1);
  assert.equal(fx.saved().state.balance, "100");
  assert.equal(fx.saved().state.levels.heads, 0);
  await fx.advance(2600);
  assert.equal(fx.saved().state.balance, "150");
  assert.equal(fx.saved().pending, null);
  assert.equal(fx.get("compassNeedle").style.transform, "rotate(1980deg)");
  assert.equal(fx.get("compassResult").textContent, "South · 100.00 → 150.00 dumplings");
  fx.get("confirmCompass").emit("click");
  assert.equal(fx.saved().state.balance, "150");
});

test("Node DOM 어댑터: 양면 사진 콜백, 착지 이미지 유지, 상태 복원과 한 면 복원을 연결한다", async () => {
  let fx = await fixture({ saved: { balance: "20", levels: { tails: 1 } } });
  const heads = new Blob(["distinct-heads-photo"], { type: "image/png" });
  const tails = new Blob(["distinct-tails-photo"], { type: "image/png" });
  fx.get("settingsButton").click();
  for (const [side, photo] of [["heads", heads], ["tails", tails]]) {
    fx.get(side + "Upload").files = [photo];
    fx.get(side + "Upload").emit("change");
    assert.equal(fx.get("coinButton").disabled, true);
    await fx.flush();
    assert.equal(fx.backing.photos.get(side), photo);
    assert.equal(fx.urls.get(fx.get(side + "Image").src), photo);
    assert.equal(fx.get(side + "Image").src, fx.get(side + "Preview").src);
  }
  const tailsSource = fx.get("tailsImage").src;
  fx.get("closeSettings").click(); await fx.flush();
  fx.get("coinButton").click(); await fx.advance(1400);
  assert.equal(fx.saved().state.balance, "20.75");
  assert.equal(fx.saved().state.lastSide, "tails");
  assert.equal(fx.get("tailsImage").src, tailsSource);
  fx = await fixture({ backing: fx.backing });
  assert.equal(fx.get("coinRotor").style.transform, "rotateX(180deg)");
  assert.equal(fx.get("balance").textContent, "20.75");
  assert.equal(fx.get("tailsReward").textContent, "+0.75 dumplings");
  assert.equal(fx.urls.get(fx.get("headsImage").src), heads);
  assert.equal(fx.urls.get(fx.get("tailsImage").src), tails);
  fx.get("settingsButton").click(); fx.get("resetHeads").click(); await fx.flush();
  assert.equal(fx.get("headsImage").src, fx.config.defaultImages.heads);
  assert.equal(fx.backing.photos.has("heads"), false);
  assert.equal(fx.backing.photos.get("tails"), tails);
  assert.equal(fx.urls.get(fx.get("tailsImage").src), tails);
});

test("Node DOM 어댑터: 황금 만두 피버는 입력마다 즉시 지급하고 7초 후 마지막 면으로 착지한다", async () => {
  const fx = await fixture({ saved: { balance: "100" } });
  assert.equal(fx.get("goldenDumpling").hidden, true);
  await fx.advance(20000);
  assert.equal(fx.get("goldenDumpling").hidden, false);
  fx.get("goldenDumpling").click();
  const deadline = fx.saved().fever.endsAt;
  const draws = fx.draws();
  assert.equal(fx.get("goldenDumpling").hidden, true);
  assert.equal(fx.get("feverTimer").textContent, "FEVER · 7.0s");
  assert.match(fx.get("coinButton").className, /is-fever/);
  for (let count = 0; count < 20; count++) {
    fx.get("goldenDumpling").emit("click");
    fx.get("coinButton").click();
  }
  fx.key();
  for (let count = 0; count < 30; count++) fx.key(undefined, "keydown", true);
  fx.key(undefined, "keyup"); fx.key(); fx.key(undefined, "keyup");
  assert.equal(fx.saved().state.balance, "111");
  assert.equal(fx.saved().fever.flips, 22);
  assert.equal(fx.draws() - draws, 22);
  assert.equal(fx.saved().fever.endsAt, deadline);
  fx.upgrade("heads").emit("click"); fx.get("compassButton").emit("click"); fx.get("settingsButton").emit("click");
  assert.equal(fx.saved().state.levels.heads, 0);
  assert.equal(fx.get("settingsDialog").open, false);
  assert.equal(fx.get("compassDialog").open, false);
  await fx.advance(6999);
  assert.notEqual(fx.get("coinLift").style.transform, "translateY(0px)");
  fx.get("coinButton").click();
  assert.equal(fx.saved().state.balance, "111.5");
  await fx.advance(1);
  fx.get("coinButton").emit("click"); fx.key();
  assert.equal(fx.saved().state.balance, "111.5");
  assert.equal(fx.get("coinButton").disabled, true);
  await fx.advance(500);
  assert.equal(fx.saved().fever, null);
  assert.equal(fx.saved().state.lastSide, "tails");
  assert.equal(fx.get("coinLift").style.transform, "translateY(0px)");
  assert.equal(Number(fx.get("coinRotor").style.transform.match(/rotateX\((.+)deg\)/)[1]) % 360, 180);
  assert.equal(fx.get("coinButton").disabled, false);
  assert.doesNotMatch(fx.get("coinButton").className, /is-fever/);
  assert.equal(fx.get("feverTimer").hidden, true);
});

test("Node DOM 어댑터: 비행 중 예약한 피버는 사진과 소수 보상을 유지하고 남은 시간만 복원한다", async () => {
  let fx = await fixture({ saved: { balance: "0.005", levels: { tails: 1 } } });
  const heads = new Blob(["cat"], { type: "image/png" });
  const tails = new Blob(["dog"], { type: "image/png" });
  fx.backing.photos.set("heads", heads); fx.backing.photos.set("tails", tails);
  await fx.advance(20000);
  fx.get("coinButton").click();
  fx.get("goldenDumpling").click();
  assert.equal(fx.saved().golden.queued, true);
  assert.equal(fx.saved().fever, null);
  await fx.advance(1400);
  assert.equal(fx.get("feverTimer").textContent, "FEVER · 7.0s");
  assert.equal(fx.saved().state.balance, "0.755");
  fx.get("coinButton").click();
  assert.equal(fx.saved().state.balance, "1.505");
  await fx.advance(2000);
  const deadline = fx.saved().fever.endsAt;
  fx = await fixture({ backing: fx.backing, now: fx.now() });
  assert.equal(fx.get("feverTimer").textContent, "FEVER · 5.0s");
  assert.equal(fx.get("balance").textContent, "1.51");
  assert.equal(fx.saved().fever.endsAt, deadline);
  assert.equal(fx.urls.get(fx.get("headsImage").src), heads);
  assert.equal(fx.urls.get(fx.get("tailsImage").src), tails);
  assert.match(fx.get("tailsImage").className, /is-custom/);
  await fx.advance(5000); await fx.advance(500);
  assert.equal(fx.saved().state.balance, "1.505");
  assert.equal(fx.saved().state.lastSide, "tails");
  assert.equal(fx.urls.get(fx.get("tailsImage").src), tails);
  assert.equal(fx.saved().fever, null);
});

test("Node DOM 어댑터: 숨겨진 탭·설정에서는 황금 만두를 기다리고 나침반 회전 중에는 숨긴다", async () => {
  const fx = await fixture({ saved: { balance: "100" } });
  fx.hide(true); await fx.advance(20000);
  assert.equal(fx.get("goldenDumpling").hidden, true);
  fx.hide(false); fx.get("settingsButton").click(); await fx.advance(1000);
  assert.equal(fx.saved().golden.visibleUntil, 0);
  fx.get("closeSettings").click(); await fx.flush(); await fx.advance(250);
  assert.equal(fx.get("goldenDumpling").hidden, false);
  fx.get("compassButton").click();
  assert.equal(fx.get("goldenDumpling").hidden, true);
  fx.get("confirmCompass").click();
  assert.equal(fx.get("goldenDumpling").hidden, true);
  fx.get("goldenDumpling").emit("click");
  assert.equal(fx.saved().fever, null);
  await fx.advance(2600);
  assert.equal(fx.get("goldenDumpling").hidden, false);
  await fx.advance(12000);
  assert.equal(fx.get("goldenDumpling").hidden, true);
  fx.get("goldenDumpling").emit("click");
  assert.equal(fx.saved().fever, null);
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const config = require('../config.js');
const source = fs.readFileSync(path.join(__dirname, '../storage.js'), 'utf8');

// 브라우저 렌더링 테스트와 별개로 저장 실패·파일 검사 분기를 실제 storage.js로 검증합니다.
function storageFixture({ denyLocal = false, denyDatabase = false, failWrite = false, decodeError = false } = {}) {
  const strings = new Map();
  const blobs = new Map();
  const revoked = [];
  const created = [];
  const failure = new Error('테스트 저장 공간 제한');
  const database = {
    transaction(name, mode) {
      assert.equal(name, 'faces');
      const transaction = { error: failure };
      transaction.objectStore = () => {
        function request(operation) {
          const request = {};
          queueMicrotask(() => {
            if (failWrite && mode === 'readwrite') transaction.onabort();
            else { request.result = operation(); transaction.oncomplete(); }
          });
          return request;
        }
        return {
          get: side => request(() => blobs.get(side)),
          put: (blob, side) => request(() => { blobs.set(side, blob); return side; }),
          delete: side => request(() => blobs.delete(side))
        };
      };
      return transaction;
    }
  };
  const sandbox = {
    Blob, Uint8Array, Error,
    localStorage: {
      getItem: key => { if (denyLocal) throw failure; return strings.get(key) || null; },
      setItem: (key, value) => { if (denyLocal) throw failure; strings.set(key, value); }
    },
    indexedDB: {
      open() {
        const request = { result: database, error: failure };
        queueMicrotask(() => { if (denyDatabase) request.onerror(); else request.onsuccess(); });
        return request;
      }
    },
    URL: {
      createObjectURL(blob) { const url = 'blob:test-' + created.length; created.push({ url, blob }); return url; },
      revokeObjectURL(url) { revoked.push(url); }
    },
    Image: class {
      set src(value) { queueMicrotask(() => decodeError ? this.onerror() : this.onload()); }
    }
  };
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox, { filename: 'storage.js' });
  return { ...sandbox.CoinGameStorage, strings, blobs, revoked, created };
}

test('저장 JSON은 소수 문자열·업그레이드·마지막 면·확정 결과를 보존한다', () => {
  const fx = storageFixture();
  const store = new fx.LocalStore('test');
  const save = { state: { balance: '0.0000000000005', levels: { heads: 3, tails: 1 }, lastSide: 'tails' }, pending: { kind: 'compass', event: { result: '0.00000000000005' } } };
  assert.equal(store.loadGame(), null);
  store.saveGame(save);
  assert.deepEqual(JSON.parse(JSON.stringify(store.loadGame())), save);
});

test('브라우저 저장 차단·손상 JSON을 조용히 성공 처리하지 않는다', () => {
  const denied = storageFixture({ denyLocal: true });
  assert.throws(() => new denied.LocalStore('test').saveGame({}), /저장 공간 제한/);
  assert.throws(() => new denied.LocalStore('test').loadGame(), /저장 공간 제한/);
  const broken = storageFixture();
  broken.strings.set('test', '{broken');
  assert.throws(() => new broken.LocalStore('test').loadGame(), /saved game/);
});

test('두 면의 원본 Blob은 따로 보관하고 한 면 복원은 다른 면을 건드리지 않는다', async () => {
  const fx = storageFixture();
  const store = new fx.LocalStore('test');
  const heads = new Blob(['heads bytes'], { type: 'image/png' });
  const tails = new Blob(['tails bytes'], { type: 'image/gif' });
  await store.setPhoto('heads', heads);
  await store.setPhoto('tails', tails);
  assert.equal(await store.getPhoto('heads'), heads);
  assert.equal(await store.getPhoto('tails'), tails);
  await store.resetPhoto('heads');
  assert.equal(await store.getPhoto('heads'), undefined);
  assert.equal(await store.getPhoto('tails'), tails);
});

test('IndexedDB 열기·쓰기 실패는 호출자에게 전달하고 기존 사진을 보존한다', async () => {
  const denied = storageFixture({ denyDatabase: true });
  await assert.rejects(new denied.LocalStore('test').getPhoto('heads'), /저장 공간 제한/);
  const fx = storageFixture({ failWrite: true });
  const original = new Blob(['original']);
  fx.blobs.set('heads', original);
  await assert.rejects(new fx.LocalStore('test').setPhoto('heads', new Blob(['replacement'])), /저장 공간 제한/);
  assert.equal(fx.blobs.get('heads'), original);
});

test('실제 앞뒤 GIF 원본 바이트와 MIME 형식이 검증 후에도 그대로 남는다', async () => {
  const fx = storageFixture();
  for (const name of ['앞면1.gif', '뒷면1.gif']) {
    const original = fs.readFileSync(path.join(__dirname, '../../coin', name));
    // 잘못된 외부 MIME 값이어도 실제 GIF 시그니처를 기준으로 올바르게 정규화합니다.
    const validated = await fx.validatePhoto(new Blob([original], { type: 'application/octet-stream' }), config.maxImageBytes);
    assert.equal(validated.type, 'image/gif');
    assert.deepEqual(Buffer.from(await validated.arrayBuffer()), original);
  }
  assert.equal(fx.revoked.length, 2);
});

test('빈 파일·위장 확장자·용량 초과를 거부하고 해독 실패 시 임시 URL을 해제한다', async () => {
  const fx = storageFixture();
  await assert.rejects(fx.validatePhoto(new Blob([]), 1024), /empty/);
  await assert.rejects(fx.validatePhoto(new Blob(['not png'], { type: 'image/png' }), 1024), /PNG, JPG/);
  await assert.rejects(fx.validatePhoto(new Blob([new Uint8Array(20)]), 10), /no larger than/);
  assert.equal(fx.created.length, 0);
  const broken = storageFixture({ decodeError: true });
  await assert.rejects(broken.validatePhoto(new Blob([new Uint8Array([137,80,78,71,13,10,26,10])]), 1024), /read that image/);
  assert.equal(broken.created.length, 1);
  assert.deepEqual(broken.revoked, [broken.created[0].url]);
});

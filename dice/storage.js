/* 사진은 서버로 전송하지 않고 원본 Blob 그대로 보관해 GIF 애니메이션을 유지합니다. */
(function (root) {
  'use strict';

  class LocalStore {
    constructor(key) {
      this.key = key;
      this.database = null;
    }

    loadGame() {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      try { return JSON.parse(raw); }
      catch { throw new Error('Could not read your saved game. Starting fresh in this tab.'); }
    }

    saveGame(game) {
      localStorage.setItem(this.key, JSON.stringify(game));
    }

    async openPhotos() {
      if (this.database) return this.database;
      this.database = await new Promise((resolve, reject) => {
        const request = indexedDB.open(this.key + '.photos', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('faces');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('Another tab is using photo storage. Close it and try again.'));
      });
      return this.database;
    }

    async photoTransaction(mode, operation) {
      const database = await this.openPhotos();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction('faces', mode);
        const request = operation(transaction.objectStore('faces'));
        // 요청 성공뿐 아니라 실제 디스크 저장 완료까지 기다린 뒤 화면을 바꿉니다.
        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('Photo saving was cancelled.'));
      });
    }

    getPhoto(side) { return this.photoTransaction('readonly', store => store.get(side)); }
    setPhoto(side, file) { return this.photoTransaction('readwrite', store => store.put(file, side)); }
    resetPhoto(side) { return this.photoTransaction('readwrite', store => store.delete(side)); }
  }

  async function validatePhoto(file, maxBytes) {
    if (!file || !file.size) throw new Error('That file is empty. Please pick a picture.');
    if (file.size > maxBytes) throw new Error('Choose an image no larger than ' + (maxBytes / 1024 / 1024) + 'MB per side.');
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const signature = String.fromCharCode(...bytes.slice(0, 6));
    const gif = signature === 'GIF87a' || signature === 'GIF89a';
    if (!png && !jpeg && !gif) throw new Error('Only PNG, JPG/JPEG and GIF images are supported.');
    // 확장자만 믿지 않고 실제 형식과 브라우저의 이미지 해독 가능 여부를 확인합니다.
    const blob = new Blob([file], { type: png ? 'image/png' : jpeg ? 'image/jpeg' : 'image/gif' });
    const url = URL.createObjectURL(blob);
    try {
      await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Could not read that image. Please choose another file.'));
        image.src = url;
      });
    } finally { URL.revokeObjectURL(url); }
    return blob;
  }

  root.CoinGameStorage = { LocalStore, validatePhoto };
})(window);

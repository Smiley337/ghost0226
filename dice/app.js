/* 화면, 입력, 애니메이션만 담당합니다. 확률과 정산은 core.js에서 한 번만 처리합니다. */
(async function () {
  'use strict';
  const config = window.COIN_CONFIG;
  const { GameEngine, formatMoney, compareMoney } = window.CoinGameCore;
  const { LocalStore, validatePhoto } = window.CoinGameStorage;
  const $ = id => document.getElementById(id);
  const store = new LocalStore(config.storageKey);
  const sideNames = { heads: 'Heads', tails: 'Tails' };
  const photoUrls = {};
  let storageAvailable = true;
  let saved = null;
  let photoBusy = false;
  let spaceHeld = false;
  let resultTimer;
  let toastTimer;
  let compassAngle = 0;
  let renderTimer;
  let feverAnimationId = null;

  function notify(message) {
    $('toast').textContent = message;
    $('toast').classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('is-visible'), 4500);
  }

  try { saved = store.loadGame(); }
  catch (error) { storageAvailable = false; notify(error.message || 'Browser storage is unavailable.'); }
  const engine = new GameEngine(saved);
  let coinAngle = engine.state.lastSide === 'tails' ? 180 : 0;

  function save() {
    try {
      store.saveGame(engine.serialize());
      storageAvailable = true;
    } catch {
      storageAvailable = false;
      notify('Storage is full or blocked. Progress may be lost if you reload.');
    }
    $('saveStatus').textContent = storageAvailable ? 'Saved in this browser' : 'Save unavailable · this tab only';
  }

  function applyPhoto(side, blob) {
    if (photoUrls[side]) URL.revokeObjectURL(photoUrls[side]);
    photoUrls[side] = blob ? URL.createObjectURL(blob) : null;
    const source = photoUrls[side] || config.defaultImages[side];
    $(side + 'Image').src = source;
    $(side + 'Preview').src = source;
    $(side + 'Preview').alt = sideNames[side] + (blob ? ' custom image preview' : ' default image preview');
    // 기본 GIF의 투명 실루엣을 살리고, 사용자 사진에만 원형 크롭을 적용합니다.
    for (const suffix of ['Image', 'Preview']) {
      if (blob) $(side + suffix).classList.add('is-custom');
      else $(side + suffix).classList.remove('is-custom');
    }
  }

  $('coinRotor').style.transform = `rotateX(${coinAngle}deg)`;
  for (const side of ['heads', 'tails']) applyPhoto(side, null);
  try {
    const photos = await Promise.all(['heads', 'tails'].map(side => store.getPhoto(side)));
    ['heads', 'tails'].forEach((side, index) => { if (photos[index] instanceof Blob) applyPhoto(side, photos[index]); });
  } catch { notify('Could not open photo storage. Using the default images.'); }

  const upgradeCopy = {
    luck: { label: 'Luck', icon: '✧', description: 'Increase the chance of landing heads.' },
    heads: { label: 'Heads payout', icon: 'H', description: 'Earn a little more from heads.' },
    tails: { label: 'Tails payout', icon: 'T', description: 'Earn a little more from tails.' },
    speed: { label: 'Flip speed', icon: '»', description: 'Shorten the wait between flips.' }
  };
  const upgradeNodes = {};
  for (const [key, copy] of Object.entries(upgradeCopy)) {
    const card = document.createElement('article');
    card.className = 'upgrade-card';
    card.innerHTML = `<div class="upgrade-heading"><span class="upgrade-icon" aria-hidden="true">${copy.icon}</span><h3>${copy.label}</h3><span class="upgrade-level"></span></div><p class="upgrade-description">${copy.description}</p><p class="upgrade-effect"></p><button type="button" class="upgrade-buy" data-upgrade="${key}"></button>`;
    $('upgrades').appendChild(card);
    upgradeNodes[key] = { card, level: card.querySelector('.upgrade-level'), effect: card.querySelector('.upgrade-effect'), button: card.querySelector('button') };
    upgradeNodes[key].button.addEventListener('click', () => {
      if (anyDialogOpen() || photoBusy || !engine.buyUpgrade(key)) return;
      save(); render(); notify(copy.label + ' upgraded.');
    });
  }

  function anyDialogOpen() { return $('settingsDialog').open || $('compassDialog').open; }
  function percentage(value) { return Number((value * 100).toFixed(2)) + '%'; }
  function seconds(milliseconds) { return String(milliseconds / 1000) + 's'; }
  function moneyLabel(value) { return formatMoney(value) + (compareMoney(value, '1') === 0 ? ' dumpling' : ' dumplings'); }
  function effectLabel(key, value) {
    if (key === 'luck') return percentage(value);
    if (key === 'speed') return seconds(value);
    return moneyLabel(value);
  }

  function render() {
    const effects = engine.effects();
    const phase = engine.phase;
    const idle = phase === 'idle';
    const fever = engine.feverInfo();
    $('balance').textContent = formatMoney(engine.state.balance);
    $('balance').title = moneyLabel(engine.state.balance);
    $('headsOdds').textContent = percentage(effects.headsChance);
    $('tailsOdds').textContent = percentage(1 - effects.headsChance);
    $('headsReward').textContent = '+' + moneyLabel(effects.headsReward);
    $('tailsReward').textContent = '+' + moneyLabel(effects.tailsReward);
    $('cooldownValue').textContent = phase === 'fever' ? 'None · fever' : seconds(effects.cooldownMs);
    $('coinButton').disabled = !(idle || phase === 'fever') || anyDialogOpen() || photoBusy;
    $('coinButton').setAttribute('aria-label', 'Flip the coin. Current side: ' + sideNames[engine.state.lastSide]);
    $('coinButton').setAttribute('aria-busy', String(phase === 'flipping'));
    $('compassButton').disabled = !idle || anyDialogOpen() || compareMoney(engine.state.balance, '0') <= 0;
    $('settingsButton').disabled = !idle || photoBusy;
    const statuses = { idle: 'A little luck, at your own pace.', flipping: engine.goldenInfo().queued ? 'Fever begins after this flip.' : 'A moment in the air…', cooldown: 'Ready again in a moment.', 'compass-preview': 'Choose when you are ready.', 'compass-spinning': 'Finding a direction…', fever: 'Fever time. Every tap is a new flip.', 'fever-landing': 'One last turn, then back to the table.' };
    $('gameStatus').textContent = statuses[phase];
    $('normalInstructions').hidden = Boolean(fever);
    $('feverInstructions').hidden = !fever;
    $('feverTimer').hidden = !fever && !engine.goldenInfo().queued;
    if (engine.goldenInfo().queued) $('feverTimer').textContent = 'Fever queued';
    if (fever) paintFever(fever);
    $('goldenDumpling').hidden = !engine.goldenInfo().visible || !['idle', 'cooldown', 'flipping'].includes(phase) || anyDialogOpen() || photoBusy || document.hidden;
    for (const [key, nodes] of Object.entries(upgradeNodes)) {
      const info = engine.upgradeInfo(key);
      nodes.level.textContent = 'Lv. ' + info.level;
      const prefix = key === 'heads' ? 'Heads: ' : key === 'tails' ? 'Tails: ' : '';
      nodes.effect.textContent = prefix + effectLabel(key, info.current) + (info.maxed ? ' · Max level' : ' → ' + effectLabel(key, info.next));
      nodes.button.textContent = info.maxed ? 'Fully upgraded' : 'Upgrade · ' + moneyLabel(info.cost);
      nodes.button.disabled = !idle || anyDialogOpen() || photoBusy || info.maxed || !info.affordable;
      nodes.button.setAttribute('aria-label', upgradeCopy[key].label + ', ' + nodes.effect.textContent + ', ' + nodes.button.textContent);
    }
    clearTimeout(renderTimer);
    if (phase === 'cooldown') renderTimer = setTimeout(render, 40);
  }

  function paintFever(info) {
    const clock = info.remainingMs > 0 ? 'FEVER · ' + (info.remainingMs / 1000).toFixed(1) + 's' : 'Fever complete';
    if ($('feverTimer').textContent !== clock) $('feverTimer').textContent = clock;
    $('feverProgress').style.transform = 'scaleX(' + info.remainingMs / config.fever.durationMs + ')';
    $('feverScore').textContent = info.flips + ' flips · +' + moneyLabel(info.reward);
  }

  function showCoinResult(message, duration = 2000) {
    clearTimeout(resultTimer);
    $('coinResult').textContent = message;
    $('coinResult').classList.add('is-visible');
    resultTimer = setTimeout(() => $('coinResult').classList.remove('is-visible'), duration);
  }

  function updateBonus() {
    const previous = engine.goldenInfo();
    // 다른 탭이나 대화상자를 보는 동안 새 황금 만두의 제한 시간을 시작하지 않습니다.
    if (!document.hidden && !anyDialogOpen() && !photoBusy) engine.updateGolden();
    const current = engine.goldenInfo();
    if (current.nextAt !== previous.nextAt || current.visibleUntil !== previous.visibleUntil) save();
    $('goldenDumpling').hidden = !current.visible || !['idle', 'cooldown', 'flipping'].includes(engine.phase) || document.hidden || anyDialogOpen() || photoBusy;
    if (current.visible && !previous.visible) notify('A golden dumpling appeared. Tap it for 7 seconds of fever.');
    setTimeout(updateBonus, 250);
  }

  $('goldenDumpling').addEventListener('click', () => {
    if (document.hidden || anyDialogOpen() || photoBusy || !engine.claimGolden()) return;
    save(); render();
    if (engine.feverInfo()) startFeverAnimation();
    else notify('Golden dumpling collected. Fever starts after this flip.');
  });

  async function startFeverAnimation() {
    const fever = engine.feverInfo();
    if (!fever || feverAnimationId === fever.id) return;
    feverAnimationId = fever.id;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    $('coinButton').classList.add('is-fever');
    $('coinButton').focus?.({ preventScroll: true });
    $('coinButton').scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    // 연타 결과를 스크린 리더가 매번 읽지 않도록 시작과 종료만 별도로 안내합니다.
    $('coinResult').setAttribute('aria-live', 'off');
    clearTimeout(resultTimer);
    $('coinResult').classList.remove('is-visible');
    notify('Fever time! Click, tap, or press Space without waiting.');
    const startAngle = coinAngle;
    const remainingAtStart = fever.remainingMs;
    const headroom = Math.max(20, $('coinButton').offsetTop - $('coinButton').clientHeight / 2 - 16);
    const height = reduced ? 16 : Math.min(90, headroom);
    let lift = 0;
    await new Promise(resolve => {
      function frame() {
        const info = engine.feverInfo();
        const elapsed = Math.max(0, remainingAtStart - info.remainingMs);
        const rising = Math.min(1, elapsed / 220);
        lift = height * (1 - Math.pow(1 - rising, 2));
        coinAngle = startAngle + elapsed / 1000 * (reduced ? 120 : config.fever.spinDegreesPerSecond);
        $('coinLift').style.transform = 'translateY(' + -lift + 'px)';
        $('coinRotor').style.transform = 'rotateX(' + coinAngle + 'deg)';
        $('coinShadow').style.transform = 'scale(' + (1 - 0.4 * rising) + ')';
        $('coinShadow').style.opacity = String(0.42 - 0.25 * rising);
        $('coinShadow').style.filter = 'blur(' + (3 + 9 * rising) + 'px)';
        paintFever(info);
        if (info.remainingMs > 0) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
    render();
    // 마지막으로 실제 지급된 면을 향해 남은 회전을 마칩니다. 이미지를 갈아 끼우지 않습니다.
    const landingStart = coinAngle;
    const target = engine.state.lastSide === 'tails' ? 180 : 0;
    const endAngle = landingStart + (reduced ? 0 : 360) + (target - landingStart % 360 + 360) % 360;
    await animate(config.fever.landingMs, progress => {
      $('coinLift').style.transform = 'translateY(' + -lift * (1 - progress * progress) + 'px)';
      $('coinRotor').style.transform = 'rotateX(' + (landingStart + (endAngle - landingStart) * (1 - Math.pow(1 - progress, 2))) + 'deg)';
      $('coinShadow').style.transform = 'scale(' + (0.6 + 0.4 * progress) + ')';
      $('coinShadow').style.opacity = String(0.17 + 0.25 * progress);
      $('coinShadow').style.filter = 'blur(' + (12 - 9 * progress) + 'px)';
    });
    coinAngle = endAngle;
    $('coinButton').classList.remove('is-fever');
    $('coinResult').setAttribute('aria-live', 'polite');
    const result = engine.finishFever(fever.id);
    feverAnimationId = null;
    save(); render();
    if (result) {
      showCoinResult(sideNames[result.side] + ' · Fever complete');
      notify('Fever complete: ' + result.flips + ' flips, +' + moneyLabel(result.reward) + '.');
    }
  }

  // 하나의 시간축으로 위치와 회전을 함께 계산합니다. 착지 때 면 이미지를 교체하지 않습니다.
  function animate(duration, frame) {
    return new Promise(resolve => {
      const start = performance.now();
      function tick(now) {
        const progress = Math.min(1, (now - start) / duration);
        frame(progress);
        if (progress < 1) requestAnimationFrame(tick);
        else resolve();
      }
      requestAnimationFrame(tick);
    });
  }

  async function flip() {
    if (anyDialogOpen() || photoBusy) return;
    if (engine.phase === 'fever') {
      const result = engine.rollFever();
      if (!result) return;
      save();
      $('balance').textContent = formatMoney(engine.state.balance);
      $('balance').title = moneyLabel(engine.state.balance);
      showCoinResult(sideNames[result.side] + ' +' + moneyLabel(result.reward));
      paintFever(engine.feverInfo());
      return;
    }
    const toss = engine.beginFlip();
    if (!toss) return; // 입력 첫 순간에 엔진을 잠가 클릭+스페이스도 한 번만 통과합니다.
    save(); render();
    clearTimeout(resultTimer);
    $('coinResult').textContent = '';
    $('coinResult').classList.remove('is-visible');
    const startAngle = coinAngle;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const turns = reduced ? 1 : 4;
    const endAngle = startAngle + turns * 360 + (toss.side !== toss.startSide ? 180 : 0);
    // 좁은 화면에서도 사진이 위쪽 제목을 침범하지 않도록 실제 남은 공간을 계산합니다.
    const headroom = Math.max(28, $('coinButton').offsetTop - $('coinButton').clientHeight / 2 - 16);
    const height = reduced ? 28 : Math.min(150, $('coinStage').clientHeight * 0.28, headroom);
    await animate(reduced ? 650 : config.flipDurationMs, progress => {
      const lift = 4 * progress * (1 - progress);
      // 가속도를 완만하게 바꾸되 마지막 반 바퀴도 원래 회전 궤적을 이어 갑니다.
      const rotationProgress = 1 - Math.pow(1 - progress, 1.35);
      $('coinLift').style.transform = `translateY(${-height * lift}px)`;
      $('coinRotor').style.transform = `rotateX(${startAngle + (endAngle - startAngle) * rotationProgress}deg)`;
      $('coinShadow').style.transform = `scale(${1 - lift * 0.4})`;
      $('coinShadow').style.opacity = String(0.42 - lift * 0.25);
      $('coinShadow').style.filter = `blur(${3 + lift * 9}px)`;
    });
    coinAngle = endAngle; // 누적 각도를 유지하므로 다음 던지기는 지금 보이는 면에서 시작합니다.
    const result = engine.finishFlip(toss.id);
    if (result) {
      $('coinResult').textContent = sideNames[result.side] + ' +' + moneyLabel(result.reward);
      $('coinResult').classList.add('is-visible');
      resultTimer = setTimeout(() => $('coinResult').classList.remove('is-visible'), 2000);
      save(); render();
      if (engine.feverInfo()) startFeverAnimation();
    }
  }

  $('coinButton').addEventListener('click', flip);
  document.addEventListener('keydown', event => {
    if (event.code !== 'Space' || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const target = event.target;
    const editing = target.closest('button, a, input, textarea, select, [contenteditable], [role="button"]');
    if (anyDialogOpen() || (editing && editing !== $('coinButton'))) return;
    event.preventDefault(); // 동전 버튼의 기본 keyup 클릭과 페이지 스크롤까지 함께 막습니다.
    if (event.repeat || spaceHeld) return;
    spaceHeld = true;
    flip();
  });
  document.addEventListener('keyup', event => {
    if (event.code !== 'Space') return;
    if (spaceHeld) event.preventDefault();
    spaceHeld = false;
  });
  window.addEventListener('blur', () => { spaceHeld = false; });

  $('compassButton').addEventListener('click', () => {
    if (anyDialogOpen() || photoBusy) return;
    const preview = engine.previewCompass();
    if (!preview) return;
    $('compassBaseBalance').textContent = moneyLabel(preview.balance);
    $('compassOutcomes').replaceChildren();
    for (const outcome of preview.outcomes) {
      const row = document.createElement('div');
      row.className = 'compass-outcome compass-outcome--' + outcome.direction.toLowerCase();
      row.innerHTML = '<strong></strong><span></span><b></b>';
      row.children[0].textContent = outcome.label;
      row.children[1].textContent = Math.round(outcome.probability * 100) + '% · ×' + outcome.multiplier;
      row.children[2].textContent = moneyLabel(outcome.result);
      row.children[2].title = moneyLabel(outcome.result);
      $('compassOutcomes').appendChild(row);
    }
    $('compassDialog').showModal(); render();
  });
  function cancelCompass() { engine.cancelCompass(); $('compassDialog').close(); render(); }
  $('cancelCompass').addEventListener('click', cancelCompass);
  $('compassDialog').addEventListener('cancel', event => { event.preventDefault(); cancelCompass(); });
  $('confirmCompass').addEventListener('click', async () => {
    const spin = engine.beginCompass();
    if (!spin) return;
    save();
    $('compassDialog').close(); render();
    $('compassResult').textContent = 'Finding a direction…';
    const start = compassAngle;
    const end = start + 5 * 360 + ((spin.angle - start % 360 + 360) % 360);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    await animate(reduced ? 700 : config.compassDurationMs, progress => {
      const angle = start + (end - start) * (1 - Math.pow(1 - progress, 3));
      $('compassNeedle').style.transform = `rotate(${angle}deg)`;
    });
    compassAngle = end;
    const result = engine.finishCompass(spin.id);
    if (result) {
      $('compassResult').textContent = result.label + ' · ' + formatMoney(result.balance) + ' → ' + moneyLabel(result.result);
      save(); render();
    }
  });

  $('settingsButton').addEventListener('click', () => {
    if (engine.phase !== 'idle') return;
    $('settingsDialog').showModal(); render();
  });
  $('closeSettings').addEventListener('click', () => { if (!photoBusy) $('settingsDialog').close(); });
  $('settingsDialog').addEventListener('cancel', event => { if (photoBusy) event.preventDefault(); });
  $('settingsDialog').addEventListener('close', render);

  function setPhotoBusy(value) {
    photoBusy = value;
    for (const id of ['headsUpload', 'tailsUpload', 'resetHeads', 'resetTails', 'closeSettings']) $(id).disabled = value;
    render();
  }
  for (const side of ['heads', 'tails']) {
    $(side + 'Upload').addEventListener('change', async event => {
      const file = event.target.files[0];
      if (!file || photoBusy) return;
      setPhotoBusy(true);
      $('settingsMessage').textContent = 'Saving your picture in this browser…';
      try {
        const blob = await validatePhoto(file, config.maxImageBytes);
        await store.setPhoto(side, blob);
        applyPhoto(side, blob);
        $('settingsMessage').textContent = sideNames[side] + ' picture saved in this browser.';
      } catch (error) { $('settingsMessage').textContent = error.message || 'Could not save the photo. Check your browser storage.'; }
      finally { event.target.value = ''; setPhotoBusy(false); }
    });
    $('reset' + (side === 'heads' ? 'Heads' : 'Tails')).addEventListener('click', async () => {
      if (photoBusy) return;
      setPhotoBusy(true);
      try {
        await store.resetPhoto(side);
        applyPhoto(side, null);
        $('settingsMessage').textContent = sideNames[side] + ' restored to the default image.';
      } catch { $('settingsMessage').textContent = 'Could not restore the picture. Please try again.'; }
      finally { setPhotoBusy(false); }
    });
  }
  // 미완료 추첨을 복구한 경우에도 새 정산값을 즉시 저장해 반복 복구를 막습니다.
  save(); render();
  updateBonus();
  if (engine.feverInfo()) startFeverAnimation();
})();

document.addEventListener('DOMContentLoaded', function() {
  var app = document.getElementById('pm2-app');
  var timeEl = document.getElementById('pm2-time');
  var statusEl = document.getElementById('pm2-status');
  var barEl = document.getElementById('pm2-progress-bar');
  var pctEl = document.getElementById('pm2-progress-pct');
  var dotsEl = document.getElementById('pm2-dots');
  var todayEl = document.getElementById('pm2-today');
  var noticeEl = document.getElementById('pm2-notice');
  var btnStart = document.getElementById('pm2-start');
  var btnPause = document.getElementById('pm2-pause');
  var btnSkip = document.getElementById('pm2-skip');
  var btnReset = document.getElementById('pm2-reset');
  var btnFs = document.getElementById('pm2-fullscreen');
  var notifyRow = document.getElementById('pm2-notify-row');
  var btnNotify = document.getElementById('pm2-notify');
  var inFocus = document.getElementById('pm2-focus-min');
  var inShort = document.getElementById('pm2-short-min');
  var inLong = document.getElementById('pm2-long-min');
  var inEvery = document.getElementById('pm2-every');
  var inAuto = document.getElementById('pm2-auto');
  var inSound = document.getElementById('pm2-sound');
  var KEY = 'pm2-pomodoro-v2';
  var MODES = {
    focus: { name: '🔥 Tập trung', focus: true, fixed: 0 },
    short: { name: '☕ Nghỉ ngắn', focus: false, fixed: 0 },
    long: { name: '🛋️ Nghỉ dài', focus: false, fixed: 0 },
    deep: { name: '🧠 Tập trung sâu', focus: true, fixed: 45 },
    hardcore: { name: '💻 Tập trung dài', focus: true, fixed: 60 }
  };
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function clampNum(v, lo, hi, fb) {
    v = parseInt(v, 10);
    if (isNaN(v)) return fb;
    return Math.min(hi, Math.max(lo, v));
  }
  function formatMs(ms) {
    var total = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(total / 60).toString();
    var s = (total % 60).toString().padStart(2, '0');
    return (m.length < 2 ? '0' + m : m) + ':' + s;
  }
  function nextAfterFocus(done, every) {
    return (done > 0 && done % every === 0) ? 'long' : 'short';
  }
  var S = {
    mode: 'focus', theme: 'neo', running: false, endAt: 0, remainingMs: 25 * 60000,
    focusDone: 0, todayDate: todayStr(), todaySessions: 0, todayMinutes: 0,
    focusMin: 25, shortMin: 5, longMin: 15, every: 4, auto: true, sound: true
  };
  var timerId = null;
  var originalTitle = document.title;
  function durationMs(mode) {
    var m = MODES[mode];
    var min = m.fixed ? m.fixed : (mode === 'short' ? S.shortMin : (mode === 'long' ? S.longMin : S.focusMin));
    return min * 60000;
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        mode: S.mode, theme: S.theme, running: S.running, endAt: S.endAt, remainingMs: S.remainingMs,
        focusDone: S.focusDone, todayDate: S.todayDate, todaySessions: S.todaySessions, todayMinutes: S.todayMinutes,
        focusMin: S.focusMin, shortMin: S.shortMin, longMin: S.longMin, every: S.every, auto: S.auto, sound: S.sound
      }));
    } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (!MODES[d.mode]) return;
      S.mode = d.mode;
      S.theme = ['neo', 'flow', 'breath', 'matrix'].indexOf(d.theme) >= 0 ? d.theme : 'neo';
      S.focusDone = clampNum(d.focusDone, 0, 100000, 0);
      S.focusMin = clampNum(d.focusMin, 1, 120, 25);
      S.shortMin = clampNum(d.shortMin, 1, 120, 5);
      S.longMin = clampNum(d.longMin, 1, 120, 15);
      S.every = clampNum(d.every, 2, 8, 4);
      S.auto = d.auto !== false;
      S.sound = d.sound !== false;
      if (d.todayDate === todayStr()) {
        S.todayDate = d.todayDate;
        S.todaySessions = clampNum(d.todaySessions, 0, 100000, 0);
        S.todayMinutes = clampNum(d.todayMinutes, 0, 1000000, 0);
      }
      var total = durationMs(S.mode);
      if (d.running && d.endAt) {
        var rem = d.endAt - Date.now();
        if (rem > 0) {
          S.running = true; S.endAt = d.endAt; S.remainingMs = rem;
        } else {
          S.running = false;
          finishWhileAway();
          return;
        }
      } else {
        S.running = false;
        S.remainingMs = clampNum(d.remainingMs, 0, total, total);
        if (S.remainingMs <= 0) S.remainingMs = total;
      }
    } catch (e) {}
  }
  function finishWhileAway() {
    var finishedName = MODES[S.mode].name;
    if (MODES[S.mode].focus) {
      S.focusDone += 1; S.todaySessions += 1; S.todayMinutes += Math.round(durationMs(S.mode) / 60000);
    }
    if (S.auto) S.mode = MODES[S.mode].focus ? nextAfterFocus(S.focusDone, S.every) : 'focus';
    S.remainingMs = durationMs(S.mode);
    noticeEl.hidden = false;
    noticeEl.textContent = '⏰ Phiên trước đã hết giờ khi bạn vắng mặt (đã xong: ' + finishedName + ').';
  }
  function dotsFilled() {
    var pos = S.focusDone % S.every;
    if (S.mode === 'long' && S.focusDone > 0 && pos === 0) return S.every;
    return pos;
  }
  function render() {
    var total = durationMs(S.mode);
    var rem = Math.max(0, S.remainingMs);
    timeEl.textContent = formatMs(rem);
    var partial = rem < total;
    statusEl.textContent = (!S.running && partial) ? '⏸️ Tạm dừng: ' + MODES[S.mode].name : MODES[S.mode].name;
    var pct = total > 0 ? Math.min(100, Math.max(0, Math.round((total - rem) / total * 100))) : 0;
    barEl.style.width = pct + '%';
    pctEl.textContent = 'Đã trôi qua: ' + pct + '%';
    var filled = dotsFilled();
    var html = '';
    for (var i = 0; i < S.every; i++) html += '<span class="pm2-dot' + (i < filled ? ' on' : '') + '"></span>';
    dotsEl.innerHTML = html;
    todayEl.textContent = 'Hôm nay: ' + S.todaySessions + ' phiên tập trung · ' + S.todayMinutes + ' phút tập trung';
    app.className = 'pm2-soft-wrapper pm2-mode-' + S.mode + ' pm2-theme-' + S.theme;
    document.querySelectorAll('.pm2-mode-btn').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-mode') === S.mode);
      var mm = b.getAttribute('data-mode');
      var label = mm === 'short' ? 'Nghỉ ngắn (' + S.shortMin + ' phút)' : mm === 'long' ? 'Nghỉ dài (' + S.longMin + ' phút)' : mm === 'focus' ? 'Tập trung (' + S.focusMin + ' phút)' : mm === 'deep' ? 'Tập trung sâu (45 phút)' : 'Tập trung dài (60 phút)';
      b.textContent = label;
    });
    document.querySelectorAll('.pm2-theme-btn').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-theme') === S.theme);
    });
    btnStart.hidden = S.running;
    btnStart.textContent = partial ? 'Tiếp tục ▶️' : 'Bắt đầu ▶️';
    btnPause.hidden = !S.running;
    btnSkip.hidden = !S.running;
    document.title = S.running ? '(' + formatMs(rem) + ') ' + MODES[S.mode].name : originalTitle;
  }
  function stopTick() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }
  function tick() {
    S.remainingMs = S.endAt - Date.now();
    if (S.remainingMs <= 0) {
      S.remainingMs = 0;
      finish();
      return;
    }
    render();
  }
  function beep() {
    if (!S.sound) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      [0, 0.25, 0.5].forEach(function(off) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(880, ctx.currentTime + off);
        g.gain.setValueAtTime(0.0001, ctx.currentTime + off);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + off + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + off + 0.2);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + off); o.stop(ctx.currentTime + off + 0.22);
      });
    } catch (e) {}
  }
  function notifyFinish(name) {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('⏰ Hết giờ!', { body: 'Đã xong: ' + name + '.' });
      }
    } catch (e) {}
  }
  function finish() {
    stopTick();
    S.running = false;
    var finishedName = MODES[S.mode].name;
    var wasFocus = MODES[S.mode].focus;
    if (wasFocus) {
      S.focusDone += 1; S.todaySessions += 1; S.todayMinutes += Math.round(durationMs(S.mode) / 60000);
    }
    if (S.auto) S.mode = wasFocus ? nextAfterFocus(S.focusDone, S.every) : 'focus';
    S.remainingMs = durationMs(S.mode);
    noticeEl.hidden = false;
    noticeEl.textContent = '⏰ Hết giờ! Đã xong: ' + finishedName + '.';
    beep();
    notifyFinish(finishedName);
    save();
    render();
  }
  function start() {
    if (S.running) return;
    if (S.remainingMs <= 0) S.remainingMs = durationMs(S.mode);
    S.running = true;
    S.endAt = Date.now() + S.remainingMs;
    noticeEl.hidden = true;
    stopTick();
    timerId = setInterval(tick, 250);
    save();
    render();
  }
  function pause() {
    if (!S.running) return;
    stopTick();
    S.remainingMs = Math.max(0, S.endAt - Date.now());
    S.running = false;
    save();
    render();
  }
  function setMode(mode) {
    if (!MODES[mode]) return;
    stopTick();
    S.running = false;
    S.mode = mode;
    S.remainingMs = durationMs(mode);
    noticeEl.hidden = true;
    save();
    render();
  }
  function skip() {
    stopTick();
    S.running = false;
    if (MODES[S.mode].focus) {
      S.mode = nextAfterFocus(S.focusDone, S.every);
    } else {
      S.mode = 'focus';
    }
    S.remainingMs = durationMs(S.mode);
    noticeEl.hidden = true;
    save();
    render();
  }
  function reset() {
    stopTick();
    S.running = false;
    S.remainingMs = durationMs(S.mode);
    noticeEl.hidden = true;
    save();
    render();
  }
  function syncInputs() {
    inFocus.value = S.focusMin;
    inShort.value = S.shortMin;
    inLong.value = S.longMin;
    inEvery.value = S.every;
    inAuto.checked = S.auto;
    inSound.checked = S.sound;
  }
  function applySetting() {
    S.focusMin = clampNum(inFocus.value, 1, 120, 25);
    S.shortMin = clampNum(inShort.value, 1, 120, 5);
    S.longMin = clampNum(inLong.value, 1, 120, 15);
    S.every = clampNum(inEvery.value, 2, 8, 4);
    S.auto = inAuto.checked;
    S.sound = inSound.checked;
    syncInputs();
    if (!S.running) S.remainingMs = durationMs(S.mode);
    save();
    render();
  }
  document.querySelectorAll('.pm2-mode-btn').forEach(function(b) {
    b.addEventListener('click', function() { setMode(b.getAttribute('data-mode')); });
  });
  document.querySelectorAll('.pm2-theme-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      S.theme = b.getAttribute('data-theme');
      save();
      render();
    });
  });
  btnStart.addEventListener('click', start);
  btnPause.addEventListener('click', pause);
  btnSkip.addEventListener('click', skip);
  btnReset.addEventListener('click', reset);
  [inFocus, inShort, inLong, inEvery].forEach(function(el) {
    el.addEventListener('change', applySetting);
  });
  inAuto.addEventListener('change', applySetting);
  inSound.addEventListener('change', applySetting);
  btnFs.addEventListener('click', function() {
    try {
      if (!document.fullscreenElement) {
        var p = app.requestFullscreen ? app.requestFullscreen() : null;
        if (p && p.catch) p.catch(function() {
          noticeEl.hidden = false;
          noticeEl.textContent = 'Không bật được toàn màn hình trên trình duyệt này.';
        });
      } else {
        document.exitFullscreen();
      }
    } catch (e) {
      noticeEl.hidden = false;
      noticeEl.textContent = 'Không bật được toàn màn hình trên trình duyệt này.';
    }
  });
  if (typeof Notification === 'undefined' || Notification.permission === 'granted') {
    notifyRow.hidden = true;
  } else {
    btnNotify.addEventListener('click', function() {
      try {
        Notification.requestPermission().then(function(p) {
          if (p === 'granted') {
            notifyRow.hidden = true;
            try { new Notification('🔔 Đã bật thông báo', { body: 'Đồng hồ sẽ gọi bạn khi hết giờ.' }); } catch (e) {}
          } else {
            noticeEl.hidden = false;
            noticeEl.textContent = 'Trình duyệt chưa cho phép thông báo — đồng hồ vẫn báo bằng âm thanh và dòng chữ hết giờ.';
          }
        });
      } catch (e) {}
    });
  }
  document.addEventListener('keydown', function(e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.tagName === 'BUTTON')) return;
    if (e.code === 'Space') { e.preventDefault(); if (S.running) pause(); else start(); }
    else if (e.key === 'r' || e.key === 'R') reset();
    else if (e.key === 's' || e.key === 'S') { if (S.running) skip(); }
  });
  load();
  syncInputs();
  if (S.running) {
    stopTick();
    timerId = setInterval(tick, 250);
  }
  render();
  window.pm2Test = {
    getState: function() { return JSON.parse(JSON.stringify(S)); },
    finishNow: finish,
    skipNow: skip,
    setRemaining: function(ms) { S.remainingMs = ms; render(); }
  };
});
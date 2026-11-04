document.addEventListener('DOMContentLoaded', function() {
    var $ = function(id) { return document.getElementById(id); };
    var notifyBox = $('tm2-notify'), notifyBtn = $('tm2-notify-btn');
    var tabCd = $('tm2-tab-countdown'), tabSw = $('tm2-tab-stopwatch');
    var setup = $('tm2-setup'), inpH = $('tm2-h'), inpM = $('tm2-m'), inpS = $('tm2-s');
    var summary = $('tm2-summary'), displayBox = $('tm2-display'), statusEl = $('tm2-status');
    var endEl = $('tm2-end'), timeEl = $('tm2-time'), csEl = $('tm2-cs');
    var progressFill = $('tm2-progress-fill'), progressBar = $('tm2-progress');
    var errorEl = $('tm2-error');
    var btnStart = $('tm2-start'), btnPause = $('tm2-pause'), btnLap = $('tm2-lap');
    var btnPlus = $('tm2-plus'), btnReset = $('tm2-reset');
    var lapCard = $('tm2-lap-card'), lapList = $('tm2-lap-list'), copyLapsBtn = $('tm2-copy-laps'), copyMsg = $('tm2-copy-msg');
    var baseTitle = document.title;

    var mode = 'countdown';
    var running = false;
    var tickId = null;
    var cdTotalMs = 300000, cdRemainingMs = null, cdEndAt = 0, cdFinished = false;
    var swBaseMs = 0, swStartAt = 0;
    var laps = [];

    function pad(n) { return String(n).padStart(2, '0'); }
    function fmtHMS(ms, ceilSec) {
        var totalSec = ceilSec ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
        if (totalSec < 0) totalSec = 0;
        return pad(Math.floor(totalSec / 3600)) + ':' + pad(Math.floor((totalSec % 3600) / 60)) + ':' + pad(totalSec % 60);
    }
    function fmtFull(ms) {
        return fmtHMS(ms, false) + '.' + pad(Math.floor((ms % 1000) / 10));
    }
    function fmtClock(ms) {
        var d = new Date(ms);
        return pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    function clampVal(v, max) {
        var n = parseInt(v, 10);
        if (isNaN(n)) n = 0;
        if (n < 0) n = 0;
        if (n > max) n = max;
        return n;
    }
    function readInputsMs() {
        return (clampVal(inpH.value, 99) * 3600 + clampVal(inpM.value, 59) * 60 + clampVal(inpS.value, 59)) * 1000;
    }
    function describeMs(ms) {
        var s = Math.round(ms / 1000);
        if (s < 60) return s + ' giây';
        if (s < 3600) return (Math.floor(s / 60)) + ' phút' + (s % 60 ? ' ' + (s % 60) + ' giây' : '');
        return Math.floor(s / 3600) + ' giờ ' + Math.floor((s % 3600) / 60) + ' phút';
    }
    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.hidden = false;
    }
    function clearError() { errorEl.hidden = true; errorEl.textContent = ''; }
    function setTitle(text) { document.title = text ? text + ' | Đồng hồ bấm giờ' : baseTitle; }

    function renderCountdown() {
        var remaining = running ? Math.max(0, cdEndAt - Date.now()) : (cdRemainingMs === null ? cdTotalMs : cdRemainingMs);
        timeEl.textContent = fmtHMS(remaining, true);
        var pct = cdTotalMs > 0 ? Math.min(100, Math.max(0, (cdTotalMs - remaining) / cdTotalMs * 100)) : 0;
        progressFill.style.width = pct + '%';
        if (running) setTitle(fmtHMS(remaining, true));
        return remaining;
    }
    function renderStopwatch() {
        var elapsed = running ? Date.now() - swStartAt : swBaseMs;
        timeEl.textContent = fmtHMS(elapsed, false);
        csEl.textContent = '.' + pad(Math.floor((elapsed % 1000) / 10));
        if (running) setTitle(fmtHMS(elapsed, false));
        return elapsed;
    }
    function render() { if (mode === 'countdown') renderCountdown(); else renderStopwatch(); }
    function stopTick() { if (tickId !== null) { clearInterval(tickId); tickId = null; } }
    function startTick() { stopTick(); tickId = setInterval(render, 50); }

    function refreshButtons() {
        btnStart.hidden = running;
        btnPause.hidden = !running;
        btnLap.hidden = !(mode === 'stopwatch' && running);
        btnPlus.hidden = !(mode === 'countdown' && (running || (cdRemainingMs !== null && !cdFinished)));
        if (mode === 'countdown') { setup.hidden = running || (cdRemainingMs !== null && !cdFinished); }
    }
    function setStatus(text) { statusEl.textContent = text; }

    function resetTimer() {
        stopTick();
        running = false;
        displayBox.classList.remove('tm2-ended');
        setTitle('');
        if (mode === 'countdown') {
            cdRemainingMs = null; cdFinished = false; cdTotalMs = readInputsMs();
            setup.hidden = false; endEl.hidden = true; progressFill.style.width = '0%';
            timeEl.textContent = fmtHMS(cdTotalMs, true);
        } else {
            swBaseMs = 0; laps = [];
            lapList.innerHTML = ''; lapCard.hidden = true; copyMsg.hidden = true;
            timeEl.textContent = '00:00:00'; csEl.textContent = '.00';
        }
        clearError(); setStatus('Sẵn sàng'); refreshButtons();
    }

    function beep() {
        try {
            var Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            var ctx = new Ctx();
            [0, 0.3, 0.6].forEach(function(off) {
                var osc = ctx.createOscillator(), gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.frequency.value = 880; gain.gain.value = 0.15;
                var t = ctx.currentTime + off;
                osc.start(t); gain.gain.setValueAtTime(0.15, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22); osc.stop(t + 0.25);
            });
        } catch (e) { /* audio unavailable */ }
    }
    function finishCountdown() {
        stopTick(); running = false; cdRemainingMs = 0; cdFinished = true;
        timeEl.textContent = '00:00:00'; progressFill.style.width = '100%';
        displayBox.classList.add('tm2-ended'); setStatus('Hết giờ');
        endEl.hidden = true; setTitle('Hết giờ!');
        beep();
        try {
            if (window.Notification && Notification.permission === 'granted') {
                new Notification('Hết giờ rồi!', { body: 'Thời gian đếm ngược của bạn đã kết thúc.' });
            }
        } catch (e) { /* notification unavailable */ }
        refreshButtons();
    }

    function tickCountdown() {
        var remaining = renderCountdown();
        if (remaining <= 0) finishCountdown();
    }
    function startTimer() {
        if (running) return;
        clearError();
        if (mode === 'countdown') {
            if (cdFinished || cdRemainingMs === null) {
                cdTotalMs = readInputsMs();
                if (cdTotalMs <= 0) { showError('Nhập tổng thời lượng lớn hơn 0 rồi bấm Bắt đầu.'); return; }
                cdRemainingMs = cdTotalMs; cdFinished = false;
            }
            cdEndAt = Date.now() + cdRemainingMs;
            displayBox.classList.remove('tm2-ended');
            endEl.textContent = 'Kết thúc lúc ' + fmtClock(cdEndAt); endEl.hidden = false;
            running = true; setStatus('Đang chạy'); refreshButtons(); renderCountdown();
            stopTick(); tickId = setInterval(tickCountdown, 100);
        } else {
            swStartAt = Date.now() - swBaseMs;
            running = true; setStatus('Đang chạy'); refreshButtons(); renderStopwatch();
            startTick();
        }
    }
    function pauseTimer() {
        if (!running) return;
        stopTick(); running = false;
        if (mode === 'countdown') cdRemainingMs = Math.max(0, cdEndAt - Date.now());
        else swBaseMs = Date.now() - swStartAt;
        setTitle(''); setStatus('Tạm dừng'); refreshButtons(); render();
    }
    function switchMode(next) {
        if (next === mode) return;
        if (running) { showError('Đang chạy — tạm dừng hoặc đặt lại trước khi đổi chế độ.'); return; }
        mode = next;
        tabCd.classList.toggle('tm2-tab-active', mode === 'countdown');
        tabSw.classList.toggle('tm2-tab-active', mode === 'stopwatch');
        resetTimer();
        if (mode === 'countdown') {
            setup.hidden = false; csEl.hidden = true; progressBar.hidden = false; lapCard.hidden = true;
        } else {
            setup.hidden = true; csEl.hidden = false; progressBar.hidden = true;
        }
    }
    function renderLaps() {
        lapList.innerHTML = '';
        var splits = laps.map(function(l) { return l.split; });
        var fastest = splits.length > 1 ? Math.min.apply(null, splits) : -1;
        var slowest = splits.length > 1 ? Math.max.apply(null, splits) : -1;
        laps.slice().reverse().forEach(function(l) {
            var li = document.createElement('li');
            if (l.split === fastest) li.className = 'tm2-fastest';
            if (l.split === slowest) li.className = 'tm2-slowest';
            var a = document.createElement('span'); a.textContent = 'Vòng ' + l.n;
            var b = document.createElement('span'); b.textContent = fmtFull(l.split);
            var c = document.createElement('span'); c.textContent = fmtFull(l.total);
            li.appendChild(a); li.appendChild(b); li.appendChild(c);
            lapList.appendChild(li);
        });
    }
    function recordLap() {
        if (mode !== 'stopwatch' || !running) return;
        var elapsed = Date.now() - swStartAt;
        var prev = laps.length ? laps[laps.length - 1].total : 0;
        laps.push({ n: laps.length + 1, split: elapsed - prev, total: elapsed });
        lapCard.hidden = false; renderLaps();
    }

    if (window.Notification && Notification.permission === 'default') notifyBox.hidden = false;
    notifyBtn.addEventListener('click', function() {
        try {
            Notification.requestPermission().then(function(p) {
                if (p === 'granted') {
                    notifyBox.hidden = true;
                    new Notification('Thành công!', { body: 'Bạn sẽ nhận được thông báo khi hết giờ.' });
                } else { notifyBox.hidden = true; }
            });
        } catch (e) { notifyBox.hidden = true; }
    });

    tabCd.addEventListener('click', function() { switchMode('countdown'); });
    tabSw.addEventListener('click', function() { switchMode('stopwatch'); });

    document.querySelectorAll('[data-tm2-preset]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (running) { showError('Đang chạy — tạm dừng hoặc đặt lại trước khi đổi thời lượng.'); return; }
            var total = parseInt(btn.getAttribute('data-tm2-preset'), 10);
            resetTimer();
            inpH.value = Math.floor(total / 3600);
            inpM.value = Math.floor((total % 3600) / 60);
            inpS.value = total % 60;
            syncInputs();
        });
    });

    function syncInputs() {
        inpH.value = clampVal(inpH.value, 99);
        inpM.value = clampVal(inpM.value, 59);
        inpS.value = clampVal(inpS.value, 59);
        var total = readInputsMs();
        summary.textContent = 'Tổng thời lượng: ' + describeMs(total);
        if (mode === 'countdown' && !running && cdRemainingMs === null) {
            cdTotalMs = total; timeEl.textContent = fmtHMS(total, true);
        }
    }
    [inpH, inpM, inpS].forEach(function(inp) {
        inp.addEventListener('change', syncInputs);
        inp.addEventListener('input', function() {
            if (mode === 'countdown' && !running && cdRemainingMs === null) {
                summary.textContent = 'Tổng thời lượng: ' + describeMs(readInputsMs());
            }
        });
    });

    btnStart.addEventListener('click', startTimer);
    btnPause.addEventListener('click', pauseTimer);
    btnReset.addEventListener('click', resetTimer);
    btnLap.addEventListener('click', recordLap);
    btnPlus.addEventListener('click', function() {
        if (mode !== 'countdown' || cdFinished) return;
        if (running) cdEndAt += 60000; else if (cdRemainingMs !== null) cdRemainingMs += 60000;
        cdTotalMs += 60000;
        if (running) endEl.textContent = 'Kết thúc lúc ' + fmtClock(cdEndAt);
        else if (cdRemainingMs !== null) endEl.textContent = 'Kết thúc lúc ' + fmtClock(Date.now() + cdRemainingMs);
        renderCountdown();
    });
    copyLapsBtn.addEventListener('click', function() {
        var lines = laps.map(function(l) { return 'Vòng ' + l.n + ': khoảng ' + fmtFull(l.split) + ', tổng ' + fmtFull(l.total); });
        var text = lines.join('\n');
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
        } catch (e) { /* clipboard unavailable */ }
        copyMsg.hidden = false;
    });
    document.addEventListener('keydown', function(e) {
        var t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON')) return;
        if (e.code === 'Space') { e.preventDefault(); if (running) pauseTimer(); else startTimer(); }
        else if (e.code === 'KeyL') recordLap();
        else if (e.code === 'KeyR') resetTimer();
    });

    syncInputs();
    window.tm2Test = { fmtHMS: fmtHMS, fmtFull: fmtFull, clampVal: clampVal, readInputsMs: readInputsMs, describeMs: describeMs };
});

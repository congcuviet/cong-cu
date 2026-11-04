function al2ParseTime(str) {
    if (!str) return null;
    var parts = String(str).split(':');
    if (parts.length < 2) return null;
    var h = parseInt(parts[0], 10), m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
    return { h: h, m: m };
}
function al2Pad(n) { return String(n).padStart(2, '0'); }
function al2NextOccurrence(timeStr, repeat, now) {
    var t = al2ParseTime(timeStr);
    if (!t) return null;
    var cand = new Date(now.getFullYear(), now.getMonth(), now.getDate(), t.h, t.m, 0, 0);
    if (repeat === 'weekdays') {
        while (cand <= now || cand.getDay() === 0 || cand.getDay() === 6) cand.setDate(cand.getDate() + 1);
    } else {
        if (cand <= now) cand.setDate(cand.getDate() + 1);
    }
    return cand;
}
function al2CountdownText(nextTs, now) {
    var mins = Math.floor((nextTs - now.getTime()) / 60000);
    if (mins < 1) return 'dưới 1 phút';
    if (mins < 60) return mins + ' phút';
    var h = Math.floor(mins / 60), m = mins % 60;
    return h + ' giờ' + (m ? ' ' + m + ' phút' : '');
}
function al2RepeatLabel(repeat) {
    if (repeat === 'daily') return 'Hằng ngày';
    if (repeat === 'weekdays') return 'Ngày làm việc (T2–T6)';
    return 'Một lần';
}
function al2SoundLabel(value) {
    var map = {
        'builtin': 'Tiếng bíp tích hợp',
        'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg': 'Chuông reo cơ bản',
        'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg': 'Chuông điện tử',
        'https://actions.google.com/sounds/v1/alarms/phone_ringing.ogg': 'Tiếng điện thoại reo',
        'https://actions.google.com/sounds/v1/emergency/ambulance_siren.ogg': 'Còi cứu thương (Rất to)'
    };
    return map[value] || 'Chuông đã chọn';
}

document.addEventListener('DOMContentLoaded', function() {
    var clockEl = document.getElementById('al2-clock');
    var dateEl = document.getElementById('al2-date');
    var nextEl = document.getElementById('al2-next');
    var timeInput = document.getElementById('al2-time');
    var labelInput = document.getElementById('al2-label');
    var soundSelect = document.getElementById('al2-sound');
    var addBtn = document.getElementById('al2-add');
    var previewBtn = document.getElementById('al2-preview');
    var errorEl = document.getElementById('al2-error');
    var audioNoteEl = document.getElementById('al2-audio-note');
    var listEl = document.getElementById('al2-list');
    var emptyEl = document.getElementById('al2-empty');
    var ringingEl = document.getElementById('al2-ringing');
    var ringTimeEl = document.getElementById('al2-ring-time');
    var ringLabelEl = document.getElementById('al2-ring-label');
    var stopBtn = document.getElementById('al2-stop');
    var snoozeBtn = document.getElementById('al2-snooze');
    var notifyRow = document.getElementById('al2-notify');
    var notifyBtn = document.getElementById('al2-notify-btn');
    var wrapper = document.getElementById('al2-wrapper');
    var segBtns = document.querySelectorAll('[data-al2-repeat]');

    var alarms = [];
    var selectedRepeat = 'once';
    var ringingAlarm = null;
    var audioEl = null, beepTimer = null, previewTimer = null, audioCtx = null;
    var wakeLock = null, wakeLockListenerAdded = false;
    var idCounter = 1;

    function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
    function hideError() { errorEl.hidden = true; }
    function showAudioNote(msg) { audioNoteEl.textContent = msg; audioNoteEl.hidden = false; }

    function save() {
        try {
            var data = alarms.map(function(a) {
                return { id: a.id, time: a.time, label: a.label, sound: a.sound, repeat: a.repeat, enabled: a.enabled };
            });
            localStorage.setItem('al2-alarms-v1', JSON.stringify(data));
        } catch (e) { /* storage unavailable: alarms still work for this session */ }
    }
    function load() {
        try {
            var raw = localStorage.getItem('al2-alarms-v1');
            if (!raw) return;
            var data = JSON.parse(raw);
            if (!Array.isArray(data)) return;
            data.forEach(function(d) {
                if (!al2ParseTime(d.time)) return;
                alarms.push({ id: d.id || ('al2-' + (idCounter++)), time: d.time, label: d.label || '', sound: d.sound || 'builtin', repeat: d.repeat || 'once', enabled: !!d.enabled, nextTs: null, snoozed: false });
            });
            alarms.forEach(function(a) { if (a.enabled) a.nextTs = al2NextOccurrence(a.time, a.repeat, new Date()).getTime(); });
        } catch (e) { alarms = []; }
    }

    function stopAudio() {
        if (previewTimer) { clearTimeout(previewTimer); previewTimer = null; }
        if (beepTimer) { clearInterval(beepTimer); beepTimer = null; }
        if (audioEl) { try { audioEl.pause(); } catch (e) {} audioEl = null; }
    }
    function startBeep() {
        try {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            if (!audioCtx) audioCtx = new AC();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            var beepOnce = function() {
                try {
                    var osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
                    osc.type = 'square'; osc.frequency.value = 880;
                    gain.gain.value = 0.12;
                    osc.connect(gain); gain.connect(audioCtx.destination);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.4);
                } catch (e) {}
            };
            beepOnce();
            beepTimer = setInterval(beepOnce, 800);
        } catch (e) {}
    }
    function playSound(value) {
        stopAudio();
        if (value === 'builtin') { startBeep(); return; }
        try {
            if (typeof Audio === 'undefined') { startBeep(); return; }
            audioEl = new Audio(value);
            audioEl.loop = true;
            audioEl.onerror = function() { startBeep(); showAudioNote('Không tải được file chuông đã chọn, đang dùng tiếng bíp tích hợp.'); };
            var p = audioEl.play();
            if (p && p.catch) p.catch(function() { startBeep(); showAudioNote('Trình duyệt chặn phát file chuông, đang dùng tiếng bíp tích hợp.'); });
        } catch (e) { startBeep(); }
    }

    function anyEnabled() { return alarms.some(function(a) { return a.enabled; }); }
    function syncWakeLock() {
        try {
            if (!('wakeLock' in navigator)) return;
            if (!wakeLockListenerAdded) {
                wakeLockListenerAdded = true;
                document.addEventListener('visibilitychange', function() {
                    if (document.visibilityState === 'visible' && (anyEnabled() || ringingAlarm)) requestWakeLock();
                });
            }
            if (anyEnabled() || ringingAlarm) requestWakeLock();
            else if (wakeLock) { var w = wakeLock; wakeLock = null; w.release().catch(function() {}); }
        } catch (e) {}
    }
    function requestWakeLock() {
        try {
            if (!('wakeLock' in navigator) || wakeLock) return;
            navigator.wakeLock.request('screen').then(function(w) { wakeLock = w; }).catch(function() {});
        } catch (e) {}
    }
    function notifyRinging(alarm) {
        try {
            if ('Notification' in window && Notification.permission === 'granted') {
                var n = new Notification('⏰ ĐÃ ĐẾN GIỜ BÁO THỨC!', { body: (alarm.label ? alarm.label + ' — ' : '') + 'Báo thức lúc ' + alarm.time + '. Nhấn vào đây để quay lại trang và tắt chuông.', requireInteraction: true });
                n.onclick = function() { window.focus(); n.close(); };
            }
        } catch (e) {}
    }

    function render() {
        listEl.innerHTML = '';
        emptyEl.hidden = alarms.length > 0;
        alarms.slice().sort(function(a, b) { return a.time.localeCompare(b.time); }).forEach(function(alarm) {
            var li = document.createElement('li');
            li.className = 'al2-item' + (alarm.enabled ? '' : ' al2-item-off');
            var timeSpan = document.createElement('span');
            timeSpan.className = 'al2-item-time'; timeSpan.textContent = alarm.time;
            var main = document.createElement('div'); main.className = 'al2-item-main';
            var lab = document.createElement('div'); lab.className = 'al2-item-label'; lab.textContent = alarm.label || 'Báo thức';
            var sub = document.createElement('div'); sub.className = 'al2-item-sub';
            var nextText = 'Đang tắt';
            if (alarm.enabled && alarm.nextTs) nextText = alarm.snoozed ? ('Báo lại lúc ' + al2Pad(new Date(alarm.nextTs).getHours()) + ':' + al2Pad(new Date(alarm.nextTs).getMinutes())) : ('Lần tới ' + al2Pad(new Date(alarm.nextTs).getHours()) + ':' + al2Pad(new Date(alarm.nextTs).getMinutes()));
            sub.textContent = al2RepeatLabel(alarm.repeat) + ' · ' + al2SoundLabel(alarm.sound) + ' · ' + nextText;
            main.appendChild(lab); main.appendChild(sub);
            var toggle = document.createElement('button');
            toggle.type = 'button'; toggle.className = 'al2-item-toggle'; toggle.textContent = alarm.enabled ? 'Tắt' : 'Bật';
            toggle.addEventListener('click', function() {
                if (ringingAlarm === alarm) { stopAudio(); ringingEl.hidden = true; wrapper.classList.remove('al2-ringing-state'); ringingAlarm = null; }
                alarm.enabled = !alarm.enabled;
                alarm.snoozed = false;
                alarm.nextTs = alarm.enabled ? al2NextOccurrence(alarm.time, alarm.repeat, new Date()).getTime() : null;
                save(); render(); syncWakeLock(); updateNext();
            });
            var del = document.createElement('button');
            del.type = 'button'; del.className = 'al2-item-del'; del.textContent = '✕'; del.setAttribute('aria-label', 'Xóa báo thức ' + alarm.time);
            del.addEventListener('click', function() {
                if (ringingAlarm === alarm) { stopAudio(); ringingEl.hidden = true; wrapper.classList.remove('al2-ringing-state'); ringingAlarm = null; }
                alarms = alarms.filter(function(a) { return a !== alarm; });
                save(); render(); syncWakeLock(); updateNext();
            });
            li.appendChild(timeSpan); li.appendChild(main); li.appendChild(toggle); li.appendChild(del);
            listEl.appendChild(li);
        });
    }
    function updateNext() {
        var upcoming = alarms.filter(function(a) { return a.enabled && a.nextTs; }).sort(function(a, b) { return a.nextTs - b.nextTs; })[0];
        if (!upcoming) { nextEl.hidden = true; return; }
        var d = new Date(upcoming.nextTs);
        nextEl.textContent = 'Báo thức gần nhất: ' + al2Pad(d.getHours()) + ':' + al2Pad(d.getMinutes()) + ' — còn ' + al2CountdownText(upcoming.nextTs, new Date());
        nextEl.hidden = false;
    }
    function ring(alarm) {
        ringingAlarm = alarm;
        ringTimeEl.textContent = alarm.time;
        ringLabelEl.textContent = alarm.label ? alarm.label : '';
        ringLabelEl.hidden = !alarm.label;
        ringingEl.hidden = false;
        wrapper.classList.add('al2-ringing-state');
        playSound(alarm.sound);
        notifyRinging(alarm);
        syncWakeLock();
    }
    function finishRinging(action) {
        if (!ringingAlarm) return;
        var alarm = ringingAlarm;
        stopAudio();
        ringingEl.hidden = true;
        wrapper.classList.remove('al2-ringing-state');
        ringingAlarm = null;
        if (action === 'snooze') {
            alarm.snoozed = true;
            alarm.nextTs = Date.now() + 5 * 60000;
        } else if (alarm.repeat === 'once') {
            alarm.enabled = false; alarm.snoozed = false; alarm.nextTs = null;
        } else {
            alarm.snoozed = false;
            alarm.nextTs = al2NextOccurrence(alarm.time, alarm.repeat, new Date()).getTime();
        }
        save(); render(); syncWakeLock(); updateNext();
    }

    segBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            selectedRepeat = btn.getAttribute('data-al2-repeat');
            segBtns.forEach(function(b) { b.classList.toggle('al2-seg-active', b === btn); });
        });
    });
    addBtn.addEventListener('click', function() {
        hideError();
        var t = timeInput.value;
        if (!al2ParseTime(t)) { showError('Vui lòng chọn giờ báo thức.'); return; }
        if (alarms.some(function(a) { return a.time === t && a.repeat === selectedRepeat; })) { showError('Đã có báo thức lúc ' + t + ' với lịch ' + al2RepeatLabel(selectedRepeat) + ' rồi.'); return; }
        var alarm = { id: 'al2-' + Date.now() + '-' + (idCounter++), time: t, label: (labelInput.value || '').trim(), sound: soundSelect.value, repeat: selectedRepeat, enabled: true, nextTs: al2NextOccurrence(t, selectedRepeat, new Date()).getTime(), snoozed: false };
        alarms.push(alarm);
        save(); render(); syncWakeLock(); updateNext();
        labelInput.value = '';
    });
    previewBtn.addEventListener('click', function() {
        playSound(soundSelect.value);
        if (previewTimer) clearTimeout(previewTimer);
        previewTimer = setTimeout(function() { stopAudio(); }, 2500);
    });
    stopBtn.addEventListener('click', function() { finishRinging('stop'); });
    snoozeBtn.addEventListener('click', function() { finishRinging('snooze'); });
    if (notifyBtn) {
        try {
            if ('Notification' in window && Notification.permission === 'default') {
                notifyRow.hidden = false;
                notifyBtn.addEventListener('click', function() {
                    Notification.requestPermission().then(function() { notifyRow.hidden = true; }).catch(function() { notifyRow.hidden = true; });
                });
            }
        } catch (e) { notifyRow.hidden = true; }
    }

    function tick() {
        var now = new Date();
        clockEl.textContent = al2Pad(now.getHours()) + ':' + al2Pad(now.getMinutes()) + ':' + al2Pad(now.getSeconds());
        var days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        dateEl.textContent = days[now.getDay()] + ', ' + al2Pad(now.getDate()) + '/' + al2Pad(now.getMonth() + 1) + '/' + now.getFullYear();
        if (!ringingAlarm) {
            for (var i = 0; i < alarms.length; i++) {
                if (alarms[i].enabled && alarms[i].nextTs && now.getTime() >= alarms[i].nextTs) { ring(alarms[i]); break; }
            }
        }
        updateNext();
    }

    load();
    render();
    tick();
    setInterval(tick, 1000);
});

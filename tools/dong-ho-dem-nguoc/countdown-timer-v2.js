document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('cd2-form');
    if (!form) return;
    var labelInput = document.getElementById('cd2-label');
    var hoursInput = document.getElementById('cd2-hours');
    var minutesInput = document.getElementById('cd2-minutes');
    var secondsInput = document.getElementById('cd2-seconds');
    var summaryEl = document.getElementById('cd2-summary');
    var errorEl = document.getElementById('cd2-error');
    var listEl = document.getElementById('cd2-list');
    var emptyEl = document.getElementById('cd2-empty');
    var baseTitle = document.title;
    var timers = [];
    var counter = 0;
    var storageKey = 'cd2-timers-v1';

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function formatHMS(total) {
        var h = Math.floor(total / 3600);
        var m = Math.floor((total % 3600) / 60);
        var s = total % 60;
        return pad(h) + ':' + pad(m) + ':' + pad(s);
    }
    function formatDuration(total) {
        var h = Math.floor(total / 3600);
        var m = Math.floor((total % 3600) / 60);
        var s = total % 60;
        var parts = [];
        if (h > 0) parts.push(h + ' giờ');
        if (m > 0) parts.push(m + ' phút');
        if (s > 0 || parts.length === 0) parts.push(s + ' giây');
        return parts.join(' ');
    }
    function parseField(input, name, min, max) {
        var raw = input.value.trim();
        if (raw === '') return { ok: true, value: 0 };
        var num = Number(raw);
        if (!Number.isInteger(num)) return { ok: false, error: name + ' chỉ nhận số nguyên.' };
        if (num < min || num > max) return { ok: false, error: name + ' phải từ ' + min + ' đến ' + max + '.' };
        return { ok: true, value: num };
    }
    function parseDuration() {
        var h = parseField(hoursInput, 'Giờ', 0, 99);
        if (!h.ok) return h;
        var m = parseField(minutesInput, 'Phút', 0, 59);
        if (!m.ok) return m;
        var s = parseField(secondsInput, 'Giây', 0, 59);
        if (!s.ok) return s;
        var total = h.value * 3600 + m.value * 60 + s.value;
        if (total <= 0) return { ok: false, error: 'Tổng thời lượng phải lớn hơn 0.' };
        return { ok: true, value: total };
    }
    function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
    function hideError() { errorEl.textContent = ''; errorEl.hidden = true; }
    function updateSummary() {
        var parsed = parseDuration();
        summaryEl.textContent = parsed.ok ? 'Tổng thời lượng: ' + formatDuration(parsed.value) : 'Tổng thời lượng: chưa hợp lệ';
    }
    function remainingOf(t) {
        if (t.status === 'running') return Math.max(0, Math.floor((t.endTime - Date.now()) / 1000));
        return t.remaining;
    }
    function save() {
        try {
            var data = timers.filter(function(t) { return t.status !== 'ended'; }).map(function(t) {
                return { id: t.id, label: t.label, total: t.total, status: t.status, endTime: t.endTime, remaining: t.remaining };
            });
            window.localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (e) {}
    }
    function updateEmpty() { emptyEl.hidden = timers.length > 0; }
    function updateTitle() {
        var running = null;
        for (var i = 0; i < timers.length; i++) {
            if (timers[i].status === 'running') { running = timers[i]; break; }
        }
        document.title = running ? formatHMS(remainingOf(running)) + ' • ' + baseTitle : baseTitle;
    }
    function refreshCard(t) {
        var rem = remainingOf(t);
        t.refs.time.textContent = formatHMS(rem);
        t.refs.status.textContent = t.status === 'running' ? 'Đang chạy' : (t.status === 'paused' ? 'Tạm dừng' : 'Hết giờ');
        var pct = t.total > 0 ? Math.min(100, Math.max(0, ((t.total - rem) / t.total) * 100)) : 0;
        t.refs.fill.style.width = pct + '%';
        t.refs.card.classList.toggle('cd2-paused', t.status === 'paused');
        t.refs.card.classList.toggle('cd2-ended', t.status === 'ended');
        t.refs.pauseBtn.textContent = t.status === 'paused' ? 'Tiếp tục' : 'Tạm dừng';
        t.refs.pauseBtn.hidden = t.status === 'ended';
        t.refs.addBtn.hidden = t.status === 'ended';
        t.refs.restartBtn.hidden = t.status !== 'ended';
    }
    function renderTimer(t) {
        var card = document.createElement('div');
        card.className = 'cd2-timer';
        var top = document.createElement('div');
        top.className = 'cd2-timer-top';
        var label = document.createElement('div');
        label.className = 'cd2-timer-label';
        label.textContent = t.label;
        var status = document.createElement('div');
        status.className = 'cd2-timer-status';
        top.appendChild(label);
        top.appendChild(status);
        var time = document.createElement('div');
        time.className = 'cd2-timer-time';
        var bar = document.createElement('div');
        bar.className = 'cd2-progress';
        var fill = document.createElement('div');
        fill.className = 'cd2-progress-fill';
        bar.appendChild(fill);
        var actions = document.createElement('div');
        actions.className = 'cd2-timer-actions';
        var pauseBtn = document.createElement('button');
        pauseBtn.type = 'button';
        pauseBtn.className = 'cd2-btn';
        pauseBtn.textContent = 'Tạm dừng';
        var addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'cd2-btn';
        addBtn.textContent = '+1 phút';
        var restartBtn = document.createElement('button');
        restartBtn.type = 'button';
        restartBtn.className = 'cd2-btn';
        restartBtn.textContent = 'Chạy lại';
        restartBtn.hidden = true;
        var delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'cd2-btn cd2-btn-dark';
        delBtn.textContent = 'Xóa';
        actions.appendChild(pauseBtn);
        actions.appendChild(addBtn);
        actions.appendChild(restartBtn);
        actions.appendChild(delBtn);
        card.appendChild(top);
        card.appendChild(time);
        card.appendChild(bar);
        card.appendChild(actions);
        listEl.prepend(card);
        t.refs = { card: card, time: time, status: status, fill: fill, pauseBtn: pauseBtn, addBtn: addBtn, restartBtn: restartBtn };
        pauseBtn.addEventListener('click', function() {
            if (t.status === 'running') {
                t.remaining = remainingOf(t);
                t.status = 'paused';
                t.endTime = null;
            } else if (t.status === 'paused') {
                t.status = 'running';
                t.endTime = Date.now() + t.remaining * 1000;
            }
            refreshCard(t);
            updateTitle();
            save();
        });
        addBtn.addEventListener('click', function() {
            t.total += 60;
            if (t.status === 'running') t.endTime += 60000;
            else if (t.status === 'paused') t.remaining += 60;
            refreshCard(t);
            updateTitle();
            save();
        });
        restartBtn.addEventListener('click', function() {
            t.status = 'running';
            t.remaining = t.total;
            t.endTime = Date.now() + t.total * 1000;
            refreshCard(t);
            updateTitle();
            save();
        });
        delBtn.addEventListener('click', function() {
            var idx = timers.indexOf(t);
            if (idx >= 0) timers.splice(idx, 1);
            card.remove();
            updateEmpty();
            updateTitle();
            save();
        });
        refreshCard(t);
    }
    function addTimer(label, total) {
        counter += 1;
        var t = { id: counter, label: label ? label : 'Đồng hồ #' + counter, total: total, status: 'running', endTime: Date.now() + total * 1000, remaining: total };
        timers.unshift(t);
        renderTimer(t);
        updateEmpty();
        updateTitle();
        save();
    }
    function finishTimer(t) {
        t.status = 'ended';
        t.remaining = 0;
        t.endTime = null;
        refreshCard(t);
        updateTitle();
        save();
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try { new Notification('⏰ Đã hết giờ!', { body: 'Đồng hồ "' + t.label + '" đã hết thời gian đếm ngược.' }); } catch (e) {}
        }
        try {
            var Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx) {
                var ctx = new Ctx();
                [0, 0.5, 1].forEach(function(off) {
                    var osc = ctx.createOscillator();
                    var gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(800, ctx.currentTime + off);
                    gain.gain.setValueAtTime(0.0001, ctx.currentTime + off);
                    gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + off + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + off + 0.4);
                    osc.start(ctx.currentTime + off);
                    osc.stop(ctx.currentTime + off + 0.45);
                });
            }
        } catch (e) {}
    }
    function tick() {
        for (var i = 0; i < timers.length; i++) {
            var t = timers[i];
            if (t.status === 'running') {
                if (remainingOf(t) <= 0) finishTimer(t);
                else refreshCard(t);
            }
        }
        updateTitle();
    }
    function restore() {
        try {
            var raw = window.localStorage.getItem(storageKey);
            if (!raw) return;
            var arr = JSON.parse(raw);
            if (!Array.isArray(arr)) return;
            arr.forEach(function(s) {
                if (!s || typeof s.total !== 'number' || s.total <= 0) return;
                if (typeof s.id === 'number' && s.id > counter) counter = s.id;
                var t = { id: (typeof s.id === 'number' ? s.id : ++counter), label: s.label || ('Đồng hồ #' + counter), total: s.total, status: 'paused', remaining: 0, endTime: null };
                if (s.status === 'running' && typeof s.endTime === 'number') {
                    var rem = Math.max(0, Math.floor((s.endTime - Date.now()) / 1000));
                    if (rem > 0) {
                        t.status = 'running';
                        t.endTime = Date.now() + rem * 1000;
                        t.remaining = rem;
                    } else {
                        t.status = 'ended';
                        t.remaining = 0;
                    }
                } else if (s.status === 'paused' && typeof s.remaining === 'number') {
                    t.remaining = Math.min(Math.max(0, s.remaining), s.total);
                } else {
                    return;
                }
                timers.push(t);
                renderTimer(t);
            });
            updateEmpty();
        } catch (e) {}
    }
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            try { Notification.requestPermission(); } catch (err) {}
        }
        var parsed = parseDuration();
        if (!parsed.ok) {
            showError(parsed.error);
            return;
        }
        hideError();
        addTimer(labelInput.value.trim(), parsed.value);
    });
    var chips = form.querySelectorAll('[data-cd2-preset]');
    chips.forEach(function(chip) {
        chip.addEventListener('click', function() {
            var total = parseInt(chip.getAttribute('data-cd2-preset'), 10);
            hoursInput.value = Math.floor(total / 3600);
            minutesInput.value = Math.floor((total % 3600) / 60);
            secondsInput.value = total % 60;
            updateSummary();
        });
    });
    [hoursInput, minutesInput, secondsInput].forEach(function(input) {
        input.addEventListener('input', updateSummary);
        input.addEventListener('change', updateSummary);
    });
    restore();
    updateSummary();
    setInterval(tick, 500);
    tick();
});
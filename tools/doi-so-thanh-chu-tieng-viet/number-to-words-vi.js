document.addEventListener('DOMContentLoaded', function () {

    /* ===== PURE LOGIC START ===== */
    var NWV_DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    var NWV_UNITS = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ', 'tỷ tỷ', 'nghìn tỷ tỷ', 'triệu tỷ tỷ'];
    function nwvReadGroup(h, t, o, leading, leWord) {
        var parts = [];
        if (h > 0) parts.push(NWV_DIGITS[h] + ' trăm');
        else if (!leading) parts.push('không trăm');
        if (t === 0) {
            if (o > 0 && (h > 0 || !leading)) parts.push(leWord);
        } else if (t === 1) {
            parts.push('mười');
        } else {
            parts.push(NWV_DIGITS[t] + ' mươi');
        }
        if (o > 0) {
            if (t >= 2 && o === 1) parts.push('mốt');
            else if (t >= 2 && o === 4) parts.push('tư');
            else if (t >= 1 && o === 5) parts.push('lăm');
            else parts.push(NWV_DIGITS[o]);
        }
        return parts.join(' ');
    }
    function nwvToWords(digits, leWord) {
        // digits: string of 0-9 only, no sign
        var s = String(digits).replace(/^0+/, '');
        if (s === '') return 'không';
        while (s.length % 3 !== 0) s = '0' + s;
        var groups = [];
        for (var i = 0; i < s.length; i += 3) groups.push(s.substr(i, 3));
        var n = groups.length;
        var parts = [];
        for (var g = 0; g < n; g++) {
            var grp = groups[g];
            var val = parseInt(grp, 10);
            if (val === 0) continue;
            var unitIdx = n - 1 - g;
            var words = nwvReadGroup(parseInt(grp[0], 10), parseInt(grp[1], 10), parseInt(grp[2], 10), g === 0, leWord);
            parts.push(words + (NWV_UNITS[unitIdx] ? ' ' + NWV_UNITS[unitIdx] : ''));
        }
        return parts.join(' ');
    }
    /* ===== PURE LOGIC END ===== */

    function $(id) { return document.getElementById(id); }
    function fmtNum(digits) {
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function render() {
        var raw = $('nwv-inp-number').value || '';
        var digits = raw.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
        var overLimit = digits.length > 27;
        if (overLimit) digits = digits.slice(0, 27);
        $('nwv-parsed').textContent = digits ? fmtNum(digits) : '—';

        var leWord = $('nwv-sel-le').value === 'linh' ? 'linh' : 'lẻ';
        var text = digits ? nwvToWords(digits, leWord) : '';
        if (text) {
            if ($('nwv-sel-unit').value === 'dong') text += ' đồng';
            if ($('nwv-chk-chan').checked && $('nwv-sel-unit').value === 'dong') text += ' chẵn';
            var mode = $('nwv-sel-case').value;
            if (mode === 'sentence') text = text.charAt(0).toUpperCase() + text.slice(1);
            else if (mode === 'upper') text = text.toUpperCase();
        }
        $('nwv-out-text').textContent = text || 'Chữ sẽ hiện ở đây ngay khi bạn nhập số…';
        var meta = '';
        if (digits) {
            meta = 'Số gồm ' + digits.length + ' chữ số · đoạn chữ dài ' + text.length + ' ký tự';
            if (overLimit) meta += ' · ⚠️ Công cụ hỗ trợ tối đa 27 chữ số, phần vượt đã được cắt';
        }
        $('nwv-out-meta').textContent = meta;
        return text;
    }

    $('nwv-inp-number').addEventListener('input', function () {
        var el = this;
        var wasAtEnd = el.selectionStart === el.value.length;
        var digits = el.value.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
        var formatted = digits ? fmtNum(digits) : '';
        if (el.value !== formatted) {
            el.value = formatted;
            if (wasAtEnd) { try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} }
        }
        render();
    });
    ['nwv-sel-unit', 'nwv-sel-le', 'nwv-sel-case', 'nwv-chk-chan'].forEach(function (id) {
        $(id).addEventListener('change', render);
    });
    document.querySelectorAll('.nwv-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
            $('nwv-inp-number').value = fmtNum(chip.getAttribute('data-val'));
            render();
            $('nwv-inp-number').focus();
        });
    });

    $('nwv-btn-copy').addEventListener('click', function () {
        var btn = this;
        var text = render();
        if (!text) return;
        function done() { btn.textContent = '✅ Đã sao chép!'; setTimeout(function () { btn.textContent = '📋 Sao chép chữ'; }, 2000); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, done);
        } else {
            var ta = document.createElement('textarea');
            ta.value = text; document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(ta); done();
        }
    });

    $('nwv-btn-speak').addEventListener('click', function () {
        var text = render();
        if (!text || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            var u = new SpeechSynthesisUtterance(text);
            u.lang = 'vi-VN';
            u.rate = 0.92;
            var voices = window.speechSynthesis.getVoices();
            for (var i = 0; i < voices.length; i++) {
                if (voices[i].lang && voices[i].lang.toLowerCase().indexOf('vi') === 0) { u.voice = voices[i]; break; }
            }
            window.speechSynthesis.speak(u);
        } catch (e) {}
    });

    render();
});

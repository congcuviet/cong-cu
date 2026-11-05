document.addEventListener('DOMContentLoaded', function() {
    // PURE LOGIC START
    var HE2_EIGHT = ['&', '<', '>', '"', "'", '/', '`', '='];
    var HE2_FIVE = ['&', '<', '>', '"', "'"];
    var HE2_MAPS = {
        named: { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;' },
        decimal: { '&': '&#38;', '<': '&#60;', '>': '&#62;', '"': '&#34;', "'": '&#39;', '/': '&#47;', '`': '&#96;', '=': '&#61;' },
        hex: { '&': '&#x26;', '<': '&#x3C;', '>': '&#x3E;', '"': '&#x22;', "'": '&#x27;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;' }
    };
    var HE2_REF_RE = /&(?:#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]+);/g;

    function he2Escape(str, style, scope) {
        var map = HE2_MAPS[style] || HE2_MAPS.named;
        var base = scope === 'five' ? HE2_FIVE : HE2_EIGHT;
        var out = '';
        var changed = 0;
        for (var ch of String(str)) {
            if (base.indexOf(ch) !== -1) {
                out += map[ch];
                changed++;
            } else if (scope === 'nonascii' && ch.codePointAt(0) > 127) {
                var cp = ch.codePointAt(0);
                out += style === 'hex' ? '&#x' + cp.toString(16).toUpperCase() + ';' : '&#' + cp + ';';
                changed++;
            } else {
                out += ch;
            }
        }
        return { text: out, changed: changed };
    }

    function he2FindRefs(str) {
        return String(str).match(HE2_REF_RE) || [];
    }

    function he2InvalidNumericRefs(str) {
        var bad = [];
        var re = /&#(x[0-9a-fA-F]+|\d+);/g;
        var m;
        while ((m = re.exec(String(str))) !== null) {
            var cp = m[1].charAt(0) === 'x' ? parseInt(m[1].slice(1), 16) : parseInt(m[1], 10);
            if (isNaN(cp) || cp > 0x10FFFF || (cp >= 0xD800 && cp <= 0xDFFF)) bad.push(m[0]);
        }
        return bad;
    }

    function he2DecodedCount(inputRefs, outputRefs) {
        var rest = outputRefs.slice();
        var n = 0;
        for (var i = 0; i < inputRefs.length; i++) {
            var j = rest.indexOf(inputRefs[i]);
            if (j === -1) n++;
            else rest.splice(j, 1);
        }
        return n;
    }
    // PURE LOGIC END

    function he2Unescape(str) {
        var txt = document.createElement('textarea');
        txt.innerHTML = str;
        return txt.value;
    }

    var btnEncode = document.getElementById('he2-mode-encode');
    var btnDecode = document.getElementById('he2-mode-decode');
    var optsBox = document.getElementById('he2-opts');
    var selStyle = document.getElementById('he2-style');
    var selScope = document.getElementById('he2-scope');
    var cardInput = document.getElementById('he2-card-input');
    var inputText = document.getElementById('he2-input-text');
    var outputText = document.getElementById('he2-output-text');
    var badge = document.getElementById('he2-status-badge');
    var statsEl = document.getElementById('he2-stats');
    var warnEl = document.getElementById('he2-warn');
    var hintEl = document.getElementById('he2-input-hint');
    var btnClear = document.getElementById('he2-btn-clear');
    var btnSwap = document.getElementById('he2-btn-swap');
    var btnCopy = document.getElementById('he2-btn-copy');
    var btnDownload = document.getElementById('he2-btn-download');
    var btnLayer = document.getElementById('he2-btn-layer');
    var toastEl = document.getElementById('he2-toast');

    var mode = 'encode';
    var toastTimer = null;
    var clearArmed = false;
    var clearTimer = null;

    function he2Fmt(n) { return n.toLocaleString('vi-VN'); }

    function he2ShowToast(msg, isError) {
        toastEl.textContent = msg;
        toastEl.classList.toggle('he2-toast-error', !!isError);
        toastEl.hidden = false;
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function() { toastEl.hidden = true; }, 2500);
    }

    function he2SetMode(m) {
        mode = m;
        var enc = m === 'encode';
        btnEncode.classList.toggle('he2-active', enc);
        btnEncode.setAttribute('aria-pressed', enc ? 'true' : 'false');
        btnDecode.classList.toggle('he2-active', !enc);
        btnDecode.setAttribute('aria-pressed', !enc ? 'true' : 'false');
        cardInput.classList.toggle('he2-mode-decode', !enc);
        optsBox.hidden = !enc;
        hintEl.textContent = enc ? 'Nhập nội dung nguyên bản để mã hóa, hoặc chuỗi đã mã hóa để giải mã.' : 'Nhập chuỗi đã mã hóa (ví dụ: &lt;script&gt;...) để đọc lại nội dung gốc.';
        inputText.placeholder = enc ? 'Nhập mã HTML nguyên bản (Ví dụ: <script>)...' : 'Nhập chuỗi đã bị mã hóa (Ví dụ: &lt;script&gt;)...';
        he2Process();
    }

    function he2Process() {
        var text = inputText.value;
        btnLayer.hidden = true;
        if (!text) {
            outputText.value = '';
            badge.textContent = 'Chờ nhập liệu...';
            badge.classList.remove('he2-active');
            statsEl.textContent = '';
            warnEl.hidden = true;
            return;
        }
        if (mode === 'encode') {
            var r = he2Escape(text, selStyle.value, selScope.value);
            outputText.value = r.text;
            badge.textContent = '✅ Đã mã hóa';
            badge.classList.add('he2-active');
            statsEl.textContent = he2Fmt(text.length) + ' ký tự → ' + he2Fmt(r.text.length) + ' ký tự · ' + he2Fmt(r.changed) + ' ký tự đã đổi';
            var refs = he2FindRefs(text);
            if (refs.length > 0) {
                warnEl.textContent = '⚠ Đầu vào đã chứa tham chiếu (' + refs.slice(0, 3).join(', ') + (refs.length > 3 ? ', …' : '') + ') — mã hóa sẽ tạo thêm một lớp (ví dụ &lt; thành &amp;lt;).';
                warnEl.hidden = false;
            } else {
                warnEl.hidden = true;
            }
        } else {
            var out = he2Unescape(text);
            outputText.value = out;
            badge.textContent = '✅ Đã giải mã';
            badge.classList.add('he2-active');
            var refsIn = he2FindRefs(text);
            var refsOut = he2FindRefs(out);
            var decoded = he2DecodedCount(refsIn, refsOut);
            statsEl.textContent = he2Fmt(text.length) + ' ký tự → ' + he2Fmt(out.length) + ' ký tự · ' + he2Fmt(decoded) + ' tham chiếu đã giải';
            var notes = [];
            var restOut = refsOut.slice();
            var unresolved = [];
            for (var i = 0; i < refsIn.length; i++) {
                var j = restOut.indexOf(refsIn[i]);
                if (j !== -1) { unresolved.push(refsIn[i]); restOut.splice(j, 1); }
            }
            var badNums = he2InvalidNumericRefs(text);
            if (badNums.length > 0) notes.push('Tham chiếu số ngoài dải Unicode hợp lệ (' + badNums.slice(0, 3).join(', ') + ') — trình duyệt thay bằng ký tự �.');
            if (unresolved.length > 0) notes.push('Có tham chiếu trình duyệt không nhận dạng (' + unresolved.slice(0, 3).join(', ') + ') — kiểm tra lại tên entity.');
            if (restOut.length > 0) {
                notes.push('Kết quả vẫn còn tham chiếu (' + restOut.slice(0, 3).join(', ') + ') — chuỗi có nhiều lớp, dùng “Giải thêm 1 lớp” để giải tiếp.');
                btnLayer.hidden = false;
            }
            if (notes.length > 0) {
                warnEl.textContent = '⚠ ' + notes.join(' ');
                warnEl.hidden = false;
            } else {
                warnEl.hidden = true;
            }
        }
    }

    btnEncode.addEventListener('click', function() { he2SetMode('encode'); });
    btnDecode.addEventListener('click', function() { he2SetMode('decode'); });
    selStyle.addEventListener('change', he2Process);
    selScope.addEventListener('change', he2Process);
    inputText.addEventListener('input', he2Process);

    var samples = {
        encode1: { mode: 'encode', text: '<p>Chào & bạn</p>' },
        encode2: { mode: 'encode', text: '<a title="O\'Reilly">' },
        decode1: { mode: 'decode', text: '&lt;b&gt;Chào&lt;/b&gt; &amp; bạn' }
    };
    document.querySelectorAll('.he2-chip').forEach(function(chip) {
        chip.addEventListener('click', function() {
            var s = samples[chip.getAttribute('data-he2-sample')];
            if (!s) return;
            he2SetMode(s.mode);
            inputText.value = s.text;
            he2Process();
            inputText.focus();
        });
    });

    btnClear.addEventListener('click', function() {
        if (!clearArmed) {
            clearArmed = true;
            btnClear.textContent = 'Chạm lần nữa để xóa';
            clearTimer = setTimeout(function() {
                clearArmed = false;
                btnClear.textContent = '🧹 Xóa';
            }, 3000);
            return;
        }
        clearTimeout(clearTimer);
        clearArmed = false;
        btnClear.textContent = '🧹 Xóa';
        inputText.value = '';
        he2Process();
        inputText.focus();
    });

    btnSwap.addEventListener('click', function() {
        if (!outputText.value) return;
        inputText.value = outputText.value;
        he2SetMode(mode === 'encode' ? 'decode' : 'encode');
    });

    btnLayer.addEventListener('click', function() {
        if (!outputText.value) return;
        inputText.value = outputText.value;
        he2Process();
        inputText.focus();
    });

    btnCopy.addEventListener('click', function() {
        if (!outputText.value) return;
        var done = function() {
            btnCopy.textContent = '✅ Đã sao chép';
            setTimeout(function() { btnCopy.textContent = '📋 Sao chép kết quả'; }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(outputText.value).then(done, function() { he2CopyFallback(done); });
        } else {
            he2CopyFallback(done);
        }
    });

    function he2CopyFallback(done) {
        try {
            var ta = document.createElement('textarea');
            ta.value = outputText.value;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            var ok = document.execCommand('copy');
            document.body.removeChild(ta);
            if (ok) done();
            else he2ShowToast('Không sao chép được — hãy bôi đen kết quả rồi nhấn Ctrl+C.', true);
        } catch (err) {
            he2ShowToast('Không sao chép được — hãy bôi đen kết quả rồi nhấn Ctrl+C.', true);
        }
    }

    btnDownload.addEventListener('click', function() {
        if (!outputText.value) return;
        var blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'ket-qua-escape-html.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
    });

    he2SetMode('encode');
});

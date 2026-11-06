function ed2B64Encode(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
}
function ed2B64Decode(str) {
    var bin = atob(str);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}
function ed2Concat(parts) {
    var len = 0;
    for (var i = 0; i < parts.length; i++) len += parts[i].length;
    var out = new Uint8Array(len), off = 0;
    for (var j = 0; j < parts.length; j++) { out.set(parts[j], off); off += parts[j].length; }
    return out;
}
function ed2Md5(input) {
    var s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
             5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
             4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
             6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
    var K = [0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
             0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
             0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
             0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
             0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
             0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
             0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
             0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391];
    function rotl(x, c) { return (x << c) | (x >>> (32 - c)); }
    var msg = new Uint8Array(input.length + 1);
    msg.set(input);
    msg[input.length] = 0x80;
    var bitLen = input.length * 8;
    var padLen = (56 - (msg.length % 64) + 64) % 64;
    var data = new Uint8Array(msg.length + padLen + 8);
    data.set(msg);
    for (var b = 0; b < 8; b++) data[msg.length + padLen + b] = (bitLen / Math.pow(2, b * 8)) & 0xff;
    var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (var off = 0; off < data.length; off += 64) {
        var M = [];
        for (var w = 0; w < 16; w++) {
            M[w] = data[off + w * 4] | (data[off + w * 4 + 1] << 8) | (data[off + w * 4 + 2] << 16) | (data[off + w * 4 + 3] << 24);
        }
        var a = a0, b = b0, c = c0, d = d0;
        for (var i = 0; i < 64; i++) {
            var f, g;
            if (i < 16) { f = (b & c) | (~b & d); g = i; }
            else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
            else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
            else { f = c ^ (b | ~d); g = (7 * i) % 16; }
            var tmp = d;
            d = c;
            c = b;
            b = (b + rotl((a + f + K[i] + M[g]) | 0, s[i])) | 0;
            a = tmp;
        }
        a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0;
    }
    var out = new Uint8Array(16);
    [a0, b0, c0, d0].forEach(function (v, vi) {
        for (var k = 0; k < 4; k++) out[vi * 4 + k] = (v >>> (k * 8)) & 0xff;
    });
    return out;
}
function ed2EvpBytesToKey(passwordBytes, salt, total) {
    var out = new Uint8Array(0), prev = new Uint8Array(0);
    while (out.length < total) {
        prev = ed2Md5(ed2Concat([prev, passwordBytes, salt]));
        out = ed2Concat([out, prev]);
    }
    return out.slice(0, total);
}
async function ed2DeriveGcmKey(password, salt) {
    var enc = new TextEncoder();
    var base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
        base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function ed2EncryptGcm(plainText, password) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var key = await ed2DeriveGcmKey(password, salt);
    var ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(plainText)));
    return 'CCV1.' + ed2B64Encode(ed2Concat([salt, iv, ct]));
}
async function ed2DecryptGcm(payload, password) {
    var raw;
    try { raw = ed2B64Decode(payload); } catch (e) {
        var fe = new Error('format'); fe.ed2code = 'format'; throw fe;
    }
    if (raw.length < 16 + 12 + 16) {
        var se = new Error('short'); se.ed2code = 'format'; throw se;
    }
    var salt = raw.slice(0, 16), iv = raw.slice(16, 28), ct = raw.slice(28);
      var key = await ed2DeriveGcmKey(password, salt);
    var pt;
    try {
        pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct);
    } catch (e) {
        var ae = new Error('auth'); ae.ed2code = 'auth'; throw ae;
    }
    return new TextDecoder().decode(pt);
}
async function ed2DecryptLegacy(payload, password) {
    var raw;
    try { raw = ed2B64Decode(payload); } catch (e) {
        var fe = new Error('format'); fe.ed2code = 'format'; throw fe;
    }
    if (raw.length < 16 || raw[0] !== 0x53 || raw[1] !== 0x61 || raw[2] !== 0x6c || raw[3] !== 0x74 ||
        raw[4] !== 0x65 || raw[5] !== 0x64 || raw[6] !== 0x5f || raw[7] !== 0x5f) {
        var he = new Error('header'); he.ed2code = 'format'; throw he;
    }
    var salt = raw.slice(8, 16), ct = raw.slice(16);
    var derived = ed2EvpBytesToKey(new TextEncoder().encode(password), salt, 48);
    var key = await crypto.subtle.importKey('raw', derived.slice(0, 32), 'AES-CBC', false, ['decrypt']);
    var pt;
    try {
        pt = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: derived.slice(32, 48) }, key, ct);
    } catch (e) {
        var ae = new Error('auth'); ae.ed2code = 'auth'; throw ae;
    }
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(pt);
    } catch (e) {
        var ue = new Error('auth'); ue.ed2code = 'auth'; throw ue;
    }
}
function ed2DetectFormat(text) {
    if (text.indexOf('CCV1.') === 0) return 'gcm';
    if (text.indexOf('U2FsdGVkX1') === 0) return 'legacy';
    return 'unknown';
}
function ed2PasswordScore(pw) {
    var score = 0;
    if (pw.length >= 12) score += 2; else if (pw.length >= 8) score += 1;
    if (/[a-z]/.test(pw)) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    return score;
}
document.addEventListener('DOMContentLoaded', function () {
    var modeBtns = document.querySelectorAll('[data-ed2-mode]');
    var inputText = document.getElementById('ed2-input-text');
    var inputKey = document.getElementById('ed2-input-key');
    var btnToggleKey = document.getElementById('ed2-btn-toggle-key');
    var btnGenKey = document.getElementById('ed2-btn-gen-key');
    var keyStrength = document.getElementById('ed2-key-strength');
    var lblInput = document.getElementById('ed2-lbl-input');
    var lblOutput = document.getElementById('ed2-lbl-output');
    var btnAction = document.getElementById('ed2-btn-action');
    var btnSwap = document.getElementById('ed2-btn-swap');
    var btnCopy = document.getElementById('ed2-btn-copy');
    var btnDownload = document.getElementById('ed2-btn-download');
    var btnClear = document.getElementById('ed2-btn-clear');
    var outputText = document.getElementById('ed2-output-text');
    var errorMsg = document.getElementById('ed2-error-msg');
    var legacyWarn = document.getElementById('ed2-legacy-warn');
    var metaLine = document.getElementById('ed2-meta');
    var mode = 'encrypt';
    function clearOutput() {
        outputText.value = '';
        metaLine.hidden = true;
        legacyWarn.hidden = true;
    }
    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.hidden = false;
        outputText.value = '';
        metaLine.hidden = true;
    }
    function updateModeUI() {
        modeBtns.forEach(function (b) { b.classList.toggle('ed2-mode-active', b.getAttribute('data-ed2-mode') === mode); });
        errorMsg.hidden = true;
        clearOutput();
        if (mode === 'encrypt') {
            lblInput.textContent = 'Văn bản cần mã hóa:';
            lblOutput.textContent = 'Chuỗi đã mã hóa (CCV1):';
            inputText.placeholder = 'Nhập văn bản cần giấu…';
            btnAction.textContent = '🚀 Mã hóa';
            btnAction.style.color = '#fde74c';
        } else {
            lblInput.textContent = 'Chuỗi cần giải mã:';
            lblOutput.textContent = 'Văn bản gốc:';
            inputText.placeholder = 'Dán chuỗi CCV1.… hoặc U2FsdGVkX1… vào đây';
            btnAction.textContent = '🔓 Giải mã';
            btnAction.style.color = '#4cc9f0';
        }
    }
    modeBtns.forEach(function (b) {
        b.addEventListener('click', function () { mode = b.getAttribute('data-ed2-mode'); updateModeUI(); });
    });
    btnToggleKey.addEventListener('click', function () {
        if (inputKey.type === 'password') { inputKey.type = 'text'; btnToggleKey.textContent = '🙈'; }
              else { inputKey.type = 'password'; btnToggleKey.textContent = '👁️'; }
    });
    function refreshStrength() {
        var pw = inputKey.value;
        if (!pw) { keyStrength.textContent = 'Mật khẩu càng dài và càng nhiều loại ký tự càng khó đoán.'; return; }
        var s = ed2PasswordScore(pw);
        keyStrength.textContent = 'Độ mạnh: ' + (s <= 2 ? 'Yếu — nên dài hơn và thêm ký tự khác loại.' : s <= 4 ? 'Trung bình.' : 'Mạnh.');
    }
    inputKey.addEventListener('input', refreshStrength);
    btnGenKey.addEventListener('click', function () {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
        var rnd = new Uint32Array(16);
        crypto.getRandomValues(rnd);
        var pw = '';
        for (var i = 0; i < 16; i++) pw += chars[rnd[i] % chars.length];
        inputKey.value = pw;
        if (inputKey.type === 'password') { inputKey.type = 'text'; btnToggleKey.textContent = '🙈'; }
        refreshStrength();
        inputKey.focus();
    });
    btnAction.addEventListener('click', async function () {
        errorMsg.hidden = true;
        legacyWarn.hidden = true;
        metaLine.hidden = true;
        var raw = inputText.value;
        var pw = inputKey.value;
        if (!raw) { showError('Hãy nhập văn bản.'); inputText.focus(); return; }
        if (!pw) { showError('Hãy nhập mật khẩu.'); inputKey.focus(); return; }
        btnAction.disabled = true;
        try {
            if (mode === 'encrypt') {
                var enc = await ed2EncryptGcm(raw, pw);
                outputText.value = enc;
                metaLine.textContent = 'Vào: ' + raw.length + ' ký tự · Ra: ' + enc.length + ' ký tự · Định dạng: CCV1 (AES-256-GCM).';
                metaLine.hidden = false;
            } else {
                var cipher = raw.trim();
                var fmt = ed2DetectFormat(cipher);
                if (fmt === 'unknown') {
                    showError('Chuỗi giải mã không đúng định dạng: phải bắt đầu bằng CCV1. hoặc U2FsdGVkX1.');
                    return;
                }
                var dec;
                if (fmt === 'gcm') {
                    dec = await ed2DecryptGcm(cipher.slice(5), pw);
                    metaLine.textContent = 'Vào: ' + cipher.length + ' ký tự · Ra: ' + dec.length + ' ký tự · Định dạng nhận dạng: CCV1 (AES-256-GCM).';
                } else {
                    dec = await ed2DecryptLegacy(cipher, pw);
                    legacyWarn.hidden = false;
                    metaLine.textContent = 'Vào: ' + cipher.length + ' ký tự · Ra: ' + dec.length + ' ký tự · Định dạng nhận dạng: bản mã cũ (AES-256-CBC).';
                }
                outputText.value = dec;
                metaLine.hidden = false;
            }
        } catch (e) {
            if (e && e.ed2code === 'auth') showError('Sai mật khẩu hoặc dữ liệu đã bị sửa. Với bản mã CCV1, hai trường hợp này không phân biệt được.');
            else if (e && e.ed2code === 'format') showError('Chuỗi giải mã không đúng định dạng hoặc quá ngắn.');
            else showError('Không xử lý được. Hãy kiểm tra lại văn bản và mật khẩu.');
        } finally {
            btnAction.disabled = false;
        }
    });
    btnSwap.addEventListener('click', function () {
        if (!outputText.value) return;
        inputText.value = outputText.value;
        mode = mode === 'encrypt' ? 'decrypt' : 'encrypt';
        updateModeUI();
    });
    btnCopy.addEventListener('click', async function () {
        if (!outputText.value) return;
        try {
            await navigator.clipboard.writeText(outputText.value);
            var old = btnCopy.textContent;
            btnCopy.textContent = '✅ Đã sao chép!';
            setTimeout(function () { btnCopy.textContent = old; }, 1500);
        } catch (e) {
            showError('Không sao chép được tự động — hãy bôi đen kết quả và sao chép thủ công.');
        }
    });
    btnDownload.addEventListener('click', function () {
        if (!outputText.value) return;
        var blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = mode === 'encrypt' ? 'congcuviet-ban-ma.txt' : 'congcuviet-ban-ro.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    });
    btnClear.addEventListener('click', function () {
        inputText.value = '';
        inputKey.value = '';
        refreshStrength();
        errorMsg.hidden = true;
        clearOutput();
        inputText.focus();
    });
    updateModeUI();
});

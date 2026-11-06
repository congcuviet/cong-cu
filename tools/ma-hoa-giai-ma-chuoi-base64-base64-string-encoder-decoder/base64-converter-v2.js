document.addEventListener('DOMContentLoaded', function() {
// PURE LOGIC START
var BC2_CHUNK = 0x8000;
function bc2BytesFromText(str) { return new TextEncoder().encode(str); }
function bc2B64FromBytes(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i += BC2_CHUNK) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + BC2_CHUNK));
    }
    return btoa(bin);
}
function bc2BytesFromB64(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}
function bc2Encode(str, opts) {
    var bytes = bc2BytesFromText(str);
    var out = bc2B64FromBytes(bytes);
    if (opts.urlSafe) out = out.replace(/\+/g, '-').replace(/\//g, '_');
    if (opts.noPad) out = out.replace(/=+$/, '');
    return { text: out, inChars: Array.from(str).length, inBytes: bytes.length, outChars: out.length };
}
function bc2Decode(str) {
    var s = str;
    var dataNote = false;
    var m = s.match(/^\s*data:[^,]*;base64,/i);
    if (m) { s = s.slice(m[0].length); dataNote = true; }
    s = s.replace(/\s+/g, '');
    if (!s) return { ok: false, empty: true };
    var urlSafe = false;
    if (/[-_]/.test(s)) { urlSafe = true; s = s.replace(/-/g, '+').replace(/_/g, '/'); }
    var bad = s.match(/[^A-Za-z0-9+\/=]/);
    if (bad) return { ok: false, error: 'badchar', ch: bad[0] };
    var eqIdx = s.indexOf('=');
    if (eqIdx !== -1 && !/^={1,2}$/.test(s.slice(eqIdx))) return { ok: false, error: 'padpos' };
    if (s.length % 4 === 1) return { ok: false, error: 'len' };
    var padded = s;
    while (padded.length % 4) padded += '=';
    var bytes;
    try { bytes = bc2BytesFromB64(padded); } catch (e) { return { ok: false, error: 'badchar', ch: '?' }; }
    var text;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch (e) { return { ok: false, error: 'utf8' }; }
    return { ok: true, text: text, dataNote: dataNote, urlSafe: urlSafe, inChars: s.length, outChars: Array.from(text).length };
}
function bc2ErrorText(r) {
    if (r.error === 'badchar') return 'Ký tự “' + r.ch + '” không thuộc bảng Base64 — chỉ dùng A–Z, a–z, 0–9, +, / (hoặc -, _ ở dạng URL-safe) và dấu = ở cuối chuỗi.';
    if (r.error === 'padpos') return 'Dấu = chỉ được đứng ở cuối chuỗi (tối đa 2 dấu) — hãy kiểm tra lại chuỗi nguồn.';
    if (r.error === 'len') return 'Độ dài chuỗi không hợp lệ: sau khi bỏ khoảng trắng, số ký tự dư 1 so với nhóm 4.';
    if (r.error === 'utf8') return 'Chuỗi Base64 hợp lệ nhưng các byte khôi phục không tạo thành văn bản UTF-8 — có thể đây là dữ liệu nhị phân (ảnh/tệp), không phải văn bản.';
    return 'Dữ liệu không hợp lệ.';
}
function bc2Fmt(n) { return n.toLocaleString('vi-VN'); }
// PURE LOGIC END

var modeEncodeBtn = document.getElementById('bc2-mode-encode');
var modeDecodeBtn = document.getElementById('bc2-mode-decode');
var chipsBox = document.getElementById('bc2-chips');
var inputText = document.getElementById('bc2-input-text');
var outputText = document.getElementById('bc2-output-text');
var lblInput = document.getElementById('bc2-lbl-input');
var lblOutput = document.getElementById('bc2-lbl-output');
var badge = document.getElementById('bc2-status-badge');
var errLine = document.getElementById('bc2-error');
var noteLine = document.getElementById('bc2-note');
var statsLine = document.getElementById('bc2-stats');
var btnClear = document.getElementById('bc2-btn-clear');
var btnSwap = document.getElementById('bc2-btn-swap');
var btnCopy = document.getElementById('bc2-btn-copy');
var btnDownload = document.getElementById('bc2-btn-download');
var variantStd = document.getElementById('bc2-variant-std');
var variantUrl = document.getElementById('bc2-variant-url');
var noPadBox = document.getElementById('bc2-nopad');
var toast = document.getElementById('bc2-toast');

var currentMode = 'encode';
var urlSafeOpt = false;
var clearArmed = false;
var clearTimer = null;
var toastTimer = null;

var SAMPLES = {
    encode: ['Xin chào', 'Hello', '😀', 'Cà phê'],
    decode: ['SGVsbG8=', '8J+YgA==', 'WGluIGNow6Bv', 'Pj4-']
};

function bc2ShowToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { toast.hidden = true; }, 2500);
}
function bc2SetBadge(text, cls) {
    badge.textContent = text;
    badge.className = 'bc2-badge' + (cls ? ' ' + cls : '');
}
function bc2RenderChips() {
    chipsBox.innerHTML = '';
    SAMPLES[currentMode].forEach(function(s) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'bc2-chip';
        b.textContent = s;
        b.addEventListener('click', function() {
            inputText.value = s;
            bc2DisarmClear();
            bc2Process();
            inputText.focus();
        });
        chipsBox.appendChild(b);
    });
}
function bc2UpdateModeUI() {
    var enc = currentMode === 'encode';
    modeEncodeBtn.classList.toggle('is-active', enc);
    modeDecodeBtn.classList.toggle('is-active', !enc);
    modeEncodeBtn.setAttribute('aria-pressed', enc ? 'true' : 'false');
    modeDecodeBtn.setAttribute('aria-pressed', !enc ? 'true' : 'false');
    if (enc) {
        lblInput.textContent = 'Văn bản thuần (Plain Text):';
        lblOutput.textContent = 'Chuỗi Base64:';
        inputText.placeholder = 'Nhập văn bản cần mã hóa...';
    } else {
        lblInput.textContent = 'Chuỗi Base64:';
        lblOutput.textContent = 'Văn bản gốc (Plain Text):';
        inputText.placeholder = 'Dán chuỗi Base64 vào đây...';
    }
    bc2RenderChips();
}
function bc2SetMode(mode, reprocess) {
    currentMode = mode;
    bc2UpdateModeUI();
    if (reprocess) bc2Process();
}
function bc2DisarmClear() {
    clearArmed = false;
    btnClear.textContent = '🧹 Xóa';
    btnClear.classList.remove('is-confirm');
    if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
}
function bc2Process() {
    var text = inputText.value;
    errLine.hidden = true;
    noteLine.hidden = true;
    if (currentMode === 'encode') {
        if (!text) {
            outputText.value = '';
            statsLine.textContent = '';
            bc2SetBadge('Chờ nhập liệu...', '');
            bc2SyncButtons();
            return;
        }
        var r = bc2Encode(text, { urlSafe: urlSafeOpt, noPad: noPadBox.checked });
        outputText.value = r.text;
        var pct = r.inBytes ? Math.round((r.outChars - r.inBytes) / r.inBytes * 100) : 0;
        var sign = pct >= 0 ? '+' : '';
        statsLine.textContent = bc2Fmt(r.inChars) + ' ký tự · ' + bc2Fmt(r.inBytes) + ' byte → ' + bc2Fmt(r.outChars) + ' ký tự Base64 (' + sign + pct + '%)';
        bc2SetBadge('✅ Đã mã hóa', 'active');
        bc2SyncButtons();
        return;
    }
    var stripped = text.replace(/\s+/g, '');
    if (!stripped) {
        outputText.value = '';
        statsLine.textContent = '';
        bc2SetBadge('Chờ nhập liệu...', '');
        bc2SyncButtons();
        return;
    }
    var d = bc2Decode(text);
    if (!d.ok) {
        outputText.value = '';
        statsLine.textContent = '';
        errLine.textContent = bc2ErrorText(d);
        errLine.hidden = false;
        bc2SetBadge('❌ Lỗi định dạng', 'error');
        bc2SyncButtons();
        return;
    }
    outputText.value = d.text;
    statsLine.textContent = bc2Fmt(d.inChars) + ' ký tự Base64 → ' + bc2Fmt(d.outChars) + ' ký tự văn bản';
    var notes = [];
    if (d.dataNote) notes.push('Đã tách tiền tố data: khỏi chuỗi đầu vào.');
    if (d.urlSafe) notes.push('Đã nhận diện bảng Base64URL (- _) và chuyển về bảng chuẩn.');
    if (notes.length) { noteLine.textContent = notes.join(' '); noteLine.hidden = false; }
    bc2SetBadge('✅ Đã giải mã', 'active');
    bc2SyncButtons();
}
function bc2SyncButtons() {
    var has = !!outputText.value;
    btnCopy.disabled = !has;
    btnDownload.disabled = !has;
}

modeEncodeBtn.addEventListener('click', function() { bc2SetMode('encode', true); });
modeDecodeBtn.addEventListener('click', function() { bc2SetMode('decode', true); });
inputText.addEventListener('input', function() { bc2DisarmClear(); bc2Process(); });

btnClear.addEventListener('click', function() {
    if (!clearArmed) {
        clearArmed = true;
        btnClear.textContent = 'Chạm lần nữa để xóa';
        btnClear.classList.add('is-confirm');
        clearTimer = setTimeout(bc2DisarmClear, 3000);
        return;
    }
    bc2DisarmClear();
    inputText.value = '';
    bc2Process();
    inputText.focus();
});

btnSwap.addEventListener('click', function() {
    if (!outputText.value) return;
    inputText.value = outputText.value;
    bc2SetMode(currentMode === 'encode' ? 'decode' : 'encode', false);
    bc2DisarmClear();
    bc2Process();
});

btnCopy.addEventListener('click', function() {
    if (!outputText.value) return;
    var done = function() { btnCopy.textContent = '✅ Đã sao chép!'; setTimeout(function() { btnCopy.textContent = '📋 Sao chép kết quả'; }, 1500); };
    var fail = function() { bc2ShowToast('Không sao chép được — trình duyệt chặn clipboard, hãy bôi đen kết quả rồi nhấn Ctrl+C.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(outputText.value).then(done, fail);
    } else {
        try {
            outputText.select();
            if (document.execCommand('copy')) done(); else fail();
        } catch (e) { fail(); }
    }
});

btnDownload.addEventListener('click', function() {
    if (!outputText.value) return;
    var blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'base64-ket-qua.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() { URL.revokeObjectURL(a.href); a.remove(); }, 100);
});

function bc2SetVariant(urlSafe) {
    urlSafeOpt = urlSafe;
    variantStd.classList.toggle('is-active', !urlSafe);
    variantUrl.classList.toggle('is-active', urlSafe);
    variantStd.setAttribute('aria-pressed', !urlSafe ? 'true' : 'false');
    variantUrl.setAttribute('aria-pressed', urlSafe ? 'true' : 'false');
    bc2Process();
}
variantStd.addEventListener('click', function() { bc2SetVariant(false); });
variantUrl.addEventListener('click', function() { bc2SetVariant(true); });
noPadBox.addEventListener('change', bc2Process);

bc2UpdateModeUI();
bc2Process();
});
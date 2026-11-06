document.addEventListener('DOMContentLoaded', function() {
/* PURE LOGIC START */
function ue3IsHex(ch) { return /^[0-9A-Fa-f]$/.test(ch); }
function ue3CountGroups(s) { var m = s.match(/%[0-9A-Fa-f]{2}/g); return m ? m.length : 0; }
function ue3HasGroups(s) { return ue3CountGroups(s) > 0; }
function ue3Utf8Bytes(s) { return new TextEncoder().encode(s).length; }
function ue3FindBadPercent(s) {
  for (var i = 0; i < s.length; i++) {
    if (s[i] !== '%') continue;
    var h1 = s[i + 1], h2 = s[i + 2];
    if (h1 === undefined || h2 === undefined) return { pos: i + 1, token: s.slice(i), reason: 'missing' };
    if (!ue3IsHex(h1) || !ue3IsHex(h2)) return { pos: i + 1, token: s.slice(i, i + 3), reason: 'badhex' };
  }
  return null;
}
function ue3EncodeStrict(s) {
  return encodeURIComponent(s).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}
function ue3EncodeForm(s) {
  return encodeURIComponent(s).replace(/%20/g, '+').replace(/[!'()]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}
function ue3EncodeOnce(text, scope) {
  if (scope === 'full') return encodeURI(text);
  if (scope === 'form') return ue3EncodeForm(text);
  if (scope === 'strict') return ue3EncodeStrict(text);
  return encodeURIComponent(text);
}
function ue3DecodeOnce(text, scope) {
  if (scope === 'full') return decodeURI(text);
  if (scope === 'form') return decodeURIComponent(text.replace(/\+/g, ' '));
  return decodeURIComponent(text);
}
function ue3Convert(text, mode, scope) {
  if (mode === 'encode') return { ok: true, value: ue3EncodeOnce(text, scope) };
  var bad = ue3FindBadPercent(text);
  if (bad) {
    var msg = bad.reason === 'missing'
      ? 'Dấu % ở vị trí ' + bad.pos + ' thiếu 2 ký tự hex phía sau (cần dạng %HH).'
      : 'Nhóm ' + bad.token + ' ở vị trí ' + bad.pos + ' không phải mã hex hợp lệ (cần dạng %HH).';
    return { ok: false, error: msg };
  }
  try {
    return { ok: true, value: ue3DecodeOnce(text, scope) };
  } catch (e) {
    return { ok: false, error: 'Chuỗi byte UTF-8 không hợp lệ (ví dụ %C3 đứng một mình, thiếu byte tiếp theo).' };
  }
}
function ue3EncodeSafe(text, scope) {
  try {
    return { ok: true, value: ue3EncodeOnce(text, scope) };
  } catch (e) {
    return { ok: false, error: 'Chuỗi chứa ký tự surrogate đơn lẻ, không mã hóa được thành UTF-8.' };
  }
}
/* PURE LOGIC END */

var modeSeg = document.querySelectorAll('[data-ue3-mode]');
var scopeSeg = document.querySelectorAll('[data-ue3-scope]');
var inputEl = document.getElementById('ue3-input');
var outputEl = document.getElementById('ue3-output');
var badgeEl = document.getElementById('ue3-badge');
var statsEl = document.getElementById('ue3-stats');
var errorEl = document.getElementById('ue3-error');
var warnEl = document.getElementById('ue3-warn');
var btnMore = document.getElementById('ue3-btn-more');
var btnCopy = document.getElementById('ue3-btn-copy');
var btnDownload = document.getElementById('ue3-btn-download');
var btnClear = document.getElementById('ue3-btn-clear');
var btnSwap = document.getElementById('ue3-btn-swap');
var toastEl = document.getElementById('ue3-toast');
var hintEl = document.getElementById('ue3-scope-hint');
var ue3ScopeHints = {
  component: 'Tham số: mã hóa cả dấu cấu trúc, dùng cho một giá trị riêng trước khi ghép vào URL.',
  full: 'Nguyên link: giữ nguyên dấu cấu trúc (: / ? & = #), dùng cho liên kết đã có cấu trúc.',
  form: 'Form: khoảng trắng thành dấu +, theo quy ước application/x-www-form-urlencoded.',
  strict: 'Nghiêm ngặt: chỉ giữ A–Z a–z 0–9 - _ . ~, mã hóa cả ! \' ( ) *, theo RFC 3986.'
};

var mode = 'encode';
var scope = 'component';
var layers = 1;
var hasError = false;
var clearArmed = false;
var clearTimer = null;

function ue3Show(el, show) { el.hidden = !show; }
function ue3Toast(msg) {
  toastEl.textContent = msg;
  ue3Show(toastEl, true);
  setTimeout(function() { ue3Show(toastEl, false); }, 1800);
}
function ue3SetSeg(list, value, attr) {
  list.forEach(function(b) {
    var on = b.getAttribute(attr) === value;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
function ue3DisarmClear() {
  clearArmed = false;
  if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
  btnClear.textContent = '🧹 Xóa';
}

function ue3Process() {
  var text = inputEl.value;
  ue3DisarmClear();
  if (!text) {
    outputEl.value = '';
    hasError = false;
    badgeEl.textContent = 'Chờ nhập liệu…';
    badgeEl.className = 'ue3-badge';
    statsEl.textContent = 'Nhập chuỗi ở trên để xem kết quả.';
    ue3Show(errorEl, false);
    ue3Show(warnEl, false);
    ue3Show(btnMore, false);
    btnCopy.disabled = true;
    btnDownload.disabled = true;
    return;
  }
  var res = mode === 'encode' ? ue3EncodeSafe(text, scope) : ue3Convert(text, mode, scope);
  if (!res.ok) {
    outputEl.value = '';
    hasError = true;
    badgeEl.textContent = '❌ Lỗi định dạng';
    badgeEl.className = 'ue3-badge error';
    errorEl.textContent = res.error;
    ue3Show(errorEl, true);
    ue3Show(warnEl, false);
    ue3Show(btnMore, false);
    statsEl.textContent = text.length + ' ký tự · ' + ue3Utf8Bytes(text) + ' byte UTF-8';
    btnCopy.disabled = true;
    btnDownload.disabled = true;
    return;
  }
  hasError = false;
  outputEl.value = res.value;
  badgeEl.textContent = (mode === 'encode' ? '✅ Đã mã hóa' : '✅ Đã giải mã') + (layers > 1 ? ' · lớp ' + layers : '');
  badgeEl.className = 'ue3-badge active';
  var groups = ue3CountGroups(res.value);
  statsEl.textContent = text.length + ' ký tự · ' + ue3Utf8Bytes(text) + ' byte UTF-8 · ' + ue3CountGroups(text) + ' nhóm %HH ở đầu vào · ' + groups + ' nhóm %HH ở kết quả';
  ue3Show(errorEl, false);
  if (mode === 'encode' && ue3HasGroups(text)) {
    warnEl.textContent = 'Chuỗi đã chứa ' + ue3CountGroups(text) + ' nhóm %HH — mã hóa tiếp sẽ biến % thành %25 (thêm 1 lớp).';
    ue3Show(warnEl, true);
  } else {
    ue3Show(warnEl, false);
  }
  var showMore = mode === 'encode' ? true : ue3HasGroups(res.value);
  btnMore.textContent = mode === 'encode' ? 'Mã hóa thêm 1 lớp' : 'Giải mã thêm 1 lớp';
  ue3Show(btnMore, showMore);
  btnCopy.disabled = false;
  btnDownload.disabled = false;
}

modeSeg.forEach(function(b) {
  b.addEventListener('click', function() {
    mode = b.getAttribute('data-ue3-mode');
    layers = 1;
    ue3SetSeg(modeSeg, mode, 'data-ue3-mode');
    inputEl.placeholder = mode === 'encode'
      ? 'Nhập chuỗi văn bản hoặc URL nguyên bản vào đây…'
      : 'Dán chuỗi URL đã mã hóa (chứa %20, %3D…) vào đây…';
    ue3Process();
  });
});
scopeSeg.forEach(function(b) {
  b.addEventListener('click', function() {
    scope = b.getAttribute('data-ue3-scope');
    layers = 1;
    ue3SetSeg(scopeSeg, scope, 'data-ue3-scope');
    hintEl.textContent = ue3ScopeHints[scope];
    ue3Process();
  });
});
document.querySelectorAll('[data-ue3-sample]').forEach(function(b) {
  b.addEventListener('click', function() {
    inputEl.value = b.getAttribute('data-ue3-sample');
    layers = 1;
    ue3Process();
    inputEl.focus();
  });
});
inputEl.addEventListener('input', function() { layers = 1; ue3Process(); });

btnMore.addEventListener('click', function() {
  if (hasError || !outputEl.value) return;
  inputEl.value = outputEl.value;
  layers += 1;
  ue3Process();
});
btnSwap.addEventListener('click', function() {
  if (hasError || !outputEl.value) return;
  mode = mode === 'encode' ? 'decode' : 'encode';
  layers = 1;
  ue3SetSeg(modeSeg, mode, 'data-ue3-mode');
  inputEl.placeholder = mode === 'encode'
    ? 'Nhập chuỗi văn bản hoặc URL nguyên bản vào đây…'
    : 'Dán chuỗi URL đã mã hóa (chứa %20, %3D…) vào đây…';
  inputEl.value = outputEl.value;
  ue3Process();
});
btnCopy.addEventListener('click', function() {
  if (hasError || !outputEl.value) return;
  var done = function() { ue3Toast('Đã sao chép kết quả!'); };
  var fail = function() { ue3Toast('Không sao chép được — hãy bôi đen kết quả rồi sao chép tay.'); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(outputEl.value).then(done, function() {
      outputEl.select();
      try { document.execCommand('copy'); done(); } catch (e) { fail(); }
    });
  } else {
    outputEl.select();
    try { document.execCommand('copy'); done(); } catch (e) { fail(); }
  }
});
btnDownload.addEventListener('click', function() {
  if (hasError || !outputEl.value) return;
  var blob = new Blob([outputEl.value], { type: 'text/plain;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'url-encode-output.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
});
btnClear.addEventListener('click', function() {
  if (!clearArmed) {
    clearArmed = true;
    btnClear.textContent = 'Chạm lần nữa để xóa';
    clearTimer = setTimeout(ue3DisarmClear, 2500);
    return;
  }
  ue3DisarmClear();
  inputEl.value = '';
  layers = 1;
  ue3Process();
  inputEl.focus();
});

ue3SetSeg(modeSeg, mode, 'data-ue3-mode');
ue3SetSeg(scopeSeg, scope, 'data-ue3-scope');
ue3Process();
});

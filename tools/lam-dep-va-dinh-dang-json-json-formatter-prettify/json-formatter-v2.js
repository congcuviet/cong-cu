/* PURE LOGIC START */
(function (root) {
  'use strict';

  var MAX_CHARS = 2000000;
  var MAX_DEPTH = 500;
  var MAX_SAFE = 9007199254740991;

  var ERR_MSG = {
    'trailing-comma': 'Dấu phẩy cuối không được phép trong JSON',
    'single-quote': 'Chuỗi phải dùng ngoặc kép, không dùng nháy đơn',
    'unquoted-key': 'Tên thuộc tính phải đặt trong ngoặc kép',
    'comment': 'JSON không cho phép comment (// hoặc /* */)',
    'missing-comma': 'Thiếu dấu phẩy giữa các phần tử',
    'missing-colon': 'Thiếu dấu hai chấm sau tên thuộc tính',
    'missing-close': 'Thiếu dấu đóng ngoặc',
    'unexpected-char': 'Ký tự không hợp lệ',
    'control-char': 'Ký tự điều khiển trong chuỗi phải được escape (\\n, \\t...)',
    'invalid-literal': 'Giá trị không hợp lệ — chỉ chấp nhận true, false hoặc null',
    'trailing-content': 'Còn nội dung thừa sau giá trị JSON hoàn chỉnh',
    'unexpected-end': 'Dữ liệu chưa đầy đủ — còn thiếu phần sau',
    'leading-zero': 'Số không được viết số 0 ở đầu (ví dụ 01)',
    'bad-escape': 'Ký tự escape không hợp lệ sau dấu \\',
    'bad-unicode': 'Mã \\u phải có đủ 4 chữ số hex',
    'too-deep': 'JSON lồng nhau quá sâu (tối đa 500 cấp)',
    'too-big': 'Vượt quá giới hạn 2.000.000 ký tự'
  };

  function lineCol(text, pos) {
    var line = 1;
    var lineStart = 0;
    for (var i = 0; i < pos && i < text.length; i++) {
      if (text.charCodeAt(i) === 10) { line++; lineStart = i + 1; }
    }
    return { line: line, col: pos - lineStart + 1 };
  }

  function snippet(text, pos) {
    var start = text.lastIndexOf('\n', pos - 1) + 1;
    var end = text.indexOf('\n', pos);
    if (end === -1) end = text.length;
    var lineText = text.slice(start, end);
    var col = pos - start;
    if (lineText.length > 120) {
      var wStart = Math.max(0, col - 40);
      var wEnd = Math.min(lineText.length, col + 40);
      var shown = lineText.slice(wStart, wEnd);
      return { line: (wStart > 0 ? '…' : '') + shown + (wEnd < lineText.length ? '…' : ''), caret: (wStart > 0 ? 1 : 0) + (col - wStart) };
    }
    return { line: lineText, caret: col };
  }

  function byteLen(s) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s).length;
    var n = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      n += c < 128 ? 1 : c < 2048 ? 2 : (c >= 55296 && c <= 56319) ? 4 : 3;
      if (c >= 55296 && c <= 56319) i++;
    }
    return n;
  }

  function countKeys(v) {
    if (Array.isArray(v)) {
      var n = 0;
      for (var i = 0; i < v.length; i++) n += countKeys(v[i]);
      return n;
    }
    if (v !== null && typeof v === 'object') {
      var k = Object.keys(v).length;
      for (var j = 0; j < Object.keys(v).length; j++) k += countKeys(v[Object.keys(v)[j]]);
      return k;
    }
    return 0;
  }

  function depthOf(v) {
    if (Array.isArray(v)) {
      var d = 0;
      for (var i = 0; i < v.length; i++) d = Math.max(d, depthOf(v[i]));
      return 1 + d;
    }
    if (v !== null && typeof v === 'object') {
      var keys = Object.keys(v);
      var dd = 0;
      for (var j = 0; j < keys.length; j++) dd = Math.max(dd, depthOf(v[keys[j]]));
      return 1 + dd;
    }
    return 0;
  }

  function parseJson(text) {
    if (text.length > MAX_CHARS) {
      return { ok: false, error: { pos: MAX_CHARS, code: 'too-big', message: ERR_MSG['too-big'] } };
    }
    var i = 0;
    var len = text.length;
    var duplicates = [];
    var bigInts = [];

    function err(pos, code) {
      var e = new Error(ERR_MSG[code]);
      e.pos = pos;
      e.code = code;
      throw e;
    }

    function skipWs() {
      while (i < len) {
        var c = text.charCodeAt(i);
        if (c === 32 || c === 10 || c === 13 || c === 9) i++;
        else break;
      }
    }

    function parseString() {
      var start = i;
      i++;
      var out = '';
      while (i < len) {
        var ch = text[i];
        var code = text.charCodeAt(i);
        if (ch === '"') { i++; return out; }
        if (code < 32) err(i, 'control-char');
        if (ch === '\\') {
          i++;
          if (i >= len) err(len, 'unexpected-end');
          var esc = text[i];
          if (esc === '"' || esc === '\\' || esc === '/') { out += esc; i++; }
          else if (esc === 'b') { out += '\b'; i++; }
          else if (esc === 'f') { out += '\f'; i++; }
          else if (esc === 'n') { out += '\n'; i++; }
          else if (esc === 'r') { out += '\r'; i++; }
          else if (esc === 't') { out += '\t'; i++; }
          else if (esc === 'u') {
            var hex = text.slice(i + 1, i + 5);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) err(i, 'bad-unicode');
            out += String.fromCharCode(parseInt(hex, 16));
            i += 5;
          } else err(i, 'bad-escape');
        } else { out += ch; i++; }
      }
      err(start, 'unexpected-end');
      return out;
    }

    function parseNumber(path) {
      var start = i;
      if (text[i] === '-') i++;
      if (i >= len) err(len, 'unexpected-end');
      if (text[i] === '0') {
        i++;
        if (i < len && text[i] >= '0' && text[i] <= '9') err(i, 'leading-zero');
      } else if (text[i] >= '1' && text[i] <= '9') {
        while (i < len && text[i] >= '0' && text[i] <= '9') i++;
      } else {
        err(i, 'unexpected-char');
      }
      var isInt = true;
      if (text[i] === '.') {
        isInt = false;
        i++;
        if (i >= len || text[i] < '0' || text[i] > '9') err(i, 'unexpected-char');
        while (i < len && text[i] >= '0' && text[i] <= '9') i++;
      }
      if (text[i] === 'e' || text[i] === 'E') {
        isInt = false;
        i++;
        if (text[i] === '+' || text[i] === '-') i++;
        if (i >= len || text[i] < '0' || text[i] > '9') err(i, 'unexpected-char');
        while (i < len && text[i] >= '0' && text[i] <= '9') i++;
      }
      var lex = text.slice(start, i);
      if (isInt) {
        var num = Number(lex);
        if (Math.abs(num) > MAX_SAFE) bigInts.push({ path: path, raw: lex });
      }
      return Number(lex);
    }

    function parseLiteral(word, value) {
      if (text.slice(i, i + word.length) === word) { i += word.length; return value; }
      err(i, 'invalid-literal');
      return null;
    }

    function parseValue(path, depth) {
      if (depth > MAX_DEPTH) err(i, 'too-deep');
      skipWs();
      if (i >= len) err(len, 'unexpected-end');
      var ch = text[i];
      if (ch === '{') return parseObject(path, depth);
      if (ch === '[') return parseArray(path, depth);
      if (ch === '"') return parseString();
      if (ch === '-' || (ch >= '0' && ch <= '9')) return parseNumber(path);
      if (ch === 't') return parseLiteral('true', true);
      if (ch === 'f') return parseLiteral('false', false);
      if (ch === 'n') return parseLiteral('null', null);
      if (ch === "'") err(i, 'single-quote');
      if (ch === '/' && (text[i + 1] === '/' || text[i + 1] === '*')) err(i, 'comment');
      err(i, 'unexpected-char');
      return null;
    }

    function parseObject(path, depth) {
      i++;
      var obj = {};
      var seen = {};
      skipWs();
      if (text[i] === '}') { i++; return obj; }
      while (true) {
        skipWs();
        if (i >= len) err(len, 'unexpected-end');
        if (text[i] === "'") err(i, 'single-quote');
        if (text[i] !== '"') err(i, 'unquoted-key');
        var key = parseString();
        var childPath = path + '.' + key;
        if (seen[key]) {
          var dup = null;
          for (var d = 0; d < duplicates.length; d++) {
            if (duplicates[d].path === childPath) { dup = duplicates[d]; break; }
          }
          if (dup) dup.count++;
          else duplicates.push({ path: childPath, key: key, count: 2 });
        } else seen[key] = true;
        skipWs();
        if (i >= len) err(len, 'unexpected-end');
        if (text[i] !== ':') err(i, 'missing-colon');
        i++;
        obj[key] = parseValue(childPath, depth + 1);
        skipWs();
        if (i >= len) err(len, 'unexpected-end');
        if (text[i] === ',') {
          i++;
          skipWs();
          if (text[i] === '}') err(i, 'trailing-comma');
          continue;
        }
        if (text[i] === '}') { i++; return obj; }
        err(i, 'missing-comma');
      }
      return obj;
    }

    function parseArray(path, depth) {
      i++;
      var arr = [];
      skipWs();
      if (text[i] === ']') { i++; return arr; }
      var idx = 0;
      while (true) {
        arr.push(parseValue(path + '[' + idx + ']', depth + 1));
        idx++;
        skipWs();
        if (i >= len) err(len, 'unexpected-end');
        if (text[i] === ',') {
          i++;
          skipWs();
          if (text[i] === ']') err(i, 'trailing-comma');
          continue;
        }
        if (text[i] === ']') { i++; return arr; }
        err(i, 'missing-comma');
      }
      return arr;
    }

    try {
      skipWs();
      if (i >= len) return { ok: false, empty: true };
      var value = parseValue('$', 0);
      skipWs();
      if (i < len) err(i, 'trailing-content');
      return { ok: true, value: value, duplicates: duplicates, bigInts: bigInts };
    } catch (e) {
      var pos = (typeof e.pos === 'number') ? e.pos : len;
      var lc = lineCol(text, pos);
      var sn = snippet(text, pos);
      return {
        ok: false,
        error: {
          pos: pos,
          line: lc.line,
          col: lc.col,
          code: e.code || 'unexpected-char',
          message: ERR_MSG[e.code] || ERR_MSG['unexpected-char'],
          lineText: sn.line,
          caret: sn.caret
        }
      };
    }
  }

  function stringifyJson(value, indent, sortKeys) {
    var gap = indent === 0 ? '' : (indent === '\t' ? '\t' : ' '.repeat(indent));
    function write(v, level) {
      if (v === null) return 'null';
      if (typeof v === 'number') return JSON.stringify(v);
      if (typeof v === 'boolean') return v ? 'true' : 'false';
      if (typeof v === 'string') return JSON.stringify(v);
      if (Array.isArray(v)) {
        if (v.length === 0) return '[]';
        if (gap === '') {
          var parts = [];
          for (var a = 0; a < v.length; a++) parts.push(write(v[a], level + 1));
          return '[' + parts.join(',') + ']';
        }
        var pad = gap.repeat(level + 1);
        var closePad = gap.repeat(level);
        var items = [];
        for (var b = 0; b < v.length; b++) items.push(pad + write(v[b], level + 1));
        return '[\n' + items.join(',\n') + '\n' + closePad + ']';
      }
      var keys = Object.keys(v);
      if (sortKeys) keys.sort();
      if (keys.length === 0) return '{}';
      if (gap === '') {
        var p2 = [];
        for (var c = 0; c < keys.length; c++) p2.push(JSON.stringify(keys[c]) + ':' + write(v[keys[c]], level + 1));
        return '{' + p2.join(',') + '}';
      }
      var pad2 = gap.repeat(level + 1);
      var closePad2 = gap.repeat(level);
      var lines = [];
      for (var d = 0; d < keys.length; d++) lines.push(pad2 + JSON.stringify(keys[d]) + ': ' + write(v[keys[d]], level + 1));
      return '{\n' + lines.join(',\n') + '\n' + closePad2 + '}';
    }
    return write(value, 0);
  }

  function formatBytes(n) {
    if (n < 1024) return n + ' byte';
    if (n < 1048576) return (n / 1024).toFixed(n % 1024 === 0 ? 0 : 1).replace('.', ',') + ' KB';
    return (n / 1048576).toFixed(2).replace('.', ',') + ' MB';
  }

  function makeStats(value, inText, outText) {
    var inB = byteLen(inText);
    var outB = byteLen(outText);
    var pct = inB === 0 ? 0 : Math.round((inB - outB) / inB * 100);
    return {
      inBytes: inB,
      outBytes: outB,
      inBytesText: formatBytes(inB),
      outBytesText: formatBytes(outB),
      lines: inText.split('\n').length,
      keys: countKeys(value),
      depth: depthOf(value),
      pct: pct
    };
  }

  function detectMode(url) {
    var u = decodeURIComponent(url || '').toLowerCase();
    if (u.indexOf('minify') !== -1 || u.indexOf('nen-json') !== -1 || u.indexOf('compress') !== -1) return 'minify';
    return 'prettify';
  }

  var api = {
    MAX_CHARS: MAX_CHARS,
    parseJson: parseJson,
    stringifyJson: stringifyJson,
    lineCol: lineCol,
    snippet: snippet,
    byteLen: byteLen,
    countKeys: countKeys,
    depthOf: depthOf,
    makeStats: makeStats,
    formatBytes: formatBytes,
    detectMode: detectMode
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.jf2Pure = api;
  return api;
})(typeof window !== 'undefined' ? window : globalThis);
/* PURE LOGIC END */

document.addEventListener('DOMContentLoaded', function () {
  var P = window.jf2Pure;

  var btnPrettify = document.getElementById('jf2-btn-prettify');
  var btnMinify = document.getElementById('jf2-btn-minify');
  var btnClear = document.getElementById('jf2-btn-clear');
  var btnCopy = document.getElementById('jf2-btn-copy');
  var btnDownload = document.getElementById('jf2-btn-download');
  var btnUpload = document.getElementById('jf2-btn-upload');
  var fileInput = document.getElementById('jf2-file');
  var indentWrap = document.getElementById('jf2-indent-wrap');
  var indentSel = document.getElementById('jf2-indent');
  var sortChk = document.getElementById('jf2-sort');
  var inputEl = document.getElementById('jf2-input');
  var outputEl = document.getElementById('jf2-output');
  var badge = document.getElementById('jf2-badge');
  var statsIn = document.getElementById('jf2-stats-in');
  var statsOut = document.getElementById('jf2-stats-out');
  var errorBox = document.getElementById('jf2-error-box');
  var errorMsg = document.getElementById('jf2-error-msg');
  var errorSnippet = document.getElementById('jf2-error-snippet');
  var warnBox = document.getElementById('jf2-warn-box');
  var warnList = document.getElementById('jf2-warn-list');
  var toast = document.getElementById('jf2-toast');
  var chipObj = document.getElementById('jf2-chip-obj');
  var chipApi = document.getElementById('jf2-chip-api');

  var currentMode = P.detectMode(window.location.href);
  var clearArmed = false;
  var clearTimer = null;
  var toastTimer = null;

  var SAMPLE_OBJ = '{\n  "ten": "Mẫu A",\n  "so_luong": 2,\n  "nhan": [\n    "mới",\n    "thử"\n  ]\n}';
  var SAMPLE_API = '{\n  "ten": "An",\n  "tuoi": 30,\n  "dia_chi": {\n    "thanh_pho": "Hà Nội",\n    "quan": "Cầu Giấy"\n  },\n  "don_hang": [\n    {\n      "ma": "DH001",\n      "tong": 1250000\n    },\n    {\n      "ma": "DH002",\n      "tong": 890000\n    }\n  ]\n}';

  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 2500);
  }

  function setBadge(text, kind) {
    badge.textContent = text;
    badge.className = 'jf2-badge' + (kind ? ' ' + kind : '');
  }

  function indentValue() {
    var v = indentSel.value;
    if (v === 'tab') return '\t';
    return parseInt(v, 10);
  }

  function process() {
    var raw = inputEl.value;
    var trimmed = raw.trim();
    errorBox.hidden = true;
    warnBox.hidden = true;
    if (!trimmed) {
      outputEl.value = '';
      setBadge('Chờ nhập liệu', '');
      statsIn.textContent = '0 ký tự · 0 byte';
      statsOut.textContent = '';
      btnCopy.disabled = true;
      btnDownload.disabled = true;
      return;
    }
    var res = P.parseJson(trimmed);
    if (!res.ok) {
      outputEl.value = '';
      setBadge('Lỗi cú pháp', 'error');
      errorMsg.textContent = 'Dòng ' + res.error.line + ', cột ' + res.error.col + ': ' + res.error.message;
      errorSnippet.textContent = res.error.lineText + '\n' + ' '.repeat(res.error.caret) + '^';
      errorBox.hidden = false;
      statsIn.textContent = raw.length.toLocaleString('vi-VN') + ' ký tự · ' + P.formatBytes(P.byteLen(raw));
      statsOut.textContent = '';
      btnCopy.disabled = true;
      btnDownload.disabled = true;
      return;
    }
    var indent = currentMode === 'prettify' ? indentValue() : 0;
    var out = P.stringifyJson(res.value, indent, sortChk.checked);
    outputEl.value = out;
    setBadge('JSON hợp lệ', 'active');
    var st = P.makeStats(res.value, raw, out);
    statsIn.textContent = raw.length.toLocaleString('vi-VN') + ' ký tự · ' + st.inBytesText + ' · ' + st.lines + ' dòng';
    var change = st.pct >= 0 ? 'Giảm ' + st.pct + '%' : 'Tăng ' + Math.abs(st.pct) + '%';
    statsOut.textContent = st.outBytesText + ' · ' + change + ' · ' + st.keys + ' khóa · Sâu ' + st.depth + ' cấp';
    btnCopy.disabled = false;
    btnDownload.disabled = false;
    var warns = [];
    res.duplicates.forEach(function (d) {
      warns.push('Thuộc tính "' + d.key + '" lặp ' + d.count + ' lần tại ' + d.path + ' — chỉ giữ giá trị sau.');
    });
    res.bigInts.forEach(function (b) {
      warns.push('Số nguyên ' + b.raw + ' tại ' + b.path + ' vượt giới hạn chính xác của JavaScript — giá trị có thể đã đổi.');
    });
    if (warns.length) {
      warnList.innerHTML = '';
      warns.forEach(function (w) {
        var li = document.createElement('li');
        li.textContent = w;
        warnList.appendChild(li);
      });
      warnBox.hidden = false;
    }
  }

  function setMode(mode) {
    currentMode = mode;
    btnPrettify.classList.toggle('active', mode === 'prettify');
    btnMinify.classList.toggle('active', mode === 'minify');
    indentWrap.hidden = mode !== 'prettify';
    btnDownload.textContent = mode === 'prettify' ? '⬇ Tải .json' : '⬇ Tải .min.json';
    process();
  }

  inputEl.addEventListener('input', process);
  btnPrettify.addEventListener('click', function () { setMode('prettify'); });
  btnMinify.addEventListener('click', function () { setMode('minify'); });
  indentSel.addEventListener('change', process);
  sortChk.addEventListener('change', process);

  chipObj.addEventListener('click', function () { inputEl.value = SAMPLE_OBJ; process(); inputEl.focus(); });
  chipApi.addEventListener('click', function () { inputEl.value = SAMPLE_API; process(); inputEl.focus(); });

  btnUpload.addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    var f = fileInput.files && fileInput.files[0];
    if (!f) return;
    if (f.size > P.MAX_CHARS) {
      showToast('Tệp vượt quá giới hạn 2.000.000 ký tự.');
      fileInput.value = '';
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      inputEl.value = String(reader.result || '');
      process();
      showToast('Đã tải tệp ' + f.name + '.');
    };
    reader.onerror = function () { showToast('Không đọc được tệp này.'); };
    reader.readAsText(f);
    fileInput.value = '';
  });

  btnDownload.addEventListener('click', function () {
    if (!outputEl.value) return;
    var blob = new Blob([outputEl.value], { type: 'application/json;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = currentMode === 'prettify' ? 'json-da-dinh-dang.json' : 'json-da-nen.min.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    showToast('Đã tải kết quả xuống.');
  });

  btnCopy.addEventListener('click', function () {
    if (!outputEl.value) return;
    function done(ok) {
      if (ok) {
        btnCopy.textContent = 'Đã sao chép';
        setTimeout(function () { btnCopy.textContent = 'Sao chép kết quả'; }, 1500);
      } else {
        showToast('Không sao chép tự động được — hãy chọn văn bản rồi sao chép thủ công.');
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(outputEl.value).then(function () { done(true); }, function () { done(false); });
    } else {
      try {
        outputEl.select();
        done(document.execCommand('copy'));
      } catch (e) { done(false); }
    }
  });

  btnClear.addEventListener('click', function () {
    if (!clearArmed) {
      clearArmed = true;
      btnClear.textContent = 'Chạm lần nữa để xóa';
      clearTimer = setTimeout(function () {
        clearArmed = false;
        btnClear.textContent = 'Xóa trắng';
      }, 4000);
      return;
    }
    if (clearTimer) clearTimeout(clearTimer);
    clearArmed = false;
    btnClear.textContent = 'Xóa trắng';
    inputEl.value = '';
    process();
    inputEl.focus();
  });

  setMode(currentMode);
});

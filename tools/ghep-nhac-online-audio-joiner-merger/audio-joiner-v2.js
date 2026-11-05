/* PURE LOGIC START */
function aj2Fmt(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  var m = Math.floor(sec / 60), s = sec - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1).replace('.', ',');
}
function aj2Parse(str) {
  if (str == null) return null;
  var t = String(str).trim().replace(',', '.');
  if (t === '') return null;
  var parts = t.split(':');
  var v;
  if (parts.length === 1) { v = Number(parts[0]); }
  else if (parts.length === 2) {
    if (parts[0] === '' || parts[1] === '') return null;
    v = Number(parts[0]) * 60 + Number(parts[1]);
  } else if (parts.length === 3) {
    v = Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  } else return null;
  return isFinite(v) && v >= 0 ? v : null;
}
function aj2FmtNum(n, dp) {
  return n.toLocaleString('vi-VN', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
function aj2SegLen(tr) { return Math.max(0, (tr.end == null ? tr.duration : tr.end) - (tr.start || 0)); }
function aj2TotalLen(segs, mode, joinSec) {
  var total = 0, overlaps = 0;
  for (var i = 0; i < segs.length; i++) {
    total += segs[i];
    if (i > 0) {
      if (mode === 'crossfade') overlaps += Math.min(joinSec, segs[i - 1], segs[i]);
      else if (mode === 'gap') total += joinSec;
    }
  }
  return Math.max(0, total - overlaps);
}
function aj2WavBytes(samples, channels) { return 44 + samples * channels * 2; }
function aj2FmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return aj2FmtNum(bytes / 1024, 1) + ' KB';
  return aj2FmtNum(bytes / 1048576, 1) + ' MB';
}
function aj2EncodeWav(channels, sampleRate) {
  var nCh = channels.length, len = nCh ? channels[0].length : 0;
  var buf = new ArrayBuffer(44 + len * nCh * 2), v = new DataView(buf);
  function str(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
  str(0, 'RIFF'); v.setUint32(4, 36 + len * nCh * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, nCh, true); v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * nCh * 2, true); v.setUint16(32, nCh * 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, len * nCh * 2, true);
  var o = 44;
  for (var i = 0; i < len; i++) for (var c = 0; c < nCh; c++) {
    var s = Math.max(-1, Math.min(1, channels[c][i]));
    v.setInt16(o, s < 0 ? s * 32768 : s * 32767, true); o += 2;
  }
  return new Uint8Array(buf);
}
function aj2Join(chSegs, sampleRate, mode, joinSec, fadeEnds) {
  var lens = chSegs.map(function (s) { return s.data[0].length; });
  var total = Math.round(aj2TotalLen(lens.map(function (l) { return l / sampleRate; }), mode, joinSec) * sampleRate);
  var nCh = 0;
  chSegs.forEach(function (s) { nCh = Math.max(nCh, s.data.length); });
  var out = [];
  for (var c = 0; c < nCh; c++) out.push(new Float32Array(total));
  var cursor = 0, fadeN = fadeEnds ? Math.round(0.5 * sampleRate) : 0;
  chSegs.forEach(function (seg, idx) {
    var segLen = seg.data[0].length;
    var ovPrev = 0, ovNext = 0;
    if (mode === 'crossfade' && idx > 0) ovPrev = Math.min(Math.round(joinSec * sampleRate), chSegs[idx - 1].data[0].length, segLen);
    if (mode === 'crossfade' && idx < chSegs.length - 1) ovNext = Math.min(Math.round(joinSec * sampleRate), segLen, chSegs[idx + 1].data[0].length);
    var start = cursor - ovPrev;
    for (var i = 0; i < segLen; i++) {
      var g = 1;
      if (ovPrev && i < ovPrev) g *= Math.sin((Math.PI / 2) * (i / ovPrev));
      if (ovNext && i >= segLen - ovNext) g *= Math.cos((Math.PI / 2) * ((i - (segLen - ovNext)) / ovNext));
      if (fadeEnds && idx === 0 && i < fadeN) g *= i / fadeN;
      if (fadeEnds && idx === chSegs.length - 1 && i >= segLen - fadeN) g *= Math.max(0, (segLen - 1 - i) / fadeN);
      for (var ch = 0; ch < nCh; ch++) {
        var src = seg.data[Math.min(ch, seg.data.length - 1)];
        out[ch][start + i] += src[i] * g;
      }
    }
    cursor = start + segLen;
    if (mode === 'gap' && idx < chSegs.length - 1) cursor += Math.round(joinSec * sampleRate);
  });
  return { data: out, sampleRate: sampleRate, length: total };
}
/* PURE LOGIC END */
document.addEventListener('DOMContentLoaded', function () {
  var box = document.getElementById('aj2-box');
  var input = document.getElementById('aj2-input');
  var listCard = document.getElementById('aj2-list-card');
  var list = document.getElementById('aj2-list');
  var totalEl = document.getElementById('aj2-total');
  var errEl = document.getElementById('aj2-error');
  var addNote = document.getElementById('aj2-add-note');
  var renderBtn = document.getElementById('aj2-render');
  var resultCard = document.getElementById('aj2-result');
  var hero = document.getElementById('aj2-hero');
  var sub = document.getElementById('aj2-sub');
  var playBtn = document.getElementById('aj2-play');
  var dlBtn = document.getElementById('aj2-download');
  var modeBtns = document.querySelectorAll('.aj2-seg-btn');
  var secWrap = document.getElementById('aj2-seconds-wrap');
  var secInput = document.getElementById('aj2-seconds');
  var secVal = document.getElementById('aj2-seconds-val');
  var secCap = document.getElementById('aj2-seconds-caption');
  var fadeEnds = document.getElementById('aj2-fade-ends');
  var tracks = [], mode = 'direct', joinSec = 2, ctx = null, srcNode = null, joined = null, dragId = null;

  function showErr(msg) { errEl.textContent = msg; errEl.hidden = !msg; }
  function getCtx() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); return ctx; }
  function validTracks() { return tracks.filter(function (t) { return t.buffer && !t.error; }); }
  function segLens() { return validTracks().map(aj2SegLen); }
  function refreshTotal() {
    var v = validTracks(), lens = segLens();
    var total = aj2TotalLen(lens, mode, joinSec);
    var sr = ctx ? ctx.sampleRate : 44100, nCh = 1;
    v.forEach(function (t) { nCh = Math.max(nCh, t.buffer.numberOfChannels); });
    totalEl.textContent = 'Tổng: ' + aj2Fmt(total) + ' • ' + v.length + ' đoạn • WAV ≈ ' + aj2FmtSize(aj2WavBytes(Math.round(total * sr), nCh));
    renderBtn.disabled = v.length === 0;
    renderBtn.textContent = v.length === 0 ? '🎵 Ghép & nghe thử' : '🎵 Ghép ' + v.length + ' đoạn & nghe thử';
  }
  function renderList() {
    list.innerHTML = '';
    listCard.hidden = tracks.length === 0;
    tracks.forEach(function (t, idx) {
      var row = document.createElement('div');
      row.className = 'aj2-track'; row.draggable = true; row.dataset.id = t.id;
      var meta = t.error ? '⚠ ' + t.error : (t.buffer ? aj2Fmt(t.duration) + ' • ' + aj2FmtSize(t.file.size) : 'Đang đọc…');
      row.innerHTML = '<span class="aj2-grip" title="Kéo để đổi vị trí">⋮⋮</span>' +
        '<span class="aj2-idx">' + (idx + 1) + '</span>' +
        '<span class="aj2-tinfo"><span class="aj2-tname" title="' + t.name.replace(/"/g, '') + '">' + t.name + '</span>' +
        '<span class="aj2-tmeta">' + meta + '</span></span>' +
        '<span class="aj2-tactions">' +
        '<button type="button" class="aj2-mini" data-act="trim" title="Cắt đoạn này">✂</button>' +
        '<button type="button" class="aj2-mini" data-act="up" ' + (idx === 0 ? 'disabled' : '') + '>↑</button>' +
        '<button type="button" class="aj2-mini" data-act="down" ' + (idx === tracks.length - 1 ? 'disabled' : '') + '>↓</button>' +
        '<button type="button" class="aj2-mini aj2-del" data-act="del">✕</button></span>';
      var trim = document.createElement('div');
      trim.className = 'aj2-trim'; trim.hidden = !t.trimOpen;
      trim.innerHTML = '<label>Bắt đầu <input type="text" class="aj2-time" data-f="start" value="' + aj2Fmt(t.start || 0) + '" inputmode="decimal"></label>' +
        '<label>Kết thúc <input type="text" class="aj2-time" data-f="end" value="' + (t.end == null ? aj2Fmt(t.duration || 0) : aj2Fmt(t.end)) + '" inputmode="decimal"></label>' +
        '<span class="aj2-trim-note">Nhập dạng phút:giây, ví dụ 0:45 hoặc 1:30,5.</span>';
      row.appendChild(trim);
      row.querySelectorAll('.aj2-mini').forEach(function (b) {
        b.addEventListener('click', function () {
          var act = b.dataset.act;
          if (act === 'up' && idx > 0) { var tmp = tracks[idx]; tracks[idx] = tracks[idx - 1]; tracks[idx - 1] = tmp; }
          else if (act === 'down' && idx < tracks.length - 1) { var tmp2 = tracks[idx]; tracks[idx] = tracks[idx + 1]; tracks[idx + 1] = tmp2; }
          else if (act === 'del') tracks.splice(idx, 1);
          else if (act === 'trim') t.trimOpen = !t.trimOpen;
          stopPlay(); resultCard.hidden = true; renderList(); refreshTotal();
        });
      });
      trim.querySelectorAll('.aj2-time').forEach(function (inp) {
        inp.addEventListener('change', function () {
          var v = aj2Parse(inp.value);
          if (v == null || (t.duration && v > t.duration)) { inp.classList.add('is-bad'); showErr('Thời gian cắt không hợp lệ: ' + inp.value); return; }
          inp.classList.remove('is-bad'); showErr('');
          if (inp.dataset.f === 'start') t.start = v; else t.end = v;
          if (t.start >= (t.end == null ? t.duration : t.end)) { showErr('Bắt đầu phải nhỏ hơn kết thúc.'); return; }
          resultCard.hidden = true; refreshTotal();
        });
      });
      row.addEventListener('dragstart', function (e) { dragId = t.id; e.dataTransfer.effectAllowed = 'move'; });
      row.addEventListener('dragover', function (e) { e.preventDefault(); row.classList.add('drag-over'); });
      row.addEventListener('dragleave', function () { row.classList.remove('drag-over'); });
      row.addEventListener('drop', function (e) {
        e.preventDefault(); row.classList.remove('drag-over');
        var from = tracks.findIndex(function (x) { return x.id === dragId; });
        if (from < 0 || from === idx) return;
        var mv = tracks.splice(from, 1)[0]; tracks.splice(idx, 0, mv);
        resultCard.hidden = true; renderList(); refreshTotal();
      });
      list.appendChild(row);
    });
    refreshTotal();
  }
  function addFiles(fileList) {
    var skipped = [];
    Array.from(fileList).forEach(function (f) {
      if (!(f.type.indexOf('audio/') === 0 || f.type.indexOf('video/') === 0)) { skipped.push(f.name); return; }
      var t = { id: Date.now() + '-' + Math.random(), file: f, name: f.name, buffer: null, duration: 0, start: 0, end: null, error: '', trimOpen: false };
      tracks.push(t);
      var c;
      try { c = getCtx(); } catch (e) { t.error = 'Trình duyệt không hỗ trợ giải mã âm thanh.'; renderList(); return; }
      f.arrayBuffer().then(function (ab) { return c.decodeAudioData(ab); }).then(function (buf) {
        t.buffer = buf; t.duration = buf.duration; renderList();
      }).catch(function () { t.error = 'Không đọc được tệp này.'; renderList(); });
    });
    addNote.hidden = skipped.length === 0;
    addNote.textContent = skipped.length ? 'Đã bỏ qua ' + skipped.length + ' tệp không phải âm thanh.' : '';
    renderList();
  }
  box.addEventListener('click', function () { input.click(); });
  box.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  box.addEventListener('dragover', function (e) { e.preventDefault(); box.classList.add('dragover'); });
  box.addEventListener('dragleave', function () { box.classList.remove('dragover'); });
  box.addEventListener('drop', function (e) { e.preventDefault(); box.classList.remove('dragover'); if (e.dataTransfer.files) addFiles(e.dataTransfer.files); });
  input.addEventListener('change', function () { if (input.files) addFiles(input.files); input.value = ''; });
  document.getElementById('aj2-clear').addEventListener('click', function () { tracks = []; stopPlay(); resultCard.hidden = true; renderList(); });
  modeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      modeBtns.forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active'); mode = b.dataset.aj2Mode;
      secWrap.hidden = mode === 'direct'; resultCard.hidden = true; refreshTotal();
    });
  });
  function syncSec() {
    joinSec = parseFloat(secInput.value);
    var label = aj2FmtNum(joinSec, 1) + ' giây';
    secVal.textContent = label;
    secCap.textContent = (mode === 'crossfade' ? 'Mỗi chỗ nối chồng ' : 'Mỗi chỗ nối nghỉ ') + label + '.';
    resultCard.hidden = true; refreshTotal();
  }
  secInput.addEventListener('input', syncSec);
  fadeEnds.addEventListener('change', function () { resultCard.hidden = true; });
  function stopPlay() {
    if (srcNode) { try { srcNode.stop(); } catch (e) {} srcNode = null; }
    playBtn.textContent = '▶ Nghe';
  }
  playBtn.addEventListener('click', function () {
    if (srcNode) { stopPlay(); return; }
    var c = getCtx(); if (c.state === 'suspended') c.resume();
    srcNode = c.createBufferSource(); srcNode.buffer = joined;
    srcNode.connect(c.destination); srcNode.start();
    playBtn.textContent = '⏸ Dừng';
    srcNode.onended = function () { srcNode = null; playBtn.textContent = '▶ Nghe'; };
  });
  renderBtn.addEventListener('click', function () {
    var v = validTracks(); if (!v.length) return;
    showErr(''); stopPlay();
    var c = getCtx(), sr = c.sampleRate;
    var segs = v.map(function (t) {
      var s0 = Math.round((t.start || 0) * sr), s1 = Math.round(((t.end == null ? t.duration : t.end)) * sr);
      var chans = [];
      for (var ch = 0; ch < t.buffer.numberOfChannels; ch++) chans.push(t.buffer.getChannelData(ch).slice(s0, s1));
      return { data: chans };
    });
    var r = aj2Join(segs, sr, mode, joinSec, fadeEnds.checked);
    joined = c.createBuffer(Math.max(1, r.data.length), r.length, sr);
    r.data.forEach(function (d, ch) { joined.getChannelData(ch).set(d); });
    var bytes = aj2WavBytes(r.length, r.data.length);
    hero.textContent = aj2Fmt(r.length / sr);
    sub.textContent = v.length + ' đoạn • WAV 16-bit • ' + sr + ' Hz • ' + r.data.length + ' kênh • ≈ ' + aj2FmtSize(bytes);
    resultCard.hidden = false;
  });
  dlBtn.addEventListener('click', function () {
    if (!joined) return;
    var chans = [];
    for (var ch = 0; ch < joined.numberOfChannels; ch++) chans.push(joined.getChannelData(ch));
    var wav = aj2EncodeWav(chans, joined.sampleRate);
    var blob = new Blob([wav], { type: 'audio/wav' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'ghep-nhac-congcuviet.wav'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  renderList();
});
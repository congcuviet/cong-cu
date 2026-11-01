document.addEventListener('DOMContentLoaded', function () {
  var $ = function (id) { return document.getElementById(id); };

  /* ===== PURE LOGIC START ===== */
  // Parses "1-3, 5, 7-9" into [{from,to}, ...] (1-based, inclusive).
  // Returns {ranges} or {error} with a Vietnamese message.
  function spdParseRanges(str, total) {
    if (!str || !str.trim()) return { error: 'Bạn chưa nhập khoảng trang nào.' };
    var parts = str.split(',');
    var ranges = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (!p) continue;
      var m = p.match(/^(\d+)\s*(?:-\s*(\d+))?$/);
      if (!m) return { error: 'Khoảng "' + p + '" không đúng định dạng. Hãy nhập kiểu: 1-3, 5, 7-9.' };
      var a = parseInt(m[1], 10);
      var b = m[2] ? parseInt(m[2], 10) : a;
      if (a < 1 || b < a) return { error: 'Khoảng "' + p + '" không hợp lệ (trang bắt đầu từ 1, số đầu phải nhỏ hơn hoặc bằng số cuối).' };
      if (b > total) return { error: 'Khoảng "' + p + '" vượt quá số trang của file (file có ' + total + ' trang).' };
      ranges.push({ from: a, to: b });
    }
    if (!ranges.length) return { error: 'Bạn chưa nhập khoảng trang nào.' };
    return { ranges: ranges };
  }
  // Splits one PDF buffer into one output per range.
  async function spdSplitBuffer(buffer, ranges, PDFLib) {
    var src = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
    var outs = [];
    for (var r = 0; r < ranges.length; r++) {
      var doc = await PDFLib.PDFDocument.create();
      var idx = [];
      for (var p = ranges[r].from - 1; p <= ranges[r].to - 1; p++) idx.push(p);
      var copied = await doc.copyPages(src, idx);
      copied.forEach(function (pg) { doc.addPage(pg); });
      outs.push({ from: ranges[r].from, to: ranges[r].to, pages: idx.length, bytes: await doc.save() });
    }
    return outs;
  }
  /* ===== PURE LOGIC END ===== */

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' KB';
    return (b / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' MB';
  }
  function baseName(name) { return name.replace(/\.pdf$/i, ''); }

  var state = { name: '', buffer: null, pages: 0, size: 0 };
  var urls = [];

  if (typeof window.PDFLib === 'undefined') { $('spd-lib-error').style.display = ''; return; }

  async function setFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      $('spd-fileinfo').textContent = '⚠️ "' + file.name + '" không phải file PDF.';
      return;
    }
    try {
      var buf = await file.arrayBuffer();
      var doc = await window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
      state = { name: file.name, buffer: buf, pages: doc.getPageCount(), size: file.size };
      $('spd-fileinfo').textContent = '📄 ' + file.name + ' · ' + fmtSize(file.size) + ' · ' + state.pages + ' trang';
      $('spd-options').style.display = '';
      $('spd-error').textContent = '';
      $('spd-inp-ranges').value = state.pages > 1 ? '1-' + Math.ceil(state.pages / 2) : '1';
    } catch (e) {
      $('spd-fileinfo').textContent = '⚠️ Không đọc được "' + file.name + '" (file hỏng hoặc có mật khẩu mở).';
      $('spd-options').style.display = 'none';
    }
  }

  $('spd-file').addEventListener('change', function () { setFile(this.files[0]); this.value = ''; });
  var drop = $('spd-drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('spd-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('spd-over'); }); });
  drop.addEventListener('drop', function (e) { setFile(e.dataTransfer.files[0]); });
  $('spd-mode-ranges').addEventListener('change', syncMode);
  $('spd-mode-each').addEventListener('change', syncMode);
  function syncMode() { $('spd-ranges-wrap').style.display = $('spd-mode-each').checked ? 'none' : ''; }

  $('spd-btn-split').addEventListener('click', async function () {
    if (!state.buffer) return;
    var ranges;
    if ($('spd-mode-each').checked) {
      ranges = [];
      for (var i = 1; i <= state.pages; i++) ranges.push({ from: i, to: i });
    } else {
      var parsed = spdParseRanges($('spd-inp-ranges').value, state.pages);
      if (parsed.error) { $('spd-error').textContent = '❌ ' + parsed.error; return; }
      ranges = parsed.ranges;
    }
    $('spd-error').textContent = '';
    var btn = $('spd-btn-split');
    btn.disabled = true;
    $('spd-status').textContent = '⏳ Đang tách thành ' + ranges.length + ' file…';
    try {
      var outs = await spdSplitBuffer(state.buffer, ranges, window.PDFLib);
      urls.forEach(function (u) { URL.revokeObjectURL(u); });
      urls = [];
      var ul = $('spd-outlist');
      ul.innerHTML = '';
      outs.forEach(function (o, i) {
        var url = URL.createObjectURL(new Blob([o.bytes], { type: 'application/pdf' }));
        urls.push(url);
        var fname = baseName(state.name) + '-trang-' + o.from + (o.to !== o.from ? '-den-' + o.to : '') + '.pdf';
        var li = document.createElement('li');
        li.innerHTML = '<span class="spd-out-name"></span><span class="spd-out-meta"></span>';
        li.querySelector('.spd-out-name').textContent = '📄 ' + fname;
        li.querySelector('.spd-out-meta').textContent = o.pages + ' trang · ' + fmtSize(o.bytes.length);
        var a = document.createElement('a');
        a.className = 'spd-btn spd-btn-soft';
        a.href = url;
        a.setAttribute('download', fname);
        a.textContent = '⬇️ Tải về';
        li.appendChild(a);
        ul.appendChild(li);
      });
      $('spd-verdict').textContent = 'Đã tách "' + state.name + '" (' + state.pages + ' trang) thành ' + outs.length + ' file. Bấm “Tải về” ở từng file để lưu.';
      $('spd-result').style.display = '';
      $('spd-status').textContent = '';
    } catch (e) {
      $('spd-status').textContent = '❌ Tách thất bại — file có thể bị hỏng. Hãy thử lại với file khác.';
    }
    btn.disabled = false;
  });
});

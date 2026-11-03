document.addEventListener('DOMContentLoaded', function () {
  var $ = function (id) { return document.getElementById(id); };

  /* ===== PURE LOGIC START ===== */
  function rpdParseRanges(str, total) {
    if (!str || !str.trim()) return { ranges: null }; // null = all pages
    var parts = str.split(',');
    var ranges = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (!p) continue;
      var m = p.match(/^(\d+)\s*(?:-\s*(\d+))?$/);
      if (!m) return { error: 'Khoảng "' + p + '" không đúng định dạng. Hãy nhập kiểu: 1-3, 5.' };
      var a = parseInt(m[1], 10);
      var b = m[2] ? parseInt(m[2], 10) : a;
      if (a < 1 || b < a) return { error: 'Khoảng "' + p + '" không hợp lệ.' };
      if (b > total) return { error: 'Khoảng "' + p + '" vượt quá số trang của file (file có ' + total + ' trang).' };
      ranges.push({ from: a, to: b });
    }
    return { ranges: ranges.length ? ranges : null };
  }
  async function rpdRotateBuffer(buffer, deltaDeg, ranges, PDFLib) {
    var doc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
    var total = doc.getPageCount();
    var targets = {};
    if (!ranges) { for (var i = 0; i < total; i++) targets[i] = true; }
    else ranges.forEach(function (r) { for (var p = r.from - 1; p <= r.to - 1; p++) targets[p] = true; });
    var pages = doc.getPages();
    var count = 0;
    Object.keys(targets).forEach(function (k) {
      var page = pages[Number(k)];
      var cur = page.getRotation().angle || 0;
      page.setRotation(PDFLib.degrees((cur + deltaDeg) % 360));
      count++;
    });
    return { bytes: await doc.save(), rotated: count, total: total };
  }
  /* ===== PURE LOGIC END ===== */

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' KB';
    return (b / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' MB';
  }

  var state = { name: '', buffer: null, pages: 0 };
  var picked = 90;
  var lastUrl = null;

  if (typeof window.PDFLib === 'undefined') { $('rpd-lib-error').style.display = ''; return; }

  async function setFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      $('rpd-fileinfo').textContent = '⚠️ "' + file.name + '" không phải file PDF.';
      return;
    }
    try {
      var buf = await file.arrayBuffer();
      var doc = await window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
      state = { name: file.name, buffer: buf, pages: doc.getPageCount() };
      $('rpd-fileinfo').textContent = '📄 ' + file.name + ' · ' + fmtSize(file.size) + ' · ' + state.pages + ' trang';
      $('rpd-options').style.display = '';
      $('rpd-btn-rotate').disabled = false;
      $('rpd-error').textContent = '';
    } catch (e) {
      $('rpd-fileinfo').textContent = '⚠️ Không đọc được "' + file.name + '" (file hỏng hoặc có mật khẩu mở).';
      $('rpd-options').style.display = 'none';
    }
  }

  $('rpd-file').addEventListener('change', function () { setFile(this.files[0]); this.value = ''; });
  var drop = $('rpd-drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('rpd-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('rpd-over'); }); });
  drop.addEventListener('drop', function (e) { setFile(e.dataTransfer.files[0]); });
  document.querySelectorAll('[data-rpd-angle]').forEach(function (b) {
    if (Number(b.getAttribute('data-rpd-angle')) === picked) b.classList.add('rpd-picked');
    b.addEventListener('click', function () {
      picked = Number(b.getAttribute('data-rpd-angle'));
      document.querySelectorAll('[data-rpd-angle]').forEach(function (x) { x.classList.remove('rpd-picked'); });
      b.classList.add('rpd-picked');
    });
  });

  $('rpd-btn-rotate').addEventListener('click', async function () {
    if (!state.buffer) return;
    var parsed = rpdParseRanges($('rpd-inp-pages').value, state.pages);
    if (parsed.error) { $('rpd-error').textContent = '❌ ' + parsed.error; return; }
    $('rpd-error').textContent = '';
    var btn = $('rpd-btn-rotate');
    btn.disabled = true;
    $('rpd-status').textContent = '⏳ Đang xoay…';
    try {
      var res = await rpdRotateBuffer(state.buffer, picked, parsed.ranges, window.PDFLib);
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(new Blob([res.bytes], { type: 'application/pdf' }));
      $('rpd-download').href = lastUrl;
      $('rpd-verdict').textContent = 'Đã xoay ' + res.rotated + '/' + res.total + ' trang của "' + state.name + '" thêm ' + picked + '°. Tải file mới ở nút bên dưới.';
      $('rpd-result').style.display = '';
      $('rpd-status').textContent = '';
    } catch (e) {
      $('rpd-status').textContent = '❌ Xoay thất bại — file có thể bị hỏng.';
    }
    btn.disabled = false;
  });
});

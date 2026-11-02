document.addEventListener('DOMContentLoaded', function () {
  var $ = function (id) { return document.getElementById(id); };

  /* ===== PURE LOGIC START ===== */
  function epdValidateRange(from, to, total) {
    if (!Number.isFinite(from) || !Number.isFinite(to)) return { error: 'Hãy nhập số trang hợp lệ.' };
    if (from < 1 || to < from) return { error: 'Khoảng trang không hợp lệ: trang bắt đầu từ 1 và “Đến trang” phải lớn hơn hoặc bằng “Từ trang”.' };
    if (to > total) return { error: '“Đến trang” vượt quá số trang của file (file có ' + total + ' trang).' };
    return { from: from, to: to, count: to - from + 1 };
  }
  async function epdExtractBuffer(buffer, from, to, PDFLib) {
    var src = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
    var doc = await PDFLib.PDFDocument.create();
    var idx = [];
    for (var p = from - 1; p <= to - 1; p++) idx.push(p);
    var copied = await doc.copyPages(src, idx);
    copied.forEach(function (pg) { doc.addPage(pg); });
    return { bytes: await doc.save(), pages: idx.length };
  }
  /* ===== PURE LOGIC END ===== */

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' KB';
    return (b / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' MB';
  }
  function baseName(name) { return name.replace(/\.pdf$/i, ''); }

  var state = { name: '', buffer: null, pages: 0 };
  var lastUrl = null;

  if (typeof window.PDFLib === 'undefined') { $('epd-lib-error').style.display = ''; return; }

  function preview() {
    if (!state.pages) { $('epd-preview').textContent = ''; return; }
    var v = epdValidateRange(parseInt($('epd-inp-from').value, 10), parseInt($('epd-inp-to').value, 10), state.pages);
    $('epd-preview').textContent = v.error ? '' : 'Sẽ trích ' + v.count + ' trang (từ trang ' + v.from + ' đến trang ' + v.to + ') trong tổng ' + state.pages + ' trang.';
    $('epd-error').textContent = v.error ? '❌ ' + v.error : '';
  }

  async function setFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      $('epd-fileinfo').textContent = '⚠️ "' + file.name + '" không phải file PDF.';
      return;
    }
    try {
      var buf = await file.arrayBuffer();
      var doc = await window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
      state = { name: file.name, buffer: buf, pages: doc.getPageCount() };
      $('epd-fileinfo').textContent = '📄 ' + file.name + ' · ' + fmtSize(file.size) + ' · ' + state.pages + ' trang';
      $('epd-inp-from').value = 1;
      $('epd-inp-to').value = state.pages;
      $('epd-inp-from').max = state.pages;
      $('epd-inp-to').max = state.pages;
      $('epd-options').style.display = '';
      preview();
    } catch (e) {
      $('epd-fileinfo').textContent = '⚠️ Không đọc được "' + file.name + '" (file hỏng hoặc có mật khẩu mở).';
      $('epd-options').style.display = 'none';
    }
  }

  $('epd-file').addEventListener('change', function () { setFile(this.files[0]); this.value = ''; });
  var drop = $('epd-drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('epd-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('epd-over'); }); });
  drop.addEventListener('drop', function (e) { setFile(e.dataTransfer.files[0]); });
  ['epd-inp-from', 'epd-inp-to'].forEach(function (id) { $(id).addEventListener('input', preview); });
  document.querySelectorAll('[data-epd-preset]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      if (!state.pages) return;
      var n = state.pages, kind = chip.getAttribute('data-epd-preset');
      var from = 1, to = n;
      if (kind === 'first') { from = 1; to = 1; }
      else if (kind === 'last') { from = n; to = n; }
      else if (kind === 'firsthalf') { from = 1; to = Math.ceil(n / 2); }
      else if (kind === 'secondhalf') { from = Math.floor(n / 2) + 1; to = n; }
      $('epd-inp-from').value = from;
      $('epd-inp-to').value = to;
      preview();
    });
  });

  $('epd-btn-extract').addEventListener('click', async function () {
    if (!state.buffer) return;
    var v = epdValidateRange(parseInt($('epd-inp-from').value, 10), parseInt($('epd-inp-to').value, 10), state.pages);
    if (v.error) { $('epd-error').textContent = '❌ ' + v.error; return; }
    $('epd-error').textContent = '';
    var btn = $('epd-btn-extract');
    btn.disabled = true;
    $('epd-status').textContent = '⏳ Đang trích xuất…';
    try {
      var res = await epdExtractBuffer(state.buffer, v.from, v.to, window.PDFLib);
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(new Blob([res.bytes], { type: 'application/pdf' }));
      var a = $('epd-download');
      a.href = lastUrl;
      a.setAttribute('download', baseName(state.name) + '-trang-' + v.from + '-den-' + v.to + '.pdf');
      $('epd-verdict').textContent = 'Đã trích xuất trang ' + v.from + '–' + v.to + ' (' + res.pages + ' trang, ' + fmtSize(res.bytes.length) + ') từ "' + state.name + '".';
      $('epd-result').style.display = '';
      $('epd-status').textContent = '';
    } catch (e) {
      $('epd-status').textContent = '❌ Trích xuất thất bại — file có thể bị hỏng.';
    }
    btn.disabled = false;
  });
});

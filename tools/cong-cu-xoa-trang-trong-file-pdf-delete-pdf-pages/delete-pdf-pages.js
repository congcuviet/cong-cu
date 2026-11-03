document.addEventListener('DOMContentLoaded', function () {
  var $ = function (id) { return document.getElementById(id); };

  /* ===== PURE LOGIC START ===== */
  function dpdParseRanges(str, total) {
    if (!str || !str.trim()) return { error: 'Bạn chưa nhập trang nào cần xóa.' };
    var parts = str.split(',');
    var ranges = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (!p) continue;
      var m = p.match(/^(\d+)\s*(?:-\s*(\d+))?$/);
      if (!m) return { error: 'Khoảng "' + p + '" không đúng định dạng. Hãy nhập kiểu: 2, 4-5, 9.' };
      var a = parseInt(m[1], 10);
      var b = m[2] ? parseInt(m[2], 10) : a;
      if (a < 1 || b < a) return { error: 'Khoảng "' + p + '" không hợp lệ.' };
      if (b > total) return { error: 'Khoảng "' + p + '" vượt quá số trang của file (file có ' + total + ' trang).' };
      ranges.push({ from: a, to: b });
    }
    if (!ranges.length) return { error: 'Bạn chưa nhập trang nào cần xóa.' };
    return { ranges: ranges };
  }
  function dpdKeptIndices(total, deleteRanges) {
    var del = {};
    deleteRanges.forEach(function (r) { for (var p = r.from - 1; p <= r.to - 1; p++) del[p] = true; });
    var kept = [];
    for (var i = 0; i < total; i++) if (!del[i]) kept.push(i);
    return { kept: kept, deleted: total - kept.length };
  }
  async function dpdDeleteBuffer(buffer, deleteRanges, PDFLib) {
    var src = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
    var total = src.getPageCount();
    var plan = dpdKeptIndices(total, deleteRanges);
    if (!plan.kept.length) return { error: 'Không thể xóa toàn bộ trang — file PDF phải còn ít nhất 1 trang.' };
    var doc = await PDFLib.PDFDocument.create();
    var copied = await doc.copyPages(src, plan.kept);
    copied.forEach(function (pg) { doc.addPage(pg); });
    return { bytes: await doc.save(), kept: plan.kept.length, deleted: plan.deleted, total: total };
  }
  /* ===== PURE LOGIC END ===== */

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' KB';
    return (b / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' MB';
  }

  var state = { name: '', buffer: null, pages: 0 };
  var lastUrl = null;

  if (typeof window.PDFLib === 'undefined') { $('dpd-lib-error').style.display = ''; return; }

  async function setFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      $('dpd-fileinfo').textContent = '⚠️ "' + file.name + '" không phải file PDF.';
      return;
    }
    try {
      var buf = await file.arrayBuffer();
      var doc = await window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
      state = { name: file.name, buffer: buf, pages: doc.getPageCount() };
      $('dpd-fileinfo').textContent = '📄 ' + file.name + ' · ' + fmtSize(file.size) + ' · ' + state.pages + ' trang';
      $('dpd-options').style.display = '';
      $('dpd-error').textContent = '';
    } catch (e) {
      $('dpd-fileinfo').textContent = '⚠️ Không đọc được "' + file.name + '" (file hỏng hoặc có mật khẩu mở).';
      $('dpd-options').style.display = 'none';
    }
  }

  $('dpd-file').addEventListener('change', function () { setFile(this.files[0]); this.value = ''; });
  var drop = $('dpd-drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('dpd-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('dpd-over'); }); });
  drop.addEventListener('drop', function (e) { setFile(e.dataTransfer.files[0]); });

  $('dpd-btn-delete').addEventListener('click', async function () {
    if (!state.buffer) return;
    var parsed = dpdParseRanges($('dpd-inp-pages').value, state.pages);
    if (parsed.error) { $('dpd-error').textContent = '❌ ' + parsed.error; return; }
    var plan = dpdKeptIndices(state.pages, parsed.ranges);
    if (!plan.kept.length) { $('dpd-error').textContent = '❌ Không thể xóa toàn bộ trang — file PDF phải còn ít nhất 1 trang.'; return; }
    $('dpd-error').textContent = '';
    var btn = $('dpd-btn-delete');
    btn.disabled = true;
    $('dpd-status').textContent = '⏳ Đang tạo file mới…';
    try {
      var res = await dpdDeleteBuffer(state.buffer, parsed.ranges, window.PDFLib);
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(new Blob([res.bytes], { type: 'application/pdf' }));
      $('dpd-download').href = lastUrl;
      $('dpd-out-deleted').textContent = res.deleted;
      $('dpd-out-kept').textContent = res.kept;
      $('dpd-out-size').textContent = fmtSize(res.bytes.length);
      $('dpd-verdict').textContent = 'Đã xóa ' + res.deleted + ' trang khỏi "' + state.name + '". File mới còn ' + res.kept + '/' + res.total + ' trang (' + fmtSize(res.bytes.length) + ').';
      $('dpd-result').style.display = '';
      $('dpd-status').textContent = '';
    } catch (e) {
      $('dpd-status').textContent = '❌ Xử lý thất bại — file có thể bị hỏng.';
    }
    btn.disabled = false;
  });
});

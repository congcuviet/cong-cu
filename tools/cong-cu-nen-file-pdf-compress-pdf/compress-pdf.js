document.addEventListener('DOMContentLoaded', function () {
  var $ = function (id) { return document.getElementById(id); };

  /* ===== PURE LOGIC START ===== */
  function cpdSavedPct(oldSize, newSize) { return oldSize > 0 ? (1 - newSize / oldSize) * 100 : 0; }
  async function cpdStructural(buffer, PDFLib) {
    var doc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
    var bytes = await doc.save({ useObjectStreams: true });
    return { bytes: bytes, pages: doc.getPageCount() };
  }
  /* ===== PURE LOGIC END ===== */

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' KB';
    return (b / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' MB';
  }

  var state = { name: '', buf: null, size: 0, pages: 0 };
  var mode = 'image';
  var lastUrl = null;

  if (typeof window.PDFLib === 'undefined' || typeof window.pdfjsLib === 'undefined') { $('cpd-lib-error').style.display = ''; return; }
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  async function setFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      $('cpd-fileinfo').textContent = '⚠️ "' + file.name + '" không phải file PDF.';
      return;
    }
    try {
      var buf = await file.arrayBuffer();
      var doc = await window.PDFLib.PDFDocument.load(buf.slice(0), { ignoreEncryption: true });
      state = { name: file.name, buf: buf, size: file.size, pages: doc.getPageCount() };
      $('cpd-fileinfo').textContent = '📄 ' + file.name + ' · ' + fmtSize(file.size) + ' · ' + state.pages + ' trang';
      $('cpd-options').style.display = '';
      $('cpd-error').textContent = '';
    } catch (e) {
      $('cpd-fileinfo').textContent = '⚠️ Không đọc được "' + file.name + '" (file hỏng hoặc có mật khẩu mở).';
      $('cpd-options').style.display = 'none';
    }
  }

  $('cpd-file').addEventListener('change', function () { setFile(this.files[0]); this.value = ''; });
  var drop = $('cpd-drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('cpd-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('cpd-over'); }); });
  drop.addEventListener('drop', function (e) { setFile(e.dataTransfer.files[0]); });
  document.querySelectorAll('[data-cpd-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.getAttribute('data-cpd-mode');
      document.querySelectorAll('[data-cpd-mode]').forEach(function (x) { x.classList.remove('cpd-picked'); });
      b.classList.add('cpd-picked');
      $('cpd-quality-row').style.display = mode === 'image' ? '' : 'none';
    });
  });

  async function compressImageMode(statusEl) {
    var parts = $('cpd-sel-quality').value.split('-');
    var dpi = Number(parts[0]), q = Number(parts[1]) / 100;
    // pdf.js detaches the buffer passed as data — hand it a slice copy.
    var doc = await window.pdfjsLib.getDocument({ data: new Uint8Array(state.buf.slice(0)), standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/' }).promise;
    var out = await window.PDFLib.PDFDocument.create();
    for (var n = 1; n <= doc.numPages; n++) {
      statusEl.textContent = '⏳ Đang nén trang ' + n + '/' + doc.numPages + '…';
      var page = await doc.getPage(n);
      var base = page.getViewport({ scale: 1 });
      var viewport = page.getViewport({ scale: dpi / 72 });
      var canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      var cx = canvas.getContext('2d');
      cx.fillStyle = '#ffffff';
      cx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: cx, viewport: viewport }).promise;
      var blob = await new Promise(function (res) { canvas.toBlob(res, 'image/jpeg', q); });
      var imgBytes = await blob.arrayBuffer();
      var img = await out.embedJpg(imgBytes);
      var p = out.addPage([base.width, base.height]);
      p.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
    }
    return await out.save();
  }

  $('cpd-btn-compress').addEventListener('click', async function () {
    if (!state.buf) return;
    var btn = $('cpd-btn-compress');
    btn.disabled = true;
    $('cpd-error').textContent = '';
    try {
      var bytes;
      if (mode === 'structural') {
        $('cpd-status').textContent = '⏳ Đang tối ưu cấu trúc file…';
        var r = await cpdStructural(state.buf.slice(0), window.PDFLib);
        bytes = r.bytes;
      } else {
        bytes = await compressImageMode($('cpd-status'));
      }
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      $('cpd-download').href = lastUrl;
      var pct = cpdSavedPct(state.size, bytes.length);
      $('cpd-out-old').textContent = fmtSize(state.size);
      $('cpd-out-new').textContent = fmtSize(bytes.length);
      $('cpd-bar-new').style.width = Math.max(2, Math.round(bytes.length / state.size * 100)) + '%';
      var verdict = $('cpd-verdict');
      if (bytes.length < state.size) {
        verdict.classList.remove('cpd-warn');
        $('cpd-out-saved').textContent = '🎉 Giảm ' + fmtSize(state.size - bytes.length) + ' (tiết kiệm ' + pct.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '%)';
        verdict.textContent = 'Đã nén "' + state.name + '" từ ' + fmtSize(state.size) + ' xuống còn ' + fmtSize(bytes.length) + ' bằng chế độ ' + (mode === 'image' ? 'nén mạnh qua ảnh' : 'nén nhẹ giữ nguyên chữ') + '.';
      } else {
        verdict.classList.add('cpd-warn');
        $('cpd-out-saved').textContent = 'ℹ️ File sau nén không nhỏ hơn bản gốc.';
        verdict.textContent = 'File "' + state.name + '" vốn đã khá tối ưu — bản nén (' + fmtSize(bytes.length) + ') không nhỏ hơn bản gốc (' + fmtSize(state.size) + '). Bạn vẫn có thể tải về nếu cần, nhưng thường nên giữ bản gốc trong trường hợp này.';
      }
      $('cpd-result').style.display = '';
      $('cpd-status').textContent = '';
    } catch (e) {
      $('cpd-status').textContent = '❌ Nén thất bại — file có thể bị hỏng.' + (e && e.message ? ' Chi tiết lỗi: ' + (e.name || 'Error') + ' — ' + e.message : '');
    }
    btn.disabled = false;
  });
});

document.addEventListener('DOMContentLoaded', function () {
  var $ = function (id) { return document.getElementById(id); };

  /* ===== PURE LOGIC START ===== */
  function apnLabel(format, n, total) {
    if (format === 'so') return '' + n;
    if (format === 'trang-x') return 'Trang ' + n;
    if (format === 'x-tren-y') return n + ' / ' + total;
    if (format === 'x-trong-y') return n + ' trong ' + total;
    return 'Trang ' + n + ' / ' + total;
  }
  function apnPosition(pos, pageW, pageH, textW, fontSize, margin) {
    var x = margin, y = margin;
    if (pos === 'bc' || pos === 'tc') x = (pageW - textW) / 2;
    if (pos === 'br' || pos === 'tr') x = pageW - margin - textW;
    if (pos === 'tc' || pos === 'tl' || pos === 'tr') y = pageH - margin - fontSize;
    return { x: x, y: y };
  }
  async function apnStampBuffer(buffer, opts, PDFLib) {
    var doc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
    var font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    var total = doc.getPageCount();
    var pages = doc.getPages();
    var stamped = 0;
    for (var i = 0; i < total; i++) {
      if (opts.skipFirst && i === 0) continue;
      var n = opts.start + i - (opts.skipFirst ? 1 : 0);
      var label = apnLabel(opts.format, n, total);
      var size = opts.fontSize;
      var tw = font.widthOfTextAtSize(label, size);
      var pos = apnPosition(opts.pos, pages[i].getWidth(), pages[i].getHeight(), tw, size, 24);
      pages[i].drawText(label, { x: pos.x, y: pos.y, size: size, font: font, color: PDFLib.rgb(0.12, 0.16, 0.23) });
      stamped++;
    }
    return { bytes: await doc.save(), stamped: stamped, total: total };
  }
  /* ===== PURE LOGIC END ===== */

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' KB';
    return (b / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' MB';
  }

  var state = { name: '', buffer: null, pages: 0 };
  var lastUrl = null;

  if (typeof window.PDFLib === 'undefined') { $('apn-lib-error').style.display = ''; return; }

  async function setFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      $('apn-fileinfo').textContent = '⚠️ "' + file.name + '" không phải file PDF.';
      return;
    }
    try {
      var buf = await file.arrayBuffer();
      var doc = await window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
      state = { name: file.name, buffer: buf, pages: doc.getPageCount() };
      $('apn-fileinfo').textContent = '📄 ' + file.name + ' · ' + fmtSize(file.size) + ' · ' + state.pages + ' trang';
      $('apn-options').style.display = '';
      $('apn-error').textContent = '';
    } catch (e) {
      $('apn-fileinfo').textContent = '⚠️ Không đọc được "' + file.name + '" (file hỏng hoặc có mật khẩu mở).';
      $('apn-options').style.display = 'none';
    }
  }

  $('apn-file').addEventListener('change', function () { setFile(this.files[0]); this.value = ''; });
  var drop = $('apn-drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('apn-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('apn-over'); }); });
  drop.addEventListener('drop', function (e) { setFile(e.dataTransfer.files[0]); });

  $('apn-btn-stamp').addEventListener('click', async function () {
    if (!state.buffer) return;
    var start = parseInt($('apn-inp-start').value, 10);
    if (!Number.isFinite(start) || start < 0) { $('apn-error').textContent = '❌ Số bắt đầu phải là số từ 0 trở lên.'; return; }
    $('apn-error').textContent = '';
    var btn = $('apn-btn-stamp');
    btn.disabled = true;
    $('apn-status').textContent = '⏳ Đang đánh số trang…';
    try {
      var opts = {
        format: $('apn-sel-format').value,
        pos: $('apn-sel-pos').value,
        start: start,
        fontSize: Number($('apn-sel-size').value),
        skipFirst: $('apn-chk-skip').checked
      };
      var res = await apnStampBuffer(state.buffer, opts, window.PDFLib);
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(new Blob([res.bytes], { type: 'application/pdf' }));
      $('apn-download').href = lastUrl;
      $('apn-verdict').textContent = 'Đã đánh số cho ' + res.stamped + '/' + res.total + ' trang của "' + state.name + '" (' + fmtSize(res.bytes.length) + ').' + (opts.skipFirst ? ' Trang đầu (bìa) được bỏ qua — trang thứ hai mang số ' + opts.start + '.' : '');
      $('apn-result').style.display = '';
      $('apn-status').textContent = '';
    } catch (e) {
      $('apn-status').textContent = '❌ Đánh số thất bại — file có thể bị hỏng.';
    }
    btn.disabled = false;
  });
});

document.addEventListener('DOMContentLoaded', function () {
  var $ = function (id) { return document.getElementById(id); };

  /* ===== PURE LOGIC START ===== */
  // items: [{str, x, y}] in reading order as pdf.js returns them; group into lines by y.
  function p2tItemsToText(items) {
    var lines = [];
    var cur = null;
    items.forEach(function (it) {
      if (!it.str) return;
      if (cur === null || Math.abs(it.y - cur.y) > 2) {
        cur = { y: it.y, parts: [it.str] };
        lines.push(cur);
      } else {
        cur.parts.push(it.str);
      }
    });
    return lines.map(function (l) { return l.parts.join(' '); }).join('\n').replace(/[ \t]+/g, ' ').trim();
  }
  function p2tCountWords(text) {
    var m = text.trim().match(/\S+/g);
    return m ? m.length : 0;
  }
  /* ===== PURE LOGIC END ===== */

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' KB';
    return (b / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' MB';
  }
  function baseName(name) { return name.replace(/\.pdf$/i, ''); }

  var state = { name: '', buf: null, pages: 0 };

  if (typeof window.pdfjsLib === 'undefined') { $('p2t-lib-error').style.display = ''; return; }
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  async function setFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      $('p2t-fileinfo').textContent = '⚠️ "' + file.name + '" không phải file PDF.';
      return;
    }
    try {
      var buf = await file.arrayBuffer();
      // pdf.js detaches the buffer passed as data — always hand it a slice copy.
      var doc = await window.pdfjsLib.getDocument({ data: new Uint8Array(buf.slice(0)), standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/' }).promise;
      state = { name: file.name, buf: buf, pages: doc.numPages };
      $('p2t-fileinfo').textContent = '📄 ' + file.name + ' · ' + fmtSize(file.size) + ' · ' + state.pages + ' trang — đã sẵn sàng trích xuất.';
      $('p2t-btn-extract').disabled = false;
      $('p2t-error').textContent = '';
    } catch (e) {
      $('p2t-fileinfo').textContent = '⚠️ Không đọc được "' + file.name + '" (file hỏng hoặc có mật khẩu mở).' + (e && e.message ? ' Chi tiết lỗi: ' + (e.name || 'Error') + ' — ' + e.message : '');
      $('p2t-btn-extract').disabled = true;
    }
  }

  $('p2t-file').addEventListener('change', function () { setFile(this.files[0]); this.value = ''; });
  var drop = $('p2t-drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('p2t-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('p2t-over'); }); });
  drop.addEventListener('drop', function (e) { setFile(e.dataTransfer.files[0]); });

  $('p2t-btn-extract').addEventListener('click', async function () {
    if (!state.buf) return;
    var btn = $('p2t-btn-extract');
    btn.disabled = true;
    $('p2t-error').textContent = '';
    try {
      var doc = await window.pdfjsLib.getDocument({ data: new Uint8Array(state.buf.slice(0)), standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/' }).promise;
      var sep = $('p2t-chk-sep').checked;
      var chunks = [];
      var contentChunks = [];
      var pagesWithText = 0;
      for (var n = 1; n <= doc.numPages; n++) {
        $('p2t-status').textContent = '⏳ Đang đọc trang ' + n + '/' + doc.numPages + '…';
        var page = await doc.getPage(n);
        var tc = await page.getTextContent();
        var items = tc.items.map(function (it) { return { str: it.str, x: it.transform[4], y: it.transform[5] }; });
        var text = p2tItemsToText(items);
        if (text) pagesWithText++;
        contentChunks.push(text);
        chunks.push((sep ? '— Trang ' + n + ' —\n' : '') + text);
      }
      var full = chunks.join('\n\n').trim();
      var content = contentChunks.join('\n\n').trim(); // stats count the document text only, not the separator lines
      $('p2t-text').value = full;
      $('p2t-out-pages').textContent = pagesWithText + '/' + doc.numPages;
      $('p2t-out-words').textContent = p2tCountWords(content).toLocaleString('vi-VN');
      $('p2t-out-chars').textContent = content.length.toLocaleString('vi-VN');
      $('p2t-scanned-note').style.display = pagesWithText === 0 ? '' : 'none';
      $('p2t-verdict').textContent = pagesWithText === 0
        ? 'File "' + state.name + '" không có lớp chữ nào để trích xuất (có thể là PDF scan dạng ảnh).'
        : 'Đã trích xuất văn bản từ ' + pagesWithText + '/' + doc.numPages + ' trang của "' + state.name + '": ' + p2tCountWords(content).toLocaleString('vi-VN') + ' từ, ' + content.length.toLocaleString('vi-VN') + ' ký tự. Bạn có thể sửa trực tiếp trong ô dưới rồi sao chép hoặc tải về.';
      $('p2t-result').style.display = '';
      $('p2t-status').textContent = '';
    } catch (e) {
      $('p2t-status').textContent = '❌ Trích xuất thất bại — file có thể bị hỏng.' + (e && e.message ? ' Chi tiết lỗi: ' + (e.name || 'Error') + ' — ' + e.message : '');
    }
    btn.disabled = false;
  });

  $('p2t-btn-copy').addEventListener('click', async function () {
    var ta = $('p2t-text');
    ta.select();
    try { await navigator.clipboard.writeText(ta.value); } catch (e) { document.execCommand('copy'); }
    var btn = $('p2t-btn-copy');
    var old = btn.textContent;
    btn.textContent = '✅ ĐÃ SAO CHÉP';
    setTimeout(function () { btn.textContent = old; }, 1600);
  });

  $('p2t-btn-download').addEventListener('click', function () {
    var blob = new Blob(['\ufeff' + $('p2t-text').value], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', baseName(state.name) + '-van-ban.txt');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  });
});

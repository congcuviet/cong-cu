document.addEventListener('DOMContentLoaded', function () {
  var $ = function (id) { return document.getElementById(id); };

  /* ===== PURE LOGIC START ===== */
  function updClassify(pdfjsError, hasPassword) {
    // returns: 'not-encrypted' | 'need-password' | 'wrong-password' | 'unlocked-check-ok'
    if (!pdfjsError) return hasPassword ? 'unlocked-check-ok' : 'not-encrypted';
    if (pdfjsError.name === 'PasswordException') {
      if (pdfjsError.code === 2) return 'wrong-password';
      return 'need-password';
    }
    return 'error';
  }
  /* ===== PURE LOGIC END ===== */

  var QPDF_JS = 'https://cdn.jsdelivr.net/npm/@neslinesli93/qpdf-wasm@0.3.0/+esm';
  var QPDF_WASM = 'https://cdn.jsdelivr.net/npm/@neslinesli93/qpdf-wasm@0.3.0/dist/qpdf.wasm';
  var qpdfPromise = null;
  function loadQpdf() {
    if (!qpdfPromise) {
      qpdfPromise = import(QPDF_JS).then(function (m) {
        var factory = m.default || m;
        return factory({ locateFile: function () { return QPDF_WASM; }, noInitialRun: true });
      });
    }
    return qpdfPromise;
  }

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' KB';
    return (b / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' MB';
  }

  var state = { name: '', buf: null };
  var lastUrl = null;

  if (typeof window.pdfjsLib === 'undefined') { $('upd-lib-error').style.display = ''; return; }
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  async function setFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      $('upd-fileinfo').textContent = '⚠️ "' + file.name + '" không phải file PDF.';
      return;
    }
    try {
      var buf = await file.arrayBuffer();
      state = { name: file.name, buf: buf };
      $('upd-fileinfo').textContent = '📄 ' + file.name + ' · ' + fmtSize(file.size);
      $('upd-options').style.display = '';
      $('upd-error').textContent = '';
      $('upd-result').style.display = 'none';
    } catch (e) {
      $('upd-fileinfo').textContent = '⚠️ Không đọc được file "' + file.name + '".';
    }
  }

  $('upd-file').addEventListener('change', function () { setFile(this.files[0]); this.value = ''; });
  var drop = $('upd-drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('upd-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('upd-over'); }); });
  drop.addEventListener('drop', function (e) { setFile(e.dataTransfer.files[0]); });
  $('upd-show').addEventListener('change', function () { $('upd-pass').type = this.checked ? 'text' : 'password'; });

  $('upd-btn-unlock').addEventListener('click', async function () {
    var err = $('upd-error');
    err.textContent = '';
    if (!state.buf) { err.textContent = 'Hãy chọn file PDF trước.'; return; }
    var password = $('upd-pass').value;
    var btn = $('upd-btn-unlock');
    btn.disabled = true;
    try {
      // Step 1: classify the file with pdf.js (slice copy — pdf.js detaches its input).
      $('upd-status').textContent = '⏳ Đang kiểm tra mật khẩu…';
      var checkError = null;
      try {
        var opts = { data: new Uint8Array(state.buf.slice(0)), standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/' };
        if (password) opts.password = password;
        await window.pdfjsLib.getDocument(opts).promise;
      } catch (e) { checkError = e; }
      var kind = updClassify(checkError, !!password);
      if (kind === 'not-encrypted') {
        // may still carry owner-password restrictions — run a decrypt pass to strip them
        $('upd-status').textContent = '⏳ File không khóa mật khẩu mở — đang kiểm tra & gỡ giới hạn quyền (nếu có)…';
      } else if (kind === 'need-password') {
        err.textContent = 'File này có mật khẩu mở file — hãy nhập đúng mật khẩu hiện tại vào ô phía trên.';
        $('upd-status').textContent = '';
        btn.disabled = false;
        return;
      } else if (kind === 'wrong-password') {
        err.textContent = 'Mật khẩu chưa đúng — file không mở được bằng mật khẩu này. Hãy kiểm tra lại (chú ý Caps Lock và bộ gõ tiếng Việt có thể làm sai ký tự).';
        $('upd-status').textContent = '';
        btn.disabled = false;
        return;
      } else if (kind === 'error') {
        throw checkError;
      }
      // Step 2: decrypt with qpdf.
      $('upd-status').textContent = '⏳ Đang gỡ mật khẩu…';
      var qpdf = await loadQpdf();
      qpdf.FS.writeFile('/in.pdf', new Uint8Array(state.buf.slice(0)));
      var args = password ? ['--password=' + password, '--decrypt', '/in.pdf', '/out.pdf'] : ['--decrypt', '/in.pdf', '/out.pdf'];
      var rc = 0;
      try { rc = qpdf.callMain(args); } catch (e) { rc = (e && typeof e.status === 'number') ? e.status : -1; }
      if (rc !== 0 && rc !== 3) throw new Error('qpdf exit ' + rc);
      var out = qpdf.FS.readFile('/out.pdf');
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
      $('upd-download').href = lastUrl;
      var verdict = $('upd-verdict');
      if (kind === 'not-encrypted') {
        verdict.classList.add('upd-warn');
        verdict.textContent = 'File "' + state.name + '" vốn không có mật khẩu mở file. Bản mới dưới đây đã được gỡ mọi giới hạn quyền (in/sao chép/chỉnh sửa) nếu có — bạn có thể tải về dùng ngay.';
      } else {
        verdict.classList.remove('upd-warn');
        verdict.textContent = 'Đã gỡ mật khẩu khỏi "' + state.name + '". File mới mở không cần mật khẩu và không còn giới hạn quyền.';
      }
      $('upd-result').style.display = '';
      $('upd-status').textContent = '';
    } catch (e) {
      $('upd-status').textContent = '❌ Gỡ mật khẩu thất bại — file có thể bị hỏng.' + (e && e.message ? ' Chi tiết lỗi: ' + (e.name || 'Error') + ' — ' + e.message : '');
    }
    btn.disabled = false;
  });
});

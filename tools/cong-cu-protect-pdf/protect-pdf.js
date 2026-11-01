document.addEventListener('DOMContentLoaded', function () {
  var $ = function (id) { return document.getElementById(id); };

  /* ===== PURE LOGIC START ===== */
  function ppdArgs(userPass, ownerPass, perms) {
    var args = ['--encrypt', userPass, ownerPass || userPass, '256',
      '--print=' + (perms.print ? 'full' : 'none'),
      '--modify=' + (perms.modify ? 'all' : 'none'),
      '--extract=' + (perms.copy ? 'y' : 'n'),
      '--annotate=' + (perms.modify ? 'y' : 'n'),
      '--', '/in.pdf', '/out.pdf'];
    return args;
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

  async function setFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      $('ppd-fileinfo').textContent = '⚠️ "' + file.name + '" không phải file PDF.';
      return;
    }
    try {
      var buf = await file.arrayBuffer();
      state = { name: file.name, buf: buf };
      $('ppd-fileinfo').textContent = '📄 ' + file.name + ' · ' + fmtSize(file.size);
      $('ppd-options').style.display = '';
      $('ppd-error').textContent = '';
    } catch (e) {
      $('ppd-fileinfo').textContent = '⚠️ Không đọc được file "' + file.name + '".';
    }
  }

  $('ppd-file').addEventListener('change', function () { setFile(this.files[0]); this.value = ''; });
  var drop = $('ppd-drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('ppd-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('ppd-over'); }); });
  drop.addEventListener('drop', function (e) { setFile(e.dataTransfer.files[0]); });
  $('ppd-show').addEventListener('change', function () {
    var t = this.checked ? 'text' : 'password';
    $('ppd-pass').type = t; $('ppd-pass2').type = t; $('ppd-owner').type = t;
  });

  $('ppd-btn-protect').addEventListener('click', async function () {
    var err = $('ppd-error');
    err.textContent = '';
    var userPass = $('ppd-pass').value;
    var userPass2 = $('ppd-pass2').value;
    var ownerPass = $('ppd-owner').value;
    if (!state.buf) { err.textContent = 'Hãy chọn file PDF trước.'; return; }
    if (userPass.length < 4) { err.textContent = 'Mật khẩu mở file cần ít nhất 4 ký tự.'; return; }
    if (userPass !== userPass2) { err.textContent = 'Hai ô mật khẩu mở file chưa giống nhau — nhập lại cho khớp.'; return; }
    var btn = $('ppd-btn-protect');
    btn.disabled = true;
    try {
      $('ppd-status').textContent = '⏳ Đang tải bộ mã hóa (chỉ lần đầu) & mã hóa…';
      var qpdf = await loadQpdf();
      qpdf.FS.writeFile('/in.pdf', new Uint8Array(state.buf.slice(0)));
      var perms = { print: $('ppd-perm-print').checked, copy: $('ppd-perm-copy').checked, modify: $('ppd-perm-modify').checked };
      var rc = 0;
      try { rc = qpdf.callMain(ppdArgs(userPass, ownerPass, perms)); } catch (e) { rc = (e && typeof e.status === 'number') ? e.status : -1; }
      if (rc !== 0 && rc !== 3) throw new Error('qpdf exit ' + rc);
      var out = qpdf.FS.readFile('/out.pdf');
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
      $('ppd-download').href = lastUrl;
      $('ppd-verdict').textContent = 'Đã đặt mật khẩu cho "' + state.name + '" bằng mã hóa AES-256. Từ giờ, mở file phải nhập đúng mật khẩu mở file' + (ownerPass && ownerPass !== userPass ? '; mật khẩu chủ sở hữu dùng để gỡ giới hạn quyền khi cần.' : '.');
      $('ppd-result').style.display = '';
      $('ppd-status').textContent = '';
    } catch (e) {
      $('ppd-lib-error').style.display = '';
      $('ppd-status').textContent = '❌ Mã hóa thất bại.' + (e && e.message ? ' Chi tiết lỗi: ' + (e.name || 'Error') + ' — ' + e.message : '');
    }
    btn.disabled = false;
  });
});

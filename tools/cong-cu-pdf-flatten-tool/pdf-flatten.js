document.addEventListener('DOMContentLoaded', function () {
  var $ = function (id) { return document.getElementById(id); };

  /* ===== PURE LOGIC START ===== */
  async function pflFlattenBuffer(buffer, PDFLib) {
    var doc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
    var form = doc.getForm();
    var fields = form.getFields();
    var count = fields.length;
    if (count === 0) return { hasForm: false, fields: 0 };
    // make sure every field has an appearance stream before flattening
    try { form.updateFieldAppearances(); } catch (e) { /* older/odd forms may fail; flatten still attempts */ }
    form.flatten();
    return { hasForm: true, fields: count, bytes: await doc.save() };
  }
  /* ===== PURE LOGIC END ===== */

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' KB';
    return (b / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' MB';
  }

  var lastUrl = null;

  if (typeof window.PDFLib === 'undefined') { $('pfl-lib-error').style.display = ''; return; }

  async function setFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      $('pfl-fileinfo').textContent = '⚠️ "' + file.name + '" không phải file PDF.';
      return;
    }
    $('pfl-result').style.display = 'none';
    $('pfl-fileinfo').textContent = '📄 ' + file.name + ' · ' + fmtSize(file.size);
    $('pfl-status').textContent = '⏳ Đang làm phẳng…';
    try {
      var buf = await file.arrayBuffer();
      var res = await pflFlattenBuffer(buf, window.PDFLib);
      if (!res.hasForm) {
        $('pfl-verdict').textContent = 'File "' + file.name + '" không chứa trường biểu mẫu (form) nào — không có gì để làm phẳng. File của bạn giữ nguyên, không cần tạo file mới.';
        $('pfl-verdict').classList.add('pfl-warn');
        $('pfl-stats').style.display = 'none';
        $('pfl-download').style.display = 'none';
        $('pfl-result').style.display = '';
        $('pfl-status').textContent = '';
        return;
      }
      $('pfl-verdict').classList.remove('pfl-warn');
      $('pfl-stats').style.display = '';
      $('pfl-download').style.display = '';
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(new Blob([res.bytes], { type: 'application/pdf' }));
      $('pfl-download').href = lastUrl;
      $('pfl-out-fields').textContent = res.fields;
      $('pfl-out-size').textContent = fmtSize(res.bytes.length);
      $('pfl-verdict').textContent = 'Đã làm phẳng ' + res.fields + ' trường biểu mẫu trong "' + file.name + '". Nội dung đã điền nay là một phần cố định của trang — mở ở đâu cũng hiển thị đúng và không sửa được nữa.';
      $('pfl-result').style.display = '';
      $('pfl-status').textContent = '';
    } catch (e) {
      $('pfl-fileinfo').textContent = '⚠️ Không xử lý được "' + file.name + '" (file hỏng hoặc có mật khẩu mở).';
      $('pfl-status').textContent = '';
    }
  }

  $('pfl-file').addEventListener('change', function () { setFile(this.files[0]); this.value = ''; });
  var drop = $('pfl-drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('pfl-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('pfl-over'); }); });
  drop.addEventListener('drop', function (e) { setFile(e.dataTransfer.files[0]); });
});

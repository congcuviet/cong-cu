document.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('b62-input');
  var output = document.getElementById('b62-output');
  var msg = document.getElementById('b62-message');
  var stat = document.getElementById('b62-stat');
  var modeEncodeBtn = document.getElementById('b62-mode-encode');
  var modeDecodeBtn = document.getElementById('b62-mode-decode');
  var optStdBtn = document.getElementById('b62-opt-std');
  var optUrlBtn = document.getElementById('b62-opt-url');
  var optNopad = document.getElementById('b62-opt-nopad');
  var mode = 'encode';
  var variant = 'std';
  var encoder = new TextEncoder();
  var decoder = new TextDecoder('utf-8', { fatal: true });

  function showMessage(text, isError) {
    msg.textContent = text || '';
    msg.className = 'b62-message' + (text ? (isError ? ' b62-err' : ' b62-ok') : '');
  }
  function bytesToB64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) { bin += String.fromCharCode(bytes[i]); }
    return btoa(bin);
  }
  function b64ToBytes(str) {
    var bin = atob(str);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) { bytes[i] = bin.charCodeAt(i); }
    return bytes;
  }
  function setMode(next) {
    mode = next;
    modeEncodeBtn.className = 'b62-mode-btn' + (mode === 'encode' ? ' b62-mode-active' : '');
    modeDecodeBtn.className = 'b62-mode-btn' + (mode === 'decode' ? ' b62-mode-active' : '');
    input.placeholder = mode === 'encode' ? 'Nhập văn bản hoặc mã Base64 vào đây...' : 'Dán chuỗi Base64 vào đây...';
    convert();
  }
  function setVariant(next) {
    variant = next;
    optStdBtn.className = 'b62-opt-btn' + (variant === 'std' ? ' b62-opt-active' : '');
    optUrlBtn.className = 'b62-opt-btn' + (variant === 'url' ? ' b62-opt-active' : '');
    convert();
  }
  function convert() {
    var raw = input.value;
    if (raw === '') { output.value = ''; stat.textContent = ''; showMessage('', false); return; }
    if (mode === 'encode') {
      try {
        var bytes = encoder.encode(raw);
        var out = bytesToB64(bytes);
        if (variant === 'url') { out = out.replace(/\+/g, '-').replace(/\//g, '_'); }
        if (optNopad.checked) { out = out.replace(/=+$/, ''); }
        output.value = out;
        var pct = bytes.length ? Math.round((out.length / bytes.length - 1) * 100) : 0;
        stat.textContent = raw.length + ' ký tự · ' + bytes.length + ' byte UTF-8 → ' + out.length + ' ký tự Base64 (+' + pct + '%)';
        showMessage('Mã hóa thành công!', false);
      } catch (e) {
        output.value = '';
        stat.textContent = '';
        showMessage('Có lỗi xảy ra khi mã hóa!', true);
      }
      return;
    }
    // decode: strip whitespace, accept URL-safe alphabet, re-add padding
    var cleaned = raw.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    var bad = cleaned.match(/[^A-Za-z0-9+\/=]/);
    if (bad) {
      output.value = ''; stat.textContent = '';
      showMessage('Chuỗi Base64 không hợp lệ: ký tự lạ “' + bad[0] + '”.', true);
      return;
    }
    var eqPos = cleaned.indexOf('=');
    if (eqPos !== -1 && !/^=*$/.test(cleaned.slice(eqPos))) {
      output.value = ''; stat.textContent = '';
      showMessage('Chuỗi Base64 không hợp lệ: dấu = chỉ được ở cuối chuỗi.', true);
      return;
    }
    var noPad = cleaned.replace(/=+$/, '');
    if (noPad.length % 4 === 1) {
      output.value = ''; stat.textContent = '';
      showMessage('Chuỗi Base64 không hợp lệ: độ dài không khớp (dư 1 ký tự sau khi chia nhóm 4).', true);
      return;
    }
    var padded = noPad + '==='.slice(0, (4 - (noPad.length % 4)) % 4);
    var decodedBytes;
    try {
      decodedBytes = b64ToBytes(padded);
    } catch (e) {
      output.value = ''; stat.textContent = '';
      showMessage('Chuỗi Base64 không hợp lệ: không giải mã được.', true);
      return;
    }
    try {
      var text = decoder.decode(decodedBytes);
      output.value = text;
      stat.textContent = cleaned.length + ' ký tự Base64 → ' + decodedBytes.length + ' byte · ' + text.length + ' ký tự';
      showMessage('Giải mã thành công!', false);
    } catch (e) {
      output.value = ''; stat.textContent = '';
      showMessage('Giải mã thất bại: byte thu được không phải UTF-8 hợp lệ (có thể dữ liệu gốc dùng bảng mã khác).', true);
    }
  }

  modeEncodeBtn.addEventListener('click', function() { setMode('encode'); });
  modeDecodeBtn.addEventListener('click', function() { setMode('decode'); });
  optStdBtn.addEventListener('click', function() { setVariant('std'); });
  optUrlBtn.addEventListener('click', function() { setVariant('url'); });
  optNopad.addEventListener('change', convert);
  input.addEventListener('input', convert);

  var chips = document.querySelectorAll('[data-b62-chip]');
  chips.forEach(function(chip) {
    chip.addEventListener('click', function() {
      var sample = chip.getAttribute('data-b62-chip');
      // In decode mode the chip inserts the Base64 of the sample, so it always decodes back.
      if (mode === 'decode') {
        var b = bytesToB64(encoder.encode(sample));
        if (variant === 'url') { b = b.replace(/\+/g, '-').replace(/\//g, '_'); }
        if (optNopad.checked) { b = b.replace(/=+$/, ''); }
        input.value = b;
      } else {
        input.value = sample;
      }
      convert();
      input.focus();
    });
  });
  document.getElementById('b62-clear').addEventListener('click', function() {
    input.value = ''; output.value = ''; stat.textContent = ''; showMessage('', false); input.focus();
  });
  document.getElementById('b62-swap').addEventListener('click', function() {
    if (!output.value) { return; }
    input.value = output.value;
    setMode(mode === 'encode' ? 'decode' : 'encode');
    input.focus();
  });
  document.getElementById('b62-copy').addEventListener('click', function() {
    if (!output.value) { return; }
    var done = function() { showMessage('Đã sao chép vào clipboard!', false); };
    var fail = function() { showMessage('Không thể sao chép tự động, hãy sao chép thủ công nội dung trong ô “Kết quả”.', true); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(done, fail);
    } else {
      output.select();
      try { document.execCommand('copy'); done(); } catch (e) { fail(); }
    }
  });
});
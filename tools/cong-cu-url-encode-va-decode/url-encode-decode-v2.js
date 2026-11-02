document.addEventListener('DOMContentLoaded', function () {
  var $ = function (id) { return document.getElementById(id); };
  var input = $('ue2Input'), output = $('ue2Output'), err = $('ue2Error');
  var statsEl = $('ue2Stats'), moreBtn = $('ue2BtnMore'), toast = $('ue2Toast');
  var noteEl = $('ue2ScopeNote');
  var mode = 'encode', scope = 'component';
  var NOTES = {
    component: 'Tham Số: mã hóa mọi ký tự cấu trúc (&, =, /, ?) — dùng cho giá trị của một tham số.',
    full: 'URL đầy đủ: giữ nguyên cấu trúc : / ? # & = nên https:// vẫn dùng được.',
    form: 'Form (dấu +): khoảng trắng thành dấu + khi mã hóa, dấu + thành khoảng trắng khi giải mã — chỉ dùng cho dữ liệu form.'
  };
  var SAMPLES = {
    search: { mode: 'encode', scope: 'component', text: 'công cụ Việt & giá rẻ' },
    plus: { mode: 'encode', scope: 'component', text: 'C++ là ngôn ngữ lập trình' },
    fullurl: { mode: 'encode', scope: 'full', text: 'https://congcuviet.com/cong-cu/?q=công cụ việt&lang=vi' }
  };
  function showToast(msg, isErr) {
    toast.textContent = msg;
    toast.style.background = isErr ? '#b91c1c' : '#111';
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }
  function showErr(msg) { err.textContent = msg; err.hidden = false; }
  function clearErr() { err.hidden = true; err.textContent = ''; }
  function countGroups(s) { var m = s.match(/%[0-9A-Fa-f]{2}/g); return m ? m.length : 0; }
  function transform(s) {
    if (mode === 'encode') {
      if (scope === 'component') return encodeURIComponent(s);
      if (scope === 'full') return encodeURI(s);
      return encodeURIComponent(s).replace(/%20/g, '+');
    }
    if (scope === 'component') return decodeURIComponent(s);
    if (scope === 'full') return decodeURI(s);
    return decodeURIComponent(s.replace(/\+/g, '%20'));
  }
  function calc() {
    var v = input.value;
    if (!v) {
      output.value = ''; clearErr();
      statsEl.textContent = 'Nhập nội dung để xem kết quả.';
      moreBtn.hidden = true;
      return;
    }
    try {
      var out = transform(v);
      output.value = out; clearErr();
      statsEl.textContent = 'Đầu vào: ' + v.length + ' ký tự · Kết quả: ' + out.length + ' ký tự · Nhóm %HH: ' + countGroups(out);
      moreBtn.hidden = !(mode === 'decode' && /%[0-9A-Fa-f]{2}/.test(out));
    } catch (e) {
      output.value = '';
      showErr('Chuỗi chứa % không hợp lệ (ví dụ: %ZZ hoặc % ở cuối chuỗi). Ký tự % thật phải viết thành %25.');
      statsEl.textContent = 'Chưa có kết quả vì đầu vào không hợp lệ.';
      moreBtn.hidden = true;
    }
  }
  function setSeg(attr, val) {
    document.querySelectorAll('[data-ue2-' + attr + ']').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-ue2-' + attr) === val);
    });
  }
  function setMode(m) { mode = m; setSeg('mode', m); calc(); }
  function setScope(s) { scope = s; setSeg('scope', s); noteEl.textContent = NOTES[s]; calc(); }
  document.querySelectorAll('[data-ue2-mode]').forEach(function (b) {
    b.addEventListener('click', function () { setMode(b.getAttribute('data-ue2-mode')); });
  });
  document.querySelectorAll('[data-ue2-scope]').forEach(function (b) {
    b.addEventListener('click', function () { setScope(b.getAttribute('data-ue2-scope')); });
  });
  document.querySelectorAll('[data-ue2-sample]').forEach(function (b) {
    b.addEventListener('click', function () {
      var s = SAMPLES[b.getAttribute('data-ue2-sample')];
      mode = s.mode; scope = s.scope;
      setSeg('mode', mode); setSeg('scope', scope); noteEl.textContent = NOTES[scope];
      input.value = s.text; calc(); input.focus();
    });
  });
  input.addEventListener('input', calc);
  $('ue2BtnCopy').addEventListener('click', function () {
    var t = output.value;
    if (!t) { showToast('Chưa có kết quả để sao chép.', true); return; }
    function done() { showToast('Đã sao chép!'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(done, function () {
        output.select(); document.execCommand('copy'); done();
      });
    } else { output.select(); document.execCommand('copy'); done(); }
  });
  $('ue2BtnSwap').addEventListener('click', function () {
    var t = output.value;
    if (!t) { showToast('Chưa có kết quả để đảo chiều.', true); return; }
    input.value = t;
    setMode(mode === 'encode' ? 'decode' : 'encode');
    input.focus();
  });
  $('ue2BtnReset').addEventListener('click', function () {
    input.value = ''; mode = 'encode'; scope = 'component';
    setSeg('mode', mode); setSeg('scope', scope); noteEl.textContent = NOTES[scope];
    calc(); input.focus();
  });
  $('ue2BtnDl').addEventListener('click', function () {
    var t = output.value;
    if (!t) { showToast('Chưa có kết quả để tải.', true); return; }
    var blob = new Blob([t], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'url-encode-decode.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
    showToast('Đã tải file txt!');
  });
  moreBtn.addEventListener('click', function () {
    input.value = output.value; calc(); input.focus();
  });
  calc();
});

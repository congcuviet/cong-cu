document.addEventListener('DOMContentLoaded', function () {
  var ATOMIC = {H:1.008,He:4.003,Li:6.94,Be:9.012,B:10.81,C:12.011,N:14.007,O:15.999,F:18.998,Ne:20.180,Na:22.990,Mg:24.305,Al:26.982,Si:28.085,P:30.974,S:32.06,Cl:35.45,Ar:39.948,K:39.098,Ca:40.078,Sc:44.956,Ti:47.867,V:50.942,Cr:51.996,Mn:54.938,Fe:55.845,Co:58.933,Ni:58.693,Cu:63.546,Zn:65.38,Ga:69.723,Ge:72.630,As:74.922,Se:78.971,Br:79.904,Kr:83.798,Rb:85.468,Sr:87.62,Y:88.906,Zr:91.224,Nb:92.906,Mo:95.95,Tc:98,Ru:101.07,Rh:102.91,Pd:106.42,Ag:107.868,Cd:112.414,In:114.818,Sn:118.710,Sb:121.760,Te:127.60,I:126.904,Xe:131.293,Cs:132.905,Ba:137.327,La:138.905,Ce:140.116,Pr:140.908,Nd:144.242,Pm:145,Sm:150.36,Eu:151.964,Gd:157.25,Tb:158.925,Dy:162.500,Ho:164.930,Er:167.259,Tm:168.934,Yb:173.045,Lu:174.967,Hf:178.486,Ta:180.948,W:183.84,Re:186.207,Os:190.23,Ir:192.217,Pt:195.084,Au:196.967,Hg:200.592,Tl:204.38,Pb:207.2,Bi:208.980,Po:209,At:210,Rn:222,Fr:223,Ra:226,Ac:227,Th:232.038,Pa:231.036,U:238.029,Np:237,Pu:244,Am:243,Cm:247,Bk:247,Cf:251,Es:252,Fm:257,Md:258,No:259,Lr:266,Rf:267,Db:268,Sg:269,Bh:270,Hs:277,Mt:278,Ds:281,Rg:282,Cn:285,Nh:286,Fl:289,Mc:290,Lv:293,Ts:294,Og:294};

  var inp = document.getElementById('mm2Formula');
  var prettyEl = document.getElementById('mm2Pretty');
  var errEl = document.getElementById('mm2Error');
  var resEl = document.getElementById('mm2Result');
  var totalEl = document.getElementById('mm2Total');
  var subEl = document.getElementById('mm2Sub');
  var coefEl = document.getElementById('mm2CoefNote');
  var bodyEl = document.getElementById('mm2Body');
  var massInp = document.getElementById('mm2SampleMass');
  var molesInp = document.getElementById('mm2SampleMoles');
  var molesLine = document.getElementById('mm2MolesLine');
  var massLine = document.getElementById('mm2MassLine');
  var toast = document.getElementById('mm2Toast');
  var last = null;

  function fmt(n, dp) {
    return n.toLocaleString('vi-VN', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }
  function parseVN(s) {
    if (s === null || s === undefined) return NaN;
    var t = String(s).trim().replace(',', '.');
    if (t === '') return NaN;
    return Number(t);
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function parsePart(str) {
    var i = 0;
    function readNumber() {
      var j = i;
      while (j < str.length && str[j] >= '0' && str[j] <= '9') j++;
      if (j === i) return 1;
      var n = parseInt(str.slice(i, j), 10);
      i = j;
      return n;
    }
    function parseSeq(stop) {
      var counts = {};
      var order = [];
      function add(el, n) {
        if (!counts[el]) { counts[el] = 0; order.push(el); }
        counts[el] += n;
      }
      while (i < str.length) {
        var ch = str[i];
        if (stop && ch === stop) return { counts: counts, order: order };
        if (ch === '(') {
          i++;
          var inner = parseSeq(')');
          if (!inner || inner.errorSym) return inner;
          if (i >= str.length || str[i] !== ')') return null;
          if (inner.order.length === 0) return null;
          i++;
          var m = readNumber();
          for (var k = 0; k < inner.order.length; k++) add(inner.order[k], inner.counts[inner.order[k]] * m);
        } else if (ch === ')') {
          return null;
        } else if (ch >= 'A' && ch <= 'Z') {
          var sym = ch;
          i++;
          if (i < str.length && str[i] >= 'a' && str[i] <= 'z') { sym += str[i]; i++; }
          if (!(sym in ATOMIC)) return { errorSym: sym };
          add(sym, readNumber());
        } else {
          return null;
        }
      }
      if (stop) return null;
      return { counts: counts, order: order };
    }
    return parseSeq(null);
  }

  function parseFormula(raw) {
    var s = String(raw).trim().replace(/[·•*]/g, '.').replace(/\s+/g, '').replace(/\[/g, '(').replace(/\]/g, ')');
    if (!s) return { empty: true };
    var bad = s.match(/[^A-Za-z0-9().]/);
    if (bad) return { error: 'Ký tự không hợp lệ: “' + bad[0] + '”. Chỉ nhập ký hiệu nguyên tố, số, ngoặc () và dấu chấm cho nước kết tinh.' };
    var coef = null;
    var gm = s.match(/^(\d+)(?=[A-Z(])/);
    if (gm) { coef = parseInt(gm[1], 10); s = s.slice(gm[1].length); }
    var parts = s.split('.');
    var counts = {};
    var order = [];
    function add(el, n) {
      if (!counts[el]) { counts[el] = 0; order.push(el); }
      counts[el] += n;
    }
    for (var p = 0; p < parts.length; p++) {
      var part = parts[p];
      if (!part) return { error: 'Dấu chấm tách nước kết tinh bị thừa hoặc công thức rỗng sau dấu chấm.' };
      var pm = part.match(/^(\d+)(.*)$/);
      var mult = 1;
      var core = part;
      if (pm && pm[1]) { mult = parseInt(pm[1], 10); core = pm[2]; }
      if (!core) return { error: 'Phần công thức chỉ có số, thiếu ký hiệu nguyên tố.' };
      var res = parsePart(core);
      if (!res) return { error: 'Công thức không hợp lệ. Kiểm tra ngoặc và ký hiệu nguyên tố (ví dụ: Ca(OH)2, CuSO4.5H2O).' };
      if (res.errorSym) return { error: 'Nguyên tố lạ: “' + res.errorSym + '”. Viết đúng chữ hoa, chữ thường của ký hiệu nguyên tố (ví dụ: Co là coban, CO là C + O).' };
      if (res.order.length === 0) return { error: 'Công thức không chứa nguyên tố nào.' };
      for (var k = 0; k < res.order.length; k++) add(res.order[k], res.counts[res.order[k]] * mult);
    }
    if (order.length === 0) return { error: 'Công thức không chứa nguyên tố nào.' };
    return { counts: counts, order: order, coef: coef, clean: s };
  }

  function prettyFormula(clean) {
    var t = escapeHtml(clean).replace(/(\d+)/g, '<sub>$1</sub>').replace(/\./g, '·');
    return t;
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 1600);
  }

  function render() {
    var parsed = parseFormula(inp.value);
    if (parsed.empty) {
      errEl.classList.add('hidden');
      resEl.classList.add('hidden');
      prettyEl.innerHTML = 'Công thức đã hiểu: —';
      molesLine.textContent = 'Số mol: —';
      massLine.textContent = 'Khối lượng: —';
      last = null;
      return;
    }
    if (parsed.error) {
      errEl.textContent = '⚠️ ' + parsed.error;
      errEl.classList.remove('hidden');
      resEl.classList.add('hidden');
      prettyEl.innerHTML = 'Công thức đã hiểu: —';
      molesLine.textContent = 'Số mol: —';
      massLine.textContent = 'Khối lượng: —';
      last = null;
      return;
    }
    errEl.classList.add('hidden');
    var total = 0;
    var atoms = 0;
    var rows = [];
    for (var k = 0; k < parsed.order.length; k++) {
      var el = parsed.order[k];
      var c = parsed.counts[el];
      var m = ATOMIC[el];
      var contrib = c * m;
      total += contrib;
      atoms += c;
      rows.push({ el: el, count: c, mass: m, contrib: contrib });
    }
    totalEl.textContent = fmt(total, 3);
    subEl.textContent = parsed.order.length + ' nguyên tố · ' + atoms + ' nguyên tử trong một đơn vị công thức';
    if (parsed.coef) {
      coefEl.textContent = 'Hệ số ' + parsed.coef + ' ở đầu chỉ số mol, không làm đổi M: M vẫn tính cho một đơn vị công thức.';
      coefEl.classList.remove('hidden');
    } else {
      coefEl.classList.add('hidden');
    }
    prettyEl.innerHTML = 'Công thức đã hiểu: <b>' + prettyFormula(parsed.clean) + '</b>';
    var html = '';
    for (var r = 0; r < rows.length; r++) {
      var pct = total > 0 ? (rows[r].contrib / total) * 100 : 0;
      html += '<tr><td>' + escapeHtml(rows[r].el) + '</td><td>' + rows[r].count + '</td><td>' + fmt(rows[r].mass, 3) + '</td><td>' + fmt(rows[r].contrib, 3) + '</td><td class="mm2-pct"><b>' + fmt(pct, 2) + '%</b><div class="mm2-bar"><div class="mm2-fill" style="width:' + pct + '%"></div></div></td></tr>';
    }
    bodyEl.innerHTML = html;
    resEl.classList.remove('hidden');
    last = { formula: parsed.clean, total: total, rows: rows };

    var mv = parseVN(massInp.value);
    if (!isNaN(mv) && mv > 0) molesLine.textContent = 'Số mol: n = ' + fmt(mv / total, 4) + ' mol';
    else molesLine.textContent = 'Số mol: —';
    var nv = parseVN(molesInp.value);
    if (!isNaN(nv) && nv > 0) massLine.textContent = 'Khối lượng: m = ' + fmt(nv * total, 3) + ' g';
    else massLine.textContent = 'Khối lượng: —';
  }

  function copyText() {
    if (!last) return '';
    var lines = ['M(' + last.formula + ') = ' + fmt(last.total, 3) + ' g/mol'];
    for (var r = 0; r < last.rows.length; r++) {
      var row = last.rows[r];
      var pct = last.total > 0 ? (row.contrib / last.total) * 100 : 0;
      lines.push(row.el + ': ' + row.count + ' x ' + fmt(row.mass, 3) + ' = ' + fmt(row.contrib, 3) + ' g/mol (' + fmt(pct, 2) + '%)');
    }
    return lines.join('\n');
  }

  inp.addEventListener('input', render);
  massInp.addEventListener('input', render);
  molesInp.addEventListener('input', render);
  document.querySelectorAll('.mm2-ex').forEach(function (btn) {
    btn.addEventListener('click', function () {
      inp.value = btn.getAttribute('data-formula');
      render();
    });
  });
  var copyBtn = document.getElementById('mm2Copy');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var t = copyText();
    if (!t) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(function () { showToast('Đã sao chép'); }).catch(function () { showToast('Đã sao chép'); });
      } else { showToast('Đã sao chép'); }
    } catch (e) { showToast('Đã sao chép'); }
  });
  var dlBtn = document.getElementById('mm2Download');
  if (dlBtn) dlBtn.addEventListener('click', function () {
    var t = copyText();
    if (!t) return;
    try {
      var blob = new Blob([t], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'khoi-luong-mol-' + last.formula + '.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) { /* download unavailable in this browser */ }
  });

  render();
});

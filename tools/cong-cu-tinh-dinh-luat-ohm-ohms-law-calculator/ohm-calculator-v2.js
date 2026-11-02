document.addEventListener('DOMContentLoaded', function () {
  function $(id) { return document.getElementById(id); }
  function fmt(x) {
    if (x === Infinity) return '∞';
    if (x === -Infinity) return '-∞';
    if (x === 0) return '0';
    return String(parseFloat(x.toPrecision(6)));
  }
  function fmtFull(x) {
    if (x === 0) return '0';
    return String(Number(x.toPrecision(10)));
  }
  function readNum(el) {
    var t = el.value.trim();
    if (t === '') return null;
    var n = Number(t.replace(',', '.'));
    return isFinite(n) ? n : 'invalid';
  }
  function toast(msg) {
    var t = $('oh2-toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(t._tm);
    t._tm = setTimeout(function () { t.hidden = true; }, 2200);
  }
  function copyText(txt) {
    if (!txt) { toast('Chưa có kết quả để copy'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { toast('Đã copy kết quả'); }, function () { toast('Không copy được, hãy copy tay'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast('Đã copy kết quả'); } catch (e) { toast('Không copy được, hãy copy tay'); }
      document.body.removeChild(ta);
    }
  }
  function setErr(el, msg) {
    if (msg) { el.textContent = msg; el.hidden = false; } else { el.hidden = true; el.textContent = ''; }
  }
  function card(title, val, unit, sub, calc) {
    return '<div class="oh2-card' + (calc ? ' oh2-calc' : '') + '"><div class="oh2-card-title">' + title + '</div><div class="oh2-value">' + val + ' ' + unit + '</div><div class="oh2-sub">' + sub + '</div></div>';
  }

  // ---------- Mode switch ----------
  var modeBasic = $('oh2-mode-basic'), modeCircuit = $('oh2-mode-circuit');
  modeBasic.addEventListener('click', function () {
    modeBasic.classList.add('oh2-active'); modeCircuit.classList.remove('oh2-active');
    $('oh2-panel-basic').hidden = false; $('oh2-panel-circuit').hidden = true;
  });
  modeCircuit.addEventListener('click', function () {
    modeCircuit.classList.add('oh2-active'); modeBasic.classList.remove('oh2-active');
    $('oh2-panel-circuit').hidden = false; $('oh2-panel-basic').hidden = true;
    calcCircuit();
  });

  // ---------- Basic Ohm ----------
  var inB = { U: $('oh2-U'), I: $('oh2-I'), R: $('oh2-R'), P: $('oh2-P') };
  var unB = { U: $('oh2-Uu'), I: $('oh2-Iu'), R: $('oh2-Ru'), P: $('oh2-Pu') };
  var labels = { U: 'Điện áp U', I: 'Dòng điện I', R: 'Điện trở R', P: 'Công suất P' };
  var units = { U: 'V', I: 'A', R: 'Ω', P: 'W' };
  var lastBasicText = '';
  Object.keys(unB).forEach(function (k) { unB[k].dataset.prev = unB[k].value; });

  function solveBasic(v) {
    var U = v.U, I = v.I, R = v.R, P = v.P;
    if (R !== null && R < 0) return { err: 'Điện trở R không thể âm.' };
    if (P !== null && P < 0) return { err: 'Công suất P không thể âm.' };
    if (U !== null && U < 0) return { err: 'Với mạch điện trở thụ động, U nhập số ≥ 0 theo chiều quy ước.' };
    if (I !== null && I < 0) return { err: 'Với mạch điện trở thụ động, I nhập số ≥ 0 theo chiều quy ước.' };
    if (U !== null && I !== null) {
      if (U === 0 && I === 0) return { err: 'U = 0 và I = 0 không xác định duy nhất R (mọi điện trở đều cho I = 0 khi không có điện áp).' };
      if (I === 0) return { vals: { U: U, I: 0, R: Infinity, P: 0 }, calc: ['R', 'P'], formula: 'R = U / I; P = U × I', note: 'I = 0 với U ≠ 0 là trường hợp mạch hở: R → ∞, P = 0.' };
      return { vals: { U: U, I: I, R: U / I, P: U * I }, calc: ['R', 'P'], formula: 'R = U / I; P = U × I', note: '' };
    }
    if (U !== null && R !== null) {
      if (R === 0) return { err: U === 0 ? 'U = 0 và R = 0 không xác định duy nhất I (0/0).' : 'Đoản mạch: R = 0 mà U ≠ 0.' };
      return { vals: { U: U, I: U / R, R: R, P: U * U / R }, calc: ['I', 'P'], formula: 'I = U / R; P = U² / R', note: '' };
    }
    if (U !== null && P !== null) {
      if (U === 0) return { err: P === 0 ? 'U = 0 và P = 0 không xác định duy nhất I và R.' : 'U = 0 mà P ≠ 0 là vô lý (P = U × I phải bằng 0).' };
      if (P === 0) {
        if (U === 0) return { err: 'U = 0 và P = 0 không xác định duy nhất I và R.' };
        return { vals: { U: U, I: 0, R: Infinity, P: 0 }, calc: ['I', 'R'], formula: 'I = P / U; R = U² / P', note: 'P = 0 với U ≠ 0 là trường hợp mạch hở: I = 0, R → ∞.' };
      }
      return { vals: { U: U, I: P / U, R: U * U / P, P: P }, calc: ['I', 'R'], formula: 'I = P / U; R = U² / P', note: '' };
    }
    if (I !== null && R !== null) {
      return { vals: { U: I * R, I: I, R: R, P: I * I * R }, calc: ['U', 'P'], formula: 'U = I × R; P = I² × R', note: '' };
    }
    if (I !== null && P !== null) {
      if (I === 0) return { err: P === 0 ? 'I = 0 và P = 0 không xác định duy nhất R.' : 'I = 0 mà P ≠ 0 là vô lý (P = U × I phải bằng 0).' };
      return { vals: { U: P / I, I: I, R: P / (I * I), P: P }, calc: ['U', 'R'], formula: 'U = P / I; R = P / I²', note: '' };
    }
    if (R !== null && P !== null) {
      if (R === 0) return { err: P === 0 ? 'R = 0 và P = 0 không xác định duy nhất U và I.' : 'R = 0 mà P ≠ 0 là vô lý (P = I² × R phải bằng 0).' };
      return { vals: { U: Math.sqrt(P * R), I: Math.sqrt(P / R), R: R, P: P }, calc: ['U', 'I'], formula: 'U = √(P × R); I = √(P / R)', note: '' };
    }
    return { err: 'Nhập đúng 2 ô.' };
  }

  function calcBasic() {
    var raw = {}, norm = {}, known = [], invalid = false;
    Object.keys(inB).forEach(function (k) {
      raw[k] = readNum(inB[k]);
      if (raw[k] === 'invalid') invalid = true;
      else if (raw[k] !== null) { norm[k] = raw[k] * parseFloat(unB[k].value); known.push(k); }
      else norm[k] = null;
    });
    var countEl = $('oh2-count'), errEl = $('oh2-error-basic'), resEl = $('oh2-results-basic'), detEl = $('oh2-detail-basic');
    lastBasicText = '';
    if (invalid) {
      countEl.textContent = '';
      setErr(errEl, 'Có ô nhập không phải số. Hãy nhập số (dùng dấu phẩy hoặc chấm cho số thập phân).');
      resEl.innerHTML = ''; detEl.textContent = '';
      return;
    }
    if (known.length < 2) {
      countEl.textContent = 'Đã nhập ' + known.length + '/2 ô — nhập thêm ' + (2 - known.length) + ' ô nữa.';
      setErr(errEl, '');
      resEl.innerHTML = ''; detEl.textContent = '';
      return;
    }
    if (known.length > 2) {
      countEl.textContent = '';
      setErr(errEl, 'Chỉ nhập đúng 2 ô — hiện có ' + known.length + ' ô. Hãy xóa bớt ' + (known.length - 2) + ' ô rồi tính lại.');
      resEl.innerHTML = ''; detEl.textContent = '';
      return;
    }
    countEl.textContent = 'Đã nhập đủ 2 ô: ' + known.map(function (k) { return labels[k]; }).join(' và ') + '.';
    var out = solveBasic(norm);
    if (out.err) {
      setErr(errEl, out.err);
      resEl.innerHTML = ''; detEl.textContent = '';
      return;
    }
    setErr(errEl, '');
    var html = '<div class="oh2-cards">';
    var lines = [];
    Object.keys(labels).forEach(function (k) {
      var isCalc = out.calc.indexOf(k) >= 0;
      var val = out.vals[k];
      html += card(labels[k], fmt(val), units[k], isCalc ? 'suy ra' : 'đã nhập', isCalc);
      lines.push(labels[k] + ': ' + fmt(val) + ' ' + units[k] + (isCalc ? ' (suy ra)' : ''));
    });
    html += '</div>';
    resEl.innerHTML = html;
    detEl.textContent = 'Công thức: ' + out.formula + '.' + (out.note ? ' ' + out.note : '') + ' Số rất nhỏ hiển thị dạng lũy thừa (vd 4e-7), không làm tròn thành 0.';
    lastBasicText = lines.join('\n') + '\n' + detEl.textContent;
  }

  Object.keys(inB).forEach(function (k) {
    inB[k].addEventListener('input', calcBasic);
    unB[k].addEventListener('change', function () {
      var oldF = parseFloat(unB[k].dataset.prev), newF = parseFloat(unB[k].value);
      unB[k].dataset.prev = unB[k].value;
      var v = readNum(inB[k]);
      if (v !== null && v !== 'invalid') inB[k].value = fmtFull(v * oldF / newF);
      calcBasic();
    });
  });
  function setBasic(U, Uu, I, Iu, R, Ru, P, Pu) {
    inB.U.value = U; unB.U.value = Uu; unB.U.dataset.prev = Uu;
    inB.I.value = I; unB.I.value = Iu; unB.I.dataset.prev = Iu;
    inB.R.value = R; unB.R.value = Ru; unB.R.dataset.prev = Ru;
    inB.P.value = P; unB.P.value = Pu; unB.P.dataset.prev = Pu;
    calcBasic();
  }
  $('oh2-ex-lamp').addEventListener('click', function () { setBasic('220', '1', '', '1', '44', '1', '', '1'); });
  $('oh2-ex-led').addEventListener('click', function () { setBasic('', '1', '20', '0.001', '1', '1000', '', '1'); });
  $('oh2-copy-basic').addEventListener('click', function () { copyText(lastBasicText); });
  $('oh2-clear-basic').addEventListener('click', function () { setBasic('', '1', '', '1', '', '1', '', '1'); });

  // ---------- Whole circuit ----------
  var inE = $('oh2-E'), inr = $('oh2-r'), inRout = $('oh2-Rout');
  var lastCircuitText = '';
  function calcCircuit() {
    var E = readNum(inE), r = readNum(inr), R = readNum(inRout);
    var errEl = $('oh2-error-circuit'), resEl = $('oh2-results-circuit'), detEl = $('oh2-detail-circuit');
    lastCircuitText = '';
    if (E === null || r === null || R === null) {
      if (E === 'invalid' || r === 'invalid' || R === 'invalid') setErr(errEl, 'Có ô nhập không phải số.');
      else setErr(errEl, '');
      resEl.innerHTML = ''; detEl.textContent = '';
      return;
    }
    if (E < 0) { setErr(errEl, 'Suất điện động E nhập số ≥ 0 theo chiều quy ước.'); resEl.innerHTML = ''; detEl.textContent = ''; return; }
    if (r < 0 || R < 0) { setErr(errEl, 'Điện trở r và R không thể âm.'); resEl.innerHTML = ''; detEl.textContent = ''; return; }
    if (r + R === 0) { setErr(errEl, 'Đoản mạch cực độ: r = 0 và R = 0, dòng điện tiến tới vô cực.'); resEl.innerHTML = ''; detEl.textContent = ''; return; }
    setErr(errEl, '');
    var I = E / (R + r), U = I * R, Ur = I * r, Pout = U * I, Png = E * I;
    var H = Png > 0 ? (Pout / Png * 100) : null;
    resEl.innerHTML = '<div class="oh2-cards">'
      + card('Dòng mạch chính I', fmt(I), 'A', 'I = E / (R + r)', true)
      + card('Điện áp hai cực U', fmt(U), 'V', 'U = I × R', true)
      + card('Độ giảm thế trong Uᵣ', fmt(Ur), 'V', 'Uᵣ = I × r', false)
      + card('Công suất mạch ngoài P', fmt(Pout), 'W', 'P = U × I', false)
      + card('Công suất nguồn Pₙg', fmt(Png), 'W', 'Pₙg = E × I', false)
      + card('Hiệu suất nguồn H', H === null ? '—' : fmt(H), '%', H === null ? 'không xác định khi nguồn không cấp công suất' : 'H = R / (R + r)', false)
      + '</div>';
    var pmax = r > 0 ? fmt(E * E / (4 * r)) + ' W' : '—';
    detEl.textContent = 'Kiểm tra: U + Uᵣ = ' + fmt(U + Ur) + ' V = E. Công suất mạch ngoài cực đại ' + pmax + ' khi R = r'
      + (E === 0 ? '. E = 0 nên hiệu suất không xác định theo tỉ lệ công suất.' : '.');
    lastCircuitText = 'I: ' + fmt(I) + ' A\nU: ' + fmt(U) + ' V\nUᵣ: ' + fmt(Ur) + ' V\nP mạch ngoài: ' + fmt(Pout) + ' W\nP nguồn: ' + fmt(Png) + ' W\nH: ' + (H === null ? '—' : fmt(H) + ' %') + '\n' + detEl.textContent;
  }
  [inE, inr, inRout].forEach(function (el) { el.addEventListener('input', calcCircuit); });
  $('oh2-copy-circuit').addEventListener('click', function () { copyText(lastCircuitText); });
  $('oh2-clear-circuit').addEventListener('click', function () { inE.value = ''; inr.value = ''; inRout.value = ''; calcCircuit(); });

  calcBasic();
  calcCircuit();
});
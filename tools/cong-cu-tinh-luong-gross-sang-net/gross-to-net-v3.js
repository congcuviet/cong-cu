document.addEventListener('DOMContentLoaded', function () {

  /* ===== PURE LOGIC (same rules as net-to-gross-v2) ===== */
  var GN3_RULES = {
    '2026': {
      selfDed: 15500000, depDed: 6200000, insCap: 50600000, mealCap: 1200000,
      regionMin: { 1: 5310000, 2: 4730000, 3: 4140000, 4: 3700000 },
      brackets: [
        { upTo: 10000000, rate: 0.05 }, { upTo: 30000000, rate: 0.10 },
        { upTo: 60000000, rate: 0.20 }, { upTo: 100000000, rate: 0.30 },
        { upTo: Infinity, rate: 0.35 }
      ]
    },
    '2025': {
      selfDed: 11000000, depDed: 4400000, insCap: 46800000, mealCap: 730000,
      regionMin: { 1: 4960000, 2: 4410000, 3: 3860000, 4: 3450000 },
      brackets: [
        { upTo: 5000000, rate: 0.05 }, { upTo: 10000000, rate: 0.10 },
        { upTo: 18000000, rate: 0.15 }, { upTo: 32000000, rate: 0.20 },
        { upTo: 52000000, rate: 0.25 }, { upTo: 80000000, rate: 0.30 },
        { upTo: Infinity, rate: 0.35 }
      ]
    }
  };

  function gn3TaxCalc(assessable, brackets) {
    var rows = [], total = 0, prev = 0;
    for (var i = 0; i < brackets.length; i++) {
      var b = brackets[i];
      var span = Math.max(0, Math.min(assessable, b.upTo) - prev);
      var tax = span * b.rate;
      if (span > 0) rows.push({ idx: i + 1, span: span, rate: b.rate, tax: tax });
      total += tax;
      prev = b.upTo;
      if (assessable <= b.upTo) break;
    }
    return { rows: rows, total: total };
  }

  function gn3Compute(gross, opts) {
    var rules = GN3_RULES[opts.regime];
    var rawBase = (opts.insMode === 'fixed') ? opts.insBase : gross;
    var baseSI = Math.min(rawBase, rules.insCap);
    var baseUI = Math.min(rawBase, 20 * rules.regionMin[opts.region]);
    var bhxh = 0.08 * baseSI, bhyt = 0.015 * baseSI, bhtn = 0.01 * baseUI;
    var insTotal = bhxh + bhyt + bhtn;
    var erTotal = 0.175 * baseSI + 0.03 * baseSI + 0.01 * baseUI + 0.02 * baseSI;
    var mealTaxable = Math.max(0, opts.meal - rules.mealCap);
    var taxableIncome = gross + opts.otherTax + mealTaxable;
    var deductions = rules.selfDed + rules.depDed * opts.dependents + opts.otherDeduct;
    var assessable = Math.max(0, taxableIncome - insTotal - deductions);
    var tax = gn3TaxCalc(assessable, rules.brackets);
    var totalIncome = gross + opts.meal + opts.otherTax + opts.otherFree;
    var net = totalIncome - insTotal - tax.total;
    return {
      gross: gross, rawBase: rawBase, baseSI: baseSI, baseUI: baseUI,
      bhxh: bhxh, bhyt: bhyt, bhtn: bhtn, insTotal: insTotal, erTotal: erTotal,
      mealTaxable: mealTaxable, taxableIncome: taxableIncome, deductions: deductions,
      assessable: assessable, tax: tax, totalIncome: totalIncome, net: net,
      employerCost: totalIncome + erTotal, rules: rules
    };
  }
  /* ===== PURE LOGIC END ===== */

  function $(id) { return document.getElementById(id); }
  function num(el) { if (!el) return 0; var v = String(el.value || '').replace(/[^\d]/g, ''); var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function fmt(n) { return Math.round(n).toLocaleString('vi-VN'); }
  function fmtD(n) { return fmt(n) + ' đ'; }

  var CHU = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  function docBaSo(n, full) {
    var tr = Math.floor(n / 100), ch = Math.floor((n % 100) / 10), dv = n % 10, s = '';
    if (full || tr > 0) s += CHU[tr] + ' trăm';
    if (ch === 0 && dv > 0) { if (s) s += ' lẻ'; s += ' ' + CHU[dv]; }
    else if (ch === 1) { s += ' mười'; if (dv === 5) s += ' lăm'; else if (dv > 0) s += ' ' + CHU[dv]; }
    else if (ch > 1) { s += ' ' + CHU[ch] + ' mươi'; if (dv === 1) s += ' mốt'; else if (dv === 5) s += ' lăm'; else if (dv > 0) s += ' ' + CHU[dv]; }
    return s.trim();
  }
  function docSo(n) {
    n = Math.round(Math.abs(n));
    if (n === 0) return 'Không đồng';
    var donVi = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];
    var groups = [], x = n;
    while (x > 0) { groups.push(x % 1000); x = Math.floor(x / 1000); }
    var parts = [];
    for (var i = groups.length - 1; i >= 0; i--) {
      if (groups[i] === 0) continue;
      parts.push(docBaSo(groups[i], i < groups.length - 1) + donVi[i]);
    }
    var s = parts.join(' ').replace(/\s+/g, ' ').trim();
    return s.charAt(0).toUpperCase() + s.slice(1) + ' đồng';
  }
  function capMoney(input, capEl) {
    if (!input || !capEl) return;
    function upd() { var v = num(input); capEl.textContent = v > 0 ? '≈ ' + docSo(v) : ''; }
    input.addEventListener('input', upd); upd();
  }
  function bindMoney(input) {
    if (!input) return;
    input.addEventListener('input', function () {
      var digits = input.value.replace(/[^\d]/g, '');
      input.value = digits ? parseInt(digits, 10).toLocaleString('vi-VN') : '';
    });
  }
  document.querySelectorAll('.gn3-money').forEach(bindMoney);

  function readOpts() {
    return {
      regime: $('gn3-reg-2026').checked ? '2026' : '2025',
      region: parseInt(document.querySelector('input[name="gn3-region"]:checked').value, 10),
      dependents: Math.max(0, parseInt($('gn3-inp-dep').value, 10) || 0),
      meal: num($('gn3-inp-meal')),
      otherTax: num($('gn3-inp-other-tax')),
      otherFree: num($('gn3-inp-other-free')),
      otherDeduct: num($('gn3-inp-deduct')),
      insMode: $('gn3-ins-fixed').checked ? 'fixed' : 'auto',
      insBase: num($('gn3-inp-ins-base'))
    };
  }

  function updateHints() {
    var opts = readOpts();
    var rules = GN3_RULES[opts.regime];
    $('gn3-regime-hint').textContent = 'Giảm trừ ' + fmt(rules.selfDed) + 'đ bản thân + ' + fmt(rules.depDed) + 'đ/người phụ thuộc · biểu thuế ' + rules.brackets.length + ' bậc · trần đóng BHXH/BHYT ' + fmt(rules.insCap) + 'đ/tháng.';
    var mealTaxable = Math.max(0, opts.meal - rules.mealCap);
    $('gn3-meal-hint').textContent = 'Miễn thuế đến ' + fmt(rules.mealCap) + 'đ/tháng; phần vượt mới tính thuế (hiện tại: ' + fmt(mealTaxable) + 'đ).';
  }

  var last = null, lastOpts = null;
  function row(label, val, opts2) {
    opts2 = opts2 || {};
    var cls = 'gn3-row' + (opts2.total ? ' gn3-row-total' : '') + (opts2.head ? ' gn3-row-head' : '');
    var valHtml = opts2.head ? '' : '<b' + (opts2.neg ? ' class="gn3-neg"' : '') + '>' + (opts2.neg ? '−' : '') + fmtD(Math.abs(val)) + '</b>';
    return '<div class="' + cls + '"><span>' + label + '</span>' + valHtml + '</div>';
  }

  function render() {
    var opts = readOpts();
    var gross = num($('gn3-inp-gross'));
    var r = gn3Compute(gross, opts);
    last = r; lastOpts = opts;

    $('gn3-out-net').textContent = fmtD(r.net);
    $('gn3-verdict').textContent = 'Lương Gross ' + fmtD(gross) + '/tháng → thực nhận ' + fmtD(r.net) + '/tháng (' + fmt(r.net * 12) + ' đ/năm). Bảo hiểm lấy ' + fmtD(r.insTotal) + ', thuế TNCN ' + fmtD(r.tax.total) + '.';
    $('gn3-out-gross').textContent = fmt(gross);
    $('gn3-out-ins').textContent = fmt(r.insTotal);
    $('gn3-out-tax').textContent = fmt(r.tax.total);
    $('gn3-out-employer').textContent = fmt(r.employerCost);

    var other = gn3Compute(gross, Object.assign({}, opts, { regime: opts.regime === '2026' ? '2025' : '2026' }));
    var diff = r.net - other.net;
    var otherYear = opts.regime === '2026' ? '2025' : '2026';
    if (diff > 0) $('gn3-delta').textContent = 'So với bộ quy định ' + otherYear + ': bạn thực nhận NHIỀU HƠN ' + fmtD(diff) + '/tháng theo bộ ' + opts.regime + '.';
    else if (diff < 0) $('gn3-delta').textContent = 'So với bộ quy định ' + otherYear + ': bạn thực nhận ÍT HƠN ' + fmtD(-diff) + '/tháng theo bộ ' + opts.regime + '.';
    else $('gn3-delta').textContent = 'Hai bộ quy định cho kết quả thực nhận bằng nhau ở mức lương này.';

    var d = '';
    d += row('1 · Thu nhập', 0, { head: true });
    d += row('Lương Gross', r.gross);
    if (opts.meal > 0) d += row('Phụ cấp ăn ca (phần tính thuế: ' + fmtD(r.mealTaxable) + ')', opts.meal);
    if (opts.otherTax > 0) d += row('Thu nhập khác chịu thuế', opts.otherTax);
    if (opts.otherFree > 0) d += row('Thu nhập không chịu thuế khác', opts.otherFree);
    d += row('Tổng thu nhập', r.totalIncome, { total: true });
    d += row('2 · Bảo hiểm, giảm trừ & thuế', 0, { head: true });
    d += row('BHXH (8% × căn cứ ' + fmt(r.baseSI) + 'đ)', r.bhxh, { neg: true });
    d += row('BHYT (1,5% × căn cứ ' + fmt(r.baseSI) + 'đ)', r.bhyt, { neg: true });
    d += row('BHTN (1% × căn cứ ' + fmt(r.baseUI) + 'đ)', r.bhtn, { neg: true });
    d += row('Giảm trừ gia cảnh (' + fmt(r.rules.selfDed) + 'đ + ' + opts.dependents + ' người phụ thuộc)', r.rules.selfDed + r.rules.depDed * opts.dependents, { neg: true });
    if (opts.otherDeduct > 0) d += row('Giảm trừ khác', opts.otherDeduct, { neg: true });
    d += row('Thu nhập tính thuế', r.assessable);
    d += row('Thuế TNCN phải nộp', r.tax.total, { neg: true });
    d += row('3 · Kết quả', 0, { head: true });
    d += row('Lương Net thực nhận', r.net, { total: true });
    d += row('Doanh nghiệp đóng thêm (BHXH 17,5% + BHYT 3% + BHTN 1% + KPCĐ 2%)', r.erTotal);
    d += row('Tổng chi phí doanh nghiệp', r.employerCost, { total: true });
    $('gn3-detail').innerHTML = d;

    var b = '';
    if (r.tax.rows.length === 0) {
      b = '<p class="gn3-note">Thu nhập tính thuế bằng 0 — chưa phát sinh thuế TNCN.</p>';
    } else {
      r.tax.rows.forEach(function (x) {
        b += row('Bậc ' + x.idx + ' — phần thu nhập ' + fmtD(x.span) + ' × ' + (x.rate * 100) + '%', x.tax);
      });
      b += row('Tổng thuế TNCN', r.tax.total, { total: true });
    }
    $('gn3-brackets').innerHTML = b;
  }

  function recalc() { updateHints(); render(); }

  document.querySelectorAll('[data-gn3-gross]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      $('gn3-inp-gross').value = parseInt(chip.getAttribute('data-gn3-gross'), 10).toLocaleString('vi-VN');
      recalc();
    });
  });
  $('gn3-dep-minus').addEventListener('click', function () {
    var v = Math.max(0, (parseInt($('gn3-inp-dep').value, 10) || 0) - 1);
    $('gn3-inp-dep').value = v; recalc();
  });
  $('gn3-dep-plus').addEventListener('click', function () {
    var v = Math.min(20, (parseInt($('gn3-inp-dep').value, 10) || 0) + 1);
    $('gn3-inp-dep').value = v; recalc();
  });
  $('gn3-ins-fixed').addEventListener('change', function () {
    $('gn3-ins-wrap').style.display = '';
    if (num($('gn3-inp-ins-base')) <= 0) {
      $('gn3-inp-ins-base').value = $('gn3-inp-gross').value;
      $('gn3-inp-ins-base').dispatchEvent(new Event('input', { bubbles: true }));
    } else { recalc(); }
  });
  $('gn3-ins-auto').addEventListener('change', function () { $('gn3-ins-wrap').style.display = 'none'; recalc(); });
  ['gn3-inp-gross', 'gn3-inp-dep', 'gn3-inp-meal', 'gn3-inp-other-tax', 'gn3-inp-other-free', 'gn3-inp-deduct', 'gn3-inp-ins-base'].forEach(function (id) {
    var el = $(id); if (el) { el.addEventListener('input', recalc); el.addEventListener('change', recalc); }
  });
  document.querySelectorAll('input[name="gn3-region"], input[name="gn3-regime"]').forEach(function (el) {
    el.addEventListener('change', recalc);
  });

  capMoney($('gn3-inp-gross'), $('gn3-gross-cap'));
  capMoney($('gn3-inp-ins-base'), $('gn3-ins-cap'));
  capMoney($('gn3-inp-meal'), $('gn3-meal-cap'));
  capMoney($('gn3-inp-other-tax'), $('gn3-othertax-cap'));
  capMoney($('gn3-inp-other-free'), $('gn3-otherfree-cap'));
  capMoney($('gn3-inp-deduct'), $('gn3-deduct-cap'));

  function summaryText() {
    if (!last) return '';
    var r = last, o = lastOpts;
    return [
      'KẾT QUẢ TÍNH LƯƠNG GROSS → NET — CongCuViet.com',
      'Bộ quy định: ' + o.regime + ' · Vùng ' + o.region + ' · Người phụ thuộc: ' + o.dependents,
      'Lương Gross: ' + fmtD(r.gross) + '/tháng',
      'Bảo hiểm bạn đóng: ' + fmtD(r.insTotal) + ' (BHXH ' + fmtD(r.bhxh) + ' + BHYT ' + fmtD(r.bhyt) + ' + BHTN ' + fmtD(r.bhtn) + ')',
      'Thu nhập tính thuế: ' + fmtD(r.assessable),
      'Thuế TNCN: ' + fmtD(r.tax.total) + '/tháng',
      '=> LƯƠNG NET THỰC NHẬN: ' + fmtD(r.net) + '/tháng (' + fmtD(r.net * 12) + '/năm)',
      'Tổng chi phí doanh nghiệp: ' + fmtD(r.employerCost) + '/tháng',
      'Tính tại: https://congcuviet.com/cong-cu/cong-cu-tinh-luong-gross-sang-net/'
    ].join('\n');
  }
  $('gn3-btn-copy').addEventListener('click', function () {
    var txt = summaryText();
    function done() { $('gn3-copy-msg').textContent = '✅ Đã sao chép kết quả.'; }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(done, done); } else { done(); }
  });
  $('gn3-btn-dl').addEventListener('click', function () {
    var blob = new Blob([summaryText()], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'CongCuViet-luong-gross-net.txt';
    document.body.appendChild(a); a.click(); a.remove();
  });

  recalc();
});
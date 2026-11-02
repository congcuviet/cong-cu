document.addEventListener('DOMContentLoaded', function () {

  /* ===== PURE LOGIC ===== */
  function em2PMT(P, r, n) {
    if (n <= 0) return 0;
    if (r === 0) return P / n;
    var f = Math.pow(1 + r, n);
    return P * r * f / (f - 1);
  }

  // method: 'reducing' | 'flat'; plan: 'annuity' | 'equal' (only for reducing)
  // extra: { amount, month } — extra principal paid right after that month's regular payment
  function em2Build(P, rM, n, method, plan, extra) {
    var rows = [], bal = P, totalInt = 0, totalPay = 0;
    var pmt = (method === 'reducing' && plan === 'annuity') ? em2PMT(P, rM, n) : 0;
    var princBase = P / n;
    var flatInt = P * rM;
    for (var k = 1; k <= n && bal > 0.005; k++) {
      var open = bal, inter, princ, pay;
      if (method === 'flat') {
        inter = flatInt;
        princ = Math.min(princBase, bal);
        if (k === n) princ = bal;
      } else if (plan === 'equal') {
        inter = bal * rM;
        princ = Math.min(princBase, bal);
        if (k === n) princ = bal;
      } else {
        inter = bal * rM;
        princ = pmt - inter;
        if (k === n || princ > bal) princ = bal;
      }
      pay = princ + inter;
      bal -= princ;
      var extraApplied = 0;
      if (extra && extra.amount > 0 && k === extra.month && bal > 0.005) {
        extraApplied = Math.min(extra.amount, bal);
        bal -= extraApplied;
      }
      totalInt += inter;
      totalPay += pay + extraApplied;
      rows.push({ k: k, open: open, princ: princ, inter: inter, pay: pay, extra: extraApplied, close: Math.max(0, bal) });
      if (bal <= 0.005) break;
    }
    return { rows: rows, totalInt: totalInt, totalPay: totalPay, months: rows.length };
  }

  // Solve the reducing-balance monthly rate whose annuity payment equals the flat payment
  function em2EffectiveRate(P, flatPay, n) {
    if (P <= 0 || n <= 0 || flatPay * n <= P) return 0;
    var lo = 0, hi = 0.2;
    for (var i = 0; i < 80; i++) {
      var mid = (lo + hi) / 2;
      if (em2PMT(P, mid, n) < flatPay) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }
  /* ===== PURE LOGIC END ===== */

  function $(id) { return document.getElementById(id); }
  function num(el) { if (!el) return 0; var v = String(el.value || '').replace(/[^\d]/g, ''); var x = parseFloat(v); return isNaN(x) ? 0 : x; }
  function numDec(el) { if (!el) return 0; var v = String(el.value || '').replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'); var x = parseFloat(v); return isNaN(x) ? 0 : x; }
  function fmt(n) { return Math.round(n).toLocaleString('vi-VN'); }
  function fmtD(n) { return fmt(n) + ' đ'; }
  function pctTxt(x) { return (x * 100).toFixed(1).replace('.', ',') + '%'; }

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
  document.querySelectorAll('.em2-money').forEach(bindMoney);

  function readOpts() {
    var termChecked = document.querySelector('input[name="em2-term"]:checked');
    var months = (termChecked && termChecked.value !== 'custom')
      ? parseInt(termChecked.value, 10)
      : (parseInt($('em2-inp-months').value, 10) || 0);
    months = Math.max(0, Math.min(600, months || 0));
    var rateVal = numDec($('em2-inp-rate'));
    var rM = $('em2-rate-year').checked ? rateVal / 100 / 12 : rateVal / 100;
    return {
      amount: num($('em2-inp-amount')),
      months: months,
      rateVal: rateVal,
      rateUnit: $('em2-rate-year').checked ? 'year' : 'month',
      rM: rM,
      method: $('em2-m-flat').checked ? 'flat' : 'reducing',
      plan: $('em2-p-equal').checked ? 'equal' : 'annuity',
      income: num($('em2-inp-income')),
      extra: {
        amount: num($('em2-inp-extra')),
        month: parseInt($('em2-inp-extra-month').value, 10) || 0,
        feePct: numDec($('em2-inp-extra-fee'))
      }
    };
  }

  var last = null, lastOpts = null, lastBase = null;

  function render() {
    var o = readOpts();
    lastOpts = o;
    $('em2-method-note').textContent = o.method === 'flat'
      ? 'Lãi tính trên toàn bộ số tiền vay ban đầu trong suốt kỳ hạn — cách báo giá quen thuộc của vay tiêu dùng, trả góp điện máy, thẻ tín dụng.'
      : 'Lãi tính trên số tiền còn nợ thực tế, giảm dần theo từng tháng — chuẩn vay ngân hàng (mua nhà, mua xe, vay thế chấp).';
    var extra = (o.extra.amount > 0 && o.extra.month >= 1) ? o.extra : null;
    var base = em2Build(o.amount, o.rM, o.months, o.method, o.plan, null);
    var res = extra ? em2Build(o.amount, o.rM, o.months, o.method, o.plan, extra) : base;
    last = res; lastBase = base;

    var first = res.rows[0], lastRow = res.rows[res.rows.length - 1];
    if (!first) {
      $('em2-out-pay').textContent = '0 đ';
      $('em2-verdict').textContent = 'Nhập số tiền vay, lãi suất và thời hạn để xem kết quả.';
    } else if (o.method === 'reducing' && o.plan === 'equal') {
      $('em2-out-pay').textContent = fmtD(first.pay) + ' → ' + fmtD(lastRow.pay);
      $('em2-verdict').textContent = 'Gốc trả đều mỗi tháng nên số tiền phải trả cao nhất ở tháng đầu (' + fmtD(first.pay) + ') rồi giảm dần còn ' + fmtD(lastRow.pay) + ' ở tháng cuối.';
    } else {
      $('em2-out-pay').textContent = fmtD(first.pay);
      $('em2-verdict').textContent = 'Vay ' + fmtD(o.amount) + ' trong ' + o.months + ' tháng: trả đều ' + fmtD(first.pay) + '/tháng' + (extra ? ' (chưa tính khoản trả thêm trước hạn)' : '') + '.';
    }

    var insights = '';
    if (o.method === 'flat' && first && o.rM > 0) {
      var eff = em2EffectiveRate(o.amount, first.pay, o.months);
      if (eff > 0) {
        var rateDisp = o.rateUnit === 'year' ? (o.rateVal + '%/năm') : (o.rateVal + '%/tháng');
        insights += '<p class="em2-insight em2-insight-warn">⚠️ Lãi phẳng ' + rateDisp + ' tương đương lãi suất dư nợ giảm dần khoảng <strong>' + (eff * 12 * 100).toFixed(1).replace('.', ',') + '%/năm</strong>. Đừng so mức lãi phẳng này trực tiếp với lãi vay ngân hàng tính theo dư nợ giảm dần.</p>';
      }
    }
    if (extra && first) {
      var applied = 0;
      res.rows.forEach(function (r) { applied += r.extra; });
      var fee = applied * o.extra.feePct / 100;
      var saved = base.totalInt - res.totalInt;
      var netGain = saved - fee;
      insights += '<p class="em2-insight">💡 Trả thêm ' + fmtD(applied) + ' vào tháng ' + o.extra.month + ': tiết kiệm ' + fmtD(saved) + ' tiền lãi' +
        (o.extra.feePct > 0 ? ', phí trả trước ' + fmtD(fee) + ' → ' + (netGain >= 0 ? 'lợi ròng ' : 'lỗ ròng ') + fmtD(Math.abs(netGain)) : '') +
        (res.months < base.months ? ', rút ngắn ' + (base.months - res.months) + ' tháng vay' : '') + '.</p>';
    }
    if (o.income > 0 && first) {
      var payRef = first.pay;
      var ratio = payRef / o.income;
      insights += '<p class="em2-insight">📊 Khoản trả tháng đầu bằng <strong>' + pctTxt(ratio) + '</strong> thu nhập của bạn' +
        (ratio <= 0.4 ? ' — trong ngưỡng an toàn thường dùng (≤ 40%).' : ' — cao hơn ngưỡng an toàn thường dùng (≤ 40% thu nhập), nên cân nhắc giảm số tiền vay hoặc kéo dài kỳ hạn.') + '</p>';
    }
    $('em2-insights').innerHTML = insights;

    $('em2-out-interest').textContent = fmt(res.totalInt);
    $('em2-out-total').textContent = fmt(res.totalPay);
    $('em2-out-intpct').textContent = res.totalPay > 0 ? pctTxt(res.totalInt / res.totalPay) : '0%';

    var yHtml = '', acc = { p: 0, i: 0, t: 0 }, curYear = 1;
    res.rows.forEach(function (r, idx) {
      acc.p += r.princ + r.extra; acc.i += r.inter; acc.t += r.pay + r.extra;
      if ((idx + 1) % 12 === 0 || idx === res.rows.length - 1) {
        yHtml += '<tr><td>' + curYear + '</td><td>' + fmt(acc.p) + '</td><td>' + fmt(acc.i) + '</td><td>' + fmt(acc.t) + '</td><td>' + fmt(r.close) + '</td></tr>';
        acc = { p: 0, i: 0, t: 0 }; curYear++;
      }
    });
    $('em2-year-body').innerHTML = yHtml;

    var mHtml = '';
    res.rows.forEach(function (r) {
      mHtml += '<tr><td>' + r.k + '</td><td>' + fmt(r.open) + '</td><td>' + fmt(r.princ + r.extra) + '</td><td>' + fmt(r.inter) + '</td><td>' + fmt(r.pay + r.extra) + '</td><td>' + fmt(r.close) + '</td></tr>';
    });
    $('em2-month-body').innerHTML = mHtml;
  }

  function recalc() { render(); }

  document.querySelectorAll('[data-em2-amount]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      $('em2-inp-amount').value = parseInt(chip.getAttribute('data-em2-amount'), 10).toLocaleString('vi-VN');
      recalc();
    });
  });
  document.querySelectorAll('input[name="em2-term"]').forEach(function (el) {
    el.addEventListener('change', function () {
      $('em2-term-wrap').style.display = $('em2-term-custom').checked ? '' : 'none';
      recalc();
    });
  });
  ['em2-inp-amount', 'em2-inp-months', 'em2-inp-rate', 'em2-inp-income', 'em2-inp-extra', 'em2-inp-extra-month', 'em2-inp-extra-fee'].forEach(function (id) {
    var el = $(id); if (el) { el.addEventListener('input', recalc); el.addEventListener('change', recalc); }
  });
  document.querySelectorAll('input[name="em2-rateunit"], input[name="em2-method"], input[name="em2-plan"]').forEach(function (el) {
    el.addEventListener('change', recalc);
  });

  capMoney($('em2-inp-amount'), $('em2-amount-cap'));
  capMoney($('em2-inp-income'), $('em2-income-cap'));
  capMoney($('em2-inp-extra'), $('em2-extra-cap'));

  function summaryText() {
    if (!last || !lastOpts || !last.rows.length) return '';
    var o = lastOpts, r = last;
    return [
      'KẾT QUẢ TÍNH KHOẢN VAY — CongCuViet.com',
      'Số tiền vay: ' + fmtD(o.amount) + ' · Thời hạn: ' + o.months + ' tháng · Lãi suất: ' + o.rateVal + (o.rateUnit === 'year' ? '%/năm' : '%/tháng'),
      'Cách tính lãi: ' + (o.method === 'flat' ? 'Lãi phẳng (trên nợ gốc)' : 'Dư nợ giảm dần' + (o.plan === 'equal' ? ' — gốc đều' : ' — gốc + lãi đều')),
      'Trả mỗi tháng: ' + $('em2-out-pay').textContent,
      'Tổng tiền lãi: ' + fmtD(r.totalInt),
      'Tổng phải trả: ' + fmtD(r.totalPay),
      'Tính tại: https://congcuviet.com/cong-cu/cong-cu-tinh-toan-khoan-vay-va-tra-gop-loan-emi-calculator/'
    ].join('\n');
  }
  $('em2-btn-copy').addEventListener('click', function () {
    var txt = summaryText();
    function done() { $('em2-copy-msg').textContent = '✅ Đã sao chép kết quả.'; }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(done, done); } else { done(); }
  });
  $('em2-btn-dl').addEventListener('click', function () {
    if (!last) return;
    var lines = ['Ky;Du no dau ky;Goc;Lai;Tong tra;Du no con lai'];
    last.rows.forEach(function (r) {
      lines.push([r.k, Math.round(r.open), Math.round(r.princ + r.extra), Math.round(r.inter), Math.round(r.pay + r.extra), Math.round(r.close)].join(';'));
    });
    var blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'CongCuViet-lich-tra-no.csv';
    document.body.appendChild(a); a.click(); a.remove();
  });

  recalc();
});
document.addEventListener('DOMContentLoaded', function() {
  var REGIMES = {
    current: { label: 'Hiện tại (từ 01/07/2026)', cap: 50600000, minWage: { '1': 5310000, '2': 4730000, '3': 4140000, '4': 3700000 }, hint: 'Trần BHXH/BHYT 50.600.000đ (20 × lương cơ sở 2.530.000đ, NĐ 161/2026); trần BHTN = 20 × lương tối thiểu vùng 2026 (NĐ 293/2025).' },
    old: { label: 'Trước 01/07/2026 (đối chiếu)', cap: 46800000, minWage: { '1': 4960000, '2': 4410000, '3': 3860000, '4': 3450000 }, hint: 'Trần BHXH/BHYT 46.800.000đ (20 × 2.340.000đ); trần BHTN = 20 × lương tối thiểu vùng cũ (NĐ 74/2024). Chỉ dùng để đối chiếu kỳ lương cũ.' }
  };
  var RATES = { emp: { bhxh: 0.08, bhyt: 0.015, bhtn: 0.01 }, com: { bhxh: 0.175, bhyt: 0.03, bhtn: 0.01 } };
  var REGION_NAMES = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV' };

  var inp = document.getElementById('bh2-inp-salary');
  var capEl = document.getElementById('bh2-salary-cap');
  var errEl = document.getElementById('bh2-err');
  var heroEl = document.getElementById('bh2-hero');
  var verdictEl = document.getElementById('bh2-verdict');
  var regionHint = document.getElementById('bh2-region-hint');
  var regimeHint = document.getElementById('bh2-regime-hint');
  var detailEl = document.getElementById('bh2-detail');

  function fmt(n) { return new Intl.NumberFormat('vi-VN').format(Math.round(n)); }
  function parseMoney(el) { var v = el.value.replace(/\D/g, ''); return v ? parseInt(v, 10) : 0; }

  // Vietnamese number words (group-skipping algorithm from the Gross→Net v3 tool:
  // zero groups are omitted, so 15.000.000 reads "Mười lăm triệu đồng").
  var CHU = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  function docBaSo(n, full) {
    var tr = Math.floor(n / 100), ch = Math.floor((n % 100) / 10), dv = n % 10, s = '';
    if (full || tr > 0) s += CHU[tr] + ' trăm';
    if (ch === 0 && dv > 0) { if (s) s += ' lẻ'; s += ' ' + CHU[dv]; }
    else if (ch === 1) { s += ' mười'; if (dv === 5) s += ' lăm'; else if (dv > 0) s += ' ' + CHU[dv]; }
    else if (ch > 1) { s += ' ' + CHU[ch] + ' mươi'; if (dv === 1) s += ' mốt'; else if (dv === 5) s += ' lăm'; else if (dv > 0) s += ' ' + CHU[dv]; }
    return s.trim();
  }
  function readWords(n) {
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

  function regime() { var r = document.querySelector('input[name="bh2-regime"]:checked'); return REGIMES[r ? r.value : 'current']; }
  function region() { var r = document.querySelector('input[name="bh2-region"]:checked'); return r ? r.value : '1'; }

  function calc() {
    var salary = parseMoney(inp);
    var rg = regime(), reg = region();
    var bhtnCap = rg.minWage[reg] * 20;
    regionHint.textContent = 'Lương tối thiểu vùng ' + REGION_NAMES[reg] + ': ' + fmt(rg.minWage[reg]) + 'đ/tháng; trần BHTN vùng này: ' + fmt(bhtnCap) + 'đ.';
    regimeHint.textContent = rg.hint;
    if (salary > 0) capEl.textContent = readWords(salary); else capEl.textContent = '';
    if (salary <= 0) {
      errEl.hidden = false;
      errEl.textContent = 'Nhập mức lương đóng bảo hiểm lớn hơn 0 để tính (ví dụ 15.000.000).';
      heroEl.style.display = 'none';
      verdictEl.textContent = '';
      document.getElementById('bh2-out-emp').textContent = '0 đ';
      document.getElementById('bh2-out-com').textContent = '0 đ';
      document.getElementById('bh2-out-base1').textContent = '0';
      document.getElementById('bh2-out-base2').textContent = '0';
      document.getElementById('bh2-out-remain').textContent = '0';
      document.getElementById('bh2-out-year').textContent = '0';
      detailEl.innerHTML = '';
      return;
    }
    errEl.hidden = true;
    heroEl.style.display = '';
    var base1 = Math.min(salary, rg.cap);
    var base2 = Math.min(salary, bhtnCap);
    var cap1 = salary > rg.cap, cap2 = salary > bhtnCap;
    var e = { bhxh: Math.round(base1 * RATES.emp.bhxh), bhyt: Math.round(base1 * RATES.emp.bhyt), bhtn: Math.round(base2 * RATES.emp.bhtn) };
    var c = { bhxh: Math.round(base1 * RATES.com.bhxh), bhyt: Math.round(base1 * RATES.com.bhyt), bhtn: Math.round(base2 * RATES.com.bhtn) };
    var empTotal = e.bhxh + e.bhyt + e.bhtn, comTotal = c.bhxh + c.bhyt + c.bhtn;
    document.getElementById('bh2-out-emp').textContent = '- ' + fmt(empTotal) + ' đ';
    document.getElementById('bh2-out-com').textContent = '+ ' + fmt(comTotal) + ' đ';
    document.getElementById('bh2-out-base1').textContent = fmt(base1) + (cap1 ? ' *' : '');
    document.getElementById('bh2-out-base2').textContent = fmt(base2) + (cap2 ? ' *' : '');
    document.getElementById('bh2-out-remain').textContent = fmt(salary - empTotal);
    document.getElementById('bh2-out-year').textContent = fmt((empTotal + comTotal) * 12);
    if (cap1 && cap2) verdictEl.textContent = 'Đã chạm cả hai trần: BHXH/BHYT tính trên ' + fmt(rg.cap) + 'đ và BHTN vùng ' + REGION_NAMES[reg] + ' tính trên ' + fmt(bhtnCap) + 'đ — phần lương vượt trần không làm tăng khoản đóng.';
    else if (cap1) verdictEl.textContent = 'Đã chạm trần BHXH/BHYT (căn cứ ' + fmt(rg.cap) + 'đ); BHTN vẫn tính trên toàn bộ lương vì chưa vượt trần vùng ' + REGION_NAMES[reg] + ' (' + fmt(bhtnCap) + 'đ).';
    else verdictEl.textContent = 'Mức lương này chưa chạm trần nào — cả ba khoản đều tính trên toàn bộ lương nhập.';
    var rows = [
      ['BHXH', '8%', e.bhxh, '17,5%', c.bhxh],
      ['BHYT', '1,5%', e.bhyt, '3%', c.bhyt],
      ['BHTN', '1%', e.bhtn, '1%', c.bhtn]
    ];
    var html = '<div class="bh2-row bh2-row-head"><span>Loại bảo hiểm</span><span>Người lao động</span><span>Doanh nghiệp</span></div>';
    rows.forEach(function(r) {
      html += '<div class="bh2-row"><span><b>' + r[0] + '</b> (' + r[1] + ' / ' + r[3] + ')</span><span><b>' + fmt(r[2]) + ' đ</b></span><span><b>' + fmt(r[4]) + ' đ</b></span></div>';
    });
    html += '<div class="bh2-row bh2-row-total"><span>TỔNG (10,5% / 21,5%)</span><span><b>' + fmt(empTotal) + ' đ</b></span><span><b>' + fmt(comTotal) + ' đ</b></span></div>';
    html += '<div class="bh2-row"><span>Căn cứ BHXH/BHYT' + (cap1 ? ' (đã chạm trần)' : '') + '</span><span><b>' + fmt(base1) + ' đ</b></span><span></span></div>';
    html += '<div class="bh2-row"><span>Căn cứ BHTN vùng ' + REGION_NAMES[reg] + (cap2 ? ' (đã chạm trần)' : '') + '</span><span><b>' + fmt(base2) + ' đ</b></span><span></span></div>';
    html += '<div class="bh2-row"><span>Tổng đóng cả năm (NLĐ + DN) × 12</span><span><b>' + fmt((empTotal + comTotal) * 12) + ' đ</b></span><span></span></div>';
    detailEl.innerHTML = html;
    window.__bh2Last = { salary: salary, region: reg, regime: rg.label, empTotal: empTotal, comTotal: comTotal, e: e, c: c, base1: base1, base2: base2 };
  }

  inp.addEventListener('input', function() {
    var v = inp.value.replace(/\D/g, '');
    inp.value = v ? new Intl.NumberFormat('vi-VN').format(v) : '';
    calc();
  });
  document.querySelectorAll('input[name="bh2-region"], input[name="bh2-regime"]').forEach(function(r) { r.addEventListener('change', calc); });
  document.querySelectorAll('[data-bh2-salary]').forEach(function(b) {
    b.addEventListener('click', function() {
      inp.value = new Intl.NumberFormat('vi-VN').format(parseInt(b.getAttribute('data-bh2-salary'), 10));
      calc();
    });
  });
  function summaryText() {
    var L = window.__bh2Last; if (!L) return '';
    return 'BHXH/BHYT/BHTN (' + L.regime + ', vùng ' + REGION_NAMES[L.region] + '): lương đóng ' + fmt(L.salary) + 'đ; NLĐ đóng ' + fmt(L.empTotal) + 'đ (BHXH ' + fmt(L.e.bhxh) + ', BHYT ' + fmt(L.e.bhyt) + ', BHTN ' + fmt(L.e.bhtn) + '); DN đóng ' + fmt(L.comTotal) + 'đ (BHXH ' + fmt(L.c.bhxh) + ', BHYT ' + fmt(L.c.bhyt) + ', BHTN ' + fmt(L.c.bhtn) + '). Nguồn: Công Cụ Việt.';
  }
  document.getElementById('bh2-btn-copy').addEventListener('click', function() {
    var t = summaryText(); if (!t) return;
    var msg = document.getElementById('bh2-copy-msg');
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(function() { msg.textContent = 'Đã sao chép.'; }, function() { msg.textContent = 'Không sao chép được, hãy bôi đen và copy thủ công.'; });
    else msg.textContent = 'Trình duyệt không hỗ trợ sao chép tự động.';
  });
  document.getElementById('bh2-btn-dl').addEventListener('click', function() {
    var t = summaryText(); if (!t) return;
    var blob = new Blob([t], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ket-qua-bhxh.txt'; a.click(); URL.revokeObjectURL(a.href);
  });
  calc();
});
document.addEventListener('DOMContentLoaded', function () {

  /* ===== PURE LOGIC ===== */
  var TD2_LEVELS = [
    { mult: 1.2, label: 'Ít vận động' },
    { mult: 1.375, label: 'Vận động nhẹ' },
    { mult: 1.55, label: 'Vận động vừa' },
    { mult: 1.725, label: 'Vận động nặng' },
    { mult: 1.9, label: 'Rất nặng' }
  ];
  function td2BMR(sex, age, weight, height, bfPct) {
    if (bfPct > 0 && bfPct < 70) {
      var lbm = weight * (1 - bfPct / 100);
      return { bmr: 370 + 21.6 * lbm, formula: 'Katch-McArdle', lbm: lbm };
    }
    var b = 10 * weight + 6.25 * height - 5 * age + (sex === 'm' ? 5 : -161);
    return { bmr: b, formula: 'Mifflin-St Jeor', lbm: 0 };
  }
  function td2Goals(tdee, sex) {
    var floor = sex === 'm' ? 1500 : 1200;
    function clamp(v) { return Math.max(v, floor); }
    return {
      floor: floor,
      rows: [
        { label: 'Giảm cân chuẩn', note: '≈ −0,5 kg/tuần', kcal: Math.round(clamp(tdee - 550)), raw: tdee - 550 },
        { label: 'Giảm cân nhẹ', note: '≈ −0,25 kg/tuần', kcal: Math.round(clamp(tdee - 275)), raw: tdee - 275 },
        { label: 'Giữ cân (duy trì)', note: 'mức TDEE của bạn', kcal: Math.round(tdee), raw: tdee },
        { label: 'Tăng cân nhẹ', note: '≈ +0,25 kg/tuần', kcal: Math.round(tdee + 275), raw: tdee + 275 },
        { label: 'Tăng cân chuẩn', note: '≈ +0,5 kg/tuần', kcal: Math.round(tdee + 550), raw: tdee + 550 }
      ]
    };
  }
  /* ===== PURE LOGIC END ===== */

  function $(id) { return document.getElementById(id); }
  function numDec(el) { if (!el) return 0; var v = String(el.value || '').replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'); var x = parseFloat(v); return isNaN(x) ? 0 : x; }
  function fmt(n) { return Math.round(n).toLocaleString('vi-VN'); }
  function fmt1(n) { return n.toFixed(1).replace('.', ','); }

  var CHU = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  function docBaSo(n, full) {
    var tr = Math.floor(n / 100), ch = Math.floor((n % 100) / 10), dv = n % 10, s = '';
    if (full || tr > 0) s += CHU[tr] + ' trăm';
    if (ch === 0 && dv > 0) { if (s) s += ' lẻ'; s += ' ' + CHU[dv]; }
    else if (ch === 1) { s += ' mười'; if (dv === 5) s += ' lăm'; else if (dv > 0) s += ' ' + CHU[dv]; }
    else if (ch > 1) { s += ' ' + CHU[ch] + ' mươi'; if (dv === 1) s += ' mốt'; else if (dv === 5) s += ' lăm'; else if (dv > 0) s += ' ' + CHU[dv]; }
    return s.trim();
  }
  function docSoNguyen(n) {
    n = Math.round(Math.abs(n));
    if (n === 0) return 'Không';
    var donVi = ['', ' nghìn', ' triệu', ' tỷ'];
    var groups = [], x = n;
    while (x > 0) { groups.push(x % 1000); x = Math.floor(x / 1000); }
    var parts = [];
    for (var i = groups.length - 1; i >= 0; i--) {
      if (groups[i] === 0) continue;
      parts.push(docBaSo(groups[i], i < groups.length - 1) + donVi[i]);
    }
    var s = parts.join(' ').replace(/\s+/g, ' ').trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  var last = null;

  function render() {
    var sex = $('td2-sex-m').checked ? 'm' : 'f';
    var age = numDec($('td2-inp-age'));
    var weight = numDec($('td2-inp-weight'));
    var height = numDec($('td2-inp-height'));
    var bf = numDec($('td2-inp-bf'));
    var actEl = document.querySelector('input[name="td2-act"]:checked');
    var mult = actEl ? parseFloat(actEl.value) : 1.55;

    $('td2-weight-cap').textContent = weight > 0 ? '≈ ' + docSoNguyen(weight) + ' kilôgam' : '';
    $('td2-height-cap').textContent = height > 0 ? '= ' + (height / 100).toFixed(2).replace('.', ',').replace(/0$/, '').replace(/,$/, '') + ' mét' : '';

    if (age < 10 || age > 100 || weight < 25 || weight > 400 || height < 100 || height > 250) {
      $('td2-out-tdee').textContent = '—';
      $('td2-verdict').textContent = 'Nhập tuổi (10–100), cân nặng (25–400 kg) và chiều cao (100–250 cm) để xem kết quả.';
      $('td2-out-bmr').textContent = '—';
      $('td2-out-week').textContent = '—';
      $('td2-goals').innerHTML = '';
      $('td2-floor-note').textContent = '';
      last = null;
      return;
    }

    var b = td2BMR(sex, age, weight, height, bf);
    var tdee = b.bmr * mult;
    last = { sex: sex, age: age, weight: weight, height: height, bf: bf, mult: mult, bmr: b.bmr, tdee: tdee, formula: b.formula };

    $('td2-out-tdee').textContent = fmt(tdee) + ' kcal';
    $('td2-verdict').textContent = 'BMR ' + fmt(b.bmr) + ' kcal × hệ số vận động ' + String(mult).replace('.', ',') + ' — ăn quanh mức này thì cân nặng giữ nguyên.';
    $('td2-out-bmr').textContent = fmt(b.bmr) + ' kcal';
    $('td2-out-week').textContent = fmt(tdee * 7) + ' kcal';

    $('td2-bf-note').textContent = bf > 0
      ? 'Đang dùng công thức Katch-McArdle theo khối nạc (' + fmt1(b.lbm) + ' kg) — thường sát hơn Mifflin khi bạn biết rõ % mỡ. Chưa biết % mỡ của mình? Đo ở công cụ Tỷ lệ mỡ cơ thể (link cuối trang).'
      : '';

    var g = td2Goals(tdee, sex);
    var clamped = false;
    var html = '';
    g.rows.forEach(function (r) {
      var isClamped = r.raw < g.floor && r.kcal === g.floor;
      if (isClamped) clamped = true;
      html += '<div class="td2-row"><span>' + r.label + ' <span class="td2-note">(' + r.note + ')</span></span><b>' + fmt(r.kcal) + ' kcal</b></div>';
    });
    $('td2-goals').innerHTML = html;
    $('td2-floor-note').textContent = clamped
      ? '⚠️ Một số mức giảm đã được nâng lên sàn an toàn ' + fmt(g.floor) + ' kcal/ngày cho ' + (sex === 'm' ? 'nam' : 'nữ') + ' — không nên ăn thấp hơn mức này nếu không có theo dõi y tế; giảm chậm hơn một chút sẽ bền hơn.'
      : '';

    var lv = '';
    TD2_LEVELS.forEach(function (L) {
      lv += '<tr' + (Math.abs(L.mult - mult) < 0.001 ? ' class="td2-hl"' : '') + '><td>' + L.label + '</td><td>×' + String(L.mult).replace('.', ',') + '</td><td>' + fmt(b.bmr * L.mult) + '</td></tr>';
    });
    $('td2-levels-body').innerHTML = lv;
  }

  ['td2-inp-age', 'td2-inp-weight', 'td2-inp-height', 'td2-inp-bf'].forEach(function (id) {
    var el = $(id); if (el) { el.addEventListener('input', render); el.addEventListener('change', render); }
  });
  document.querySelectorAll('input[name="td2-sex"], input[name="td2-act"]').forEach(function (el) { el.addEventListener('change', render); });

  $('td2-btn-copy').addEventListener('click', function () {
    if (!last) return;
    var g = td2Goals(last.tdee, last.sex);
    var lines = g.rows.map(function (r) { return r.label + ': ' + fmt(r.kcal) + ' kcal/ngày'; });
    var t = [
      'KẾT QUẢ TÍNH TDEE — CongCuViet.com',
      (last.sex === 'm' ? 'Nam' : 'Nữ') + ', ' + last.age + ' tuổi, ' + fmt1(last.weight) + ' kg, ' + fmt1(last.height) + ' cm',
      'BMR (' + last.formula + '): ' + fmt(last.bmr) + ' kcal · TDEE (×' + String(last.mult).replace('.', ',') + '): ' + fmt(last.tdee) + ' kcal/ngày'
    ].concat(lines).concat(['Tính tại: https://congcuviet.com/cong-cu/cong-cu-tinh-luong-calo-tieu-thu-hang-ngay-tdee/']).join('\n');
    function done() { $('td2-copy-msg').textContent = '✅ Đã sao chép kết quả.'; }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(done, done); } else { done(); }
  });

  render();
});

document.addEventListener('DOMContentLoaded', function () {

  /* ===== PURE LOGIC — Asian cutoffs, Vietnam Ministry of Health 2022 (Decision 2892/QD-BYT) / IDI & WPRO ===== */
  var BM2_CLASSES = [
    { key: 'gay3', label: 'Gầy độ III', min: 0, max: 16 },
    { key: 'gay2', label: 'Gầy độ II', min: 16, max: 17 },
    { key: 'gay1', label: 'Gầy độ I', min: 17, max: 18.5 },
    { key: 'bt', label: 'Bình thường', min: 18.5, max: 23 },
    { key: 'tc', label: 'Thừa cân', min: 23, max: 25 },
    { key: 'bp1', label: 'Béo phì độ I', min: 25, max: 30 },
    { key: 'bp2', label: 'Béo phì độ II', min: 30, max: 35 },
    { key: 'bp3', label: 'Béo phì độ III', min: 35, max: Infinity }
  ];
  function bm2Round1(x) { return Math.round(x * 10) / 10; }
  function bm2Classify(bmiR) {
    for (var i = 0; i < BM2_CLASSES.length; i++) {
      if (bmiR >= BM2_CLASSES[i].min && bmiR < BM2_CLASSES[i].max) return BM2_CLASSES[i];
    }
    return BM2_CLASSES[BM2_CLASSES.length - 1];
  }
  function bm2Compute(heightCm, weightKg) {
    var h = heightCm / 100;
    var bmi = weightKg / (h * h);
    var bmiR = bm2Round1(bmi);
    return {
      bmi: bmi, bmiR: bmiR, cls: bm2Classify(bmiR),
      healthyMin: 18.5 * h * h, healthyMax: 22.9 * h * h
    };
  }
  /* ===== PURE LOGIC END ===== */

  function $(id) { return document.getElementById(id); }
  function numDec(el) { if (!el) return 0; var v = String(el.value || '').replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'); var x = parseFloat(v); return isNaN(x) ? 0 : x; }
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

  // classification table (rendered once)
  var classHtml = '';
  BM2_CLASSES.forEach(function (c) {
    var range = c.max === Infinity ? '≥ ' + fmt1(c.min) : fmt1(c.min) + ' – ' + fmt1(c.max - 0.1);
    if (c.key === 'gay3') range = '< 16,0';
    classHtml += '<tr data-bm2-class="' + c.key + '"><td>' + c.label + '</td><td>' + range + '</td></tr>';
  });
  $('bm2-class-body').innerHTML = classHtml;

  var last = null;

  function render() {
    var height = numDec($('bm2-inp-height'));
    var weight = numDec($('bm2-inp-weight'));
    $('bm2-height-cap').textContent = height > 0 ? '= ' + (height / 100).toFixed(2).replace('.', ',').replace(/0$/, '').replace(/,$/, '') + ' mét' : '';
    $('bm2-weight-cap').textContent = weight > 0 ? '≈ ' + docSoNguyen(weight) + ' kilôgam' : '';

    if (height < 50 || height > 250 || weight < 10 || weight > 500) {
      $('bm2-out-bmi').textContent = '—';
      $('bm2-out-cat').textContent = 'Nhập chiều cao (50–250 cm) và cân nặng (10–500 kg) để xem kết quả.';
      $('bm2-delta').textContent = '';
      $('bm2-out-range').textContent = '—';
      $('bm2-out-cat2').textContent = '—';
      last = null;
      return;
    }
    var r = bm2Compute(height, weight);
    last = { height: height, weight: weight, r: r };
    $('bm2-out-bmi').textContent = fmt1(r.bmiR);
    $('bm2-out-cat').textContent = r.cls.label + ' — theo chuẩn châu Á cho người Việt (Bộ Y tế 2022)';
    $('bm2-out-cat2').textContent = r.cls.label;
    $('bm2-out-range').textContent = fmt1(r.healthyMin) + ' – ' + fmt1(r.healthyMax) + ' kg';

    var pos = (r.bmiR - 14) / 26 * 100;
    pos = Math.max(0, Math.min(100, pos));
    $('bm2-gmark').style.left = pos + '%';

    document.querySelectorAll('#bm2-class-body tr').forEach(function (tr) {
      tr.classList.toggle('bm2-hl', tr.getAttribute('data-bm2-class') === r.cls.key);
    });

    var d = '';
    if (weight > r.healthyMax) {
      d = '📌 Để vào vùng cân nặng khỏe mạnh (' + fmt1(r.healthyMin) + ' – ' + fmt1(r.healthyMax) + ' kg), bạn cần giảm khoảng ' + fmt1(weight - r.healthyMax) + ' kg.';
    } else if (weight < r.healthyMin) {
      d = '📌 Để vào vùng cân nặng khỏe mạnh (' + fmt1(r.healthyMin) + ' – ' + fmt1(r.healthyMax) + ' kg), bạn cần tăng khoảng ' + fmt1(r.healthyMin - weight) + ' kg.';
    } else {
      d = '✅ Bạn đang trong vùng cân nặng khỏe mạnh — cách mép trên ' + fmt1(r.healthyMax - weight) + ' kg, cách mép dưới ' + fmt1(weight - r.healthyMin) + ' kg.';
    }
    $('bm2-delta').textContent = d;

    // waist
    var waist = numDec($('bm2-inp-waist'));
    var sex = $('bm2-sex-f').checked ? 'f' : 'm';
    if (waist > 0) {
      var lim = sex === 'f' ? 80 : 90;
      $('bm2-waist-note').textContent = waist >= lim
        ? '⚠️ Vòng eo ' + fmt1(waist) + ' cm ≥ ngưỡng ' + lim + ' cm cho ' + (sex === 'f' ? 'nữ' : 'nam') + ' châu Á — thuộc nhóm béo bụng (mỡ nội tạng cao), nên ưu tiên giảm vòng eo bên cạnh cân nặng.'
        : '✅ Vòng eo ' + fmt1(waist) + ' cm đang dưới ngưỡng béo bụng ' + lim + ' cm cho ' + (sex === 'f' ? 'nữ' : 'nam') + ' châu Á.';
    } else {
      $('bm2-waist-note').textContent = '';
    }
  }

  ['bm2-inp-height', 'bm2-inp-weight', 'bm2-inp-waist'].forEach(function (id) {
    var el = $(id); if (el) { el.addEventListener('input', render); el.addEventListener('change', render); }
  });
  document.querySelectorAll('input[name="bm2-sex"]').forEach(function (el) { el.addEventListener('change', render); });

  $('bm2-btn-copy').addEventListener('click', function () {
    if (!last) return;
    var t = [
      'KẾT QUẢ TÍNH BMI — CongCuViet.com',
      'Chiều cao: ' + fmt1(last.height) + ' cm · Cân nặng: ' + fmt1(last.weight) + ' kg',
      'BMI: ' + fmt1(last.r.bmiR) + ' — ' + last.r.cls.label + ' (chuẩn châu Á, Bộ Y tế 2022)',
      'Cân nặng khỏe mạnh cho chiều cao này: ' + fmt1(last.r.healthyMin) + ' – ' + fmt1(last.r.healthyMax) + ' kg',
      'Tính tại: https://congcuviet.com/cong-cu/cong-cu-tinh-chi-so-khoi-co-the-bmi-calculator/'
    ].join('\n');
    function done() { $('bm2-copy-msg').textContent = '✅ Đã sao chép kết quả.'; }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(done, done); } else { done(); }
  });

  render();
});
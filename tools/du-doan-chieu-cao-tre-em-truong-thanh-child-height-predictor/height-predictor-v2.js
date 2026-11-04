document.addEventListener('DOMContentLoaded', function() {
  var $ = function(id) { return document.getElementById(id); };
  var coeffs = {
    boy: { 4: [22.7, 0.75, 0.20, 0.40], 6: [18.5, 0.76, 0.18, 0.45], 8: [15.2, 0.78, 0.16, 0.48], 10: [11.0, 0.81, 0.12, 0.52], 12: [7.5, 0.83, 0.08, 0.55], 14: [4.2, 0.86, -0.05, 0.58], 16: [2.1, 0.90, -0.10, 0.60] },
    girl: { 4: [21.5, 0.73, 0.25, 0.38], 6: [17.8, 0.75, 0.22, 0.42], 8: [14.0, 0.77, 0.18, 0.46], 10: [9.5, 0.80, 0.10, 0.49], 12: [5.2, 0.85, 0.05, 0.52], 14: [2.5, 0.92, -0.02, 0.55], 16: [1.0, 0.95, -0.05, 0.58] }
  };
  function parseNum(raw) {
    var s = String(raw == null ? '' : raw).trim().replace(',', '.');
    if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
    return parseFloat(s);
  }
  function fmt1(v) {
    return (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');
  }
  function fmtSigned(v) {
    return (v >= 0 ? '+' : '') + fmt1(v);
  }
  var units = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  function under100(n) {
    if (n < 10) return units[n];
    if (n === 10) return 'mười';
    if (n < 20) return 'mười ' + (n === 15 ? 'lăm' : units[n - 10]);
    var t = Math.floor(n / 10), u = n % 10;
    var s = units[t] + ' mươi';
    if (u === 1) s += ' mốt';
    else if (u === 5) s += ' lăm';
    else if (u > 0) s += ' ' + units[u];
    return s;
  }
  function wordsInt(n) {
    if (n < 100) return under100(n);
    var h = Math.floor(n / 100), r = n % 100;
    var s = units[h] + ' trăm';
    if (r === 0) return s;
    if (r < 10) return s + ' lẻ ' + units[r];
    return s + ' ' + under100(r);
  }
  function wordsNum(v, unit) {
    if (!isFinite(v)) return '';
    var neg = v < 0, a = Math.abs(v);
    var ip = Math.floor(a), dp = Math.round((a - ip) * 10);
    var s = wordsInt(ip);
    if (dp > 0) s += ' phẩy ' + units[dp];
    return (neg ? 'âm ' : '') + s + ' ' + unit;
  }
  function coeffsFor(gender, age) {
    var data = coeffs[gender];
    if (data[age]) return data[age];
    var lower = age, upper = age;
    while (lower > 4 && !data[lower]) lower--;
    while (upper < 16 && !data[upper]) upper++;
    if (!data[lower]) return data[upper];
    if (!data[upper]) return data[lower];
    return data[lower].map(function(v, i) { return (v + data[upper][i]) / 2; });
  }
  function gender() {
    var el = document.querySelector('input[name="hp2-gender"]:checked');
    return el ? el.value : 'boy';
  }
  function method() {
    var el = document.querySelector('input[name="hp2-method"]:checked');
    return el ? el.value : 'tanner';
  }
  function showError(msg) {
    $('hp2-error').textContent = msg;
    $('hp2-error').hidden = false;
    $('hp2-result-body').hidden = true;
    $('hp2-result-empty').hidden = false;
  }
  function render() {
    var g = gender(), m = method();
    $('hp2-khamis').hidden = (m !== 'tanner' ? false : true);
    $('hp2-hero').className = 'hp2-hero' + (g === 'girl' ? ' hp2-girl' : '');
    var dad = parseNum($('hp2-dad').value), mom = parseNum($('hp2-mom').value);
    $('hp2-dad-words').textContent = isFinite(dad) ? wordsNum(dad, 'xentimét') : '';
    $('hp2-mom-words').textContent = isFinite(mom) ? wordsNum(mom, 'xentimét') : '';
    var age = NaN, ch = NaN, cw = NaN;
    if (m === 'khamis') {
      var ageRaw = String($('hp2-age').value).trim();
      age = /^\d+$/.test(ageRaw) ? parseInt(ageRaw, 10) : NaN;
      ch = parseNum($('hp2-cheight').value);
      cw = parseNum($('hp2-cweight').value);
      $('hp2-age-words').textContent = isFinite(age) ? wordsNum(age, 'tuổi') : '';
      $('hp2-cheight-words').textContent = isFinite(ch) ? wordsNum(ch, 'xentimét') : '';
      $('hp2-cweight-words').textContent = isFinite(cw) ? wordsNum(cw, 'kilôgam') : '';
    }
    $('hp2-error').hidden = true;
    if (!isFinite(dad)) return showError('Nhập chiều cao của Bố bằng số, ví dụ 172 hoặc 172,5.');
    if (dad < 120 || dad > 230) return showError('Chiều cao của Bố phải từ 120 đến 230 cm.');
    if (!isFinite(mom)) return showError('Nhập chiều cao của Mẹ bằng số, ví dụ 158 hoặc 158,5.');
    if (mom < 120 || mom > 230) return showError('Chiều cao của Mẹ phải từ 120 đến 230 cm.');
    var mid = g === 'boy' ? (dad + mom + 13) / 2 : (dad + mom - 13) / 2;
    var target, margin, name;
    if (m === 'tanner') {
      target = mid; margin = 8.5;
      name = 'Phương pháp: Cơ bản (Theo Gen Bố Mẹ)';
    } else {
      if (!isFinite(age)) return showError('Tuổi của bé phải là số nguyên, ví dụ 8.');
      if (age < 4 || age > 17) return showError('Phương pháp chi tiết chỉ áp dụng cho trẻ từ 4 đến 17 tuổi.');
      if (!isFinite(ch) || ch <= 0) return showError('Nhập chiều cao hiện tại của bé bằng số lớn hơn 0.');
      if (!isFinite(cw) || cw <= 0) return showError('Nhập cân nặng hiện tại của bé bằng số lớn hơn 0.');
      var cf = coeffsFor(g, age);
      target = cf[0] + cf[1] * ch + cf[2] * cw + cf[3] * mid;
      margin = age < 10 ? 5.3 : 3.8;
      name = 'Phương pháp: Chi tiết (Khamis-Roche)';
    }
    $('hp2-result-body').hidden = false;
    $('hp2-result-empty').hidden = true;
    $('hp2-hero-num').textContent = fmt1(target);
    $('hp2-method-name').textContent = name;
    $('hp2-min').textContent = fmt1(target - margin);
    $('hp2-mid').textContent = fmt1(target);
    $('hp2-max').textContent = fmt1(target + margin);
    $('hp2-margin-note').textContent = 'Khoảng hiển thị: ±' + fmt1(margin) + ' cm quanh kết quả chính.';
    if (m === 'khamis') {
      var diff = target - mid;
      $('hp2-compare').textContent = 'Phương pháp cơ bản cho cùng chiều cao bố mẹ: ' + fmt1(mid) + ' cm (chênh ' + fmtSigned(diff) + ' cm).';
      $('hp2-compare').hidden = false;
      var remain = target - ch;
      $('hp2-remain').textContent = remain >= 0 ? 'Còn cao thêm khoảng ' + fmt1(remain) + ' cm so với hiện tại.' : 'Thấp hơn chiều cao hiện tại ' + fmt1(-remain) + ' cm — kiểm tra lại số đo đã nhập.';
      $('hp2-remain').hidden = false;
      if (Math.abs(diff) > 10) {
        $('hp2-warn').textContent = '⚠️ Chênh lệch lớn so với phương pháp cơ bản. Bảng hệ số chi tiết là bảng rút gọn theo năm tuổi, chưa đối chiếu tài liệu gốc — chỉ xem đây là mốc tham khảo, đừng dùng làm căn cứ quyết định chăm sóc sức khỏe.';
        $('hp2-warn').hidden = false;
      } else {
        $('hp2-warn').hidden = true;
      }
    } else {
      $('hp2-compare').hidden = true;
      $('hp2-remain').hidden = true;
      $('hp2-warn').hidden = true;
    }
  }
  ['hp2-dad', 'hp2-mom', 'hp2-age', 'hp2-cheight', 'hp2-cweight'].forEach(function(id) {
    $(id).addEventListener('input', render);
  });
  document.querySelectorAll('input[name="hp2-gender"], input[name="hp2-method"]').forEach(function(el) {
    el.addEventListener('change', render);
  });
  $('hp2-chip-basic').addEventListener('click', function() {
    document.querySelector('input[name="hp2-gender"][value="boy"]').checked = true;
    document.querySelector('input[name="hp2-method"][value="tanner"]').checked = true;
    $('hp2-dad').value = '172'; $('hp2-mom').value = '158';
    render();
  });
  $('hp2-chip-detail').addEventListener('click', function() {
    document.querySelector('input[name="hp2-gender"][value="boy"]').checked = true;
    document.querySelector('input[name="hp2-method"][value="khamis"]').checked = true;
    $('hp2-dad').value = '172'; $('hp2-mom').value = '158';
    $('hp2-age').value = '8'; $('hp2-cheight').value = '130'; $('hp2-cweight').value = '28';
    render();
  });
  $('hp2-reset').addEventListener('click', function() {
    document.querySelector('input[name="hp2-gender"][value="boy"]').checked = true;
    document.querySelector('input[name="hp2-method"][value="tanner"]').checked = true;
    $('hp2-dad').value = '172'; $('hp2-mom').value = '158';
    $('hp2-age').value = '8'; $('hp2-cheight').value = '130'; $('hp2-cweight').value = '28';
    $('hp2-toast').textContent = '';
    render();
  });
  $('hp2-copy').addEventListener('click', function() {
    var text = 'Chiều cao dự đoán lúc trưởng thành: ' + $('hp2-hero-num').textContent + ' cm (khoảng ' + $('hp2-min').textContent + '–' + $('hp2-max').textContent + ' cm). ' + $('hp2-method-name').textContent + '.';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
    } catch (e) {}
    $('hp2-toast').textContent = 'Đã sao chép!';
  });
  render();
});

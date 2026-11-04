document.addEventListener('DOMContentLoaded', function () {
  var $ = function (id) { return document.getElementById(id); };

  /* ===== PURE LOGIC START ===== */
  var DRN_TABLE = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  function drnToRoman(n) {
    if (!isFinite(n) || n <= 0) return '';
    var out = '';
    var rest = Math.floor(n);
    for (var i = 0; i < DRN_TABLE.length; i++) {
      while (rest >= DRN_TABLE[i][0]) { out += DRN_TABLE[i][1]; rest -= DRN_TABLE[i][0]; }
    }
    return out;
  }
  var DRN_WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  function drnConvert(dateStr) {
    var p = (dateStr || '').split('-');
    if (p.length !== 3) return null;
    var y = +p[0], m = +p[1], d = +p[2];
    if (!y || !m || !d) return null;
    var dt = new Date(y, m - 1, d);
    var rd = drnToRoman(d), rm = drnToRoman(m), ry = drnToRoman(y);
    return {
      day: d, month: m, year: y,
      romanDay: rd, romanMonth: rm, romanYear: ry,
      dotted: rd + '.' + rm + '.' + ry,
      slashed: rd + '/' + rm + '/' + ry,
      dashed: rd + '-' + rm + '-' + ry,
      vietnamese: 'Ngày ' + rd + ' tháng ' + rm + ' năm ' + ry,
      weekday: DRN_WEEKDAYS[dt.getDay()],
      plain: d + '/' + m + '/' + y
    };
  }
  /* ===== PURE LOGIC END ===== */

  function copyText(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt);
    else {
      var ta = document.createElement('textarea');
      ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { }
      document.body.removeChild(ta);
    }
  }

  function render() {
    var r = drnConvert($('drn-date').value);
    if (!r) return;
    $('drn-hero').textContent = r.dotted;
    $('drn-hero-sub').textContent = r.weekday + ', ngày ' + r.plain;
    $('drn-out-day').textContent = r.romanDay + ' (' + r.day + ')';
    $('drn-out-month').textContent = r.romanMonth + ' (' + r.month + ')';
    $('drn-out-year').textContent = r.romanYear + ' (' + r.year + ')';
    var formats = [
      ['Chấm (kiểu châu Âu)', r.dotted],
      ['Gạch chéo', r.slashed],
      ['Gạch ngang', r.dashed],
      ['Dạng chữ tiếng Việt', r.vietnamese]
    ];
    $('drn-formats').innerHTML = '';
    formats.forEach(function (f) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'drn-format';
      var n = document.createElement('span'); n.className = 'drn-format-name'; n.textContent = f[0];
      var v = document.createElement('span'); v.className = 'drn-format-val'; v.textContent = f[1];
      var c = document.createElement('span'); c.className = 'drn-format-copy'; c.textContent = '📋 Sao chép';
      b.appendChild(n); b.appendChild(v); b.appendChild(c);
      b.addEventListener('click', function () { copyText(f[1]); c.textContent = '✅ Đã chép'; setTimeout(function () { c.textContent = '📋 Sao chép'; }, 1500); });
      $('drn-formats').appendChild(b);
    });
  }
  var t = new Date();
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  $('drn-date').value = t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
  $('drn-date').addEventListener('input', render);
  render();
});

document.addEventListener('DOMContentLoaded', function () {

/* ===== PURE LOGIC START ===== */
/* Hệ số quy đổi đơn vị diện tích đất Việt Nam (mọi đơn vị tính ra m²).
   Bắc Bộ: mẫu 3.600, sào 360, thước 24 (1 sào = 15 thước).
   Trung Bộ (cổ, theo Savani/UN Handbook): mẫu 4.970, sào 497, thước = 497/15 ≈ 33,13.
   Nam Bộ: mẫu 10.000, công tầm nhỏ 1.000, công tầm lớn 1.296 (Nghị định 86/2012/NĐ-CP).
   Mẫu Anh (acre) = 4.046,8564224 m². */
var LUC_UNITS = [
  { id: 'm2',        name: 'Mét vuông (m²)',        group: 'Chuẩn quốc tế', m2: 1 },
  { id: 'ha',        name: 'Hecta (ha)',            group: 'Chuẩn quốc tế', m2: 10000 },
  { id: 'acre',      name: 'Mẫu Anh (acre)',        group: 'Chuẩn quốc tế', m2: 4046.8564224 },
  { id: 'mau-bac',   name: 'Mẫu Bắc Bộ',            group: 'Bắc Bộ', m2: 3600 },
  { id: 'sao-bac',   name: 'Sào Bắc Bộ',            group: 'Bắc Bộ', m2: 360 },
  { id: 'thuoc-bac', name: 'Thước Bắc Bộ',          group: 'Bắc Bộ', m2: 24 },
  { id: 'mau-trung', name: 'Mẫu Trung Bộ',          group: 'Trung Bộ', m2: 4970 },
  { id: 'sao-trung', name: 'Sào Trung Bộ',          group: 'Trung Bộ', m2: 497 },
  { id: 'thuoc-trung', name: 'Thước Trung Bộ',      group: 'Trung Bộ', m2: 497 / 15 },
  { id: 'mau-nam',   name: 'Mẫu Nam Bộ',            group: 'Nam Bộ', m2: 10000 },
  { id: 'cong-nho',  name: 'Công Nam Bộ (tầm nhỏ)', group: 'Nam Bộ', m2: 1000 },
  { id: 'cong-lon',  name: 'Công Nam Bộ (tầm lớn)', group: 'Nam Bộ', m2: 1296 }
];
function lucGetUnit(id) {
  for (var i = 0; i < LUC_UNITS.length; i++) if (LUC_UNITS[i].id === id) return LUC_UNITS[i];
  return null;
}
function lucToM2(value, fromId) { return value * lucGetUnit(fromId).m2; }
function lucFromM2(m2, toId) { return m2 / lucGetUnit(toId).m2; }
function lucConvert(value, fromId, toId) { return lucFromM2(lucToM2(value, fromId), toId); }
/* Định dạng số kiểu vi-VN: tối đa 4 chữ số thập phân, bỏ số 0 thừa */
function lucFormat(n) {
  if (!isFinite(n)) return '—';
  var rounded = Math.round(n * 10000) / 10000;
  return rounded.toLocaleString('vi-VN', { maximumFractionDigits: 4 });
}
/* ===== PURE LOGIC END ===== */

  function $(id) { return document.getElementById(id); }
  var inpValue = $('luc-inp-value'), selUnit = $('luc-sel-unit');
  var verdictEl = $('luc-verdict'), gridEl = $('luc-grid');
  var noteEl = $('luc-note');

  /* Điền các lựa chọn đơn vị vào select (nhóm theo miền) */
  (function fillUnits() {
    var groups = {}, order = [];
    LUC_UNITS.forEach(function (u) {
      if (!groups[u.group]) { groups[u.group] = []; order.push(u.group); }
      groups[u.group].push(u);
    });
    selUnit.innerHTML = order.map(function (g) {
      return '<optgroup label="' + g + '">' + groups[g].map(function (u) {
        return '<option value="' + u.id + '">' + u.name + ' = ' + lucFormat(u.m2) + ' m²</option>';
      }).join('') + '</optgroup>';
    }).join('');
    selUnit.value = 'sao-bac';
  })();

  var NOTES = {
    'mau-trung': 'ℹ️ Trung Bộ tính theo thước cổ (mẫu 4.970 m²). Nhiều nơi làm tròn thành mẫu 5.000 m², sào 500 m² cho dễ tính — khi giao dịch hãy hỏi rõ bên bán dùng chuẩn nào.',
    'sao-trung': 'ℹ️ Trung Bộ tính theo thước cổ (sào 497 m²). Nhiều nơi làm tròn thành 500 m²/sào cho dễ tính — khi giao dịch hãy hỏi rõ bên bán dùng chuẩn nào.',
    'thuoc-trung': 'ℹ️ 1 thước Trung Bộ = 1/15 sào ≈ 33,13 m² (theo thước cổ). Nhiều nơi làm tròn sào Trung Bộ thành 500 m².',
    'cong-nho': 'ℹ️ Công tầm nhỏ (1.000 m²) là cách gọi phổ biến nhất ở miền Tây. Nếu bên bán tính theo công tầm lớn (1.296 m²), cùng một mảnh đất sẽ chênh nhau gần 30% diện tích!',
    'cong-lon': 'ℹ️ Công tầm lớn (1.296 m²) là chuẩn ghi trong Nghị định 86/2012/NĐ-CP. Lưu ý: 10 công tầm lớn = 12.960 m², lớn hơn 1 mẫu Nam Bộ (10.000 m²).',
    'acre': 'ℹ️ Mẫu Anh (acre) là đơn vị Anh–Mỹ, khác hoàn toàn mẫu Việt Nam — đừng nhầm khi đọc tài liệu nước ngoài.'
  };

  function render() {
    var raw = inpValue.value.replace(',', '.');
    var value = parseFloat(raw);
    var from = lucGetUnit(selUnit.value);
    if (raw === '' || isNaN(value) || value < 0) {
      verdictEl.innerHTML = '👆 Nhập diện tích và chọn đơn vị — kết quả quy đổi tất cả đơn vị hiện ngay tại đây.';
      gridEl.innerHTML = '';
      noteEl.style.display = 'none';
      return;
    }
    var m2 = lucToM2(value, from.id);
    verdictEl.innerHTML = '📐 <strong>' + lucFormat(value) + ' ' + from.name + '</strong> = <strong>' +
      lucFormat(m2) + ' m²</strong> = <strong>' + lucFormat(m2 / 10000) + ' ha</strong>';
    var groups = {}, order = [];
    LUC_UNITS.forEach(function (u) {
      if (u.id === from.id) return;
      if (!groups[u.group]) { groups[u.group] = []; order.push(u.group); }
      groups[u.group].push(u);
    });
    gridEl.innerHTML = order.map(function (g) {
      return '<div class="luc-group"><h4 class="luc-group-title">' + g + '</h4><div class="luc-group-grid">' +
        groups[g].map(function (u) {
          return '<div class="luc-chip"><span class="luc-chip-label">' + u.name + '</span>' +
            '<span class="luc-chip-value">' + lucFormat(m2 / u.m2) + '</span></div>';
        }).join('') + '</div></div>';
    }).join('');
    if (NOTES[from.id]) {
      noteEl.textContent = NOTES[from.id];
      noteEl.style.display = '';
    } else { noteEl.style.display = 'none'; }
  }

  inpValue.addEventListener('input', render);
  selUnit.addEventListener('change', render);
  Array.prototype.forEach.call(document.querySelectorAll('[data-luc-value]'), function (chip) {
    chip.addEventListener('click', function () {
      inpValue.value = chip.getAttribute('data-luc-value');
      selUnit.value = chip.getAttribute('data-luc-unit');
      render();
      inpValue.focus();
    });
  });
  render();
});

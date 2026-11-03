document.addEventListener('DOMContentLoaded', function () {

/* ===== PURE LOGIC START ===== */
/* Thuật toán Âm lịch Việt Nam theo phương pháp thiên văn của Hồ Ngọc Đức
   (múi giờ Việt Nam UTC+7): tính ngày sóc (trăng non) và hoàng kinh Mặt Trời,
   xác định tháng 11 và tháng nhuận. Đúng cho khoảng năm 1800–2100. */
var LCV_TZ = 7;
var LCV_PI = Math.PI;

function lcvJdFromDate(dd, mm, yy) {
  var a = Math.floor((14 - mm) / 12);
  var y = yy + 4800 - a;
  var m = mm + 12 * a - 3;
  var jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return jd;
}
function lcvJdToDate(jd) {
  var a, b, c;
  if (jd > 2299160) {
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((b * 146097) / 4);
  } else { b = 0; c = jd + 32082; }
  var d = Math.floor((4 * c + 3) / 1461);
  var e = c - Math.floor((1461 * d) / 4);
  var m = Math.floor((5 * e + 2) / 153);
  var day = e - Math.floor((153 * m + 2) / 5) + 1;
  var month = m + 3 - 12 * Math.floor(m / 10);
  var year = b * 100 + d - 4800 + Math.floor(m / 10);
  return [day, month, year];
}
function lcvNewMoon(k) {
  var T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = LCV_PI / 180;
  var Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  var M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  var Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  var F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  var C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  var deltat;
  if (T < -11) deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  else deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Jd1 + C1 - deltat;
}
function lcvSunLongitudeRad(jdn) {
  var T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = LCV_PI / 180;
  var M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T2 * T;
  var L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  var DL = (1.914600 - 0.004817 * T - 0.000014 * T * T) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
  var L = (L0 + DL) * dr;
  L = L - LCV_PI * 2 * Math.floor(L / (LCV_PI * 2));
  return L;
}
function lcvGetNewMoonDay(k, tz) { return Math.floor(lcvNewMoon(k) + 0.5 + tz / 24); }
/* Khu vực hoàng kinh 30 độ (0–11) của ngày sóc — dùng để tìm tháng nhuận */
function lcvGetSunSector(jdn, tz) { return Math.floor(lcvSunLongitudeRad(jdn - 0.5 - tz / 24) / LCV_PI * 6); }
function lcvSunDegree(jdn, tz) { return lcvSunLongitudeRad(jdn - 0.5 - tz / 24) * 180 / LCV_PI; }
function lcvGetLunarMonth11(yy, tz) {
  var off = lcvJdFromDate(31, 12, yy) - 2415021;
  var k = Math.floor(off / 29.530588853);
  var nm = lcvGetNewMoonDay(k, tz);
  if (lcvGetSunSector(nm, tz) >= 9) nm = lcvGetNewMoonDay(k - 1, tz);
  return nm;
}
function lcvGetLeapMonthOffset(a11, tz) {
  var k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  var last = 0, arc, i = 1;
  arc = lcvGetSunSector(lcvGetNewMoonDay(k + i, tz), tz);
  do {
    last = arc; i++;
    arc = lcvGetSunSector(lcvGetNewMoonDay(k + i, tz), tz);
  } while (arc !== last && i < 14);
  return i - 1;
}
/* Dương -> Âm: trả [ngày, tháng, năm, nhuận(0/1)] */
function lcvSolar2Lunar(dd, mm, yy, tz) {
  var dayNumber = lcvJdFromDate(dd, mm, yy);
  var k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  var monthStart = lcvGetNewMoonDay(k + 1, tz);
  if (monthStart > dayNumber) monthStart = lcvGetNewMoonDay(k, tz);
  var a11 = lcvGetLunarMonth11(yy, tz), b11 = a11, lunarYear;
  if (a11 >= monthStart) { lunarYear = yy; a11 = lcvGetLunarMonth11(yy - 1, tz); }
  else { lunarYear = yy + 1; b11 = lcvGetLunarMonth11(yy + 1, tz); }
  var lunarDay = dayNumber - monthStart + 1;
  var diff = Math.floor((monthStart - a11) / 29);
  var lunarLeap = 0, lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    var leapMonthDiff = lcvGetLeapMonthOffset(a11, tz);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = 1;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}
/* Âm -> Dương: trả [ngày, tháng, năm] dương lịch, hoặc [0,0,0] nếu ngày âm không tồn tại */
function lcvLunar2Solar(lunarDay, lunarMonth, lunarYear, lunarLeap, tz) {
  var a11, b11;
  if (lunarMonth < 11) { a11 = lcvGetLunarMonth11(lunarYear - 1, tz); b11 = lcvGetLunarMonth11(lunarYear, tz); }
  else { a11 = lcvGetLunarMonth11(lunarYear, tz); b11 = lcvGetLunarMonth11(lunarYear + 1, tz); }
  var off = lunarMonth - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    var leapOff = lcvGetLeapMonthOffset(a11, tz);
    var leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (lunarLeap !== 0 && lunarMonth !== leapMonth) return [0, 0, 0];
    if (lunarLeap !== 0 || off >= leapOff) off += 1;
  }
  var k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  var monthStart = lcvGetNewMoonDay(k + off, tz);
  var solar = lcvJdToDate(monthStart + lunarDay - 1);
  /* Kiểm chứng vòng tròn: ngày âm không có thật (vd 30 tháng thiếu) sẽ không khớp khi đổi ngược */
  var back = lcvSolar2Lunar(solar[0], solar[1], solar[2], tz);
  if (back[0] !== lunarDay || back[1] !== lunarMonth || back[2] !== lunarYear || back[3] !== lunarLeap) return [0, 0, 0];
  return solar;
}

/* --- Can Chi --- */
var LCV_CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
var LCV_CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
function lcvCanChiYear(lunarYear) {
  return LCV_CAN[(lunarYear + 6) % 10] + ' ' + LCV_CHI[(lunarYear + 8) % 12];
}
function lcvCanChiMonth(lunarMonth, lunarYear) {
  var yearCan = (lunarYear + 6) % 10;
  var firstStem = (yearCan * 2 + 2) % 10;
  return LCV_CAN[(firstStem + lunarMonth - 1) % 10] + ' ' + LCV_CHI[(lunarMonth + 1) % 12];
}
function lcvCanChiDay(dd, mm, yy) {
  var jd = lcvJdFromDate(dd, mm, yy);
  return LCV_CAN[(jd + 9) % 10] + ' ' + LCV_CHI[(jd + 1) % 12];
}
function lcvCanChiHour(dayCanChi, hour) {
  var dayCan = LCV_CAN.indexOf(dayCanChi.split(' ')[0]);
  var chiIdx = Math.floor((hour + 1) / 2) % 12;
  return LCV_CAN[(dayCan * 2 + chiIdx) % 10] + ' ' + LCV_CHI[chiIdx];
}
var LCV_WEEKDAYS = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
function lcvWeekday(dd, mm, yy) { return LCV_WEEKDAYS[(lcvJdFromDate(dd, mm, yy) + 1) % 7]; }

/* --- Tiết khí (24 tiết, tính theo hoàng kinh Mặt Trời) --- */
var LCV_TERMS = ['Lập xuân', 'Vũ thủy', 'Kinh trập', 'Xuân phân', 'Thanh minh', 'Cốc vũ',
  'Lập hạ', 'Tiểu mãn', 'Mang chủng', 'Hạ chí', 'Tiểu thử', 'Đại thử',
  'Lập thu', 'Xử thử', 'Bạch lộ', 'Thu phân', 'Hàn lộ', 'Sương giáng',
  'Lập đông', 'Tiểu tuyết', 'Đại tuyết', 'Đông chí', 'Tiểu hàn', 'Đại hàn'];
function lcvTermName(dd, mm, yy) {
  /* Hoàng kinh tại cuối ngày: ngày bắt đầu một tiết khí sẽ mang tên tiết đó */
  var deg = lcvSunDegree(lcvJdFromDate(dd, mm, yy) + 1, LCV_TZ);
  var idx = Math.floor(((deg - 315 + 360) % 360) / 15);
  return LCV_TERMS[idx];
}

/* --- Ngày lễ âm lịch --- */
var LCV_FESTIVALS = [
  [1, 1, '🧧 Tết Nguyên Đán'],
  [15, 1, '🏮 Rằm tháng Giêng'],
  [10, 3, '🥁 Giỗ Tổ Hùng Vương'],
  [15, 4, '🪷 Lễ Phật Đản'],
  [5, 5, '🎋 Tết Đoan Ngọ'],
  [15, 7, '🕯️ Lễ Vu Lan (Rằm tháng 7)'],
  [15, 8, '🥮 Tết Trung Thu'],
  [23, 12, '🔥 Ông Công Ông Táo']
];
function lcvUpcomingFestivals(dd, mm, yy, count) {
  var selJd = lcvJdFromDate(dd, mm, yy);
  var lunar = lcvSolar2Lunar(dd, mm, yy, LCV_TZ);
  var found = [];
  for (var Y = lunar[2]; Y <= lunar[2] + 1; Y++) {
    LCV_FESTIVALS.forEach(function (f) {
      var s = lcvLunar2Solar(f[0], f[1], Y, 0, LCV_TZ);
      if (s[0] === 0) return;
      var jd = lcvJdFromDate(s[0], s[1], s[2]);
      if (jd >= selJd) found.push({ name: f[2], ld: f[0], lm: f[1], ly: Y, sd: s[0], sm: s[1], sy: s[2], inDays: jd - selJd });
    });
  }
  found.sort(function (a, b) { return a.inDays - b.inDays; });
  return found.slice(0, count);
}
/* ===== PURE LOGIC END ===== */

  function $(id) { return document.getElementById(id); }
  var modeS2L = $('lcv-mode-s2l'), modeL2S = $('lcv-mode-l2s');
  var solarForm = $('lcv-solar-form'), lunarForm = $('lcv-lunar-form');
  var inpSolar = $('lcv-inp-solar'), btnToday = $('lcv-btn-today');
  var inpLDay = $('lcv-inp-lunar-day'), inpLMonth = $('lcv-inp-lunar-month'),
      inpLYear = $('lcv-inp-lunar-year'), inpLLeap = $('lcv-inp-lunar-leap');
  var verdictEl = $('lcv-verdict'), detailEl = $('lcv-detail');
  var calTitle = $('lcv-cal-title'), calGrid = $('lcv-cal-grid');
  var btnPrev = $('lcv-btn-prev'), btnNext = $('lcv-btn-next');
  var eventsEl = $('lcv-events');
  var errEl = $('lcv-error');

  var today = new Date();
  var state = {
    mode: 's2l',
    sel: { d: today.getDate(), m: today.getMonth() + 1, y: today.getFullYear() },
    view: { m: today.getMonth() + 1, y: today.getFullYear() }
  };

  function fmt(n) { return (n < 10 ? '0' : '') + n; }
  function solarStr(d, m, y) { return fmt(d) + '/' + fmt(m) + '/' + y; }

  function setMode(mode) {
    state.mode = mode;
    modeS2L.classList.toggle('lcv-mode-active', mode === 's2l');
    modeL2S.classList.toggle('lcv-mode-active', mode === 'l2s');
    solarForm.style.display = mode === 's2l' ? '' : 'none';
    lunarForm.style.display = mode === 'l2s' ? '' : 'none';
    if (mode === 'l2s') syncLunarInputs();
    render();
  }
  function syncLunarInputs() {
    var l = lcvSolar2Lunar(state.sel.d, state.sel.m, state.sel.y, LCV_TZ);
    inpLDay.value = l[0]; inpLMonth.value = l[1]; inpLYear.value = l[2];
    inpLLeap.checked = l[3] === 1;
  }

  function render() {
    errEl.style.display = 'none';
    var d = state.sel.d, m = state.sel.m, y = state.sel.y;
    var lunar = lcvSolar2Lunar(d, m, y, LCV_TZ);
    var wd = lcvWeekday(d, m, y);
    var ccYear = lcvCanChiYear(lunar[2]);
    var ccMonth = lcvCanChiMonth(lunar[1], lunar[2]);
    var ccDay = lcvCanChiDay(d, m, y);
    var lunarStr = lunar[0] + '/' + lunar[1] + (lunar[3] ? ' nhuận' : '') + '/' + lunar[2];
    if (state.mode === 's2l') {
      verdictEl.innerHTML = '🌙 <strong>' + wd + '</strong>, ngày <strong>' + solarStr(d, m, y) + '</strong> dương lịch' +
        ' là ngày <strong>' + lunarStr + '</strong> âm lịch — năm <strong>' + ccYear + '</strong>.';
    } else {
      verdictEl.innerHTML = '🌞 Ngày <strong>' + lunarStr + '</strong> âm lịch (năm <strong>' + ccYear + '</strong>)' +
        ' là <strong>' + wd + '</strong>, ngày <strong>' + solarStr(d, m, y) + '</strong> dương lịch.';
    }
    var chips = [
      ['🌙 Âm lịch', lunar[0] + ' tháng ' + lunar[1] + (lunar[3] ? ' (nhuận)' : '') + ' năm ' + lunar[2]],
      ['🐲 Can Chi năm', ccYear],
      ['📅 Can Chi tháng', ccMonth],
      ['🌞 Can Chi ngày', ccDay],
      ['🌤️ Tiết khí', lcvTermName(d, m, y)],
      ['🔢 Ngày Julius', lcvJdFromDate(d, m, y).toLocaleString('vi-VN')]
    ];
    detailEl.innerHTML = chips.map(function (c) {
      return '<div class="lcv-chip"><span class="lcv-chip-label">' + c[0] + '</span><span class="lcv-chip-value">' + c[1] + '</span></div>';
    }).join('');
    renderCalendar();
    renderEvents();
  }

  function renderCalendar() {
    calTitle.textContent = 'Tháng ' + state.view.m + '/' + state.view.y;
    var firstJd = lcvJdFromDate(1, state.view.m, state.view.y);
    var firstDow = (firstJd + 1) % 7; /* 0 = Chủ Nhật */
    var startOffset = (firstDow + 6) % 7; /* lịch bắt đầu từ Thứ 2 */
    var daysInMonth = new Date(state.view.y, state.view.m, 0).getDate();
    var html = '';
    ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach(function (w, i) {
      html += '<div class="lcv-cal-head' + (i === 6 ? ' lcv-sun' : '') + '">' + w + '</div>';
    });
    for (var i = 0; i < startOffset; i++) html += '<div class="lcv-cal-cell lcv-empty"></div>';
    for (var day = 1; day <= daysInMonth; day++) {
      var l = lcvSolar2Lunar(day, state.view.m, state.view.y, LCV_TZ);
      var dow = (lcvJdFromDate(day, state.view.m, state.view.y) + 1) % 7;
      var isToday = day === today.getDate() && state.view.m === today.getMonth() + 1 && state.view.y === today.getFullYear();
      var isSel = day === state.sel.d && state.view.m === state.sel.m && state.view.y === state.sel.y;
      var lunarLabel = l[0] === 1 ? '1/' + l[1] + (l[3] ? 'N' : '') : String(l[0]);
      html += '<button type="button" class="lcv-cal-cell' + (dow === 0 ? ' lcv-sun' : '') +
        (isToday ? ' lcv-today' : '') + (isSel ? ' lcv-selected' : '') + (l[0] === 15 ? ' lcv-ram' : '') +
        '" data-day="' + day + '"><span class="lcv-solar-day">' + day + '</span>' +
        '<span class="lcv-lunar-day">' + lunarLabel + '</span></button>';
    }
    calGrid.innerHTML = html;
    Array.prototype.forEach.call(calGrid.querySelectorAll('.lcv-cal-cell[data-day]'), function (cell) {
      cell.addEventListener('click', function () {
        state.sel = { d: parseInt(cell.getAttribute('data-day'), 10), m: state.view.m, y: state.view.y };
        inpSolar.value = state.sel.y + '-' + fmt(state.sel.m) + '-' + fmt(state.sel.d);
        if (state.mode === 'l2s') syncLunarInputs();
        render();
      });
    });
  }

  function renderEvents() {
    var list = lcvUpcomingFestivals(state.sel.d, state.sel.m, state.sel.y, 5);
    eventsEl.innerHTML = list.map(function (e) {
      var when = e.inDays === 0 ? '🎉 Hôm nay!' : (e.inDays === 1 ? 'Ngày mai' : 'Còn ' + e.inDays + ' ngày');
      return '<div class="lcv-event"><div class="lcv-event-main"><span class="lcv-event-name">' + e.name + '</span>' +
        '<span class="lcv-event-lunar">' + e.ld + '/' + e.lm + ' âm lịch (' + lcvCanChiYear(e.ly) + ')</span></div>' +
        '<div class="lcv-event-side"><span class="lcv-event-solar">' + solarStr(e.sd, e.sm, e.sy) + '</span>' +
        '<span class="lcv-event-when">' + when + '</span></div></div>';
    }).join('');
  }

  modeS2L.addEventListener('click', function () { setMode('s2l'); });
  modeL2S.addEventListener('click', function () { setMode('l2s'); });
  inpSolar.addEventListener('change', function () {
    if (!inpSolar.value) return;
    var p = inpSolar.value.split('-');
    var y = parseInt(p[0], 10), m = parseInt(p[1], 10), d = parseInt(p[2], 10);
    if (y < 1900 || y > 2100) { showError('Công cụ hỗ trợ các năm từ 1900 đến 2100.'); return; }
    state.sel = { d: d, m: m, y: y };
    state.view = { m: m, y: y };
    render();
  });
  btnToday.addEventListener('click', function () {
    state.sel = { d: today.getDate(), m: today.getMonth() + 1, y: today.getFullYear() };
    state.view = { m: state.sel.m, y: state.sel.y };
    inpSolar.value = state.sel.y + '-' + fmt(state.sel.m) + '-' + fmt(state.sel.d);
    if (state.mode === 'l2s') syncLunarInputs();
    render();
  });
  function onLunarChange() {
    var ld = parseInt(inpLDay.value, 10), lm = parseInt(inpLMonth.value, 10),
        ly = parseInt(inpLYear.value, 10), leap = inpLLeap.checked ? 1 : 0;
    if (!ld || !lm || !ly || ly < 1900 || ly > 2100) { showError('Hãy nhập ngày, tháng, năm âm lịch hợp lệ (năm 1900–2100).'); return; }
    var s = lcvLunar2Solar(ld, lm, ly, leap, LCV_TZ);
    if (s[0] === 0) {
      showError('Ngày âm lịch này không tồn tại — tháng có thể chỉ có 29 ngày, hoặc năm đó không có tháng ' + lm + ' nhuận. Hãy kiểm tra lại nhé.');
      return;
    }
    state.sel = { d: s[0], m: s[1], y: s[2] };
    state.view = { m: s[1], y: s[2] };
    inpSolar.value = s[2] + '-' + fmt(s[1]) + '-' + fmt(s[0]);
    render();
  }
  [inpLDay, inpLMonth, inpLYear].forEach(function (el) { el.addEventListener('change', onLunarChange); });
  inpLLeap.addEventListener('change', onLunarChange);
  function showError(msg) {
    errEl.textContent = '⚠️ ' + msg;
    errEl.style.display = '';
  }
  btnPrev.addEventListener('click', function () {
    state.view.m -= 1;
    if (state.view.m < 1) { state.view.m = 12; state.view.y -= 1; }
    renderCalendar();
  });
  btnNext.addEventListener('click', function () {
    state.view.m += 1;
    if (state.view.m > 12) { state.view.m = 1; state.view.y += 1; }
    renderCalendar();
  });

  /* Điền sẵn lựa chọn ngày/tháng cho form âm lịch */
  (function fillLunarSelects() {
    var dh = '', mh = '', i;
    for (i = 1; i <= 30; i++) dh += '<option value="' + i + '">Ngày ' + i + '</option>';
    for (i = 1; i <= 12; i++) mh += '<option value="' + i + '">Tháng ' + i + '</option>';
    inpLDay.innerHTML = dh;
    inpLMonth.innerHTML = mh;
  })();

  inpSolar.value = state.sel.y + '-' + fmt(state.sel.m) + '-' + fmt(state.sel.d);
  render();
});

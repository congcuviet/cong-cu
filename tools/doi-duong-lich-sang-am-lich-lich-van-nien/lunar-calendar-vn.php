<div class="lcv-soft-wrapper">

  <section class="lcv-card lcv-converter">
    <div class="lcv-mode-row" role="group" aria-label="Chiều chuyển đổi">
      <button type="button" id="lcv-mode-s2l" class="lcv-mode-btn lcv-mode-active">🌞 Dương → Âm</button>
      <button type="button" id="lcv-mode-l2s" class="lcv-mode-btn">🌙 Âm → Dương</button>
    </div>

    <div id="lcv-solar-form" class="lcv-form">
      <label class="lcv-label" for="lcv-inp-solar">📅 Chọn ngày dương lịch</label>
      <div class="lcv-inline">
        <input type="date" id="lcv-inp-solar" class="lcv-input" min="1900-01-01" max="2100-12-31">
        <button type="button" id="lcv-btn-today" class="lcv-btn-today">Hôm nay</button>
      </div>
    </div>

    <div id="lcv-lunar-form" class="lcv-form" style="display:none">
      <label class="lcv-label">🌙 Nhập ngày âm lịch</label>
      <div class="lcv-lunar-inputs">
        <label class="lcv-mini">Ngày
          <select id="lcv-inp-lunar-day" class="lcv-input"></select>
        </label>
        <label class="lcv-mini">Tháng
          <select id="lcv-inp-lunar-month" class="lcv-input"></select>
        </label>
        <label class="lcv-mini">Năm
          <input type="number" id="lcv-inp-lunar-year" class="lcv-input" min="1900" max="2100" inputmode="numeric">
        </label>
        <label class="lcv-check">
          <input type="checkbox" id="lcv-inp-lunar-leap"> Tháng nhuận
        </label>
      </div>
    </div>

    <p id="lcv-error" class="lcv-error" style="display:none"></p>
    <p id="lcv-verdict" class="lcv-verdict"></p>
    <div id="lcv-detail" class="lcv-detail"></div>
  </section>

  <section class="lcv-card lcv-calendar-card">
    <div class="lcv-cal-header">
      <button type="button" id="lcv-btn-prev" class="lcv-nav-btn">‹ Tháng trước</button>
      <span id="lcv-cal-title" class="lcv-cal-title"></span>
      <button type="button" id="lcv-btn-next" class="lcv-nav-btn">Tháng sau ›</button>
    </div>
    <div id="lcv-cal-grid" class="lcv-cal-grid"></div>
    <p class="lcv-legend">Số nhỏ bên dưới là <strong>ngày âm lịch</strong> • <strong>1/x</strong> là mùng 1 tháng x (thêm chữ N nếu là tháng nhuận) • chấm hồng là <strong>ngày rằm</strong> • bấm vào một ngày để xem chi tiết.</p>
  </section>

  <section class="lcv-card lcv-events-card">
    <h3 class="lcv-h3">🎋 Ngày lễ âm lịch sắp tới <span class="lcv-h3-note">(tính từ ngày đang chọn)</span></h3>
    <div id="lcv-events" class="lcv-events"></div>
  </section>

  <details class="lcv-accordion">
    <summary>📖 Cách tính &amp; lưu ý về âm lịch Việt Nam</summary>
    <div class="lcv-acc-body">
      <p><strong>Nguyên tắc tính:</strong> âm lịch Việt Nam tính theo thiên văn — ngày mùng 1 là ngày chứa điểm sóc (trăng non), tháng 11 là tháng chứa ngày Đông chí, và tháng nhuận là tháng không chứa trung khí. Công cụ tính trực tiếp bằng phương pháp của nhà nghiên cứu Hồ Ngọc Đức, theo múi giờ Việt Nam (UTC+7), hỗ trợ các năm 1900–2100.</p>
      <p><strong>Khác lịch Trung Quốc:</strong> vì khác múi giờ (UTC+7 so với UTC+8), một số ngày sóc rơi sang ngày khác khiến âm lịch Việt Nam thỉnh thoảng lệch 1 ngày — thậm chí lệch cả tháng nhuận và ngày Tết (ví dụ Tết Đinh Hợi 2007 ở Việt Nam sớm hơn Trung Quốc 1 ngày). Hãy luôn tra theo lịch Việt Nam cho các ngày lễ trong nước.</p>
      <p><strong>Can Chi:</strong> Can Chi năm tính theo năm âm lịch (đổi tại Tết Nguyên Đán). Tháng nhuận mang cùng Can Chi với tháng chính mà nó lặp lại. Tiết khí hiển thị là tiết khí đã bắt đầu tính đến cuối ngày đang xem.</p>
      <p><strong>Lưu ý lịch sử:</strong> trước năm 1967, Việt Nam dùng cách tính lịch cũ (kinh tuyến 105° Đông và quy tắc xấp xỉ), nên một số ngày trong lịch in thời kỳ đó có thể khác kết quả tính thiên văn hiện đại — đây là điểm nhiều lịch vạn niên trực tuyến cũng gặp phải.</p>
    </div>
  </details>

</div>

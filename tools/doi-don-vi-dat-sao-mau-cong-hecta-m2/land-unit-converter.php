<div class="luc-soft-wrapper">

  <section class="luc-card">
    <label class="luc-label" for="luc-inp-value">📐 Nhập diện tích cần đổi</label>
    <div class="luc-inline">
      <input type="text" id="luc-inp-value" class="luc-input" inputmode="decimal" value="1" placeholder="Ví dụ: 2,5" autocomplete="off">
      <select id="luc-sel-unit" class="luc-input" aria-label="Đơn vị"></select>
    </div>
    <div class="luc-chips">
      <span class="luc-chips-label">Đổi nhanh:</span>
      <button type="button" class="luc-chip-btn" data-luc-value="1" data-luc-unit="sao-bac">1 sào Bắc</button>
      <button type="button" class="luc-chip-btn" data-luc-value="1" data-luc-unit="mau-bac">1 mẫu Bắc</button>
      <button type="button" class="luc-chip-btn" data-luc-value="1" data-luc-unit="sao-trung">1 sào Trung</button>
      <button type="button" class="luc-chip-btn" data-luc-value="1" data-luc-unit="cong-nho">1 công nhỏ</button>
      <button type="button" class="luc-chip-btn" data-luc-value="1" data-luc-unit="cong-lon">1 công lớn</button>
      <button type="button" class="luc-chip-btn" data-luc-value="1" data-luc-unit="ha">1 hecta</button>
      <button type="button" class="luc-chip-btn" data-luc-value="100" data-luc-unit="m2">100 m²</button>
      <button type="button" class="luc-chip-btn" data-luc-value="1000" data-luc-unit="m2">1.000 m²</button>
    </div>
    <p id="luc-verdict" class="luc-verdict"></p>
    <p id="luc-note" class="luc-note" style="display:none"></p>
    <div id="luc-grid" class="luc-results"></div>
  </section>

  <details class="luc-accordion">
    <summary>📋 Bảng quy đổi chuẩn theo 3 miền &amp; những lưu ý hay gây tranh chấp</summary>
    <div class="luc-acc-body">
      <table class="luc-table">
        <thead>
          <tr><th>Vùng</th><th>1 mẫu</th><th>1 sào / 1 công</th><th>1 thước</th><th>1 ha bằng</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Bắc Bộ</strong></td><td>3.600 m²</td><td>1 sào = 360 m²</td><td>24 m²</td><td>≈ 27,78 sào</td></tr>
          <tr><td><strong>Trung Bộ</strong></td><td>4.970 m²</td><td>1 sào = 497 m²</td><td>≈ 33,13 m²</td><td>≈ 20,12 sào</td></tr>
          <tr><td><strong>Nam Bộ</strong></td><td>10.000 m²</td><td>1 công tầm nhỏ = 1.000 m²</td><td>không dùng</td><td>10 công</td></tr>
          <tr><td><strong>Nam Bộ (tầm lớn)</strong></td><td>10 công = 12.960 m²</td><td>1 công tầm lớn = 1.296 m²</td><td>không dùng</td><td>≈ 7,72 công</td></tr>
        </tbody>
      </table>
      <p><strong>Vì sao mỗi miền một khác?</strong> Ngày xưa diện tích suy từ cây thước đo đất, mà chiều dài thước mỗi vùng một khác (thước Bắc Bộ, thước Trung Bộ, tầm Nam Bộ) nên sào/mẫu suy ra cũng khác nhau. Đến nay mét vuông là đơn vị pháp lý chính thức, nhưng dân gian vẫn giao dịch bằng sào, mẫu, công.</p>
      <p><strong>Hai con số dễ gây tranh chấp nhất:</strong> (1) Sào Trung Bộ — chuẩn cổ là 497 m² nhưng nhiều nơi làm tròn 500 m²; (2) Công Nam Bộ — công tầm nhỏ 1.000 m² là cách gọi phổ biến, nhưng Nghị định 86/2012/NĐ-CP ghi 1 công = 1.296 m² (công tầm lớn). Cùng nói "5 công đất", hiểu hai kiểu là chênh nhau tới 1.480 m².</p>
      <p><strong>Lời khuyên:</strong> khi mua bán, chuyển nhượng đất liên tỉnh, luôn ghi rõ diện tích bằng <strong>m² theo sổ đỏ/giấy chứng nhận</strong> trong hợp đồng, và hỏi rõ bên bán đang tính sào/công theo chuẩn miền nào, tầm lớn hay tầm nhỏ.</p>
    </div>
  </details>

</div>

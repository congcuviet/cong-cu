<link rel="stylesheet" href="budget-planner-v2.css">
<div class="bg2-soft-wrapper" id="bg2-print-area">
  <div class="bg2-seg-row bg2-hide-print">
    <span class="bg2-seg-label">Kỳ ngân sách:</span>
    <div class="bg2-seg">
      <button type="button" class="bg2-seg-btn active" id="bg2-period-monthly">Hàng Tháng</button>
      <button type="button" class="bg2-seg-btn" id="bg2-period-weekly">Hàng Tuần</button>
    </div>
  </div>

  <div class="bg2-dash">
    <div class="bg2-dash-card bg2-card-income">
      <div class="bg2-dash-label">Tổng Thu Nhập</div>
      <div class="bg2-dash-value" id="bg2-total-income">0 đ</div>
      <div class="bg2-cap" id="bg2-cap-income"></div>
    </div>
    <div class="bg2-dash-card bg2-card-expense">
      <div class="bg2-dash-label">Tổng Chi Tiêu</div>
      <div class="bg2-dash-value" id="bg2-total-expense">0 đ</div>
      <div class="bg2-cap">Đã phân bổ, gồm cả tích lũy &amp; trả nợ</div>
    </div>
    <div class="bg2-dash-card bg2-card-balance">
      <div class="bg2-dash-label">Tiền Còn Dư</div>
      <div class="bg2-dash-value" id="bg2-remaining">0 đ</div>
      <div class="bg2-cap">Thu nhập trừ tổng đã phân bổ</div>
    </div>
  </div>

  <p class="bg2-verdict" id="bg2-verdict"></p>

  <div class="bg2-analysis">
    <h3 class="bg2-box-title">Phân tích Quy tắc 50/30/20</h3>
    <div class="bg2-progress-group">
      <div class="bg2-progress-labels"><span><strong>Thiết Yếu</strong> (Mốc: 50%)</span><span id="bg2-pct-needs">0.0%</span></div>
      <div class="bg2-progress-bar"><div class="bg2-progress-fill bg2-fill-needs" id="bg2-bar-needs"></div></div>
      <div class="bg2-target-row"><span id="bg2-target-needs"></span><span id="bg2-gap-needs"></span></div>
    </div>
    <div class="bg2-progress-group">
      <div class="bg2-progress-labels"><span><strong>Mong Muốn</strong> (Mốc: 30%)</span><span id="bg2-pct-wants">0.0%</span></div>
      <div class="bg2-progress-bar"><div class="bg2-progress-fill bg2-fill-wants" id="bg2-bar-wants"></div></div>
      <div class="bg2-target-row"><span id="bg2-target-wants"></span><span id="bg2-gap-wants"></span></div>
    </div>
    <div class="bg2-progress-group">
      <div class="bg2-progress-labels"><span><strong>Tích Lũy &amp; Trả Nợ</strong> (Mốc: 20%)</span><span id="bg2-pct-savings">0.0%</span></div>
      <div class="bg2-progress-bar"><div class="bg2-progress-fill bg2-fill-savings" id="bg2-bar-savings"></div></div>
      <div class="bg2-target-row"><span id="bg2-target-savings"></span><span id="bg2-gap-savings"></span></div>
    </div>
    <p class="bg2-note">Thanh chuyển đỏ khi thiết yếu vượt 50%, mong muốn vượt 30% hoặc tích lũy dưới 20%.</p>
  </div>

  <div class="bg2-grid2">
    <div class="bg2-col">
      <div class="bg2-section bg2-section-income">
        <div class="bg2-section-header"><h4>💵 NGUỒN THU NHẬP</h4><span class="bg2-subtotal" id="bg2-sum-income">0 đ</span></div>
        <div id="bg2-list-income" class="bg2-item-list"></div>
        <button type="button" class="bg2-add bg2-hide-print" data-bg2-type="income">+ Thêm nguồn thu</button>
      </div>
      <div class="bg2-section bg2-section-savings">
        <div class="bg2-section-header"><h4>🏦 TÍCH LŨY &amp; TRẢ NỢ (20%)</h4><span class="bg2-subtotal" id="bg2-sum-savings">0 đ</span></div>
        <div id="bg2-list-savings" class="bg2-item-list"></div>
        <button type="button" class="bg2-add bg2-hide-print" data-bg2-type="savings">+ Thêm khoản tích lũy</button>
      </div>
    </div>
    <div class="bg2-col">
      <div class="bg2-section bg2-section-needs">
        <div class="bg2-section-header"><h4>🏠 NHU CẦU THIẾT YẾU (50%)</h4><span class="bg2-subtotal" id="bg2-sum-needs">0 đ</span></div>
        <div id="bg2-list-needs" class="bg2-item-list"></div>
        <button type="button" class="bg2-add bg2-hide-print" data-bg2-type="needs">+ Thêm chi phí thiết yếu</button>
      </div>
      <div class="bg2-section bg2-section-wants">
        <div class="bg2-section-header"><h4>🛍️ MONG MUỐN &amp; SỞ THÍCH (30%)</h4><span class="bg2-subtotal" id="bg2-sum-wants">0 đ</span></div>
        <div id="bg2-list-wants" class="bg2-item-list"></div>
        <button type="button" class="bg2-add bg2-hide-print" data-bg2-type="wants">+ Thêm khoản chi cá nhân</button>
      </div>
    </div>
  </div>

  <div class="bg2-actions bg2-hide-print">
    <button type="button" class="bg2-btn" id="bg2-copy">Sao chép tóm tắt</button>
    <button type="button" class="bg2-btn" id="bg2-csv">📊 TẢI EXCEL (CSV)</button>
    <button type="button" class="bg2-btn" id="bg2-pdf">🖨️ XUẤT BÁO CÁO (PDF)</button>
    <button type="button" class="bg2-btn bg2-btn-reset" id="bg2-reset">LÀM MỚI 🔄</button>
    <span class="bg2-note" id="bg2-copy-note"></span>
  </div>

  <details class="bg2-adv">
    <summary>Cách đọc bảng và lưu ý</summary>
    <p class="bg2-note">Bảng lưu theo tháng làm chuẩn. Khi chuyển sang kỳ tuần, các số hiển thị bằng số tháng chia 4 (làm tròn); chuyển lại tháng không làm lệch số gốc. Bảng được lưu trong trình duyệt này nên tải lại trang không mất; nút LÀM MỚI sẽ xóa bảng đã lưu và trở về bảng mẫu. Tệp tải xuống là CSV (mở được bằng Excel), nút PDF mở hộp thoại in của trình duyệt.</p>
    <p class="bg2-note">“Tổng Chi Tiêu” là tổng tiền đã phân bổ, gồm cả tích lũy và trả nợ — không chỉ tiền mua hàng. Tiền còn dư bằng 0 nghĩa là toàn bộ thu nhập đã có mục đích sử dụng, trong đó có khoản tích lũy và trả nợ.</p>
  </details>

  <div class="bg2-related">
    <span class="bg2-related-title">Công cụ liên quan:</span>
    <a href="https://congcuviet.com/cong-cu/may-tinh-lai-suat-kep-compound-interest-calculator/">Lãi suất kép</a>
    <a href="https://congcuviet.com/cong-cu/cong-cu-tinh-toan-khoan-vay-va-tra-gop-loan-emi-calculator/">Khoản vay &amp; trả góp (EMI)</a>
    <a href="https://congcuviet.com/cong-cu/may-tinh-loi-tuc-dau-tu-roi-calculator/">Lợi tức đầu tư (ROI)</a>
    <a href="https://congcuviet.com/cong-cu/trinh-tinh-toan-diem-hoa-von-doanh-nghiep/">Điểm hòa vốn</a>
    <a href="https://congcuviet.com/cong-cu/tinh-lai-gui-tiet-kiem-ngan-hang/">Tính lãi gửi tiết kiệm</a>
  </div>
</div>
<script src="budget-planner-v2.js"></script>

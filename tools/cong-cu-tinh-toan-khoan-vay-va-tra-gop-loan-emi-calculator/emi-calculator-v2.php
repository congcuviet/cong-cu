<div class="em2-soft-wrapper">
  <div class="em2-card">
    <span class="em2-label">Số tiền vay</span>
    <input type="text" inputmode="numeric" class="em2-input em2-money" id="em2-inp-amount" value="200.000.000">
    <div class="em2-caprow">
      <span class="em2-cap" id="em2-amount-cap"></span>
      <span class="em2-chips">
        <button type="button" class="em2-chip" data-em2-amount="50000000">50tr</button>
        <button type="button" class="em2-chip" data-em2-amount="100000000">100tr</button>
        <button type="button" class="em2-chip" data-em2-amount="200000000">200tr</button>
        <button type="button" class="em2-chip" data-em2-amount="500000000">500tr</button>
        <button type="button" class="em2-chip" data-em2-amount="1000000000">1 tỷ</button>
      </span>
    </div>

    <div class="em2-grid2">
      <div>
        <span class="em2-label">Thời hạn vay</span>
        <div class="em2-seg-row">
          <label class="em2-seg em2-seg-sm"><input type="radio" name="em2-term" value="12"> 12</label>
          <label class="em2-seg em2-seg-sm"><input type="radio" name="em2-term" value="24"> 24</label>
          <label class="em2-seg em2-seg-sm"><input type="radio" name="em2-term" value="36" checked> 36</label>
          <label class="em2-seg em2-seg-sm"><input type="radio" name="em2-term" value="48"> 48</label>
          <label class="em2-seg em2-seg-sm"><input type="radio" name="em2-term" value="60"> 60</label>
          <label class="em2-seg em2-seg-sm"><input type="radio" name="em2-term" id="em2-term-custom" value="custom"> Khác</label>
        </div>
        <div id="em2-term-wrap" style="display:none">
          <input type="text" inputmode="numeric" class="em2-input" id="em2-inp-months" placeholder="Số tháng vay (ví dụ 84)">
        </div>
      </div>
      <div>
        <span class="em2-label">Lãi suất</span>
        <div class="em2-rate-row">
          <input type="text" inputmode="decimal" class="em2-input" id="em2-inp-rate" value="10">
          <label class="em2-seg em2-seg-sm"><input type="radio" name="em2-rateunit" id="em2-rate-year" value="year" checked> %/năm</label>
          <label class="em2-seg em2-seg-sm"><input type="radio" name="em2-rateunit" id="em2-rate-month" value="month"> %/tháng</label>
        </div>
      </div>
    </div>

    <span class="em2-label">Cách tính lãi</span>
    <div class="em2-seg-row">
      <label class="em2-seg"><input type="radio" name="em2-method" id="em2-m-reducing" value="reducing" checked> Dư nợ giảm dần</label>
      <label class="em2-seg"><input type="radio" name="em2-method" id="em2-m-flat" value="flat"> Lãi phẳng (trên nợ gốc)</label>
    </div>
    <p class="em2-note" id="em2-method-note"></p>

    <details class="em2-adv">
      <summary>Tùy chọn nâng cao: cách trả gốc, thu nhập, trả nợ trước hạn</summary>
      <span class="em2-label">Cách trả khi tính giảm dần</span>
      <div class="em2-seg-row">
        <label class="em2-seg"><input type="radio" name="em2-plan" id="em2-p-annuity" value="annuity" checked> Gốc + lãi đều mỗi tháng</label>
        <label class="em2-seg"><input type="radio" name="em2-plan" id="em2-p-equal" value="equal"> Gốc đều, lãi giảm dần</label>
      </div>
      <div class="em2-grid2">
        <div>
          <span class="em2-label">Thu nhập của bạn (đ/tháng, không bắt buộc)</span>
          <input type="text" inputmode="numeric" class="em2-input em2-money" id="em2-inp-income" placeholder="0">
          <div class="em2-cap" id="em2-income-cap"></div>
        </div>
        <div>
          <span class="em2-label">Trả thêm trước hạn (đ, không bắt buộc)</span>
          <input type="text" inputmode="numeric" class="em2-input em2-money" id="em2-inp-extra" placeholder="0">
          <div class="em2-cap" id="em2-extra-cap"></div>
        </div>
        <div>
          <span class="em2-label">Trả thêm vào tháng thứ</span>
          <input type="text" inputmode="numeric" class="em2-input" id="em2-inp-extra-month" placeholder="Ví dụ 12">
        </div>
        <div>
          <span class="em2-label">Phí trả trước hạn (% số tiền trả thêm)</span>
          <input type="text" inputmode="decimal" class="em2-input" id="em2-inp-extra-fee" placeholder="Ví dụ 2">
        </div>
      </div>
    </details>
  </div>

  <div id="em2-result">
    <div class="em2-hero">
      <div class="em2-hero-label">💸 SỐ TIỀN TRẢ MỖI THÁNG</div>
      <div class="em2-hero-value" id="em2-out-pay">0 đ</div>
      <div class="em2-hero-sub" id="em2-verdict"></div>
    </div>
    <div id="em2-insights"></div>
    <div class="em2-stats">
      <div class="em2-stat"><div class="em2-stat-label">Tổng tiền lãi</div><div class="em2-stat-value" id="em2-out-interest">0</div></div>
      <div class="em2-stat"><div class="em2-stat-label">Tổng phải trả (gốc + lãi)</div><div class="em2-stat-value" id="em2-out-total">0</div></div>
      <div class="em2-stat"><div class="em2-stat-label">Lãi chiếm</div><div class="em2-stat-value" id="em2-out-intpct">0%</div></div>
    </div>

    <div class="em2-card">
      <span class="em2-label">Lịch trả nợ theo năm</span>
      <div class="em2-table-wrap">
        <table class="em2-table">
          <thead><tr><th>Năm</th><th>Gốc</th><th>Lãi</th><th>Tổng trả</th><th>Dư nợ cuối năm</th></tr></thead>
          <tbody id="em2-year-body"></tbody>
        </table>
      </div>
      <details class="em2-adv">
        <summary>Xem chi tiết từng tháng</summary>
        <div class="em2-table-wrap">
          <table class="em2-table">
            <thead><tr><th>Kỳ</th><th>Dư nợ đầu kỳ</th><th>Gốc</th><th>Lãi</th><th>Tổng trả</th><th>Dư nợ còn lại</th></tr></thead>
            <tbody id="em2-month-body"></tbody>
          </table>
        </div>
      </details>
    </div>

    <div class="em2-actions">
      <button type="button" class="em2-btn" id="em2-btn-copy">📋 Sao chép kết quả</button>
      <button type="button" class="em2-btn" id="em2-btn-dl">⬇️ Tải lịch trả nợ (.csv)</button>
      <span class="em2-note" id="em2-copy-msg"></span>
    </div>
    <p class="em2-note">Cách tính: “Dư nợ giảm dần” tính lãi trên số tiền còn nợ thực tế giảm dần từng tháng (chuẩn ngân hàng cho vay mua nhà, mua xe). “Lãi phẳng” tính lãi trên toàn bộ số tiền vay ban đầu suốt kỳ hạn (cách các công ty tài chính và gói trả góp tiêu dùng thường báo giá) — tổng lãi cao hơn hẳn ở cùng một mức lãi suất danh nghĩa. Kết quả mang tính tham khảo; lãi suất thực tế còn tùy hồ sơ và chính sách từng ngân hàng.</p>

    <div class="em2-related">
      <span class="em2-related-title">Công cụ liên quan:</span>
      <a href="https://congcuviet.com/cong-cu/so-sanh-hai-khoan-vay/">So sánh hai khoản vay</a>
      <a href="https://congcuviet.com/cong-cu/tinh-ke-hoach-tra-no-debt-payoff-calculator/">Lập kế hoạch trả nợ</a>
      <a href="https://congcuviet.com/cong-cu/tinh-thoi-gian-tra-het-no-the-tin-dung-credit-card-payoff-calculator/">Trả hết nợ thẻ tín dụng</a>
      <a href="https://congcuviet.com/cong-cu/may-tinh-lai-suat-kep-compound-interest-calculator/">Tính lãi kép</a>
      <a href="https://congcuviet.com/cong-cu/tinh-lai-gui-tiet-kiem-ngan-hang/">Tính lãi gửi tiết kiệm</a>
      <a href="https://congcuviet.com/cong-cu/tinh-ty-le-no-tren-thu-nhap-dti-debt-to-income-ratio-calculator/">Tỷ lệ nợ trên thu nhập (DTI)</a>
    </div>
  </div>
</div>
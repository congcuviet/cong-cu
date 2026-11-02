<div class="gn3-soft-wrapper">
  <div class="gn3-card">
    <span class="gn3-label">Lương Gross (đ/tháng)</span>
    <input type="text" inputmode="numeric" class="gn3-input gn3-money" id="gn3-inp-gross" value="20.000.000">
    <div class="gn3-caprow">
      <span class="gn3-cap" id="gn3-gross-cap"></span>
      <span class="gn3-chips">
        <button type="button" class="gn3-chip" data-gn3-gross="10000000">10tr</button>
        <button type="button" class="gn3-chip" data-gn3-gross="15000000">15tr</button>
        <button type="button" class="gn3-chip" data-gn3-gross="20000000">20tr</button>
        <button type="button" class="gn3-chip" data-gn3-gross="25000000">25tr</button>
        <button type="button" class="gn3-chip" data-gn3-gross="30000000">30tr</button>
        <button type="button" class="gn3-chip" data-gn3-gross="50000000">50tr</button>
      </span>
    </div>

    <div class="gn3-grid2">
      <div>
        <span class="gn3-label">Người phụ thuộc</span>
        <div class="gn3-stepper">
          <button type="button" class="gn3-step" id="gn3-dep-minus" aria-label="Giảm">−</button>
          <input type="text" inputmode="numeric" class="gn3-input gn3-step-num" id="gn3-inp-dep" value="0">
          <button type="button" class="gn3-step" id="gn3-dep-plus" aria-label="Tăng">+</button>
        </div>
      </div>
      <div>
        <span class="gn3-label">Vùng lương tối thiểu</span>
        <div class="gn3-seg-row">
          <label class="gn3-seg gn3-seg-sm"><input type="radio" name="gn3-region" value="1" checked> I</label>
          <label class="gn3-seg gn3-seg-sm"><input type="radio" name="gn3-region" value="2"> II</label>
          <label class="gn3-seg gn3-seg-sm"><input type="radio" name="gn3-region" value="3"> III</label>
          <label class="gn3-seg gn3-seg-sm"><input type="radio" name="gn3-region" value="4"> IV</label>
        </div>
      </div>
    </div>

    <div class="gn3-grid2">
      <div>
        <span class="gn3-label">Lương đóng bảo hiểm</span>
        <div class="gn3-seg-row">
          <label class="gn3-seg"><input type="radio" name="gn3-insmode" id="gn3-ins-auto" checked> Bằng Gross</label>
          <label class="gn3-seg"><input type="radio" name="gn3-insmode" id="gn3-ins-fixed"> Mức khác</label>
        </div>
        <div id="gn3-ins-wrap" style="display:none">
          <input type="text" inputmode="numeric" class="gn3-input gn3-money" id="gn3-inp-ins-base" placeholder="Mức lương đóng bảo hiểm (đ/tháng)">
          <div class="gn3-cap" id="gn3-ins-cap"></div>
        </div>
      </div>
      <div>
        <span class="gn3-label">Bộ quy định áp dụng</span>
        <div class="gn3-seg-row">
          <label class="gn3-seg"><input type="radio" name="gn3-regime" id="gn3-reg-2026" value="2026" checked> 2026</label>
          <label class="gn3-seg"><input type="radio" name="gn3-regime" id="gn3-reg-2025" value="2025"> 2025 (đối chiếu)</label>
        </div>
        <p class="gn3-note" id="gn3-regime-hint"></p>
      </div>
    </div>

    <details class="gn3-adv">
      <summary>Tùy chọn nâng cao: ăn ca, thu nhập khác, giảm trừ khác</summary>
      <div class="gn3-grid2">
        <div>
          <span class="gn3-label">Phụ cấp ăn ca (đ/tháng)</span>
          <input type="text" inputmode="numeric" class="gn3-input gn3-money" id="gn3-inp-meal" placeholder="0">
          <div class="gn3-cap" id="gn3-meal-cap"></div>
          <p class="gn3-note" id="gn3-meal-hint"></p>
        </div>
        <div>
          <span class="gn3-label">Thu nhập khác chịu thuế (đ/tháng)</span>
          <input type="text" inputmode="numeric" class="gn3-input gn3-money" id="gn3-inp-other-tax" placeholder="0">
          <div class="gn3-cap" id="gn3-othertax-cap"></div>
        </div>
        <div>
          <span class="gn3-label">Thu nhập không chịu thuế khác (đ/tháng)</span>
          <input type="text" inputmode="numeric" class="gn3-input gn3-money" id="gn3-inp-other-free" placeholder="0">
          <div class="gn3-cap" id="gn3-otherfree-cap"></div>
        </div>
        <div>
          <span class="gn3-label">Giảm trừ khác (đ/tháng)</span>
          <input type="text" inputmode="numeric" class="gn3-input gn3-money" id="gn3-inp-deduct" placeholder="0">
          <div class="gn3-cap" id="gn3-deduct-cap"></div>
        </div>
      </div>
    </details>
  </div>

  <div id="gn3-result">
    <div class="gn3-hero">
      <div class="gn3-hero-label">💵 LƯƠNG NET THỰC NHẬN / THÁNG</div>
      <div class="gn3-hero-value" id="gn3-out-net">0 đ</div>
      <div class="gn3-hero-sub" id="gn3-verdict"></div>
    </div>
    <p class="gn3-delta" id="gn3-delta"></p>
    <div class="gn3-stats">
      <div class="gn3-stat"><div class="gn3-stat-label">Lương Gross</div><div class="gn3-stat-value" id="gn3-out-gross">0</div></div>
      <div class="gn3-stat"><div class="gn3-stat-label">Bảo hiểm bạn đóng (10,5%)</div><div class="gn3-stat-value" id="gn3-out-ins">0</div></div>
      <div class="gn3-stat"><div class="gn3-stat-label">Thuế TNCN</div><div class="gn3-stat-value" id="gn3-out-tax">0</div></div>
      <div class="gn3-stat"><div class="gn3-stat-label">Tổng chi phí doanh nghiệp</div><div class="gn3-stat-value" id="gn3-out-employer">0</div></div>
    </div>

    <div class="gn3-card">
      <span class="gn3-label">Diễn giải chi tiết</span>
      <div id="gn3-detail"></div>
    </div>

    <div class="gn3-card">
      <span class="gn3-label">Thuế TNCN theo từng bậc lũy tiến</span>
      <div id="gn3-brackets"></div>
      <p class="gn3-note">Thuế được tính luỹ tiến từng phần: mỗi bậc chỉ áp thuế suất của bậc đó cho phần thu nhập nằm trong bậc.</p>
    </div>

    <div class="gn3-actions">
      <button type="button" class="gn3-btn" id="gn3-btn-copy">📋 Sao chép kết quả</button>
      <button type="button" class="gn3-btn" id="gn3-btn-dl">⬇️ Tải kết quả (.txt)</button>
      <span class="gn3-note" id="gn3-copy-msg"></span>
    </div>
    <p class="gn3-note">Căn cứ: bảo hiểm bắt buộc theo Luật BHXH/BHYT/BHTN (NLĐ đóng 8% + 1,5% + 1%; trần căn cứ BHXH/BHYT = 20 × lương cơ sở, trần BHTN = 20 × lương tối thiểu vùng); giảm trừ và biểu thuế theo bộ quy định đang chọn (2026: giảm trừ 15,5 triệu + 6,2 triệu/người phụ thuộc, biểu 5 bậc; 2025: 11 triệu + 4,4 triệu, biểu 7 bậc). Kết quả mang tính tham khảo.</p>

    <div class="gn3-related">
      <span class="gn3-related-title">Công cụ liên quan:</span>
      <a href="https://congcuviet.com/cong-cu/tinh-luong-net-sang-gross-viet-nam/">Tính lương Net → Gross</a>
      <a href="https://congcuviet.com/cong-cu/trinh-tinh-thue-thu-nhap-ca-nhan-pit/">Tính thuế TNCN</a>
      <a href="https://congcuviet.com/cong-cu/cong-cu-tinh-bao-hiem-xa-hoi-bhxh/">Tính bảo hiểm xã hội</a>
      <a href="https://congcuviet.com/cong-cu/tinh-tien-bhxh-mot-lan/">Tính BHXH một lần (Luật 2024)</a>
      <a href="https://congcuviet.com/cong-cu/tinh-luong-tang-ca-ca-dem/">Tính lương tăng ca &amp; ca đêm</a>
    </div>
  </div>
</div>

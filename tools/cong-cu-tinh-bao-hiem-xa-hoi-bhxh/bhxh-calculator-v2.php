<div class="bh2-soft-wrapper">
  <div class="bh2-card">
    <span class="bh2-label">Mức lương đóng bảo hiểm (đ/tháng)</span>
    <input type="text" inputmode="numeric" class="bh2-input bh2-money" id="bh2-inp-salary" value="15.000.000">
    <div class="bh2-caprow">
      <span class="bh2-cap" id="bh2-salary-cap"></span>
      <span class="bh2-chips">
        <button type="button" class="bh2-chip" data-bh2-salary="10000000">10tr</button>
        <button type="button" class="bh2-chip" data-bh2-salary="15000000">15tr</button>
        <button type="button" class="bh2-chip" data-bh2-salary="30000000">30tr</button>
        <button type="button" class="bh2-chip" data-bh2-salary="50000000">50tr</button>
        <button type="button" class="bh2-chip" data-bh2-salary="100000000">100tr</button>
      </span>
    </div>
    <p class="bh2-note">Nhập mức lương làm căn cứ đóng ghi trên hợp đồng, không phải toàn bộ thu nhập thực nhận.</p>

    <div class="bh2-grid2">
      <div>
        <span class="bh2-label">Vùng doanh nghiệp hoạt động</span>
        <div class="bh2-seg-row" id="bh2-region-row">
          <label class="bh2-seg"><input type="radio" name="bh2-region" value="1" checked> Vùng I</label>
          <label class="bh2-seg"><input type="radio" name="bh2-region" value="2"> Vùng II</label>
          <label class="bh2-seg"><input type="radio" name="bh2-region" value="3"> Vùng III</label>
          <label class="bh2-seg"><input type="radio" name="bh2-region" value="4"> Vùng IV</label>
        </div>
        <p class="bh2-note" id="bh2-region-hint"></p>
      </div>
      <div>
        <span class="bh2-label">Bộ thông số áp dụng</span>
        <div class="bh2-seg-row">
          <label class="bh2-seg"><input type="radio" name="bh2-regime" value="current" checked> Hiện tại (từ 01/07/2026)</label>
          <label class="bh2-seg"><input type="radio" name="bh2-regime" value="old"> Trước 01/07/2026 (đối chiếu)</label>
        </div>
        <p class="bh2-note" id="bh2-regime-hint"></p>
      </div>
    </div>
  </div>

  <div id="bh2-result">
    <p class="bh2-err" id="bh2-err" hidden></p>
    <div class="bh2-hero2" id="bh2-hero">
      <div class="bh2-hero-cell">
        <div class="bh2-hero-label">👤 NGƯỜI LAO ĐỘNG ĐÓNG / THÁNG</div>
        <div class="bh2-hero-value" id="bh2-out-emp">0 đ</div>
        <div class="bh2-hero-sub">10,5% trên từng căn cứ sau khi áp trần</div>
      </div>
      <div class="bh2-hero-cell">
        <div class="bh2-hero-label">🏢 DOANH NGHIỆP ĐÓNG / THÁNG</div>
        <div class="bh2-hero-value" id="bh2-out-com">0 đ</div>
        <div class="bh2-hero-sub">21,5% trên từng căn cứ sau khi áp trần</div>
      </div>
    </div>
    <p class="bh2-verdict" id="bh2-verdict"></p>
    <div class="bh2-stats">
      <div class="bh2-stat"><div class="bh2-stat-label">Căn cứ BHXH / BHYT</div><div class="bh2-stat-value" id="bh2-out-base1">0</div></div>
      <div class="bh2-stat"><div class="bh2-stat-label">Căn cứ BHTN</div><div class="bh2-stat-value" id="bh2-out-base2">0</div></div>
      <div class="bh2-stat"><div class="bh2-stat-label">Còn lại trước thuế</div><div class="bh2-stat-value" id="bh2-out-remain">0</div></div>
      <div class="bh2-stat"><div class="bh2-stat-label">Tổng đóng cả năm (×12)</div><div class="bh2-stat-value" id="bh2-out-year">0</div></div>
    </div>
    <p class="bh2-note" style="margin-top:-6px">“Còn lại trước thuế” = lương nhập trừ phần người lao động đóng; chưa trừ thuế thu nhập cá nhân nên chưa phải lương thực nhận.</p>

    <details class="bh2-adv">
      <summary>Chi tiết: bảng trích nộp, căn cứ &amp; căn cứ pháp lý</summary>
      <div id="bh2-detail"></div>
      <p class="bh2-note">Tỷ lệ cố định cả hai bộ thông số: người lao động BHXH 8% + BHYT 1,5% + BHTN 1% = 10,5%; doanh nghiệp BHXH 17,5% (hưu trí 14% + ốm đau 3% + tai nạn lao động 0,5%) + BHYT 3% + BHTN 1% = 21,5%. Mỗi khoản làm tròn đến đồng trước khi cộng thành tổng. Chỉ khi cả ba căn cứ đều bằng lương nhập thì tổng mới đúng bằng 10,5% / 21,5% lương.</p>
      <p class="bh2-note">Căn cứ: Nghị định 293/2025/NĐ-CP (lương tối thiểu vùng từ 01/01/2026: I 5.310.000đ, II 4.730.000đ, III 4.140.000đ, IV 3.700.000đ; trần BHTN = 20 lần mức vùng) và Nghị định 161/2026/NĐ-CP (lương cơ sở 2.530.000đ từ 01/07/2026; trần BHXH/BHYT = 20 lần = 50.600.000đ) theo hướng dẫn thu của Bảo hiểm xã hội Việt Nam. Bộ đối chiếu (trước 01/07/2026): lương cơ sở 2.340.000đ, trần BHXH/BHYT 46.800.000đ, lương tối thiểu vùng theo Nghị định 74/2024/NĐ-CP (I 4.960.000đ, II 4.410.000đ, III 3.860.000đ, IV 3.450.000đ). Kết quả mang tính tham khảo, không thay thế xác nhận của đơn vị phụ trách hoặc cơ quan bảo hiểm.</p>
    </details>

    <div class="bh2-actions">
      <button type="button" class="bh2-btn" id="bh2-btn-copy">📋 Sao chép kết quả</button>
      <button type="button" class="bh2-btn" id="bh2-btn-dl">⬇️ Tải kết quả (.txt)</button>
      <span class="bh2-note" id="bh2-copy-msg"></span>
    </div>

    <div class="bh2-related">
      <span class="bh2-related-title">Công cụ liên quan:</span>
      <a href="https://congcuviet.com/cong-cu/cong-cu-tinh-luong-gross-sang-net/">Tính lương Gross → Net</a>
      <a href="https://congcuviet.com/cong-cu/trinh-tinh-thue-thu-nhap-ca-nhan-pit/">Tính thuế TNCN</a>
      <a href="https://congcuviet.com/cong-cu/tinh-tien-bhxh-mot-lan/">Tính BHXH một lần</a>
      <a href="https://congcuviet.com/cong-cu/tinh-luong-tang-ca-ca-dem/">Tính lương tăng ca &amp; ca đêm</a>
      <a href="https://congcuviet.com/cong-cu/tinh-tro-cap-bao-hiem-that-nghiep/">Tính bảo hiểm thất nghiệp</a>
    </div>
  </div>
</div>
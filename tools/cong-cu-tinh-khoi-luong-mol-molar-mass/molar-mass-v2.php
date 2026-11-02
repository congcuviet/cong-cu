<div class="mm2-soft-wrapper">
  <div class="mm2-formcard">
  <div class="mm2-group">
    <label class="mm2-label" for="mm2Formula">Công thức hóa học</label>
    <input type="text" id="mm2Formula" class="mm2-input" value="H2O" placeholder="Ví dụ: H2O, Ca(OH)2, CuSO4.5H2O" autocomplete="off">
    <p class="mm2-pretty" id="mm2Pretty">Công thức đã hiểu: H₂O</p>
  </div>
  <div class="mm2-examples">
    <span class="mm2-ex-label">Ví dụ nhanh:</span>
    <button type="button" class="mm2-ex" data-formula="H2O">H2O</button>
    <button type="button" class="mm2-ex" data-formula="CaCO3">CaCO3</button>
    <button type="button" class="mm2-ex" data-formula="Ca(OH)2">Ca(OH)2</button>
    <button type="button" class="mm2-ex" data-formula="CuSO4.5H2O">CuSO4.5H2O</button>
    <button type="button" class="mm2-ex" data-formula="C6H12O6">C6H12O6</button>
  </div>
  <div class="mm2-error hidden" id="mm2Error"></div>
  </div>
  <div class="mm2-result" id="mm2Result">
    <div class="mm2-hero">M = <span id="mm2Total">18,015</span> g/mol</div>
    <p class="mm2-sub" id="mm2Sub">2 nguyên tố · 3 nguyên tử trong một đơn vị công thức</p>
    <p class="mm2-note hidden" id="mm2CoefNote"></p>
    <div class="mm2-tablewrap">
      <table class="mm2-table">
        <thead>
          <tr><th>Nguyên tố</th><th>Số lượng</th><th>Nguyên tử khối</th><th>Đóng góp (g/mol)</th><th>Phần trăm</th></tr>
        </thead>
        <tbody id="mm2Body"></tbody>
      </table>
    </div>
    <div class="mm2-actions">
      <button type="button" class="mm2-btn" id="mm2Copy">Sao chép kết quả</button>
      <button type="button" class="mm2-btn mm2-btn-ghost" id="mm2Download">Tải txt</button>
    </div>
  </div>
  <details class="mm2-adv">
    <summary>Đổi khối lượng ↔ số mol (tùy chọn)</summary>
    <div class="mm2-grid2">
      <div class="mm2-group">
        <label class="mm2-label" for="mm2SampleMass">Khối lượng mẫu (g)</label>
        <input type="text" id="mm2SampleMass" class="mm2-input" inputmode="decimal" placeholder="Ví dụ: 36,03" autocomplete="off">
        <p class="mm2-line" id="mm2MolesLine">Số mol: —</p>
      </div>
      <div class="mm2-group">
        <label class="mm2-label" for="mm2SampleMoles">Số mol (mol)</label>
        <input type="text" id="mm2SampleMoles" class="mm2-input" inputmode="decimal" placeholder="Ví dụ: 0,5" autocomplete="off">
        <p class="mm2-line" id="mm2MassLine">Khối lượng: —</p>
      </div>
    </div>
    <p class="mm2-hint">Dùng n = m / M và m = n × M với M ở trên. Dấu phẩy thập phân kiểu Việt Nam được chấp nhận.</p>
  </details>
  <div class="mm2-toast" id="mm2Toast">Đã sao chép</div>
</div>

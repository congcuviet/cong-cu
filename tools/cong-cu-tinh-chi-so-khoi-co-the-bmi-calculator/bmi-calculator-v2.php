<div class="bm2-soft-wrapper">
  <div class="bm2-card">
    <div class="bm2-grid2">
      <div>
        <span class="bm2-label">Chiều cao (cm)</span>
        <input type="text" inputmode="decimal" class="bm2-input" id="bm2-inp-height" value="165">
        <div class="bm2-cap" id="bm2-height-cap"></div>
      </div>
      <div>
        <span class="bm2-label">Cân nặng (kg)</span>
        <input type="text" inputmode="decimal" class="bm2-input" id="bm2-inp-weight" value="60">
        <div class="bm2-cap" id="bm2-weight-cap"></div>
      </div>
    </div>
  </div>

  <div id="bm2-result">
    <div class="bm2-hero">
      <div class="bm2-hero-label">⚖️ CHỈ SỐ BMI CỦA BẠN</div>
      <div class="bm2-hero-value" id="bm2-out-bmi">0</div>
      <div class="bm2-hero-sub" id="bm2-out-cat"></div>
    </div>

    <div class="bm2-gauge-wrap">
      <div class="bm2-gauge">
        <div class="bm2-gseg" style="left:0%;width:17.31%;background:#93c5fd"></div>
        <div class="bm2-gseg" style="left:17.31%;width:17.31%;background:#34d399"></div>
        <div class="bm2-gseg" style="left:34.62%;width:7.69%;background:#fcd34d"></div>
        <div class="bm2-gseg" style="left:42.31%;width:19.23%;background:#fb923c"></div>
        <div class="bm2-gseg" style="left:61.54%;width:19.23%;background:#f87171"></div>
        <div class="bm2-gseg" style="left:80.77%;width:19.23%;background:#b91c1c"></div>
        <div class="bm2-gmark" id="bm2-gmark"></div>
      </div>
      <div class="bm2-glabels"><span style="left:0%">14</span><span style="left:17.31%">18,5</span><span style="left:34.62%">23</span><span style="left:42.31%">25</span><span style="left:61.54%">30</span><span style="left:80.77%">35</span><span style="left:100%">40</span></div>
    </div>

    <p class="bm2-delta" id="bm2-delta"></p>

    <div class="bm2-stats">
      <div class="bm2-stat"><div class="bm2-stat-label">Cân nặng khỏe mạnh cho chiều cao này</div><div class="bm2-stat-value" id="bm2-out-range">—</div></div>
      <div class="bm2-stat"><div class="bm2-stat-label">Phân loại (chuẩn châu Á)</div><div class="bm2-stat-value" id="bm2-out-cat2">—</div></div>
    </div>

    <details class="bm2-adv">
      <summary>Chi tiết: đo vòng eo, bảng phân loại và lưu ý</summary>
      <div class="bm2-grid2">
        <div>
          <span class="bm2-label">Giới tính (chỉ để đối chiếu vòng eo)</span>
          <div class="bm2-seg-row">
            <label class="bm2-seg"><input type="radio" name="bm2-sex" id="bm2-sex-m" value="m" checked> Nam</label>
            <label class="bm2-seg"><input type="radio" name="bm2-sex" id="bm2-sex-f" value="f"> Nữ</label>
          </div>
        </div>
        <div>
          <span class="bm2-label">Vòng eo (cm, không bắt buộc)</span>
          <input type="text" inputmode="decimal" class="bm2-input" id="bm2-inp-waist" placeholder="Ví dụ 82">
        </div>
      </div>
      <p class="bm2-note" id="bm2-waist-note"></p>

      <span class="bm2-label">Bảng phân loại BMI cho người châu Á (Bộ Y tế 2022)</span>
      <div class="bm2-table-wrap">
        <table class="bm2-table">
          <thead><tr><th>Phân loại</th><th>Khoảng BMI</th></tr></thead>
          <tbody id="bm2-class-body"></tbody>
        </table>
      </div>
      <p class="bm2-note">Đối chiếu: theo chuẩn quốc tế WHO, khoảng bình thường là 18,5–24,9 và béo phì tính từ 30 — ngưỡng quốc tế “dễ thở” hơn vì nguy cơ tiểu đường và tim mạch ở người châu Á tăng sớm hơn, ngay từ BMI 23. Công thức: BMI = cân nặng (kg) ÷ [chiều cao (m)]².</p>
    </details>

    <div class="bm2-actions">
      <button type="button" class="bm2-btn" id="bm2-btn-copy">📋 Sao chép kết quả</button>
      <span class="bm2-note" id="bm2-copy-msg"></span>
    </div>
    <p class="bm2-note">BMI là chỉ số sàng lọc tham khảo, không phải chẩn đoán y khoa. Chỉ số này không áp dụng cho trẻ em và thanh thiếu niên dưới 18 tuổi (cần biểu đồ tăng trưởng theo tuổi — xem công cụ BMI trẻ em bên dưới), phụ nữ đang mang thai, và có thể sai lệch ở vận động viên nhiều cơ bắp hoặc người cao tuổi bị mất cơ.</p>

    <div class="bm2-related">
      <span class="bm2-related-title">Công cụ liên quan:</span>
      <a href="https://congcuviet.com/cong-cu/may-tinh-ty-le-trao-doi-chat-co-ban-bmr-calculator/">Tính BMR</a>
      <a href="https://congcuviet.com/cong-cu/cong-cu-tinh-luong-calo-tieu-thu-hang-ngay-tdee/">Tính TDEE & calo mỗi ngày</a>
      <a href="https://congcuviet.com/cong-cu/may-tinh-ty-le-mo-co-the-body-fat-percentage-calculator/">Tỷ lệ mỡ cơ thể</a>
      <a href="https://congcuviet.com/cong-cu/tinh-tham-hut-calo-lo-trinh-giam-can/">Thâm hụt calo & giảm cân</a>
      <a href="https://congcuviet.com/cong-cu/tinh-calo-tieu-hao-khi-van-dong-tap-luyen/">Calo tiêu hao khi tập</a>
      <a href="https://congcuviet.com/cong-cu/tinh-chi-so-bmi-tre-em/">BMI cho trẻ em</a>
    </div>
  </div>
</div>
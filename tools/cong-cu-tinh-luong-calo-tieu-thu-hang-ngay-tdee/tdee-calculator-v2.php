<div class="td2-soft-wrapper">
  <div class="td2-card">
    <div class="td2-grid2">
      <div>
        <span class="td2-label">Giới tính</span>
        <div class="td2-seg-row">
          <label class="td2-seg"><input type="radio" name="td2-sex" id="td2-sex-m" value="m"> Nam</label>
          <label class="td2-seg"><input type="radio" name="td2-sex" id="td2-sex-f" value="f" checked> Nữ</label>
        </div>
      </div>
      <div>
        <span class="td2-label">Tuổi</span>
        <input type="text" inputmode="numeric" class="td2-input" id="td2-inp-age" value="30">
      </div>
      <div>
        <span class="td2-label">Cân nặng (kg)</span>
        <input type="text" inputmode="decimal" class="td2-input" id="td2-inp-weight" value="60">
        <div class="td2-cap" id="td2-weight-cap"></div>
      </div>
      <div>
        <span class="td2-label">Chiều cao (cm)</span>
        <input type="text" inputmode="decimal" class="td2-input" id="td2-inp-height" value="165">
        <div class="td2-cap" id="td2-height-cap"></div>
      </div>
    </div>

    <span class="td2-label">Mức độ vận động</span>
    <div class="td2-act-list" id="td2-act-list">
      <label class="td2-seg td2-act"><input type="radio" name="td2-act" value="1.2"> <span>Ít vận động — văn phòng, hầu như không tập</span><b>×1,2</b></label>
      <label class="td2-seg td2-act"><input type="radio" name="td2-act" value="1.375"> <span>Vận động nhẹ — tập 1–3 buổi/tuần</span><b>×1,375</b></label>
      <label class="td2-seg td2-act"><input type="radio" name="td2-act" value="1.55" checked> <span>Vận động vừa — tập 3–5 buổi/tuần</span><b>×1,55</b></label>
      <label class="td2-seg td2-act"><input type="radio" name="td2-act" value="1.725"> <span>Vận động nặng — tập 6–7 buổi/tuần</span><b>×1,725</b></label>
      <label class="td2-seg td2-act"><input type="radio" name="td2-act" value="1.9"> <span>Rất nặng — vận động viên, lao động thể lực nặng</span><b>×1,9</b></label>
    </div>
  </div>

  <div id="td2-result">
    <div class="td2-hero">
      <div class="td2-hero-label">🔥 CALO DUY TRÌ MỖI NGÀY (TDEE)</div>
      <div class="td2-hero-value" id="td2-out-tdee">0</div>
      <div class="td2-hero-sub" id="td2-verdict"></div>
    </div>

    <div class="td2-stats">
      <div class="td2-stat"><div class="td2-stat-label">BMR (năng lượng cơ bản)</div><div class="td2-stat-value" id="td2-out-bmr">0</div></div>
      <div class="td2-stat"><div class="td2-stat-label">Calo duy trì mỗi tuần</div><div class="td2-stat-value" id="td2-out-week">0</div></div>
    </div>

    <div class="td2-card">
      <span class="td2-label">Mức calo theo mục tiêu</span>
      <div id="td2-goals"></div>
      <p class="td2-note" id="td2-floor-note"></p>
    </div>

    <details class="td2-adv">
      <summary>Chi tiết: % mỡ cơ thể, TDEE ở các mức vận động, cách hiệu chỉnh</summary>
      <span class="td2-label">% mỡ cơ thể (không bắt buộc — biết thì kết quả sát hơn)</span>
      <input type="text" inputmode="decimal" class="td2-input" id="td2-inp-bf" placeholder="Ví dụ 25">
      <p class="td2-note" id="td2-bf-note"></p>

      <span class="td2-label">Nếu bạn vận động ở mức khác</span>
      <div class="td2-table-wrap">
        <table class="td2-table">
          <thead><tr><th>Mức vận động</th><th>Hệ số</th><th>TDEE (kcal/ngày)</th></tr></thead>
          <tbody id="td2-levels-body"></tbody>
        </table>
      </div>

      <p class="td2-note">Công thức BMR: Mifflin-St Jeor (1990) — công thức được kiểm chứng là sát nhất trong các công thức phổ biến (nghiên cứu tổng quan Frankenfield 2005); khi bạn nhập % mỡ, công cụ chuyển sang Katch-McArdle tính theo khối nạc. Mọi công thức đều là ước tính khởi đầu, sai số cá nhân ±10% là bình thường.</p>
      <p class="td2-note">Cách hiệu chỉnh thực tế: ăn đúng mức duy trì ở trên trong 2 tuần, cân mỗi sáng và nhìn xu hướng tuần. Nếu cân vẫn nhích lên/xuống ngoài ý muốn, chỉnh ∓100–200 kcal/ngày rồi theo dõi tiếp — số đo thật của cơ thể bạn luôn thắng công thức.</p>
    </details>

    <div class="td2-actions">
      <button type="button" class="td2-btn" id="td2-btn-copy">📋 Sao chép kết quả</button>
      <span class="td2-note" id="td2-copy-msg"></span>
    </div>
    <p class="td2-note">Bảng mục tiêu dùng quy ước 7.700 kcal ≈ 1 kg mỡ: giảm/tăng 0,25 kg/tuần ≈ ∓275 kcal/ngày, 0,5 kg/tuần ≈ ∓550 kcal/ngày. Đây là ước tính ban đầu tuyến tính — thực tế tốc độ thay đổi sẽ chậm dần khi cân nặng thay đổi. Mức giảm được chặn ở sàn an toàn 1.200 kcal/ngày (nữ) và 1.500 kcal/ngày (nam); ăn thấp hơn cần có theo dõi y tế.</p>

    <div class="td2-related">
      <span class="td2-related-title">Công cụ liên quan:</span>
      <a href="https://congcuviet.com/cong-cu/may-tinh-ty-le-trao-doi-chat-co-ban-bmr-calculator/">Tính BMR</a>
      <a href="https://congcuviet.com/cong-cu/cong-cu-tinh-chi-so-khoi-co-the-bmi-calculator/">Tính BMI</a>
      <a href="https://congcuviet.com/cong-cu/tinh-tham-hut-calo-lo-trinh-giam-can/">Thâm hụt calo & giảm cân</a>
      <a href="https://congcuviet.com/cong-cu/tinh-calo-tieu-hao-khi-van-dong-tap-luyen/">Calo tiêu hao khi tập</a>
      <a href="https://congcuviet.com/cong-cu/may-tinh-ty-le-macro-protein-carb-fat-macronutrient-calculator/">Chia macro protein/carb/fat</a>
      <a href="https://congcuviet.com/cong-cu/may-tinh-ty-le-mo-co-the-body-fat-percentage-calculator/">Tỷ lệ mỡ cơ thể</a>
    </div>
  </div>
</div>

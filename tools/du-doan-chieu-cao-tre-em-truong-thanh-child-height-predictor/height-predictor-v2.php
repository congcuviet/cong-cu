<div class="hp2-soft-wrapper">
  <div class="hp2-grid">
    <div class="hp2-card hp2-form-card">
      <div class="hp2-group">
        <span class="hp2-label">Giới tính của bé</span>
        <div class="hp2-seg">
          <label class="hp2-seg-item hp2-seg-boy"><input type="radio" name="hp2-gender" value="boy" checked><span>👦 Bé Trai</span></label>
          <label class="hp2-seg-item hp2-seg-girl"><input type="radio" name="hp2-gender" value="girl"><span>👧 Bé Gái</span></label>
        </div>
      </div>
      <div class="hp2-grid2">
        <div class="hp2-group">
          <label class="hp2-label" for="hp2-dad">Chiều cao của Bố (cm)</label>
          <input id="hp2-dad" type="text" inputmode="decimal" autocomplete="off" value="172">
          <div class="hp2-words" id="hp2-dad-words"></div>
        </div>
        <div class="hp2-group">
          <label class="hp2-label" for="hp2-mom">Chiều cao của Mẹ (cm)</label>
          <input id="hp2-mom" type="text" inputmode="decimal" autocomplete="off" value="158">
          <div class="hp2-words" id="hp2-mom-words"></div>
        </div>
      </div>
      <div class="hp2-group">
        <span class="hp2-label">Phương pháp dự đoán</span>
        <div class="hp2-seg">
          <label class="hp2-seg-item hp2-seg-method"><input type="radio" name="hp2-method" value="tanner" checked><span>🧬 Cơ bản (Theo Gen Bố Mẹ)</span></label>
          <label class="hp2-seg-item hp2-seg-method"><input type="radio" name="hp2-method" value="khamis"><span>📈 Chi tiết (Khamis-Roche)</span></label>
        </div>
      </div>
      <div id="hp2-khamis" class="hp2-khamis" hidden>
        <div class="hp2-khamis-note">💡 Dành cho trẻ từ 4 đến 17 tuổi. Phương pháp này kết hợp gen và thể trạng hiện tại.</div>
        <div class="hp2-grid3">
          <div class="hp2-group">
            <label class="hp2-label" for="hp2-age">Tuổi của bé</label>
            <input id="hp2-age" type="text" inputmode="numeric" autocomplete="off" value="8">
            <div class="hp2-words" id="hp2-age-words"></div>
          </div>
          <div class="hp2-group">
            <label class="hp2-label" for="hp2-cheight">Chiều cao hiện tại (cm)</label>
            <input id="hp2-cheight" type="text" inputmode="decimal" autocomplete="off" value="130">
            <div class="hp2-words" id="hp2-cheight-words"></div>
          </div>
          <div class="hp2-group">
            <label class="hp2-label" for="hp2-cweight">Cân nặng hiện tại (kg)</label>
            <input id="hp2-cweight" type="text" inputmode="decimal" autocomplete="off" value="28">
            <div class="hp2-words" id="hp2-cweight-words"></div>
          </div>
        </div>
      </div>
      <div class="hp2-chips">
        <button type="button" class="hp2-chip" id="hp2-chip-basic">Ví dụ cơ bản: bố 172 / mẹ 158</button>
        <button type="button" class="hp2-chip" id="hp2-chip-detail">Ví dụ chi tiết: bé 8 tuổi, 130 cm, 28 kg</button>
      </div>
      <div class="hp2-error" id="hp2-error" hidden></div>
    </div>
    <div class="hp2-card hp2-result-card">
      <div id="hp2-result-body">
        <div class="hp2-hero" id="hp2-hero">
          <div class="hp2-hero-label">Chiều cao dự đoán lúc trưởng thành</div>
          <div class="hp2-hero-value"><span id="hp2-hero-num">171,5</span> <small>cm</small></div>
          <div class="hp2-method-pill" id="hp2-method-name">Phương pháp: Cơ bản (Theo Gen Bố Mẹ)</div>
        </div>
        <div class="hp2-range">
          <div class="hp2-range-card hp2-range-min"><span class="hp2-range-tag">Thấp nhất</span><strong id="hp2-min">163,0</strong><span>cm</span></div>
          <div class="hp2-range-card hp2-range-mid"><span class="hp2-range-tag">Tiềm năng</span><strong id="hp2-mid">171,5</strong><span>cm</span></div>
          <div class="hp2-range-card hp2-range-max"><span class="hp2-range-tag">Cao nhất</span><strong id="hp2-max">180,0</strong><span>cm</span></div>
        </div>
        <p class="hp2-sub" id="hp2-margin-note">Khoảng hiển thị: ±8,5 cm quanh kết quả chính.</p>
        <p class="hp2-sub" id="hp2-compare" hidden></p>
        <p class="hp2-sub" id="hp2-remain" hidden></p>
        <p class="hp2-warn" id="hp2-warn" hidden></p>
        <div class="hp2-actions">
          <button type="button" class="hp2-btn hp2-btn-primary" id="hp2-copy">Sao chép kết quả</button>
          <button type="button" class="hp2-btn" id="hp2-reset">Làm mới</button>
        </div>
        <div class="hp2-toast" id="hp2-toast" aria-live="polite"></div>
      </div>
      <div id="hp2-result-empty" hidden>
        <p class="hp2-empty">Nhập đủ số liệu hợp lệ để xem kết quả dự đoán.</p>
      </div>
    </div>
  </div>
  <details class="hp2-card hp2-details">
    <summary>Chi tiết công thức và lưu ý</summary>
    <div class="hp2-details-body">
      <p><strong>Cơ bản:</strong> bé trai (bố + mẹ + 13) / 2; bé gái (bố + mẹ − 13) / 2. Khoảng hiển thị ±8,5 cm.</p>
      <p><strong>Chi tiết:</strong> hằng số + hệ số chiều cao × chiều cao hiện tại + hệ số cân nặng × cân nặng hiện tại + hệ số bố mẹ × chiều cao mục tiêu từ bố mẹ. Bảng hệ số riêng cho bé trai/bé gái tại các tuổi 4, 6, 8, 10, 12, 14, 16; tuổi lẻ lấy trung bình cộng hai mốc kề nhau; tuổi 17 dùng lại hệ số tuổi 16. Khoảng hiển thị ±5,3 cm khi trẻ dưới 10 tuổi và ±3,8 cm khi từ 10 tuổi trở lên.</p>
      <p>Bảng hệ số chi tiết là bảng rút gọn theo năm tuổi, chưa đối chiếu tài liệu gốc của phương pháp Khamis-Roche; khoảng hiển thị không phải khoảng tin cậy 95% và không bảo đảm chiều cao thực tế. Kết quả chỉ mang tính tham khảo.</p>
    </div>
  </details>
  <p class="hp2-footnote">Lưu ý: Di truyền quyết định khoảng 70% chiều cao. 30% còn lại phụ thuộc vào <strong>Dinh dưỡng, Giấc ngủ và Vận động</strong>. Kết quả trên mang tính chất tham khảo.</p>
</div>

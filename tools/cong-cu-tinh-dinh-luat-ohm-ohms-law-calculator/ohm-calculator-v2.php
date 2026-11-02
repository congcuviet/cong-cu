<div class="oh2-wrap">
  <div class="oh2-chips" role="group" aria-label="Chế độ tính">
    <button type="button" class="oh2-chip oh2-active" id="oh2-mode-basic">Ohm cơ bản</button>
    <button type="button" class="oh2-chip" id="oh2-mode-circuit">Ohm toàn mạch</button>
  </div>

  <div id="oh2-panel-basic">
    <div class="oh2-chips" role="group" aria-label="Ví dụ mẫu">
      <button type="button" class="oh2-chip oh2-chip-soft" id="oh2-ex-lamp">Bóng đèn 220 V – 44 Ω</button>
      <button type="button" class="oh2-chip oh2-chip-soft" id="oh2-ex-led">LED 20 mA – 1 kΩ</button>
    </div>
    <p class="oh2-hint">Nhập đúng 2 ô, để trống 2 ô cần tìm. Số 0 là một dữ kiện đã biết. Kết quả cập nhật ngay khi bạn gõ; đổi đơn vị sẽ tự đổi số để giữ nguyên giá trị vật lý.</p>
    <div class="oh2-row">
      <div>
        <label class="oh2-label" for="oh2-U">Điện áp U</label>
        <div class="oh2-inunit">
          <input type="text" id="oh2-U" class="oh2-input" value="12" inputmode="decimal" autocomplete="off">
          <select id="oh2-Uu" class="oh2-select" aria-label="Đơn vị điện áp">
            <option value="1" selected>V</option>
            <option value="0.001">mV</option>
            <option value="1000">kV</option>
          </select>
        </div>
      </div>
      <div>
        <label class="oh2-label" for="oh2-I">Dòng điện I</label>
        <div class="oh2-inunit">
          <input type="text" id="oh2-I" class="oh2-input" inputmode="decimal" autocomplete="off" placeholder="Để trống để tìm">
          <select id="oh2-Iu" class="oh2-select" aria-label="Đơn vị dòng điện">
            <option value="1" selected>A</option>
            <option value="0.001">mA</option>
          </select>
        </div>
      </div>
      <div>
        <label class="oh2-label" for="oh2-R">Điện trở R</label>
        <div class="oh2-inunit">
          <input type="text" id="oh2-R" class="oh2-input" value="6" inputmode="decimal" autocomplete="off">
          <select id="oh2-Ru" class="oh2-select" aria-label="Đơn vị điện trở">
            <option value="1" selected>Ω</option>
            <option value="1000">kΩ</option>
            <option value="1000000">MΩ</option>
          </select>
        </div>
      </div>
      <div>
        <label class="oh2-label" for="oh2-P">Công suất P</label>
        <div class="oh2-inunit">
          <input type="text" id="oh2-P" class="oh2-input" inputmode="decimal" autocomplete="off" placeholder="Để trống để tìm">
          <select id="oh2-Pu" class="oh2-select" aria-label="Đơn vị công suất">
            <option value="1" selected>W</option>
            <option value="0.001">mW</option>
            <option value="1000">kW</option>
            <option value="1000000">MW</option>
          </select>
        </div>
      </div>
    </div>
    <p class="oh2-count" id="oh2-count"></p>
    <div class="oh2-error" id="oh2-error-basic" hidden></div>
    <div id="oh2-results-basic"></div>
    <div class="oh2-actions">
      <button type="button" class="oh2-btn" id="oh2-copy-basic">Copy kết quả</button>
      <button type="button" class="oh2-btn" id="oh2-clear-basic">Xóa</button>
    </div>
    <details class="oh2-adv">
      <summary>Công thức đã dùng và lưu ý</summary>
      <p class="oh2-hint" id="oh2-detail-basic"></p>
    </details>
  </div>

  <div id="oh2-panel-circuit" hidden>
    <p class="oh2-hint">Nhập đủ E, r và R (đơn vị V và Ω). Kết quả cập nhật ngay khi bạn gõ.</p>
    <div class="oh2-row">
      <div>
        <label class="oh2-label" for="oh2-E">Suất điện động E (V)</label>
        <input type="text" id="oh2-E" class="oh2-input" value="12" inputmode="decimal" autocomplete="off">
      </div>
      <div>
        <label class="oh2-label" for="oh2-r">Điện trở trong r (Ω)</label>
        <input type="text" id="oh2-r" class="oh2-input" value="1" inputmode="decimal" autocomplete="off">
      </div>
      <div>
        <label class="oh2-label" for="oh2-Rout">Điện trở mạch ngoài R (Ω)</label>
        <input type="text" id="oh2-Rout" class="oh2-input" value="5" inputmode="decimal" autocomplete="off">
      </div>
    </div>
    <div class="oh2-error" id="oh2-error-circuit" hidden></div>
    <div id="oh2-results-circuit"></div>
    <div class="oh2-actions">
      <button type="button" class="oh2-btn" id="oh2-copy-circuit">Copy kết quả</button>
      <button type="button" class="oh2-btn" id="oh2-clear-circuit">Xóa</button>
    </div>
    <details class="oh2-adv">
      <summary>Công suất cực đại và lưu ý</summary>
      <p class="oh2-hint" id="oh2-detail-circuit"></p>
    </details>
  </div>
  <div class="oh2-toast" id="oh2-toast" hidden></div>
</div>
<div class="jf2-soft-wrapper">
  <div class="jf2-toolbar">
    <div class="jf2-btn-group" role="group" aria-label="Chế độ xử lý">
      <button id="jf2-btn-prettify" class="jf2-btn active" type="button">Làm đẹp</button>
      <button id="jf2-btn-minify" class="jf2-btn" type="button">Nén</button>
    </div>
    <div class="jf2-indent" id="jf2-indent-wrap">
      <label class="jf2-label" for="jf2-indent">Thụt lề</label>
      <select id="jf2-indent" class="jf2-select">
        <option value="2">2 dấu cách</option>
        <option value="4" selected>4 dấu cách</option>
        <option value="tab">Tab</option>
      </select>
    </div>
    <button id="jf2-btn-clear" class="jf2-btn-clear" type="button">Xóa trắng</button>
  </div>

  <div class="jf2-main-layout">
    <div class="jf2-col">
      <div class="jf2-card jf2-bg-yellow">
        <div class="jf2-flex-between">
          <label class="jf2-section-title" for="jf2-input">Dữ liệu đầu vào</label>
          <span class="jf2-badge" id="jf2-badge">Chờ nhập liệu</span>
        </div>
        <textarea id="jf2-input" class="jf2-textarea" placeholder="Dán chuỗi JSON vào đây..." spellcheck="false"></textarea>
        <div class="jf2-stats" id="jf2-stats-in">0 ký tự · 0 byte</div>
        <div class="jf2-chip-row">
          <button id="jf2-chip-obj" class="jf2-chip" type="button">Ví dụ object</button>
          <button id="jf2-chip-api" class="jf2-chip" type="button">Ví dụ API</button>
          <button id="jf2-btn-upload" class="jf2-chip" type="button">Tải tệp .json</button>
          <input id="jf2-file" class="jf2-file" type="file" accept=".json,.txt,application/json,text/plain" aria-label="Chọn tệp JSON để tải lên">
        </div>
      </div>
    </div>

    <div class="jf2-col">
      <div class="jf2-card jf2-bg-white">
        <div class="jf2-flex-between jf2-result-head">
          <label class="jf2-section-title" for="jf2-output">Kết quả</label>
          <div class="jf2-actions">
            <button class="jf2-btn-copy" id="jf2-btn-copy" type="button" disabled>Sao chép kết quả</button>
            <button class="jf2-btn-download" id="jf2-btn-download" type="button" disabled>Tải .json</button>
          </div>
        </div>
        <div class="jf2-error-box" id="jf2-error-box" hidden>
          <strong>Lỗi cú pháp JSON</strong>
          <div id="jf2-error-msg"></div>
          <pre id="jf2-error-snippet"></pre>
        </div>
        <div class="jf2-warn-box" id="jf2-warn-box" hidden>
          <strong>Cảnh báo dữ liệu</strong>
          <ul id="jf2-warn-list"></ul>
        </div>
        <textarea id="jf2-output" class="jf2-textarea jf2-textarea-output" readonly placeholder="Kết quả định dạng sẽ hiển thị ở đây..." spellcheck="false"></textarea>
        <div class="jf2-stats" id="jf2-stats-out"></div>
      </div>
    </div>
  </div>

  <details class="jf2-details">
    <summary>Tùy chọn nâng cao</summary>
    <label class="jf2-check">
      <input type="checkbox" id="jf2-sort"> Sắp xếp khóa A→Z (áp dụng cho mọi cấp, chữ hoa trước chữ thường)
    </label>
    <p class="jf2-note">Sắp xếp khóa giúp hai bản JSON chỉ khác thứ tự khóa trở nên giống nhau khi đối chiếu văn bản.</p>
  </details>

  <div class="jf2-info-box">
    <h4>Xử lý ngay trên trình duyệt</h4>
    <p>Toàn bộ quá trình phân tích và định dạng diễn ra trên máy của bạn — dữ liệu không được gửi lên máy chủ. Giới hạn đầu vào 2.000.000 ký tự.</p>
  </div>

  <div class="jf2-toast" id="jf2-toast" role="status" hidden></div>
</div>

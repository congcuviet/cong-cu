<div class="ue3-soft-wrapper">
  <div class="ue3-seg" role="group" aria-label="Chế độ chuyển đổi">
    <button type="button" class="ue3-seg-btn is-active" data-ue3-mode="encode" aria-pressed="true">🔒 MÃ HÓA</button>
    <button type="button" class="ue3-seg-btn" data-ue3-mode="decode" aria-pressed="false">🔓 GIẢI MÃ</button>
  </div>

  <div class="ue3-card ue3-card-input">
    <div class="ue3-flex-between">
      <label class="ue3-label" for="ue3-input">📥 Đầu vào</label>
      <button type="button" id="ue3-btn-clear" class="ue3-btn-small">🧹 Xóa</button>
    </div>
    <textarea id="ue3-input" class="ue3-textarea" rows="4" placeholder="Nhập chuỗi văn bản hoặc URL nguyên bản vào đây…"></textarea>
    <div class="ue3-chips" aria-label="Ví dụ mẫu">
      <button type="button" class="ue3-chip" data-ue3-sample="xin chào">xin chào</button>
      <button type="button" class="ue3-chip" data-ue3-sample="a&amp;b=c/d?e">a&amp;b=c/d?e</button>
      <button type="button" class="ue3-chip" data-ue3-sample="https://example.com/tim?q=a b&amp;lang=vi">Link đầy đủ</button>
      <button type="button" class="ue3-chip" data-ue3-sample="a%2520b">a%2520b (2 lớp)</button>
      <button type="button" class="ue3-chip" data-ue3-sample="C++">C++</button>
    </div>
    <span class="ue3-label ue3-label-scope">Phạm vi xử lý:</span>
    <div class="ue3-seg ue3-seg-scope" role="group" aria-label="Phạm vi xử lý">
      <button type="button" class="ue3-seg-btn is-active" data-ue3-scope="component" aria-pressed="true">Tham số</button>
      <button type="button" class="ue3-seg-btn" data-ue3-scope="full" aria-pressed="false">Nguyên link</button>
      <button type="button" class="ue3-seg-btn" data-ue3-scope="form" aria-pressed="false">Form (dấu +)</button>
      <button type="button" class="ue3-seg-btn" data-ue3-scope="strict" aria-pressed="false">Nghiêm ngặt</button>
    </div>
    <p class="ue3-hint" id="ue3-scope-hint">Tham số: mã hóa cả dấu cấu trúc, dùng cho một giá trị riêng trước khi ghép vào URL.</p>
  </div>

  <div class="ue3-swap-zone">
    <button type="button" id="ue3-btn-swap" class="ue3-btn-swap" title="Đổi chiều mã hóa/giải mã, lấy kết quả làm đầu vào mới" aria-label="Đổi chiều">⇌</button>
  </div>

  <div class="ue3-card ue3-card-output">
    <div class="ue3-flex-between">
      <span class="ue3-label">🚀 Kết quả</span>
      <span class="ue3-badge" id="ue3-badge">Chờ nhập liệu…</span>
    </div>
    <textarea id="ue3-output" class="ue3-textarea ue3-textarea-output" rows="4" readonly placeholder="Kết quả sẽ tự động hiển thị ở đây…" aria-live="polite"></textarea>
    <p class="ue3-stats" id="ue3-stats">Nhập chuỗi ở trên để xem kết quả.</p>
    <p class="ue3-error" id="ue3-error" hidden></p>
    <p class="ue3-warn" id="ue3-warn" hidden></p>
    <div class="ue3-actions">
      <button type="button" class="ue3-btn-main" id="ue3-btn-copy" disabled>📋 Sao chép kết quả</button>
      <button type="button" class="ue3-btn-ghost" id="ue3-btn-download" disabled>Tải txt</button>
      <button type="button" class="ue3-btn-ghost" id="ue3-btn-more" hidden>Mã hóa thêm 1 lớp</button>
    </div>
    <p class="ue3-toast" id="ue3-toast" hidden></p>
  </div>

  <details class="ue3-details">
    <summary>Phạm vi giữ nguyên theo từng lựa chọn</summary>
    <table class="ue3-table">
      <thead><tr><th>Ký tự</th><th>Tham số</th><th>Nguyên link</th><th>Form (dấu +)</th><th>Nghiêm ngặt</th></tr></thead>
      <tbody>
        <tr><td><code>:</code></td><td>%3A</td><td>giữ nguyên</td><td>%3A</td><td>%3A</td></tr>
        <tr><td><code>/</code></td><td>%2F</td><td>giữ nguyên</td><td>%2F</td><td>%2F</td></tr>
        <tr><td><code>?</code> <code>&amp;</code> <code>=</code></td><td>mã hóa</td><td>giữ nguyên</td><td>mã hóa</td><td>mã hóa</td></tr>
        <tr><td><code>#</code></td><td>%23</td><td>giữ nguyên</td><td>%23</td><td>%23</td></tr>
        <tr><td>khoảng trắng</td><td>%20</td><td>%20</td><td><code>+</code></td><td>%20</td></tr>
        <tr><td><code>+</code></td><td>%2B</td><td>giữ nguyên</td><td>%2B</td><td>%2B</td></tr>
        <tr><td><code>! ' ( ) *</code></td><td>giữ nguyên</td><td>giữ nguyên</td><td>mã hóa, trừ <code>*</code></td><td>mã hóa</td></tr>
      </tbody>
    </table>
    <p class="ue3-hint">Chiều giải mã dùng cùng phạm vi: “Nguyên link” giữ nguyên %2F, “Form” đổi dấu + thành khoảng trắng trước khi giải mã.</p>
  </details>

  <div class="ue3-note">
    <h4>💡 IT Note:</h4>
    <p>Khoảng trắng thường thành <code>%20</code> (ở Form thành <code>+</code>). Chữ tiếng Việt thành nhiều nhóm <code>%HH</code> vì mỗi byte UTF-8 một nhóm — “mã hóa” ở đây chỉ đổi cách biểu diễn, không phải mã hóa bảo mật.</p>
  </div>
</div>

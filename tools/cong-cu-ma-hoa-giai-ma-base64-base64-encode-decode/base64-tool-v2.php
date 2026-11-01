<div class="b62-soft-wrapper">
  <div class="b62-mode-row" role="group" aria-label="Chế độ chuyển đổi">
    <button type="button" class="b62-mode-btn b62-mode-active" id="b62-mode-encode">Mã hóa</button>
    <button type="button" class="b62-mode-btn" id="b62-mode-decode">Giải mã</button>
  </div>
  <div class="b62-chip-row">
    <button type="button" class="b62-chip" data-b62-chip="Xin chào">Xin chào</button>
    <button type="button" class="b62-chip" data-b62-chip="Tiếng Việt">Tiếng Việt</button>
    <button type="button" class="b62-chip" data-b62-chip=">>>">&gt;&gt;&gt;</button>
  </div>
  <div class="b62-card">
    <div class="b62-box-header">
      <label class="b62-label" for="b62-input">Văn bản đầu vào</label>
      <button type="button" class="b62-mini-btn" id="b62-clear">Xóa nội dung</button>
    </div>
    <textarea id="b62-input" rows="6" placeholder="Nhập văn bản hoặc mã Base64 vào đây..."></textarea>
    <p class="b62-hint" id="b62-input-hint">Gõ là chuyển đổi ngay, không cần bấm nút.</p>
  </div>
  <div class="b62-card b62-result-card">
    <div class="b62-box-header">
      <label class="b62-label" for="b62-output">Kết quả</label>
      <div class="b62-btn-row">
        <button type="button" class="b62-mini-btn" id="b62-swap">Đổi chiều</button>
        <button type="button" class="b62-mini-btn b62-mini-primary" id="b62-copy">Sao chép</button>
      </div>
    </div>
    <textarea id="b62-output" rows="6" readonly placeholder="Kết quả sẽ hiển thị ở đây..."></textarea>
    <p class="b62-stat" id="b62-stat"></p>
    <p class="b62-message" id="b62-message"></p>
  </div>
  <details class="b62-details">
    <summary>Tùy chọn Base64</summary>
    <div class="b62-opt-row" role="group" aria-label="Dạng Base64 khi mã hóa">
      <button type="button" class="b62-opt-btn b62-opt-active" id="b62-opt-std">Chuẩn (+ /)</button>
      <button type="button" class="b62-opt-btn" id="b62-opt-url">URL-safe (- _)</button>
    </div>
    <label class="b62-check"><input type="checkbox" id="b62-opt-nopad"> Không thêm dấu = ở cuối (kiểu JWT)</label>
    <p class="b62-hint">Giải mã luôn chấp nhận cả hai dạng, có hoặc không có dấu =. Khoảng trắng khi giải mã được bỏ qua.</p>
  </details>
</div>
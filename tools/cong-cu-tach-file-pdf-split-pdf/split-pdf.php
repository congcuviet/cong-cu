<div class="spd-soft-wrapper">
  <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
  <div class="spd-lib-error" id="spd-lib-error" style="display:none">⚠️ Không tải được thư viện xử lý PDF. Hãy kiểm tra kết nối mạng rồi tải lại trang. File của bạn không bị gửi đi đâu cả.</div>
  <div class="spd-card">
    <h3 class="spd-card-title">✂️ Chọn file PDF cần tách</h3>
    <label class="spd-drop" id="spd-drop" for="spd-file">
      <span class="spd-drop-icon">📄</span>
      <span class="spd-drop-text">Bấm để chọn 1 file PDF, hoặc kéo & thả file vào đây</span>
      <span class="spd-drop-sub">File xử lý 100% ngay trong trình duyệt, không tải lên máy chủ</span>
    </label>
    <input type="file" id="spd-file" class="spd-file-hidden" accept="application/pdf,.pdf">
    <p class="spd-fileinfo" id="spd-fileinfo">Chưa chọn file nào.</p>
    <div id="spd-options" style="display:none">
      <label class="spd-label">Cách tách</label>
      <div class="spd-radio-row">
        <label class="spd-radio"><input type="radio" name="spd-mode" id="spd-mode-ranges" value="ranges" checked> Theo khoảng trang</label>
        <label class="spd-radio"><input type="radio" name="spd-mode" id="spd-mode-each" value="each"> Mỗi trang thành 1 file</label>
      </div>
      <div id="spd-ranges-wrap">
        <label class="spd-label" for="spd-inp-ranges">Các khoảng trang (cách nhau bằng dấu phẩy)</label>
        <input type="text" id="spd-inp-ranges" class="spd-inp" autocomplete="off" value="1-3">
        <p class="spd-hint">Ví dụ: <strong>1-3, 5, 7-9</strong> sẽ tạo 3 file: trang 1–3, trang 5, trang 7–9. Đánh số trang bắt đầu từ 1.</p>
      </div>
      <p class="spd-error" id="spd-error"></p>
      <button type="button" class="spd-btn spd-btn-main" id="spd-btn-split">✂️ TÁCH FILE PDF</button>
      <p class="spd-status" id="spd-status"></p>
    </div>
  </div>
  <div class="spd-card" id="spd-result" style="display:none">
    <p class="spd-verdict" id="spd-verdict"></p>
    <ul class="spd-outlist" id="spd-outlist"></ul>
    <p class="spd-note">Mỗi file tách ra có nút tải riêng. Cần gộp lại hoặc gộp với file khác? Dùng <a href="/cong-cu/cong-cu-gop-file-pdf-merge-pdf/">Công cụ gộp file PDF</a>.</p>
  </div>
  <div class="spd-card">
    <details class="spd-acc">
      <summary>📌 Lưu ý khi tách PDF</summary>
      <p class="spd-note">File có mật khẩu mở (user password) sẽ không đọc được — hãy gỡ mật khẩu trước. Các trường form, chữ ký số và bookmark có thể không được giữ nguyên trong file tách ra. Mọi thao tác diễn ra trên máy của bạn: file không rời khỏi trình duyệt.</p>
    </details>
  </div>
</div>

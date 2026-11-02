<div class="upd-soft-wrapper">
  <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js"></script>
  <div class="upd-lib-error" id="upd-lib-error" style="display:none">⚠️ Không tải được thư viện xử lý PDF. Hãy kiểm tra kết nối mạng rồi tải lại trang. File của bạn không bị gửi đi đâu cả.</div>
  <div class="upd-card">
    <h3 class="upd-card-title">🔓 Chọn file PDF cần gỡ mật khẩu</h3>
    <label class="upd-drop" id="upd-drop" for="upd-file">
      <span class="upd-drop-icon">📄</span>
      <span class="upd-drop-text">Bấm để chọn 1 file PDF, hoặc kéo & thả file vào đây</span>
      <span class="upd-drop-sub">Cần biết đúng mật khẩu hiện tại của file — xử lý 100% trong trình duyệt</span>
    </label>
    <input type="file" id="upd-file" class="upd-file-hidden" accept="application/pdf,.pdf">
    <p class="upd-fileinfo" id="upd-fileinfo">Chưa chọn file nào.</p>
    <div id="upd-options" style="display:none">
      <label class="upd-label" for="upd-pass">Mật khẩu hiện tại của file</label>
      <input type="password" id="upd-pass" class="upd-inp" autocomplete="off" placeholder="Nhập mật khẩu đang dùng để mở file">
      <label class="upd-checkline"><input type="checkbox" id="upd-show"> Hiện mật khẩu</label>
      <p class="upd-error" id="upd-error"></p>
      <button type="button" class="upd-btn upd-btn-main" id="upd-btn-unlock">🔓 GỠ MẬT KHẨU & TẠO FILE MỚI</button>
      <p class="upd-status" id="upd-status"></p>
      <p class="upd-note">Công cụ này chỉ gỡ mật khẩu cho file của chính bạn khi bạn BIẾT mật khẩu hiện tại — nó không bẻ khóa/dò mật khẩu. File không đặt mật khẩu mở nhưng bị khóa quyền in/sửa (mật khẩu chủ sở hữu) cũng gỡ được tại đây: cứ để trống ô mật khẩu và bấm gỡ. Lần bấm đầu cần tải bộ xử lý (~2 MB).</p>
    </div>
  </div>
  <div class="upd-card" id="upd-result" style="display:none">
    <p class="upd-verdict" id="upd-verdict"></p>
    <a class="upd-btn upd-btn-main" id="upd-download" href="#" download="pdf-da-go-mat-khau-congcu-viet.pdf">⬇️ TẢI FILE PDF ĐÃ GỠ MẬT KHẨU</a>
    <p class="upd-note">File mới mở không cần mật khẩu và không còn giới hạn quyền. Hãy thử mở ngay để kiểm tra, và cân nhắc đặt lại mật khẩu nếu tài liệu vẫn nhạy cảm khi lưu trữ lâu dài.</p>
  </div>
</div>

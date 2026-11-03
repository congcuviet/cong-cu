<div class="dpd-soft-wrapper">
  <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
  <div class="dpd-lib-error" id="dpd-lib-error" style="display:none">⚠️ Không tải được thư viện xử lý PDF. Hãy kiểm tra kết nối mạng rồi tải lại trang. File của bạn không bị gửi đi đâu cả.</div>
  <div class="dpd-card">
    <h3 class="dpd-card-title">🗑️ Chọn file PDF cần xóa trang</h3>
    <label class="dpd-drop" id="dpd-drop" for="dpd-file">
      <span class="dpd-drop-icon">📄</span>
      <span class="dpd-drop-text">Bấm để chọn 1 file PDF, hoặc kéo & thả file vào đây</span>
      <span class="dpd-drop-sub">File xử lý 100% ngay trong trình duyệt, không tải lên máy chủ</span>
    </label>
    <input type="file" id="dpd-file" class="dpd-file-hidden" accept="application/pdf,.pdf">
    <p class="dpd-fileinfo" id="dpd-fileinfo">Chưa chọn file nào.</p>
    <div id="dpd-options" style="display:none">
      <label class="dpd-label" for="dpd-inp-pages">Các trang cần XÓA (cách nhau bằng dấu phẩy)</label>
      <input type="text" id="dpd-inp-pages" class="dpd-inp" autocomplete="off" placeholder="Ví dụ: 2, 4-5, 9">
      <p class="dpd-hint">Nhập số trang hoặc khoảng trang muốn loại bỏ. File kết quả giữ lại mọi trang còn lại theo đúng thứ tự. Không thể xóa hết 100% số trang.</p>
      <p class="dpd-error" id="dpd-error"></p>
      <button type="button" class="dpd-btn dpd-btn-main" id="dpd-btn-delete">🗑️ XÓA TRANG & TẠO FILE MỚI</button>
      <p class="dpd-status" id="dpd-status"></p>
    </div>
  </div>
  <div class="dpd-card" id="dpd-result" style="display:none">
    <p class="dpd-verdict" id="dpd-verdict"></p>
    <div class="dpd-stats">
      <div class="dpd-stat"><span class="dpd-stat-cap">🗑️ Trang đã xóa</span><span class="dpd-stat-val" id="dpd-out-deleted">0</span></div>
      <div class="dpd-stat"><span class="dpd-stat-cap">📄 Trang còn lại</span><span class="dpd-stat-val" id="dpd-out-kept">0</span></div>
      <div class="dpd-stat"><span class="dpd-stat-cap">💾 Dung lượng file mới</span><span class="dpd-stat-val" id="dpd-out-size">0</span></div>
    </div>
    <a class="dpd-btn dpd-btn-main dpd-download" id="dpd-download" href="#" download="pdf-da-xoa-trang-congcu-viet.pdf">⬇️ TẢI FILE PDF MỚI</a>
    <p class="dpd-note">Muốn giữ lại chỉ một đoạn trang thay vì xóa? Dùng <a href="/cong-cu/cong-cu-tach-file-pdf-split-pdf/">Công cụ tách file PDF</a>. File gốc của bạn không bị thay đổi.</p>
  </div>
</div>

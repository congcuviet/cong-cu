<div class="rpd-soft-wrapper">
  <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
  <div class="rpd-lib-error" id="rpd-lib-error" style="display:none">⚠️ Không tải được thư viện xử lý PDF. Hãy kiểm tra kết nối mạng rồi tải lại trang. File của bạn không bị gửi đi đâu cả.</div>
  <div class="rpd-card">
    <h3 class="rpd-card-title">🔄 Chọn file PDF cần xoay trang</h3>
    <label class="rpd-drop" id="rpd-drop" for="rpd-file">
      <span class="rpd-drop-icon">📄</span>
      <span class="rpd-drop-text">Bấm để chọn 1 file PDF, hoặc kéo & thả file vào đây</span>
      <span class="rpd-drop-sub">File xử lý 100% ngay trong trình duyệt, không tải lên máy chủ</span>
    </label>
    <input type="file" id="rpd-file" class="rpd-file-hidden" accept="application/pdf,.pdf">
    <p class="rpd-fileinfo" id="rpd-fileinfo">Chưa chọn file nào.</p>
    <div id="rpd-options" style="display:none">
      <label class="rpd-label">Góc xoay</label>
      <div class="rpd-angle-row">
        <button type="button" class="rpd-angle" data-rpd-angle="90">↻ 90° sang phải</button>
        <button type="button" class="rpd-angle" data-rpd-angle="180">↷ 180° lật ngược</button>
        <button type="button" class="rpd-angle" data-rpd-angle="270">↺ 90° sang trái</button>
      </div>
      <label class="rpd-label" for="rpd-inp-pages">Trang áp dụng (để trống = mọi trang)</label>
      <input type="text" id="rpd-inp-pages" class="rpd-inp" autocomplete="off" placeholder="Ví dụ: 1-3, 5 — để trống là xoay tất cả">
      <p class="rpd-error" id="rpd-error"></p>
      <button type="button" class="rpd-btn rpd-btn-main" id="rpd-btn-rotate" disabled>🔄 XOAY & TẢI FILE MỚI</button>
      <p class="rpd-status" id="rpd-status"></p>
    </div>
  </div>
  <div class="rpd-card" id="rpd-result" style="display:none">
    <p class="rpd-verdict" id="rpd-verdict"></p>
    <a class="rpd-btn rpd-btn-main" id="rpd-download" href="#" download="pdf-da-xoay-congcu-viet.pdf">⬇️ TẢI FILE PDF ĐÃ XOAY</a>
    <p class="rpd-note">Cần gộp hoặc tách file? Xem thêm <a href="/cong-cu/cong-cu-gop-file-pdf-merge-pdf/">Gộp file PDF</a> và <a href="/cong-cu/cong-cu-tach-file-pdf-split-pdf/">Tách file PDF</a>.</p>
  </div>
  <div class="rpd-card">
    <details class="rpd-acc">
      <summary>📌 Lưu ý khi xoay PDF</summary>
      <p class="rpd-note">Xoay ở đây là xoay cố định (ghi góc xoay vào file) — mọi trình đọc PDF đều hiển thị đúng chiều mới, khác với nút xoay tạm trong lúc xem. File có mật khẩu mở sẽ không đọc được. Mọi thao tác diễn ra trên máy của bạn.</p>
    </details>
  </div>
</div>

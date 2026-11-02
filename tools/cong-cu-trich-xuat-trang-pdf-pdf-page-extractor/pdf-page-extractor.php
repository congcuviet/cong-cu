<div class="epd-soft-wrapper">
  <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
  <div class="epd-lib-error" id="epd-lib-error" style="display:none">⚠️ Không tải được thư viện xử lý PDF. Hãy kiểm tra kết nối mạng rồi tải lại trang. File của bạn không bị gửi đi đâu cả.</div>
  <div class="epd-card">
    <h3 class="epd-card-title">📑 Chọn file PDF cần trích xuất trang</h3>
    <label class="epd-drop" id="epd-drop" for="epd-file">
      <span class="epd-drop-icon">📄</span>
      <span class="epd-drop-text">Bấm để chọn 1 file PDF, hoặc kéo & thả file vào đây</span>
      <span class="epd-drop-sub">File xử lý 100% ngay trong trình duyệt, không tải lên máy chủ</span>
    </label>
    <input type="file" id="epd-file" class="epd-file-hidden" accept="application/pdf,.pdf">
    <p class="epd-fileinfo" id="epd-fileinfo">Chưa chọn file nào.</p>
    <div id="epd-options" style="display:none">
      <div class="epd-row2">
        <div>
          <label class="epd-label" for="epd-inp-from">Từ trang</label>
          <input type="number" id="epd-inp-from" class="epd-inp" min="1" step="1" value="1">
        </div>
        <div>
          <label class="epd-label" for="epd-inp-to">Đến trang</label>
          <input type="number" id="epd-inp-to" class="epd-inp" min="1" step="1" value="1">
        </div>
      </div>
      <div class="epd-chips">
        <button type="button" class="epd-chip" data-epd-preset="first">Trang đầu</button>
        <button type="button" class="epd-chip" data-epd-preset="last">Trang cuối</button>
        <button type="button" class="epd-chip" data-epd-preset="firsthalf">Nửa đầu</button>
        <button type="button" class="epd-chip" data-epd-preset="secondhalf">Nửa sau</button>
        <button type="button" class="epd-chip" data-epd-preset="all">Toàn bộ</button>
      </div>
      <p class="epd-hint" id="epd-preview"></p>
      <p class="epd-error" id="epd-error"></p>
      <button type="button" class="epd-btn epd-btn-main" id="epd-btn-extract">📑 TRÍCH XUẤT TRANG</button>
      <p class="epd-status" id="epd-status"></p>
    </div>
  </div>
  <div class="epd-card" id="epd-result" style="display:none">
    <p class="epd-verdict" id="epd-verdict"></p>
    <a class="epd-btn epd-btn-main" id="epd-download" href="#" download="trang-trich-xuat-congcu-viet.pdf">⬇️ TẢI FILE ĐÃ TRÍCH XUẤT</a>
    <p class="epd-note">Cần trích nhiều đoạn rời nhau (ví dụ trang 2, 5 và 9–12)? Dùng <a href="/cong-cu/cong-cu-tach-file-pdf-split-pdf/">Công cụ tách file PDF</a> với cú pháp khoảng trang. File gốc của bạn không bị thay đổi.</p>
  </div>
</div>

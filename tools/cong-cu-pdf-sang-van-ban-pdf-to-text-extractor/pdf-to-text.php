<div class="p2t-soft-wrapper">
  <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js"></script>
  <div class="p2t-lib-error" id="p2t-lib-error" style="display:none">⚠️ Không tải được thư viện đọc PDF. Hãy kiểm tra kết nối mạng rồi tải lại trang. File của bạn không bị gửi đi đâu cả.</div>
  <div class="p2t-card">
    <h3 class="p2t-card-title">📝 Chọn file PDF cần lấy văn bản</h3>
    <label class="p2t-drop" id="p2t-drop" for="p2t-file">
      <span class="p2t-drop-icon">📄</span>
      <span class="p2t-drop-text">Bấm để chọn 1 file PDF, hoặc kéo & thả file vào đây</span>
      <span class="p2t-drop-sub">Trích xuất lớp chữ có sẵn trong PDF — xử lý 100% trong trình duyệt, không tải lên máy chủ</span>
    </label>
    <input type="file" id="p2t-file" class="p2t-file-hidden" accept="application/pdf,.pdf">
    <p class="p2t-fileinfo" id="p2t-fileinfo">Chưa chọn file nào.</p>
    <label class="p2t-check"><input type="checkbox" id="p2t-chk-sep" checked> Chèn dòng phân cách “— Trang N —” giữa các trang</label>
    <p class="p2t-error" id="p2t-error"></p>
    <button type="button" class="p2t-btn p2t-btn-main" id="p2t-btn-extract" disabled>📝 TRÍCH XUẤT VĂN BẢN</button>
    <p class="p2t-status" id="p2t-status"></p>
  </div>
  <div class="p2t-card" id="p2t-result" style="display:none">
    <p class="p2t-verdict" id="p2t-verdict"></p>
    <div class="p2t-stats">
      <div class="p2t-stat"><span class="p2t-stat-cap">📄 Trang có chữ</span><span class="p2t-stat-val" id="p2t-out-pages">0</span></div>
      <div class="p2t-stat"><span class="p2t-stat-cap">🔤 Số từ</span><span class="p2t-stat-val" id="p2t-out-words">0</span></div>
      <div class="p2t-stat"><span class="p2t-stat-cap">🔡 Số ký tự</span><span class="p2t-stat-val" id="p2t-out-chars">0</span></div>
    </div>
    <textarea id="p2t-text" class="p2t-text" rows="14" spellcheck="false"></textarea>
    <div class="p2t-actions">
      <button type="button" class="p2t-btn p2t-btn-soft" id="p2t-btn-copy">📋 SAO CHÉP</button>
      <button type="button" class="p2t-btn p2t-btn-main" id="p2t-btn-download">⬇️ TẢI FILE .TXT</button>
    </div>
    <p class="p2t-note" id="p2t-scanned-note" style="display:none">ℹ️ File này gần như không có lớp chữ — nhiều khả năng là PDF scan dạng ảnh. Muốn lấy chữ từ ảnh scan cần công cụ OCR (nhận dạng chữ), công cụ này chỉ đọc lớp chữ có sẵn.</p>
  </div>
</div>

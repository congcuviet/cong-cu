<div class="pfl-soft-wrapper">
  <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
  <div class="pfl-lib-error" id="pfl-lib-error" style="display:none">⚠️ Không tải được thư viện xử lý PDF. Hãy kiểm tra kết nối mạng rồi tải lại trang. File của bạn không bị gửi đi đâu cả.</div>
  <div class="pfl-card">
    <h3 class="pfl-card-title">🧱 Chọn file PDF cần làm phẳng (flatten)</h3>
    <label class="pfl-drop" id="pfl-drop" for="pfl-file">
      <span class="pfl-drop-icon">📄</span>
      <span class="pfl-drop-text">Bấm để chọn 1 file PDF, hoặc kéo & thả file vào đây</span>
      <span class="pfl-drop-sub">Gộp các ô biểu mẫu (form) thành nội dung tĩnh — xử lý 100% trong trình duyệt</span>
    </label>
    <input type="file" id="pfl-file" class="pfl-file-hidden" accept="application/pdf,.pdf">
    <p class="pfl-fileinfo" id="pfl-fileinfo">Chưa chọn file nào.</p>
    <p class="pfl-status" id="pfl-status"></p>
  </div>
  <div class="pfl-card" id="pfl-result" style="display:none">
    <p class="pfl-verdict" id="pfl-verdict"></p>
    <div class="pfl-stats" id="pfl-stats">
      <div class="pfl-stat"><span class="pfl-stat-cap">🧩 Trường biểu mẫu đã làm phẳng</span><span class="pfl-stat-val" id="pfl-out-fields">0</span></div>
      <div class="pfl-stat"><span class="pfl-stat-cap">💾 Dung lượng file mới</span><span class="pfl-stat-val" id="pfl-out-size">0</span></div>
    </div>
    <a class="pfl-btn pfl-btn-main" id="pfl-download" href="#" download="pdf-da-lam-phang-congcu-viet.pdf">⬇️ TẢI FILE PDF ĐÃ LÀM PHẲNG</a>
    <p class="pfl-note">Sau khi làm phẳng, nội dung đã điền hiển thị và in ấn giống hệt nhưng không sửa được nữa — hãy giữ lại file gốc nếu còn cần chỉnh sửa biểu mẫu.</p>
  </div>
  <div class="pfl-card">
    <details class="pfl-acc">
      <summary>📌 Làm phẳng PDF là gì? Khi nào cần?</summary>
      <p class="pfl-note">PDF biểu mẫu (hồ sơ, tờ khai) chứa các ô nhập liệu riêng biệt với nội dung trang. “Làm phẳng” (flatten) là gộp hẳn các ô đó vào nội dung trang: chữ đã điền trở thành một phần cố định của trang. Nên làm phẳng TRƯỚC KHI nộp/gửi hồ sơ để nơi nhận mở bằng phần mềm nào cũng thấy đúng nội dung, tránh trường hợp ô biểu mẫu hiển thị trống hoặc bị sửa ngoài ý muốn. Công cụ này xử lý các trường biểu mẫu (AcroForm) — chữ ký số và chú thích (comment/highlight) không thuộc phạm vi làm phẳng tại đây.</p>
    </details>
  </div>
</div>

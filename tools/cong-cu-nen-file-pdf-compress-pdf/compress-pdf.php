<div class="cpd-soft-wrapper">
  <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js"></script>
  <div class="cpd-lib-error" id="cpd-lib-error" style="display:none">⚠️ Không tải được thư viện xử lý PDF. Hãy kiểm tra kết nối mạng rồi tải lại trang. File của bạn không bị gửi đi đâu cả.</div>
  <div class="cpd-card">
    <h3 class="cpd-card-title">🗜️ Chọn file PDF cần nén</h3>
    <label class="cpd-drop" id="cpd-drop" for="cpd-file">
      <span class="cpd-drop-icon">📄</span>
      <span class="cpd-drop-text">Bấm để chọn 1 file PDF, hoặc kéo & thả file vào đây</span>
      <span class="cpd-drop-sub">File xử lý 100% ngay trong trình duyệt, không tải lên máy chủ</span>
    </label>
    <input type="file" id="cpd-file" class="cpd-file-hidden" accept="application/pdf,.pdf">
    <p class="cpd-fileinfo" id="cpd-fileinfo">Chưa chọn file nào.</p>
    <div id="cpd-options" style="display:none">
      <label class="cpd-label">Chế độ nén</label>
      <div class="cpd-mode-row">
        <button type="button" class="cpd-mode cpd-picked" data-cpd-mode="image">🗜️ Nén mạnh (qua ảnh)<br><span class="cpd-mode-sub">Giảm sâu cho PDF scan/nhiều ảnh — trang biến thành ảnh, chữ không chọn/copy được nữa</span></button>
        <button type="button" class="cpd-mode" data-cpd-mode="structural">🧱 Nén nhẹ (giữ nguyên chữ)<br><span class="cpd-mode-sub">Chỉ tối ưu cấu trúc file — giảm ít nhưng giữ nguyên 100% nội dung</span></button>
      </div>
      <div id="cpd-quality-row">
        <label class="cpd-label" for="cpd-sel-quality">Mức chất lượng ảnh (chế độ nén mạnh)</label>
        <select id="cpd-sel-quality" class="cpd-inp">
          <option value="72-70">Thấp — file nhẹ nhất (72 DPI)</option>
          <option value="100-80" selected>Vừa — cân bằng (100 DPI)</option>
          <option value="150-88">Cao — nét hơn (150 DPI)</option>
        </select>
      </div>
      <p class="cpd-error" id="cpd-error"></p>
      <button type="button" class="cpd-btn cpd-btn-main" id="cpd-btn-compress">🗜️ NÉN FILE PDF</button>
      <p class="cpd-status" id="cpd-status"></p>
    </div>
  </div>
  <div class="cpd-card" id="cpd-result" style="display:none">
    <p class="cpd-verdict" id="cpd-verdict"></p>
    <div class="cpd-compare">
      <div class="cpd-bar-row"><span class="cpd-bar-cap">File gốc</span><div class="cpd-bar"><div class="cpd-fill cpd-fill-old" id="cpd-bar-old"></div></div><span class="cpd-bar-val" id="cpd-out-old">0</span></div>
      <div class="cpd-bar-row"><span class="cpd-bar-cap">Sau nén</span><div class="cpd-bar"><div class="cpd-fill cpd-fill-new" id="cpd-bar-new"></div></div><span class="cpd-bar-val" id="cpd-out-new">0</span></div>
    </div>
    <p class="cpd-saved" id="cpd-out-saved"></p>
    <a class="cpd-btn cpd-btn-main" id="cpd-download" href="#" download="pdf-da-nen-congcu-viet.pdf">⬇️ TẢI FILE PDF ĐÃ NÉN</a>
    <p class="cpd-note">File gốc của bạn không bị thay đổi. Nếu file chủ yếu là chữ và đã được xuất từ Word/Excel, dung lượng thường đã tối ưu sẵn — nén mạnh qua ảnh có thể không giảm thêm được bao nhiêu.</p>
  </div>
</div>

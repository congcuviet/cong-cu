<div class="apn-soft-wrapper">
  <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
  <div class="apn-lib-error" id="apn-lib-error" style="display:none">⚠️ Không tải được thư viện xử lý PDF. Hãy kiểm tra kết nối mạng rồi tải lại trang. File của bạn không bị gửi đi đâu cả.</div>
  <div class="apn-card">
    <h3 class="apn-card-title">🔢 Chọn file PDF cần đánh số trang</h3>
    <label class="apn-drop" id="apn-drop" for="apn-file">
      <span class="apn-drop-icon">📄</span>
      <span class="apn-drop-text">Bấm để chọn 1 file PDF, hoặc kéo & thả file vào đây</span>
      <span class="apn-drop-sub">File xử lý 100% ngay trong trình duyệt, không tải lên máy chủ</span>
    </label>
    <input type="file" id="apn-file" class="apn-file-hidden" accept="application/pdf,.pdf">
    <p class="apn-fileinfo" id="apn-fileinfo">Chưa chọn file nào.</p>
    <div id="apn-options" style="display:none">
      <div class="apn-row2">
        <div>
          <label class="apn-label" for="apn-sel-format">Kiểu hiển thị</label>
          <select id="apn-sel-format" class="apn-inp">
            <option value="trang-xy" selected>Trang 1 / 10</option>
            <option value="so">Chỉ số: 1</option>
            <option value="trang-x">Trang 1</option>
            <option value="x-tren-y">1 / 10</option>
            <option value="x-trong-y">1 trong 10</option>
          </select>
        </div>
        <div>
          <label class="apn-label" for="apn-sel-pos">Vị trí số trang</label>
          <select id="apn-sel-pos" class="apn-inp">
            <option value="bc" selected>Dưới — giữa</option>
            <option value="bl">Dưới — trái</option>
            <option value="br">Dưới — phải</option>
            <option value="tc">Trên — giữa</option>
            <option value="tl">Trên — trái</option>
            <option value="tr">Trên — phải</option>
          </select>
        </div>
      </div>
      <div class="apn-row2">
        <div>
          <label class="apn-label" for="apn-inp-start">Số bắt đầu</label>
          <input type="number" id="apn-inp-start" class="apn-inp" min="0" step="1" value="1">
        </div>
        <div>
          <label class="apn-label" for="apn-sel-size">Cỡ chữ</label>
          <select id="apn-sel-size" class="apn-inp">
            <option value="10">Nhỏ (10)</option>
            <option value="12" selected>Vừa (12)</option>
            <option value="14">Lớn (14)</option>
          </select>
        </div>
      </div>
      <label class="apn-check"><input type="checkbox" id="apn-chk-skip"> Bỏ qua trang đầu tiên (trang bìa không đánh số)</label>
      <p class="apn-error" id="apn-error"></p>
      <button type="button" class="apn-btn apn-btn-main" id="apn-btn-stamp">🔢 ĐÁNH SỐ & TẠO FILE MỚI</button>
      <p class="apn-status" id="apn-status"></p>
    </div>
  </div>
  <div class="apn-card" id="apn-result" style="display:none">
    <p class="apn-verdict" id="apn-verdict"></p>
    <a class="apn-btn apn-btn-main" id="apn-download" href="#" download="pdf-da-danh-so-trang-congcu-viet.pdf">⬇️ TẢI FILE PDF ĐÃ ĐÁNH SỐ</a>
    <p class="apn-note">Số trang được vẽ trực tiếp vào từng trang PDF (in ra giấy vẫn có). File gốc của bạn không bị thay đổi.</p>
  </div>
</div>

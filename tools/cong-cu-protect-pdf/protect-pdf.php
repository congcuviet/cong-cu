<div class="ppd-soft-wrapper">
  <div class="ppd-lib-error" id="ppd-lib-error" style="display:none">⚠️ Không tải được bộ mã hóa PDF. Hãy kiểm tra kết nối mạng rồi thử lại. File của bạn không bị gửi đi đâu cả.</div>
  <div class="ppd-card">
    <h3 class="ppd-card-title">🔒 Chọn file PDF cần đặt mật khẩu</h3>
    <label class="ppd-drop" id="ppd-drop" for="ppd-file">
      <span class="ppd-drop-icon">📄</span>
      <span class="ppd-drop-text">Bấm để chọn 1 file PDF, hoặc kéo & thả file vào đây</span>
      <span class="ppd-drop-sub">Mã hóa AES-256 chuẩn quốc tế — xử lý 100% trong trình duyệt, không tải lên máy chủ</span>
    </label>
    <input type="file" id="ppd-file" class="ppd-file-hidden" accept="application/pdf,.pdf">
    <p class="ppd-fileinfo" id="ppd-fileinfo">Chưa chọn file nào.</p>
    <div id="ppd-options" style="display:none">
      <div class="ppd-grid2">
        <div>
          <label class="ppd-label" for="ppd-pass">Mật khẩu mở file (người xem phải nhập)</label>
          <input type="password" id="ppd-pass" class="ppd-inp" autocomplete="new-password" placeholder="Ít nhất 4 ký tự">
        </div>
        <div>
          <label class="ppd-label" for="ppd-pass2">Nhập lại mật khẩu mở file</label>
          <input type="password" id="ppd-pass2" class="ppd-inp" autocomplete="new-password" placeholder="Nhập lại cho chắc">
        </div>
      </div>
      <label class="ppd-label" for="ppd-owner">Mật khẩu chủ sở hữu (không bắt buộc — để trống = giống mật khẩu mở file)</label>
      <input type="password" id="ppd-owner" class="ppd-inp" autocomplete="new-password" placeholder="Mật khẩu để gỡ các giới hạn bên dưới">
      <label class="ppd-checkline"><input type="checkbox" id="ppd-show"> Hiện mật khẩu</label>
      <label class="ppd-label">Quyền của người xem (chỉ mật khẩu chủ sở hữu mới thay đổi được)</label>
      <div class="ppd-perms">
        <label class="ppd-checkline"><input type="checkbox" id="ppd-perm-print" checked> Cho phép in</label>
        <label class="ppd-checkline"><input type="checkbox" id="ppd-perm-copy" checked> Cho phép sao chép nội dung</label>
        <label class="ppd-checkline"><input type="checkbox" id="ppd-perm-modify"> Cho phép chỉnh sửa</label>
      </div>
      <p class="ppd-error" id="ppd-error"></p>
      <button type="button" class="ppd-btn ppd-btn-main" id="ppd-btn-protect">🔒 ĐẶT MẬT KHẨU & TẠO FILE</button>
      <p class="ppd-status" id="ppd-status"></p>
      <p class="ppd-note">Hãy ghi lại mật khẩu ngay — nếu quên, không có cách nào mở lại file đã mã hóa (kể cả công cụ này). Lần bấm đầu tiên cần tải bộ mã hóa (~2 MB), các lần sau sẽ nhanh.</p>
    </div>
  </div>
  <div class="ppd-card" id="ppd-result" style="display:none">
    <p class="ppd-verdict" id="ppd-verdict"></p>
    <a class="ppd-btn ppd-btn-main" id="ppd-download" href="#" download="pdf-da-dat-mat-khau-congcu-viet.pdf">⬇️ TẢI FILE PDF ĐÃ ĐẶT MẬT KHẨU</a>
    <p class="ppd-note">Kiểm tra ngay: mở file vừa tải bằng điện thoại hoặc trình duyệt khác và thử nhập mật khẩu. Lưu ý: giới hạn quyền (in/sao chép/sửa) được các phần mềm đọc PDF phổ biến tôn trọng, nhưng không phải là rào chắn tuyệt đối với mọi phần mềm.</p>
  </div>
</div>

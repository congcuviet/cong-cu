<div class="ue2-soft-wrapper">
  <div class="ue2-card ue2-form-card">
    <div class="ue2-seg" role="group" aria-label="Chế độ">
      <button type="button" class="ue2-seg-btn is-active" data-ue2-mode="encode">Mã hóa (Encode)</button>
      <button type="button" class="ue2-seg-btn" data-ue2-mode="decode">Giải mã (Decode)</button>
    </div>
    <div class="ue2-seg ue2-seg-scope" role="group" aria-label="Phạm vi">
      <button type="button" class="ue2-seg-btn is-active" data-ue2-scope="component">Tham số</button>
      <button type="button" class="ue2-seg-btn" data-ue2-scope="full">URL đầy đủ</button>
      <button type="button" class="ue2-seg-btn" data-ue2-scope="form">Form (dấu +)</button>
    </div>
    <p class="ue2-scope-note" id="ue2ScopeNote">Tham số: mã hóa mọi ký tự cấu trúc (&amp;, =, /, ?) — dùng cho giá trị của một tham số.</p>
    <div class="ue2-chips" aria-label="Ví dụ mẫu">
      <button type="button" class="ue2-chip" data-ue2-sample="search">Ví dụ: tìm kiếm tiếng Việt</button>
      <button type="button" class="ue2-chip" data-ue2-sample="plus">Ví dụ: C++</button>
      <button type="button" class="ue2-chip" data-ue2-sample="fullurl">Ví dụ: URL đầy đủ</button>
    </div>
    <label class="ue2-label" for="ue2Input">Dữ liệu đầu vào (Input)</label>
    <textarea id="ue2Input" class="ue2-textarea" spellcheck="false" placeholder="Nhập text hoặc URL vào đây..."></textarea>
    <p class="ue2-error" id="ue2Error" hidden></p>
    <div class="ue2-actions">
      <button type="button" class="ue2-btn ue2-btn-copy" id="ue2BtnCopy">Sao chép kết quả</button>
      <button type="button" class="ue2-btn ue2-btn-swap" id="ue2BtnSwap">Đảo chiều</button>
      <button type="button" class="ue2-btn ue2-btn-reset" id="ue2BtnReset">Làm mới</button>
      <button type="button" class="ue2-btn ue2-btn-dl" id="ue2BtnDl">Tải txt</button>
    </div>
  </div>
  <div class="ue2-card ue2-result-card" id="ue2ResultCard">
    <label class="ue2-label" for="ue2Output">Kết quả (Output)</label>
    <textarea id="ue2Output" class="ue2-textarea ue2-output" readonly spellcheck="false" placeholder="Kết quả sẽ hiển thị ở đây..."></textarea>
    <p class="ue2-stats" id="ue2Stats">Nhập nội dung để xem kết quả.</p>
    <button type="button" class="ue2-btn ue2-btn-more" id="ue2BtnMore" hidden>Giải mã thêm 1 lớp</button>
  </div>
  <details class="ue2-card ue2-adv">
    <summary class="ue2-adv-sum">Quy tắc chuyển đổi theo từng phạm vi</summary>
    <div class="ue2-adv-body">
      <p class="ue2-note"><strong>Tham Số:</strong> giữ nguyên A–Z a–z 0–9 và - _ . ! ~ * ' ( ); còn lại thành %HH (khoảng trắng → %20, dấu + thật → %2B). Dấu + trong đầu vào khi giải mã được giữ nguyên là dấu +.</p>
      <p class="ue2-note"><strong>URL đầy đủ:</strong> giữ nguyên cấu trúc : / ? # [ ] @ ! $ &amp; ' ( ) * + , ; = nên https:// vẫn dùng được; chỉ mã hóa khoảng trắng, ký tự có dấu và ký tự không hợp lệ.</p>
      <p class="ue2-note"><strong>Form (dấu +):</strong> giống Tham Số nhưng khoảng trắng thành dấu + khi mã hóa, và dấu + thành khoảng trắng khi giải mã — chỉ dùng cho dữ liệu form (application/x-www-form-urlencoded).</p>
      <p class="ue2-note">Mỗi thao tác chỉ chuyển đổi một lớp. Chuỗi đã mã hóa 2 lớp cần giải mã 2 lần — nút “Giải mã thêm 1 lớp” chỉ hiện khi kết quả còn nhóm %HH hợp lệ. Mọi xử lý chạy ngay trong trình duyệt, không gửi dữ liệu đi đâu.</p>
    </div>
  </details>
  <div class="ue2-toast" id="ue2Toast" role="status"></div>
</div>

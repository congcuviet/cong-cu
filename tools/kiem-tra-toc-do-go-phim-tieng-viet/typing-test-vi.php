<div class="ttv-soft-wrapper">

  <section class="ttv-card">
    <div class="ttv-controls">
      <div class="ttv-group">
        <span class="ttv-group-label">⏱ Thời gian</span>
        <button type="button" class="ttv-chip ttv-chip-active" data-ttv-time="30">30 giây</button>
        <button type="button" class="ttv-chip" data-ttv-time="60">60 giây</button>
      </div>
      <div class="ttv-group">
        <span class="ttv-group-label">📝 Văn bản</span>
        <button type="button" class="ttv-chip ttv-chip-active" data-ttv-mode="words">Từ đơn</button>
        <button type="button" class="ttv-chip" data-ttv-mode="sentences">Câu văn &amp; tục ngữ</button>
      </div>
      <button type="button" id="ttv-btn-new" class="ttv-chip ttv-chip-new">🔀 Đoạn mới</button>
    </div>

    <p id="ttv-best" class="ttv-best" style="display:none"></p>

    <div class="ttv-stats">
      <div class="ttv-stat"><span class="ttv-stat-label">Thời gian</span><span class="ttv-stat-value"><span id="ttv-stat-time">30</span>s</span></div>
      <div class="ttv-stat"><span class="ttv-stat-label">Tốc độ (WPM)</span><span class="ttv-stat-value" id="ttv-stat-wpm">0</span></div>
      <div class="ttv-stat"><span class="ttv-stat-label">Chính xác</span><span class="ttv-stat-value"><span id="ttv-stat-acc">100</span>%</span></div>
    </div>

    <div id="ttv-display" class="ttv-display" title="Bấm vào đây rồi bắt đầu gõ">
      <div id="ttv-text-inner" class="ttv-text-inner"></div>
      <textarea id="ttv-input" class="ttv-input" rows="3" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Ô gõ phím — gõ đúng theo đoạn văn phía trên"></textarea>
    </div>
    <p class="ttv-hint">🖱 Bấm vào khung rồi gõ theo đoạn văn — đồng hồ tự chạy khi bạn gõ ký tự đầu tiên. Gõ bằng bộ gõ Telex/VNI như bình thường, không dán (paste) được đâu nhé.</p>
    <button type="button" id="ttv-btn-finish" class="ttv-btn-finish" style="display:none">⏹ Kết thúc &amp; xem kết quả</button>

    <div id="ttv-result" class="ttv-result" style="display:none">
      <div class="ttv-res-main">
        <span class="ttv-res-wpm"><span id="ttv-res-wpm">0</span> <small>WPM</small></span>
        <span class="ttv-res-rank" id="ttv-res-rank"></span>
      </div>
      <div class="ttv-res-grid">
        <div class="ttv-res-chip"><span>🎯 Độ chính xác</span><strong id="ttv-res-acc">0%</strong></div>
        <div class="ttv-res-chip"><span>🔤 Ký tự đúng / đã gõ</span><strong id="ttv-res-chars">0/0</strong></div>
      </div>
      <button type="button" id="ttv-btn-again" class="ttv-btn-again">↻ Gõ lại đoạn mới</button>
    </div>
  </section>

  <details class="ttv-accordion">
    <summary>💡 WPM là gì? Mẹo gõ tiếng Việt nhanh &amp; chuẩn</summary>
    <div class="ttv-acc-body">
      <p><strong>WPM</strong> (words per minute — số từ mỗi phút) là thước đo tốc độ gõ quốc tế: cứ 5 ký tự gõ đúng (kể cả dấu cách) tính là 1 từ. Mốc tham khảo: dưới 20 WPM là mới tập, 30–40 WPM đủ dùng văn phòng, 50–70 WPM là nhanh, trên 80 WPM thuộc nhóm chuyên nghiệp.</p>
      <p><strong>Mẹo gõ nhanh:</strong> đặt tay đúng vị trí gốc (ASDF – JKL;), tập gõ 10 ngón không nhìn bàn phím, mắt nhìn màn hình thay vì nhìn tay; gõ đều nhịp thay vì gõ nhanh từng đợt rồi dừng; với Telex hãy gõ hết từ rồi mới để dấu tự về đúng vị trí (gõ "vieetj" thay vì dừng giữa chừng). Sai thì cứ gõ tiếp ở bài kiểm tra tốc độ — quay lại sửa làm mất nhịp, độ chính xác đã được tính riêng.</p>
      <p><strong>Lưu ý:</strong> kết quả phụ thuộc bàn phím và bộ gõ bạn đang dùng; hãy so sánh với chính kỷ lục của mình qua từng ngày. Kỷ lục hiển thị trong công cụ được lưu ngay trên trình duyệt/máy của bạn.</p>
    </div>
  </details>

</div>

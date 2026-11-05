<div class="aa2-soft-wrapper">
  <div class="aa2-soft-header">
    <p class="aa2-intro">Ghép nhạc vào video ngay trên trình duyệt, không tải file lên máy chủ. Tối đa 3 track nhạc, kéo thả trên Timeline, chỉnh âm lượng từng track và chọn giữ hoặc thay tiếng gốc.</p>
  </div>
  <script src="/wp-content/themes/bricks-child/tai-nguyen/ffmpeg.min.js"></script>
  <div class="aa2-body">
    <div class="aa2-card">
      <div class="aa2-upload-box" id="aa2-box-video" tabindex="0">
        <input type="file" id="aa2-video-input" hidden accept="video/*">
        <span class="aa2-icon" id="aa2-icon-video">🎞️</span>
        <span class="aa2-filename" id="aa2-video-name">Nhấp để tải Video Gốc lên trước</span>
        <span class="aa2-filesize" id="aa2-video-note">Hỗ trợ MP4, MOV, WebM, MKV… Mỗi lần xử lý một video.</span>
      </div>
      <p class="aa2-error" id="aa2-error" hidden></p>
      <div id="aa2-preview-section" hidden>
        <div class="aa2-video-box">
          <video id="aa2-player" controls preload="metadata"></video>
        </div>
        <p class="aa2-meta-line">Thời lượng: <b id="aa2-meta-dur">—</b> · Dung lượng: <b id="aa2-meta-size">—</b> · Định dạng: <b id="aa2-meta-ext">—</b></p>
        <p class="aa2-hint">💡 <b>Nghe thử:</b> Bấm Play video để nghe trước sự kết hợp của các luồng âm thanh.</p>
      </div>
    </div>

    <div class="aa2-card" id="aa2-mode-card" hidden>
      <span class="aa2-label">Tiếng video gốc sẽ xử lý thế nào?</span>
      <div class="aa2-seg" role="group">
        <button type="button" class="aa2-seg-btn active" data-aa2-mode="mix">Giữ tiếng gốc</button>
        <button type="button" class="aa2-seg-btn" data-aa2-mode="replace">Chỉ giữ nhạc mới</button>
      </div>
      <p class="aa2-mode-desc" id="aa2-mode-desc">Trộn nhạc mới vào cùng tiếng gốc. Bật “Nhỏ tiếng Video gốc (Ducking)” ở từng track để tiếng gốc nhỏ xuống trong đoạn có nhạc.</p>
    </div>

    <div class="aa2-card" id="aa2-timeline-board" hidden>
      <div class="aa2-timeline-header">
        <span class="aa2-label">Timeline (kéo thanh nhạc để di chuyển, kéo hai mép để cắt)</span>
        <button type="button" class="aa2-btn-small" id="aa2-btn-add-track">➕ Thêm Track Nhạc</button>
      </div>
      <div class="aa2-track-row">
        <div class="aa2-track-icon">🎞️ Video</div>
        <div class="aa2-track-bar-bg">
          <div class="aa2-bar aa2-bar-video">Video Gốc</div>
        </div>
      </div>
      <div id="aa2-timeline-tracks"></div>
    </div>

    <div id="aa2-tracks-container"></div>

    <div class="aa2-actions">
      <button type="button" id="aa2-btn-start" class="aa2-btn-primary" disabled>🚀 Render &amp; Tải Xuống Video</button>
    </div>

    <div class="aa2-status-box" id="aa2-status-box" hidden>
      <p class="aa2-status-text" id="aa2-status-text">Đang khởi động lõi Render...</p>
      <div class="aa2-progress-bar">
        <div id="aa2-progress-fill" class="aa2-progress-fill"></div>
      </div>
      <p class="aa2-detail-text" id="aa2-detail-text"></p>
    </div>

    <div class="aa2-result-box" id="aa2-result-box" hidden>
      <p class="aa2-result-text" id="aa2-result-text"></p>
    </div>

    <details class="aa2-details">
      <summary>Giới hạn &amp; lưu ý</summary>
      <ul>
        <li>Video và nhạc chỉ xử lý trên trình duyệt của bạn, không gửi lên máy chủ.</li>
        <li>Ở chế độ “Giữ tiếng gốc”, video cần có sẵn luồng tiếng; video không có tiếng vẫn ghép được ở chế độ “Chỉ giữ nhạc mới”.</li>
        <li>Đoạn nhạc vượt quá cuối video sẽ bị cắt ở phần vượt khi xuất, vì video kết quả giữ đúng thời lượng video gốc.</li>
        <li>Công cụ chưa có fade-in/fade-out; đoạn nhạc bắt đầu và kết thúc đột ngột ở đúng mốc đã đặt.</li>
        <li>File kết quả luôn là MP4, hình ảnh giữ nguyên video gốc.</li>
      </ul>
    </details>
  </div>
</div>

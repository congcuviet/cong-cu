<div class="cr2-wrapper">
  <div class="cr2-layout">
    <div class="cr2-col">
      <div class="cr2-card cr2-card-yellow">
        <h3 class="cr2-card-title">🔴 Ống Kính (Xem Trực Tiếp)</h3>
        <div class="cr2-video-box">
          <video id="cr2-preview" class="cr2-video" autoplay muted playsinline></video>
          <div class="cr2-overlay">
            <div id="cr2-status" class="cr2-badge">Đang Tắt</div>
            <div id="cr2-timer" class="cr2-timer" style="display:none;"><span class="cr2-dot"></span><span id="cr2-time">00:00</span></div>
          </div>
        </div>
        <div class="cr2-controls">
          <button id="cr2-btn-power" class="cr2-btn cr2-btn-power" type="button">🔌 Bật Camera &amp; Mic</button>
          <div id="cr2-rec-actions" class="cr2-row" style="display:none;">
            <button id="cr2-btn-start" class="cr2-btn cr2-btn-start" type="button">⏺️ Bắt Đầu Quay</button>
            <button id="cr2-btn-pause" class="cr2-btn cr2-btn-pause" type="button" style="display:none;">⏸️ Tạm Dừng</button>
            <button id="cr2-btn-stop" class="cr2-btn cr2-btn-stop" type="button" style="display:none;">⏹️ Dừng Quay</button>
          </div>
          <button id="cr2-btn-camoff" class="cr2-btn cr2-btn-camoff" type="button" style="display:none;">📴 Tắt Camera</button>
        </div>
        <div id="cr2-error" class="cr2-error" style="display:none;"></div>
      </div>
    </div>
    <div class="cr2-col">
      <div class="cr2-card cr2-card-white">
        <h3 class="cr2-card-title">🎞️ Cuộn Phim (Kết Quả)</h3>
        <div class="cr2-video-box">
          <video id="cr2-playback" class="cr2-video" controls playsinline style="display:none;"></video>
          <div id="cr2-empty" class="cr2-empty"><span class="cr2-empty-icon">🎬</span><br>Chưa có đoạn phim nào được ghi...</div>
        </div>
        <p id="cr2-info" class="cr2-info" style="display:none;"></p>
        <div class="cr2-controls">
          <button id="cr2-btn-download" class="cr2-btn cr2-btn-download" type="button" disabled>💾 Tải Video Xuống (.webm)</button>
        </div>
        <div class="cr2-note">💡 <b>Mẹo:</b> Bản ghi chỉ xử lý trên máy của bạn, không tải lên máy chủ. Video lưu ở định dạng .webm; cần MP4 thì chuyển đổi bằng công cụ khác sau khi tải về.</div>
      </div>
    </div>
  </div>
  <details class="cr2-settings">
    <summary class="cr2-settings-title">⚙️ Cài đặt camera, micro và khung xem trước</summary>
    <div class="cr2-settings-body">
      <label class="cr2-check"><input id="cr2-mirror" type="checkbox" checked> Soi gương khung xem trước (bản ghi không bị lật)</label>
      <label class="cr2-check"><input id="cr2-mic" type="checkbox" checked> Ghi kèm tiếng từ micro</label>
      <div class="cr2-field">
        <label class="cr2-label" for="cr2-cam-select">Camera</label>
        <select id="cr2-cam-select" class="cr2-select" disabled><option value="">Bật camera để xem danh sách thiết bị</option></select>
      </div>
      <div class="cr2-field">
        <label class="cr2-label" for="cr2-mic-select">Micro</label>
        <select id="cr2-mic-select" class="cr2-select" disabled><option value="">Bật camera để xem danh sách thiết bị</option></select>
      </div>
      <p id="cr2-settings-note" class="cr2-settings-note" style="display:none;">Đổi micro sẽ áp dụng khi bạn tắt và bật lại camera.</p>
    </div>
  </details>
</div>

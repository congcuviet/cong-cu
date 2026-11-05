<div class="aj2-soft-wrapper">
  <div class="aj2-card aj2-upload-card">
    <div class="aj2-upload-box" id="aj2-box" role="button" tabindex="0" aria-label="Chọn tệp âm thanh">
      <input type="file" id="aj2-input" class="aj2-sr-only" accept="audio/*,video/*" multiple>
      <span class="aj2-icon">➕</span>
      <span class="aj2-filename">Nhấp hoặc kéo thả nhiều tệp âm thanh vào đây</span>
      <small class="aj2-hint">Hỗ trợ MP3, M4A, WAV, OGG, FLAC và tiếng của video. Có thể thêm nhiều lần.</small>
    </div>
    <p class="aj2-note" id="aj2-add-note" hidden></p>
  </div>

  <div class="aj2-card" id="aj2-list-card" hidden>
    <label class="aj2-label">📋 Thứ tự ghép (kéo thả hàng hoặc dùng nút mũi tên)</label>
    <div class="aj2-track-list" id="aj2-list"></div>
    <div class="aj2-row">
      <button type="button" class="aj2-btn aj2-btn-ghost" id="aj2-clear">🗑 Xóa tất cả</button>
      <span class="aj2-total" id="aj2-total">Tổng: 0:00.0</span>
    </div>
  </div>

  <div class="aj2-card">
    <label class="aj2-label">🔗 Cách nối các đoạn</label>
    <div class="aj2-seg" role="group" aria-label="Cách nối">
      <button type="button" class="aj2-seg-btn is-active" data-aj2-mode="direct">Nối thẳng</button>
      <button type="button" class="aj2-seg-btn" data-aj2-mode="crossfade">Crossfade</button>
      <button type="button" class="aj2-seg-btn" data-aj2-mode="gap">Khoảng lặng</button>
    </div>
    <div class="aj2-join-seconds" id="aj2-seconds-wrap" hidden>
      <label class="aj2-label" for="aj2-seconds">Thời gian mỗi chỗ nối</label>
      <input type="range" id="aj2-seconds" min="0.5" max="5" step="0.5" value="2">
      <span class="aj2-seconds-val" id="aj2-seconds-val">2,0 giây</span>
      <p class="aj2-caption" id="aj2-seconds-caption">Mỗi chỗ nối dài 2,0 giây.</p>
    </div>
    <details class="aj2-details">
      <summary>Nâng cao</summary>
      <label class="aj2-check"><input type="checkbox" id="aj2-fade-ends"> Mờ dần 0,5 giây ở đầu và cuối bản ghép</label>
    </details>
    <p class="aj2-error" id="aj2-error" hidden></p>
    <button type="button" class="aj2-btn aj2-btn-primary" id="aj2-render" disabled>🎵 Ghép &amp; nghe thử</button>
  </div>

  <div class="aj2-card aj2-result" id="aj2-result" hidden>
    <div class="aj2-hero" id="aj2-hero">0:00.0</div>
    <p class="aj2-sub" id="aj2-sub"></p>
    <div class="aj2-row">
      <button type="button" class="aj2-btn" id="aj2-play">▶ Nghe</button>
      <button type="button" class="aj2-btn aj2-btn-primary" id="aj2-download">⬇ Tải file WAV</button>
    </div>
    <p class="aj2-note">File chỉ xử lý trên trình duyệt, không tải lên máy chủ. Bản này xuất WAV 16-bit; muốn MP3, hãy dùng công cụ chuyển đổi đuôi nhạc của Công Cụ Việt.</p>
  </div>
</div>
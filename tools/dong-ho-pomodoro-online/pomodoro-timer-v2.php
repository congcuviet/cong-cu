<div class="pm2-soft-wrapper pm2-mode-focus pm2-theme-neo" id="pm2-app">
<div class="pm2-grid-overlay"></div>
<button id="pm2-fullscreen" class="pm2-float-top" type="button" title="Bật toàn màn hình">⛶</button>
<div class="pm2-themes" id="pm2-themes">
<button type="button" class="pm2-theme-btn active" data-theme="neo" title="Cổ điển">🎨 Cổ điển</button>
<button type="button" class="pm2-theme-btn" data-theme="flow" title="Sóng lượn">🌊 Sóng lượn</button>
<button type="button" class="pm2-theme-btn" data-theme="breath" title="Nhịp thở">🌬️ Nhịp thở</button>
<button type="button" class="pm2-theme-btn" data-theme="matrix" title="Ma trận đen">⬛ Ma trận đen</button>
</div>
<div class="pm2-modes" id="pm2-modes">
<button type="button" class="pm2-mode-btn" data-mode="short">Nghỉ ngắn (5 phút)</button>
<button type="button" class="pm2-mode-btn" data-mode="long">Nghỉ dài (15 phút)</button>
<button type="button" class="pm2-mode-btn active" data-mode="focus">Tập trung (25 phút)</button>
<button type="button" class="pm2-mode-btn" data-mode="deep">Tập trung sâu (45 phút)</button>
<button type="button" class="pm2-mode-btn" data-mode="hardcore">Tập trung dài (60 phút)</button>
</div>
<div class="pm2-timer-card" id="pm2-timer-card">
<div id="pm2-status" class="pm2-status">🔥 Tập trung</div>
<div id="pm2-time" class="pm2-time">25:00</div>
<div class="pm2-progress"><div id="pm2-progress-bar" class="pm2-progress-bar"></div></div>
<div id="pm2-progress-pct" class="pm2-progress-pct">Đã trôi qua: 0%</div>
<div id="pm2-dots" class="pm2-dots"></div>
<div id="pm2-today" class="pm2-today">Hôm nay: 0 phiên tập trung · 0 phút tập trung</div>
<div id="pm2-notice" class="pm2-notice" hidden></div>
</div>
<div class="pm2-controls">
<button type="button" id="pm2-start" class="pm2-btn pm2-btn-primary">Bắt đầu ▶️</button>
<button type="button" id="pm2-pause" class="pm2-btn pm2-btn-secondary" hidden>Tạm dừng ⏸️</button>
<button type="button" id="pm2-skip" class="pm2-btn pm2-btn-dark" hidden>Bỏ qua ⏭️</button>
<button type="button" id="pm2-reset" class="pm2-btn pm2-btn-white">Đặt lại ↺</button>
</div>
<details class="pm2-adv">
<summary>Cài đặt nâng cao</summary>
<div class="pm2-grid2">
<div class="pm2-field">
<label class="pm2-label" for="pm2-focus-min">Thời lượng tập trung (phút)</label>
<input id="pm2-focus-min" class="pm2-input" type="number" min="1" max="120" step="1" value="25">
</div>
<div class="pm2-field">
<label class="pm2-label" for="pm2-short-min">Thời lượng nghỉ ngắn (phút)</label>
<input id="pm2-short-min" class="pm2-input" type="number" min="1" max="120" step="1" value="5">
</div>
<div class="pm2-field">
<label class="pm2-label" for="pm2-long-min">Thời lượng nghỉ dài (phút)</label>
<input id="pm2-long-min" class="pm2-input" type="number" min="1" max="120" step="1" value="15">
</div>
<div class="pm2-field">
<label class="pm2-label" for="pm2-every">Nghỉ dài sau mỗi (phiên tập trung)</label>
<input id="pm2-every" class="pm2-input" type="number" min="2" max="8" step="1" value="4">
</div>
</div>
<p class="pm2-hint">Tập trung sâu giữ cố định 45 phút và Tập trung dài giữ cố định 60 phút, không theo ô thời lượng tập trung ở trên.</p>
<label class="pm2-check"><input id="pm2-auto" type="checkbox" checked> Tự chuyển phiên tiếp theo khi hết giờ</label>
<label class="pm2-check"><input id="pm2-sound" type="checkbox" checked> Phát âm báo khi hết giờ</label>
<div class="pm2-notify-row" id="pm2-notify-row">
<span class="pm2-hint">Bật thông báo để trình duyệt gọi bạn khi hết giờ, kể cả khi đang ở tab khác.</span>
<button type="button" id="pm2-notify" class="pm2-btn pm2-btn-dark">Bật thông báo</button>
</div>
</details>
<p class="pm2-hint pm2-keys">Phím tắt: Phím cách = bắt đầu/tạm dừng · R = đặt lại · S = bỏ qua. Đồng hồ tự lưu tiến trình, tải lại trang vẫn tiếp tục đúng giờ còn lại.</p>
</div>
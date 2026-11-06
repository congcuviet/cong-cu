<div class="lp2-soft-wrapper">
    <div class="lp2-soft-header">
        <h2>Lặp lại Video</h2>
        <p>Nhân bản video gốc thành video dài liền mạch — xử lý ngay trên trình duyệt, không tải lên máy chủ.</p>
    </div>
    <script src="/wp-content/themes/bricks-child/tai-nguyen/ffmpeg.min.js"></script>
    <div class="lp2-body">
        <div class="lp2-group">
            <div class="lp2-upload-box" id="lp2-upload-box" role="button" tabindex="0" aria-label="Chọn video">
                <input type="file" id="lp2-file-input" hidden accept="video/*">
                <span class="lp2-icon" id="lp2-icon">🎬</span>
                <span id="lp2-filename" class="lp2-filename">Nhấp hoặc kéo thả video vào đây…</span>
                <span id="lp2-filesize" class="lp2-filesize" hidden></span>
            </div>
            <p class="lp2-hint">Video chỉ xử lý trên máy bạn. Xuất ra MP4, giữ nguyên chất lượng gốc.</p>
        </div>
        <div id="lp2-player-box" hidden>
            <div class="lp2-flex-between">
                <label class="lp2-label">Xem trước</label>
                <span class="lp2-badge">Phát lặp</span>
            </div>
            <div class="lp2-stage">
                <video id="lp2-player" controls loop playsinline preload="metadata"></video>
            </div>
            <p id="lp2-source-line" class="lp2-meta-line"></p>
            <div class="lp2-card">
                <label class="lp2-label" for="lp2-loop-count">Số lần phát trong tệp xuất (tính cả bản gốc)</label>
                <div class="lp2-chip-row" role="group" aria-label="Số lần lặp nhanh">
                    <button type="button" class="lp2-chip" data-count="2">2 lần</button>
                    <button type="button" class="lp2-chip" data-count="3">3 lần</button>
                    <button type="button" class="lp2-chip" data-count="5">5 lần</button>
                    <button type="button" class="lp2-chip" data-count="10">10 lần</button>
                </div>
                <div class="lp2-loop-controls">
                    <button type="button" class="lp2-stepper" id="lp2-btn-minus" aria-label="Giảm một lần">−</button>
                    <input type="number" id="lp2-loop-count" class="lp2-input" value="3" min="2" max="100" inputmode="numeric">
                    <button type="button" class="lp2-stepper" id="lp2-btn-plus" aria-label="Tăng một lần">+</button>
                    <span class="lp2-suffix">lần</span>
                </div>
                <p id="lp2-output-line" class="lp2-output-line"></p>
                <p id="lp2-est-line" class="lp2-meta-line"></p>
            </div>
            <details class="lp2-details">
                <summary>Tính số lần theo thời lượng đích</summary>
                <div class="lp2-target-row">
                    <label class="lp2-label" for="lp2-target-sec">Thời lượng đích (giây)</label>
                    <input type="number" id="lp2-target-sec" class="lp2-input" min="1" inputmode="numeric" placeholder="Ví dụ: 360">
                    <button type="button" class="lp2-btn-secondary" id="lp2-btn-target">Tính số lần</button>
                </div>
                <p id="lp2-target-line" class="lp2-meta-line"></p>
            </details>
            <div class="lp2-action-row">
                <button type="button" id="lp2-btn-start" class="lp2-btn-primary">Lặp video &amp; tải xuống</button>
                <button type="button" id="lp2-btn-new" class="lp2-btn-secondary">Chọn video khác</button>
            </div>
            <p id="lp2-error" class="lp2-error" hidden></p>
        </div>
        <div id="lp2-status-box" class="lp2-status-box" hidden>
            <h4 id="lp2-status-text">Đang khởi động lõi xử lý…</h4>
            <div class="lp2-progress-bar">
                <div id="lp2-progress-fill" class="lp2-progress-fill"></div>
            </div>
            <p id="lp2-detail-text" class="lp2-detail-text"></p>
        </div>
        <div id="lp2-result-box" class="lp2-result-box" hidden>
            <div class="lp2-result-hero">Video đã lặp xong</div>
            <div class="lp2-stage">
                <video id="lp2-result-player" controls playsinline preload="metadata"></video>
            </div>
            <p id="lp2-result-meta" class="lp2-meta-line"></p>
            <button type="button" id="lp2-btn-download" class="lp2-btn-primary">Tải video đã lặp</button>
        </div>
    </div>
</div>

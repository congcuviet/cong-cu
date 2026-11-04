<div class="ar2-soft-wrapper">
    <script src="/wp-content/themes/bricks-child/tai-nguyen/ffmpeg.min.js"></script>

    <div class="ar2-card">
        <label class="ar2-label" for="ar2-file-input">Video cần đổi tỷ lệ khung hình</label>
        <label class="ar2-drop" id="ar2-drop">
            <input type="file" id="ar2-file-input" class="ar2-file" accept="video/*">
            <span class="ar2-drop-icon">📐</span>
            <span id="ar2-filename" class="ar2-filename">Nhấp để chọn video, hoặc kéo thả video vào đây</span>
            <span class="ar2-hint">Xử lý ngay trên trình duyệt, video không tải lên máy chủ, không watermark.</span>
        </label>
        <p id="ar2-source-meta" class="ar2-meta" hidden></p>
    </div>

    <div id="ar2-settings" class="ar2-card" hidden>
        <div class="ar2-group">
            <span class="ar2-label">Tỷ lệ khung hình mới</span>
            <div class="ar2-chips" id="ar2-ratios">
                <button type="button" class="ar2-chip" data-ar2-ratio="9:16">9:16 Dọc</button>
                <button type="button" class="ar2-chip is-active" data-ar2-ratio="16:9">16:9 Ngang</button>
                <button type="button" class="ar2-chip" data-ar2-ratio="1:1">1:1 Vuông</button>
                <button type="button" class="ar2-chip" data-ar2-ratio="4:5">4:5 Dọc</button>
                <button type="button" class="ar2-chip" data-ar2-ratio="4:3">4:3</button>
                <button type="button" class="ar2-chip" data-ar2-ratio="3:4">3:4</button>
                <button type="button" class="ar2-chip" data-ar2-ratio="21:9">21:9 Phim</button>
            </div>
        </div>

        <div class="ar2-group">
            <span class="ar2-label">Cách đặt hình vào khung mới</span>
            <div class="ar2-seg" id="ar2-mode-seg">
                <button type="button" class="ar2-seg-btn is-active" data-ar2-mode="pad" aria-pressed="true">Thêm viền</button>
                <button type="button" class="ar2-seg-btn" data-ar2-mode="crop" aria-pressed="false">Cắt lấp đầy</button>
                <button type="button" class="ar2-seg-btn" data-ar2-mode="stretch" aria-pressed="false">Kéo giãn</button>
            </div>
            <p class="ar2-hint" id="ar2-mode-hint">Giữ toàn bộ hình, phần thừa thành viền.</p>
            <div class="ar2-seg ar2-padbg" id="ar2-padbg-seg">
                <button type="button" class="ar2-seg-btn is-active" data-ar2-padbg="black" aria-pressed="true">Viền đen</button>
                <button type="button" class="ar2-seg-btn" data-ar2-padbg="white" aria-pressed="false">Viền trắng</button>
            </div>
            <div class="ar2-seg ar2-anchor" id="ar2-anchor-seg" hidden>
                <button type="button" class="ar2-seg-btn is-active" data-ar2-anchor="center" aria-pressed="true">Cắt giữa</button>
                <button type="button" class="ar2-seg-btn" data-ar2-anchor="start" aria-pressed="false">Trái / Trên</button>
                <button type="button" class="ar2-seg-btn" data-ar2-anchor="end" aria-pressed="false">Phải / Dưới</button>
            </div>
        </div>

        <div class="ar2-group">
            <span class="ar2-label">Xem trước khung hình</span>
            <div class="ar2-preview-box" id="ar2-preview-box">
                <div id="ar2-preview-frame" class="ar2-preview-frame">
                    <video id="ar2-preview-video" muted playsinline></video>
                </div>
            </div>
            <p id="ar2-plan" class="ar2-plan"></p>
            <p id="ar2-meta" class="ar2-meta"></p>
            <p class="ar2-hint">Xem trước tắt tiếng; file xuất ra vẫn giữ tiếng gốc.</p>
        </div>

        <div class="ar2-actions">
            <button type="button" id="ar2-btn-start" class="ar2-btn-primary">Đổi tỷ lệ khung hình</button>
            <button type="button" id="ar2-btn-cancel" class="ar2-btn" hidden>Hủy</button>
        </div>
    </div>

    <div id="ar2-progress" class="ar2-card" hidden>
        <h4 id="ar2-status-text" class="ar2-status">Đang khởi động lõi xử lý...</h4>
        <div class="ar2-progress-bar"><div id="ar2-progress-fill" class="ar2-progress-fill"></div></div>
        <p id="ar2-detail-text" class="ar2-meta"></p>
    </div>

    <p id="ar2-error" class="ar2-error" hidden></p>

    <div id="ar2-result" class="ar2-card ar2-result" hidden>
        <p class="ar2-hero">Hoàn tất</p>
        <p id="ar2-result-meta" class="ar2-meta"></p>
        <video id="ar2-result-video" controls preload="metadata"></video>
        <div class="ar2-actions">
            <button type="button" id="ar2-btn-download" class="ar2-btn-primary">Tải xuống</button>
            <button type="button" id="ar2-btn-again" class="ar2-btn">Xử lý video khác</button>
        </div>
    </div>

    <details class="ar2-details">
        <summary>Tỷ lệ tùy chỉnh và lưu ý</summary>
        <div class="ar2-grid2">
            <div class="ar2-field">
                <label class="ar2-sublabel" for="ar2-custom-w">Tỷ lệ ngang</label>
                <input type="number" id="ar2-custom-w" class="ar2-input" min="1" max="100" step="1" inputmode="numeric" placeholder="Ví dụ: 5">
            </div>
            <div class="ar2-field">
                <label class="ar2-sublabel" for="ar2-custom-h">Tỷ lệ dọc</label>
                <input type="number" id="ar2-custom-h" class="ar2-input" min="1" max="100" step="1" inputmode="numeric" placeholder="Ví dụ: 4">
            </div>
        </div>
        <p class="ar2-hint">Nhập cả hai số để dùng tỷ lệ tùy chỉnh, ví dụ 5:4. Nhấn một chip tỷ lệ có sẵn để quay lại tỷ lệ đó. Video xử lý hoàn toàn trên trình duyệt, không gửi lên máy chủ. Âm thanh giữ nguyên khi tương thích, nếu không sẽ mã hóa lại AAC.</p>
    </details>
</div>
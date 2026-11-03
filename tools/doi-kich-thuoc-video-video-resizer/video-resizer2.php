<div class="vres-soft-wrapper">
    <div class="vres-soft-header">
        <h2>📏 Đổi Kích Thước Video</h2>
        <p>Thu phóng video, tuỳ chỉnh độ phân giải tự do hoặc theo chuẩn để tối ưu hiển thị và dung lượng.</p>
    </div>

    <!-- NẠP THƯ VIỆN FFMPEG TỪ HOST CỦA BẠN -->
    <script src="/wp-content/themes/bricks-child/tai-nguyen/ffmpeg.min.js"></script>

    <div class="vres-body">
        
        <!-- Khung Upload -->
        <div class="vres-group">
            <div class="vres-upload-box" onclick="document.getElementById('vres-file-input').click()">
                <input type="file" id="vres-file-input" hidden accept="video/*">
                <span class="vres-icon">📐</span>
                <span id="vres-filename" class="vres-filename">Nhấp để tải video lên...</span>
            </div>
        </div>

        <!-- Khung Cài Đặt (Ẩn lúc đầu) -->
        <div id="vres-settings" style="display: none;">
            
            <div class="vres-group">
                <label class="vres-label">🎯 Nhập kích thước (Width x Height):</label>
                <div class="vres-dimension-box">
                    <div class="vres-input-wrap">
                        <span>Chiều rộng (px)</span>
                        <input type="number" id="vres-width" class="vres-input" value="1280" min="100" step="2">
                    </div>
                    <div class="vres-cross">✖</div>
                    <div class="vres-input-wrap">
                        <span>Chiều cao (px)</span>
                        <input type="number" id="vres-height" class="vres-input" value="720" min="100" step="2">
                    </div>
                </div>
                <p class="vres-hint-text">💡 Gợi ý chuẩn: 1920x1080 (Ngang), 1080x1920 (Dọc TikTok), 1080x1080 (Vuông).</p>
            </div>

            <div class="vres-group">
                <label class="vres-label">🎨 Chế độ Thu/Phóng (Scaling Mode):</label>
                <div class="neo-select-wrapper">
                    <select id="vres-mode" class="neo-select">
                        <option value="pad" selected>⬛ Thu nhỏ vừa khít & Thêm viền đen (Không méo)</option>
                        <option value="crop">✂️ Phóng to lấp đầy & Cắt viền thừa (Mất chi tiết 2 bên)</option>
                        <option value="stretch">↔️ Kéo giãn video (Lấp đầy 100% nhưng bị méo hình)</option>
                    </select>
                </div>
            </div>

            <!-- KHU VỰC XEM TRƯỚC (PREVIEW) -->
            <div class="vres-group">
                <label class="vres-label">👀 Xem Trước Kết Quả (Mô phỏng):</label>
                <div class="vres-preview-container" id="vres-preview-container">
                    <!-- Khung đen đại diện cho kích thước Video xuất ra -->
                    <div id="vres-preview-frame" class="vres-preview-frame">
                        <video id="vres-preview-video" muted playsinline></video>
                    </div>
                </div>
            </div>
            
        </div>

        <!-- Nút Xử Lý -->
        <button id="vres-btn-start" class="vres-btn-primary" disabled>
            🚀 Đổi Kích Thước & Tải Xuống
        </button>

        <!-- Trạng thái & Thanh Progress -->
        <div id="vres-status-box" class="vres-status-box" style="display: none;">
            <h4 id="vres-status-text">Đang khởi động lõi Render...</h4>
            <div class="vres-progress-bar">
                <div id="vres-progress-fill" class="vres-progress-fill"></div>
            </div>
            <p id="vres-detail-text" style="margin-top:10px; font-weight:700; font-size:0.9rem;"></p>
        </div>
        
    </div>
</div>
<div class="rev-soft-wrapper">
    <div class="rev-soft-header">
        <h2>⏪ Đảo Ngược Âm Thanh</h2>
        <p>Tua ngược (Reverse) file âm thanh của bạn để tạo ra những hiệu ứng âm thanh bí ẩn và độc đáo.</p>
    </div>

    <!-- Khu vực Tải file -->
    <div class="rev-input-section" id="rev-upload-box">
        <input type="file" id="rev-file-input" accept="audio/*" hidden>
        <button class="rev-btn-upload" onclick="document.getElementById('rev-file-input').click()">
            📂 Chọn File Âm Thanh
        </button>
        <div id="rev-filename" class="rev-filename-display">Chưa có file nào được chọn...</div>
    </div>

    <!-- Trạng thái Loading (Hiện khi đang xử lý đảo ngược) -->
    <div id="rev-loading" class="rev-loading-box" style="display: none;">
        <div class="rev-spinner"></div>
        <span>Đang xử lý đảo ngược âm thanh, vui lòng chờ...</span>
    </div>

    <!-- Khu vực Điều khiển (Ẩn cho đến khi xử lý xong) -->
    <div class="rev-controls-box" id="rev-workspace" style="display: none;">
        
        <div class="rev-hint-box">
            ✅ <b>Xử lý hoàn tất!</b> File của bạn đã được lật ngược từ cuối lên đầu.
        </div>

        <!-- Thanh nút bấm -->
        <div class="rev-action-bar">
            <button id="rev-btn-play" class="neo-btn-action">
                ▶️ Nghe Thử
            </button>
            <button id="rev-btn-download" class="neo-btn-primary">
                🚀 Tải Xuống (WAV)
            </button>
        </div>

        <!-- Trạng thái & Sóng âm -->
        <div class="rev-status-bar">
            <div class="sound-wave" id="rev-wave">
                <span></span><span></span><span></span><span></span><span></span>
            </div>
            <span id="rev-status-text">Sẵn sàng phát...</span>
        </div>
        
    </div>
    
    <!-- Audio ẩn dùng để nghe thử -->
    <audio id="rev-audio-element" crossorigin="anonymous"></audio>
</div>
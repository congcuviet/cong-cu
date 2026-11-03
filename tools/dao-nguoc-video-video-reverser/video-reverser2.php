<div class="vrev-soft-wrapper">
    <div class="vrev-soft-header">
        <h2>⏪ Đảo Ngược Video (Rewind)</h2>
        <p>Tạo hiệu ứng "tua ngược thời gian" cực ảo diệu cho video của bạn.</p>
    </div>

    <!-- NẠP THƯ VIỆN FFMPEG -->
    <script src="/wp-content/themes/bricks-child/tai-nguyen/ffmpeg.min.js"></script>

    <div class="vrev-body">
        
        <!-- BỐ CỤC 2 CỘT -->
        <div class="vrev-main-layout">
            
            <!-- CỘT TRÁI: Upload & Preview -->
            <div class="vrev-col">
                <div class="vrev-group">
                    <div class="vrev-upload-box" id="vrev-box-video" onclick="document.getElementById('vrev-video-input').click()">
                        <input type="file" id="vrev-video-input" hidden accept="video/*">
                        <span class="vrev-icon" id="vrev-icon-video">🔙</span>
                        <span id="vrev-video-name" class="vrev-filename">Nhấp để tải Video cần tua ngược...</span>
                    </div>
                </div>

                <div id="vrev-preview-section" style="display: none; margin-bottom: 20px;">
                    <label class="vrev-label">👀 Video Gốc:</label>
                    <video id="vrev-player" controls preload="metadata" style="width: 100%; border-radius: 12px; border: 2px solid #111; background: #000;"></video>
                </div>

                <!-- Trạng thái & Thanh Progress -->
                <div id="vrev-status-box" class="vrev-status-box" style="display: none;">
                    <h4 id="vrev-status-text">Đang khởi động lõi Render...</h4>
                    <div class="vrev-progress-bar">
                        <div id="vrev-progress-fill" class="vrev-progress-fill"></div>
                    </div>
                    <p id="vrev-detail-text" style="margin-top:10px; font-weight:700; font-size:0.9rem;"></p>
                </div>
            </div>

            <!-- CỘT PHẢI: Cài Đặt -->
            <div class="vrev-col" id="vrev-settings" style="display: none;">
                
                <div class="vrev-alert-box">
                    ⚠️ <b>LƯU Ý QUAN TRỌNG:</b> <br>
                    Quá trình đảo ngược đòi hỏi máy tính phải ghi nhớ toàn bộ video vào RAM. Để tránh làm đứng trình duyệt, <b>hãy ưu tiên video ngắn dưới 30 giây!</b>
                </div>

                <div class="vrev-group">
                    <label class="vrev-label">🎵 Xử lý Âm Thanh:</label>
                    <div class="neo-select-wrapper">
                        <select id="vrev-audio-select" class="neo-select">
                            <option value="mute" selected>🔇 Xóa âm thanh (Khuyên dùng - File xuất ra siêu nhẹ)</option>
                            <option value="reverse">🔄 Đảo ngược cả âm thanh (Nghe như tiếng người ngoài hành tinh)</option>
                        </select>
                    </div>
                    <p class="vrev-hint-text">💡 <b>Mẹo:</b> Hầu hết video tua ngược đều được ghép nhạc xuôi ở ngoài để tăng độ "ảo", nên xóa âm thanh gốc là lựa chọn tốt nhất.</p>
                </div>

                <button id="vrev-btn-start" class="vrev-btn-primary">
                    🚀 Bắt Đầu Đảo Ngược
                </button>
            </div>

        </div> 
        
    </div>
</div>
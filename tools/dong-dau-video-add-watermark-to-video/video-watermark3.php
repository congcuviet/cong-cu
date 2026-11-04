<div class="vwm-soft-wrapper">
    <div class="vwm-soft-header">
        <h2>©️ Đóng Dấu Video (Watermark Pro)</h2>
        <p>Chèn Logo (PNG/JPG/SVG) hoặc Văn bản. Tùy chỉnh 9 vị trí, độ mờ, khoảng cách và xem trước trực tiếp.</p>
    </div>

    <!-- NẠP THƯ VIỆN FFMPEG -->
    <script src="/wp-content/themes/bricks-child/tai-nguyen/ffmpeg.min.js"></script>

    <div class="vwm-body">
        
        <!-- BỐ CỤC 2 CỘT RESPONSIVE -->
        <div class="vwm-main-layout">
            
            <!-- CỘT TRÁI: Upload, Cài đặt Nguồn & Preview -->
            <div class="vwm-col">
                <div class="vwm-group">
                    <div class="vwm-upload-box" id="vwm-box-video" onclick="document.getElementById('vwm-video-input').click()">
                        <input type="file" id="vwm-video-input" hidden accept="video/*">
                        <span class="vwm-icon" id="vwm-icon-video">🎬</span>
                        <span id="vwm-video-name" class="vwm-filename">1. Nhấp tải Video cần đóng dấu...</span>
                    </div>
                </div>

                <!-- CHỌN CHẾ ĐỘ ĐÓNG DẤU -->
                <div class="vwm-group vwm-mode-switch">
                    <label class="vwm-label">📌 Loại Đóng Dấu:</label>
                    <div class="vwm-radio-group">
                        <label class="vwm-radio-label">
                            <input type="radio" name="vwm_mode" value="image" checked> 🖼️ Chèn Ảnh Logo
                        </label>
                        <label class="vwm-radio-label">
                            <input type="radio" name="vwm_mode" value="text"> ✍️ Chèn Chữ (Text)
                        </label>
                    </div>
                </div>

                <!-- KHU VỰC CHÈN ẢNH -->
                <div id="vwm-area-image">
                    <div class="vwm-group">
                        <div class="vwm-upload-box" id="vwm-box-image" onclick="document.getElementById('vwm-image-input').click()" style="background: #e9ecef; border-color: #888; padding: 20px;">
                            <input type="file" id="vwm-image-input" hidden accept="image/png, image/jpeg, image/svg+xml">
                            <span class="vwm-icon" id="vwm-icon-image">🖼️</span>
                            <span id="vwm-image-name" class="vwm-filename">2. Nhấp tải Ảnh Logo (PNG, JPG, SVG)</span>
                        </div>
                        <p class="vwm-hint-text">💡 <b>Khuyên dùng:</b> Hãy sử dụng ảnh <b>PNG đã xóa nền (trong suốt)</b> và cắt sát viền logo để đạt hiệu ứng hiển thị đẹp nhất!</p>
                    </div>
                </div>

                <!-- KHU VỰC CHÈN CHỮ -->
                <div id="vwm-area-text" style="display: none;">
                    <div class="vwm-group" style="background: #e9ecef; padding: 15px; border-radius: 12px; border: 2px dashed #888;">
                        <label class="vwm-control-label">Nhập nội dung Text:</label>
                        <input type="text" id="vwm-text-input" class="vwm-text-field" placeholder="VD: @CongCuViet.com">
                        
                        <div class="vwm-flex-between" style="margin-top: 10px;">
                            <label class="vwm-control-label">Màu chữ:</label>
                            <input type="color" id="vwm-text-color" value="#ffffff" style="cursor: pointer; width: 50px; height: 35px; border: 2px solid #111; border-radius: 6px; padding: 0;">
                        </div>
                    </div>
                </div>

                <!-- KHU VỰC PREVIEW CANVAS (XEM TRƯỚC SIÊU MƯỢT) -->
                <div id="vwm-preview-section" style="display: none; margin-top: 20px;">
                    <label class="vwm-label">👀 Xem Trước Vị Trí (Trực Tiếp):</label>
                    <div style="position: relative; width: 100%; border-radius: 12px; border: 2px solid #111; overflow: hidden; background: #000; box-shadow: inset 2px 2px 5px rgba(0,0,0,0.5);">
                        <!-- Canvas siêu mượt thay cho Video -->
                        <canvas id="vwm-preview-canvas" style="width: 100%; display: block;"></canvas>
                    </div>
                    <p class="vwm-hint-text" style="margin-top: 10px; background: var(--clr-aqua);">💡 Hình ảnh trên được mô phỏng chính xác 100% vị trí, độ lớn và độ mờ của Watermark khi xuất ra video thực tế.</p>
                </div>

                <!-- Progress Box -->
                <div id="vwm-status-box" class="vwm-status-box" style="display: none;">
                    <h4 id="vwm-status-text">Đang khởi động lõi Render...</h4>
                    <div class="vwm-progress-bar">
                        <div id="vwm-progress-fill" class="vwm-progress-fill"></div>
                    </div>
                    <p id="vwm-detail-text" style="margin-top:10px; font-weight:700; font-size:0.9rem;"></p>
                </div>
            </div>

            <!-- CỘT PHẢI: Cài Đặt Sliders & Ma Trận & Xuất -->
            <div class="vwm-col" id="vwm-settings" style="display: none;">
                
                <div class="vwm-group">
                    <label class="vwm-label">📍 Ma trận Vị trí (9 Lựa chọn):</label>
                    <div class="neo-select-wrapper">
                        <select id="vwm-position-select" class="neo-select">
                            <option value="tl">↖️ Góc Trên - Trái</option>
                            <option value="tc">⬆️ Cạnh Trên - Giữa</option>
                            <option value="tr">↗️ Góc Trên - Phải</option>
                            <option value="cl">⬅️ Cạnh Trái - Giữa</option>
                            <option value="c">⏺️ Chính Giữa Trung Tâm</option>
                            <option value="cr">➡️ Cạnh Phải - Giữa</option>
                            <option value="bl">↙️ Góc Dưới - Trái</option>
                            <option value="bc">⬇️ Cạnh Dưới - Giữa</option>
                            <option value="br" selected>↘️ Góc Dưới - Phải (Khuyên dùng)</option>
                        </select>
                    </div>
                </div>

                <div class="vwm-adjust-box">
                    
                    <div class="vwm-control-row">
                        <div class="vwm-flex-between">
                            <label class="vwm-control-label">Độ lớn Logo/Text (% Video):</label>
                            <span class="vwm-val-text"><span id="vwm-size-text">15</span>%</span>
                        </div>
                        <input type="range" id="vwm-size-slider" class="vwm-slider" min="5" max="80" step="1" value="15">
                    </div>

                    <div class="vwm-control-row">
                        <div class="vwm-flex-between">
                            <label class="vwm-control-label">Độ mờ (Opacity):</label>
                            <span class="vwm-val-text"><span id="vwm-opacity-text">100</span>%</span>
                        </div>
                        <input type="range" id="vwm-opacity-slider" class="vwm-slider vwm-slider-alt" min="10" max="100" step="5" value="100">
                    </div>

                    <div class="vwm-control-row">
                        <div class="vwm-flex-between">
                            <label class="vwm-control-label">Căn lề Ngang (Margin X):</label>
                            <span class="vwm-val-text"><span id="vwm-mx-text">20</span> px</span>
                        </div>
                        <input type="range" id="vwm-mx-slider" class="vwm-slider vwm-slider-alt" min="0" max="200" step="5" value="20">
                    </div>

                    <div class="vwm-control-row">
                        <div class="vwm-flex-between">
                            <label class="vwm-control-label">Căn lề Dọc (Margin Y):</label>
                            <span class="vwm-val-text"><span id="vwm-my-text">20</span> px</span>
                        </div>
                        <input type="range" id="vwm-my-slider" class="vwm-slider vwm-slider-alt" min="0" max="200" step="5" value="20">
                    </div>

                </div>

                <div class="vwm-group" style="margin-top: 15px;">
                    <label class="vwm-label">⚙️ Chất lượng xuất Video:</label>
                    <div class="neo-select-wrapper">
                        <select id="vwm-quality-select" class="neo-select">
                            <option value="fast" selected>⚡ Render Nhanh (Chất lượng khá, tối ưu MXH)</option>
                            <option value="high">✨ Sắc Nét (Giữ tối đa chất lượng gốc, file hơi nặng)</option>
                        </select>
                    </div>
                </div>

                <button id="vwm-btn-start" class="vwm-btn-primary">
                    🚀 Đóng Dấu & Tải Xuống
                </button>
            </div>

        </div> 
    </div>
</div>
<div class="http-neo-wrapper">
    <div class="http-header">
        <h2>🌐 Công Cụ Kiểm Tra Mã Trạng Thái HTTP</h2>
        <p>Phân tích phản hồi của máy chủ, phát hiện lỗi 404, kiểm tra chuyển hướng 301 và chẩn đoán sự cố website.</p>
    </div>

    <!-- KHU VỰC NHẬP LIỆU -->
    <div class="http-input-section">
        <div class="http-card bg-powder">
            <h3 class="card-title">🔗 Đường dẫn cần kiểm tra</h3>
            <div class="http-group">
                <label>Nhập URL Website</label>
                <div class="http-input-wrap">
                    <input type="url" id="inpUrl" class="http-input" placeholder="VD: https://vnexpress.net" autocomplete="off">
                </div>
                <small class="hint-text">*Nếu không nhập http:// hoặc https://, hệ thống sẽ tự động thêm https://</small>
            </div>
        </div>
    </div>

    <!-- NÚT BẤM & BÁO LỖI -->
    <button id="btnCheckHttp" class="http-btn-calc">
        <span id="btnText">KIỂM TRA TRẠNG THÁI 🚀</span>
        <span id="btnLoading" class="hidden">ĐANG KẾT NỐI MÁY CHỦ... ⏳</span>
    </button>
    <div id="httpError" class="http-error-box hidden"></div>

    <!-- KHU VỰC KẾT QUẢ -->
    <div id="httpResult" class="http-result-section hidden">
        
        <div class="res-grid-2">
            <!-- MÃ TRẠNG THÁI -->
            <div class="res-main-box" id="resBoxWrap">
                <div class="res-label">HTTP STATUS CODE</div>
                <div class="res-value">
                    <span id="resStatusCode">200</span>
                </div>
                <div class="res-status-text" id="resStatusText">OK</div>
                <p class="res-desc" id="resStatusDesc">Mô tả chi tiết trạng thái</p>
            </div>

            <!-- THÔNG SỐ VẬN HÀNH -->
            <div class="res-metrics-box bg-eggshell">
                <div class="res-label text-dark">Thông số phản hồi</div>
                
                <div class="metric-row">
                    <span class="metric-label">Thời gian phản hồi (Ping):</span>
                    <b class="metric-value text-teal"><span id="resPing">0</span> ms</b>
                </div>
                
                <div class="metric-row" style="margin-top: 15px; padding-top: 15px; border-top: 2px dashed #ccc;">
                    <span class="metric-label">URL đích được quét:</span>
                    <div class="metric-url" id="resTargetUrl">https://...</div>
                </div>
            </div>
        </div>
        
    </div>
</div>
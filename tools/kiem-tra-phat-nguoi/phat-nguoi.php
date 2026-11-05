<!-- Gọi CSS từ thư mục cong-cu -->
<link rel="stylesheet" href="/wp-content/themes/bricks-child/cong-cu/phat-nguoi.css?v=1793884346">

<div class="pn-container">
    <h2 class="pn-title">Tra Cứu Phạt Nguội 🚦</h2>
    <p class="pn-desc">Dữ liệu được trích xuất trực tiếp, an toàn và bảo mật.</p>

    <!-- Khu vực nhập liệu -->
    <div class="pn-card pn-bg-yellow" id="pnSearchCard">
        <form id="pnForm">
            <div class="pn-group">
                <label class="pn-label">1. Loại phương tiện</label>
                <div class="pn-radio-group">
                    <label class="pn-radio-label">
                        <input type="radio" name="vehicle_type" value="car" checked>
                        <span>🚗 Ô tô</span>
                    </label>
                    <label class="pn-radio-label">
                        <input type="radio" name="vehicle_type" value="moto">
                        <span>🏍️ Xe máy</span>
                    </label>
                </div>
            </div>

            <div class="pn-group">
                <label class="pn-label">2. Biển số xe</label>
                <div class="pn-input-wrap">
                    <input type="text" id="pnPlate" class="pn-input" placeholder="VD: 30A-123.45 (Nhập liền hoặc có gạch)" required autocomplete="off">
                    <button type="submit" class="pn-btn-primary" id="pnBtnSubmit">Tra Cứu</button>
                </div>
            </div>
            <div id="pnError" class="pn-error"></div>
        </form>
    </div>

    <!-- Khu vực Loading -->
    <div id="pnLoading" class="pn-loading" style="display: none;">
        <div class="pn-spinner"></div>
        <p>Đang kết nối cơ sở dữ liệu. Vui lòng đợi...</p>
    </div>

    <!-- Khu vực Trả kết quả -->
    <div id="pnResultArea" class="pn-result-area" style="display: none;">
        <div class="pn-result-header">
            <h3>Kết quả tra cứu: <span id="resPlate" class="pn-highlight"></span></h3>
            <small id="resUpdate"></small>
        </div>

        <div class="pn-stat-grid">
            <div class="pn-stat-box pn-bg-blue">
                <div class="pn-stat-label">Tổng số lỗi</div>
                <div class="pn-stat-val" id="statTotal">0</div>
            </div>
            <div class="pn-stat-box pn-bg-red">
                <div class="pn-stat-label">Chưa xử phạt</div>
                <div class="pn-stat-val" id="statUnpaid">0</div>
            </div>
            <div class="pn-stat-box pn-bg-green">
                <div class="pn-stat-label">Đã xử phạt</div>
                <div class="pn-stat-val" id="statPaid">0</div>
            </div>
        </div>

        <!-- Khối Không có lỗi -->
        <div id="pnClean" class="pn-card pn-clean" style="display: none;">
            <div class="pn-icon-large">✅</div>
            <h2>Tuyệt vời! Không có lỗi vi phạm.</h2>
            <p>Biển số xe của bạn hiện không ghi nhận lỗi vi phạm giao thông nào.</p>
        </div>

        <!-- Khối Danh sách lỗi -->
        <div id="pnViolations" class="pn-violations-list" style="display: none;">
            <!-- Render bằng Javascript -->
        </div>

        <button type="button" class="pn-btn-secondary" id="pnBtnReset">Tra Cứu Biển Khác</button>
    </div>
</div>

<!-- Gọi JS từ thư mục cong-cu -->
<script src="/wp-content/themes/bricks-child/cong-cu/phat-nguoi.js?v=1793884346"></script>
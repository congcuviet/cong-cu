<div class="color-neo-wrapper">
    <div class="color-header">
        <h2>🎨Màu Sắc Các Chất Hóa Học Bản Đầy Đủ</h2>
        <p>Tra cứu màu sắc tinh thể, dung dịch, kết tủa và ngọn lửa của các chất.</p>
    </div>

    <!-- PHẦN 1: TRA CỨU ĐỘNG -->
    <div class="color-search-section">
        <h3 class="section-title">🔍 Tra cứu nhanh</h3>
        <div class="color-search-box">
            <input type="text" id="colorSearchInput" class="color-neo-input" placeholder="Nhập tên chất, công thức (VD: KMnO4) hoặc màu sắc (VD: đỏ)..." autocomplete="off">
            <button type="button" id="btnColorClear" class="color-btn-clear">🧹 XÓA</button>
        </div>

        <div class="color-filters" id="colorFilters">
            <button class="filter-badge active" data-filter="all">Tất cả</button>
            <button class="filter-badge" data-filter="kimloai">Nguyên tố</button>
            <button class="filter-badge" data-filter="muoi">Muối & Oxit</button>
            <button class="filter-badge" data-filter="ion">Ion dung dịch</button>
            <button class="filter-badge" data-filter="ngonlua">Ngọn lửa</button>
            <button class="filter-badge" data-filter="nhandang">Nhận dạng</button>
            <button class="filter-badge" data-filter="nangcao">Dữ liệu mở rộng 🚀</button>
        </div>

        <div id="colorGrid" class="color-grid hidden">
            <!-- JS render kết quả tìm kiếm -->
        </div>

        <div id="colorEmpty" class="color-empty hidden">
            <p>❌ Không tìm thấy chất nào khớp với từ khóa của bạn.</p>
        </div>
    </div>

    <hr class="neo-divider">

    <!-- PHẦN 2: BẢNG DỮ LIỆU TĨNH CHUẨN CỨNG -->
    <div class="color-static-section">
        <h3 class="section-title">📚 Danh mục màu sắc các chất hóa học</h3>
        <p style="margin-bottom: 20px; font-weight: 700; color: #555;">Dưới đây là bảng tổng hợp chuẩn màu sắc các chất thường gặp trong chương trình Hóa học.</p>
        
        <div id="staticDataArea" class="static-data-area">
            <!-- JS sẽ render toàn bộ 107 chất chia theo nhóm vào đây -->
        </div>
    </div>
</div>

<div class="cd2-wrapper">
    <form id="cd2-form" class="cd2-card cd2-form">
        <div class="cd2-group">
            <label class="cd2-label" for="cd2-label">Tên đồng hồ (tùy chọn)</label>
            <input type="text" id="cd2-label" class="cd2-input" placeholder="VD: Nấu ăn, Thuyết trình, Nghỉ giải lao...">
        </div>

        <div class="cd2-group">
            <span class="cd2-label">Thời lượng có sẵn</span>
            <div class="cd2-chips">
                <button type="button" class="cd2-chip" data-cd2-preset="60">1 phút</button>
                <button type="button" class="cd2-chip" data-cd2-preset="300">5 phút</button>
                <button type="button" class="cd2-chip" data-cd2-preset="600">10 phút</button>
                <button type="button" class="cd2-chip" data-cd2-preset="1500">25 phút</button>
                <button type="button" class="cd2-chip" data-cd2-preset="1800">30 phút</button>
                <button type="button" class="cd2-chip" data-cd2-preset="3600">60 phút</button>
            </div>
        </div>

        <div class="cd2-time-grid">
            <div class="cd2-group">
                <label class="cd2-label" for="cd2-hours">Giờ</label>
                <input type="number" id="cd2-hours" class="cd2-input cd2-num" min="0" max="99" step="1" value="0">
            </div>
            <div class="cd2-group">
                <label class="cd2-label" for="cd2-minutes">Phút</label>
                <input type="number" id="cd2-minutes" class="cd2-input cd2-num" min="0" max="59" step="1" value="5">
            </div>
            <div class="cd2-group">
                <label class="cd2-label" for="cd2-seconds">Giây</label>
                <input type="number" id="cd2-seconds" class="cd2-input cd2-num" min="0" max="59" step="1" value="0">
            </div>
        </div>
        <p class="cd2-summary" id="cd2-summary">Tổng thời lượng: 5 phút</p>
        <p class="cd2-error" id="cd2-error" hidden></p>

        <button type="submit" class="cd2-btn-primary">Bắt đầu đếm ngược</button>
        <p class="cd2-note">Khi hết giờ, công cụ gửi thông báo trình duyệt (nếu bạn đã cho phép) và phát tiếng bíp. Đồng hồ đang chạy hoặc tạm dừng được lưu lại trên trình duyệt này, tải lại trang vẫn còn.</p>
    </form>

    <div id="cd2-list" class="cd2-list">
        <p class="cd2-empty" id="cd2-empty">Chưa có đồng hồ nào. Nhập thời lượng rồi bấm “Bắt đầu đếm ngược”.</p>
    </div>
</div>
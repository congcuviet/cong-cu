<div class="tm2-wrapper">
    <div class="tm2-notify" id="tm2-notify" hidden>
        <span>🔔 Bật thông báo để trình duyệt nhắc bạn khi hết giờ.</span>
        <button type="button" class="tm2-btn-small" id="tm2-notify-btn">Bật ngay</button>
    </div>

    <div class="tm2-tabs" role="tablist">
        <button type="button" class="tm2-tab tm2-tab-active" id="tm2-tab-countdown" role="tab">⏳ Đếm ngược</button>
        <button type="button" class="tm2-tab" id="tm2-tab-stopwatch" role="tab">⏱️ Bấm giờ</button>
    </div>

    <div class="tm2-card" id="tm2-setup">
        <span class="tm2-label">Thời lượng có sẵn</span>
        <div class="tm2-chips">
            <button type="button" class="tm2-chip" data-tm2-preset="60">1 phút</button>
            <button type="button" class="tm2-chip" data-tm2-preset="300">5 phút</button>
            <button type="button" class="tm2-chip" data-tm2-preset="600">10 phút</button>
            <button type="button" class="tm2-chip" data-tm2-preset="1500">25 phút</button>
            <button type="button" class="tm2-chip" data-tm2-preset="1800">30 phút</button>
            <button type="button" class="tm2-chip" data-tm2-preset="3600">60 phút</button>
        </div>
        <div class="tm2-time-grid">
            <div class="tm2-group">
                <label class="tm2-label" for="tm2-h">Giờ</label>
                <input type="number" id="tm2-h" class="tm2-input tm2-num" min="0" max="99" step="1" value="0">
            </div>
            <div class="tm2-group">
                <label class="tm2-label" for="tm2-m">Phút</label>
                <input type="number" id="tm2-m" class="tm2-input tm2-num" min="0" max="59" step="1" value="5">
            </div>
            <div class="tm2-group">
                <label class="tm2-label" for="tm2-s">Giây</label>
                <input type="number" id="tm2-s" class="tm2-input tm2-num" min="0" max="59" step="1" value="0">
            </div>
        </div>
        <p class="tm2-summary" id="tm2-summary">Tổng thời lượng: 5 phút</p>
    </div>

    <div class="tm2-display" id="tm2-display">
        <div class="tm2-status-row">
            <span class="tm2-status" id="tm2-status">Sẵn sàng</span>
            <span class="tm2-end" id="tm2-end" hidden></span>
        </div>
        <p class="tm2-time"><span id="tm2-time">00:05:00</span><span id="tm2-cs" class="tm2-cs" hidden>.00</span></p>
        <div class="tm2-progress" id="tm2-progress"><div class="tm2-progress-fill" id="tm2-progress-fill"></div></div>
        <p class="tm2-error" id="tm2-error" hidden></p>
        <div class="tm2-controls">
            <button type="button" class="tm2-btn tm2-btn-green" id="tm2-start">Bắt đầu</button>
            <button type="button" class="tm2-btn tm2-btn-yellow" id="tm2-pause" hidden>Tạm dừng</button>
            <button type="button" class="tm2-btn tm2-btn-blue" id="tm2-lap" hidden>Ghi vòng</button>
            <button type="button" class="tm2-btn" id="tm2-plus" hidden>+1 phút</button>
            <button type="button" class="tm2-btn tm2-btn-red" id="tm2-reset">Đặt lại</button>
        </div>
    </div>

    <div class="tm2-card" id="tm2-lap-card" hidden>
        <div class="tm2-lap-head">
            <h3 class="tm2-lap-title">Lịch sử ghi vòng</h3>
            <button type="button" class="tm2-btn-small" id="tm2-copy-laps">Sao chép các vòng</button>
        </div>
        <p class="tm2-note" id="tm2-lap-note">Mỗi vòng ghi cả khoảng vòng và tổng thời gian; vòng nhanh nhất và chậm nhất được tô màu khi có từ 2 vòng.</p>
        <ul class="tm2-lap-list" id="tm2-lap-list"></ul>
        <p class="tm2-note" id="tm2-copy-msg" hidden>Đã sao chép các vòng.</p>
    </div>

    <p class="tm2-note">Phím tắt: <strong>Space</strong> bắt đầu/tạm dừng, <strong>L</strong> ghi vòng, <strong>R</strong> đặt lại. Đếm ngược tính theo mốc kết thúc nên không trôi giờ khi tab chạy nền; khi khóa màn hình, trình duyệt vẫn có thể tạm dừng trang.</p>
</div>

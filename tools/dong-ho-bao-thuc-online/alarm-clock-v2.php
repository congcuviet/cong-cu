<div class="al2-wrapper" id="al2-wrapper">
    <div class="al2-notify" id="al2-notify" hidden>
        <span>🔔 Bật thông báo để trình duyệt nhắc bạn khi chuông reo, kể cả khi đang ở tab khác.</span>
        <button type="button" class="al2-btn-small" id="al2-notify-btn">Bật ngay</button>
    </div>

    <div class="al2-card al2-clock-card">
        <div class="al2-date" id="al2-date">—</div>
        <div class="al2-clock" id="al2-clock">00:00:00</div>
        <p class="al2-next" id="al2-next" hidden></p>
    </div>

    <div class="al2-card" id="al2-form">
        <div class="al2-grid2">
            <div>
                <label class="al2-label" for="al2-time">Giờ báo thức</label>
                <input type="time" id="al2-time" class="al2-input" required>
            </div>
            <div>
                <label class="al2-label" for="al2-sound">Loại chuông</label>
                <select id="al2-sound" class="al2-input">
                    <option value="builtin">Tiếng bíp tích hợp (không cần mạng)</option>
                    <option value="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg">Chuông reo cơ bản</option>
                    <option value="https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg">Chuông điện tử</option>
                    <option value="https://actions.google.com/sounds/v1/alarms/phone_ringing.ogg">Tiếng điện thoại reo</option>
                    <option value="https://actions.google.com/sounds/v1/emergency/ambulance_siren.ogg">Còi cứu thương (Rất to)</option>
                </select>
            </div>
        </div>
        <div>
            <label class="al2-label" for="al2-label">Nhãn báo thức (không bắt buộc)</label>
            <input type="text" id="al2-label" class="al2-input" maxlength="40" placeholder="Ví dụ: Dậy đi làm, Uống thuốc">
        </div>
        <span class="al2-label">Lặp lại</span>
        <div class="al2-seg" role="group" aria-label="Lịch lặp lại">
            <button type="button" class="al2-seg-btn al2-seg-active" data-al2-repeat="once">Một lần</button>
            <button type="button" class="al2-seg-btn" data-al2-repeat="daily">Hằng ngày</button>
            <button type="button" class="al2-seg-btn" data-al2-repeat="weekdays">Ngày làm việc</button>
        </div>
        <p class="al2-error" id="al2-error" hidden></p>
        <div class="al2-actions">
            <button type="button" class="al2-btn al2-btn-add" id="al2-add">✅ Thêm báo thức</button>
            <button type="button" class="al2-btn" id="al2-preview">🔊 Thử chuông</button>
        </div>
        <p class="al2-audio-note" id="al2-audio-note" hidden></p>
    </div>

    <div class="al2-card al2-ringing" id="al2-ringing" hidden>
        <p class="al2-ring-title">🔔 ĐÃ ĐẾN GIỜ BÁO THỨC!</p>
        <p class="al2-ring-time" id="al2-ring-time">--:--</p>
        <p class="al2-ring-label" id="al2-ring-label"></p>
        <div class="al2-actions">
            <button type="button" class="al2-btn al2-btn-stop" id="al2-stop">🛑 Tắt chuông</button>
            <button type="button" class="al2-btn" id="al2-snooze">😴 Báo lại sau 5 phút</button>
        </div>
    </div>

    <div class="al2-card">
        <h3 class="al2-list-title">Danh sách báo thức</h3>
        <p class="al2-empty" id="al2-empty">Chưa có báo thức nào. Thêm báo thức đầu tiên ở form bên trên.</p>
        <ul class="al2-list" id="al2-list"></ul>
    </div>

    <div class="al2-card al2-note-card">
        <p class="al2-note">⚠️ <strong>Để chuông kêu:</strong> giữ tab này luôn mở (có thể chuyển sang tab khác nhưng không đóng tab), mở âm lượng loa/tai nghe, và tránh để máy vào chế độ ngủ. Báo thức trên web không thay báo thức hệ thống cho việc không được phép bỏ lỡ.</p>
        <details class="al2-details">
            <summary>Chuông reo như thế nào?</summary>
            <p class="al2-note">Mỗi báo thức được hẹn theo mốc giờ tuyệt đối, không phải đếm số lần màn hình cập nhật, nên nếu tab bị trình duyệt làm chậm nhịp, chuông sẽ reo ngay khi tab chạy lại thay vì bị bỏ qua. Báo thức “Một lần” sau khi tắt sẽ tự tắt và nằm lại trong danh sách để bạn bật lại khi cần; báo thức lặp lại tự hẹn sang lần kế tiếp. Tiếng bíp tích hợp luôn có sẵn kể cả khi file chuông ngoài không tải được.</p>
        </details>
    </div>
</div>

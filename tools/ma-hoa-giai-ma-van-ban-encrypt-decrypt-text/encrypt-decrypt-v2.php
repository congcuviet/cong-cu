<div class="ed2-soft-wrapper">
    <div class="ed2-mode-selector" role="group" aria-label="Chế độ">
        <button type="button" class="ed2-mode-btn ed2-mode-active" data-ed2-mode="encrypt">🔒 Mã hóa</button>
        <button type="button" class="ed2-mode-btn" data-ed2-mode="decrypt">🔓 Giải mã</button>
    </div>

    <div class="ed2-main-layout">
        <div class="ed2-col">
            <div class="ed2-card" id="ed2-card-input">
                <h3 class="ed2-card-title">📥 Đầu vào</h3>
                <div class="ed2-group">
                    <label class="ed2-label" id="ed2-lbl-input" for="ed2-input-text">Văn bản cần mã hóa:</label>
                    <textarea id="ed2-input-text" class="ed2-textarea" placeholder="Nhập văn bản cần giấu…"></textarea>
                </div>
                <div class="ed2-group">
                    <label class="ed2-label" for="ed2-input-key">Mật khẩu:</label>
                    <div class="ed2-input-row">
                        <input type="password" id="ed2-input-key" class="ed2-input" placeholder="Nhập mật khẩu…" autocomplete="off">
                        <button type="button" class="ed2-btn-icon" id="ed2-btn-toggle-key" title="Hiện/ẩn mật khẩu">👁️</button>
                        <button type="button" class="ed2-btn-icon" id="ed2-btn-gen-key" title="Tạo mật khẩu mạnh">🎲</button>
                    </div>
                    <p class="ed2-hint" id="ed2-key-strength">Mật khẩu càng dài và càng nhiều loại ký tự càng khó đoán.</p>
                </div>
                <button type="button" id="ed2-btn-action" class="ed2-btn-main">🚀 Mã hóa</button>
                <p class="ed2-error-msg" id="ed2-error-msg" hidden></p>
                <p class="ed2-warn-msg" id="ed2-legacy-warn" hidden>⚠️ Đây là bản mã cũ (AES-CBC, không có xác thực): không phát hiện được dữ liệu bị sửa. Hãy mã hóa lại bằng chế độ mới để có bản mã CCV1 an toàn hơn.</p>
            </div>
        </div>

        <div class="ed2-swap-zone">
            <button type="button" id="ed2-btn-swap" class="ed2-btn-swap" title="Đưa kết quả sang ô đầu vào và đổi chiều">⇌</button>
        </div>

        <div class="ed2-col">
            <div class="ed2-card">
                <h3 class="ed2-card-title">🚀 Kết quả</h3>
                <div class="ed2-group ed2-group-grow">
                    <label class="ed2-label" id="ed2-lbl-output" for="ed2-output-text">Chuỗi đã mã hóa (CCV1):</label>
                    <textarea id="ed2-output-text" class="ed2-textarea ed2-textarea-output" readonly placeholder="Kết quả sẽ hiển thị ở đây…"></textarea>
                </div>
                <p class="ed2-meta" id="ed2-meta" hidden></p>
                <div class="ed2-btn-row">
                    <button type="button" class="ed2-btn-copy" id="ed2-btn-copy">📋 Sao chép</button>
                    <button type="button" class="ed2-btn-copy" id="ed2-btn-download">⬇️ Tải .txt</button>
                    <button type="button" class="ed2-btn-copy" id="ed2-btn-clear">🗑️ Xóa</button>
                </div>
            </div>
            <div class="ed2-info-box">
                <h4>💡 Lưu ý:</h4>
                <p>Mã hóa đối xứng: dùng <b>cùng một mật khẩu</b> để mã hóa và giải mã. Mọi xử lý diễn ra 100% trên trình duyệt, không gửi văn bản hay mật khẩu lên máy chủ. Quên mật khẩu là không khôi phục được.</p>
            </div>
        </div>
    </div>

    <details class="ed2-details">
        <summary>Định dạng bản mã &amp; giới hạn</summary>
        <p><b>Bản mã mới (CCV1):</b> AES-256-GCM, khóa suy từ mật khẩu bằng PBKDF2-SHA-256 (100.000 vòng, salt 16 byte), IV 12 byte. Định dạng <code>CCV1.</code> + Base64(salt | IV | bản mã + thẻ xác thực). Sai mật khẩu hoặc dữ liệu bị sửa đều bị phát hiện, nhưng hai trường hợp này không phân biệt được.</p>
        <p><b>Bản mã cũ (U2FsdGVkX1…):</b> vẫn giải mã được để tương thích với bản cũ (AES-256-CBC, khóa suy bằng EVP_BytesToKey 1 vòng MD5). Định dạng này không có xác thực nên không phát hiện được dữ liệu bị sửa.</p>
        <p>Khi mã hóa, khoảng trắng hai đầu văn bản được giữ nguyên. Khi giải mã, khoảng trắng bao quanh chuỗi Base64 được bỏ qua.</p>
        <p>Nút ⇌ chỉ đưa kết quả sang ô đầu vào và đổi chiều, không tự chạy chiều ngược — hãy bấm nút thực thi sau khi đổi.</p>
    </details>
</div>

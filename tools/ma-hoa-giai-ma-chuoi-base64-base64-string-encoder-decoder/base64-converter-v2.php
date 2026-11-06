<div class="bc2-soft-wrapper">
    <div class="bc2-body">
        <div class="bc2-mode-selector" role="group" aria-label="Chế độ chuyển đổi">
            <button type="button" class="bc2-mode-btn bc2-mode-encode is-active" id="bc2-mode-encode" aria-pressed="true"><span class="bc2-mode-icon">🔏</span><span class="bc2-mode-text">Mã hóa (Encode)</span></button>
            <button type="button" class="bc2-mode-btn bc2-mode-decode" id="bc2-mode-decode" aria-pressed="false"><span class="bc2-mode-icon">🔓</span><span class="bc2-mode-text">Giải mã (Decode)</span></button>
        </div>

        <div class="bc2-chips" id="bc2-chips" aria-label="Ví dụ nhanh"></div>

        <div class="bc2-main-layout">
            <div class="bc2-col">
                <div class="bc2-card" id="bc2-card-input">
                    <div class="bc2-flex-between">
                        <h3 class="bc2-card-title">📥 Đầu vào (Input)</h3>
                        <button type="button" id="bc2-btn-clear" class="bc2-btn-small">🧹 Xóa</button>
                    </div>
                    <div class="bc2-group">
                        <label class="bc2-label" id="bc2-lbl-input" for="bc2-input-text">Văn bản thuần (Plain Text):</label>
                        <textarea id="bc2-input-text" class="bc2-textarea" placeholder="Nhập văn bản cần mã hóa..." rows="6"></textarea>
                    </div>
                </div>
            </div>

            <div class="bc2-swap-zone">
                <button type="button" id="bc2-btn-swap" class="bc2-btn-swap" title="Hoán đổi Input và Output" aria-label="Hoán đổi đầu vào và kết quả">⇌</button>
            </div>

            <div class="bc2-col">
                <div class="bc2-card bc2-card-output">
                    <div class="bc2-flex-between bc2-result-head">
                        <h3 class="bc2-card-title">🚀 Kết quả (Output)</h3>
                        <span class="bc2-badge" id="bc2-status-badge">Chờ nhập liệu...</span>
                    </div>
                    <div class="bc2-group">
                        <label class="bc2-label" id="bc2-lbl-output" for="bc2-output-text">Chuỗi Base64:</label>
                        <textarea id="bc2-output-text" class="bc2-textarea bc2-textarea-output" readonly placeholder="Kết quả sẽ tự động hiển thị ở đây..." rows="6"></textarea>
                    </div>
                    <p class="bc2-error" id="bc2-error" hidden></p>
                    <p class="bc2-note-line" id="bc2-note" hidden></p>
                    <p class="bc2-stats" id="bc2-stats" aria-live="polite"></p>
                    <div class="bc2-actions">
                        <button type="button" class="bc2-btn-main" id="bc2-btn-copy">📋 Sao chép kết quả</button>
                        <button type="button" class="bc2-btn-secondary" id="bc2-btn-download">⬇ Tải .txt</button>
                    </div>
                </div>

                <div class="bc2-info-box">
                    <h4>💡 Sức mạnh của tool này:</h4>
                    <p>Trình duyệt thường báo lỗi khi mã hóa tiếng Việt (Unicode). Tool này dùng TextEncoder/TextDecoder chuẩn UTF-8, xử lý mượt mà mọi ký tự đặc biệt, dấu câu và emoji — đồng thời đọc được cả chuỗi Base64URL (dấu - _) và chuỗi thiếu dấu đệm.</p>
                </div>
            </div>
        </div>

        <details class="bc2-details">
            <summary class="bc2-details-summary">Tùy chọn Base64</summary>
            <div class="bc2-details-body">
                <div class="bc2-group">
                    <span class="bc2-label" id="bc2-lbl-variant">Bảng chữ cái:</span>
                    <div class="bc2-seg" role="group" aria-labelledby="bc2-lbl-variant">
                        <button type="button" class="bc2-seg-btn is-active" id="bc2-variant-std" aria-pressed="true">Chuẩn (+ /)</button>
                        <button type="button" class="bc2-seg-btn" id="bc2-variant-url" aria-pressed="false">URL-safe (- _)</button>
                    </div>
                </div>
                <label class="bc2-check"><input type="checkbox" id="bc2-nopad"> <span>Không thêm dấu = ở cuối (dạng rút gọn, thường dùng cho JWT)</span></label>
            </div>
        </details>

        <details class="bc2-details">
            <summary class="bc2-details-summary">Cách tính độ dài và quy tắc xử lý</summary>
            <div class="bc2-details-body">
                <p class="bc2-details-text">Ba byte tạo bốn ký hiệu Base64; với Base64 chuẩn có đệm, độ dài đầu ra là 4 × ceil(n / 3), trong đó n là số byte UTF-8 — không phải số ký tự nhìn thấy. Khi giải mã, công cụ bỏ mọi khoảng trắng trong chuỗi, tự tách tiền tố <code>data:...;base64,</code> nếu có, tự chuyển bảng Base64URL về bảng chuẩn và tự bù dấu đệm còn thiếu.</p>
            </div>
        </details>

        <p class="bc2-toast" id="bc2-toast" role="status" aria-live="polite" hidden></p>
    </div>
</div>
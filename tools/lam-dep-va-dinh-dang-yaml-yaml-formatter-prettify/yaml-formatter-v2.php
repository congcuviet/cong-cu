<div class="yf2-soft-wrapper">
    <script src="https://congcuviet.com/wp-content/themes/bricks-child/cong-cu/js-yaml.min.js"></script>

    <div class="yf2-toolbar">
        <div class="yf2-seg" role="group" aria-label="Chế độ">
            <button type="button" id="yf2-btn-prettify" class="yf2-seg-btn active">✨ Làm đẹp</button>
            <button type="button" id="yf2-btn-minify" class="yf2-seg-btn">🗜️ Nén</button>
        </div>
        <div class="yf2-seg" id="yf2-indent-group" role="group" aria-label="Mức thụt lề">
            <button type="button" id="yf2-indent-2" class="yf2-seg-btn active">2 khoảng trắng</button>
            <button type="button" id="yf2-indent-4" class="yf2-seg-btn">4 khoảng trắng</button>
        </div>
        <button type="button" id="yf2-btn-clear" class="yf2-btn-clear">🧹 Xóa trắng</button>
    </div>

    <div class="yf2-main-layout">
        <div class="yf2-col">
            <div class="yf2-card yf2-bg-yellow">
                <div class="yf2-flex-between">
                    <label class="yf2-section-title" for="yf2-input-left">📥 Dữ liệu đầu vào</label>
                    <span class="yf2-badge" id="yf2-badge-left">Chờ nhập liệu...</span>
                </div>
                <textarea id="yf2-input-left" class="yf2-textarea" placeholder="Dán mã YAML cần dọn dẹp vào đây..." spellcheck="false"></textarea>
                <div class="yf2-stats" id="yf2-stats-left" aria-live="polite"></div>
                <div class="yf2-chip-row">
                    <button type="button" class="yf2-chip" id="yf2-btn-sample-1">Ví dụ: Cấu hình app</button>
                    <button type="button" class="yf2-chip" id="yf2-btn-sample-2">Ví dụ: Docker Compose</button>
                    <label class="yf2-chip yf2-chip-file" for="yf2-file-input">📂 Tải tệp .yaml</label>
                    <input type="file" id="yf2-file-input" accept=".yaml,.yml,.txt,.json" aria-label="Tải tệp YAML">
                </div>
            </div>
        </div>

        <div class="yf2-col">
            <div class="yf2-card yf2-bg-green">
                <div class="yf2-flex-between">
                    <label class="yf2-section-title" for="yf2-input-right">🚀 Kết quả</label>
                    <button type="button" class="yf2-btn-copy" id="yf2-btn-copy">📋 Sao chép kết quả</button>
                </div>
                <textarea id="yf2-input-right" class="yf2-textarea yf2-textarea-output" readonly placeholder="Kết quả định dạng sẽ hiển thị ở đây..." spellcheck="false"></textarea>
                <div class="yf2-stats" id="yf2-stats-right" aria-live="polite"></div>
                <div class="yf2-note" id="yf2-note" hidden></div>
                <div class="yf2-error-box" id="yf2-error-box" hidden>
                    <strong>⚠️ Lỗi cú pháp YAML:</strong>
                    <div id="yf2-error-msg"></div>
                    <pre id="yf2-error-caret"></pre>
                </div>
                <div class="yf2-action-row">
                    <button type="button" class="yf2-btn-action" id="yf2-btn-download">⬇️ Tải xuống</button>
                </div>
            </div>
        </div>
    </div>

    <details class="yf2-details">
        <summary>Tùy chọn nâng cao</summary>
        <label class="yf2-check"><input type="checkbox" id="yf2-sort-keys"> Sắp xếp khóa theo thứ tự A–Z (mọi cấp, thứ tự danh sách không đổi)</label>
        <p class="yf2-hint">Chế độ Nén xuất JSON một dòng — hợp lệ theo YAML 1.2, tiện nhúng vào biến môi trường hoặc API. Tài liệu nhiều phần (phân tách bằng <code>---</code>) được xử lý đủ các phần.</p>
    </details>

    <div class="yf2-info-box">
        <h4>💡 Lưu ý:</h4>
        <p>Xử lý 100% bằng JavaScript ngay trên trình duyệt với thư viện js-yaml 4.1.0 tải cùng tên miền congcuviet.com, không qua CDN ngoài — dữ liệu của bạn không bị gửi đi đâu. Vì văn bản được phân tích thành dữ liệu rồi xuất lại, chú thích, dấu nháy và cách xuống dòng ban đầu không được giữ nguyên — hãy giữ bản gốc để đối chiếu.</p>
    </div>
    <div class="yf2-toast" id="yf2-toast" hidden></div>
</div>

<div class="he2-soft-wrapper">
    <div class="he2-mode-row" role="group" aria-label="Chế độ chuyển đổi">
        <button type="button" class="he2-mode-btn he2-active" id="he2-mode-encode" aria-pressed="true">🔒 Mã hóa (Escape)</button>
        <button type="button" class="he2-mode-btn" id="he2-mode-decode" aria-pressed="false">🔓 Giải mã (Unescape)</button>
    </div>

    <div class="he2-opts" id="he2-opts">
        <label class="he2-opt" for="he2-style">Kiểu entity
            <select id="he2-style" class="he2-select">
                <option value="named" selected>Tên (&amp;lt;)</option>
                <option value="decimal">Số thập phân (&amp;#60;)</option>
                <option value="hex">Số hex (&amp;#x3C;)</option>
            </select>
        </label>
        <label class="he2-opt" for="he2-scope">Phạm vi
            <select id="he2-scope" class="he2-select">
                <option value="eight" selected>8 ký tự</option>
                <option value="five">5 ký tự cốt lõi</option>
                <option value="nonascii">Tất cả ký tự không ASCII</option>
            </select>
        </label>
    </div>

    <div class="he2-main-layout">
        <div class="he2-col">
            <div class="he2-card he2-card-input" id="he2-card-input">
                <div class="he2-flex-between">
                    <h3 class="he2-card-title">📥 Đầu vào</h3>
                    <button type="button" id="he2-btn-clear" class="he2-btn-small">🧹 Xóa</button>
                </div>
                <div class="he2-chips" aria-label="Ví dụ nhanh">
                    <span class="he2-chips-label">Ví dụ:</span>
                    <button type="button" class="he2-chip" data-he2-sample="encode1">&lt;p&gt;Chào &amp; bạn&lt;/p&gt;</button>
                    <button type="button" class="he2-chip" data-he2-sample="encode2">&lt;a title="O'Reilly"&gt;</button>
                    <button type="button" class="he2-chip" data-he2-sample="decode1">&amp;lt;b&amp;gt;Chào&amp;lt;/b&amp;gt;</button>
                </div>
                <textarea id="he2-input-text" class="he2-textarea" placeholder="Nhập mã HTML hoặc chuỗi ký tự vào đây... (Ví dụ: &lt;script&gt;alert(1)&lt;/script&gt;)"></textarea>
                <p class="he2-hint" id="he2-input-hint">Nhập nội dung nguyên bản để mã hóa, hoặc chuỗi đã mã hóa để giải mã.</p>
            </div>
        </div>

        <div class="he2-swap-zone">
            <button type="button" id="he2-btn-swap" class="he2-btn-swap" title="Hoán đổi đầu vào và kết quả" aria-label="Hoán đổi đầu vào và kết quả">⇌</button>
        </div>

        <div class="he2-col">
            <div class="he2-card he2-card-output">
                <div class="he2-flex-between he2-output-head">
                    <h3 class="he2-card-title">🚀 Kết quả</h3>
                    <span class="he2-badge" id="he2-status-badge">Sẵn sàng</span>
                </div>
                <textarea id="he2-output-text" class="he2-textarea he2-textarea-output" readonly placeholder="Kết quả sẽ tự động hiển thị ở đây..."></textarea>
                <p class="he2-stats" id="he2-stats" aria-live="polite"></p>
                <p class="he2-warn" id="he2-warn" hidden></p>
            </div>
        </div>
    </div>

    <div class="he2-actions">
        <button type="button" class="he2-btn-main" id="he2-btn-copy">📋 Sao chép kết quả</button>
        <button type="button" class="he2-btn-sub" id="he2-btn-download">⬇ Tải .txt</button>
        <button type="button" class="he2-btn-sub" id="he2-btn-layer" hidden>↻ Giải thêm 1 lớp</button>
    </div>
    <p class="he2-toast" id="he2-toast" role="status" aria-live="polite" hidden></p>

    <details class="he2-details">
        <summary>Bảng 8 ký tự được mã hóa</summary>
        <div class="he2-details-body">
            <table class="he2-table">
                <thead><tr><th>Ký tự</th><th>Tên</th><th>Số thập phân</th><th>Số hex</th></tr></thead>
                <tbody>
                    <tr><td>&amp;</td><td>&amp;amp;</td><td>&amp;#38;</td><td>&amp;#x26;</td></tr>
                    <tr><td>&lt;</td><td>&amp;lt;</td><td>&amp;#60;</td><td>&amp;#x3C;</td></tr>
                    <tr><td>&gt;</td><td>&amp;gt;</td><td>&amp;#62;</td><td>&amp;#x3E;</td></tr>
                    <tr><td>"</td><td>&amp;quot;</td><td>&amp;#34;</td><td>&amp;#x22;</td></tr>
                    <tr><td>'</td><td>&amp;#39;</td><td>&amp;#39;</td><td>&amp;#x27;</td></tr>
                    <tr><td>/</td><td>&amp;#x2F;</td><td>&amp;#47;</td><td>&amp;#x2F;</td></tr>
                    <tr><td>`</td><td>&amp;#x60;</td><td>&amp;#96;</td><td>&amp;#x60;</td></tr>
                    <tr><td>=</td><td>&amp;#x3D;</td><td>&amp;#61;</td><td>&amp;#x3D;</td></tr>
                </tbody>
            </table>
            <p class="he2-hint">Chế độ “5 ký tự cốt lõi” chỉ đổi &amp; &lt; &gt; " '. Chế độ “Tất cả ký tự không ASCII” đổi thêm mọi ký tự ngoài bảng ASCII thành tham chiếu số — chữ tiếng Việt giữ nguyên ở hai chế độ còn lại. Giải mã đọc cả tham chiếu theo tên, theo số thập phân và theo số hex, kể cả các tên ngoài bảng trên như &amp;copy; hay &amp;nbsp;.</p>
        </div>
    </details>

    <div class="he2-info-box">
        <h4>💡 IT Note:</h4>
        <p>Quá trình <b>Mã hóa</b> quét và biến các ký tự <code>&amp;</code> <code>&lt;</code> <code>&gt;</code> <code>"</code> <code>'</code> <code>/</code> <code>`</code> <code>=</code> thành tham chiếu HTML, để trình duyệt không biên dịch nhầm chúng thành mã HTML thực thi. Dấu <code>&amp;</code> mới sinh ra trong biểu diễn thay thế không bị quét lại ngay trong cùng một lượt, nên một lần mã hóa không tự tạo thêm lớp.</p>
    </div>
</div>

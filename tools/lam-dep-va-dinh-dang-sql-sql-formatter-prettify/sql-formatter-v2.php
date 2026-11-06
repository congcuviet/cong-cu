<div class="sf2-soft-wrapper">
    <script src="https://congcuviet.com/wp-content/themes/bricks-child/cong-cu/sql-formatter-15.3.0.min.js"></script>

    <div class="sf2-toolbar">
        <div class="sf2-seg" role="group" aria-label="Chế độ">
            <button type="button" id="sf2-btn-prettify" class="sf2-seg-btn active">✨ LÀM ĐẸP (PRETTIFY)</button>
            <button type="button" id="sf2-btn-minify" class="sf2-seg-btn">🗜️ NÉN (MINIFY)</button>
        </div>
        <button type="button" id="sf2-btn-clear" class="sf2-btn-clear">🧹 Xóa trắng</button>
    </div>

    <div class="sf2-chips" role="group" aria-label="Ví dụ mẫu">
        <span class="sf2-chips-label">Ví dụ:</span>
        <button type="button" id="sf2-chip-1" class="sf2-chip">Truy vấn JOIN</button>
        <button type="button" id="sf2-chip-2" class="sf2-chip">CASE + truy vấn lồng</button>
        <button type="button" id="sf2-chip-3" class="sf2-chip">CREATE TABLE</button>
    </div>

    <div class="sf2-main-layout">
        <div class="sf2-col">
            <div class="sf2-card sf2-bg-yellow">
                <div class="sf2-flex-between">
                    <span class="sf2-section-title">📥 SQL Query (Đầu vào)</span>
                    <span class="sf2-badge" id="sf2-badge-left">Chờ nhập liệu...</span>
                </div>
                <textarea id="sf2-input-left" class="sf2-textarea" placeholder="Dán câu truy vấn SQL của bạn vào đây..." spellcheck="false"></textarea>
                <div class="sf2-stats" id="sf2-stats-left">0 ký tự · 0 dòng</div>
            </div>
        </div>

        <div class="sf2-col">
            <div class="sf2-card sf2-bg-white">
                <div class="sf2-flex-between sf2-output-head">
                    <select id="sf2-dialect" class="sf2-select" aria-label="Chuẩn SQL">
                        <option value="sql" selected>Chuẩn SQL (Standard)</option>
                        <option value="mysql">MySQL</option>
                        <option value="mariadb">MariaDB</option>
                        <option value="postgresql">PostgreSQL</option>
                        <option value="sqlite">SQLite</option>
                        <option value="transactsql">SQL Server (T-SQL)</option>
                        <option value="plsql">Oracle (PL/SQL)</option>
                        <option value="bigquery">BigQuery</option>
                    </select>
                    <div class="sf2-head-btns">
                        <button type="button" class="sf2-btn-copy" id="sf2-btn-copy">📋 COPY</button>
                        <button type="button" class="sf2-btn-download" id="sf2-btn-download">⬇️ TẢI .SQL</button>
                    </div>
                </div>
                <textarea id="sf2-input-right" class="sf2-textarea sf2-textarea-output" readonly placeholder="Kết quả sẽ hiển thị ở đây..." spellcheck="false"></textarea>
                <div class="sf2-stats" id="sf2-stats-right">0 ký tự · 0 dòng</div>
            </div>
        </div>
    </div>

    <div class="sf2-error-box" id="sf2-error-box" hidden>
        <strong>Không định dạng được</strong>
        <p id="sf2-error-msg"></p>
    </div>

    <div class="sf2-warn-box" id="sf2-warn-box" hidden>
        <strong>⚠️ Kiểm tra an toàn</strong>
        <p id="sf2-warn-msg"></p>
    </div>

    <details class="sf2-details">
        <summary>Tùy chọn nâng cao</summary>
        <div class="sf2-adv-grid">
            <div class="sf2-adv-group">
                <span class="sf2-adv-label">Thụt lề</span>
                <div class="sf2-seg sf2-seg-small" role="group" aria-label="Thụt lề">
                    <button type="button" id="sf2-indent-2" class="sf2-seg-btn">2 khoảng trắng</button>
                    <button type="button" id="sf2-indent-4" class="sf2-seg-btn active">4 khoảng trắng</button>
                </div>
            </div>
            <div class="sf2-adv-group">
                <span class="sf2-adv-label">Viết hoa từ khóa</span>
                <div class="sf2-seg sf2-seg-small" role="group" aria-label="Viết hoa từ khóa">
                    <button type="button" id="sf2-case-upper" class="sf2-seg-btn active">VIẾT HOA</button>
                    <button type="button" id="sf2-case-lower" class="sf2-seg-btn">viết thường</button>
                    <button type="button" id="sf2-case-preserve" class="sf2-seg-btn">Giữ nguyên</button>
                </div>
            </div>
            <label class="sf2-check"><input type="checkbox" id="sf2-keep-comments"> Giữ chú thích khi nén (chỉ chế độ Nén)</label>
        </div>
    </details>

    <div class="sf2-info-box">
        <h4>💡 IT Note:</h4>
        <p>Thư viện sql-formatter 15.3.0 chạy ngay trên trình duyệt, tải cùng tên miền congcuviet.com (không qua CDN ngoài) — dữ liệu của bạn không bị gửi đi đâu. Chế độ Nén giữ nguyên nội dung trong chuỗi ký tự và chú thích điều kiện MySQL /*! ... */.</p>
    </div>
</div>

<div class="se2-soft-wrapper">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js"></script>

    <div class="se2-container">
        <div class="se2-editor-panel">
            <div class="se2-form-row">
                <div class="se2-form-group">
                    <label class="se2-label" for="se2-keywords">Từ khoá (Từ đầu tiên là Key chính):</label>
                    <input type="text" id="se2-keywords" class="se2-input" placeholder="VD: seo editor, công cụ seo">
                </div>
                <div class="se2-form-group">
                    <label class="se2-label" for="se2-domain">Domain web của bạn:</label>
                    <input type="text" id="se2-domain" class="se2-input" placeholder="VD: domaincuaban.com">
                </div>
            </div>

            <div class="se2-form-group">
                <label class="se2-label" for="se2-title">Tiêu đề bài viết (SEO Title):</label>
                <input type="text" id="se2-title" class="se2-input" placeholder="Nhập tiêu đề bài viết...">
                <div class="se2-count" id="se2-title-count">0/60 ký tự</div>
            </div>

            <div class="se2-form-group">
                <label class="se2-label" for="se2-slug">Slug (Đường dẫn tĩnh):</label>
                <input type="text" id="se2-slug" class="se2-input" placeholder="VD: cong-cu-seo">
            </div>

            <div class="se2-form-group">
                <label class="se2-label" for="se2-desc">Mô tả Meta (Meta Description):</label>
                <textarea id="se2-desc" class="se2-textarea" rows="2" placeholder="Nhập đoạn mô tả ngắn..."></textarea>
                <div class="se2-count" id="se2-desc-count">0/160 ký tự</div>
            </div>

            <div class="se2-form-group">
                <label class="se2-label" for="se2-content">Nội dung bài viết:</label>
                <textarea id="se2-content"></textarea>
                <textarea id="se2-fallback" class="se2-textarea se2-fallback" rows="12" hidden placeholder="Dán nội dung bài viết (văn bản hoặc HTML)..."></textarea>
                <div class="se2-note" id="se2-fallback-note" hidden>Trình soạn thảo TinyMCE chưa tải được (mạng/CDN). Bạn vẫn soạn thảo và kiểm tra bằng ô văn bản bên dưới — có thể dán HTML.</div>
            </div>

            <div class="se2-box">
                <h3 class="se2-box-title">⚡ Công Cụ Xử Lý Nhanh</h3>
                <button class="se2-tool-btn" id="se2-btn-highlight" type="button">🖍️ Highlight Từ Khoá (Chính &amp; Phụ)</button>
                <button class="se2-tool-btn" id="se2-btn-clean-lines" type="button">🗑️ Xoá dòng trắng thừa</button>
                <button class="se2-tool-btn" id="se2-btn-format-img" type="button">🖼️ Chỉnh ảnh (Rộng 800px, Căn giữa)</button>
                <button class="se2-tool-btn" id="se2-btn-auto-caption" type="button">📝 Lấy Heading gần nhất làm Caption</button>
                <button class="se2-tool-btn" id="se2-btn-sync-alt" type="button">🔄 Đồng bộ ALT ảnh theo Caption</button>
                <button class="se2-tool-btn" id="se2-btn-bold-headings" type="button">🅱️ In đậm tất cả thẻ Heading</button>
                <div class="se2-toast" id="se2-toast" role="status" hidden></div>
            </div>

            <div class="se2-actions">
                <button class="se2-btn se2-btn-primary" id="se2-btn-sample" type="button">Nạp bài mẫu</button>
                <button class="se2-btn" id="se2-btn-copy" type="button">Sao chép HTML</button>
                <button class="se2-btn" id="se2-btn-download" type="button">Tải file .html</button>
                <button class="se2-btn" id="se2-btn-reset" type="button">Làm mới</button>
            </div>
        </div>

        <div class="se2-sidebar">
            <div class="se2-box se2-score-box">
                <h3 class="se2-box-title">🎯 Điểm SEO Tổng</h3>
                <div class="se2-score-hero"><span id="se2-score">0</span><span class="se2-score-max">/100</span></div>
                <div class="se2-verdict" id="se2-verdict">Còn nhiều việc phải làm — hãy nhập từ khoá và nội dung trước.</div>
                <div class="se2-passline" id="se2-passline">Đạt 0/19 tiêu chí · Tiêu chí chưa đánh giá được tính 0 điểm.</div>
            </div>

            <div class="se2-box">
                <h3 class="se2-box-title">Thống Kê Nhanh</h3>
                <div class="se2-stats-grid">
                    <div class="se2-stat-item"><div class="se2-stat-val" id="se2-stat-words">0</div><div class="se2-stat-label">Số từ</div></div>
                    <div class="se2-stat-item"><div class="se2-stat-val" id="se2-stat-density">0%</div><div class="se2-stat-label">Mật độ Key</div></div>
                    <div class="se2-stat-item"><div class="se2-stat-val" id="se2-stat-images">0</div><div class="se2-stat-label">Hình ảnh</div></div>
                    <div class="se2-stat-item"><div class="se2-stat-val" id="se2-stat-links">0</div><div class="se2-stat-label">Liên kết</div></div>
                </div>
                <div class="se2-secondary" id="se2-secondary" hidden></div>
            </div>

            <div class="se2-box">
                <h3 class="se2-box-title">🎯 Đánh Giá SEO (RankMath)</h3>
                <div id="se2-results"></div>
                <button class="se2-btn se2-btn-small" id="se2-btn-copy-results" type="button">Sao chép kết quả</button>
            </div>

            <details class="se2-details">
                <summary class="se2-details-title">Cách tính điểm &amp; giới hạn</summary>
                <div class="se2-details-body">
                    <p>Điểm tổng = (số tiêu chí Đạt + một nửa số tiêu chí Cảnh báo) ÷ 19 tiêu chí × 100. Tiêu chí chưa đánh giá được (thiếu từ khoá chính, chưa nhập tiêu đề, mô tả hoặc slug) tính 0 điểm, không tính là đạt.</p>
                    <p>Tiêu đề nên ≤ 60 ký tự, mô tả meta nên 120–160 ký tự. Từ khoá có dấu vẫn khớp slug không dấu. Mật độ tính theo cụm từ đầy đủ, có ranh giới từ.</p>
                    <p>Khi tô nổi, từ khoá chính luôn màu vàng; từ khoá phụ màu xanh. Nội dung chỉ xử lý trong trình duyệt của bạn, công cụ không gửi bản nháp lên máy chủ.</p>
                </div>
            </details>
        </div>
    </div>
</div>

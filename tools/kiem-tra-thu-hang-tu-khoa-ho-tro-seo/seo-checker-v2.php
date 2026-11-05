<div class="sr2-wrapper">
    <div class="sr2-card sr2-form-card">
        <div class="sr2-grid2">
            <div class="sr2-field">
                <label class="sr2-label" for="seo-domains">🌐 Tên miền cần check</label>
                <input type="text" id="seo-domains" class="sr2-input" value="" placeholder="vd: domain1.com, domain2.vn" autocomplete="off">
                <p class="sr2-hint">Cách nhau bằng dấu phẩy. Nhập nhiều tên miền để dò cùng lúc xem tên miền nào lọt Top.</p>
                <div class="sr2-chips" id="sr2-domain-chips" hidden></div>
            </div>
            <div class="sr2-field">
                <label class="sr2-label" for="seo-keywords">📋 Danh sách từ khóa</label>
                <textarea id="seo-keywords" class="sr2-textarea" rows="6" placeholder="nhập hàng trung quốc&#10;vận chuyển hàng quảng châu"></textarea>
                <p class="sr2-hint"><span id="sr2-kw-count">0 từ khóa</span> — mỗi từ khóa một dòng.</p>
            </div>
        </div>
        <p class="sr2-error" id="sr2-error" role="alert" hidden></p>
        <p class="sr2-note" id="sr2-script-note" hidden>⚠️ Chưa thấy script hỗ trợ phản hồi. Công cụ này cần script hỗ trợ (Tampermonkey) chạy cùng trang để mở tab Google và đọc kết quả — hãy kiểm tra script đã bật chưa, rồi bấm “Dừng lại” và “Bắt đầu check” lại.</p>
        <div class="sr2-actions">
            <button id="btn-start" class="sr2-btn sr2-btn-primary">▶ Bắt đầu check</button>
            <button id="btn-stop" class="sr2-btn sr2-btn-danger" disabled>🛑 Dừng lại</button>
            <button id="btn-copy" class="sr2-btn sr2-btn-success">📋 Copy bảng (Excel)</button>
            <button id="sr2-btn-tsv" class="sr2-btn sr2-btn-outline">⬇ Tải file TSV</button>
        </div>
    </div>

    <div class="sr2-card sr2-status-card">
        <div class="sr2-status-row">
            <span class="sr2-status-label">Trạng thái:</span>
            <strong id="status-text" class="sr2-status-idle">Chưa hoạt động</strong>
        </div>
        <div class="sr2-status-row">
            <span class="sr2-status-label">Tiến độ:</span>
            <strong id="status-progress" class="sr2-status-blue">0 / 0</strong>
        </div>
        <div class="sr2-summary" id="sr2-summary" hidden>
            <div class="sr2-sum-item"><strong id="sr2-sum-top10">0</strong><span>Top 10</span></div>
            <div class="sr2-sum-item"><strong id="sr2-sum-top100">0</strong><span>Top 11–100</span></div>
            <div class="sr2-sum-item"><strong id="sr2-sum-out">0</strong><span>Ngoài Top 100</span></div>
            <div class="sr2-sum-item"><strong id="sr2-sum-done">0</strong><span>Đã check</span></div>
        </div>
    </div>

    <div class="sr2-card sr2-table-card">
        <div class="sr2-table-wrap">
            <table class="sr2-table" id="seo-result-table">
                <thead>
                    <tr>
                        <th width="5%">STT</th>
                        <th width="25%">Từ Khóa</th>
                        <th width="10%">Hạng</th>
                        <th width="30%">Tiêu Đề</th>
                        <th width="30%">URL Đích</th>
                    </tr>
                </thead>
                <tbody id="seo-results-body">
                </tbody>
            </table>
        </div>
        <p class="sr2-empty" id="sr2-empty">Chưa có kết quả. Nhập tên miền và từ khóa rồi bấm “Bắt đầu check”.</p>
    </div>

    <details class="sr2-details">
        <summary>Khi bị Captcha hoặc Google chặn IP (403) thì làm gì?</summary>
        <p>Khi gặp Captcha, luồng quét tạm dừng để bạn sang tab Google giải mã, rồi tiến trình tiếp tục từ đúng từ khóa đang kẹt. Khi bị lỗi 403, hãy đổi mạng (reset modem hoặc phát lại 4G) để lấy IP mới, rồi bấm “Mở lại tab” — không cần quét lại từ đầu.</p>
    </details>
</div>

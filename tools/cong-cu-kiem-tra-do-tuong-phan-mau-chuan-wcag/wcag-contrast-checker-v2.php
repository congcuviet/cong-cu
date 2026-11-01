<link rel="stylesheet" href="wcag-contrast-checker-v2.css">

<div class="wc2-soft-wrapper">
    <div class="wc2-grid">
        <div class="wc2-card wc2-form-card">
            <div class="wc2-input-group">
                <label class="wc2-label" for="wc2FgHex">Màu chữ (Foreground)</label>
                <div class="wc2-color-row">
                    <input type="color" id="wc2FgColor" value="#111111" aria-label="Chọn màu chữ">
                    <input type="text" id="wc2FgHex" value="#111111" maxlength="7" spellcheck="false" autocomplete="off">
                </div>
            </div>

            <div class="wc2-swap-wrap">
                <button type="button" id="wc2Swap" class="wc2-btn wc2-btn-swap">↕️ ĐẢO MÀU</button>
            </div>

            <div class="wc2-input-group">
                <label class="wc2-label" for="wc2BgHex">Màu nền (Background)</label>
                <div class="wc2-color-row">
                    <input type="color" id="wc2BgColor" value="#FDFD96" aria-label="Chọn màu nền">
                    <input type="text" id="wc2BgHex" value="#FDFD96" maxlength="7" spellcheck="false" autocomplete="off">
                </div>
            </div>

            <div class="wc2-chips" aria-label="Cặp màu mẫu">
                <button type="button" class="wc2-chip" data-fg="#111111" data-bg="#FDFD96">Vàng nhạt</button>
                <button type="button" class="wc2-chip" data-fg="#000000" data-bg="#FFFFFF">Đen / Trắng</button>
                <button type="button" class="wc2-chip" data-fg="#FFFFFF" data-bg="#1A73E8">Trắng / Xanh</button>
                <button type="button" class="wc2-chip" data-fg="#595959" data-bg="#FFFFFF">Xám đậm</button>
                <button type="button" class="wc2-chip" data-fg="#767676" data-bg="#FFFFFF">Xám ngưỡng AA</button>
            </div>
            <p class="wc2-hint">Nhập mã HEX 3 hoặc 6 ký tự, hoặc nhấn ô màu để chọn. Kết quả tự cập nhật khi đổi màu.</p>
        </div>

        <div class="wc2-card wc2-result-card">
            <div class="wc2-preview-box" id="wc2Preview">
                <div class="wc2-preview-large">Chữ kích thước lớn (Large Text)</div>
                <div class="wc2-preview-normal">Đây là đoạn văn bản có kích thước bình thường (Normal Text) để bạn kiểm tra xem màu sắc kết hợp với nhau có dễ đọc hay không.</div>
            </div>

            <p class="wc2-error" id="wc2Error" hidden>Mã màu chưa hợp lệ — nhập đủ 6 ký tự HEX (ví dụ #1A73E8).</p>

            <div id="wc2Results">
                <div class="wc2-ratio-box">
                    <div class="wc2-ratio-title">TỶ LỆ TƯƠNG PHẢN</div>
                    <div class="wc2-ratio-value" id="wc2Ratio">17.68 : 1</div>
                    <div class="wc2-verdict" id="wc2Verdict">Đạt cả AAA cho chữ thường.</div>
                    <div class="wc2-lum" id="wc2Lum">Độ chói: chữ L = 0.0056 · nền L = 0.9334</div>
                </div>

                <div class="wc2-fix" id="wc2Fix" hidden>
                    <p class="wc2-fix-text">Chưa đạt AA cho chữ thường. Giữ nguyên tông màu, chỉ chỉnh sáng/tối một màu là đủ:</p>
                    <button type="button" id="wc2FixBtn" class="wc2-btn wc2-btn-primary">Tự sửa về mức AA</button>
                    <p class="wc2-fix-note" id="wc2FixNote" hidden></p>
                </div>

                <button type="button" id="wc2Copy" class="wc2-btn wc2-btn-copy">Sao chép kết quả</button>
            </div>
        </div>
    </div>

    <div class="wc2-results-grid" id="wc2Badges">
        <div class="wc2-badge-card">
            <h4 class="wc2-badge-title">Chữ bình thường</h4>
            <p class="wc2-badge-sub">&lt; 18pt hoặc &lt; 14pt in đậm</p>
            <div class="wc2-score-row"><span class="wc2-level">AA (cần 4.5:1)</span><span class="wc2-badge wc2-badge-pass" id="wc2BadgeNormalAA">PASS</span></div>
            <div class="wc2-score-row"><span class="wc2-level">AAA (cần 7.0:1)</span><span class="wc2-badge wc2-badge-pass" id="wc2BadgeNormalAAA">PASS</span></div>
        </div>
        <div class="wc2-badge-card">
            <h4 class="wc2-badge-title">Chữ lớn</h4>
            <p class="wc2-badge-sub">&ge; 18pt hoặc &ge; 14pt in đậm</p>
            <div class="wc2-score-row"><span class="wc2-level">AA (cần 3.0:1)</span><span class="wc2-badge wc2-badge-pass" id="wc2BadgeLargeAA">PASS</span></div>
            <div class="wc2-score-row"><span class="wc2-level">AAA (cần 4.5:1)</span><span class="wc2-badge wc2-badge-pass" id="wc2BadgeLargeAAA">PASS</span></div>
        </div>
        <div class="wc2-badge-card">
            <h4 class="wc2-badge-title">Phi văn bản</h4>
            <p class="wc2-badge-sub">Biểu tượng, viền ô nhập, nút bấm</p>
            <div class="wc2-score-row"><span class="wc2-level">AA (cần 3.0:1)</span><span class="wc2-badge wc2-badge-pass" id="wc2BadgeNonTextAA">PASS</span></div>
            <div class="wc2-score-row"><span class="wc2-level">Ghi chú</span><span class="wc2-note-text">Không có mức AAA</span></div>
        </div>
    </div>

    <details class="wc2-details">
        <summary class="wc2-summary">Cách tính và giới hạn</summary>
        <div class="wc2-details-body">
            <p>Tỷ lệ = (L<sub>sáng</sub> + 0,05) / (L<sub>tối</sub> + 0,05), trong đó L là độ chói tương đối tính từ mã RGB theo công thức WCAG 2.1 của W3C (kênh sRGB tuyến tính hoá với ngưỡng 0,03928, hệ số 0,2126 / 0,7152 / 0,0722). Tỷ lệ chạy từ 1:1 (hai màu giống nhau) đến 21:1 (đen tuyệt đối trên trắng tuyệt đối).</p>
            <p>Chữ lớn là chữ từ 18pt (24px) trở lên, hoặc từ 14pt in đậm (18,66px) trở lên. Mức phi văn bản (WCAG 2.1, tiêu chí 1.4.11) áp dụng cho thành phần giao diện và đối tượng đồ hoạ có ý nghĩa, không áp dụng cho chữ.</p>
            <p>Công cụ chỉ kiểm tra một cặp màu tại một thời điểm. Kết quả không áp dụng trực tiếp cho chữ trên ảnh, gradient hay nền trong suốt — những trường hợp đó cần đo màu thực tế hiển thị trên màn hình.</p>
        </div>
    </details>
</div>

<script src="wcag-contrast-checker-v2.js"></script>

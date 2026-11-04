<div class="as2-soft-wrapper">
    <script src="/wp-content/themes/bricks-child/tai-nguyen/ffmpeg.min.js"></script>

    <div class="as2-card as2-upload-card">
        <div class="as2-upload-box" id="as2-box-video" tabindex="0" role="button" aria-label="Tải video lên">
            <input type="file" id="as2-video-input" accept="video/*" hidden>
            <span class="as2-icon" id="as2-icon-video">🎬</span>
            <span id="as2-video-name" class="as2-filename">Nhấp để tải video bị lệch tiếng...</span>
            <span id="as2-meta" class="as2-meta" hidden></span>
        </div>
        <p id="as2-error" class="as2-error" hidden></p>
    </div>

    <div id="as2-settings" hidden>
        <div class="as2-grid2">
            <div class="as2-card">
                <label class="as2-label" for="as2-player">👀 Video gốc — tua tới đoạn lệch rõ nhất</label>
                <video id="as2-player" controls preload="metadata"></video>
            </div>

            <div class="as2-card">
                <label class="as2-label" for="as2-input-offset">⚖️ Độ lệch giữa hình và tiếng (giây)</label>
                <div class="as2-offset-row">
                    <button type="button" id="as2-step-minus" class="as2-stepper" aria-label="Giảm độ lệch">−</button>
                    <input type="text" id="as2-input-offset" class="as2-num" value="0,0" inputmode="decimal" aria-label="Độ lệch chính xác">
                    <button type="button" id="as2-step-plus" class="as2-stepper" aria-label="Tăng độ lệch">+</button>
                </div>
                <input type="range" id="as2-slider" class="as2-slider" min="-5" max="5" step="0.05" value="0">
                <p id="as2-verdict" class="as2-verdict">Độ lệch 0,0 giây — chưa thay đổi gì.</p>
                <div class="as2-chips">
                    <button type="button" class="as2-chip" data-val="-1">−1,0s</button>
                    <button type="button" class="as2-chip" data-val="-0.5">−0,5s</button>
                    <button type="button" class="as2-chip" data-val="0">0s</button>
                    <button type="button" class="as2-chip" data-val="0.5">+0,5s</button>
                    <button type="button" class="as2-chip" data-val="1">+1,0s</button>
                </div>
                <p class="as2-hint-text">Số dương: tiếng đi trước hình, tiếng sẽ trễ thêm. Số âm: hình đi trước tiếng, hình sẽ trễ thêm. Bước nhỏ nhất 0,05 giây.</p>
            </div>
        </div>

        <div class="as2-card">
            <p class="as2-hint-text">👉 Tua video gốc tới đoạn có tiếng người và độ lệch rõ nhất, rồi nghe thử trước khi xuất bản toàn bộ.</p>
            <div class="as2-actions">
                <button type="button" id="as2-btn-preview" class="as2-btn-preview">🎧 Nghe thử 5 giây</button>
                <button type="button" id="as2-btn-start" class="as2-btn-primary">🚀 Đồng bộ toàn bộ &amp; tải xuống</button>
            </div>
            <div id="as2-preview-result" hidden>
                <p class="as2-result-label">👉 Kết quả nghe thử 5 giây:</p>
                <video id="as2-preview-video" controls></video>
            </div>
        </div>

        <details class="as2-card as2-details">
            <summary>Bản nghe thử và bản toàn bộ khác nhau thế nào?</summary>
            <p>Bản nghe thử mã hóa lại hình và tiếng (libx264, ultrafast + AAC) nên chỉ dùng để kiểm tra độ lệch. Bản toàn bộ dịch luồng bằng -itsoffset và giữ nguyên hình/tiếng (copy) nên không giảm chất lượng. Công cụ chỉ sửa lệch cố định một giá trị; video càng về cuối càng lệch thì một giá trị cố định không sửa hết. Video chỉ xử lý trong trình duyệt của bạn, không tải lên máy chủ.</p>
        </details>
    </div>

    <div id="as2-status-box" class="as2-card as2-status-box" hidden>
        <h4 id="as2-status-text">Đang khởi động lõi xử lý...</h4>
        <div class="as2-progress-bar">
            <div id="as2-progress-fill" class="as2-progress-fill"></div>
        </div>
        <p id="as2-detail-text" class="as2-detail-text"></p>
        <button type="button" id="as2-btn-cancel" class="as2-btn-cancel" hidden>Hủy xử lý</button>
    </div>

    <div id="as2-result-box" class="as2-card as2-result-box" hidden>
        <p id="as2-result-text" class="as2-result-text"></p>
        <div class="as2-actions">
            <button type="button" id="as2-btn-download-again" class="as2-btn-primary">⬇️ Tải lại video</button>
            <button type="button" id="as2-btn-reset" class="as2-btn-preview">🔄 Làm video khác</button>
        </div>
    </div>
</div>

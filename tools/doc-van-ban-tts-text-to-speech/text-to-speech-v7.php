<div class="vieneu-soft-wrapper">
    <div class="vieneu-grid">
        <section class="vieneu-card vieneu-form-card">
            <label class="vieneu-label" for="vieneu-text">📝 Văn bản cần đọc</label>
            <textarea id="vieneu-text" class="vieneu-textarea" rows="7" maxlength="1000" placeholder="Nhập hoặc dán văn bản tiếng Việt vào đây...">Xin chào, đây là bản thử nghiệm đọc văn bản tiếng Việt chạy hoàn toàn trong trình duyệt.</textarea>
            <div class="vieneu-row-between">
                <span class="vieneu-hint" id="vieneu-counter">0 / 1.000 ký tự</span>
                <button type="button" class="vieneu-mini-btn" id="vieneu-clear">Xóa văn bản</button>
            </div>

            <div class="vieneu-label">✍️ Câu mẫu</div>
            <div class="vieneu-chip-row">
                <button type="button" class="vieneu-sample-chip" data-text="Xin chào, đây là bản thử nghiệm đọc văn bản tiếng Việt chạy hoàn toàn trong trình duyệt.">Chào hỏi</button>
                <button type="button" class="vieneu-sample-chip" data-text="Hôm nay, thời tiết tại Hà Nội nắng đẹp, nhiệt độ cao nhất khoảng 30 độ, rất thích hợp cho các hoạt động ngoài trời.">Bản tin</button>
                <button type="button" class="vieneu-sample-chip" data-text="Ngày xửa ngày xưa, ở một ngôi làng nhỏ bên bờ sông, có hai anh em sống nương tựa vào nhau.">Kể chuyện</button>
            </div>

            <div class="vieneu-label">🎛️ Mô hình đọc</div>
            <div class="vieneu-seg" id="vieneu-model" role="radiogroup" aria-label="Chọn mô hình đọc">
                <button type="button" data-model="lite" class="active">Lite · nhẹ máy</button>
                <button type="button" data-model="turbo">Turbo · giọng hay hơn</button>
            </div>
            <p class="vieneu-hint">Turbo đọc hay hơn nhưng nặng máy hơn (tải thêm khoảng 210 MB ở lần đầu chọn) — hợp với máy khỏe. Lite (Nano) nhẹ, chạy được trên hầu hết máy.</p>

            <div class="vieneu-label">🎙️ Chọn giọng đọc <span class="vieneu-label-sub" id="vieneu-voice-count"></span></div>
            <div class="vieneu-voice-grid" id="vieneu-voices" role="radiogroup" aria-label="Chọn giọng đọc">
                <p class="vieneu-hint">Đang tải danh sách giọng…</p>
            </div>

            <div class="vieneu-label">⏩ Tốc độ đọc</div>
            <div class="vieneu-seg vieneu-seg-speed" id="vieneu-speed" role="radiogroup" aria-label="Chọn tốc độ đọc">
                <button type="button" data-speed="0.75">0,75×</button>
                <button type="button" data-speed="0.9">0,9×</button>
                <button type="button" data-speed="1" class="active">1×</button>
                <button type="button" data-speed="1.1">1,1×</button>
                <button type="button" data-speed="1.25">1,25×</button>
                <button type="button" data-speed="1.5">1,5×</button>
                <button type="button" data-speed="1.75">1,75×</button>
                <button type="button" data-speed="2">2×</button>
            </div>
            <p class="vieneu-hint" id="vieneu-speed-hint">Tốc độ áp trực tiếp vào file âm thanh tạo ra, nên file WAV và phụ đề tải về luôn khớp nhau.</p>
        </section>

        <section class="vieneu-card vieneu-result-card">
            <div class="vieneu-label">🤖 Model AI chạy trên máy của bạn</div>
            <p class="vieneu-status" id="vieneu-model-status">Model chưa được tải. Bấm “Tải model” — model khoảng 282 MB được tải một lần từ Hugging Face rồi lưu trên máy này, các lần sau dùng ngay.</p>
            <div class="vieneu-progress" id="vieneu-progress" style="display:none"><div class="vieneu-progress-bar" id="vieneu-progress-bar"></div></div>
            <div class="vieneu-progress-meta" id="vieneu-progress-meta" style="display:none"><span id="vieneu-progress-text"></span><span class="vieneu-progress-pct" id="vieneu-progress-pct">0%</span></div>
            <button type="button" class="vieneu-btn vieneu-btn-secondary" id="vieneu-load">⬇ Tải model (282 MB)</button>
            <div class="vieneu-speak-row">
                <button type="button" class="vieneu-btn vieneu-btn-primary" id="vieneu-speak-cpu">🖥️ Tạo giọng đọc · CPU</button>
                <button type="button" class="vieneu-btn vieneu-btn-primary" id="vieneu-speak-gpu" disabled>⚡ Tạo giọng đọc · GPU</button>
            </div>
            <p class="vieneu-hint" id="vieneu-gpu-note" style="display:none">Máy này không hỗ trợ GPU.</p>
            <audio id="vieneu-player" class="vieneu-player" controls></audio>
            <a id="vieneu-download" class="vieneu-btn vieneu-btn-secondary vieneu-download" href="#" download="doc-van-ban-vieneu.wav" style="display:none">⬇ Tải file WAV</a>
            <div class="vieneu-sub-row" id="vieneu-sub-row" style="display:none">
                <button type="button" class="vieneu-btn vieneu-btn-secondary" id="vieneu-dl-srt">⬇ Tải phụ đề .SRT</button>
                <button type="button" class="vieneu-btn vieneu-btn-secondary" id="vieneu-dl-txt">⬇ Tải phụ đề .TXT</button>
            </div>
            <p class="vieneu-stats" id="vieneu-stats" aria-live="polite"></p>
        </section>
    </div>

    <details class="vieneu-card vieneu-advanced">
        <summary class="vieneu-adv-summary">⚙️ Cài đặt nâng cao</summary>
        <div class="vieneu-adv-body">
            <div class="vieneu-label">Số bước sinh tiếng</div>
            <div class="vieneu-seg" id="vieneu-steps">
                <button type="button" data-steps="8">8 bước · nhanh hơn</button>
                <button type="button" data-steps="16" class="active">16 bước · mượt hơn</button>
            </div>
            <div class="vieneu-label">Model đã tải trên máy này</div>
            <button type="button" class="vieneu-btn vieneu-btn-danger" id="vieneu-clear-cache">🗑 Xóa model đã tải</button>
            <p class="vieneu-hint" id="vieneu-cache-note"></p>
            <p class="vieneu-hint">Ghi chú kỹ thuật: công cụ có hai mô hình VieNeu-TTS v3 chạy ngay trên thiết bị của bạn bằng ONNX Runtime Web. Bản Lite (Nano, khoảng 282 MB) nhẹ máy, cho chọn đọc bằng GPU (WebGPU) hoặc CPU (WASM) bằng hai nút tạo giọng đọc — đang đọc bằng GPU mà gặp lỗi, công cụ sẽ tự chuyển sang CPU để đọc tiếp. Bản Turbo (khoảng 210 MB) đọc hay hơn, chỉ chạy bằng CPU (WASM), được tải lười ở lần đầu chọn và lưu trong bộ nhớ đệm vieneu-turbo-models-v1 dùng chung với công cụ Đọc Sách Nói Online. Cả hai model đều tải trực tiếp từ Hugging Face ở lần đầu và lưu trong bộ nhớ đệm của trình duyệt; văn bản bạn nhập không được gửi lên bất kỳ máy chủ nào. Ở bản Lite, tốc độ đọc được áp trực tiếp khi sinh tiếng; ở bản Turbo, tốc độ chỉ áp vào lúc nghe thử trong trình phát, file WAV và phụ đề tải về giữ tốc độ gốc. Số viết bằng chữ số được tự đọc thành chữ theo bộ tiền xử lý hiện tại; phụ đề SRT/TXT được tính từ đúng mốc thời gian của từng đoạn âm thanh đã tạo.</p>
        </div>
    </details>
</div>

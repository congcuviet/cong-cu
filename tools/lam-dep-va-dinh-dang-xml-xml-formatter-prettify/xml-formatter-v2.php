<div class="xf2-soft-wrapper">
    <div class="xf2-toolbar">
        <div class="xf2-btn-group" role="group" aria-label="Chế độ xử lý">
            <button id="xf2-btn-prettify" class="xf2-btn active" type="button">✨ LÀM ĐẸP (PRETTIFY)</button>
            <button id="xf2-btn-minify" class="xf2-btn" type="button">🗜️ NÉN (MINIFY)</button>
        </div>
        <div class="xf2-indent-wrap" id="xf2-indent-wrap">
            <label class="xf2-label" for="xf2-indent">Thụt lề</label>
            <select id="xf2-indent" class="xf2-select">
                <option value="2">2 dấu cách</option>
                <option value="4" selected>4 dấu cách</option>
                <option value="tab">Tab</option>
            </select>
        </div>
    </div>

    <div class="xf2-actions">
        <label class="xf2-btn xf2-btn-upload" for="xf2-file" id="xf2-btn-upload">📂 Tải tệp .xml</label>
        <input type="file" id="xf2-file" class="xf2-file-input" accept=".xml,.txt,text/xml">
        <button id="xf2-btn-clear" class="xf2-btn xf2-btn-clear" type="button">🧹 Xóa trắng</button>
        <button id="xf2-btn-copy" class="xf2-btn xf2-btn-copy" type="button" disabled>📋 Sao chép kết quả</button>
        <button id="xf2-btn-download" class="xf2-btn xf2-btn-download" type="button" disabled>⬇ Tải .xml (đã làm đẹp)</button>
    </div>

    <div class="xf2-chips" aria-label="Ví dụ nhanh">
        <span class="xf2-chips-label">Ví dụ:</span>
        <button type="button" class="xf2-chip" data-xf2-chip="&lt;root&gt;&lt;item&gt;Ví dụ&lt;/item&gt;&lt;item&gt;Thứ hai&lt;/item&gt;&lt;/root&gt;">XML lồng nhau</button>
        <button type="button" class="xf2-chip" data-xf2-chip="&lt;para&gt;&lt;bold&gt;Xin&lt;/bold&gt; &lt;italic&gt;chào&lt;/italic&gt;&lt;/para&gt;">Nội dung xen kẽ</button>
        <button type="button" class="xf2-chip" data-xf2-chip="&lt;root&gt;&lt;item&gt;&lt;/root&gt;">XML lỗi</button>
    </div>

    <div class="xf2-main-layout">
        <div class="xf2-col">
            <div class="xf2-card xf2-bg-yellow">
                <div class="xf2-flex-between">
                    <span class="xf2-section-title">📥 Dữ liệu đầu vào</span>
                    <span class="xf2-badge" id="xf2-badge">Sẵn sàng</span>
                </div>
                <textarea id="xf2-input" class="xf2-textarea" placeholder="Dán mã XML cần xử lý vào đây..." spellcheck="false"></textarea>
                <p class="xf2-hint">Tối đa 2 MB. Chạy hoàn toàn trên trình duyệt, không gửi dữ liệu đi đâu.</p>
            </div>
        </div>

        <div class="xf2-col">
            <div class="xf2-card xf2-bg-white">
                <div class="xf2-flex-between">
                    <span class="xf2-section-title">🚀 Kết quả</span>
                </div>
                <textarea id="xf2-output" class="xf2-textarea xf2-textarea-output" readonly placeholder="Kết quả định dạng sẽ hiển thị ở đây..." spellcheck="false"></textarea>
                <p class="xf2-stats" id="xf2-stats"></p>
                <div class="xf2-error-box" id="xf2-error-box" hidden>
                    <strong>⚠️ Lỗi cú pháp XML</strong>
                    <div id="xf2-error-msg"></div>
                    <pre id="xf2-error-snippet" hidden></pre>
                </div>
            </div>
        </div>
    </div>

    <details class="xf2-details">
        <summary>Cách công cụ xử lý XML</summary>
        <ul>
            <li>Công cụ đọc XML thành cây phần tử rồi trình bày lại, không xử lý bằng mẫu văn bản: thẻ một ký tự, chú thích, CDATA, chỉ thị xử lý, khai báo XML và DOCTYPE đều được giữ nguyên.</li>
            <li>Nội dung xen kẽ phần tử và văn bản được giữ nguyên từng ký tự: dấu cách giữa hai phần tử con không bị xóa, kể cả khi nén.</li>
            <li>Phần tử có thuộc tính xml:space=&quot;preserve&quot; được giữ nguyên mọi khoảng trắng bên trong.</li>
            <li>Phần tử rỗng được viết dạng tự đóng, ví dụ &lt;item/&gt;.</li>
            <li>Chế độ nén chỉ bỏ xuống dòng và thụt lề giữa các thẻ; khai báo XML vẫn giữ ở đầu tài liệu.</li>
            <li>Chỉ kiểm tra cú pháp well-formed, không xác thực theo XSD hoặc DTD.</li>
        </ul>
    </details>

    <div class="xf2-toast" id="xf2-toast" hidden></div>
</div>

<div class="nwv-soft-wrapper">
    <div class="nwv-form-card">
        <h3 class="nwv-form-title">🔢 Nhập số cần đổi thành chữ</h3>
        <div class="nwv-field">
            <label for="nwv-inp-number">Số (tiền) cần đọc</label>
            <input type="text" id="nwv-inp-number" inputmode="numeric" autocomplete="off" value="1.234.567" placeholder="Ví dụ: 1500000 hoặc 1.500.000">
            <small class="nwv-hint">Bạn cứ gõ liền hoặc có dấu chấm phân cách đều được. Số đã nhận diện: <strong id="nwv-parsed">1.234.567</strong></small>
        </div>
        <div class="nwv-chips" id="nwv-chips">
            <button type="button" class="nwv-chip" data-val="100000">100 nghìn</button>
            <button type="button" class="nwv-chip" data-val="500000">500 nghìn</button>
            <button type="button" class="nwv-chip" data-val="1000000">1 triệu</button>
            <button type="button" class="nwv-chip" data-val="10000000">10 triệu</button>
            <button type="button" class="nwv-chip" data-val="100000000">100 triệu</button>
            <button type="button" class="nwv-chip" data-val="1000000000">1 tỷ</button>
        </div>
        <div class="nwv-opts-grid">
            <div class="nwv-field">
                <label for="nwv-sel-unit">Đơn vị đi kèm</label>
                <select id="nwv-sel-unit">
                    <option value="dong" selected>đồng (đọc số tiền)</option>
                    <option value="none">Không đơn vị (đọc số thường)</option>
                </select>
            </div>
            <div class="nwv-field">
                <label for="nwv-sel-le">Cách đọc hàng đơn vị lẻ</label>
                <select id="nwv-sel-le">
                    <option value="le" selected>"lẻ" — một trăm lẻ năm</option>
                    <option value="linh">"linh" — một trăm linh năm</option>
                </select>
            </div>
            <div class="nwv-field">
                <label for="nwv-sel-case">Kiểu chữ</label>
                <select id="nwv-sel-case">
                    <option value="sentence" selected>Viết hoa chữ đầu (chuẩn chứng từ)</option>
                    <option value="lower">viết thường toàn bộ</option>
                    <option value="upper">VIẾT HOA TOÀN BỘ</option>
                </select>
            </div>
            <div class="nwv-field">
                <label class="nwv-check"><input type="checkbox" id="nwv-chk-chan"> Thêm chữ "chẵn" ở cuối (kiểu ghi trên hóa đơn, chứng từ)</label>
            </div>
        </div>
    </div>

    <div class="nwv-result-card">
        <span class="nwv-result-label">✍️ Số bằng chữ</span>
        <p class="nwv-result-text" id="nwv-out-text">Một triệu hai trăm ba mươi tư nghìn năm trăm sáu mươi bảy đồng</p>
        <div class="nwv-result-meta"><span id="nwv-out-meta"></span></div>
        <div class="nwv-actions">
            <button type="button" class="nwv-btn" id="nwv-btn-copy">📋 Sao chép chữ</button>
            <button type="button" class="nwv-btn nwv-btn-alt" id="nwv-btn-speak">🔊 Nghe đọc thử</button>
        </div>
    </div>

    <details class="nwv-acc">
        <summary>📚 Các số hay bị đọc sai &amp; quy tắc đọc đúng</summary>
        <div class="nwv-acc-body">
            <table class="nwv-table">
                <thead>
                    <tr><th>Số</th><th>Đọc đúng</th><th>Điểm hay nhầm</th></tr>
                </thead>
                <tbody>
                    <tr><td>15</td><td>Mười lăm</td><td>Hàng đơn vị 5 sau "mười" đọc là "lăm", không phải "năm"</td></tr>
                    <tr><td>21</td><td>Hai mươi mốt</td><td>Số 1 sau "mươi" đọc là "mốt"</td></tr>
                    <tr><td>24</td><td>Hai mươi tư</td><td>Số 4 sau "mươi" đọc là "tư"; nhưng 14 vẫn là "mười bốn"</td></tr>
                    <tr><td>105</td><td>Một trăm lẻ năm</td><td>Hàng chục bằng 0 thì thêm "lẻ" (hoặc "linh")</td></tr>
                    <tr><td>1.005</td><td>Một nghìn không trăm lẻ năm</td><td>Nhóm sau thiếu hàng trăm vẫn phải đọc "không trăm"</td></tr>
                    <tr><td>1.000.005</td><td>Một triệu không trăm lẻ năm</td><td>Nhóm nghìn bằng 0 thì bỏ qua hẳn, không đọc "không nghìn"</td></tr>
                    <tr><td>50.000.000.000</td><td>Năm mươi tỷ đồng</td><td>Đơn vị theo chu kỳ nghìn – triệu – tỷ – nghìn tỷ – triệu tỷ…</td></tr>
                </tbody>
            </table>
            <ul class="nwv-legal">
                <li>Cách đọc trong công cụ bám theo quy ước phổ biến trên hóa đơn, chứng từ kế toán tại Việt Nam: đọc theo nhóm 3 chữ số từ phải sang trái, đơn vị chu kỳ là nghìn, triệu, tỷ.</li>
                <li>Khi ghi số tiền bằng chữ trên chứng từ, thông lệ là viết hoa chữ cái đầu tiên, các chữ sau viết thường, và kết thúc bằng "đồng" (số tròn thường ghi thêm "chẵn"). Công cụ hỗ trợ tối đa 27 chữ số — đủ cho mọi số tiền thực tế.</li>
                <li>Nút "Nghe đọc thử" dùng giọng đọc có sẵn trong trình duyệt của bạn nên chất giọng có thể khác nhau tùy thiết bị.</li>
            </ul>
        </div>
    </details>
</div>

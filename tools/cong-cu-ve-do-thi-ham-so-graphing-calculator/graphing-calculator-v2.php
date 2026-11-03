<div class="gr2-soft-wrapper">
  <div class="gr2-form">
    <label class="gr2-label" for="gr2Formula">Biểu thức hàm số</label>
    <div class="gr2-fnrow">
      <span class="gr2-prefix">f(x) =</span>
      <input type="text" id="gr2Formula" class="gr2-input gr2-fninput" value="x2 - 4x + 3" autocomplete="off" spellcheck="false" aria-label="Biểu thức hàm số">
      <input type="color" id="gr2Color" class="gr2-color" value="#e05a47" aria-label="Màu nét vẽ">
      <span id="gr2ColorHex" class="gr2-hex">#E05A47</span>
    </div>
    <div class="gr2-chips">
      <button type="button" class="gr2-chip" data-fn="x2 - 4x + 3">x² − 4x + 3</button>
      <button type="button" class="gr2-chip" data-fn="2x + 3">2x + 3</button>
      <button type="button" class="gr2-chip" data-fn="sin(x)">sin(x)</button>
      <button type="button" class="gr2-chip" data-fn="1/x">1/x</button>
      <button type="button" class="gr2-chip" data-fn="x^3 - 3x">x³ − 3x</button>
    </div>
    <p class="gr2-hint">Gõ 2x, x2, sin(2x), (x-1)(x+1) đều được; có thể nhập y = 2x + 3 hoặc f(x) = 2x + 3. Dấu thập phân chấm hoặc phẩy đều được.</p>

    <div class="gr2-grid2">
      <div>
        <label class="gr2-label" for="gr2XMin">X Min</label>
        <input type="text" id="gr2XMin" class="gr2-input" value="-10" inputmode="decimal" autocomplete="off" aria-label="X Min">
      </div>
      <div>
        <label class="gr2-label" for="gr2XMax">X Max</label>
        <input type="text" id="gr2XMax" class="gr2-input" value="10" inputmode="decimal" autocomplete="off" aria-label="X Max">
      </div>
      <div>
        <label class="gr2-label" for="gr2YMin">Y Min</label>
        <input type="text" id="gr2YMin" class="gr2-input" value="-10" inputmode="decimal" autocomplete="off" aria-label="Y Min">
      </div>
      <div>
        <label class="gr2-label" for="gr2YMax">Y Max</label>
        <input type="text" id="gr2YMax" class="gr2-input" value="10" inputmode="decimal" autocomplete="off" aria-label="Y Max">
      </div>
    </div>

    <div class="gr2-toolrow">
      <div class="gr2-seg" role="group" aria-label="Đơn vị góc">
        <button type="button" class="gr2-segbtn active" id="gr2Rad" aria-pressed="true">Radian</button>
        <button type="button" class="gr2-segbtn" id="gr2Deg" aria-pressed="false">Độ</button>
      </div>
      <button type="button" class="gr2-btn" id="gr2ZoomOut" title="Thu nhỏ khung nhìn">− Thu nhỏ</button>
      <button type="button" class="gr2-btn" id="gr2ZoomIn" title="Phóng to khung nhìn">+ Phóng to</button>
      <button type="button" class="gr2-btn" id="gr2Fit" title="Co khoảng Y vừa với đồ thị trong khung X hiện tại">Vừa đồ thị</button>
      <button type="button" class="gr2-btn" id="gr2Reset">Đặt lại khung hình</button>
    </div>
    <p class="gr2-hint">Kéo trên đồ thị để dời khung nhìn, lăn chuột để phóng to/thu nhỏ tại điểm trỏ. Di chuột (hoặc chạm) lên đường cong để đọc tọa độ.</p>
  </div>

  <div class="gr2-error hidden" id="gr2Error"></div>
  <p class="gr2-compiled" id="gr2Compiled"></p>

  <div class="gr2-canvaswrap">
    <canvas id="gr2Canvas" class="gr2-canvas" width="900" height="420"></canvas>
  </div>
  <p class="gr2-trace" id="gr2Trace">Di chuột lên đồ thị để đọc tọa độ điểm.</p>

  <div class="gr2-result" id="gr2Result">
    <p class="gr2-points" id="gr2Points"></p>
  </div>

  <details class="gr2-adv">
    <summary>Cách viết tắt, đơn vị góc và giới hạn</summary>
    <p class="gr2-hint">Cách viết tắt được chuẩn hóa: x2 thành x^2, 2x thành 2*x, (x-1)(x+1) thành (x-1)*(x+1), tiền tố y = hoặc f(x) = được bỏ qua, dấu phẩy thập phân được hiểu như dấu chấm. Hàm log và ln đều là logarit tự nhiên; log10 là logarit cơ số 10. Ở chế độ Độ, các hàm sin, cos, tan nhận góc theo độ và asin, acos, atan trả về độ; mặc định là Radian như toán học phổ thông dùng khi khảo sát hàm lượng giác theo biến số thực.</p>
    <p class="gr2-hint">Nghiệm và cực trị hiển thị là giá trị gần đúng, tìm bằng cách quét mẫu rồi thu hẹp khoảng (chia đôi cho nghiệm, tinh chỉnh parabol cho cực trị) — dùng để đối chiếu hình, không thay cho việc giải chính xác bằng tay. Đồ thị là đường nối các điểm lấy mẫu nên gần điểm gián đoạn hoặc vùng biến thiên rất nhanh, hình có thể lệch khỏi đường cong thật; ngoài khung trục, hàm vẫn tồn tại nhưng không nhìn thấy.</p>
  </details>

  <div class="gr2-export">
    <label class="gr2-check"><input type="checkbox" id="gr2ChkFormula" checked> <span>Kèm biểu thức hàm số f(x)</span></label>
    <label class="gr2-check"><input type="checkbox" id="gr2ChkGrid" checked> <span>Kèm thông tin hệ trục (X, Y)</span></label>
    <div class="gr2-actions">
      <button type="button" class="gr2-btn gr2-btn-primary" id="gr2Download">Tải ảnh PNG</button>
      <button type="button" class="gr2-btn" id="gr2Copy">Sao chép biểu thức</button>
    </div>
  </div>
  <div class="gr2-toast" id="gr2Toast">Đã sao chép</div>
</div>

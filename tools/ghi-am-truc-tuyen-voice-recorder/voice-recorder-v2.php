<div class="vr2-soft-wrapper">
  <div class="vr2-card vr2-record-card">
    <div class="vr2-status-row">
      <span class="vr2-status" id="vr2-status">Chưa ghi âm</span>
      <span class="vr2-timer" id="vr2-timer">00:00</span>
    </div>
    <canvas class="vr2-wave" id="vr2-wave" width="640" height="120" aria-label="Sóng âm trực tiếp"></canvas>
    <p class="vr2-note" id="vr2-live-note">Nhấn “Bắt đầu ghi” rồi nói vào micro. Sóng âm chạy khi micro nhận được tiếng.</p>
    <div class="vr2-controls">
      <button type="button" class="vr2-btn vr2-btn-primary" id="vr2-start">🎤 Bắt đầu ghi</button>
      <button type="button" class="vr2-btn" id="vr2-pause" disabled>⏸ Tạm dừng</button>
      <button type="button" class="vr2-btn vr2-btn-danger" id="vr2-stop" disabled>⏹ Dừng lại</button>
      <button type="button" class="vr2-btn vr2-btn-ghost" id="vr2-cancel" hidden>✕ Hủy bản này</button>
    </div>
    <p class="vr2-error" id="vr2-error" hidden></p>
    <details class="vr2-details">
      <summary>Cài đặt micro</summary>
      <label class="vr2-label" for="vr2-mic">Micro</label>
      <select class="vr2-input" id="vr2-mic">
        <option value="">Micro mặc định của thiết bị</option>
      </select>
      <label class="vr2-check"><input type="checkbox" id="vr2-echo" checked> Khử tiếng vang</label>
      <label class="vr2-check"><input type="checkbox" id="vr2-noise" checked> Lọc nhiễu nền</label>
      <label class="vr2-check"><input type="checkbox" id="vr2-gain" checked> Tự chỉnh âm lượng</label>
      <p class="vr2-note">Danh sách micro hiện đầy đủ sau khi bạn cho phép micro lần đầu. Bản ghi chỉ xử lý trên trình duyệt, không tải lên máy chủ.</p>
    </details>
  </div>

  <div class="vr2-card vr2-result" id="vr2-result" hidden>
    <p class="vr2-label">✅ Đã thu âm xong! Nghe thử hoặc tải về nhé.</p>
    <audio class="vr2-player" id="vr2-player" controls></audio>
    <p class="vr2-meta" id="vr2-meta"></p>
    <label class="vr2-label" for="vr2-filename">Tên tệp tải xuống</label>
    <input class="vr2-input" id="vr2-filename" type="text" value="ghi-am" maxlength="80">
    <label class="vr2-label">Định dạng tải xuống</label>
    <div class="vr2-seg" role="group" aria-label="Định dạng tải xuống">
      <button type="button" class="vr2-seg-btn is-active" data-vr2-format="orig">File gốc</button>
      <button type="button" class="vr2-seg-btn" data-vr2-format="wav">WAV 16-bit</button>
    </div>
    <label class="vr2-check"><input type="checkbox" id="vr2-trim"> Cắt khoảng lặng ở đầu và cuối (chỉ áp dụng khi xuất WAV)</label>
    <div class="vr2-row">
      <button type="button" class="vr2-btn vr2-btn-primary" id="vr2-download">⬇ Tải xuống</button>
      <button type="button" class="vr2-btn" id="vr2-again">🎤 Ghi bản mới</button>
    </div>
    <p class="vr2-note">Hãy tải bản ghi cần giữ trước khi nhấn “Ghi bản mới” hoặc đóng trang, vì bản cũ sẽ bị thay thế.</p>
  </div>
</div>

<div class="ibanp-soft-wrapper">
    <div class="ibanp-soft-header">
        <h2>🏦 Kiểm Tra & Phân Tích Mã IBAN</h2>
        <p>Xác thực tính hợp lệ bằng thuật toán MOD 97 (ISO 7064) và bóc tách các thành phần của số tài khoản IBAN quốc tế.</p>
    </div>

    <!-- Cảnh báo bảo mật -->
    <div class="ibanp-alert-box">
        <span class="ibanp-alert-icon">🔒</span>
        <div class="ibanp-alert-content">
            <strong>RIÊNG TƯ TUYỆT ĐỐI:</strong> 
            Mã IBAN của bạn <b>KHÔNG</b> bị gửi lên bất kỳ máy chủ nào. Mọi thao tác xác thực và phân tích toán học được thực hiện 100% Offline trên trình duyệt của bạn.
        </div>
    </div>

    <div class="ibanp-body">
        <div class="ibanp-main-layout">
            
            <!-- CỘT TRÁI: Đầu vào (Input) -->
            <div class="ibanp-col ibanp-col-left">
                <div class="ibanp-card ibanp-bg-yellow">
                    <div class="ibanp-flex-between" style="margin-bottom: 15px;">
                        <h3 class="ibanp-card-title" style="margin: 0; border: none; padding: 0;">📥 Số Tài Khoản IBAN (Input)</h3>
                        <button id="ibanp-btn-clear" class="ibanp-btn-small">🧹 Xóa</button>
                    </div>
                    
                    <div class="ibanp-group" style="flex: 1; display: flex; flex-direction: column;">
                        <input type="text" id="ibanp-input-number" class="ibanp-input-huge" placeholder="Nhập mã IBAN vào đây (Ví dụ: GB82 NATW...)" autofocus autocomplete="off">
                        <div class="ibanp-hint">Có thể nhập dính liền hoặc cách nhau bởi khoảng trắng. Dữ liệu sẽ được tự động dọn dẹp.</div>
                    </div>
                </div>

                <div class="ibanp-info-box">
                    <h4>💡 IBAN là gì?</h4>
                    <p><b>I</b>nternational <b>B</b>ank <b>A</b>ccount <b>N</b>umber là số tài khoản ngân hàng tiêu chuẩn quốc tế dùng để chuyển tiền xuyên biên giới. Nó giúp giảm thiểu rủi ro chuyển nhầm nhờ tích hợp 2 chữ số kiểm tra (Check Digits) thuật toán MOD 97.</p>
                </div>
            </div>

            <!-- CỘT PHẢI: Kết quả (Output) -->
            <div class="ibanp-col ibanp-col-right">
                <div class="ibanp-card ibanp-bg-white" id="ibanp-result-card">
                    <div class="ibanp-flex-between" style="border-bottom: 2px dashed #111; padding-bottom: 10px; margin-bottom: 15px;">
                        <h3 class="ibanp-card-title" style="margin: 0; border: none; padding: 0;">🚀 Kết Quả Xác Thực</h3>
                        <span class="ibanp-badge" id="ibanp-status-badge">Chờ nhập IBAN...</span>
                    </div>
                    
                    <!-- Lưới thông tin -->
                    <div class="ibanp-details-grid" id="ibanp-details-grid" style="opacity: 0.3; pointer-events: none;">
                        
                        <!-- Quốc gia -->
                        <div class="ibanp-detail-item">
                            <span class="ibanp-detail-lbl">Quốc Gia (Country)</span>
                            <div class="ibanp-detail-val" id="ibanp-out-country">--</div>
                        </div>

                        <!-- Check Digits -->
                        <div class="ibanp-detail-item">
                            <span class="ibanp-detail-lbl">Số Kiểm Tra (Check Digits)</span>
                            <div class="ibanp-detail-val">
                                <span id="ibanp-out-check-tag" class="ibanp-check-tag">--</span>
                            </div>
                        </div>

                        <!-- BBAN (Full width) -->
                        <div class="ibanp-detail-item" style="grid-column: span 2;">
                            <span class="ibanp-detail-lbl">Mã Tài Khoản Cơ Bản (BBAN)</span>
                            <div class="ibanp-detail-val" id="ibanp-out-bban" style="font-family: monospace; letter-spacing: 2px;">--</div>
                        </div>

                        <!-- Độ dài -->
                        <div class="ibanp-detail-item">
                            <span class="ibanp-detail-lbl">Độ dài tiêu chuẩn</span>
                            <div class="ibanp-detail-val" id="ibanp-out-length">-- ký tự</div>
                        </div>

                        <!-- Trạng thái thuật toán -->
                        <div class="ibanp-detail-item">
                            <span class="ibanp-detail-lbl">Thuật toán MOD 97</span>
                            <div class="ibanp-detail-val" id="ibanp-out-mod97">--</div>
                        </div>

                    </div>
                    
                    <!-- Khung Format Đẹp -->
                    <div class="ibanp-format-box" id="ibanp-format-box" style="display: none;">
                        <label class="ibanp-detail-lbl">Định dạng dễ đọc (Print Format):</label>
                        <div class="ibanp-input-wrap">
                            <input type="text" id="ibanp-out-format" class="ibanp-text-input" readonly placeholder="--">
                            <button class="ibanp-btn-copy" data-target="ibanp-out-format">📋 COPY</button>
                        </div>
                    </div>

                </div>
            </div>

        </div> 
    </div>
</div>
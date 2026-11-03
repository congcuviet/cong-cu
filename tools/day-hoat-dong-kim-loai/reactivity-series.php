<link rel="stylesheet" href="/wp-content/themes/bricks-child/reactivity-series.css?v=1.0">

<div class="rs-neo-wrapper">
    <div class="rs-header">
        <h2>⚡ Dãy Hoạt Động Kim Loại & Dự Đoán Phản Ứng</h2>
        <p>Di chuột vào kim loại để xem khả năng đẩy. Dùng bộ mô phỏng để kiểm tra phản ứng.</p>
    </div>

    <!-- CÔNG TẮC IUPAC -->
    <div class="rs-controls">
        <div class="rs-toggle-wrapper">
            <span class="toggle-label active">Tên SGK Cũ</span>
            <label class="rs-switch">
                <input type="checkbox" id="rsIupacToggle">
                <span class="rs-slider"></span>
            </label>
            <span class="toggle-label">IUPAC (Mới)</span>
        </div>
    </div>

    <!-- PHẦN 1: THANH TIMELINE TƯƠNG TÁC -->
    <div class="rs-timeline-section">
        <div class="rs-mnemonic" id="rsMnemonic">
            "Khi Nào Ba Cần May Áo Giáp Sắt Nhớ Sang Phố Hỏi Cửa Hàng Á Phi Âu"
        </div>
        
        <div class="rs-timeline-container">
            <!-- Vạch phân vùng -->
            <div class="rs-zones">
                <div class="rs-zone zone-1">💧 Tác dụng với Nước lạnh</div>
                <div class="rs-zone zone-2">🧪 Tác dụng với Axit (HCl, H₂SO₄ loãng)</div>
                <div class="rs-zone zone-3">🛡️ Không tác dụng với Axit loãng</div>
            </div>

            <!-- Trục kim loại (JS render) -->
            <div class="rs-track" id="rsTrack"></div>
        </div>

        <!-- Tooltip nổi khi Hover -->
        <div id="rsTooltip" class="rs-tooltip"></div>
    </div>

    <hr class="neo-divider">

    <!-- PHẦN 2: BỘ DỰ ĐOÁN PHẢN ỨNG (REACTION PREDICTOR) -->
    <div class="rs-predictor-section">
        <h3 class="section-title">🔮 Bộ Mô Phỏng Phản Ứng (Predictor)</h3>
        
        <div class="predictor-box">
            <div class="predictor-inputs">
                <div class="input-group">
                    <label>Kim loại thả vào:</label>
                    <select id="predMetal" class="rs-neo-select">
                        <!-- JS Render -->
                    </select>
                </div>
                
                <div class="predictor-plus">➕</div>

                <div class="input-group">
                    <label>Môi trường / Dung dịch:</label>
                    <select id="predSolution" class="rs-neo-select">
                        <option value="H2O">Nước cất (H₂O)</option>
                        <option value="H">Axit loãng (HCl, H₂SO₄ loãng)</option>
                        <option value="Mg">Dung dịch muối Magie (Mg²⁺)</option>
                        <option value="Al">Dung dịch muối Nhôm (Al³⁺)</option>
                        <option value="Zn">Dung dịch muối Kẽm (Zn²⁺)</option>
                        <option value="Fe">Dung dịch muối Sắt II (Fe²⁺)</option>
                        <option value="Pb">Dung dịch muối Chì (Pb²⁺)</option>
                        <option value="Cu" selected>Dung dịch muối Đồng (Cu²⁺)</option>
                        <option value="Ag">Dung dịch muối Bạc (Ag⁺)</option>
                    </select>
                </div>
            </div>

            <button id="btnPredict" class="rs-btn-predict">KIỂM TRA PHẢN ỨNG 🚀</button>

            <!-- Khung kết quả -->
            <div id="predResult" class="pred-result hidden"></div>
        </div>
    </div>
</div>

<script src="/wp-content/themes/bricks-child/reactivity-series.js?v=1.0"></script>
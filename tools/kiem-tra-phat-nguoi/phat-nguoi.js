document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('pnForm');
    const inputPlate = document.getElementById('pnPlate');
    const errorBox = document.getElementById('pnError');
    
    const searchCard = document.getElementById('pnSearchCard');
    const loadingArea = document.getElementById('pnLoading');
    const resultArea = document.getElementById('pnResultArea');
    const btnReset = document.getElementById('pnBtnReset');

    function showError(msg) {
        errorBox.style.display = 'block';
        errorBox.innerText = "❌ " + msg;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        errorBox.style.display = 'none';
        
        const plate = inputPlate.value.trim();
        const type = document.querySelector('input[name="vehicle_type"]:checked').value;

        if (!plate) {
            showError('Vui lòng nhập biển số xe!');
            return;
        }

        // Chuyển giao diện sang loading
        searchCard.style.display = 'none';
        loadingArea.style.display = 'block';

        const formData = new FormData();
        formData.append('license_plate', plate);
        formData.append('vehicle_type', type);

        // Gọi API Proxy (nằm ngoài thư mục cong-cu)
        fetch('/wp-content/themes/bricks-child/api-proxy.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            loadingArea.style.display = 'none';

            if (data.error) {
                searchCard.style.display = 'block';
                showError(data.error);
                return;
            }

            // Bóc tách JSON chính xác (Fix lỗi undefined)
            let realData = data;
            if (data.data && typeof data.data === 'object') {
                realData = data.data;
            }

            renderResult(realData);
        })
        .catch(err => {
            loadingArea.style.display = 'none';
            searchCard.style.display = 'block';
            showError('Lỗi kết nối máy chủ cục bộ!');
            console.error(err);
        });
    });

    function renderResult(data) {
        resultArea.style.display = 'block';
        
        // Cập nhật Header
        document.getElementById('resPlate').innerText = data.plate_formatted || data.plate || 'Không xác định';
        document.getElementById('resUpdate').innerText = "Cập nhật lúc: " + (data.last_updated || 'Không rõ');

        // Cập nhật Thống kê
        const total = data.total_violations || 0;
        document.getElementById('statTotal').innerText = total;
        document.getElementById('statUnpaid').innerText = data.unpaid_count || 0;
        document.getElementById('statPaid').innerText = data.paid_count || 0;

        const cleanDiv = document.getElementById('pnClean');
        const vioListDiv = document.getElementById('pnViolations');

        if (total === 0) {
            cleanDiv.style.display = 'block';
            vioListDiv.style.display = 'none';
        } else {
            cleanDiv.style.display = 'none';
            vioListDiv.style.display = 'block';
            vioListDiv.innerHTML = ''; 

            const violations = data.violations || [];
            violations.forEach(v => {
                let badgeClass = v.status === 'paid' ? 'badge-green' : 'badge-red';
                let statusText = v.status_text || (v.status === 'paid' ? 'Đã xử phạt' : 'Chưa xử phạt');

                const html = `
                    <div class="pn-violation-item">
                        <div class="pn-badge ${badgeClass}">${statusText}</div>
                        <div class="pn-v-title">${v.title || 'Lỗi vi phạm'}</div>
                        
                        <div class="pn-v-row">
                            <div class="pn-v-label">⏰ Thời gian:</div>
                            <div class="pn-v-val">${v.time || 'N/A'}</div>
                        </div>
                        <div class="pn-v-row">
                            <div class="pn-v-label">📍 Địa điểm:</div>
                            <div class="pn-v-val">${v.location || 'N/A'}</div>
                        </div>
                        <div class="pn-v-row">
                            <div class="pn-v-label">👮 Đơn vị XL:</div>
                            <div class="pn-v-val">${v.unit || 'N/A'}</div>
                        </div>
                        <div class="pn-v-row">
                            <div class="pn-v-label">🏢 Nơi giải quyết:</div>
                            <div class="pn-v-val">${(v.resolution_location && v.resolution_location.length > 0) ? v.resolution_location.join('<br>') : 'N/A'}</div>
                        </div>
                    </div>
                `;
                vioListDiv.insertAdjacentHTML('beforeend', html);
            });
        }
    }

    // Nút "Tra cứu lại"
    btnReset.addEventListener('click', function() {
        resultArea.style.display = 'none';
        searchCard.style.display = 'block';
        inputPlate.value = '';
        inputPlate.focus();
    });
});
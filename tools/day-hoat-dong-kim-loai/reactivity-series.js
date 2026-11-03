document.addEventListener('DOMContentLoaded', () => {
    const rsIupacToggle = document.getElementById('rsIupacToggle');
    const rsTrack = document.getElementById('rsTrack');
    const rsTooltip = document.getElementById('rsTooltip');
    
    const predMetal = document.getElementById('predMetal');
    const predSolution = document.getElementById('predSolution');
    const btnPredict = document.getElementById('btnPredict');
    const predResult = document.getElementById('predResult');

    let isIUPAC = false;

    // ==========================================
    // DỮ LIỆU DÃY HOẠT ĐỘNG KIM LOẠI
    // ==========================================
    // Chuẩn: K, Na, Ba, Ca, Mg, Al, Zn, Fe, Ni, Sn, Pb, H, Cu, Hg, Ag, Pt, Au
    const reactivitySeries = [
        { id: "K", vi: "Kali", en: "Potassium", zone: 1 },
        { id: "Na", vi: "Natri", en: "Sodium", zone: 1 },
        { id: "Ba", vi: "Bari", en: "Barium", zone: 1 },
        { id: "Ca", vi: "Canxi", en: "Calcium", zone: 1 },
        { id: "Mg", vi: "Magie", en: "Magnesium", zone: 2 },
        { id: "Al", vi: "Nhôm", en: "Aluminium", zone: 2 },
        { id: "Zn", vi: "Kẽm", en: "Zinc", zone: 2 },
        { id: "Fe", vi: "Sắt", en: "Iron", zone: 2 },
        { id: "Ni", vi: "Niken", en: "Nickel", zone: 2 },
        { id: "Sn", vi: "Thiếc", en: "Tin", zone: 2 },
        { id: "Pb", vi: "Chì", en: "Lead", zone: 2 },
        { id: "H", vi: "Hiđro", en: "Hydrogen", zone: 3, isRef: true }, // Mốc Hydro
        { id: "Cu", vi: "Đồng", en: "Copper", zone: 4 },
        { id: "Hg", vi: "Thủy ngân", en: "Mercury", zone: 4 },
        { id: "Ag", vi: "Bạc", en: "Silver", zone: 4 },
        { id: "Pt", vi: "Bạch kim", en: "Platinum", zone: 4 },
        { id: "Au", vi: "Vàng", en: "Gold", zone: 4 }
    ];

    // ==========================================
    // RENDER TIMELINE VÀ DROPDOWN PREDICTOR
    // ==========================================
    const renderUI = () => {
        rsTrack.innerHTML = '';
        predMetal.innerHTML = '';

        reactivitySeries.forEach((el, index) => {
            // 1. Render Timeline Node
            let node = document.createElement('div');
            node.className = `rs-metal-node ${el.isRef ? 'ref-node' : ''}`;
            node.dataset.index = index;
            
            let name = isIUPAC ? el.en : el.vi;
            node.innerHTML = `
                <span class="rs-sym">${el.id}</span>
                <span class="rs-name">${name}</span>
            `;

            // Hover Events
            node.addEventListener('mouseenter', (e) => handleHover(index, el, name, e));
            node.addEventListener('mousemove', (e) => {
                rsTooltip.style.left = e.clientX + 'px';
                rsTooltip.style.top = e.clientY + 'px';
            });
            node.addEventListener('mouseleave', () => {
                rsTooltip.classList.remove('visible');
                document.querySelectorAll('.rs-metal-node').forEach(n => n.classList.remove('highlight'));
            });

            rsTrack.appendChild(node);

            // 2. Populate Dropdown (Bỏ Hydro ra khỏi danh sách thả vào)
            if (!el.isRef) {
                let opt = document.createElement('option');
                opt.value = el.id;
                opt.innerText = `${name} (${el.id})`;
                predMetal.appendChild(opt);
            }
        });

        // Set default cho select Sắt
        predMetal.value = "Fe";
    };

    // ==========================================
    // LOGIC HOVER TIMELINE (Làm mờ & Tooltip)
    // ==========================================
    const handleHover = (hoverIndex, el, name, e) => {
        if (el.isRef) {
            rsTooltip.innerHTML = `<h4>💧 ${name} (${el.id})</h4><p>Mốc phân chia. Các kim loại đứng trước H đẩy được khí H₂ ra khỏi dung dịch axit loãng.</p>`;
        } else {
            // Highlight các kim loại yếu hơn (đứng sau)
            let weakerMetals = [];
            const nodes = document.querySelectorAll('.rs-metal-node');
            
            for (let i = hoverIndex + 1; i < reactivitySeries.length; i++) {
                if (!reactivitySeries[i].isRef) {
                    weakerMetals.push(reactivitySeries[i].id);
                    nodes[i].classList.add('highlight'); // Giữ sáng
                }
            }

            let tooltipHTML = `<h4>⚙️ ${name} (${el.id})</h4>`;
            if (el.zone === 1) {
                tooltipHTML += `<p>🔥 Phản ứng mãnh liệt với nước ở nhiệt độ thường.</p>`;
            } else if (weakerMetals.length > 0) {
                tooltipHTML += `<p>✅ Đẩy được các kim loại yếu hơn ra khỏi dung dịch muối: <b>${weakerMetals.join(', ')}</b></p>`;
            } else {
                tooltipHTML += `<p>❌ Kim loại yếu nhất, không đẩy được ai.</p>`;
            }
            rsTooltip.innerHTML = tooltipHTML;
        }

        rsTooltip.style.left = e.clientX + 'px';
        rsTooltip.style.top = e.clientY + 'px';
        rsTooltip.classList.add('visible');
    };

    // ==========================================
    // SỰ KIỆN ĐỔI IUPAC
    // ==========================================
    rsIupacToggle.addEventListener('change', (e) => {
        isIUPAC = e.target.checked;
        const labels = document.querySelectorAll('.toggle-label');
        if (isIUPAC) {
            labels[0].classList.remove('active'); labels[1].classList.add('active');
        } else {
            labels[0].classList.add('active'); labels[1].classList.remove('active');
        }
        
        // Lưu lại giá trị select hiện tại trước khi re-render
        let currentSelectedMetal = predMetal.value;
        renderUI();
        predMetal.value = currentSelectedMetal;
    });

    // ==========================================
    // BỘ MÔ PHỎNG PHẢN ỨNG (PREDICTOR LOGIC)
    // ==========================================
    btnPredict.addEventListener('click', () => {
        const metalId = predMetal.value;
        const solId = predSolution.value;
        
        const mIndex = reactivitySeries.findIndex(e => e.id === metalId);
        const metal = reactivitySeries[mIndex];
        const mName = isIUPAC ? metal.en : metal.vi;

        predResult.className = 'pred-result'; // Reset
        let resultHTML = "";

        // TH1: Tác dụng với Nước
        if (solId === "H2O") {
            if (metal.zone === 1) {
                resultHTML = `✅ <b>Phản ứng mãnh liệt:</b> ${mName} tác dụng với Nước ngay ở nhiệt độ thường tạo ra dung dịch Kiềm và sủi bọt khí H₂.`;
                predResult.classList.add('res-yes');
            } else {
                resultHTML = `❌ <b>Không phản ứng:</b> ${mName} không tác dụng với nước lạnh.`;
                predResult.classList.add('res-no');
            }
        } 
        // TH2: Tác dụng với Axit (H+)
        else if (solId === "H") {
            let hIndex = reactivitySeries.findIndex(e => e.id === "H");
            if (mIndex < hIndex) {
                resultHTML = `✅ <b>Có phản ứng:</b> ${mName} đứng trước H trong dãy hoạt động, nên đẩy được khí H₂ bay ra khỏi dung dịch axit loãng.`;
                predResult.classList.add('res-yes');
            } else {
                resultHTML = `❌ <b>Không phản ứng:</b> ${mName} đứng sau H, không thể đẩy H₂ ra khỏi axit loãng (HCl, H₂SO₄ loãng).`;
                predResult.classList.add('res-no');
            }
        }
        // TH3: Kim loại tác dụng Dung dịch Muối
        else {
            const targetIndex = reactivitySeries.findIndex(e => e.id === solId);
            const targetMetal = reactivitySeries[targetIndex];
            const targetName = isIUPAC ? targetMetal.en : targetMetal.vi;

            if (metal.id === targetMetal.id) {
                resultHTML = `⚠️ <b>Vô nghĩa:</b> Không ai lấy kim loại thả vào dung dịch muối của chính nó cả bro ơi!`;
                predResult.classList.add('res-warn');
            }
            // Bẫy kiến thức: K, Na, Ba, Ca thả vào muối
            else if (metal.zone === 1) {
                resultHTML = `⚠️ <b>Phản ứng phức tạp:</b> <br>
                ${mName} <b>không</b> trực tiếp đẩy ${targetName} ra khỏi muối!<br>
                Thay vào đó, ${mName} sẽ tác dụng với NƯỚC trong dung dịch trước để tạo ra dung dịch kiềm, sau đó dung dịch kiềm mới tác dụng với muối tạo kết tủa.`;
                predResult.classList.add('res-warn');
            } 
            // Phản ứng thế tiêu chuẩn
            else if (mIndex < targetIndex) {
                resultHTML = `✅ <b>Có phản ứng thế:</b> <br>${mName} hoạt động mạnh hơn (đứng trước) ${targetName}. <br>👉 ${mName} sẽ đẩy ${targetName} ra khỏi dung dịch muối và tạo thành kim loại bám vào thanh ${mName}.`;
                predResult.classList.add('res-yes');
            } 
            // Đứng sau (Yếu hơn)
            else {
                resultHTML = `❌ <b>Không phản ứng:</b> <br>${mName} hoạt động yếu hơn (đứng sau) ${targetName} nên không thể đẩy được ${targetName} ra khỏi muối.`;
                predResult.classList.add('res-no');
            }
        }

        predResult.innerHTML = resultHTML;
    });

    // Khởi chạy
    renderUI();
});
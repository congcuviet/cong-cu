document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('colorSearchInput');
    const btnClear = document.getElementById('btnColorClear');
    const colorGrid = document.getElementById('colorGrid');
    const colorEmpty = document.getElementById('colorEmpty');
    const filterBtns = document.querySelectorAll('.filter-badge');
    const staticDataArea = document.getElementById('staticDataArea');

    let advancedColorDB = []; // Mảng chứa data cào từ JSON nâng cao

    // ==========================================
    // TẢI DATA NÂNG CAO (TỪ SUBSTANCES_DB.JSON)
    // ==========================================
    fetch('/wp-content/themes/bricks-child/tai-nguyen/substances_db.json')
        .then(res => res.json())
        .then(data => {
            for (let key in data) {
                let sub = data[key];
                // Chỉ lấy những chất có thông tin màu sắc rõ ràng
                if (sub.color && sub.color.trim() !== "") {
                    let stateInfo = sub.state ? ` (${sub.state})` : '';
                    advancedColorDB.push({
                        f: sub.formula || key,
                        name: sub.name || '',
                        d: `${sub.color}${stateInfo}`,
                        grp: "Dữ liệu cào tự động",
                        typ: "nangcao"
                    });
                }
            }
            console.log(`✅ Đã nạp ${advancedColorDB.length} chất có màu sắc từ Data nâng cao!`);
        })
        .catch(err => console.error("❌ Lỗi tải Data màu nâng cao:", err));


    // ==========================================
    // DATABASE 107 CHẤT CƠ BẢN (SGK)
    // ==========================================
    const colorDB = [
        { f: "KMnO4", d: "Tinh thể màu đỏ tím", grp: "Kim loại kiềm và kiềm thổ", typ: "muoi" },
        { f: "K2MnO4", d: "Lục thẫm", grp: "Kim loại kiềm và kiềm thổ", typ: "muoi" },
        { f: "NaCl", d: "Không màu (muối ăn màu trắng do lẫn MgCl2, CaCl2)", grp: "Kim loại kiềm và kiềm thổ", typ: "muoi" },
        { f: "Ca(OH)2", d: "Ít tan, kết tủa trắng", grp: "Kim loại kiềm và kiềm thổ", typ: "muoi" },
        { f: "CaC2O4", d: "Trắng", grp: "Kim loại kiềm và kiềm thổ", typ: "muoi" },
        { f: "Al2O3", d: "Màu trắng", grp: "Nhôm", typ: "muoi" },
        { f: "AlCl3", d: "Dung dịch không màu, tinh thể màu trắng (thường ngả vàng nhạt do lẫn FeCl3)", grp: "Nhôm", typ: "muoi" },
        { f: "Al(OH)3", d: "Kết tủa trắng", grp: "Nhôm", typ: "muoi" },
        { f: "Al2(SO4)3", d: "Màu trắng", grp: "Nhôm", typ: "muoi" },
        { f: "Fe", d: "Màu trắng xám", grp: "Sắt", typ: "kimloai" },
        { f: "FeS", d: "Màu đen", grp: "Sắt", typ: "muoi" },
        { f: "Fe(OH)2", d: "Kết tủa trắng xanh", grp: "Sắt", typ: "muoi" },
        { f: "Fe(OH)3", d: "Nâu đỏ, kết tủa nâu đỏ", grp: "Sắt", typ: "muoi" },
        { f: "FeCl2", d: "Dung dịch lục nhạt", grp: "Sắt", typ: "muoi" },
        { f: "Fe3O4", d: "Rắn màu nâu đen", grp: "Sắt", typ: "muoi" },
        { f: "FeCl3", d: "Dung dịch vàng nâu", grp: "Sắt", typ: "muoi" },
        { f: "Fe2O3", d: "Đỏ", grp: "Sắt", typ: "muoi" },
        { f: "FeO", d: "Đen", grp: "Sắt", typ: "muoi" },
        { f: "FeSO4.7H2O", d: "Xanh lục", grp: "Sắt", typ: "muoi" },
        { f: "Fe(SCN)3", d: "Đỏ máu", grp: "Sắt", typ: "muoi" },
        { f: "Cu", d: "Màu đỏ", grp: "Đồng", typ: "kimloai" },
        { f: "Cu(NO3)2", d: "Dung dịch xanh lam", grp: "Đồng", typ: "muoi" },
        { f: "CuCl2", d: "Tinh thể có màu nâu, dung dịch xanh lá cây", grp: "Đồng", typ: "muoi" },
        { f: "CuSO4", d: "Tinh thể khan trắng, tinh thể ngậm nước & dung dịch xanh lam", grp: "Đồng", typ: "muoi" },
        { f: "Cu2O", d: "Đỏ gạch", grp: "Đồng", typ: "muoi" },
        { f: "Cu(OH)2", d: "Kết tủa xanh lơ (xanh da trời)", grp: "Đồng", typ: "muoi" },
        { f: "CuO", d: "Màu đen", grp: "Đồng", typ: "muoi" },
        { f: "Phức Cu2+", d: "Luôn màu xanh", grp: "Đồng", typ: "ion" },
        { f: "MnCl2", d: "Dung dịch: xanh lục; tinh thể: đỏ nhạt", grp: "Mangan", typ: "muoi" },
        { f: "MnO2", d: "Kết tủa màu đen", grp: "Mangan", typ: "muoi" },
        { f: "Mn(OH)4", d: "Nâu", grp: "Mangan", typ: "muoi" },
        { f: "ZnCl2", d: "Bột trắng", grp: "Kẽm", typ: "muoi" },
        { f: "Zn3P2", d: "Tinh thể nâu xám", grp: "Kẽm", typ: "muoi" },
        { f: "ZnSO4", d: "Dung dịch không màu", grp: "Kẽm", typ: "muoi" },
        { f: "CrO3", d: "Đỏ sẫm", grp: "Crom", typ: "muoi" },
        { f: "Cr2O3", d: "Màu lục", grp: "Crom", typ: "muoi" },
        { f: "CrCl2", d: "Lục sẫm", grp: "Crom", typ: "muoi" },
        { f: "K2Cr2O7", d: "Da cam", grp: "Crom", typ: "muoi" },
        { f: "K2CrO4", d: "Vàng cam", grp: "Crom", typ: "muoi" },
        { f: "Ag3PO4", d: "Kết tủa vàng", grp: "Bạc", typ: "muoi" },
        { f: "AgCl", d: "Trắng", grp: "Bạc", typ: "muoi" },
        { f: "Ag2CrO4", d: "Đỏ gạch", grp: "Bạc", typ: "muoi" },
        { f: "As2S3, As2S5", d: "Vàng", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "Mg(OH)2", d: "Kết tủa màu trắng", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "B12C3", d: "Bo cacbua màu đen", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "Ga(OH)3, GaOOH", d: "Kết tủa nhày, màu trắng", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "GaI3", d: "Màu vàng", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "InI3", d: "Màu vàng", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "In(OH)3", d: "Kết tủa nhày, màu trắng", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "Tl(OH)3, TlOOH", d: "Kết tủa nhày, màu hung đỏ", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "TlI3", d: "Màu đen", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "Tl2O", d: "Bột màu đen", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "TlOH", d: "Dạng tinh thể màu vàng", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "PbI2", d: "Vàng tươi, tan nhiều trong nước nóng", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "Au2O3", d: "Nâu đen", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "Hg2I2", d: "Vàng lục", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "Hg2CrO4", d: "Đỏ", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "P2O5", d: "Rắn màu trắng", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "NO", d: "Khí hóa nâu trong không khí", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "NH3", d: "Làm quỳ tím ẩm hóa xanh", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "Trinitrat toluen", d: "Kết tủa màu vàng", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "Trinitrat phenol", d: "Kết tủa màu trắng", grp: "Các hợp chất khác", typ: "muoi" },
        { f: "Li (Muối)", d: "Cháy ngọn lửa màu đỏ tía", grp: "Màu của ngọn lửa", typ: "ngonlua" },
        { f: "Na (Muối)", d: "Ngọn lửa màu vàng", grp: "Màu của ngọn lửa", typ: "ngonlua" },
        { f: "K (Muối)", d: "Ngọn lửa màu tím", grp: "Màu của ngọn lửa", typ: "ngonlua" },
        { f: "Ba (Muối)", d: "Cháy màu lục vàng", grp: "Màu của ngọn lửa", typ: "ngonlua" },
        { f: "Ca (Muối)", d: "Cháy ngọn lửa màu cam", grp: "Màu của ngọn lửa", typ: "ngonlua" },
        { f: "Li", d: "Màu trắng bạc", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Na", d: "Màu trắng bạc", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Mg", d: "Màu trắng bạc", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "K", d: "Màu trắng bạc khi bề mặt sạch", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Ca", d: "Màu xám bạc", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "B", d: "Vô định hình màu nâu, kim loại màu đen", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "N2", d: "Khí phân tử không màu", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "O2", d: "Khí không màu", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "F2", d: "Khí màu vàng lục nhạt", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Al", d: "Màu trắng bạc", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Si", d: "Màu xám sẫm ánh xanh", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "P", d: "Trắng, đỏ và đen", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "S", d: "Vàng chanh", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Cl2", d: "Khí màu vàng lục nhạt", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Iot", d: "Rắn màu tím than", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Cr", d: "Màu trắng bạc", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Mn", d: "Kim loại màu trắng bạc", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Fe", d: "Kim loại xám nhẹ ánh kim", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Cu", d: "Kim loại vàng ánh đỏ", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Zn", d: "Kim loại xám nhạt ánh lam", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Ba", d: "Kim loại trắng bạc", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Hg", d: "Kim loại trắng bạc", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Pb", d: "Kim loại trắng xám", grp: "Màu của các nguyên tố", typ: "kimloai" },
        { f: "Mn2+", d: "Vàng nhạt", grp: "Màu của ion trong dung dịch", typ: "ion" },
        { f: "Zn2+", d: "Trắng", grp: "Màu của ion trong dung dịch", typ: "ion" },
        { f: "Al3+", d: "Trắng", grp: "Màu của ion trong dung dịch", typ: "ion" },
        { f: "Cu2+", d: "Màu xanh lam", grp: "Màu của ion trong dung dịch", typ: "ion" },
        { f: "Cu+", d: "Màu đỏ gạch", grp: "Màu của ion trong dung dịch", typ: "ion" },
        { f: "Fe3+", d: "Màu đỏ nâu", grp: "Màu của ion trong dung dịch", typ: "ion" },
        { f: "Fe2+", d: "Màu trắng xanh", grp: "Màu của ion trong dung dịch", typ: "ion" },
        { f: "Ni2+", d: "Lục nhạt", grp: "Màu của ion trong dung dịch", typ: "ion" },
        { f: "Cr3+", d: "Màu lục", grp: "Màu của ion trong dung dịch", typ: "ion" },
        { f: "Co2+", d: "Màu hồng", grp: "Màu của ion trong dung dịch", typ: "ion" },
        { f: "MnO4-", d: "Màu tím", grp: "Màu của ion trong dung dịch", typ: "ion" },
        { f: "CrO4(2-)", d: "Màu vàng", grp: "Màu của ion trong dung dịch", typ: "ion" },
        { f: "Đen", d: "CuS, FeS, Fe2S3, Ag2S, PbS, HgS", grp: "Nhận dạng theo màu sắc", typ: "nhandang" },
        { f: "Hồng", d: "MnS", grp: "Nhận dạng theo màu sắc", typ: "nhandang" },
        { f: "Nâu", d: "SnS", grp: "Nhận dạng theo màu sắc", typ: "nhandang" },
        { f: "Trắng", d: "ZnS, BaSO4, SrSO4, CaSO4, PbSO4", grp: "Nhận dạng theo màu sắc", typ: "nhandang" },
        { f: "Vàng", d: "CdS, BaCrO4, PbCrO4", grp: "Nhận dạng theo màu sắc", typ: "nhandang" },
        { f: "Vàng nhạt", d: "AgI (không tan trong NH3)", grp: "Nhận dạng theo màu sắc", typ: "nhandang" }
    ];

    // Thuật toán ánh xạ màu Hex
    const getHexColor = (desc) => {
        const text = desc.toLowerCase();
        if (text.includes("đỏ tím") || text.includes("tím than") || text.includes("màu tím")) return "#8A2BE2";
        if (text.includes("đỏ sẫm") || text.includes("đỏ máu") || text.includes("đỏ tía")) return "#8B0000";
        if (text.includes("đỏ gạch") || text.includes("nâu đỏ") || text.includes("đỏ nâu") || text.includes("hung đỏ")) return "#A52A2A";
        if (text.includes("đỏ")) return "#FF3333";
        if (text.includes("xanh lam") || text.includes("xanh lơ") || text.includes("xanh da trời") || text.includes("ánh lam") || text.includes("hóa xanh")) return "#00BFFF";
        if (text.includes("lục thẫm") || text.includes("lục sẫm")) return "#006400";
        if (text.includes("vàng lục") || text.includes("lục vàng")) return "#ADFF2F";
        if (text.includes("xanh lục") || text.includes("màu lục") || text.includes("lục nhạt") || text.includes("lá cây")) return "#32CD32";
        if (text.includes("da cam") || text.includes("cam")) return "#FF8C00";
        if (text.includes("vàng chanh") || text.includes("vàng tươi")) return "#FFEA00";
        if (text.includes("vàng nâu") || text.includes("nâu xám") || text.includes("bột nâu")) return "#DAA520";
        if (text.includes("vàng nhạt") || text.includes("vàng lục nhạt")) return "#F0E68C";
        if (text.includes("vàng")) return "#FFD700";
        if (text.includes("nâu đen")) return "#4A3018";
        if (text.includes("nâu")) return "#8B4513";
        if (text.includes("hồng")) return "#FFC0CB";
        if (text.includes("đen")) return "#222222";
        if (text.includes("trắng xanh") || text.includes("ánh xanh")) return "#E0FFFF";
        if (text.includes("xám") || text.includes("bạc") || text.includes("ánh kim")) return "#C0C0C0";
        if (text.includes("trắng") || text.includes("không màu") || text.includes("trong suốt")) return "#FFFFFF";
        return "#f4f4f4"; // Default
    };

    const formatChem = (str) => str.replace(/(\d+)(?![+\-])/g, '<sub>$1</sub>').replace(/(\d*)([+\-])/g, '<sup>$1$2</sup>');

    const buildCardHTML = (item) => {
        const hex = getHexColor(item.d);
        const isLight = hex === '#FFFFFF' || hex === '#F0E68C' || hex === '#f4f4f4';
        
        let titleName = item.name ? `<div style="font-size:0.85rem; color:#555; font-weight:bold; margin-bottom:5px;">${item.name}</div>` : '';
        
        return `
            <div class="color-card">
                <div class="color-swatch" style="background-color: ${hex}; border-right-color: ${isLight ? '#ccc' : '#000'}"></div>
                <div class="color-info">
                    ${titleName}
                    <div class="color-formula">${formatChem(item.f)}</div>
                    <p class="color-desc">${item.d}</p>
                </div>
            </div>
        `;
    };

    // ==========================================
    // TÌM KIẾM ĐỘNG (Bao gồm cả CƠ BẢN + NÂNG CAO)
    // ==========================================
    let currentFilter = 'all';
    const renderSearchGrid = (query = '', filter = 'all') => {
        const q = query.toLowerCase().trim();
        
        if (q === '' && filter === 'all') {
            colorGrid.classList.add('hidden');
            colorEmpty.classList.add('hidden');
            return;
        }

        // Gộp mảng Cơ bản và Nâng cao để tìm kiếm
        let fullSearchDB = [...colorDB, ...advancedColorDB];

        colorGrid.innerHTML = '';
        let filtered = fullSearchDB.filter(item => {
            const nameCheck = item.name ? item.name.toLowerCase().includes(q) : false;
            const matchQuery = item.f.toLowerCase().includes(q) || item.d.toLowerCase().includes(q) || nameCheck;
            const matchFilter = filter === 'all' || item.typ === filter;
            return matchQuery && matchFilter;
        });

        if (filtered.length === 0) {
            colorGrid.classList.add('hidden');
            colorEmpty.classList.remove('hidden');
        } else {
            colorEmpty.classList.add('hidden');
            colorGrid.classList.remove('hidden');
            let html = '';
            // Render tối đa 50 thẻ card khi search để tránh lag
            filtered.slice(0, 50).forEach(item => { html += buildCardHTML(item); });
            colorGrid.innerHTML = html;
        }
    };

    // ==========================================
    // RENDER BẢNG DỮ LIỆU TĨNH (Chỉ dùng Database 107 chất)
    // ==========================================
    const renderStaticData = () => {
        const groupedData = {};
        colorDB.forEach(item => {
            if (!groupedData[item.grp]) groupedData[item.grp] = [];
            groupedData[item.grp].push(item);
        });

        let fullHtml = '';
        for (let group in groupedData) {
            let items = groupedData[group];
            let listHtml = items.map(item => buildCardHTML(item)).join('');
            
            fullHtml += `
                <div class="static-group">
                    <div class="static-group-title">
                        <span>🏷️ ${group}</span>
                        <span class="static-group-count">${items.length}</span>
                    </div>
                    <div class="static-list">
                        ${listHtml}
                    </div>
                </div>
            `;
        }
        staticDataArea.innerHTML = fullHtml;
    };

    // Gán sự kiện
    searchInput.addEventListener('input', (e) => renderSearchGrid(e.target.value, currentFilter));
    
    btnClear.addEventListener('click', () => {
        searchInput.value = '';
        currentFilter = 'all';
        filterBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('[data-filter="all"]').classList.add('active');
        renderSearchGrid('', 'all');
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderSearchGrid(searchInput.value, currentFilter);
        });
    });

    // Gọi render bảng tĩnh khi load
    renderStaticData();
});
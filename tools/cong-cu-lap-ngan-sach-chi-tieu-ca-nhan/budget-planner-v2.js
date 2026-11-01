document.addEventListener('DOMContentLoaded', () => {
    const STORE_KEY = 'bg2-budget-v1';

    const defaultData = {
        income: [
            { id: 'i1', name: 'Lương chính', amount: 18000000 },
            { id: 'i2', name: 'Thu nhập phụ', amount: 2000000 }
        ],
        needs: [
            { id: 'n1', name: 'Tiền nhà / Trả góp', amount: 5000000 },
            { id: 'n2', name: 'Điện, nước, internet', amount: 1000000 },
            { id: 'n3', name: 'Đi chợ / Ăn uống', amount: 3000000 },
            { id: 'n4', name: 'Xăng xe / Đi lại', amount: 1000000 }
        ],
        wants: [
            { id: 'w1', name: 'Ăn ngoài / Cafe', amount: 2000000 },
            { id: 'w2', name: 'Mua sắm / Quần áo', amount: 2000000 },
            { id: 'w3', name: 'Giải trí', amount: 2000000 }
        ],
        savings: [
            { id: 's1', name: 'Gửi tiết kiệm', amount: 3000000 },
            { id: 's2', name: 'Trả nợ', amount: 1000000 }
        ]
    };

    let period = 'monthly';
    let budgetData = JSON.parse(JSON.stringify(defaultData));

    function save() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify({ period: period, data: budgetData })); } catch (e) {}
    }
    function load() {
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (!raw) return null;
            const o = JSON.parse(raw);
            if (o && o.data && o.data.income) {
                period = (o.period === 'weekly') ? 'weekly' : 'monthly';
                return o.data;
            }
        } catch (e) {}
        return null;
    }
    const saved = load();
    if (saved) budgetData = saved;

    const btnMonthly = document.getElementById('bg2-period-monthly');
    const btnWeekly = document.getElementById('bg2-period-weekly');

    const uiTotalIncome = document.getElementById('bg2-total-income');
    const uiTotalExpense = document.getElementById('bg2-total-expense');
    const uiRemaining = document.getElementById('bg2-remaining');
    const uiCapIncome = document.getElementById('bg2-cap-income');
    const uiVerdict = document.getElementById('bg2-verdict');

    const uiSumIncome = document.getElementById('bg2-sum-income');
    const uiSumNeeds = document.getElementById('bg2-sum-needs');
    const uiSumWants = document.getElementById('bg2-sum-wants');
    const uiSumSavings = document.getElementById('bg2-sum-savings');

    const lists = {
        income: document.getElementById('bg2-list-income'),
        needs: document.getElementById('bg2-list-needs'),
        wants: document.getElementById('bg2-list-wants'),
        savings: document.getElementById('bg2-list-savings')
    };

    function fmt(n) {
        return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' đ';
    }
    function fmtSigned(n) {
        const v = Math.round(n);
        return (v > 0 ? '+' : '') + new Intl.NumberFormat('vi-VN').format(v) + ' đ';
    }
    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Số tiền lưu chuẩn theo tháng; kỳ tuần chỉ là cách hiển thị (tháng / 4, làm tròn).
    // Đổi kỳ không ghi đè số gốc nên không bao giờ lệch như bản cũ (101 -> 25 -> 100).
    function dispVal(monthly) {
        if (monthly === '' || monthly === null || monthly === undefined) return '';
        return (period === 'weekly') ? Math.round(monthly / 4) : monthly;
    }
    function toMonthly(displayed) {
        return (period === 'weekly') ? displayed * 4 : displayed;
    }

    const VN_DIG = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    function read3(num) {
        const h = Math.floor(num / 100), t = Math.floor(num / 10) % 10, u = num % 10;
        let s = '';
        if (h > 0) s += VN_DIG[h] + ' trăm';
        if (t === 0) {
            if (u > 0) { if (h > 0) s += ' lẻ '; s += VN_DIG[u]; }
        } else if (t === 1) {
            s += (s ? ' ' : '') + 'mười';
            if (u === 5) s += ' lăm';
            else if (u > 0) s += ' ' + VN_DIG[u];
        } else {
            s += (s ? ' ' : '') + VN_DIG[t] + ' mươi';
            if (u === 1) s += ' mốt';
            else if (u === 5) s += ' lăm';
            else if (u > 0) s += ' ' + VN_DIG[u];
        }
        return s;
    }
    function vnWords(n) {
        n = Math.round(n);
        if (!n) return 'Không đồng';
        const scales = ['', ' nghìn', ' triệu', ' tỷ'];
        const parts = [];
        let i = 0;
        while (n > 0) {
            const g = n % 1000;
            if (g > 0) parts.unshift(read3(g) + (scales[i] || ''));
            n = Math.floor(n / 1000);
            i++;
        }
        const s = parts.join(' ');
        return s.charAt(0).toUpperCase() + s.slice(1) + ' đồng';
    }

    function renderList(type) {
        const container = lists[type];
        container.innerHTML = '';
        budgetData[type].forEach(item => {
            const div = document.createElement('div');
            div.className = 'bg2-item';
            const inputName = document.createElement('input');
            inputName.type = 'text';
            inputName.value = item.name;
            inputName.placeholder = 'Tên hạng mục...';
            inputName.setAttribute('aria-label', 'Tên hạng mục');
            inputName.oninput = (e) => { item.name = e.target.value; save(); };
            const inputAmount = document.createElement('input');
            inputAmount.type = 'number';
            inputAmount.min = '0';
            inputAmount.inputMode = 'numeric';
            inputAmount.value = dispVal(item.amount);
            inputAmount.placeholder = '0';
            inputAmount.setAttribute('aria-label', 'Số tiền');
            inputAmount.oninput = (e) => {
                const raw = e.target.value;
                if (raw === '') { item.amount = ''; }
                else {
                    let v = parseFloat(raw);
                    if (isNaN(v)) v = 0;
                    if (v < 0) { v = 0; e.target.value = '0'; }
                    item.amount = toMonthly(v);
                }
                calculateTotals();
                save();
            };
            const btnRemove = document.createElement('button');
            btnRemove.type = 'button';
            btnRemove.className = 'bg2-remove';
            btnRemove.innerHTML = '×';
            btnRemove.title = 'Xóa khoản này';
            btnRemove.onclick = () => {
                budgetData[type] = budgetData[type].filter(x => x.id !== item.id);
                renderList(type);
                calculateTotals();
                save();
            };
            div.appendChild(inputName);
            div.appendChild(inputAmount);
            div.appendChild(btnRemove);
            container.appendChild(div);
        });
    }

    function renderAll() {
        renderList('income');
        renderList('needs');
        renderList('wants');
        renderList('savings');
        calculateTotals();
    }

    function groupTotal(type) {
        return budgetData[type].reduce((sum, item) => {
            const v = dispVal(item.amount);
            return sum + (v === '' ? 0 : v);
        }, 0);
    }

    function setGroupRow(kind, pct, target, gap) {
        document.getElementById('bg2-pct-' + kind).textContent = pct.toFixed(1) + '%';
        document.getElementById('bg2-bar-' + kind).style.width = Math.min(pct, 100) + '%';
        document.getElementById('bg2-target-' + kind).textContent = 'Mục tiêu: ' + fmt(target);
        const gapEl = document.getElementById('bg2-gap-' + kind);
        if (gap === 0) gapEl.textContent = 'Chênh lệch: đúng mốc';
        else if (gap > 0) gapEl.textContent = 'Chênh lệch: vượt ' + fmt(gap);
        else gapEl.textContent = 'Chênh lệch: thiếu ' + fmt(-gap);
    }

    function calculateTotals() {
        const totalIncome = groupTotal('income');
        const totalNeeds = groupTotal('needs');
        const totalWants = groupTotal('wants');
        const totalSavings = groupTotal('savings');
        const totalExpense = totalNeeds + totalWants + totalSavings;
        const remaining = totalIncome - totalExpense;

        uiSumIncome.textContent = fmt(totalIncome);
        uiSumNeeds.textContent = fmt(totalNeeds);
        uiSumWants.textContent = fmt(totalWants);
        uiSumSavings.textContent = fmt(totalSavings);
        uiTotalIncome.textContent = fmt(totalIncome);
        uiTotalExpense.textContent = fmt(totalExpense);
        uiRemaining.textContent = fmt(remaining);
        uiRemaining.style.color = (remaining < 0) ? '#dc2626' : '#111111';
        uiCapIncome.textContent = vnWords(totalIncome);

        let pNeeds = 0, pWants = 0, pSavings = 0;
        if (totalIncome > 0) {
            pNeeds = (totalNeeds / totalIncome) * 100;
            pWants = (totalWants / totalIncome) * 100;
            pSavings = (totalSavings / totalIncome) * 100;
        }
        const tNeeds = Math.round(totalIncome * 0.5);
        const tWants = Math.round(totalIncome * 0.3);
        const tSavings = Math.round(totalIncome * 0.2);
        setGroupRow('needs', pNeeds, tNeeds, totalNeeds - tNeeds);
        setGroupRow('wants', pWants, tWants, totalWants - tWants);
        setGroupRow('savings', pSavings, tSavings, totalSavings - tSavings);

        document.getElementById('bg2-bar-needs').classList.toggle('bg2-warn', totalIncome > 0 && pNeeds > 50);
        document.getElementById('bg2-bar-wants').classList.toggle('bg2-warn', totalIncome > 0 && pWants > 30);
        document.getElementById('bg2-bar-savings').classList.toggle('bg2-warn', totalIncome > 0 && pSavings < 20);

        const over = [];
        if (totalIncome > 0 && totalNeeds > tNeeds) over.push('Thiết yếu vượt mục tiêu ' + fmt(totalNeeds - tNeeds));
        if (totalIncome > 0 && totalWants > tWants) over.push('Mong muốn vượt mục tiêu ' + fmt(totalWants - tWants));
        const saveShort = (totalIncome > 0) ? Math.max(0, tSavings - totalSavings) : 0;

        let verdict = '';
        if (totalIncome <= 0) {
            verdict = 'Hãy nhập thu nhập để xem phân tích 50/30/20.';
        } else if (remaining < 0) {
            verdict = 'Vượt ngân sách ' + fmt(-remaining) + '. Kiểm tra khoản thu bị thiếu hoặc khoản phân bổ trùng trước khi cắt giảm.';
            if (over.length) verdict += ' ' + over.join('; ') + '.';
            if (saveShort > 0) verdict += ' Tích lũy thiếu ' + fmt(saveShort) + ' so với mốc 20%.';
        } else if (remaining > 0) {
            verdict = 'Còn dư ' + fmt(remaining) + ' chưa phân bổ.';
            if (saveShort > 0) verdict += ' Chuyển ' + fmt(Math.min(remaining, saveShort)) + ' vào tích lũy sẽ đủ mốc 20%.';
            else verdict += ' Đã đủ mốc tích lũy 20%; phần dư có thể để dành cho mục tiêu riêng.';
        } else {
            verdict = (over.length === 0 && saveShort === 0)
                ? 'Ngân sách cân bằng đúng mốc 50/30/20.'
                : 'Đã phân bổ hết thu nhập nhưng cơ cấu lệch mốc: ' + over.join('; ') + (saveShort > 0 ? (over.length ? '; ' : '') + 'Tích lũy thiếu ' + fmt(saveShort) + ' so với mốc 20%' : '') + '.';
        }
        uiVerdict.textContent = verdict;
    }

    document.querySelectorAll('.bg2-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.currentTarget.getAttribute('data-bg2-type');
            budgetData[type].push({ id: generateId(), name: '', amount: '' });
            renderList(type);
            calculateTotals();
            save();
        });
    });

    function switchPeriod(newPeriod) {
        if (period === newPeriod) return;
        period = newPeriod;
        btnMonthly.classList.toggle('active', period === 'monthly');
        btnWeekly.classList.toggle('active', period === 'weekly');
        renderAll();
        save();
    }
    btnMonthly.addEventListener('click', () => switchPeriod('monthly'));
    btnWeekly.addEventListener('click', () => switchPeriod('weekly'));

    document.getElementById('bg2-reset').addEventListener('click', () => {
        if (confirm('Làm mới toàn bộ bảng ngân sách của bạn?')) {
            budgetData = JSON.parse(JSON.stringify(defaultData));
            period = 'monthly';
            btnMonthly.classList.add('active');
            btnWeekly.classList.remove('active');
            try { localStorage.removeItem(STORE_KEY); } catch (e) {}
            renderAll();
        }
    });

    document.getElementById('bg2-pdf').addEventListener('click', () => { window.print(); });

    document.getElementById('bg2-csv').addEventListener('click', () => {
        const esc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
        let csv = '\uFEFFNhóm,Tên Hạng Mục,Số Tiền (VNĐ)\n';
        const addRows = (groupName, arr) => {
            arr.forEach(item => {
                if (item.name.trim() !== '' || item.amount !== '') {
                    const v = dispVal(item.amount);
                    csv += esc(groupName) + ',' + esc(item.name) + ',' + esc(v === '' ? 0 : v) + '\n';
                }
            });
        };
        addRows('Nguồn Thu Nhập', budgetData.income);
        addRows('Nhu Cầu Thiết Yếu', budgetData.needs);
        addRows('Mong Muốn & Sở Thích', budgetData.wants);
        addRows('Tích Lũy & Trả Nợ', budgetData.savings);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'Ngan_Sach_Ca_Nhan_' + (period === 'monthly' ? 'Thang' : 'Tuan') + '.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    document.getElementById('bg2-copy').addEventListener('click', () => {
        const totalIncome = groupTotal('income');
        const totalNeeds = groupTotal('needs');
        const totalWants = groupTotal('wants');
        const totalSavings = groupTotal('savings');
        const totalExpense = totalNeeds + totalWants + totalSavings;
        const remaining = totalIncome - totalExpense;
        const pct = (v) => totalIncome > 0 ? ((v / totalIncome) * 100).toFixed(1) + '%' : '0.0%';
        const periodLabel = (period === 'monthly') ? 'Hàng tháng' : 'Hàng tuần';
        const text = 'Ngân sách cá nhân (' + periodLabel + ')\n'
            + 'Tổng thu nhập: ' + fmt(totalIncome) + '\n'
            + 'Tổng đã phân bổ: ' + fmt(totalExpense) + '\n'
            + 'Tiền còn dư: ' + fmt(remaining) + '\n'
            + 'Thiết yếu: ' + fmt(totalNeeds) + ' (' + pct(totalNeeds) + ', mục tiêu 50%)\n'
            + 'Mong muốn: ' + fmt(totalWants) + ' (' + pct(totalWants) + ', mục tiêu 30%)\n'
            + 'Tích lũy & trả nợ: ' + fmt(totalSavings) + ' (' + pct(totalSavings) + ', mục tiêu 20%)\n'
            + 'Kết luận: ' + uiVerdict.textContent;
        const note = document.getElementById('bg2-copy-note');
        const done = () => { note.textContent = 'Đã sao chép!'; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(() => { note.textContent = 'Không sao chép được, hãy thử lại.'; });
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); done(); } catch (e) { note.textContent = 'Không sao chép được, hãy thử lại.'; }
            document.body.removeChild(ta);
        }
    });

    btnMonthly.classList.toggle('active', period === 'monthly');
    btnWeekly.classList.toggle('active', period === 'weekly');
    renderAll();
});

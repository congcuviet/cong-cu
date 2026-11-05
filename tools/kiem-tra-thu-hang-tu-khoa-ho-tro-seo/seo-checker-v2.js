document.addEventListener('DOMContentLoaded', () => {
    /* PURE LOGIC START */
    function parseKeywords(text) {
        return String(text || '').split('\n').map((k) => k.trim()).filter((k) => k !== '');
    }
    function parseDomains(text) {
        return String(text || '').split(/[,\n]+/).map((d) => d.trim()).filter((d) => d !== '');
    }
    function isValidDomainToken(token) {
        let t = String(token || '').replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
        if (t.length === 0 || t.length > 253 || t.indexOf(' ') !== -1) return false;
        if (!/^[A-Za-z0-9.-]+$/.test(t) || t.indexOf('.') === -1) return false;
        let labels = t.split('.');
        for (let i = 0; i < labels.length; i++) {
            let lab = labels[i];
            if (lab.length === 0 || lab.length > 63) return false;
            if (lab.charAt(0) === '-' || lab.charAt(lab.length - 1) === '-') return false;
        }
        return true;
    }
    function rankKind(rank) {
        if (typeof rank === 'number' && rank > 0 && rank <= 10) return 'top10';
        if (typeof rank === 'number' && rank > 0 && rank <= 100) return 'top100';
        return 'out';
    }
    function summarizeRanks(ranks) {
        let out = { top10: 0, top100: 0, out: 0, done: 0 };
        ranks.forEach((r) => {
            let k = rankKind(r);
            out[k] += 1;
            out.done += 1;
        });
        return out;
    }
    function buildTSV(rows) {
        let lines = ['STT\tTừ Khóa\tThứ Hạng\tTiêu Đề\tURL Đích'];
        rows.forEach((row) => {
            lines.push(row.map((c) => String(c == null ? '' : c).replace(/\t|\n/g, ' ').trim()).join('\t'));
        });
        return lines.join('\n') + '\n';
    }
    /* PURE LOGIC END */

    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnCopy = document.getElementById('btn-copy');
    const btnTsv = document.getElementById('sr2-btn-tsv');
    const txtKeywords = document.getElementById('seo-keywords');
    const txtDomains = document.getElementById('seo-domains');
    const tbody = document.getElementById('seo-results-body');
    const statusText = document.getElementById('status-text');
    const statusProgress = document.getElementById('status-progress');
    const errorEl = document.getElementById('sr2-error');
    const scriptNote = document.getElementById('sr2-script-note');
    const emptyEl = document.getElementById('sr2-empty');
    const summaryEl = document.getElementById('sr2-summary');
    const kwCountEl = document.getElementById('sr2-kw-count');
    const chipsEl = document.getElementById('sr2-domain-chips');

    let running = false;
    let rendered = 0;
    let gotUpdate = false;
    let watchdog = null;
    let ranks = [];

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.hidden = false;
    }
    function hideError() {
        errorEl.hidden = true;
        errorEl.textContent = '';
    }
    function setStatus(text, cls) {
        statusText.textContent = '';
        statusText.textContent = text;
        statusText.className = cls;
    }
    function clearWatchdog() {
        if (watchdog) { clearTimeout(watchdog); watchdog = null; }
    }
    function resetUI() {
        running = false;
        clearWatchdog();
        btnStart.disabled = false;
        btnStop.disabled = true;
        setStatus('Đã dừng', 'sr2-status-red');
    }
    function refreshCounts() {
        kwCountEl.textContent = parseKeywords(txtKeywords.value).length + ' từ khóa';
        let domains = parseDomains(txtDomains.value);
        chipsEl.innerHTML = '';
        chipsEl.hidden = domains.length === 0;
        domains.forEach((d) => {
            let chip = document.createElement('span');
            chip.className = 'sr2-chip';
            chip.textContent = d;
            chipsEl.appendChild(chip);
        });
    }
    function updateSummary() {
        let s = summarizeRanks(ranks);
        document.getElementById('sr2-sum-top10').textContent = s.top10;
        document.getElementById('sr2-sum-top100').textContent = s.top100;
        document.getElementById('sr2-sum-out').textContent = s.out;
        document.getElementById('sr2-sum-done').textContent = s.done;
        summaryEl.hidden = s.done === 0;
    }
    function renderRow(index, kw) {
        let tr = document.createElement('tr');
        tr.id = 'row-' + index;
        let tdNum = document.createElement('td');
        let b = document.createElement('strong');
        b.textContent = String(index + 1);
        tdNum.appendChild(b);
        let tdKw = document.createElement('td');
        tdKw.textContent = kw;
        let tdRank = document.createElement('td');
        tdRank.id = 'rank-' + index;
        let span = document.createElement('span');
        span.className = 'rank-out';
        span.textContent = 'Đang chờ...';
        tdRank.appendChild(span);
        let tdTitle = document.createElement('td');
        tdTitle.id = 'title-' + index;
        tdTitle.textContent = '-';
        let tdUrl = document.createElement('td');
        tdUrl.id = 'url-' + index;
        tdUrl.textContent = '-';
        tr.appendChild(tdNum);
        tr.appendChild(tdKw);
        tr.appendChild(tdRank);
        tr.appendChild(tdTitle);
        tr.appendChild(tdUrl);
        tbody.appendChild(tr);
    }
    function renderResult(index, res) {
        let rankEl = document.getElementById('rank-' + index);
        let titleEl = document.getElementById('title-' + index);
        let urlEl = document.getElementById('url-' + index);
        if (!rankEl || !titleEl || !urlEl) return;
        let span = document.createElement('span');
        if (typeof res.rank === 'number' && res.rank > 0 && res.rank <= 100) {
            span.className = 'rank-top';
            span.textContent = 'TOP ' + res.rank;
        } else {
            span.className = 'rank-out';
            span.textContent = '> 100';
        }
        rankEl.textContent = '';
        rankEl.appendChild(span);
        titleEl.textContent = '';
        let strong = document.createElement('strong');
        strong.textContent = res.title || 'Không lọt TOP 100';
        titleEl.appendChild(strong);
        urlEl.textContent = '';
        if (res.url && /^https?:\/\//i.test(res.url)) {
            let a = document.createElement('a');
            a.href = res.url;
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = res.url;
            urlEl.appendChild(a);
        } else {
            urlEl.textContent = res.url || '-';
        }
        ranks[index] = res.rank;
    }
    function tableRowsData() {
        let rows = [];
        tbody.querySelectorAll('tr').forEach((row) => {
            let cols = row.querySelectorAll('td');
            rows.push(Array.from(cols).map((c) => c.textContent.replace(/\t|\n/g, ' ').trim()));
        });
        return rows;
    }

    txtKeywords.addEventListener('input', () => { hideError(); refreshCounts(); });
    txtDomains.addEventListener('input', () => { hideError(); refreshCounts(); });
    refreshCounts();

    btnStart.addEventListener('click', () => {
        let keywords = parseKeywords(txtKeywords.value);
        let domains = parseDomains(txtDomains.value);
        if (keywords.length === 0) { showError('Nhập ít nhất 1 từ khóa.'); return; }
        if (domains.length === 0) { showError('Nhập tên miền cần check.'); return; }
        let bad = domains.filter((d) => !isValidDomainToken(d));
        if (bad.length > 0) { showError('Tên miền chưa hợp lệ: ' + bad.join(', ')); return; }
        hideError();
        scriptNote.hidden = true;
        tbody.innerHTML = '';
        rendered = 0;
        ranks = [];
        updateSummary();
        keywords.forEach((kw, i) => renderRow(i, kw));
        emptyEl.hidden = true;
        window.dispatchEvent(new CustomEvent('TM_START_SEO_CHECK', {
            detail: { keywords: keywords, domains: domains.join(', ') }
        }));
        running = true;
        gotUpdate = false;
        btnStart.disabled = true;
        btnStop.disabled = false;
        setStatus('Đang mở tab Google để check...', 'sr2-status-blue');
        statusProgress.textContent = '0 / ' + keywords.length;
        clearWatchdog();
        watchdog = setTimeout(() => {
            if (running && !gotUpdate) scriptNote.hidden = false;
        }, 4000);
    });

    btnStop.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('TM_STOP_SEO_CHECK'));
        scriptNote.hidden = true;
        resetUI();
    });

    function copyTable() {
        if (tbody.children.length === 0) { showError('Chưa có dữ liệu để copy.'); return; }
        let tsv = buildTSV(tableRowsData());
        let done = () => {
            let old = btnCopy.textContent;
            btnCopy.textContent = '✓ Đã sao chép!';
            setTimeout(() => { btnCopy.textContent = old; }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(tsv).then(done).catch(() => {
                showError('Trình duyệt chặn sao chép tự động — hãy bấm “Tải file TSV” để lấy bảng.');
            });
        } else {
            let ta = document.createElement('textarea');
            ta.value = tsv;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); done(); } catch (e) { showError('Trình duyệt chặn sao chép tự động — hãy bấm “Tải file TSV” để lấy bảng.'); }
            document.body.removeChild(ta);
        }
    }
    btnCopy.addEventListener('click', copyTable);

    btnTsv.addEventListener('click', () => {
        if (tbody.children.length === 0) { showError('Chưa có dữ liệu để tải.'); return; }
        hideError();
        let blob = new Blob(['\ufeff' + buildTSV(tableRowsData())], { type: 'text/tab-separated-values;charset=utf-8' });
        let a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'ket-qua-thu-hang-tu-khoa.tsv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });

    function resumeButton(label) {
        let btn = document.createElement('button');
        btn.id = 'btn-resume-tab';
        btn.className = 'sr2-btn-resume';
        btn.textContent = label;
        btn.addEventListener('click', () => window.dispatchEvent(new CustomEvent('TM_RESUME_TAB')));
        return btn;
    }

    window.addEventListener('TM_UPDATE_SEO_UI', (e) => {
        let state = e.detail || {};
        gotUpdate = true;
        clearWatchdog();
        scriptNote.hidden = true;
        let kws = state.keywords || [];
        if (!state.isRunning) {
            resetUI();
            if (state.currentIndex >= kws.length && kws.length > 0) {
                setStatus('🎉 Hoàn thành!', 'sr2-status-green');
            }
        } else if (state.isBlocked403) {
            statusText.textContent = '';
            let warn = document.createElement('span');
            warn.style.color = '#dc2626';
            warn.style.fontWeight = '900';
            warn.textContent = '🚨 Google chặn IP (403)! Hãy đổi mạng rồi bấm ';
            statusText.appendChild(warn);
            statusText.appendChild(resumeButton('Mở lại tab'));
            statusText.className = 'sr2-status-red';
        } else if (state.isTabClosed) {
            statusText.textContent = '';
            let warn = document.createElement('span');
            warn.style.color = '#dc2626';
            warn.textContent = '⚠️ Lỗi: Đã tắt nhầm tab! ';
            statusText.appendChild(warn);
            statusText.appendChild(resumeButton('Mở lại tab'));
            statusText.className = 'sr2-status-red';
        } else if (state.isWaitingCaptcha) {
            setStatus('⚠️ Hãy giải Captcha ở tab kế bên!', 'sr2-status-red');
        } else {
            setStatus('Đang check: ' + (kws[state.currentIndex] || '...'), 'sr2-status-blue');
        }
        statusProgress.textContent = (state.currentIndex || 0) + ' / ' + kws.length;
        let results = state.results || [];
        for (let i = rendered; i < results.length; i++) {
            renderResult(i, results[i]);
        }
        rendered = Math.max(rendered, results.length);
        updateSummary();
        let lastRow = document.getElementById('row-' + (results.length - 1));
        if (lastRow && lastRow.scrollIntoView) lastRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
});

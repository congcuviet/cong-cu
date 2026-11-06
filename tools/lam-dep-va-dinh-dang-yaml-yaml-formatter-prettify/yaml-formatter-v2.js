document.addEventListener('DOMContentLoaded', function() {
    var btnPrettify = document.getElementById('yf2-btn-prettify');
    var btnMinify = document.getElementById('yf2-btn-minify');
    var btnClear = document.getElementById('yf2-btn-clear');
    var btnCopy = document.getElementById('yf2-btn-copy');
    var btnDownload = document.getElementById('yf2-btn-download');
    var btnSample1 = document.getElementById('yf2-btn-sample-1');
    var btnSample2 = document.getElementById('yf2-btn-sample-2');
    var fileInput = document.getElementById('yf2-file-input');
    var indentGroup = document.getElementById('yf2-indent-group');
    var indent2Btn = document.getElementById('yf2-indent-2');
    var indent4Btn = document.getElementById('yf2-indent-4');
    var sortKeysBox = document.getElementById('yf2-sort-keys');
    var inputLeft = document.getElementById('yf2-input-left');
    var inputRight = document.getElementById('yf2-input-right');
    var badgeLeft = document.getElementById('yf2-badge-left');
    var statsLeft = document.getElementById('yf2-stats-left');
    var statsRight = document.getElementById('yf2-stats-right');
    var noteBox = document.getElementById('yf2-note');
    var errorBox = document.getElementById('yf2-error-box');
    var errorMsg = document.getElementById('yf2-error-msg');
    var errorCaret = document.getElementById('yf2-error-caret');
    var toast = document.getElementById('yf2-toast');

    var MAX_CHARS = 2000000;
    var SAMPLE_APP = 'app:\n  name: inventory-api\n  port: 8080\n  debug: false\n  allowedOrigins:\n    - https://example.com\n    - https://admin.example.com\n  retry:\n    attempts: 3\n    delayMs: 500\n';
    var SAMPLE_COMPOSE = 'services:\n  web:\n    image: nginx:1.27\n    ports:\n      - "80:80"\n    environment:\n      - NGINX_HOST=example.com\n  db:\n    image: postgres:16\n    volumes:\n      - db-data:/var/lib/postgresql/data\nvolumes:\n  db-data: {}\n';

    var currentMode = 'prettify';
    var currentIndent = 2;
    var debounceTimer = null;
    var clearArmed = false;
    var clearArmTimer = null;
    var toastTimer = null;

    // PURE LOGIC START
    function yf2DetectMode(url) {
        var u = (url || '').toLowerCase();
        if (u.indexOf('minify') !== -1 || u.indexOf('nen-yaml') !== -1 || u.indexOf('compress') !== -1) return 'minify';
        return 'prettify';
    }
    function yf2ByteLen(s) {
        return unescape(encodeURIComponent(s)).length;
    }
    function yf2IsOnlyComments(text) {
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var t = lines[i].replace(/^\s+/, '');
            if (t !== '' && t.charAt(0) !== '#') return false;
        }
        return true;
    }
    function yf2TranslateReason(reason) {
        var r = reason || '';
        if (r.indexOf('duplicated mapping key') !== -1) return 'Khóa bị trùng lặp trong cùng một mapping — mỗi khóa chỉ được xuất hiện một lần';
        if (r.indexOf('tab characters must not be used in indentation') !== -1) return 'YAML không cho dùng ký tự tab để thụt lề — hãy thay tab bằng khoảng trắng';
        if (r.indexOf('bad indentation of a mapping entry') !== -1) return 'Thụt lề sai ở một mục mapping — hãy căn lại cho thẳng hàng với các khóa cùng cấp';
        if (r.indexOf('bad indentation of a sequence entry') !== -1) return 'Thụt lề sai ở một mục danh sách — hãy căn lại dấu - cho thẳng hàng';
        if (r.indexOf('unexpected end of the stream within a flow collection') !== -1) return 'Chưa đóng ngoặc [ hoặc { của collection dạng luồng';
        if (r.indexOf('unexpected end of the stream within a block collection') !== -1) return 'Khối chưa đóng — có thể thiếu giá trị hoặc thụt lề sai ở dòng cuối';
        if (r.indexOf('mapping values are not allowed here') !== -1) return 'Dấu : đặt sai vị trí — có thể thiếu khoảng trắng sau dấu hai chấm, hoặc chuỗi chứa dấu : cần đặt trong dấu nháy';
        if (r.indexOf('could not find expected') !== -1) return 'Thiếu dấu phân cách hoặc cấu trúc chưa đúng ở vị trí này';
        if (r.indexOf('found character that cannot start any token') !== -1) return 'Ký tự không hợp lệ ở vị trí này';
        if (r.indexOf('found unexpected end of stream') !== -1 || r.indexOf('unexpected end of the stream') !== -1) return 'Văn bản kết thúc đột ngột — có thể thiếu giá trị hoặc chưa đóng khối';
        if (r.indexOf('did not find expected') !== -1) return 'Thiếu thành phần bắt buộc ở vị trí này';
        return r;
    }
    function yf2FormatError(err, src) {
        var mark = err && err.mark;
        if (!mark || typeof mark.line !== 'number') {
            return { msg: (err && err.message) || 'Lỗi cú pháp YAML.', caret: '' };
        }
        var lineNo = mark.line + 1;
        var colNo = mark.column + 1;
        var reason = yf2TranslateReason(err.reason || err.message || '');
        var msg = 'Dòng ' + lineNo + ', cột ' + colNo + ': ' + reason + '.';
        var lines = (src || '').split('\n');
        var rawLine = lines[mark.line] || '';
        var dispCol = 0;
        var dispLine = '';
        for (var i = 0; i < rawLine.length; i++) {
            if (rawLine.charAt(i) === '\t') { dispLine += '  '; if (i < mark.column) dispCol += 2; }
            else { dispLine += rawLine.charAt(i); if (i < mark.column) dispCol += 1; }
        }
        var caret = 'Dòng ' + lineNo + ': ' + dispLine + '\n' + new Array(('Dòng ' + lineNo + ': ').length + dispCol + 1).join(' ') + '^';
        return { msg: msg, caret: caret };
    }
    function yf2CountKeys(v, seen) {
        if (!v || typeof v !== 'object') return 0;
        if (seen.has(v)) return 0;
        seen.add(v);
        if (Array.isArray(v)) {
            var n = 0;
            for (var i = 0; i < v.length; i++) n += yf2CountKeys(v[i], seen);
            return n;
        }
        if (Object.prototype.toString.call(v) === '[object Date]') return 0;
        var keys = Object.keys(v);
        var total = keys.length;
        for (var j = 0; j < keys.length; j++) total += yf2CountKeys(v[keys[j]], seen);
        return total;
    }
    function yf2SortDeep(v, seen) {
        if (!v || typeof v !== 'object') return v;
        if (seen.has(v)) return v;
        seen.add(v);
        if (Array.isArray(v)) {
            for (var i = 0; i < v.length; i++) v[i] = yf2SortDeep(v[i], seen);
            return v;
        }
        if (Object.prototype.toString.call(v) === '[object Date]') return v;
        var keys = Object.keys(v).sort();
        var out = {};
        for (var j = 0; j < keys.length; j++) out[keys[j]] = yf2SortDeep(v[keys[j]], seen);
        return out;
    }
    function yf2ChangeLabel(inBytes, outBytes) {
        if (outBytes === inBytes) return 'bằng đầu vào';
        var pct = Math.round(Math.abs(outBytes - inBytes) / inBytes * 100);
        return outBytes < inBytes ? ('giảm ' + pct + '%') : ('tăng ' + pct + '%');
    }
    function yf2FormatDocs(docs, mode, indent) {
        if (mode === 'minify') {
            if (docs.length === 1) return JSON.stringify(docs[0]);
            return JSON.stringify(docs);
        }
        var parts = [];
        for (var i = 0; i < docs.length; i++) {
            parts.push(jsyaml.dump(docs[i], { indent: indent, lineWidth: -1 }));
        }
        return parts.join('---\n');
    }
    // PURE LOGIC END

    function yf2ShowToast(text) {
        toast.textContent = text;
        toast.hidden = false;
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function() { toast.hidden = true; }, 2000);
    }
    function yf2SetBadge(state) {
        if (state === 'valid') { badgeLeft.textContent = '✅ YAML hợp lệ'; badgeLeft.className = 'yf2-badge active'; }
        else if (state === 'error') { badgeLeft.textContent = '❌ Lỗi cú pháp'; badgeLeft.className = 'yf2-badge error'; }
        else { badgeLeft.textContent = 'Chờ nhập liệu...'; badgeLeft.className = 'yf2-badge'; }
    }
    function yf2StatsText(text) {
        if (!text) return '';
        var lines = text.split('\n').length;
        return lines + ' dòng · ' + yf2ByteLen(text).toLocaleString('vi-VN') + ' byte';
    }
    function yf2ShowError(err, src) {
        var f = yf2FormatError(err, src);
        errorMsg.textContent = f.msg;
        errorCaret.textContent = f.caret;
        errorCaret.hidden = !f.caret;
        errorBox.hidden = false;
    }
    function yf2Process() {
        var rawText = inputLeft.value;
        errorBox.hidden = true;
        noteBox.hidden = true;
        noteBox.textContent = '';
        if (!rawText.trim()) {
            inputRight.value = '';
            statsLeft.textContent = '';
            statsRight.textContent = '';
            yf2SetBadge('waiting');
            return;
        }
        if (rawText.length > MAX_CHARS) {
            inputRight.value = '';
            statsLeft.textContent = yf2StatsText(rawText);
            statsRight.textContent = '';
            yf2SetBadge('error');
            errorMsg.textContent = 'Dữ liệu vượt giới hạn 2.000.000 ký tự (' + rawText.length.toLocaleString('vi-VN') + ' ký tự). Hãy chia nhỏ tệp rồi xử lý từng phần.';
            errorCaret.textContent = '';
            errorCaret.hidden = true;
            errorBox.hidden = false;
            return;
        }
        if (typeof jsyaml === 'undefined') {
            inputRight.value = '';
            yf2SetBadge('error');
            errorMsg.textContent = 'Không tải được thư viện YAML (js-yaml). Hãy tải lại trang.';
            errorCaret.textContent = '';
            errorCaret.hidden = true;
            errorBox.hidden = false;
            return;
        }
        var docs;
        try {
            docs = jsyaml.loadAll(rawText);
        } catch (err) {
            inputRight.value = '';
            statsLeft.textContent = yf2StatsText(rawText);
            statsRight.textContent = '';
            yf2SetBadge('error');
            yf2ShowError(err, rawText);
            return;
        }
        var sortOn = sortKeysBox.checked;
        var workDocs = docs;
        if (sortOn) {
            workDocs = [];
            for (var i = 0; i < docs.length; i++) workDocs.push(yf2SortDeep(docs[i], new Set()));
        }
        var out;
        try {
            out = yf2FormatDocs(workDocs, currentMode, currentIndent);
        } catch (err) {
            inputRight.value = '';
            statsLeft.textContent = yf2StatsText(rawText);
            statsRight.textContent = '';
            yf2SetBadge('error');
            var msg = 'Không xuất được kết quả: ' + (err && err.message ? err.message : 'lỗi không xác định') + '.';
            if (currentMode === 'minify' && err && err.message && err.message.indexOf('circular') !== -1) {
                msg = 'Dữ liệu chứa tham chiếu vòng (anchor tự trỏ lại chính nó) nên không nén được thành JSON — hãy dùng chế độ Làm đẹp.';
            }
            errorMsg.textContent = msg;
            errorCaret.textContent = '';
            errorCaret.hidden = true;
            errorBox.hidden = false;
            return;
        }
        var onlyComments = (docs.length === 1 && docs[0] === null && yf2IsOnlyComments(rawText));
        if (onlyComments) out = '';
        inputRight.value = out;
        statsLeft.textContent = yf2StatsText(rawText);
        var rightStats = yf2StatsText(out);
        if (out) {
            var keys = 0;
            for (var k = 0; k < workDocs.length; k++) keys += yf2CountKeys(workDocs[k], new Set());
            rightStats += ' · ' + yf2ChangeLabel(yf2ByteLen(rawText), yf2ByteLen(out));
            if (keys > 0) rightStats += ' · ' + keys + ' khóa';
        }
        statsRight.textContent = rightStats;
        yf2SetBadge('valid');
        if (docs.length > 1) {
            noteBox.textContent = 'Đã xử lý ' + docs.length + ' tài liệu, phân tách bằng ---.';
            noteBox.hidden = false;
        } else if (onlyComments) {
            noteBox.textContent = 'Tài liệu chỉ chứa chú thích, không có dữ liệu.';
            noteBox.hidden = false;
        }
    }
    function yf2ProcessDebounced() {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(yf2Process, 150);
    }
    function yf2SetMode(mode) {
        currentMode = mode;
        btnPrettify.classList.toggle('active', mode === 'prettify');
        btnMinify.classList.toggle('active', mode === 'minify');
        indentGroup.hidden = (mode !== 'prettify');
        yf2Process();
    }
    function yf2SetIndent(n) {
        currentIndent = n;
        indent2Btn.classList.toggle('active', n === 2);
        indent4Btn.classList.toggle('active', n === 4);
        yf2Process();
    }
    function yf2ResetClearArm() {
        clearArmed = false;
        btnClear.textContent = '🧹 Xóa trắng';
        btnClear.classList.remove('yf2-confirm');
        if (clearArmTimer) { clearTimeout(clearArmTimer); clearArmTimer = null; }
    }

    currentMode = yf2DetectMode(window.location.href);
    btnPrettify.classList.toggle('active', currentMode === 'prettify');
    btnMinify.classList.toggle('active', currentMode === 'minify');
    indentGroup.hidden = (currentMode !== 'prettify');

    inputLeft.addEventListener('input', yf2ProcessDebounced);
    btnPrettify.addEventListener('click', function() { yf2SetMode('prettify'); });
    btnMinify.addEventListener('click', function() { yf2SetMode('minify'); });
    indent2Btn.addEventListener('click', function() { yf2SetIndent(2); });
    indent4Btn.addEventListener('click', function() { yf2SetIndent(4); });
    sortKeysBox.addEventListener('change', yf2Process);
    btnSample1.addEventListener('click', function() { inputLeft.value = SAMPLE_APP; yf2Process(); inputLeft.focus(); });
    btnSample2.addEventListener('click', function() { inputLeft.value = SAMPLE_COMPOSE; yf2Process(); inputLeft.focus(); });
    btnClear.addEventListener('click', function() {
        if (!clearArmed) {
            clearArmed = true;
            btnClear.textContent = 'Chạm lần nữa để xóa';
            btnClear.classList.add('yf2-confirm');
            clearArmTimer = setTimeout(yf2ResetClearArm, 3000);
            return;
        }
        yf2ResetClearArm();
        inputLeft.value = '';
        yf2Process();
        inputLeft.focus();
    });
    btnCopy.addEventListener('click', function() {
        if (!inputRight.value || !errorBox.hidden) return;
        var done = function(ok) {
            if (ok) { yf2ShowToast('✅ Đã sao chép kết quả'); }
            else { yf2ShowToast('Không sao chép được — hãy chọn văn bản rồi nhấn Ctrl+C'); }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(inputRight.value).then(function() { done(true); }, function() { yf2CopyFallback(done); });
        } else {
            yf2CopyFallback(done);
        }
    });
    function yf2CopyFallback(done) {
        try {
            var ta = document.createElement('textarea');
            ta.value = inputRight.value;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            var ok = document.execCommand('copy');
            document.body.removeChild(ta);
            done(!!ok);
        } catch (e) { done(false); }
    }
    btnDownload.addEventListener('click', function() {
        if (!inputRight.value || !errorBox.hidden) return;
        var blob = new Blob([inputRight.value], { type: 'text/plain;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = currentMode === 'minify' ? 'yaml-da-nen.json' : 'yaml-da-dinh-dang.yaml';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() { URL.revokeObjectURL(a.href); a.remove(); }, 100);
    });
    fileInput.addEventListener('change', function() {
        var f = fileInput.files && fileInput.files[0];
        if (!f) return;
        if (f.size > MAX_CHARS) {
            yf2ShowToast('Tệp vượt giới hạn 2.000.000 ký tự');
            fileInput.value = '';
            return;
        }
        var reader = new FileReader();
        reader.onload = function() {
            inputLeft.value = String(reader.result || '');
            yf2Process();
            fileInput.value = '';
        };
        reader.onerror = function() {
            yf2ShowToast('Không đọc được tệp');
            fileInput.value = '';
        };
        reader.readAsText(f);
    });
    inputLeft.addEventListener('drop', function(ev) {
        ev.preventDefault();
        var f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
        if (!f) return;
        if (f.size > MAX_CHARS) { yf2ShowToast('Tệp vượt giới hạn 2.000.000 ký tự'); return; }
        var reader = new FileReader();
        reader.onload = function() { inputLeft.value = String(reader.result || ''); yf2Process(); };
        reader.readAsText(f);
    });
    inputLeft.addEventListener('dragover', function(ev) { ev.preventDefault(); });

    if (inputLeft.value) yf2Process();
});

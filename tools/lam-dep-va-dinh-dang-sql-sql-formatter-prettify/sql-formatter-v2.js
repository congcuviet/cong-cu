document.addEventListener('DOMContentLoaded', function() {
    var btnPrettify = document.getElementById('sf2-btn-prettify');
    var btnMinify = document.getElementById('sf2-btn-minify');
    var btnClear = document.getElementById('sf2-btn-clear');
    var btnCopy = document.getElementById('sf2-btn-copy');
    var btnDownload = document.getElementById('sf2-btn-download');
    var inputLeft = document.getElementById('sf2-input-left');
    var inputRight = document.getElementById('sf2-input-right');
    var selectDialect = document.getElementById('sf2-dialect');
    var badgeLeft = document.getElementById('sf2-badge-left');
    var statsLeft = document.getElementById('sf2-stats-left');
    var statsRight = document.getElementById('sf2-stats-right');
    var errorBox = document.getElementById('sf2-error-box');
    var errorMsg = document.getElementById('sf2-error-msg');
    var warnBox = document.getElementById('sf2-warn-box');
    var warnMsg = document.getElementById('sf2-warn-msg');
    var keepCommentsBox = document.getElementById('sf2-keep-comments');

    var currentMode = 'prettify';
    var indentWidth = 4;
    var keywordCase = 'upper';
    var debounceTimer = null;

    var SAMPLE_JOIN = "select u.id, u.name, o.total from users u left join orders o on o.user_id = u.id where u.active = 1 and o.total > 100 order by o.total desc";
    var SAMPLE_CASE = "SELECT id, CASE WHEN score >= 90 THEN 'Gioi' WHEN score >= 65 THEN 'Kha' ELSE 'Trung binh' END AS xep_loai FROM (SELECT id, score FROM exams WHERE subject = 'toan') AS t ORDER BY score DESC";
    var SAMPLE_CREATE = "CREATE TABLE `users` (`id` INT AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(100) NOT NULL, `email` VARCHAR(255) UNIQUE) ENGINE=InnoDB;";

    /* PURE LOGIC START */
    var SF2_MULTI_OPS = ['->>', '#>>', '>=', '<=', '<>', '!=', '==', '||', ':=', '::', '->', '<-', '=>', '@>', '<@', '?|', '?&', '#-', '<<', '>>', '**'];
    function sf2IsWordChar(ch) {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === '_' || ch === '.' || ch === '$' || ch === '#' || ch === '@';
    }
    function sf2IsSpace(ch) { return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === '\v'; }
    function sf2Tokenize(sql) {
        var tokens = [];
        var i = 0, n = sql.length;
        while (i < n) {
            var c = sql[i];
            if (sf2IsSpace(c)) { i++; continue; }
            if (c === '-' && sql[i + 1] === '-' && (i + 2 >= n || sf2IsSpace(sql[i + 2]))) {
                var end = sql.indexOf('\n', i + 2);
                if (end === -1) end = n;
                tokens.push({ t: 'comment', v: sql.slice(i, end), line: true });
                i = end;
                continue;
            }
            if (c === '#' && (i + 1 >= n || sf2IsSpace(sql[i + 1]))) {
                var end2 = sql.indexOf('\n', i + 1);
                if (end2 === -1) end2 = n;
                tokens.push({ t: 'comment', v: sql.slice(i, end2), line: true });
                i = end2;
                continue;
            }
            if (c === '/' && sql[i + 1] === '*') {
                var close = sql.indexOf('*/', i + 2);
                var stop = close === -1 ? n : close + 2;
                tokens.push({ t: 'comment', v: sql.slice(i, stop), hint: sql.slice(i, i + 3) === '/*!' });
                i = stop;
                continue;
            }
            if (c === "'" || c === '"' || c === '`') {
                var q = c, j = i + 1;
                while (j < n) {
                    if (sql[j] === q) {
                        if (sql[j + 1] === q) { j += 2; continue; }
                        j++;
                        break;
                    }
                    j++;
                }
                tokens.push({ t: 'str', v: sql.slice(i, j) });
                i = j;
                continue;
            }
            if (c === '[') {
                var k = i + 1;
                while (k < n) {
                    if (sql[k] === ']') {
                        if (sql[k + 1] === ']') { k += 2; continue; }
                        k++;
                        break;
                    }
                    k++;
                }
                tokens.push({ t: 'str', v: sql.slice(i, k) });
                i = k;
                continue;
            }
            if (c === '$') {
                var m = /^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/.exec(sql.slice(i, i + 64));
                if (m) {
                    var tag = m[0];
                    var closeTag = sql.indexOf(tag, i + tag.length);
                    if (closeTag !== -1) {
                        tokens.push({ t: 'str', v: sql.slice(i, closeTag + tag.length) });
                        i = closeTag + tag.length;
                        continue;
                    }
                }
            }
            if (c === ':' && i + 1 < n && sf2IsWordChar(sql[i + 1]) && sql[i + 1] !== '.') {
                var s = i + 1;
                while (s < n && sf2IsWordChar(sql[s])) s++;
                tokens.push({ t: 'word', v: sql.slice(i, s) });
                i = s;
                continue;
            }
            var matchedOp = null;
            var ci = 0;
            while (ci < SF2_MULTI_OPS.length) {
                var op = SF2_MULTI_OPS[ci];
                if (sql.slice(i, i + op.length) === op) { matchedOp = op; break; }
                ci++;
            }
            if (matchedOp) {
                tokens.push({ t: 'op', v: matchedOp });
                i += matchedOp.length;
                continue;
            }
            if ('=<>!+-*/%|&^~?'.indexOf(c) !== -1) {
                tokens.push({ t: 'op', v: c });
                i++;
                continue;
            }
            if (c === '(' || c === ')' || c === ',' || c === ';') {
                tokens.push({ t: 'punct', v: c });
                i++;
                continue;
            }
            var w = i;
            while (w < n && sf2IsWordChar(sql[w])) w++;
            if (w === i) { tokens.push({ t: 'word', v: c }); i++; continue; }
            tokens.push({ t: 'word', v: sql.slice(i, w) });
            i = w;
        }
        return tokens;
    }
    function sf2MinifySql(input, keepComments) {
        var tokens = sf2Tokenize(input);
        var out = '';
        for (var ti = 0; ti < tokens.length; ti++) {
            var tok = tokens[ti];
            var v = tok.v;
            if (tok.t === 'comment') {
                if (tok.hint) {
                    v = tok.v;
                } else if (!keepComments) {
                    continue;
                } else if (tok.line) {
                    v = '/* ' + tok.v.replace(/^-{2,}\s?/, '').replace(/^#\s?/, '').trim() + ' */';
                }
            }
            if (out === '') { out = v; continue; }
            if (v === ',' || v === ';' || v === ')') { out += v; continue; }
            if (out[out.length - 1] === '(') { out += v; continue; }
            out += ' ' + v;
        }
        return out;
    }
    function sf2CodeOnly(input) {
        var tokens = sf2Tokenize(input);
        var parts = [];
        for (var ti = 0; ti < tokens.length; ti++) {
            var tok = tokens[ti];
            if (tok.t === 'str' || tok.t === 'comment') { parts.push(' '); continue; }
            parts.push(tok.v);
            parts.push(' ');
        }
        return parts.join('');
    }
    function sf2SafetyCheck(input) {
        var code = sf2CodeOnly(input);
        var stmts = code.split(';');
        var warns = [];
        for (var si = 0; si < stmts.length; si++) {
            var st = stmts[si].replace(/\s+/g, ' ').trim();
            if (!st) continue;
            var head = st.length > 40 ? st.slice(0, 40) + '…' : st;
            if (/^UPDATE\b/i.test(st) && !/\bWHERE\b/i.test(st)) {
                warns.push('UPDATE không có WHERE sẽ sửa toàn bộ bảng: ' + head);
            } else if (/^DELETE\b/i.test(st) && !/\bWHERE\b/i.test(st)) {
                warns.push('DELETE không có WHERE sẽ xóa toàn bộ bảng: ' + head);
            } else if (/^DROP\s+(TABLE|DATABASE|INDEX|VIEW|TRIGGER|PROCEDURE|FUNCTION|SCHEMA)\b/i.test(st)) {
                warns.push('Lệnh phá hủy (DROP): ' + head);
            } else if (/^TRUNCATE\b/i.test(st)) {
                warns.push('Lệnh phá hủy (TRUNCATE): ' + head);
            }
        }
        return warns;
    }
    function sf2StatsText(text) {
        if (!text) return '0 ký tự · 0 dòng';
        var lines = text.split('\n').length;
        return text.length.toLocaleString('vi-VN') + ' ký tự · ' + lines.toLocaleString('vi-VN') + ' dòng';
    }
    function sf2FirstErrorLine(msg) {
        var first = String(msg || 'Lỗi không xác định').split('\n')[0];
        if (first.length > 200) first = first.slice(0, 200) + '…';
        return first;
    }
    /* PURE LOGIC END */

    function setBadge(text, cls) {
        badgeLeft.textContent = text;
        badgeLeft.className = 'sf2-badge' + (cls ? ' ' + cls : '');
    }
    function updateStats() {
        statsLeft.textContent = sf2StatsText(inputLeft.value);
        statsRight.textContent = sf2StatsText(inputRight.value);
    }
    function processSql() {
        var raw = inputLeft.value;
        updateStats();
        if (!raw.trim()) {
            inputRight.value = '';
            errorBox.hidden = true;
            warnBox.hidden = true;
            setBadge('Chờ nhập liệu...', '');
            updateStats();
            return;
        }
        if (typeof window.sqlFormatter === 'undefined') {
            inputRight.value = '';
            errorMsg.textContent = 'Không tải được thư viện định dạng (sql-formatter 15.3.0). Kiểm tra kết nối mạng rồi tải lại trang.';
            errorBox.hidden = false;
            warnBox.hidden = true;
            setBadge('⚠️ Lỗi tải thư viện', 'error');
            updateStats();
            return;
        }
        try {
            var result;
            if (currentMode === 'prettify') {
                result = window.sqlFormatter.format(raw, {
                    language: selectDialect.value,
                    tabWidth: indentWidth,
                    keywordCase: keywordCase,
                    linesBetweenQueries: 2
                });
            } else {
                result = sf2MinifySql(raw, keepCommentsBox.checked);
            }
            inputRight.value = result;
            errorBox.hidden = true;
            var warns = sf2SafetyCheck(raw);
            if (warns.length) {
                warnMsg.textContent = warns.join(' — ');
                warnBox.hidden = false;
            } else {
                warnBox.hidden = true;
            }
            setBadge(currentMode === 'prettify' ? '✅ Thành công' : '✅ Đã nén', 'active');
        } catch (e) {
            inputRight.value = '';
            errorMsg.textContent = sf2FirstErrorLine(e && e.message ? e.message : e);
            errorBox.hidden = false;
            warnBox.hidden = true;
            setBadge('⚠️ Lỗi cú pháp', 'error');
        }
        updateStats();
    }
    function scheduleProcess() {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(processSql, 200);
    }
    function setActive(btn, group) {
        var i = 0;
        for (i = 0; i < group.length; i++) group[i].classList.remove('active');
        btn.classList.add('active');
    }

    inputLeft.addEventListener('input', scheduleProcess);
    selectDialect.addEventListener('change', processSql);

    btnPrettify.addEventListener('click', function() {
        currentMode = 'prettify';
        setActive(btnPrettify, [btnPrettify, btnMinify]);
        processSql();
    });
    btnMinify.addEventListener('click', function() {
        currentMode = 'minify';
        setActive(btnMinify, [btnPrettify, btnMinify]);
        processSql();
    });

    var indent2Btn = document.getElementById('sf2-indent-2');
    var indent4Btn = document.getElementById('sf2-indent-4');
    indent2Btn.addEventListener('click', function() {
        indentWidth = 2;
        setActive(indent2Btn, [indent2Btn, indent4Btn]);
        processSql();
    });
    indent4Btn.addEventListener('click', function() {
        indentWidth = 4;
        setActive(indent4Btn, [indent2Btn, indent4Btn]);
        processSql();
    });

    var caseUpperBtn = document.getElementById('sf2-case-upper');
    var caseLowerBtn = document.getElementById('sf2-case-lower');
    var casePreserveBtn = document.getElementById('sf2-case-preserve');
    caseUpperBtn.addEventListener('click', function() {
        keywordCase = 'upper';
        setActive(caseUpperBtn, [caseUpperBtn, caseLowerBtn, casePreserveBtn]);
        processSql();
    });
    caseLowerBtn.addEventListener('click', function() {
        keywordCase = 'lower';
        setActive(caseLowerBtn, [caseUpperBtn, caseLowerBtn, casePreserveBtn]);
        processSql();
    });
    casePreserveBtn.addEventListener('click', function() {
        keywordCase = 'preserve';
        setActive(casePreserveBtn, [caseUpperBtn, caseLowerBtn, casePreserveBtn]);
        processSql();
    });
    keepCommentsBox.addEventListener('change', processSql);

    document.getElementById('sf2-chip-1').addEventListener('click', function() {
        inputLeft.value = SAMPLE_JOIN;
        processSql();
        inputLeft.focus();
    });
    document.getElementById('sf2-chip-2').addEventListener('click', function() {
        inputLeft.value = SAMPLE_CASE;
        processSql();
        inputLeft.focus();
    });
    document.getElementById('sf2-chip-3').addEventListener('click', function() {
        inputLeft.value = SAMPLE_CREATE;
        selectDialect.value = 'mysql';
        processSql();
        inputLeft.focus();
    });

    btnClear.addEventListener('click', function() {
        inputLeft.value = '';
        processSql();
        inputLeft.focus();
    });

    btnCopy.addEventListener('click', function() {
        if (!inputRight.value) return;
        var done = function(ok) {
            var original = '📋 COPY';
            btnCopy.textContent = ok ? '✅ ĐÃ COPY' : '⚠️ Không copy được';
            setTimeout(function() { btnCopy.textContent = original; }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(inputRight.value).then(function() { done(true); }, function() { fallbackCopy(); });
        } else {
            fallbackCopy();
        }
        function fallbackCopy() {
            try {
                if (!document.execCommand) { done(false); return; }
                var ta = document.createElement('textarea');
                ta.value = inputRight.value;
                ta.setAttribute('readonly', '');
                ta.style.position = 'absolute';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                var ok = document.execCommand('copy');
                document.body.removeChild(ta);
                done(!!ok);
            } catch (err) {
                done(false);
            }
        }
    });

    btnDownload.addEventListener('click', function() {
        if (!inputRight.value) return;
        try {
            var blob = new Blob([inputRight.value], { type: 'text/sql;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = currentMode === 'prettify' ? 'sql-da-lam-dep.sql' : 'sql-da-nen.sql';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        } catch (err) {
            errorMsg.textContent = 'Không tải được file. Hãy dùng nút COPY để sao chép kết quả.';
            errorBox.hidden = false;
        }
    });

    if (inputLeft.value) processSql();
});

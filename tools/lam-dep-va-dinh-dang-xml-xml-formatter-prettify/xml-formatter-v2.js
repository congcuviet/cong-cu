document.addEventListener('DOMContentLoaded', function() {
    var btnPrettify = document.getElementById('xf2-btn-prettify');
    var btnMinify = document.getElementById('xf2-btn-minify');
    var btnClear = document.getElementById('xf2-btn-clear');
    var btnCopy = document.getElementById('xf2-btn-copy');
    var btnDownload = document.getElementById('xf2-btn-download');
    var fileInput = document.getElementById('xf2-file');
    var indentSel = document.getElementById('xf2-indent');
    var indentWrap = document.getElementById('xf2-indent-wrap');
    var inputLeft = document.getElementById('xf2-input');
    var inputRight = document.getElementById('xf2-output');
    var badge = document.getElementById('xf2-badge');
    var statsLine = document.getElementById('xf2-stats');
    var errorBox = document.getElementById('xf2-error-box');
    var errorMsg = document.getElementById('xf2-error-msg');
    var errorSnippet = document.getElementById('xf2-error-snippet');
    var toast = document.getElementById('xf2-toast');

    var mode = xf2Pure.detectMode(window.location.href);
    var clearArmed = false;
    var clearTimer = null;
    var toastTimer = null;

    function showToast(text) {
        toast.textContent = text;
        toast.hidden = false;
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function() { toast.hidden = true; }, 2200);
    }

    function setMode(next) {
        mode = next;
        var pretty = mode === 'prettify';
        btnPrettify.classList.toggle('active', pretty);
        btnMinify.classList.toggle('active', !pretty);
        indentWrap.hidden = !pretty;
        btnDownload.textContent = pretty ? '⬇ Tải .xml (đã làm đẹp)' : '⬇ Tải .xml (đã nén)';
        processXml();
    }

    function setBadge(text, cls) {
        badge.textContent = text;
        badge.className = 'xf2-badge' + (cls ? ' ' + cls : '');
    }

    function processXml() {
        var raw = inputLeft.value;
        errorBox.hidden = true;
        errorSnippet.hidden = true;
        if (!raw.trim()) {
            inputRight.value = '';
            statsLine.textContent = '';
            setBadge('Chờ nhập liệu...', '');
            btnCopy.disabled = true;
            btnDownload.disabled = true;
            return;
        }
        var res = xf2Pure.formatXml(raw, mode, indentSel.value);
        if (!res.ok) {
            inputRight.value = '';
            statsLine.textContent = '';
            setBadge('Lỗi thẻ/cú pháp', 'error');
            btnCopy.disabled = true;
            btnDownload.disabled = true;
            errorMsg.textContent = res.error.message;
            if (res.error.line) {
                errorSnippet.textContent = 'Dòng ' + res.error.line + ', cột ' + res.error.col + ':\n' + res.error.lineText + '\n' + res.error.caret;
                errorSnippet.hidden = false;
            }
            errorBox.hidden = false;
            return;
        }
        inputRight.value = res.output;
        var st = res.stats;
        var pct = st.pct > 0 ? '+' + st.pct.toFixed(1).replace('.', ',') + '%' : st.pct.toFixed(1).replace('.', ',') + '%';
        statsLine.textContent = st.elements + ' phần tử · ' + st.attributes + ' thuộc tính · sâu tối đa ' + st.maxDepth + ' · ' + st.lines + ' dòng · ' + xf2Pure.formatBytes(st.inBytes) + ' → ' + xf2Pure.formatBytes(st.outBytes) + ' (' + pct + ')';
        setBadge('XML hợp lệ', 'active');
        btnCopy.disabled = false;
        btnDownload.disabled = false;
    }

    inputLeft.addEventListener('input', processXml);
    btnPrettify.addEventListener('click', function() { setMode('prettify'); });
    btnMinify.addEventListener('click', function() { setMode('minify'); });
    indentSel.addEventListener('change', processXml);

    document.querySelectorAll('[data-xf2-chip]').forEach(function(chip) {
        chip.addEventListener('click', function() {
            inputLeft.value = chip.getAttribute('data-xf2-chip');
            processXml();
            inputLeft.focus();
        });
    });

    btnClear.addEventListener('click', function() {
        if (!clearArmed) {
            clearArmed = true;
            btnClear.textContent = 'Nhấn lại để xóa';
            clearTimer = setTimeout(function() {
                clearArmed = false;
                btnClear.textContent = 'Xóa trắng';
            }, 2500);
            return;
        }
        clearTimeout(clearTimer);
        clearArmed = false;
        btnClear.textContent = 'Xóa trắng';
        inputLeft.value = '';
        processXml();
        inputLeft.focus();
    });

    btnCopy.addEventListener('click', function() {
        if (!inputRight.value) return;
        var done = function() {
            btnCopy.textContent = 'Đã sao chép';
            setTimeout(function() { btnCopy.textContent = 'Sao chép kết quả'; }, 1500);
            showToast('Đã sao chép kết quả.');
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(inputRight.value).then(done, function() { fallbackCopy(done); });
        } else {
            fallbackCopy(done);
        }
    });

    function fallbackCopy(done) {
        var ta = document.createElement('textarea');
        ta.value = inputRight.value;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            if (document.execCommand('copy')) { done(); }
            else { showToast('Không sao chép được, hãy chọn tay trong ô kết quả.'); }
        } catch (e) {
            showToast('Không sao chép được, hãy chọn tay trong ô kết quả.');
        }
        document.body.removeChild(ta);
    }

    btnDownload.addEventListener('click', function() {
        if (!inputRight.value) return;
        var blob = new Blob([inputRight.value], { type: 'application/xml;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = mode === 'prettify' ? 'xml-da-lam-dep.xml' : 'xml-da-nen.xml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 500);
        showToast('Đã tải tệp .xml.');
    });

    fileInput.addEventListener('change', function() {
        var f = fileInput.files && fileInput.files[0];
        if (!f) return;
        if (f.size > xf2Pure.MAX_BYTES) {
            showToast('Tệp vượt quá 2 MB.');
            fileInput.value = '';
            return;
        }
        var reader = new FileReader();
        reader.onload = function() {
            inputLeft.value = String(reader.result || '');
            processXml();
            showToast('Đã nạp tệp ' + f.name + '.');
        };
        reader.onerror = function() { showToast('Không đọc được tệp.'); };
        reader.readAsText(f);
        fileInput.value = '';
    });

    setMode(mode);
    if (inputLeft.value) processXml();
});

/* PURE LOGIC START */
var xf2Pure = (function() {
    var MAX_BYTES = 2 * 1024 * 1024;

    function detectMode(url) {
        var u = String(url || '').toLowerCase();
        if (u.indexOf('minify') !== -1 || u.indexOf('nen-xml') !== -1 || u.indexOf('compress') !== -1) return 'minify';
        return 'prettify';
    }

    function byteLen(s) {
        if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s).length;
        var n = 0;
        for (var i = 0; i < s.length; i++) {
            var c = s.charCodeAt(i);
            if (c < 128) n += 1;
            else if (c < 2048) n += 2;
            else if (c >= 55296 && c <= 56319) { n += 4; i++; }
            else n += 3;
        }
        return n;
    }

    function formatBytes(n) {
        if (n < 1024) return n + ' byte';
        return (n / 1024).toFixed(1).replace('.', ',') + ' KB';
    }

    function extractLineCol(msg) {
        var m = msg.match(/line\s+(\d+)\s+at\s+column\s+(\d+)/i);
        if (m) return { line: parseInt(m[1], 10), col: parseInt(m[2], 10) };
        m = msg.match(/Line Number\s+(\d+),\s*Column\s+(\d+)/);
        if (m) return { line: parseInt(m[1], 10), col: parseInt(m[2], 10) };
        m = msg.match(/^(\d+):(\d+):/);
        if (m) return { line: parseInt(m[1], 10), col: parseInt(m[2], 10) };
        return null;
    }

    function cleanMessage(msg) {
        var s = String(msg || '').replace(/\s+/g, ' ').trim();
        s = s.replace(/^\d+:\d+:\s*/, '');
        s = s.replace(/^XML Parsing Error:\s*/i, '');
        s = s.replace(/^error on line \d+ at column \d+:\s*/i, '');
        s = s.replace(/\s*Location:[^]*$/i, '');
        s = s.replace(/\s*Line Number \d+, Column \d+:?\s*$/i, '');
        return s || 'XML không hợp lệ.';
    }

    function parseXml(text) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(text, 'application/xml');
        var errs = doc.getElementsByTagName('parsererror');
        for (var i = 0; i < errs.length; i++) {
            if (errs[i].namespaceURI) {
                var raw = errs[i].textContent || '';
                var pos = extractLineCol(raw);
                var err = { message: cleanMessage(raw) };
                if (pos) {
                    err.line = pos.line;
                    err.col = pos.col;
                    var lines = text.split(/\r\n|\r|\n/);
                    err.lineText = lines[pos.line - 1] || '';
                    var caret = '';
                    for (var k = 1; k < pos.col; k++) caret += ' ';
                    err.caret = caret + '^';
                }
                return { ok: false, error: err };
            }
        }
        return { ok: true, doc: doc };
    }

    function extractDecl(text) {
        var m = text.match(/^\s*(<\?xml[^?]*\?>)/);
        return m ? m[1] : '';
    }

    function extractDoctype(text) {
        var m = text.match(/<!DOCTYPE(?:[^>\[]|\[[^\]]*\])*>/);
        return m ? m[0] : '';
    }

    function escapeText(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function escapeAttr(s) {
        return escapeText(s).replace(/"/g, '&quot;');
    }

    function hasPreserve(el) {
        var n = el;
        while (n && n.nodeType === 1) {
            if (n.getAttribute && n.getAttribute('xml:space') === 'preserve') return true;
            n = n.parentNode;
        }
        return false;
    }

    function isSignificantWs(node) {
        var v = node.nodeValue || '';
        if (/[\n\r\t]/.test(v)) return false;
        return v.length > 0;
    }

    function isMixed(el) {
        if (hasPreserve(el)) return true;
        var kids = el.childNodes;
        for (var i = 0; i < kids.length; i++) {
            var k = kids[i];
            if (k.nodeType === 3) {
                var v = k.nodeValue || '';
                if (v.trim() !== '') return true;
                if (isSignificantWs(k) && i !== 0 && i !== kids.length - 1) return true;
            }
        }
        return false;
    }
    
  function attrsOf(el) {
        var out = '';
        for (var i = 0; i < el.attributes.length; i++) {
            var a = el.attributes[i];
            out += ' ' + a.name + '="' + escapeAttr(a.value) + '"';
        }
        return out;
    }

    function compactNode(node) {
        if (node.nodeType === 3) return escapeText(node.nodeValue || '');
        if (node.nodeType === 4) return '<![CDATA[' + (node.nodeValue || '') + ']]>';
        if (node.nodeType === 8) return '<!--' + (node.nodeValue || '') + '-->';
        if (node.nodeType === 7) return '<?' + node.nodeName + ((node.nodeValue || '') ? ' ' + node.nodeValue : '') + '?>';
        if (node.nodeType === 1) {
            var tag = node.nodeName + attrsOf(node);
            var kids = node.childNodes;
            if (kids.length === 0) return '<' + tag + '/>';
            var keepWs = hasPreserve(node);
            var inner = '';
            for (var i = 0; i < kids.length; i++) {
                var k = kids[i];
                if (k.nodeType === 3 && !keepWs) {
                    var v = k.nodeValue || '';
                    if (v.trim() === '' && (/[\n\r\t]/.test(v) || i === 0 || i === kids.length - 1)) continue;
                }
                inner += compactNode(k);
            }
            return '<' + tag + '>' + inner + '</' + node.nodeName + '>';
        }
        return '';
    }

    function prettyNode(node, ind, lvl) {
        if (node.nodeType === 3) return escapeText(node.nodeValue || '');
        if (node.nodeType === 4) return '<![CDATA[' + (node.nodeValue || '') + ']]>';
        if (node.nodeType === 8) return '<!--' + (node.nodeValue || '') + '-->';
        if (node.nodeType === 7) return '<?' + node.nodeName + ((node.nodeValue || '') ? ' ' + node.nodeValue : '') + '?>';
        if (node.nodeType !== 1) return '';
        var tag = node.nodeName + attrsOf(node);
        var kids = node.childNodes;
        var pad = '';
        for (var p = 0; p < lvl; p++) pad += ind;
        if (kids.length === 0) return pad + '<' + tag + '/>';
        if (kids.length === 1 && (kids[0].nodeType === 3 || kids[0].nodeType === 4)) {
            return pad + '<' + tag + '>' + (kids[0].nodeType === 3 ? escapeText(kids[0].nodeValue || '') : '<![CDATA[' + (kids[0].nodeValue || '') + ']]>') + '</' + node.nodeName + '>';
        }
        if (isMixed(node)) {
            var inner = '';
            for (var i = 0; i < kids.length; i++) inner += compactNode(kids[i]);
            return pad + '<' + tag + '>' + inner + '</' + node.nodeName + '>';
        }
        var childPad = pad + ind;
        var lines = [pad + '<' + tag + '>'];
        for (var j = 0; j < kids.length; j++) {
            var c = kids[j];
            if (c.nodeType === 3) continue;
            var s = prettyNode(c, ind, lvl + 1);
            if (c.nodeType === 1) lines.push(s);
            else lines.push(childPad + s);
        }
        lines.push(pad + '</' + node.nodeName + '>');
        return lines.join('\n');
    }

    function serializeDoc(doc, ind, minify) {
        var parts = [];
        var kids = doc.childNodes;
        for (var i = 0; i < kids.length; i++) {
            var k = kids[i];
            if (k.nodeType === 10) continue;
            if (k.nodeType === 3) continue;
            parts.push(minify ? compactNode(k) : prettyNode(k, ind, 0));
        }
        return parts.join(minify ? '' : '\n');
    }

    function walkStats(doc) {
        var elements = 0, attributes = 0, maxDepth = 0;
        function walk(node, depth) {
            if (node.nodeType === 1) {
                elements++;
                attributes += node.attributes.length;
                if (depth > maxDepth) maxDepth = depth;
                var kids = node.childNodes;
                for (var i = 0; i < kids.length; i++) walk(kids[i], depth + 1);
            }
        }
        if (doc.documentElement) walk(doc.documentElement, 1);
        return { elements: elements, attributes: attributes, maxDepth: maxDepth };
    }

    function indentUnit(v) {
        if (v === '2') return '  ';
        if (v === 'tab') return '\t';
        return '    ';
    }

    function formatXml(raw, mode, indentValue) {
        var text = String(raw == null ? '' : raw);
        if (byteLen(text) > MAX_BYTES) {
            return { ok: false, error: { message: 'Văn bản vượt quá giới hạn 2 MB, hãy chia nhỏ tài liệu rồi xử lý từng phần.' } };
        }
        var parsed = parseXml(text);
        if (!parsed.ok) return parsed;
        var doc = parsed.doc;
        var decl = extractDecl(text);
        var dt = extractDoctype(text);
        var body = mode === 'minify' ? serializeDoc(doc, '', true) : serializeDoc(doc, indentUnit(indentValue), false);
        var head = [];
        if (decl) head.push(decl);
        if (dt) head.push(dt);
        var output = (head.length ? head.join(mode === 'minify' ? '' : '\n') + (mode === 'minify' ? '' : '\n') : '') + body;
        var st = walkStats(doc);
        var inBytes = byteLen(text);
        var outBytes = byteLen(output);
        var pct = inBytes === 0 ? 0 : ((outBytes - inBytes) / inBytes) * 100;
        return {
            ok: true,
            output: output,
            stats: {
                elements: st.elements,
                attributes: st.attributes,
                maxDepth: st.maxDepth,
                lines: output === '' ? 0 : output.split('\n').length,
                inBytes: inBytes,
                outBytes: outBytes,
                pct: Math.round(pct * 10) / 10
            }
        };
    }

    return {
        MAX_BYTES: MAX_BYTES,
        detectMode: detectMode,
        byteLen: byteLen,
        formatBytes: formatBytes,
        extractLineCol: extractLineCol,
        cleanMessage: cleanMessage,
        parseXml: parseXml,
        extractDecl: extractDecl,
        extractDoctype: extractDoctype,
        formatXml: formatXml,
        walkStats: walkStats,
        compactNode: compactNode,
        prettyNode: prettyNode
    };
})();
/* PURE LOGIC END */

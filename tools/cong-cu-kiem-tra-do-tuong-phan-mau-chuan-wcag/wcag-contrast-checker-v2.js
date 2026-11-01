document.addEventListener('DOMContentLoaded', function() {
    var fgColor = document.getElementById('wc2FgColor');
    var fgHex = document.getElementById('wc2FgHex');
    var bgColor = document.getElementById('wc2BgColor');
    var bgHex = document.getElementById('wc2BgHex');
    var preview = document.getElementById('wc2Preview');
    var errEl = document.getElementById('wc2Error');
    var resultsEl = document.getElementById('wc2Results');
    var badgesEl = document.getElementById('wc2Badges');
    var ratioEl = document.getElementById('wc2Ratio');
    var verdictEl = document.getElementById('wc2Verdict');
    var lumEl = document.getElementById('wc2Lum');
    var fixBox = document.getElementById('wc2Fix');
    var fixBtn = document.getElementById('wc2FixBtn');
    var fixNote = document.getElementById('wc2FixNote');
    var copyBtn = document.getElementById('wc2Copy');

    var lastValidFg = '#111111';
    var lastValidBg = '#FDFD96';
    var lastRatio = 0;
    var lastPass = { nAA: true, nAAA: true, lAA: true, lAAA: true, ntAA: true };

    function hexToRgb(hex) {
        var m = /^#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i.exec(hex);
        if (!m) return null;
        return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
    }
    function rgbToHex(rgb) {
        function p(v) { var s = v.toString(16).toUpperCase(); return s.length === 1 ? '0' + s : s; }
        return '#' + p(rgb.r) + p(rgb.g) + p(rgb.b);
    }
    function lin(c) {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    function luminance(rgb) {
        return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
    }
    function contrastRatio(fg, bg) {
        var lf = luminance(fg), lb = luminance(bg);
        var hi = Math.max(lf, lb), lo = Math.min(lf, lb);
        return { ratio: (hi + 0.05) / (lo + 0.05), lf: lf, lb: lb };
    }
    function fmt(n, dp) { return n.toFixed(dp); }
    function fmtRatio(r) {
        return fmt(r, 2).replace('.', ',') + ' : 1';
    }
    function setBadge(el, pass) {
        el.textContent = pass ? 'PASS' : 'FAIL';
        el.className = 'wc2-badge ' + (pass ? 'wc2-badge-pass' : 'wc2-badge-fail');
    }
    function isFullHex(v) { return /^#[0-9A-F]{6}$/i.test(v); }

    function update() {
        var f = fgHex.value, b = bgHex.value;
        if (!isFullHex(f) || !isFullHex(b)) {
            errEl.hidden = false;
            resultsEl.hidden = true;
            badgesEl.hidden = true;
            return;
        }
        errEl.hidden = true;
        resultsEl.hidden = false;
        badgesEl.hidden = false;
        f = f.toUpperCase(); b = b.toUpperCase();
        fgHex.value = f; bgHex.value = b;
        fgColor.value = f; bgColor.value = b;
        lastValidFg = f; lastValidBg = b;

        var fg = hexToRgb(f), bg = hexToRgb(b);
        var res = contrastRatio(fg, bg);
        lastRatio = res.ratio;
        preview.style.color = f;
        preview.style.backgroundColor = b;
        ratioEl.textContent = fmtRatio(res.ratio);
        ratioEl.style.color = res.ratio >= 4.5 ? '#b5ead7' : (res.ratio >= 3.0 ? '#fdfd96' : '#ffb7b2');

        var p = {
            nAA: res.ratio >= 4.5, nAAA: res.ratio >= 7.0,
            lAA: res.ratio >= 3.0, lAAA: res.ratio >= 4.5, ntAA: res.ratio >= 3.0
        };
        lastPass = p;
        setBadge(document.getElementById('wc2BadgeNormalAA'), p.nAA);
        setBadge(document.getElementById('wc2BadgeNormalAAA'), p.nAAA);
        setBadge(document.getElementById('wc2BadgeLargeAA'), p.lAA);
        setBadge(document.getElementById('wc2BadgeLargeAAA'), p.lAAA);
        setBadge(document.getElementById('wc2BadgeNonTextAA'), p.ntAA);

        if (p.nAAA) verdictEl.textContent = 'Đạt cả AAA cho chữ thường — cặp màu này đọc tốt ở mọi cỡ chữ.';
        else if (p.nAA) verdictEl.textContent = 'Đạt AA cho chữ thường và AAA cho chữ lớn.';
        else if (p.lAA) verdictEl.textContent = 'Chỉ đạt cho chữ lớn và thành phần giao diện — chữ thường chưa đạt AA.';
        else verdictEl.textContent = 'Chưa đạt mức tối thiểu — chữ lớn và thành phần giao diện cũng chưa đạt.';

        // Luminance shown in text/background order (not light/dark order)
        var lf = luminance(fg), lb = luminance(bg);
        lumEl.textContent = 'Độ chói: chữ L = ' + fmt(lf, 4).replace('.', ',') + ' · nền L = ' + fmt(lb, 4).replace('.', ',');

        fixBox.hidden = p.nAA;
        fixNote.hidden = true;
    }

    // Suggest-fix: step the darker color toward black, or the lighter toward
    // white, one RGB unit at a time; apply whichever reaches 4.5:1 with the
    // smaller total channel change. At least one direction always reaches it.
    function steppedCandidate(rgb, dir, target) {
        var cur = { r: rgb.r, g: rgb.g, b: rgb.b };
        var delta = 0;
        for (var i = 0; i < 256; i++) {
            var done = dir < 0
                ? (cur.r === 0 && cur.g === 0 && cur.b === 0)
                : (cur.r === 255 && cur.g === 255 && cur.b === 255);
            if (done) break;
            if (cur.r !== (dir < 0 ? 0 : 255)) { cur.r += dir; delta++; }
            if (cur.g !== (dir < 0 ? 0 : 255)) { cur.g += dir; delta++; }
            if (cur.b !== (dir < 0 ? 0 : 255)) { cur.b += dir; delta++; }
            if (contrastRatio(cur, target).ratio >= 4.5) return { rgb: cur, delta: delta };
        }
        return null;
    }
    function applyFix() {
        var fg = hexToRgb(lastValidFg), bg = hexToRgb(lastValidBg);
        var lf = luminance(fg), lb = luminance(bg);
        var darkIsFg = lf <= lb;
        var dark = darkIsFg ? fg : bg, light = darkIsFg ? bg : fg;
        var candDark = steppedCandidate(dark, -1, light);
        var candLight = steppedCandidate(light, 1, dark);
        var pick = null, role = '';
        if (candDark && candLight) {
            if (candDark.delta <= candLight.delta) { pick = candDark; role = darkIsFg ? 'màu chữ' : 'màu nền'; }
            else { pick = candLight; role = darkIsFg ? 'màu nền' : 'màu chữ'; }
        } else if (candDark) { pick = candDark; role = darkIsFg ? 'màu chữ' : 'màu nền'; }
        else if (candLight) { pick = candLight; role = darkIsFg ? 'màu nền' : 'màu chữ'; }
        if (!pick) return;
        var hex = rgbToHex(pick.rgb);
        if (role === 'màu chữ') { fgHex.value = hex; fgColor.value = hex; }
        else { bgHex.value = hex; bgColor.value = hex; }
        update();
        fixNote.hidden = false;
        fixNote.textContent = 'Đã chỉnh ' + role + ' thành ' + hex + ' — tỷ lệ mới ' + fmtRatio(lastRatio) + '.';
    }

    function formatHexInput(e) {
        var val = e.target.value.replace(/[^a-fA-F0-9]/g, '');
        if (val.length > 0) val = '#' + val;
        e.target.value = val;
        update();
    }
    function expandShort(e) {
        var val = e.target.value;
        if (/^#[0-9A-F]{3}$/i.test(val)) {
            val = '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
            e.target.value = val.toUpperCase();
            update();
        }
    }

    fgColor.addEventListener('input', function(e) { fgHex.value = e.target.value.toUpperCase(); update(); });
    bgColor.addEventListener('input', function(e) { bgHex.value = e.target.value.toUpperCase(); update(); });
    fgHex.addEventListener('input', formatHexInput);
    bgHex.addEventListener('input', formatHexInput);
    fgHex.addEventListener('change', expandShort);
    bgHex.addEventListener('change', expandShort);

    document.getElementById('wc2Swap').addEventListener('click', function() {
        var t = fgHex.value; fgHex.value = bgHex.value; bgHex.value = t;
        fgColor.value = fgHex.value; bgColor.value = bgHex.value;
        update();
    });
    document.querySelectorAll('.wc2-chip').forEach(function(chip) {
        chip.addEventListener('click', function() {
            fgHex.value = chip.getAttribute('data-fg');
            bgHex.value = chip.getAttribute('data-bg');
            fgColor.value = fgHex.value; bgColor.value = bgHex.value;
            update();
        });
    });
    fixBtn.addEventListener('click', applyFix);
    copyBtn.addEventListener('click', function() {
        var text = 'Tương phản ' + lastValidFg + ' trên ' + lastValidBg + ': ' + fmtRatio(lastRatio)
            + ' — Chữ thường AA: ' + (lastPass.nAA ? 'PASS' : 'FAIL')
            + ', AAA: ' + (lastPass.nAAA ? 'PASS' : 'FAIL')
            + '; Chữ lớn AA: ' + (lastPass.lAA ? 'PASS' : 'FAIL')
            + ', AAA: ' + (lastPass.lAAA ? 'PASS' : 'FAIL')
            + '; Phi văn bản AA: ' + (lastPass.ntAA ? 'PASS' : 'FAIL') + '.';
        function done() { copyBtn.textContent = 'Đã sao chép!'; setTimeout(function() { copyBtn.textContent = 'Sao chép kết quả'; }, 2000); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function() { fallbackCopy(text); done(); });
        } else { fallbackCopy(text); done(); }
        function fallbackCopy(t) {
            var ta = document.createElement('textarea');
            ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(ta);
        }
    });

    update();
});

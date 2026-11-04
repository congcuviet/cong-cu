document.addEventListener('DOMContentLoaded', function() {
    var fileInput = document.getElementById('ar2-file-input');
    var drop = document.getElementById('ar2-drop');
    var filenameEl = document.getElementById('ar2-filename');
    var sourceMeta = document.getElementById('ar2-source-meta');
    var settingsBox = document.getElementById('ar2-settings');
    var ratioBox = document.getElementById('ar2-ratios');
    var modeSeg = document.getElementById('ar2-mode-seg');
    var modeHint = document.getElementById('ar2-mode-hint');
    var padbgSeg = document.getElementById('ar2-padbg-seg');
    var anchorSeg = document.getElementById('ar2-anchor-seg');
    var previewBox = document.getElementById('ar2-preview-box');
    var previewFrame = document.getElementById('ar2-preview-frame');
    var previewVideo = document.getElementById('ar2-preview-video');
    var planEl = document.getElementById('ar2-plan');
    var metaEl = document.getElementById('ar2-meta');
    var customW = document.getElementById('ar2-custom-w');
    var customH = document.getElementById('ar2-custom-h');
    var btnStart = document.getElementById('ar2-btn-start');
    var btnCancel = document.getElementById('ar2-btn-cancel');
    var progressBox = document.getElementById('ar2-progress');
    var statusText = document.getElementById('ar2-status-text');
    var detailText = document.getElementById('ar2-detail-text');
    var progressFill = document.getElementById('ar2-progress-fill');
    var errorEl = document.getElementById('ar2-error');
    var resultBox = document.getElementById('ar2-result');
    var resultMeta = document.getElementById('ar2-result-meta');
    var resultVideo = document.getElementById('ar2-result-video');
    var btnDownload = document.getElementById('ar2-btn-download');
    var btnAgain = document.getElementById('ar2-btn-again');

    var state = { file: null, srcW: 0, srcH: 0, duration: 0, ratio: '16:9', custom: null, mode: 'pad', padbg: 'black', anchor: 'center', ffmpeg: null, running: false, cancelled: false, resultUrl: null, resultName: '' };

    /* PURE LOGIC START */
    function roundEven(n) { var r = Math.round(n); return r % 2 !== 0 ? r - 1 : r; }
    function parseRatio(text) { var p = String(text).split(':'); return { num: parseInt(p[0], 10), den: parseInt(p[1], 10) }; }
    function fmtSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1).replace('.', ',') + ' KB';
        return (bytes / 1048576).toFixed(1).replace('.', ',') + ' MB';
    }
    function fmtClock(sec) {
        if (!isFinite(sec) || sec < 0) return '0:00';
        var m = Math.floor(sec / 60);
        var s = Math.floor(sec % 60);
        return m + ':' + (s < 10 ? '0' + s : s);
    }
    function parseLogTime(msg) {
        var m = msg.match(/time=\s*(\d{2}):(\d{2}):(\d+\.?\d*)/);
        if (!m) return null;
        return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseFloat(m[3]);
    }
    function fitFrame(tW, tH, availW, availH) {
        var r = tW / tH;
        var w = availW, h = availW / r;
        if (h > availH) { h = availH; w = availH * r; }
        return { w: Math.round(w), h: Math.round(h) };
    }
    function targetDims(srcW, srcH, num, den, mode) {
        var target = num / den;
        var orig = srcW / srcH;
        var w = srcW, h = srcH;
        if (mode === 'pad') {
            if (orig > target) h = srcW / target; else w = srcH * target;
        } else {
            if (orig > target) w = srcH * target; else h = srcW / target;
        }
        return { w: roundEven(w), h: roundEven(h) };
    }
    function planFor(srcW, srcH, tW, tH, mode, anchor) {
        if (mode === 'pad') {
            var padX = tW - srcW, padY = tH - srcH;
            var padLeft = Math.floor(padX / 2), padRight = padX - padLeft;
            var padTop = Math.floor(padY / 2), padBottom = padY - padTop;
            var text = 'Xuất ra ' + tW + ' × ' + tH + ' px. ';
            if (padX > 0) text += 'Thêm viền ' + padLeft + ' px trái, ' + padRight + ' px phải.';
            else if (padY > 0) text += 'Thêm viền ' + padTop + ' px trên, ' + padBottom + ' px dưới.';
            else text += 'Không thêm viền, hình vừa đúng khung.';
            return { padX: padX, padY: padY, padLeft: padLeft, padRight: padRight, padTop: padTop, padBottom: padBottom, text: text };
        }
        if (mode === 'crop') {
            var cutX = srcW - tW, cutY = srcH - tH;
            var cutLeft = 0, cutRight = 0, cutTop = 0, cutBottom = 0;
            if (anchor === 'start') { cutRight = cutX; cutBottom = cutY; }
            else if (anchor === 'end') { cutLeft = cutX; cutTop = cutY; }
            else { cutLeft = Math.floor(cutX / 2); cutRight = cutX - cutLeft; cutTop = Math.floor(cutY / 2); cutBottom = cutY - cutTop; }
            var text2 = 'Xuất ra ' + tW + ' × ' + tH + ' px. ';
            if (cutX > 0) text2 += 'Cắt ' + cutLeft + ' px trái, ' + cutRight + ' px phải.';
            else if (cutY > 0) text2 += 'Cắt ' + cutTop + ' px trên, ' + cutBottom + ' px dưới.';
            else text2 += 'Không cắt gì, hình vừa đúng khung.';
            return { cutX: cutX, cutY: cutY, cutLeft: cutLeft, cutRight: cutRight, cutTop: cutTop, cutBottom: cutBottom, text: text2 };
        }
        var scaleW = Math.round(tW / srcW * 100), scaleH = Math.round(tH / srcH * 100);
        var distort = Math.round(Math.abs(tW * srcH / (srcW * tH) - 1) * 100);
        return { scaleW: scaleW, scaleH: scaleH, distort: distort, text: 'Xuất ra ' + tW + ' × ' + tH + ' px. Giãn ngang ' + scaleW + '%, giãn dọc ' + scaleH + '% — hình méo khoảng ' + distort + '% so với gốc.' };
    }
    function buildFilter(srcW, srcH, tW, tH, mode, padbg, anchor) {
        if (mode === 'pad') return 'scale=' + tW + ':' + tH + ':force_original_aspect_ratio=decrease,pad=' + tW + ':' + tH + ':(ow-iw)/2:(oh-ih)/2:' + padbg;
        if (mode === 'crop') {
            var p = planFor(srcW, srcH, tW, tH, 'crop', anchor);
            var x = 0, y = 0;
            if (p.cutX > 0) x = anchor === 'start' ? 0 : (anchor === 'end' ? 'iw-ow' : '(iw-ow)/2');
            if (p.cutY > 0) y = anchor === 'start' ? 0 : (anchor === 'end' ? 'ih-oh' : '(ih-oh)/2');
            return 'scale=' + tW + ':' + tH + ':force_original_aspect_ratio=increase,crop=' + tW + ':' + tH + ':' + x + ':' + y;
        }
        return 'scale=' + tW + ':' + tH;
    }
    function outputName(base, ratioText) { return base + '_' + ratioText.replace(':', 'x') + '_congcuviet.mp4'; }
    function ratioTextOf(num, den) { return num + ':' + den; }
    /* PURE LOGIC END */

    function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
    function hideError() { errorEl.hidden = true; }
    function hideResult() { resultBox.hidden = true; if (state.resultUrl) { URL.revokeObjectURL(state.resultUrl); state.resultUrl = null; } }
    function currentRatio() { return state.custom || parseRatio(state.ratio); }

    function modeText() {
        if (state.mode === 'pad') return 'Giữ toàn bộ hình, phần thừa thành viền.';
        if (state.mode === 'crop') return 'Phóng to lấp đầy khung, cắt phần thừa ở mép.';
        return 'Kéo giãn hình cho vừa khung, hình có thể bị méo.';
    }

    function updatePlan() {
        modeHint.textContent = modeText();
        padbgSeg.hidden = state.mode !== 'pad';
        anchorSeg.hidden = state.mode !== 'crop';
        if (!state.file || !state.srcW) return;
        var r = currentRatio();
        var d = targetDims(state.srcW, state.srcH, r.num, r.den, state.mode);
        var p = planFor(state.srcW, state.srcH, d.w, d.h, state.mode, state.anchor);
        planEl.textContent = p.text;
        metaEl.textContent = 'Gốc: ' + state.srcW + ' × ' + state.srcH + ' px ➡️ Xuất ra: ' + d.w + ' × ' + d.h + ' px';
        var fit = fitFrame(d.w, d.h, Math.max(200, previewBox.clientWidth - 20), 320);
        previewFrame.style.width = fit.w + 'px';
        previewFrame.style.height = fit.h + 'px';
        previewVideo.style.objectFit = state.mode === 'pad' ? 'contain' : (state.mode === 'crop' ? 'cover' : 'fill');
    }

    function segClick(seg, attr, fn) {
        seg.addEventListener('click', function(e) {
            var btn = e.target.closest('button');
            if (!btn) return;
            var btns = seg.querySelectorAll('button');
            btns.forEach(function(b) { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('is-active');
            btn.setAttribute('aria-pressed', 'true');
            fn(btn.getAttribute(attr));
            updatePlan();
        });
    }
    segClick(modeSeg, 'data-ar2-mode', function(v) { state.mode = v; });
    segClick(padbgSeg, 'data-ar2-padbg', function(v) { state.padbg = v; });
    segClick(anchorSeg, 'data-ar2-anchor', function(v) { state.anchor = v; });

    ratioBox.addEventListener('click', function(e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        ratioBox.querySelectorAll('button').forEach(function(b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        state.ratio = btn.getAttribute('data-ar2-ratio');
        state.custom = null;
        customW.value = ''; customH.value = '';
        updatePlan();
    });

    function customInput() {
        var w = parseInt(customW.value, 10), h = parseInt(customH.value, 10);
        if (w >= 1 && w <= 100 && h >= 1 && h <= 100) {
            state.custom = { num: w, den: h };
            ratioBox.querySelectorAll('button').forEach(function(b) { b.classList.remove('is-active'); });
        } else {
            state.custom = null;
        }
        updatePlan();
    }
    customW.addEventListener('input', customInput);
    customH.addEventListener('input', customInput);

    function loadFile(file) {
        hideError(); hideResult();
        if (!file) return;
        var isVideo = (file.type && file.type.indexOf('video/') === 0) || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(file.name);
        if (!isVideo) {
            showError('File đã chọn không phải video. Hãy chọn một file video.');
            settingsBox.hidden = true;
            return;
        }
        state.file = file;
        filenameEl.textContent = file.name;
        var url = URL.createObjectURL(file);
        previewVideo.src = url;
        previewVideo.onloadedmetadata = function() {
            state.srcW = previewVideo.videoWidth;
            state.srcH = previewVideo.videoHeight;
            state.duration = previewVideo.duration;
            if (!state.srcW || !state.srcH) {
                showError('Không đọc được kích thước video này. Hãy thử video khác.');
                settingsBox.hidden = true;
                return;
            }
            sourceMeta.textContent = file.name + ' — ' + fmtSize(file.size) + ' — ' + fmtClock(state.duration) + ' — ' + state.srcW + ' × ' + state.srcH + ' px';
            sourceMeta.hidden = false;
            settingsBox.hidden = false;
            try { previewVideo.currentTime = Math.min(1, state.duration / 2); } catch (e) {}
            updatePlan();
        };
        previewVideo.onerror = function() {
            showError('Không đọc được file video này. Hãy thử video khác.');
            settingsBox.hidden = true;
        };
    }

    fileInput.addEventListener('change', function(e) { if (e.target.files.length) loadFile(e.target.files[0]); });
    drop.addEventListener('dragover', function(e) { e.preventDefault(); drop.classList.add('is-drag'); });
    drop.addEventListener('dragleave', function() { drop.classList.remove('is-drag'); });
    drop.addEventListener('drop', function(e) {
        e.preventDefault(); drop.classList.remove('is-drag');
        if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
    });

    btnStart.addEventListener('click', async function() {
        if (!state.file) { showError('Hãy chọn video trước.'); return; }
        if (!state.srcW) { showError('Video chưa tải xong thông tin. Hãy đợi một chút rồi thử lại.'); return; }
        hideError(); hideResult();
        state.running = true; state.cancelled = false;
        btnStart.disabled = true; btnCancel.hidden = false;
        progressBox.hidden = false;
        statusText.textContent = 'Đang khởi tạo lõi xử lý...';
        progressFill.style.width = '2%';
        detailText.textContent = '';
        var inputName = null, outputNameStr = 'output.mp4';
        try {
            if (typeof FFmpeg === 'undefined' || !FFmpeg.createFFmpeg) throw new Error('ffmpeg-missing');
            if (!state.ffmpeg) {
                var createFFmpeg = FFmpeg.createFFmpeg;
                state.ffmpeg = createFFmpeg({
                    corePath: 'https://congcuviet.com/wp-content/themes/bricks-child/tai-nguyen/ffmpeg-core.js',
                    logger: function(log) {
                        var msg = log.message || '';
                        if (state.duration > 0) {
                            var t = parseLogTime(msg);
                            if (t !== null) {
                                var p = Math.min(100, Math.round(t / state.duration * 100));
                                progressFill.style.width = p + '%';
                                statusText.textContent = 'Đang đổi tỷ lệ: ' + p + '%';
                                detailText.textContent = 'Đã xử lý: ' + t.toFixed(1) + 's / ' + state.duration.toFixed(1) + 's';
                            }
                        }
                    }
                });
                statusText.textContent = 'Đang tải thư viện xử lý (chỉ tải lần đầu)...';
                await state.ffmpeg.load();
            }
            if (state.cancelled) throw new Error('cancelled');
            statusText.textContent = 'Đang nạp file vào bộ nhớ...';
            var fetchFile = FFmpeg.fetchFile;
            var ext = state.file.name.split('.').pop() || 'mp4';
            inputName = 'input.' + ext;
            await state.ffmpeg.FS('writeFile', inputName, await fetchFile(state.file));
            var r = currentRatio();
            var d = targetDims(state.srcW, state.srcH, r.num, r.den, state.mode);
            var filter = buildFilter(state.srcW, state.srcH, d.w, d.h, state.mode, state.padbg, state.anchor);
            statusText.textContent = 'Bắt đầu đổi tỷ lệ về ' + d.w + ' × ' + d.h + '...';
            var done = false, lastErr = null;
            var audioModes = ['copy', 'aac'];
            for (var i = 0; i < audioModes.length && !done; i++) {
                if (state.cancelled) break;
                try {
                    await state.ffmpeg.run('-i', inputName, '-vf', filter, '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', audioModes[i], outputNameStr);
                    done = true;
                } catch (e) { lastErr = e; if (state.cancelled) break; }
            }
            if (state.cancelled) throw new Error('cancelled');
            if (!done) throw lastErr || new Error('encode-failed');
            statusText.textContent = 'Hoàn tất! Đang đóng gói file...';
            var data = state.ffmpeg.FS('readFile', outputNameStr);
            if (!data || data.length === 0) throw new Error('empty-output');
            var base = state.file.name.replace(/\.[^.]+$/, '') || state.file.name;
            state.resultName = outputName(base, ratioTextOf(r.num, r.den));
            var blob = new Blob([data.buffer], { type: 'video/mp4' });
            state.resultUrl = URL.createObjectURL(blob);
            resultVideo.src = state.resultUrl;
            resultMeta.textContent = state.resultName + ' — ' + d.w + ' × ' + d.h + ' px — ' + fmtSize(data.length);
            resultBox.hidden = false;
            statusText.textContent = 'Xong! Video đã đổi tỷ lệ thành công.';
            detailText.textContent = '';
            progressFill.style.width = '100%';
        } catch (err) {
            if (state.cancelled || (err && err.message === 'cancelled')) {
                statusText.textContent = 'Đã hủy xử lý.';
                detailText.textContent = 'Video gốc không thay đổi.';
            } else if (err && err.message === 'ffmpeg-missing') {
                showError('Không tải được thư viện xử lý. Hãy kiểm tra kết nối mạng rồi thử lại.');
                progressBox.hidden = true;
            } else if (err && err.message === 'empty-output') {
                showError('Xử lý xong nhưng file đầu ra trống. Hãy thử video khác hoặc kích thước nhỏ hơn.');
                progressBox.hidden = true;
            } else {
                showError('Xử lý thất bại. Hãy thử video khác, kích thước nhỏ hơn, hoặc tải lại trang rồi thử lại.');
                progressBox.hidden = true;
            }
        } finally {
            try { if (inputName && state.ffmpeg) state.ffmpeg.FS('unlink', inputName); } catch (e) {}
            try { if (state.ffmpeg) state.ffmpeg.FS('unlink', outputNameStr); } catch (e) {}
            state.running = false;
            btnStart.disabled = false; btnCancel.hidden = true;
        }
    });

    btnCancel.addEventListener('click', function() {
        state.cancelled = true;
        statusText.textContent = 'Đang hủy...';
        btnCancel.hidden = true;
    });

    btnDownload.addEventListener('click', function() {
        if (!state.resultUrl) return;
        var a = document.createElement('a');
        a.href = state.resultUrl; a.download = state.resultName; a.click();
    });

    btnAgain.addEventListener('click', function() {
        hideResult(); progressBox.hidden = true; hideError();
        fileInput.value = '';
        filenameEl.textContent = 'Nhấp để chọn video, hoặc kéo thả video vào đây';
        sourceMeta.hidden = true; settingsBox.hidden = true;
        state.file = null; state.srcW = 0; state.srcH = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
document.addEventListener('DOMContentLoaded', function () {
    function $(id) { return document.getElementById(id); }
    var fileInput = $('lp2-file-input');
    var uploadBox = $('lp2-upload-box');
    var filenameEl = $('lp2-filename');
    var filesizeEl = $('lp2-filesize');
    var playerBox = $('lp2-player-box');
    var player = $('lp2-player');
    var sourceLine = $('lp2-source-line');
    var outputLine = $('lp2-output-line');
    var estLine = $('lp2-est-line');
    var countInput = $('lp2-loop-count');
    var errorEl = $('lp2-error');
    var btnStart = $('lp2-btn-start');
    var btnNew = $('lp2-btn-new');
    var statusBox = $('lp2-status-box');
    var statusText = $('lp2-status-text');
    var detailText = $('lp2-detail-text');
    var progressFill = $('lp2-progress-fill');
    var resultBox = $('lp2-result-box');
    var resultPlayer = $('lp2-result-player');
    var resultMeta = $('lp2-result-meta');
    var btnDownload = $('lp2-btn-download');
    var targetInput = $('lp2-target-sec');
    var targetLine = $('lp2-target-line');
    var videoFile = null;
    var ffmpeg = null;
    var sourceDuration = 0;
    var loopCount = 3;
    var playerUrl = null;
    var resultUrl = null;
    var resultName = '';

    function fmtNum(n) {
        var s = n.toFixed(1).replace('.', ',');
        if (s.slice(-2) === ',0') s = s.slice(0, -2);
        return s;
    }
    function fmtDur(sec) {
        if (!(sec > 0)) return '0s';
        var h = Math.floor(sec / 3600);
        var m = Math.floor((sec % 3600) / 60);
        var s = sec - h * 3600 - m * 60;
        var sTxt = fmtNum(s) + 's';
        if (h > 0) return h + 'h ' + m + 'm ' + sTxt;
        if (m > 0) return m + 'm ' + sTxt;
        return sTxt;
    }
    function fmtSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return fmtNum(bytes / 1024) + ' KB';
        return fmtNum(bytes / 1048576) + ' MB';
    }
    function clampCount(n) {
        if (isNaN(n)) return 2;
        if (n < 2) return 2;
        if (n > 100) return 100;
        return Math.floor(n);
    }
    function suggestCount(targetSec, dur) {
        if (!(dur > 0) || !(targetSec > 0)) return null;
        var n = Math.ceil(targetSec / dur);
        if (n < 2) n = 2;
        if (n > 100) n = 100;
        return n;
    }
    function buildList(inputName, n) {
        var out = '';
        for (var i = 0; i < n; i++) out += "file '" + inputName + "'\n";
        return out;
    }
    function outputName(fileName, n) {
        var base = fileName;
        var dot = fileName.lastIndexOf('.');
        if (dot > 0) base = fileName.substring(0, dot);
        return base + '_looped_' + n + 'x_congcuviet.mp4';
    }
    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.hidden = false;
    }
    function hideError() { errorEl.hidden = true; }
    function updateOutput() {
        if (!(sourceDuration > 0)) {
            outputLine.textContent = '';
            estLine.textContent = '';
            return;
        }
        var total = sourceDuration * loopCount;
        outputLine.textContent = 'Nguồn ' + fmtDur(sourceDuration) + ' × ' + loopCount + ' = ' + fmtDur(total);
        if (videoFile) {
            estLine.textContent = 'Dung lượng ước tính: ~' + fmtSize(videoFile.size * loopCount) + ' (sao chép luồng, gần bằng dung lượng gốc × số lần).';
        }
    }
    function setCount(n) {
        loopCount = clampCount(n);
        countInput.value = loopCount;
        updateOutput();
    }
    function resetAll() {
        if (playerUrl) { URL.revokeObjectURL(playerUrl); playerUrl = null; }
        if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
        videoFile = null;
        sourceDuration = 0;
        fileInput.value = '';
        filenameEl.textContent = 'Nhấp hoặc kéo thả video vào đây…';
        filesizeEl.hidden = true;
        player.removeAttribute('src');
        player.load();
        resultPlayer.removeAttribute('src');
        resultPlayer.load();
        playerBox.hidden = true;
        statusBox.hidden = true;
        resultBox.hidden = true;
        hideError();
        targetLine.textContent = '';
        setCount(3);
    }
    uploadBox.addEventListener('click', function () { fileInput.click(); });
    uploadBox.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });
    ['dragenter', 'dragover'].forEach(function (t) {
        uploadBox.addEventListener(t, function (e) { e.preventDefault(); });
    });
    uploadBox.addEventListener('drop', function (e) {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) loadFile(e.dataTransfer.files[0]);
    });
    function loadFile(file) {
        resetAll();
        videoFile = file;
        filenameEl.textContent = file.name;
        filesizeEl.textContent = fmtSize(file.size);
        filesizeEl.hidden = false;
        if (playerUrl) URL.revokeObjectURL(playerUrl);
        playerUrl = URL.createObjectURL(file);
        player.src = playerUrl;
        playerBox.hidden = false;
        hideError();
        player.onloadedmetadata = function () {
            sourceDuration = player.duration || 0;
            if (sourceDuration > 0) {
                sourceLine.textContent = 'Video gốc: ' + fmtDur(sourceDuration) + ' • ' + fmtSize(file.size);
            } else {
                sourceLine.textContent = 'Video gốc: ' + fmtSize(file.size);
            }
            updateOutput();
        };
    }
    fileInput.addEventListener('change', function () {
        if (fileInput.files.length > 0) loadFile(fileInput.files[0]);
    });
    btnNew.addEventListener('click', function () { resetAll(); fileInput.click(); });
    document.querySelectorAll('[data-count]').forEach(function (btn) {
        btn.addEventListener('click', function () { setCount(parseInt(btn.getAttribute('data-count'), 10)); });
    });
    $('lp2-btn-minus').addEventListener('click', function () { setCount(loopCount - 1); });
    $('lp2-btn-plus').addEventListener('click', function () { setCount(loopCount + 1); });
    countInput.addEventListener('input', function () {
        var v = parseInt(countInput.value, 10);
        if (!isNaN(v)) { loopCount = clampCount(v); updateOutput(); }
    });
    countInput.addEventListener('blur', function () { setCount(parseInt(countInput.value, 10)); });
    $('lp2-btn-target').addEventListener('click', function () {
        var target = parseFloat(String(targetInput.value).replace(',', '.'));
        if (!(target > 0)) { targetLine.textContent = 'Nhập thời lượng đích lớn hơn 0 giây.'; return; }
        if (!(sourceDuration > 0)) { targetLine.textContent = 'Chưa đọc được thời lượng video gốc.'; return; }
        var n = suggestCount(target, sourceDuration);
        var total = sourceDuration * n;
        targetLine.textContent = 'Cần ' + n + ' lần → tổng ' + fmtDur(total) + ' (đích ' + fmtDur(target) + ').';
        setCount(n);
    });
    btnDownload.addEventListener('click', function () {
        if (!resultUrl) return;
        var a = document.createElement('a');
        a.href = resultUrl;
        a.download = resultName;
        a.click();
    });
    btnStart.addEventListener('click', async function () {
        if (!videoFile) { showError('Hãy chọn video trước khi xử lý.'); return; }
        if (!(sourceDuration > 0)) { showError('Chưa đọc được thời lượng video gốc. Hãy phát thử video rồi bấm lại.'); return; }
        if (typeof FFmpeg === 'undefined') { showError('Thư viện xử lý chưa tải được. Hãy tải lại trang và thử lại.'); return; }
        hideError();
        resultBox.hidden = true;
        btnStart.disabled = true;
        statusBox.hidden = false;
        statusText.textContent = 'Đang khởi động lõi xử lý…';
        progressFill.style.width = '2%';
        progressFill.style.background = '#c8b6ff';
        detailText.textContent = '';
        var totalDuration = sourceDuration * loopCount;
        try {
            if (!ffmpeg) {
                var createFFmpeg = FFmpeg.createFFmpeg;
                ffmpeg = createFFmpeg({
                    corePath: 'https://congcuviet.com/wp-content/themes/bricks-child/tai-nguyen/ffmpeg-core.js',
                    logger: function (log) {
                        var message = log.message || '';
                        if (message.indexOf('time=') !== -1) {
                            var match = message.match(/time=\s*(\d{2}):(\d{2}):(\d+\.?\d*)/);
                            if (match && totalDuration > 0) {
                                var cur = parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseFloat(match[3]);
                                var p = Math.round((cur / totalDuration) * 100);
                                if (p > 100) p = 100;
                                progressFill.style.width = p + '%';
                                statusText.textContent = 'Đang lặp video: ' + p + '%';
                                detailText.textContent = 'Chế độ sao chép luồng, giữ nguyên chất lượng gốc.';
                            }
                        }
                    }
                });
                await ffmpeg.load();
            }
            statusText.textContent = 'Đang nạp file vào bộ nhớ…';
            var fetchFile = FFmpeg.fetchFile;
            var ext = videoFile.name.split('.').pop() || 'mp4';
            var inputName = 'input.' + ext;
            var outName = 'output.mp4';
            ffmpeg.FS('writeFile', inputName, await fetchFile(videoFile));
            ffmpeg.FS('writeFile', 'list.txt', new TextEncoder().encode(buildList(inputName, loopCount)));
            statusText.textContent = 'Đang nhân bản video lên ' + loopCount + ' lần…';
            await ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', outName);
            statusText.textContent = 'Hoàn tất! Đang đóng gói file…';
            var data = ffmpeg.FS('readFile', outName);
            if (data.length === 0) throw new Error('empty output');
            var blob = new Blob([data.buffer], { type: 'video/mp4' });
            if (resultUrl) URL.revokeObjectURL(resultUrl);
            resultUrl = URL.createObjectURL(blob);
            resultPlayer.src = resultUrl;
            resultName = outputName(videoFile.name, loopCount);
            resultMeta.textContent = 'Tệp xuất: ' + resultName + ' • ' + fmtSize(blob.size) + ' • Tổng ' + fmtDur(totalDuration);
            statusBox.hidden = true;
            resultBox.hidden = false;
            progressFill.style.width = '100%';
            ffmpeg.FS('unlink', inputName);
            ffmpeg.FS('unlink', 'list.txt');
            ffmpeg.FS('unlink', outName);
        } catch (err) {
            statusText.textContent = 'Xảy ra sự cố khi xử lý video.';
            detailText.textContent = 'Video gốc có thể bị lỗi cấu trúc hoặc trình duyệt hết bộ nhớ. Hãy thử lại với video khác hoặc số lần nhỏ hơn.';
            progressFill.style.background = '#ffadad';
        } finally {
            btnStart.disabled = false;
        }
    });
    setCount(3);
});

function as2ParseNum(text) {
    if (text === null || text === undefined) return NaN;
    return parseFloat(String(text).trim().replace(',', '.'));
}
function as2ClampOffset(value) {
    var v = value;
    if (!isFinite(v)) v = 0;
    if (v > 5) v = 5;
    if (v < -5) v = -5;
    v = Math.round(v * 20) / 20;
    if (v === 0) v = 0;
    return v;
}
function as2FmtOffset(value) {
    var v = as2ClampOffset(value);
    var s = v.toFixed(2);
    if (s.charAt(s.length - 1) === '0') s = s.slice(0, -1);
    return s.replace('.', ',');
}
function as2Verdict(value) {
    var v = as2ClampOffset(value);
    if (v === 0) return 'Độ lệch 0,0 giây — chưa thay đổi gì.';
    if (v > 0) return 'Tiếng đi trước hình ' + as2FmtOffset(v) + ' giây — tiếng sẽ trễ thêm ' + as2FmtOffset(v) + ' giây để khớp hình.';
    return 'Hình đi trước tiếng ' + as2FmtOffset(-v) + ' giây — hình sẽ trễ thêm ' + as2FmtOffset(-v) + ' giây để khớp tiếng.';
}
function as2IsVideoFile(file) {
    if (!file) return false;
    if (file.type && file.type.indexOf('video/') === 0) return true;
    return /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(file.name || '');
}
function as2Ext(name) {
    var n = String(name || '');
    var i = n.lastIndexOf('.');
    if (i > 0 && n.length - i - 1 >= 1 && n.length - i - 1 <= 5) return n.slice(i + 1).toLowerCase();
    return 'mp4';
}
function as2OutputName(name) {
    var n = String(name || 'video');
    var i = n.lastIndexOf('.');
    var base = i > 0 ? n.slice(0, i) : n;
    if (!base) base = n;
    return base + '_synced_congcuviet.mp4';
}
function as2FmtSize(bytes) {
    if (!isFinite(bytes) || bytes < 0) return '—';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1).replace('.', ',') + ' MB';
    return Math.round(bytes / 1024) + ' KB';
}
function as2FmtDuration(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '—';
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' + s : String(s));
}
function as2ParseProgress(message) {
    var match = String(message || '').match(/time=\s*(\d{2}):(\d{2}):(\d+\.?\d*)/);
    if (!match) return null;
    return parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseFloat(match[3]);
}
function as2ProgressPct(current, total) {
    if (!isFinite(current) || !isFinite(total) || total <= 0) return null;
    var p = Math.round((current / total) * 100);
    if (p > 100) p = 100;
    if (p < 0) p = 0;
    return p;
}
function as2PreviewFilter(offset) {
    if (offset > 0) return '[0:a]adelay=delays=\'' + Math.round(offset * 1000) + '|' + Math.round(offset * 1000) + '\':all=1[aout]';
    if (offset < 0) return '[0:v]setpts=PTS+' + Math.abs(offset) + '/TB[vout]';
    return null;
}
function as2PreviewArgs(offset, start) {
    var filter = as2PreviewFilter(offset);
    if (offset > 0) return ['-ss', String(start), '-t', '5', '-i', '__IN__', '-filter_complex', filter, '-map', '0:v', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '__OUT__'];
    if (offset < 0) return ['-ss', String(start), '-t', '5', '-i', '__IN__', '-filter_complex', filter, '-map', '[vout]', '-map', '0:a', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '__OUT__'];
    return ['-ss', String(start), '-t', '5', '-i', '__IN__', '-c:v', 'libx264', '-preset', 'ultrafast', '__OUT__'];
}
function as2FullArgs(offset) {
    if (offset > 0) return ['-itsoffset', String(offset), '-i', '__IN__', '-i', '__IN__', '-map', '1:v:0', '-map', '0:a:0', '-c', 'copy', '__OUT__'];
    return ['-itsoffset', String(Math.abs(offset)), '-i', '__IN__', '-i', '__IN__', '-map', '0:v:0', '-map', '1:a:0', '-c', 'copy', '__OUT__'];
}
document.addEventListener('DOMContentLoaded', function() {
    var boxVideo = document.getElementById('as2-box-video');
    var videoInput = document.getElementById('as2-video-input');
    var iconVideo = document.getElementById('as2-icon-video');
    var videoName = document.getElementById('as2-video-name');
    var metaEl = document.getElementById('as2-meta');
    var errorEl = document.getElementById('as2-error');
    var settingsBox = document.getElementById('as2-settings');
    var videoPlayer = document.getElementById('as2-player');
    var inputOffset = document.getElementById('as2-input-offset');
    var sliderOffset = document.getElementById('as2-slider');
    var verdictEl = document.getElementById('as2-verdict');
    var stepMinus = document.getElementById('as2-step-minus');
    var stepPlus = document.getElementById('as2-step-plus');
    var btnPreview = document.getElementById('as2-btn-preview');
    var btnStart = document.getElementById('as2-btn-start');
    var previewResultBox = document.getElementById('as2-preview-result');
    var previewVideo = document.getElementById('as2-preview-video');
    var statusBox = document.getElementById('as2-status-box');
    var statusText = document.getElementById('as2-status-text');
    var detailText = document.getElementById('as2-detail-text');
    var progressFill = document.getElementById('as2-progress-fill');
    var btnCancel = document.getElementById('as2-btn-cancel');
    var resultBox = document.getElementById('as2-result-box');
    var resultText = document.getElementById('as2-result-text');
    var btnDownloadAgain = document.getElementById('as2-btn-download-again');
    var btnReset = document.getElementById('as2-btn-reset');
    var videoFile = null;
    var videoDuration = 0;
    var ffmpeg = null;
    var cancelling = false;
    var jobTotal = 0;
    var jobLabel = '';
    var lastLogs = [];
    var outputBlobUrl = null;
    var outputName = '';
    var previewBlobUrl = null;

    function showError(message) {
        errorEl.textContent = message;
        errorEl.hidden = false;
    }
    function clearError() {
        errorEl.hidden = true;
        errorEl.textContent = '';
    }
    function getOffset() {
        return as2ParseNum(inputOffset.value);
    }
    function setOffset(value) {
        var v = as2ClampOffset(value);
        sliderOffset.value = String(v);
        inputOffset.value = as2FmtOffset(v);
        verdictEl.textContent = as2Verdict(v);
        return v;
    }
    function stopPreviewVideo() {
        if (previewVideo) {
            try { previewVideo.pause(); } catch (e) {}
        }
    }
    function noAudioInLogs() {
        var joined = lastLogs.join('\n');
        return joined.indexOf('matches no streams') !== -1 || joined.indexOf('Stream map') !== -1;
    }
    function resetAll() {
        stopPreviewVideo();
        if (videoPlayer) {
            try { videoPlayer.pause(); } catch (e) {}
        }
        if (previewBlobUrl) { try { URL.revokeObjectURL(previewBlobUrl); } catch (e) {} }
        if (outputBlobUrl) { try { URL.revokeObjectURL(outputBlobUrl); } catch (e) {} }
        previewBlobUrl = null;
        outputBlobUrl = null;
        outputName = '';
        videoFile = null;
        videoDuration = 0;
        videoInput.value = '';
        iconVideo.textContent = '🎬';
        videoName.textContent = 'Nhấp để tải video bị lệch tiếng...';
        metaEl.hidden = true;
        metaEl.textContent = '';
        clearError();
        settingsBox.hidden = true;
        statusBox.hidden = true;
        resultBox.hidden = true;
        previewResultBox.hidden = true;
        if (previewVideo) previewVideo.removeAttribute('src');
        btnPreview.textContent = '🎧 Nghe thử 5 giây';
        btnPreview.disabled = false;
        btnStart.disabled = false;
        setOffset(0);
    }
    function ensureFFmpeg() {
        if (typeof FFmpeg === 'undefined' || !FFmpeg.createFFmpeg) throw new Error('FFMPEG_MISSING');
        return FFmpeg;
    }
    function loadFFmpeg() {
        return new Promise(function(resolve, reject) {
            try {
                var lib = ensureFFmpeg();
                if (ffmpeg) { resolve(lib); return; }
                var created = lib.createFFmpeg({
                    corePath: 'https://congcuviet.com/wp-content/themes/bricks-child/tai-nguyen/ffmpeg-core.js',
                    logger: function(log) {
                        var message = (log && log.message) || '';
                        lastLogs.push(message);
                        if (lastLogs.length > 200) lastLogs.shift();
                        var current = as2ParseProgress(message);
                        if (current !== null && jobTotal > 0) {
                            var p = as2ProgressPct(current, jobTotal);
                            if (p !== null) {
                                progressFill.style.width = p + '%';
                                statusText.textContent = jobLabel + ': ' + p + '%';
                            }
                        }
                    }
                });
                ffmpeg = created;
                created.load().then(function() { resolve(lib); }).catch(function() { ffmpeg = null; reject(new Error('FFMPEG_LOAD')); });
            } catch (e) {
                reject(e);
            }
        });
    }

    boxVideo.addEventListener('click', function() { videoInput.click(); });
    boxVideo.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); videoInput.click(); }
    });
    sliderOffset.addEventListener('input', function(e) {
        clearError();
        setOffset(parseFloat(e.target.value));
    });
    inputOffset.addEventListener('input', function(e) {
        var v = as2ParseNum(e.target.value);
        if (!isFinite(v)) {
            showError('Nhập độ lệch dạng số, ví dụ 0,4 hoặc -0,5.');
            return;
        }
        clearError();
        setOffset(v);
    });
    stepMinus.addEventListener('click', function() {
        clearError();
        var cur = getOffset();
        if (!isFinite(cur)) cur = parseFloat(sliderOffset.value) || 0;
        setOffset(cur - 0.05);
    });
    stepPlus.addEventListener('click', function() {
        clearError();
        var cur = getOffset();
        if (!isFinite(cur)) cur = parseFloat(sliderOffset.value) || 0;
        setOffset(cur + 0.05);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.as2-chip'), function(chip) {
        chip.addEventListener('click', function() {
            clearError();
            setOffset(parseFloat(chip.getAttribute('data-val')));
        });
    });
    videoInput.addEventListener('change', function(e) {
        if (!e.target.files || e.target.files.length === 0) return;
        var file = e.target.files[0];
        if (!as2IsVideoFile(file)) {
            resetAll();
            showError('Tệp chưa phải video — hãy chọn file MP4, MOV hoặc WebM.');
            return;
        }
        videoFile = file;
        iconVideo.textContent = '⏳';
        videoName.textContent = 'Đang tải video...';
        clearError();
        var fileURL = URL.createObjectURL(file);
        videoPlayer.src = fileURL;
        videoPlayer.onloadedmetadata = function() {
            videoDuration = videoPlayer.duration;
            iconVideo.textContent = '✅';
            videoName.textContent = file.name;
            metaEl.textContent = as2FmtSize(file.size) + ' · ' + as2FmtDuration(videoDuration);
            metaEl.hidden = false;
            settingsBox.hidden = false;
            btnStart.disabled = false;
        };
        videoPlayer.onerror = function() {
            videoFile = null;
            iconVideo.textContent = '🎬';
            videoName.textContent = 'Nhấp để tải video bị lệch tiếng...';
            showError('Không đọc được video này — hãy thử file MP4, MOV hoặc WebM khác.');
        };
    });
    btnCancel.addEventListener('click', function() {
        cancelling = true;
        statusText.textContent = 'Đang hủy xử lý...';
        if (ffmpeg && ffmpeg.exit) {
            try { ffmpeg.exit(); } catch (e) {}
            ffmpeg = null;
        }
        btnCancel.hidden = true;
    });
    btnPreview.addEventListener('click', async function() {
        if (!videoFile) { showError('Hãy tải video lên trước.'); return; }
        var offset = getOffset();
        if (!isFinite(offset)) { showError('Nhập độ lệch dạng số, ví dụ 0,4 hoặc -0,5.'); return; }
        offset = as2ClampOffset(offset);
        var currentPos = videoPlayer.currentTime || 0;
        if (!isFinite(currentPos) || currentPos < 0) currentPos = 0;
        stopPreviewVideo();
        videoPlayer.pause();
        clearError();
        cancelling = false;
        btnPreview.disabled = true;
        btnPreview.textContent = '⏳ Đang render 5s từ mốc ' + as2FmtOffset(currentPos) + 's...';
        statusBox.hidden = false;
        btnCancel.hidden = false;
        statusText.textContent = 'Đang khởi động bộ xử lý...';
        detailText.textContent = '';
        progressFill.style.width = '2%';
        progressFill.style.background = '#f72585';
        jobTotal = 5;
        jobLabel = 'Đang render bản nghe thử';
        try {
            var lib = await loadFFmpeg();
            statusText.textContent = 'Đang render bản nghe thử 5 giây...';
            var fetchFile = lib.fetchFile;
            var ext = as2Ext(videoFile.name);
            var inputVid = 'preview_in.' + ext;
            var outputPrev = 'preview_out.mp4';
            ffmpeg.FS('writeFile', inputVid, await fetchFile(videoFile));
            var args = as2PreviewArgs(offset, currentPos).map(function(a) {
                if (a === '__IN__') return inputVid;
                if (a === '__OUT__') return outputPrev;
                return a;
            });
            await ffmpeg.run.apply(ffmpeg, args);
            if (cancelling) throw new Error('CANCELLED');
            var data = ffmpeg.FS('readFile', outputPrev);
            if (!data || data.length === 0) throw new Error('EMPTY_OUTPUT');
            var blob = new Blob([data.buffer], { type: 'video/mp4' });
            if (previewBlobUrl) { try { URL.revokeObjectURL(previewBlobUrl); } catch (e) {} }
            previewBlobUrl = URL.createObjectURL(blob);
            previewVideo.src = previewBlobUrl;
            previewResultBox.hidden = false;
            statusBox.hidden = true;
            btnPreview.textContent = '🎧 Nghe thử đoạn khác (5 giây)';
            try { ffmpeg.FS('unlink', inputVid); } catch (e) {}
            try { ffmpeg.FS('unlink', outputPrev); } catch (e) {}
        } catch (error) {
            if (cancelling || (error && error.message === 'CANCELLED')) {
                statusText.textContent = 'Đã hủy xử lý.';
                detailText.textContent = 'Bạn có thể chỉnh lại rồi thử lại.';
                btnPreview.textContent = '🎧 Nghe thử 5 giây';
            } else {
                statusBox.hidden = true;
                if (error && (error.message === 'FFMPEG_MISSING' || error.message === 'FFMPEG_LOAD')) {
                    showError('Chưa tải được bộ xử lý video — kiểm tra mạng rồi thử lại.');
                } else if (noAudioInLogs()) {
                    showError('Video không có luồng tiếng — bản nghe thử cần video có tiếng.');
                } else {
                    showError('Không render được đoạn nghe thử — hãy thử file MP4 khác hoặc tua tới đoạn khác.');
                }
                btnPreview.textContent = '🎧 Nghe thử 5 giây';
            }
        } finally {
            btnPreview.disabled = false;
            btnCancel.hidden = true;
        }
    });
    btnStart.addEventListener('click', async function() {
        if (!videoFile) { showError('Hãy tải video lên trước.'); return; }
        var offset = getOffset();
        if (!isFinite(offset)) { showError('Nhập độ lệch dạng số, ví dụ 0,4 hoặc -0,5.'); return; }
        offset = as2ClampOffset(offset);
        if (offset === 0) {
            showError('Độ lệch đang là 0 giây — bản toàn bộ cần độ lệch khác 0. Bạn vẫn có thể nghe thử 5 giây để kiểm tra.');
            return;
        }
        stopPreviewVideo();
        videoPlayer.pause();
        clearError();
        cancelling = false;
        btnStart.disabled = true;
        btnPreview.disabled = true;
        resultBox.hidden = true;
        statusBox.hidden = false;
        btnCancel.hidden = false;
        statusText.textContent = 'Đang khởi tạo bộ xử lý...';
        progressFill.style.width = '2%';
        progressFill.style.background = '#f72585';
        detailText.textContent = 'Bản toàn bộ giữ nguyên hình/tiếng (copy), không mã hóa lại.';
        jobTotal = videoDuration;
        jobLabel = 'Đang đồng bộ toàn bộ';
        try {
            var lib = await loadFFmpeg();
            statusText.textContent = 'Đang nạp file vào bộ xử lý...';
            var fetchFile = lib.fetchFile;
            var ext = as2Ext(videoFile.name);
            var inputVid = 'input.' + ext;
            var outputVid = 'output.mp4';
            ffmpeg.FS('writeFile', inputVid, await fetchFile(videoFile));
            statusText.textContent = 'Đang áp dụng độ lệch bằng kỹ thuật dịch luồng...';
            var args = as2FullArgs(offset).map(function(a) {
                if (a === '__IN__') return inputVid;
                if (a === '__OUT__') return outputVid;
                return a;
            });
            await ffmpeg.run.apply(ffmpeg, args);
            if (cancelling) throw new Error('CANCELLED');
            var data = ffmpeg.FS('readFile', outputVid);
            if (!data || data.length === 0) throw new Error('EMPTY_OUTPUT');
            var blob = new Blob([data.buffer], { type: 'video/mp4' });
            if (outputBlobUrl) { try { URL.revokeObjectURL(outputBlobUrl); } catch (e) {} }
            outputBlobUrl = URL.createObjectURL(blob);
            outputName = as2OutputName(videoFile.name);
            var a = document.createElement('a');
            a.href = outputBlobUrl;
            a.download = outputName;
            a.click();
            try { ffmpeg.FS('unlink', inputVid); } catch (e) {}
            try { ffmpeg.FS('unlink', outputVid); } catch (e) {}
            statusText.textContent = '🎉 Xong! Video đã được đồng bộ.';
            detailText.textContent = 'Video đã tải xuống — nếu trình duyệt chặn lần tải đầu, bấm Tải lại video.';
            progressFill.style.width = '100%';
            resultText.textContent = '✅ Xong! ' + outputName + ' — nếu trình duyệt chặn lần tải đầu, bấm Tải lại video.';
            resultBox.hidden = false;
        } catch (error) {
            if (cancelling || (error && error.message === 'CANCELLED')) {
                statusText.textContent = 'Đã hủy xử lý.';
                detailText.textContent = 'Bạn có thể chỉnh lại thông số rồi xử lý lại.';
            } else if (error && (error.message === 'FFMPEG_MISSING' || error.message === 'FFMPEG_LOAD')) {
                statusText.textContent = '❌ Chưa tải được bộ xử lý video.';
                detailText.textContent = 'Kiểm tra mạng rồi thử lại.';
            } else if (noAudioInLogs()) {
                statusText.textContent = '❌ Video không có luồng tiếng.';
                detailText.textContent = 'Bản toàn bộ cần video có cả hình và tiếng — hãy thử file khác.';
            } else {
                statusText.textContent = '❌ Xảy ra sự cố khi đồng bộ.';
                detailText.textContent = 'File có thể bị hỏng metadata hoặc định dạng chưa được hỗ trợ — hãy thử file MP4 khác.';
            }
            progressFill.style.background = '#b91c1c';
        } finally {
            btnStart.disabled = false;
            btnPreview.disabled = false;
            btnCancel.hidden = true;
        }
    });
    btnDownloadAgain.addEventListener('click', function() {
        if (!outputBlobUrl) return;
        var a = document.createElement('a');
        a.href = outputBlobUrl;
        a.download = outputName;
        a.click();
    });
    btnReset.addEventListener('click', function() { resetAll(); });
});

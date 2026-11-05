function vr2FormatTime(totalSeconds) {
  var s = Math.max(0, Math.floor(totalSeconds));
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var r = s % 60;
  var mm = (h > 0 ? String(m).padStart(2, '0') : String(m).padStart(2, '0'));
  var ss = String(r).padStart(2, '0');
  return h > 0 ? h + ':' + mm + ':' + ss : mm + ':' + ss;
}
function vr2FormatSize(bytes) {
  if (bytes < 1024) return bytes + ' byte';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1).replace('.', ',') + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2).replace('.', ',') + ' MB';
}
function vr2PickMime() {
  var candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg'];
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  for (var i = 0; i < candidates.length; i++) {
    if (MediaRecorder.isTypeSupported(candidates[i])) return candidates[i];
  }
  return '';
}
function vr2MimeExt(mime) {
  if (mime.indexOf('mp4') !== -1) return 'm4a';
  if (mime.indexOf('ogg') !== -1) return 'ogg';
  if (mime.indexOf('wav') !== -1) return 'wav';
  return 'webm';
}
function vr2SafeFilename(name) {
  var clean = (name || '').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-');
  return clean || 'ghi-am';
}
function vr2TrimSilence(samples, sampleRate, threshold, marginSec) {
  var th = threshold === undefined ? 0.02 : threshold;
  var margin = Math.floor((marginSec === undefined ? 0.15 : marginSec) * sampleRate);
  var start = 0;
  var end = samples.length;
  while (start < samples.length && Math.abs(samples[start]) < th) start++;
  while (end > start && Math.abs(samples[end - 1]) < th) end--;
  if (start >= end) return [0, samples.length];
  return [Math.max(0, start - margin), Math.min(samples.length, end + margin)];
}
function vr2WavEncode(samples, sampleRate) {
  var len = samples.length;
  var buffer = new ArrayBuffer(44 + len * 2);
  var view = new DataView(buffer);
  function str(off, s) { for (var i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); }
  str(0, 'RIFF'); view.setUint32(4, 36 + len * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  str(36, 'data'); view.setUint32(40, len * 2, true);
  for (var i = 0; i < len; i++) {
    var v = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7FFF, true);
  }
  return new Uint8Array(buffer);
}
function vr2MixChannels(buffer, channels) {
  if (channels === 1) return buffer.getChannelData(0);
  var left = buffer.getChannelData(0);
  var right = buffer.getChannelData(1);
  var out = new Float32Array(left.length);
  for (var i = 0; i < left.length; i++) out[i] = (left[i] + right[i]) / 2;
  return out;
}

document.addEventListener('DOMContentLoaded', function() {
  var startBtn = document.getElementById('vr2-start');
  if (!startBtn) return;
  var pauseBtn = document.getElementById('vr2-pause');
  var stopBtn = document.getElementById('vr2-stop');
  var cancelBtn = document.getElementById('vr2-cancel');
  var statusEl = document.getElementById('vr2-status');
  var timerEl = document.getElementById('vr2-timer');
  var wave = document.getElementById('vr2-wave');
  var errorEl = document.getElementById('vr2-error');
  var resultCard = document.getElementById('vr2-result');
  var player = document.getElementById('vr2-player');
  var metaEl = document.getElementById('vr2-meta');
  var filenameInput = document.getElementById('vr2-filename');
  var downloadBtn = document.getElementById('vr2-download');
  var againBtn = document.getElementById('vr2-again');
  var trimBox = document.getElementById('vr2-trim');
  var micSelect = document.getElementById('vr2-mic');
  var ctx = wave.getContext ? wave.getContext('2d') : null;

  var state = 'idle';
  var recorder = null;
  var stream = null;
  var audioCtx = null;
  var analyser = null;
  var rafId = null;
  var chunks = [];
  var blob = null;
  var blobUrl = null;
  var decoded = null;
  var decodedRate = 0;
  var format = 'orig';
  var recordedMs = 0;
  var segStart = 0;
  var timerId = null;

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }
  function setStatus(text, rec) {
    statusEl.textContent = text;
    statusEl.classList.toggle('is-rec', !!rec);
  }
  function drawIdleWave() {
    if (!ctx) return;
    ctx.clearRect(0, 0, wave.width, wave.height);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, wave.height / 2);
    ctx.lineTo(wave.width, wave.height / 2);
    ctx.stroke();
  }
  function drawLiveWave() {
    if (!analyser || !ctx) return;
    var data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    ctx.clearRect(0, 0, wave.width, wave.height);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    var step = Math.floor(data.length / wave.width) || 1;
    for (var x = 0; x < wave.width; x++) {
      var v = data[x * step] / 128 - 1;
      var y = wave.height / 2 + v * (wave.height / 2 - 6);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (state === 'recording') rafId = requestAnimationFrame(drawLiveWave);
  }
  function drawFullWave(samples) {
    if (!ctx) return;
    ctx.clearRect(0, 0, wave.width, wave.height);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    var step = Math.max(1, Math.floor(samples.length / wave.width));
    for (var x = 0; x < wave.width; x++) {
      var peak = 0;
      for (var i = 0; i < step; i++) {
        var v = Math.abs(samples[x * step + i] || 0);
        if (v > peak) peak = v;
      }
      var yTop = wave.height / 2 - peak * (wave.height / 2 - 6);
      var yBot = wave.height / 2 + peak * (wave.height / 2 - 6);
      ctx.moveTo(x, yTop);
      ctx.lineTo(x, yBot);
    }
    ctx.stroke();
  }
  function tickTimer() {
    var now = state === 'recording' ? recordedMs + (Date.now() - segStart) : recordedMs;
    timerEl.textContent = vr2FormatTime(now / 1000);
  }
  function stopTracks() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (stream) stream.getTracks().forEach(function(t) { t.stop(); });
    stream = null;
    if (audioCtx) audioCtx.close().catch(function() {});
    audioCtx = null;
    analyser = null;
  }
  function resetRecorderUI() {
    state = 'idle';
    recordedMs = 0;
    timerEl.textContent = '00:00';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '⏸ Tạm dừng';
    stopBtn.disabled = true;
    cancelBtn.hidden = true;
    setStatus('Chưa ghi âm', false);
    drawIdleWave();
  }
  function listMics() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then(function(devices) {
      var seen = {};
      micSelect.querySelectorAll('option[data-vr2-mic]').forEach(function(o) { o.remove(); });
      devices.filter(function(d) { return d.kind === 'audioinput'; }).forEach(function(d) {
        if (seen[d.deviceId]) return;
        seen[d.deviceId] = true;
        var opt = document.createElement('option');
        opt.setAttribute('data-vr2-mic', '1');
        opt.value = d.deviceId;
        opt.textContent = d.label || 'Micro ' + (micSelect.options.length);
        micSelect.appendChild(opt);
      });
    }).catch(function() {});
  }
  function micErrorMessage(err) {
    if (!err) return 'Không truy cập được micro.';
    if (err.name === 'NotAllowedError') return 'Trình duyệt đã chặn micro. Hãy bấm biểu tượng ổ khóa trên thanh địa chỉ, cho phép micro rồi tải lại trang.';
    if (err.name === 'NotFoundError') return 'Không tìm thấy micro nào trên thiết bị. Hãy cắm micro hoặc chọn micro khác rồi thử lại.';
    if (err.name === 'NotReadableError') return 'Micro đang bị ứng dụng khác giữ. Hãy đóng ứng dụng đó rồi thử lại.';
    if (err.name === 'SecurityError') return 'Trang cần chạy qua HTTPS mới dùng được micro. Hãy mở lại trang bằng địa chỉ https://.';
    return 'Không truy cập được micro (' + err.name + '). Hãy kiểm tra quyền micro của trình duyệt rồi thử lại.';
  }

  drawIdleWave();
  listMics();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
    startBtn.disabled = true;
    showError('Trình duyệt này không hỗ trợ ghi âm. Hãy dùng Chrome, Edge, Firefox hoặc Safari bản mới.');
  }

  startBtn.addEventListener('click', function() {
    if (state === 'recording' || state === 'paused') return;
    hideError();
    resultCard.hidden = true;
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
    blob = null;
    decoded = null;
    var constraints = {
      audio: {
        echoCancellation: document.getElementById('vr2-echo').checked,
        noiseSuppression: document.getElementById('vr2-noise').checked,
        autoGainControl: document.getElementById('vr2-gain').checked
      }
    };
    if (micSelect.value) constraints.audio.deviceId = { exact: micSelect.value };
    navigator.mediaDevices.getUserMedia(constraints).then(function(s) {
      stream = s;
      listMics();
      var mime = vr2PickMime();
      try {
        recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }
      chunks = [];
      recorder.ondataavailable = function(e) { if (e.data && e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = function() {
        stopTracks();
        blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        blobUrl = URL.createObjectURL(blob);
        player.src = blobUrl;
        var durSec = recordedMs / 1000;
        metaEl.textContent = 'Thời lượng: ' + vr2FormatTime(durSec) + ' · Dung lượng: ' + vr2FormatSize(blob.size) + ' · Định dạng gốc: ' + vr2MimeExt(blob.type).toUpperCase();
        var d = new Date();
        var pad = function(n) { return String(n).padStart(2, '0'); };
        filenameInput.value = 'ghi-am-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
        resultCard.hidden = false;
        if (window.AudioContext || window.webkitAudioContext) {
          var AC = window.AudioContext || window.webkitAudioContext;
          var actx = new AC();
          blob.arrayBuffer().then(function(buf) { return actx.decodeAudioData(buf); }).then(function(dec) {
            decoded = vr2MixChannels(dec, dec.numberOfChannels);
            decodedRate = dec.sampleRate;
            drawFullWave(decoded);
            actx.close().catch(function() {});
          }).catch(function() { actx.close().catch(function() {}); });
        }
        resetRecorderUI();
        setStatus('Đã ghi xong', false);
      };
      recorder.start(250);
      state = 'recording';
      recordedMs = 0;
      segStart = Date.now();
      timerId = setInterval(tickTimer, 200);
      tickTimer();
      startBtn.disabled = true;
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
      cancelBtn.hidden = false;
      setStatus('● Đang ghi âm...', true);
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var src = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        src.connect(analyser);
        drawLiveWave();
      } catch (e) { drawIdleWave(); }
    }).catch(function(err) {
      showError(micErrorMessage(err));
    });
  });

  pauseBtn.addEventListener('click', function() {
    if (!recorder) return;
    try {
      if (state === 'recording' && recorder.pause) {
        recorder.pause();
        recordedMs += Date.now() - segStart;
        clearInterval(timerId);
        state = 'paused';
        pauseBtn.textContent = '▶ Tiếp tục';
        setStatus('⏸ Đang tạm dừng', false);
      } else if (state === 'paused' && recorder.resume) {
        recorder.resume();
        segStart = Date.now();
        timerId = setInterval(tickTimer, 200);
        state = 'recording';
        pauseBtn.textContent = '⏸ Tạm dừng';
        setStatus('● Đang ghi âm...', true);
        drawLiveWave();
      }
    } catch (e) {
      showError('Trình duyệt này không hỗ trợ tạm dừng trong cùng một bản ghi.');
    }
  });

  stopBtn.addEventListener('click', function() {
    if (recorder && recorder.state !== 'inactive') {
      if (state === 'recording') recordedMs += Date.now() - segStart;
      clearInterval(timerId);
      recorder.stop();
    }
  });

  cancelBtn.addEventListener('click', function() {
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    clearInterval(timerId);
    stopTracks();
    chunks = [];
    blob = null;
    resetRecorderUI();
    setStatus('Đã hủy bản ghi', false);
  });

  document.querySelectorAll('[data-vr2-format]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-vr2-format]').forEach(function(b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      format = btn.getAttribute('data-vr2-format');
    });
  });

  downloadBtn.addEventListener('click', function() {
    if (!blob) return;
    var name = vr2SafeFilename(filenameInput.value);
    if (format === 'wav') {
      if (!decoded) {
        showError('Chưa giải mã xong bản ghi, hãy đợi vài giây rồi bấm tải lại. Muốn tải ngay, hãy chọn “File gốc”.');
        return;
      }
      var samples = decoded;
      if (trimBox.checked) {
        var range = vr2TrimSilence(decoded, decodedRate);
        samples = decoded.slice(range[0], range[1]);
      }
      var wav = vr2WavEncode(samples, decodedRate);
      var url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
      triggerDownload(url, name + '.wav');
      setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
    } else {
      triggerDownload(blobUrl, name + '.' + vr2MimeExt(blob.type));
    }
    function triggerDownload(url, fname) {
      var a = document.createElement('a');
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  });

  againBtn.addEventListener('click', function() {
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
    blob = null;
    decoded = null;
    resultCard.hidden = true;
    resetRecorderUI();
  });
});

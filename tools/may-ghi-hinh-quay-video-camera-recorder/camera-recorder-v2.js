function cr2Pad(n) { return String(n).padStart(2, '0'); }
function cr2FmtTime(ms) {
  var s = Math.floor(ms / 1000);
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var sec = s % 60;
  return h > 0 ? h + ':' + cr2Pad(m) + ':' + cr2Pad(sec) : cr2Pad(m) + ':' + cr2Pad(sec);
}
function cr2FmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1).replace('.', ',') + ' KB';
  return (bytes / 1048576).toFixed(2).replace('.', ',') + ' MB';
}
function cr2ErrMsg(err) {
  var name = err && err.name ? err.name : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'Bạn đã từ chối quyền camera hoặc micro. Hãy cho phép trong cài đặt trình duyệt rồi bấm lại.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'Không tìm thấy camera hoặc micro đã chọn. Hãy kiểm tra thiết bị đã cắm và chọn thiết bị khác.';
  if (name === 'NotReadableError' || name === 'AbortError') return 'Camera hoặc micro đang được ứng dụng khác dùng. Hãy đóng ứng dụng đó rồi thử lại.';
  if (name === 'SecurityError') return 'Trang cần mở qua kết nối an toàn (HTTPS) mới dùng được camera.';
  return 'Trình duyệt này không hỗ trợ quay camera, hoặc thiết bị chưa sẵn sàng. Hãy thử trình duyệt khác.';
}
function cr2PickMime(isSupported) {
  var list = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  for (var i = 0; i < list.length; i++) { if (isSupported(list[i])) return list[i]; }
  return '';
}
function cr2FileName(d) {
  return 'Camera_Record_' + d.getFullYear() + '-' + cr2Pad(d.getMonth() + 1) + '-' + cr2Pad(d.getDate()) + '_' + cr2Pad(d.getHours()) + '-' + cr2Pad(d.getMinutes()) + '-' + cr2Pad(d.getSeconds()) + '.webm';
}
document.addEventListener('DOMContentLoaded', function () {
  var preview = document.getElementById('cr2-preview');
  var playback = document.getElementById('cr2-playback');
  var btnPower = document.getElementById('cr2-btn-power');
  var recActions = document.getElementById('cr2-rec-actions');
  var btnStart = document.getElementById('cr2-btn-start');
  var btnPause = document.getElementById('cr2-btn-pause');
  var btnStop = document.getElementById('cr2-btn-stop');
  var btnCamOff = document.getElementById('cr2-btn-camoff');
  var btnDownload = document.getElementById('cr2-btn-download');
  var badge = document.getElementById('cr2-status');
  var timerBox = document.getElementById('cr2-timer');
  var timeText = document.getElementById('cr2-time');
  var emptyState = document.getElementById('cr2-empty');
  var errorBox = document.getElementById('cr2-error');
  var infoBox = document.getElementById('cr2-info');
  var mirrorBox = document.getElementById('cr2-mirror');
  var micBox = document.getElementById('cr2-mic');
  var camSelect = document.getElementById('cr2-cam-select');
  var micSelect = document.getElementById('cr2-mic-select');
  var settingsNote = document.getElementById('cr2-settings-note');
  var stream = null;
  var recorder = null;
  var chunks = [];
  var blobUrl = null;
  var chosenMime = '';
  var recStart = 0;
  var pausedTotal = 0;
  var pauseStart = 0;
  var paused = false;
  var recording = false;
  var timerId = null;
  var lastDurationMs = 0;
  function setBadge(text, bg, color) { badge.textContent = text; badge.style.background = bg; badge.style.color = color; }
  function showError(msg) { errorBox.textContent = msg; errorBox.style.display = 'block'; }
  function hideError() { errorBox.style.display = 'none'; }
  function applyMirror() { preview.style.transform = mirrorBox.checked ? 'scaleX(-1)' : 'none'; }
  function netElapsed() {
    var extra = paused ? Date.now() - pauseStart : 0;
    return Date.now() - recStart - pausedTotal - extra;
  }
  function tick() { timeText.textContent = cr2FmtTime(netElapsed()); }
  function stopTracks() {
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    preview.srcObject = null;
  }
  function fillSelect(select, devices, kind, currentId) {
    var list = devices.filter(function (d) { return d.kind === kind; });
    select.innerHTML = '';
    if (!list.length) { var o = document.createElement('option'); o.value = ''; o.textContent = 'Không tìm thấy thiết bị'; select.appendChild(o); return; }
    list.forEach(function (d) {
      var opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || (kind === 'videoinput' ? 'Camera' : 'Micro') + ' ' + (list.indexOf(d) + 1);
      if (currentId && d.deviceId === currentId) opt.selected = true;
      select.appendChild(opt);
    });
  }
  async function refreshDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      var devices = await navigator.mediaDevices.enumerateDevices();
      var camId = stream ? stream.getVideoTracks()[0].getSettings().deviceId : camSelect.value;
      var micId = stream && stream.getAudioTracks().length ? stream.getAudioTracks()[0].getSettings().deviceId : micSelect.value;
      fillSelect(camSelect, devices, 'videoinput', camId);
      fillSelect(micSelect, devices, 'audioinput', micId);
      camSelect.disabled = false;
      micSelect.disabled = false;
    } catch (e) { /* keep placeholders */ }
  }
  async function startStream() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showError(cr2ErrMsg({ name: 'TypeError' }));
      return false;
    }
    var video = camSelect.value ? { deviceId: { exact: camSelect.value } } : true;
    var audio = !micBox.checked ? false : (micSelect.value ? { deviceId: { exact: micSelect.value } } : true);
    try {
      stopTracks();
      stream = await navigator.mediaDevices.getUserMedia({ video: video, audio: audio });
    } catch (err) {
      showError(cr2ErrMsg(err));
      return false;
    }
    preview.srcObject = stream;
    applyMirror();
    hideError();
    btnPower.style.display = 'none';
    recActions.style.display = 'flex';
    btnCamOff.style.display = 'flex';
    setBadge('Sẵn Sàng', 'var(--cr2-green)', '#111');
    await refreshDevices();
    return true;
  }
  function resetAfterStop() {
    recording = false;
    paused = false;
    clearInterval(timerId);
    timerId = null;
    timerBox.style.display = 'none';
    timeText.textContent = '00:00';
    btnStart.style.display = 'flex';
    btnPause.style.display = 'none';
    btnPause.textContent = '⏸️ Tạm Dừng';
    btnStop.style.display = 'none';
    btnCamOff.style.display = 'flex';
  }
  btnPower.addEventListener('click', function () {
    btnPower.textContent = 'Đang kết nối...';
    startStream().then(function (ok) {
      if (!ok) btnPower.textContent = '🔌 Bật Camera & Mic';
    });
  });
  btnStart.addEventListener('click', function () {
    if (!stream || recording) return;
    chosenMime = cr2PickMime(function (m) { return MediaRecorder.isTypeSupported(m); });
    if (!chosenMime) { showError('Trình duyệt này không hỗ trợ ghi video WebM. Hãy thử Chrome hoặc Edge mới nhất.'); return; }
    try { recorder = new MediaRecorder(stream, { mimeType: chosenMime }); }
    catch (e) { showError(cr2ErrMsg(e)); return; }
    chunks = [];
    recorder.ondataavailable = function (e) { if (e.data && e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = function () {
      var blob = new Blob(chunks, { type: chosenMime || 'video/webm' });
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      blobUrl = URL.createObjectURL(blob);
      emptyState.style.display = 'none';
      playback.style.display = 'block';
      playback.src = blobUrl;
      btnDownload.disabled = false;
      infoBox.textContent = 'Thời lượng ' + cr2FmtTime(lastDurationMs) + ' · Dung lượng ' + cr2FmtSize(blob.size) + ' · Định dạng ' + (chosenMime || 'video/webm');
      infoBox.style.display = 'block';
      setBadge('Sẵn Sàng', 'var(--cr2-green)', '#111');
    };
    hideError();
    recorder.start();
    recording = true;
    recStart = Date.now();
    pausedTotal = 0;
    btnStart.style.display = 'none';
    btnPause.style.display = 'flex';
    btnStop.style.display = 'flex';
    btnCamOff.style.display = 'none';
    setBadge('Đang Ghi', 'var(--cr2-red)', '#fff');
    timerBox.style.display = 'flex';
    timeText.textContent = '00:00';
    clearInterval(timerId);
    timerId = setInterval(tick, 250);
  });
  btnPause.addEventListener('click', function () {
    if (!recorder || !recording) return;
    if (!paused) {
      try { recorder.pause(); } catch (e) { return; }
      paused = true;
      pauseStart = Date.now();
      btnPause.textContent = '▶️ Tiếp Tục';
      setBadge('Tạm Dừng', 'var(--cr2-yellow)', '#111');
    } else {
      try { recorder.resume(); } catch (e) { return; }
      pausedTotal += Date.now() - pauseStart;
      paused = false;
      btnPause.textContent = '⏸️ Tạm Dừng';
      setBadge('Đang Ghi', 'var(--cr2-red)', '#fff');
    }
  });
  btnStop.addEventListener('click', function () {
    if (!recorder || recorder.state === 'inactive') return;
    lastDurationMs = netElapsed();
    recorder.stop();
    resetAfterStop();
  });
  btnCamOff.addEventListener('click', function () {
    stopTracks();
    recorder = null;
    btnPower.style.display = 'flex';
    btnPower.textContent = '🔌 Bật Camera & Mic';
    recActions.style.display = 'none';
    btnCamOff.style.display = 'none';
    setBadge('Đang Tắt', '#fff', '#111');
  });
  btnDownload.addEventListener('click', function () {
    if (!blobUrl) return;
    var a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = cr2FileName(new Date());
    document.body.appendChild(a);
    a.click();
    var original = btnDownload.textContent;
    btnDownload.textContent = '✅ Đã tải xong!';
    setTimeout(function () { btnDownload.textContent = original; document.body.removeChild(a); }, 2000);
  });
  mirrorBox.addEventListener('change', applyMirror);
  micBox.addEventListener('change', function () {
    settingsNote.style.display = stream ? 'block' : 'none';
  });
  camSelect.addEventListener('change', function () { if (stream) startStream(); });
  micSelect.addEventListener('change', function () { if (stream && micBox.checked) startStream(); });
  applyMirror();
});

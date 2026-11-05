function aa2Ext(name) {
  var i = (name || '').lastIndexOf('.');
  return i < 0 ? '' : name.slice(i + 1).toLowerCase();
}
function aa2Num(n) {
  return String(Math.round(n * 1000) / 1000);
}
function aa2FmtSec(v) {
  return v.toFixed(1).replace('.', ',');
}
function aa2FmtClock(v) {
  var t = Math.round(v * 10);
  var mm = String(Math.floor(t / 600)).padStart(2, '0');
  var ss = String(Math.floor((t % 600) / 10)).padStart(2, '0');
  return mm + ':' + ss + ',' + (t % 10);
}
function aa2FmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1).replace('.', ',') + ' KB';
  return (bytes / 1048576).toFixed(1).replace('.', ',') + ' MB';
}
function aa2ParseSec(str) {
  if (str === null || str === undefined) return NaN;
  var s = String(str).trim().replace(',', '.');
  if (s === '') return NaN;
  return parseFloat(s);
}
function aa2IsVideoFile(file) {
  if (!file) return false;
  if (file.type && file.type.indexOf('video/') === 0) return true;
  return ['mp4', 'mov', 'webm', 'mkv', 'avi', 'wmv', 'm4v'].indexOf(aa2Ext(file.name)) >= 0;
}
function aa2IsAudioFile(file) {
  if (!file) return false;
  if (file.type && file.type.indexOf('audio/') === 0) return true;
  return ['mp3', 'wav', 'm4a', 'ogg', 'oga', 'flac', 'aac', 'opus', 'webm'].indexOf(aa2Ext(file.name)) >= 0;
}
function aa2ClampTrack(start, end, insert, audioDur, videoDur) {
  var s = Math.min(Math.max(start, 0), audioDur);
  var e = Math.min(Math.max(end, s + 0.1), audioDur);
  if (e < s) { e = audioDur; s = 0; }
  var ins = insert;
  if (videoDur > 0) ins = Math.min(Math.max(insert, 0), videoDur);
  else ins = Math.max(insert, 0);
  return { start: s, end: e, insert: ins };
}
function aa2BarPct(insert, playDur, videoDur) {
  if (!videoDur || videoDur <= 0) return { left: 0, width: 0 };
  var left = Math.min(Math.max((insert / videoDur) * 100, 0), 100);
  var width = Math.min(Math.max((playDur / videoDur) * 100, 0), 100 - left);
  return { left: left, width: width };
}
function aa2Overflow(insert, playDur, videoDur) {
  if (!videoDur || videoDur <= 0) return '';
  if (insert >= videoDur) return 'Đặt tại vượt thời lượng video nên đoạn nhạc này sẽ không phát ra trong file kết quả.';
  if (insert + playDur > videoDur + 0.05) return 'Đoạn nhạc vượt cuối video; phần vượt sẽ bị cắt khi xuất.';
  return '';
}
function aa2TrackSummary(start, end, insert, volPct) {
  return 'Đoạn ' + aa2FmtSec(start) + '–' + aa2FmtSec(end) + ' giây, đặt tại ' + aa2FmtSec(insert) + ' giây, dài ' + aa2FmtSec(end - start) + ' giây, âm lượng ' + volPct + '%.';
}
function aa2BuildArgs(mode, videoInput, audioInputs, tracks, output) {
  var parts = [];
  var delayed = [];
  tracks.forEach(function (tr, idx) {
    var fi = idx + 1;
    var vol = String(Math.round(tr.vol * 100) / 100);
    parts.push('[' + fi + ':a]atrim=start=' + aa2Num(tr.start) + ':end=' + aa2Num(tr.end) + ',asetpts=PTS-STARTPTS,volume=' + vol + '[trim_a' + fi + ']');
    var delayMs = Math.round(tr.insert * 1000);
    parts.push('[trim_a' + fi + ']adelay=delays=\'' + delayMs + '|' + delayMs + '\':all=1[delayed_a' + fi + ']');
    delayed.push('[delayed_a' + fi + ']');
  });
  var mapTarget;
  var filter;
  if (mode === 'replace') {
    if (tracks.length === 1) {
      filter = parts.join(';');
      mapTarget = delayed[0];
    } else {
      filter = parts.join(';') + ';' + delayed.join('') + 'amix=inputs=' + tracks.length + ':duration=first:dropout_transition=2[aout]';
      mapTarget = '[aout]';
    }
  } else {
    var duckChain = tracks.filter(function (tr) { return tr.ducking; }).map(function (tr) {
      return 'volume=enable=\'between(t,' + aa2Num(tr.insert) + ',' + aa2Num(tr.insert + (tr.end - tr.start)) + ')\':volume=0.2';
    }).join(',');
    var target = '[0:a]';
    if (duckChain) {
      parts.push('[0:a]' + duckChain + '[ducked_video_audio]');
      target = '[ducked_video_audio]';
    }
    filter = parts.join(';') + ';' + target + delayed.join('') + 'amix=inputs=' + (1 + tracks.length) + ':duration=first:dropout_transition=2[aout]';
    mapTarget = '[aout]';
  }
  var args = ['-i', videoInput];
  audioInputs.forEach(function (a) { args.push('-i', a); });
  args.push('-filter_complex', filter, '-map', '0:v:0', '-map', mapTarget, '-c:v', 'copy', '-c:a', 'aac', '-movflags', '+faststart', output);
  return { args: args, filter: filter };
}
document.addEventListener('DOMContentLoaded', function () {
  var videoInput = document.getElementById('aa2-video-input');
  var videoName = document.getElementById('aa2-video-name');
  var videoPlayer = document.getElementById('aa2-player');
  var previewSection = document.getElementById('aa2-preview-section');
  var modeCard = document.getElementById('aa2-mode-card');
  var timelineBoard = document.getElementById('aa2-timeline-board');
  var timelineTracks = document.getElementById('aa2-timeline-tracks');
  var tracksContainer = document.getElementById('aa2-tracks-container');
  var btnAddTrack = document.getElementById('aa2-btn-add-track');
  var btnStart = document.getElementById('aa2-btn-start');
  var errorBox = document.getElementById('aa2-error');
  var statusBox = document.getElementById('aa2-status-box');
  var statusText = document.getElementById('aa2-status-text');
  var detailText = document.getElementById('aa2-detail-text');
  var progressFill = document.getElementById('aa2-progress-fill');
  var resultBox = document.getElementById('aa2-result-box');
  var resultText = document.getElementById('aa2-result-text');
  var modeDesc = document.getElementById('aa2-mode-desc');
  var videoFile = null;
  var videoDuration = 0;
  var ffmpeg = null;
  var tracks = [];
  var trackCounter = 0;
  var mode = 'mix';
  var colors = ['#b9fbc0', '#ffc6ff', '#fdf0d5'];
  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }
  function hideError() { errorBox.hidden = true; }
  function refreshStart() {
    btnStart.disabled = tracks.filter(function (t) { return t.file; }).length === 0;
  }
  function videoVolume(ducking) {
    if (mode === 'replace') return 0;
    return ducking ? 0.2 : 1;
  }
  function openVideoPicker() { videoInput.click(); }
  document.getElementById('aa2-box-video').addEventListener('click', openVideoPicker);
  document.getElementById('aa2-box-video').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openVideoPicker(); }
  });
  videoInput.addEventListener('change', function (e) {
    if (!e.target.files.length) return;
    var file = e.target.files[0];
    if (!aa2IsVideoFile(file)) {
      showError('File chưa đúng định dạng video. Hãy chọn file MP4, MOV, WebM hoặc MKV.');
      e.target.value = '';
      return;
    }
    hideError();
    resultBox.hidden = true;
    videoFile = file;
    videoName.textContent = file.name;
    document.getElementById('aa2-video-note').textContent = aa2FmtSize(file.size);
    videoPlayer.src = URL.createObjectURL(file);
    previewSection.hidden = false;
    modeCard.hidden = false;
    timelineBoard.hidden = false;
    videoPlayer.onloadedmetadata = function () {
      videoDuration = videoPlayer.duration;
      document.getElementById('aa2-meta-dur').textContent = aa2FmtClock(videoDuration);
      document.getElementById('aa2-meta-size').textContent = aa2FmtSize(file.size);
      document.getElementById('aa2-meta-ext').textContent = aa2Ext(file.name).toUpperCase();
      tracks.forEach(function (t) { refreshTrackCard(t); });
      updateAllVisuals();
    };
    refreshStart();
  });
  document.querySelectorAll('[data-aa2-mode]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-aa2-mode]').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      mode = btn.getAttribute('data-aa2-mode');
      modeDesc.textContent = mode === 'replace'
        ? 'Chỉ giữ nhạc mới, bỏ hoàn toàn tiếng gốc. Chế độ này ghép được cả video không có sẵn luồng tiếng.'
        : 'Trộn nhạc mới vào cùng tiếng gốc. Bật “Nhỏ tiếng Video gốc (Ducking)” ở từng track để tiếng gốc nhỏ xuống trong đoạn có nhạc.';
      tracks.forEach(function (t) {
        var wrap = document.getElementById('aa2-ducking-wrap-' + t.id);
        if (wrap) wrap.hidden = (mode === 'replace');
        if (t.audioElem) t.audioElem.volume = t.vol;
      });
      if (!videoPlayer.paused) videoPlayer.volume = videoVolume(false);
    });
  });
  videoPlayer.addEventListener('play', checkPreviewAudioSync);
  videoPlayer.addEventListener('pause', stopPreviewAudio);
  videoPlayer.addEventListener('seeking', stopPreviewAudio);
  videoPlayer.addEventListener('timeupdate', checkPreviewAudioSync);
  function stopPreviewAudio() {
    tracks.forEach(function (t) { if (t.audioElem) t.audioElem.pause(); });
  }
  function checkPreviewAudioSync() {
    if (videoPlayer.paused) return;
    var vTime = videoPlayer.currentTime;
    var isDucking = false;
    tracks.forEach(function (track) {
      if (!track.audioElem || !track.file) return;
      var playDur = track.trimEnd - track.trimStart;
      if (vTime >= track.insertAt && vTime <= track.insertAt + playDur) {
        if (mode === 'mix' && track.ducking) isDucking = true;
        var expected = track.trimStart + (vTime - track.insertAt);
        if (track.audioElem.paused) {
          track.audioElem.currentTime = expected;
          track.audioElem.volume = track.vol;
          track.audioElem.play().catch(function () {});
        } else if (Math.abs(track.audioElem.currentTime - expected) > 0.2) {
          track.audioElem.currentTime = expected;
        }
      } else if (!track.audioElem.paused) {
        track.audioElem.pause();
      }
    });
    videoPlayer.volume = videoVolume(isDucking);
  }
  btnAddTrack.addEventListener('click', function () {
    if (!videoFile) { showError('Hãy tải Video gốc lên trước rồi mới thêm track nhạc.'); return; }
    if (tracks.length >= 3) { showError('Công cụ hỗ trợ tối đa 3 track nhạc. Hãy xóa một track cũ rồi thêm track mới.'); return; }
    hideError();
    trackCounter++;
    var track = {
      id: trackCounter, file: null, audioElem: new Audio(),
      audioDur: 0, trimStart: 0, trimEnd: 0, insertAt: 0, ducking: true, vol: 1, color: colors[(trackCounter - 1) % 3]
    };
    tracks.push(track);
    renderTrackSettingsCard(track);
    renderTimelineRow(track);
    refreshStart();
  });
  function renderTrackSettingsCard(track) {
    var card = document.createElement('div');
    card.className = 'aa2-track-card';
    card.id = 'track-card-' + track.id;
    card.style.borderColor = '#111';
    card.innerHTML =
      '<h4 class="aa2-track-title">🎵 Nhạc ' + track.id + ' <button type="button" class="aa2-btn-remove" data-aa2-remove="' + track.id + '">Xóa</button></h4>' +
      '<div class="aa2-upload-box" id="box-audio-' + track.id + '" tabindex="0" style="background:' + track.color + ';padding:15px">' +
      '<input type="file" id="input-audio-' + track.id + '" hidden accept="audio/*">' +
      '<span id="name-audio-' + track.id + '" class="aa2-filename">Nhấp tải File Nhạc...</span></div>' +
      '<div id="controls-audio-' + track.id + '" hidden>' +
      '<div class="aa2-grid2">' +
      '<div><span class="aa2-sublabel">✂️ Lấy từ giây (Start)</span><input type="text" inputmode="decimal" class="aa2-inp" id="t' + track.id + '-start" value="0,0"></div>' +
      '<div><span class="aa2-sublabel">✂️ Cắt đến giây (End)</span><input type="text" inputmode="decimal" class="aa2-inp" id="t' + track.id + '-end" value="0,0"></div>' +
      '</div>' +
      '<div><span class="aa2-sublabel">📍 Đặt tại (Insert At) — giây trong video</span><input type="text" inputmode="decimal" class="aa2-inp" id="t' + track.id + '-insert" value="0,0"></div>' +
      '<div><span class="aa2-sublabel">🔊 Âm lượng nhạc</span><div class="aa2-vol-row"><input type="range" class="aa2-slider" id="t' + track.id + '-volume" min="0" max="100" step="1" value="100"><span class="aa2-vol-val" id="t' + track.id + '-volume-val">100%</span></div></div>' +
      '<label class="aa2-ducking-box" id="aa2-ducking-wrap-' + track.id + '"><input type="checkbox" id="t' + track.id + '-ducking" checked> 📉 Nhỏ tiếng Video gốc (Ducking)</label>' +
      '<p class="aa2-track-summary" id="t' + track.id + '-summary"></p>' +
      '<p class="aa2-warn" id="t' + track.id + '-warn" hidden></p>' +
      '</div>';
    tracksContainer.appendChild(card);
    card.querySelector('[data-aa2-remove]').addEventListener('click', function () { removeTrack(track.id); });
    var box = document.getElementById('box-audio-' + track.id);
    var openPicker = function () { document.getElementById('input-audio-' + track.id).click(); };
    box.addEventListener('click', openPicker);
    box.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); } });
    document.getElementById('input-audio-' + track.id).addEventListener('change', function (e) {
      if (!e.target.files.length) return;
      var file = e.target.files[0];
      if (!aa2IsAudioFile(file)) {
        showError('File nhạc chưa đúng định dạng. Hãy chọn file MP3, WAV, M4A hoặc OGG.');
        e.target.value = '';
        return;
      }
      hideError();
      track.file = file;
      document.getElementById('name-audio-' + track.id).textContent = file.name;
      track.audioElem.src = URL.createObjectURL(file);
      track.audioElem.onloadedmetadata = function () {
        track.audioDur = track.audioElem.duration;
        track.trimEnd = track.audioDur;
        document.getElementById('t' + track.id + '-end').value = aa2FmtSec(track.audioDur);
        document.getElementById('controls-audio-' + track.id).hidden = false;
        refreshTrackCard(track);
        updateAllVisuals();
        refreshStart();
      };
    });
    var syncData = function () {
      var s = aa2ParseSec(document.getElementById('t' + track.id + '-start').value);
      var e = aa2ParseSec(document.getElementById('t' + track.id + '-end').value);
      var ins = aa2ParseSec(document.getElementById('t' + track.id + '-insert').value);
      if (isNaN(s)) s = track.trimStart;
      if (isNaN(e)) e = track.trimEnd;
      if (isNaN(ins)) ins = track.insertAt;
      var c = aa2ClampTrack(s, e, ins, track.audioDur, videoDuration);
      track.trimStart = c.start;
      track.trimEnd = c.end;
      track.insertAt = c.insert;
      track.ducking = document.getElementById('t' + track.id + '-ducking').checked;
      track.vol = parseInt(document.getElementById('t' + track.id + '-volume').value, 10) / 100;
      document.getElementById('t' + track.id + '-start').value = aa2FmtSec(track.trimStart);
      document.getElementById('t' + track.id + '-end').value = aa2FmtSec(track.trimEnd);
      document.getElementById('t' + track.id + '-insert').value = aa2FmtSec(track.insertAt);
      if (track.audioElem) track.audioElem.volume = track.vol;
      refreshTrackCard(track);
      updateAllVisuals();
    };
    ['t' + track.id + '-start', 't' + track.id + '-end', 't' + track.id + '-insert'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', syncData);
    });
    document.getElementById('t' + track.id + '-ducking').addEventListener('change', syncData);
    document.getElementById('t' + track.id + '-volume').addEventListener('input', function () {
      document.getElementById('t' + track.id + '-volume-val').textContent = this.value + '%';
      track.vol = parseInt(this.value, 10) / 100;
      if (track.audioElem) track.audioElem.volume = track.vol;
      refreshTrackCard(track);
    });
    document.getElementById('aa2-ducking-wrap-' + track.id).hidden = (mode === 'replace');
  }
  function refreshTrackCard(track) {
    var sum = document.getElementById('t' + track.id + '-summary');
    if (sum && track.file && track.audioDur > 0) {
      sum.textContent = aa2TrackSummary(track.trimStart, track.trimEnd, track.insertAt, Math.round(track.vol * 100));
    }
    var warn = document.getElementById('t' + track.id + '-warn');
    if (warn) {
      var msg = aa2Overflow(track.insertAt, track.trimEnd - track.trimStart, videoDuration);
      warn.textContent = msg;
      warn.hidden = !msg;
    }
  }
  function renderTimelineRow(track) {
    var row = document.createElement('div');
    row.className = 'aa2-track-row';
    row.id = 'timeline-row-' + track.id;
    row.innerHTML =
      '<div class="aa2-track-icon">🎵 Nhạc ' + track.id + '</div>' +
      '<div class="aa2-track-bar-bg" id="bg-audio-' + track.id + '">' +
      '<div class="aa2-bar aa2-bar-audio" id="bar-audio-' + track.id + '" style="background:' + track.color + ';left:0%;width:0%">' +
      '<div class="aa2-handle aa2-handle-l" data-action="trim-l"></div>' +
      '<span class="aa2-bar-label" id="label-audio-' + track.id + '"></span>' +
      '<div class="aa2-handle aa2-handle-r" data-action="trim-r"></div>' +
      '</div></div>';
    timelineTracks.appendChild(row);
    attachDragEvents(track.id);
  }
  function attachDragEvents(id) {
    var bar = document.getElementById('bar-audio-' + id);
    var bg = document.getElementById('bg-audio-' + id);
    var dragging = false;
    var actionType = '';
    var startX = 0;
    var initInsert = 0, initStart = 0, initEnd = 0;
    bar.addEventListener('pointerdown', function (e) {
      var track = tracks.find(function (t) { return t.id === id; });
      if (!track || !track.file) return;
      dragging = true;
      startX = e.clientX;
      initInsert = track.insertAt;
      initStart = track.trimStart;
      initEnd = track.trimEnd;
      if (e.target.classList.contains('aa2-handle-l')) actionType = 'trim-l';
      else if (e.target.classList.contains('aa2-handle-r')) actionType = 'trim-r';
      else actionType = 'move';
      try { bar.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });
    bar.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var track = tracks.find(function (t) { return t.id === id; });
      if (!track || !videoDuration || !bg.clientWidth) return;
      var deltaSec = (e.clientX - startX) / (bg.clientWidth / videoDuration);
      if (actionType === 'move') {
        track.insertAt = Math.min(Math.max(initInsert + deltaSec, 0), videoDuration);
      } else if (actionType === 'trim-l') {
        var ns = Math.min(Math.max(initStart + deltaSec, 0), initEnd - 0.2);
        track.trimStart = ns;
        track.insertAt = Math.min(Math.max(initInsert + deltaSec, 0), videoDuration);
      } else if (actionType === 'trim-r') {
        track.trimEnd = Math.min(Math.max(initEnd + deltaSec, initStart + 0.2), track.audioDur);
      }
      document.getElementById('t' + track.id + '-start').value = aa2FmtSec(track.trimStart);
      document.getElementById('t' + track.id + '-end').value = aa2FmtSec(track.trimEnd);
      document.getElementById('t' + track.id + '-insert').value = aa2FmtSec(track.insertAt);
      refreshTrackCard(track);
      updateAllVisuals();
    });
    var endDrag = function () { dragging = false; actionType = ''; };
    bar.addEventListener('pointerup', endDrag);
    bar.addEventListener('pointercancel', endDrag);
  }
  function updateAllVisuals() {
    if (!videoDuration) return;
    tracks.forEach(function (track) {
      if (!track.file || !track.audioDur) return;
      var bar = document.getElementById('bar-audio-' + track.id);
      var label = document.getElementById('label-audio-' + track.id);
      if (!bar || !label) return;
      var pct = aa2BarPct(track.insertAt, track.trimEnd - track.trimStart, videoDuration);
      bar.style.left = pct.left + '%';
      bar.style.width = pct.width + '%';
      label.textContent = track.file.name.substring(0, 15);
    });
  }
  function removeTrack(id) {
    var card = document.getElementById('track-card-' + id);
    if (card) card.remove();
    var row = document.getElementById('timeline-row-' + id);
    if (row) row.remove();
    var tr = tracks.find(function (t) { return t.id === id; });
    if (tr && tr.audioElem) {
      tr.audioElem.pause();
      tr.audioElem.removeAttribute('src');
    }
    tracks = tracks.filter(function (t) { return t.id !== id; });
    refreshStart();
  }
  btnStart.addEventListener('click', async function () {
    var activeTracks = tracks.filter(function (t) { return t.file; });
    if (activeTracks.length === 0) { showError('Chưa có track nhạc nào. Hãy thêm track và chọn file nhạc trước khi xuất.'); return; }
    var blocked = activeTracks.filter(function (t) { return videoDuration > 0 && t.insertAt >= videoDuration; });
    if (blocked.length) { showError('Có track đặt tại mốc vượt thời lượng video nên sẽ không phát ra. Hãy kéo track vào trong video rồi xuất lại.'); return; }
    hideError();
    resultBox.hidden = true;
    stopPreviewAudio();
    videoPlayer.pause();
    btnStart.disabled = true;
    statusBox.hidden = false;
    statusText.textContent = 'Đang khởi tạo FFmpeg Studio...';
    detailText.textContent = '';
    progressFill.style.width = '2%';
    try {
      if (!ffmpeg) {
        var createFFmpeg = FFmpeg.createFFmpeg;
        ffmpeg = createFFmpeg({
          corePath: 'https://congcuviet.com/wp-content/themes/bricks-child/tai-nguyen/ffmpeg-core.js',
          logger: function (log) {
            var message = log.message || '';
            if (message.indexOf('time=') >= 0) {
              var match = message.match(/time=\s*(\d{2}):(\d{2}):(\d+\.?\d*)/);
              if (match && videoDuration > 0) {
                var ct = parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseFloat(match[3]);
                var p = Math.min(100, Math.round((ct / videoDuration) * 100));
                progressFill.style.width = p + '%';
                statusText.textContent = 'Đang Mix Nhạc: ' + p + '%';
              }
            }
          }
        });
        await ffmpeg.load();
      }
      var fetchFile = FFmpeg.fetchFile;
      var vExt = aa2Ext(videoFile.name) || 'mp4';
      var inputVid = 'video.' + vExt;
      ffmpeg.FS('writeFile', inputVid, await fetchFile(videoFile));
      var audioInputs = [];
      var built = activeTracks.map(function (tr, i) {
        var aExt = aa2Ext(tr.file.name) || 'mp3';
        var inputAud = 'audio_' + i + '.' + aExt;
        audioInputs.push(inputAud);
        return { fileIdx: i + 1, start: tr.trimStart, end: tr.trimEnd, insert: tr.insertAt, vol: tr.vol, ducking: tr.ducking, input: inputAud };
      });
      for (var i = 0; i < activeTracks.length; i++) {
        ffmpeg.FS('writeFile', built[i].input, await fetchFile(activeTracks[i].file));
      }
      var out = aa2BuildArgs(mode, inputVid, audioInputs, built, 'output.mp4');
      statusText.textContent = 'Tiến hành Render Đa Luồng...';
      await ffmpeg.run.apply(ffmpeg, out.args);
      var data = ffmpeg.FS('readFile', 'output.mp4');
      if (!data || data.length === 0) throw new Error('Render không tạo ra file kết quả');
      var blob = new Blob([data.buffer], { type: 'video/mp4' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'video_mixed_congcuviet.mp4';
      a.click();
      URL.revokeObjectURL(url);
      ffmpeg.FS('unlink', inputVid);
      built.forEach(function (b) { ffmpeg.FS('unlink', b.input); });
      ffmpeg.FS('unlink', 'output.mp4');
      statusText.textContent = '🎉 Hoàn Tất! File đã được tải xuống.';
      progressFill.style.width = '100%';
      resultText.textContent = 'Video đã ghép xong và tự động tải xuống dưới dạng video_mixed_congcuviet.mp4 (MP4, hình ảnh giữ nguyên video gốc).';
      resultBox.hidden = false;
    } catch (err) {
      statusText.textContent = mode === 'mix'
        ? '❌ Render thất bại. Video gốc có thể không có luồng tiếng — hãy chuyển sang chế độ “Chỉ giữ nhạc mới” hoặc dùng video khác có tiếng.'
        : '❌ Render thất bại. Kiểm tra lại file video và file nhạc rồi thử lại.';
      detailText.textContent = err && err.message ? err.message : '';
    } finally {
      refreshStart();
    }
  });
});

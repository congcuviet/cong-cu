document.addEventListener('DOMContentLoaded', function () {

/* ===== PURE LOGIC START ===== */
var TTV_WORDS = ('thời gian con người cuộc sống gia đình bạn bè trường học công việc thành phố quê hương ' +
  'mùa xuân mùa hạ mùa thu mùa đông hôm nay ngày mai hôm qua buổi sáng buổi chiều buổi tối ' +
  'ăn uống đi lại học tập làm việc vui chơi nghỉ ngơi sức khỏe hạnh phúc bình yên ấm áp mát mẻ ' +
  'cây xanh hoa lá chim chóc sông núi biển cả bầu trời mặt đất ánh nắng cơn mưa gió mát trăng sao ' +
  'cha mẹ anh chị em bé ông bà cô giáo thầy giáo học sinh sinh viên bác sĩ kỹ sư nông dân công nhân ' +
  'sách vở bút giấy bàn ghế cửa sổ phòng học lớp học bài tập điểm số kỳ thi bằng cấp nghề nghiệp tương lai ' +
  'ước mơ hy vọng niềm tin tình yêu tình bạn lòng tốt sự thật chăm chỉ kiên trì cố gắng thành công thất bại ' +
  'bắt đầu kết thúc nhanh chậm cao thấp lớn nhỏ dài ngắn rộng hẹp sâu nông gần xa đông tây nam bắc ' +
  'trái phải trước sau trên dưới trong ngoài giữa bên cạnh đối diện xung quanh khắp nơi mọi người tất cả ' +
  'mỗi ngày hàng tuần hàng tháng hàng năm luôn luôn thường xuyên thỉnh thoảng hiếm khi không bao giờ ' +
  'việt nam hà nội sài gòn miền bắc miền trung miền nam đồng bằng miền núi hải đảo biên giới tổ quốc').split(' ');

var TTV_SENTENCES = [
  'Học thầy không tày học bạn, muốn sang thì bắc cầu kiều.',
  'Công cha như núi Thái Sơn, nghĩa mẹ như nước trong nguồn chảy ra.',
  'Ăn quả nhớ kẻ trồng cây, uống nước nhớ nguồn là đạo lý của người Việt.',
  'Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.',
  'Đi một ngày đàng, học một sàng khôn, càng đi xa càng hiểu biết nhiều.',
  'Chậm mà chắc còn hơn nhanh mà ẩu, làm việc gì cũng cần cẩn thận.',
  'Buổi sáng hôm nay trời trong xanh, gió mát và nắng vàng rực rỡ.',
  'Gia đình tôi thường quây quần bên mâm cơm ấm cúng vào mỗi buổi tối.',
  'Đọc sách mỗi ngày giúp mở rộng kiến thức và nuôi dưỡng tâm hồn.',
  'Tập thể dục đều đặn là cách đơn giản nhất để giữ gìn sức khỏe.',
  'Thành phố lúc bình minh yên tĩnh, chỉ nghe tiếng chim hót trên cành.',
  'Mùa thu Hà Nội đẹp nhất với hương hoa sữa thơm ngát khắp phố phường.',
  'Cánh đồng lúa chín vàng trải dài tới tận chân trời xa tít tắp.',
  'Tiếng mưa rơi trên mái nhà nghe như một bản nhạc êm dịu của thiên nhiên.',
  'Kiên trì và chăm chỉ là chìa khóa mở cánh cửa thành công trong cuộc sống.',
  'Bạn bè tốt luôn ở bên nhau lúc vui vẻ cũng như khi gặp khó khăn.',
  'Công nghệ thay đổi từng ngày, ai không học hỏi sẽ bị bỏ lại phía sau.',
  'Một nụ cười thân thiện có thể làm ấm lòng người đối diện trong ngày lạnh.',
  'Quê hương là nơi chôn rau cắt rốn, dù đi xa ai cũng nhớ về.',
  'Ước mơ chỉ thành hiện thực khi ta bắt tay vào làm ngay từ hôm nay.'
];

/* Sinh đoạn văn để gõ: chế độ 'words' = từ đơn ngẫu nhiên, 'sentences' = các câu ghép lại */
function ttvBuildText(mode, rand) {
  rand = rand || Math.random;
  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  if (mode === 'sentences') {
    var s = shuffled(TTV_SENTENCES), out = '';
    var i = 0;
    while (out.length < 700) { out += (out ? ' ' : '') + s[i % s.length]; i++; }
    return out.normalize('NFC');
  }
  var words = [];
  while (words.length < 130) words = words.concat(shuffled(TTV_WORDS));
  return words.slice(0, 130).join(' ').normalize('NFC');
}
/* Tính WPM (chuẩn: 5 ký tự đúng = 1 từ) và độ chính xác */
function ttvScore(correctChars, totalTyped, elapsedSec) {
  var wpm = elapsedSec > 0 ? Math.round((correctChars / 5) / (elapsedSec / 60)) : 0;
  var acc = totalTyped > 0 ? Math.round(1000 * correctChars / totalTyped) / 10 : 100;
  return { wpm: wpm, accuracy: acc };
}
function ttvRank(wpm) {
  if (wpm >= 100) return '⚡ Thần tốc';
  if (wpm >= 80) return '🏎️ Chuyên nghiệp';
  if (wpm >= 60) return '🚗 Rất nhanh';
  if (wpm >= 45) return '🚴 Nhanh';
  if (wpm >= 30) return '🏃 Khá nhanh';
  if (wpm >= 15) return '🚶 Tốc độ đi bộ';
  return '🌱 Mới tập gõ';
}
/* ===== PURE LOGIC END ===== */

  function $(id) { return document.getElementById(id); }
  var displayEl = $('ttv-display'), innerEl = $('ttv-text-inner'), inputEl = $('ttv-input');
  var timeEl = $('ttv-stat-time'), wpmEl = $('ttv-stat-wpm'), accEl = $('ttv-stat-acc');
  var resultEl = $('ttv-result'), bestEl = $('ttv-best');
  var btnFinish = $('ttv-btn-finish');

  var state = {
    mode: 'words', seconds: 30, target: '', started: false, finished: false,
    startAt: 0, timer: null, correct: 0, total: 0
  };

  function loadBest() {
    try {
      var b = JSON.parse(localStorage.getItem('ttv-best') || 'null');
      if (b && b.wpm) {
        bestEl.textContent = '🏆 Kỷ lục của bạn trên máy này: ' + b.wpm + ' WPM (chính xác ' + b.acc + '%)';
        bestEl.style.display = '';
        return b;
      }
    } catch (e) {}
    bestEl.style.display = 'none';
    return null;
  }
  function saveBest(wpm, acc) {
    var b = loadBest();
    if (!b || wpm > b.wpm) {
      try { localStorage.setItem('ttv-best', JSON.stringify({ wpm: wpm, acc: acc })); } catch (e) {}
    }
    loadBest();
  }

  function newTest() {
    clearInterval(state.timer);
    state.target = ttvBuildText(state.mode);
    state.started = false; state.finished = false;
    state.correct = 0; state.total = 0;
    inputEl.value = '';
    inputEl.disabled = false;
    innerEl.innerHTML = state.target.split('').map(function (ch) {
      return '<span class="ttv-ch">' + ch + '</span>';
    }).join('');
    innerEl.style.transform = 'translateY(0)';
    markCurrent();
    timeEl.textContent = state.seconds;
    wpmEl.textContent = '0';
    accEl.textContent = '100';
    resultEl.style.display = 'none';
    btnFinish.style.display = 'none';
    inputEl.focus();
  }

  function spans() { return innerEl.children; }
  function markCurrent() {
    var typedLen = inputEl.value.length;
    var sp = spans();
    for (var i = 0; i < sp.length; i++) sp[i].classList.toggle('ttv-current', i === typedLen);
    var cur = sp[typedLen];
    if (cur) {
      var lineH = 36;
      var lineIdx = Math.floor(cur.offsetTop / lineH);
      var shift = Math.max(0, (lineIdx - 1) * lineH);
      innerEl.style.transform = 'translateY(-' + shift + 'px)';
    }
  }

  function refreshStats(elapsed) {
    var typed = inputEl.value.normalize('NFC');
    var correct = 0;
    for (var i = 0; i < typed.length; i++) if (typed[i] === state.target[i]) correct++;
    state.correct = correct; state.total = typed.length;
    var sc = ttvScore(correct, typed.length, Math.max(elapsed, 1));
    wpmEl.textContent = sc.wpm;
    accEl.textContent = String(sc.accuracy).replace('.', ',');
    return sc;
  }

  function paint() {
    var typed = inputEl.value.normalize('NFC');
    var sp = spans();
    for (var i = 0; i < sp.length; i++) {
      sp[i].classList.toggle('ttv-ok', i < typed.length && typed[i] === state.target[i]);
      sp[i].classList.toggle('ttv-bad', i < typed.length && typed[i] !== state.target[i]);
    }
    markCurrent();
  }

  function startTimer() {
    state.started = true;
    state.startAt = Date.now();
    btnFinish.style.display = '';
    state.timer = setInterval(function () {
      var elapsed = (Date.now() - state.startAt) / 1000;
      var remain = Math.max(0, Math.ceil(state.seconds - elapsed));
      timeEl.textContent = remain;
      refreshStats(elapsed);
      if (elapsed >= state.seconds) finish();
    }, 200);
  }

  function finish() {
    if (state.finished) return;
    state.finished = true;
    clearInterval(state.timer);
    var elapsed = state.started ? Math.min(state.seconds, (Date.now() - state.startAt) / 1000) : 0;
    var sc = refreshStats(elapsed);
    inputEl.disabled = true;
    btnFinish.style.display = 'none';
    $('ttv-res-wpm').textContent = sc.wpm;
    $('ttv-res-acc').textContent = String(sc.accuracy).replace('.', ',') + '%';
    $('ttv-res-chars').textContent = state.correct + '/' + state.total;
    $('ttv-res-rank').textContent = ttvRank(sc.wpm);
    resultEl.style.display = '';
    if (state.total >= 20) saveBest(sc.wpm, sc.accuracy);
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  inputEl.addEventListener('input', function () {
    if (state.finished) return;
    if (inputEl.value.length > state.target.length) inputEl.value = inputEl.value.slice(0, state.target.length);
    if (!state.started && inputEl.value.length > 0) startTimer();
    paint();
    if (state.started) refreshStats((Date.now() - state.startAt) / 1000);
    if (inputEl.value.length >= state.target.length) finish();
  });
  inputEl.addEventListener('paste', function (e) { e.preventDefault(); });
  inputEl.addEventListener('keydown', function (e) { if (e.key === 'Tab') { e.preventDefault(); inputEl.focus(); } });
  displayEl.addEventListener('click', function () { if (!state.finished) inputEl.focus(); });
  btnFinish.addEventListener('click', finish);

  Array.prototype.forEach.call(document.querySelectorAll('[data-ttv-time]'), function (btn) {
    btn.addEventListener('click', function () {
      state.seconds = parseInt(btn.getAttribute('data-ttv-time'), 10);
      document.querySelectorAll('[data-ttv-time]').forEach(function (b) { b.classList.toggle('ttv-chip-active', b === btn); });
      newTest();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-ttv-mode]'), function (btn) {
    btn.addEventListener('click', function () {
      state.mode = btn.getAttribute('data-ttv-mode');
      document.querySelectorAll('[data-ttv-mode]').forEach(function (b) { b.classList.toggle('ttv-chip-active', b === btn); });
      newTest();
    });
  });
  $('ttv-btn-new').addEventListener('click', newTest);
  $('ttv-btn-again').addEventListener('click', newTest);

  loadBest();
  newTest();
});

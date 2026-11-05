/* PURE LOGIC START */
function se2Slugify(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function se2EscapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function se2NormText(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}
function se2PhraseRegex(phrase) {
  var parts = se2NormText(phrase).split(' ').map(se2EscapeRegExp);
  return new RegExp('(?<![\\p{L}\\p{N}])' + parts.join('\\s+') + '(?![\\p{L}\\p{N}])', 'giu');
}
function se2CountPhrase(text, phrase) {
  if (!se2NormText(phrase)) return 0;
  var m = se2NormText(text).match(se2PhraseRegex(phrase));
  return m ? m.length : 0;
}
function se2WordCount(text) {
  var t = se2NormText(text);
  return t ? t.split(' ').length : 0;
}
function se2Density(count, words) {
  return words > 0 ? Math.round((count / words) * 10000) / 100 : 0;
}
function se2TitleVerdict(len) {
  if (len <= 0) return 'na';
  if (len <= 60) return 'pass';
  if (len <= 70) return 'warn';
  return 'fail';
}
function se2MetaVerdict(len) {
  if (len <= 0) return 'na';
  if (len >= 120 && len <= 160) return 'pass';
  if (len < 120) return 'warn';
  return 'fail';
}
function se2Score(checks) {
  var got = 0;
  checks.forEach(function (c) {
    if (c.status === 'pass') got += 1;
    else if (c.status === 'warn') got += 0.5;
  });
  return checks.length ? Math.round(100 * got / checks.length) : 0;
}
function se2ClassifyLinks(links, domain) {
  var d = se2NormText(domain).replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  var out = { internal: 0, external: 0, externalNofollow: 0 };
  links.forEach(function (a) {
    var href = (a.href || '').trim();
    if (!href || href.charAt(0) === '#') return;
    if (/^(mailto|tel|javascript):/i.test(href)) return;
    if (href.charAt(0) === '/') { out.internal++; return; }
    var host = '';
    try { host = new URL(href, 'https://x.invalid').hostname.toLowerCase(); } catch (e) { return; }
    if (host === 'x.invalid') { out.internal++; return; }
    if (d && (host === d || host.endsWith('.' + d))) { out.internal++; return; }
    if (/^https?:/i.test(href)) {
      out.external++;
      if (/\bnofollow\b/i.test(a.rel || '')) out.externalNofollow++;
    }
  });
  return out;
}
function se2Analyze(doc, f) {
  var text = doc.textContent || '';
  var wordsArr = se2NormText(text) ? se2NormText(text).split(' ') : [];
  var wordCount = wordsArr.length;
  var kw = se2NormText(f.primary);
  var kwCount = kw ? se2CountPhrase(text, kw) : 0;
  var density = se2Density(kwCount, wordCount);
  var images = doc.querySelectorAll('img');
  var linkEls = doc.querySelectorAll('a');
  var links = [];
  linkEls.forEach(function (a) { links.push({ href: a.getAttribute('href') || '', rel: a.getAttribute('rel') || '' }); });
  var linkInfo = se2ClassifyLinks(links, f.domain);
  var headings = doc.querySelectorAll('h2, h3, h4, h5, h6');
  var h1Count = doc.querySelectorAll('h1').length;
  var title = (f.title || '').trim();
  var titleLow = title.toLowerCase();
  var desc = (f.desc || '').trim();
  var descLow = desc.toLowerCase();
  var slug = (f.slug || '').trim().toLowerCase();
  var checks = [];
  function add(group, status, textOut) { checks.push({ group: group, status: status, text: textOut }); }
  if (!kw) {
    add('basic', 'na', 'Chưa có từ khoá chính để đánh giá tiêu chí này (từ khoá trong Tiêu đề SEO).');
    add('basic', 'na', 'Chưa có từ khoá chính để đánh giá tiêu chí này (từ khoá trong Mô tả Meta).');
    add('basic', 'na', 'Chưa có từ khoá chính để đánh giá tiêu chí này (từ khoá trong URL).');
    add('basic', 'na', 'Chưa có từ khoá chính để đánh giá tiêu chí này (từ khoá trong 10% đầu bài).');
    add('basic', 'na', 'Chưa có từ khoá chính để đánh giá tiêu chí này (từ khoá trong nội dung).');
  } else {
    add('basic', titleLow.includes(kw) ? 'pass' : 'fail', titleLow.includes(kw) ? 'Tuyệt vời! Bạn đang sử dụng từ khoá chính trong Tiêu đề SEO.' : 'Chưa sử dụng từ khoá chính trong Tiêu đề SEO.');
    add('basic', descLow.includes(kw) ? 'pass' : 'fail', descLow.includes(kw) ? 'Đã sử dụng từ khoá chính trong Mô tả Meta SEO.' : 'Chưa sử dụng từ khoá chính trong Mô tả Meta SEO.');
    var kwSlug = se2Slugify(kw);
    add('basic', kwSlug && slug.includes(kwSlug) ? 'pass' : 'fail', kwSlug && slug.includes(kwSlug) ? 'Từ khóa chính đã được sử dụng trong URL.' : 'Chưa sử dụng từ khoá chính trong URL.');
    var firstWords = wordsArr.slice(0, Math.max(10, Math.floor(wordCount * 0.1))).join(' ');
    add('basic', se2CountPhrase(firstWords, kw) > 0 ? 'pass' : 'fail', se2CountPhrase(firstWords, kw) > 0 ? 'Từ khoá chính xuất hiện trong 10% nội dung đầu tiên.' : 'Không tìm thấy từ khoá chính trong phần mở đầu bài viết.');
    add('basic', kwCount > 0 ? 'pass' : 'fail', kwCount > 0 ? 'Đã tìm thấy từ khoá chính trong nội dung.' : 'Chưa tìm thấy từ khoá chính trong nội dung.');
  }
  add('basic', wordCount >= 600 ? 'pass' : 'fail', wordCount >= 600 ? 'Nội dung dài ' + wordCount + ' từ. Làm tốt lắm!' : 'Nội dung hơi ngắn (' + wordCount + ' từ). Nên viết tối thiểu 600 từ.');
  var tv = se2TitleVerdict(title.length);
  add('basic', tv, tv === 'pass' ? 'Tiêu đề dài ' + title.length + ' ký tự, hiển thị tốt trên kết quả tìm kiếm.' : tv === 'warn' ? 'Tiêu đề dài ' + title.length + ' ký tự, có thể bị cắt ngắn trên kết quả tìm kiếm.' : tv === 'fail' ? 'Tiêu đề dài ' + title.length + ' ký tự, quá dài và sẽ bị cắt ngắn.' : 'Chưa nhập tiêu đề để đo độ dài.');
  var mv = se2MetaVerdict(desc.length);
  add('basic', mv, mv === 'pass' ? 'Mô tả dài ' + desc.length + ' ký tự, trong khoảng 120–160 ký tự.' : mv === 'warn' ? 'Mô tả dài ' + desc.length + ' ký tự, hơi ngắn so với khoảng 120–160 ký tự.' : mv === 'fail' ? 'Mô tả dài ' + desc.length + ' ký tự, quá dài và sẽ bị cắt ngắn.' : 'Chưa nhập mô tả meta để đo độ dài.');
  if (!kw) {
    add('extra', 'na', 'Chưa có từ khoá chính để đánh giá tiêu chí này (từ khoá trong tiêu đề phụ).');
    add('extra', 'na', 'Chưa có từ khoá chính để đánh giá tiêu chí này (từ khoá trong ALT ảnh).');
    add('extra', 'na', 'Chưa có từ khoá chính để đánh giá tiêu chí này (mật độ từ khoá).');
  } else {
    var hasKwHeading = false;
    headings.forEach(function (h) { if (se2NormText(h.textContent).includes(kw)) hasKwHeading = true; });
    add('extra', hasKwHeading ? 'pass' : 'fail', hasKwHeading ? 'Đã tìm thấy từ khoá chính trong các tiêu đề phụ (H2, H3...).' : 'Từ khóa chính chưa xuất hiện trong tiêu đề phụ nào.');
    var hasKwAlt = false;
    images.forEach(function (img) { if (img.alt && img.alt.toLowerCase().includes(kw)) hasKwAlt = true; });
    if (hasKwAlt) add('extra', 'pass', 'Đã tìm thấy Từ khóa chính trong thuộc tính alt của hình ảnh.');
    else if (images.length > 0) add('extra', 'fail', 'Hình ảnh thiếu từ khoá chính trong thuộc tính ALT.');
    else add('extra', 'warn', 'Bài viết chưa có hình ảnh nào.');
    if (density >= 1 && density <= 2.5) add('extra', 'pass', 'Mật độ từ khóa là ' + density.toFixed(2) + '%. Xuất hiện ' + kwCount + ' lần.');
    else if (density < 1) add('extra', 'warn', 'Mật độ từ khóa là ' + density.toFixed(2) + '%, điều này là hơi thấp.');
    else add('extra', 'fail', 'Mật độ từ khóa là ' + density.toFixed(2) + '%, quá cao (nhồi nhét từ khoá).');
  }
  var sv = slug.length === 0 ? 'na' : slug.length <= 75 ? 'pass' : 'fail';
  add('extra', sv, sv === 'pass' ? 'URL dài ' + slug.length + ' ký tự. Rất tốt!' : sv === 'fail' ? 'URL dài ' + slug.length + ' ký tự. Khá dài, hãy rút gọn.' : 'Chưa nhập slug để đo độ dài.');
  if (linkInfo.external > 0) {
    if (linkInfo.external === linkInfo.externalNofollow) add('extra', 'warn', 'Tìm thấy ' + linkInfo.external + ' liên kết ngoài, nhưng tất cả đều là nofollow.');
    else add('extra', 'pass', 'Đã tìm thấy liên kết ra ngoài (Dofollow). Rất tốt.');
  } else {
    add('extra', 'fail', 'Không tìm thấy liên kết ra ngoài (External links).');
  }
  add('extra', linkInfo.internal > 0 ? 'pass' : 'fail', linkInfo.internal > 0 ? 'Bạn đang liên kết đến tài nguyên nội bộ (' + linkInfo.internal + ' links), điều này thật tuyệt.' : 'Không tìm thấy liên kết nội bộ. Hãy bổ sung.');
  add('extra', h1Count === 0 ? 'pass' : 'warn', h1Count === 0 ? 'Thân bài không dùng H1, đúng vai trò của tiêu đề bài.' : 'Thân bài có ' + h1Count + ' thẻ H1 — H1 thường chỉ dành cho tiêu đề bài.');
  if (!kw) {
    add('read', 'na', 'Chưa có từ khoá chính để đánh giá tiêu chí này (từ khoá ở đầu tiêu đề).');
  } else {
    add('read', titleLow.startsWith(kw) ? 'pass' : 'warn', titleLow.startsWith(kw) ? 'Từ khóa chính được sử dụng ở đầu tiêu đề SEO.' : 'Từ khóa chính nên đặt ở đầu tiêu đề SEO.');
  }
  add('read', /\d/.test(title) ? 'pass' : 'warn', /\d/.test(title) ? 'Bạn đang sử dụng số trong tiêu đề SEO của mình.' : 'Nên thêm số vào tiêu đề để tăng tỷ lệ click (CTR).');
  var hasLongPara = false;
  doc.querySelectorAll('p').forEach(function (p) { if (se2WordCount(p.textContent) > 120) hasLongPara = true; });
  add('read', hasLongPara ? 'fail' : 'pass', hasLongPara ? 'Có đoạn văn quá dài (hơn 120 từ). Hãy ngắt dòng.' : 'Bạn đang sử dụng các đoạn văn ngắn.');
  var hasMedia = images.length > 0 || doc.querySelectorAll('iframe, video').length > 0;
  add('read', hasMedia ? 'pass' : 'fail', hasMedia ? 'Nội dung của bạn chứa hình ảnh và / hoặc video.' : 'Nội dung của bạn chưa có hình ảnh hoặc video nào.');
  var secondary = [];
  (f.keywords || []).slice(1).forEach(function (k) {
    secondary.push({ kw: k, count: se2CountPhrase(text, k) });
  });
  return {
    checks: checks,
    score: se2Score(checks),
    stats: { words: wordCount, density: density, images: images.length, links: linkEls.length, secondary: secondary }
  };
}
function se2Sample() {
  return {
    keywords: 'máy lọc nước, lọc nước gia đình, máy lọc nước RO',
    domain: 'congcuviet.com',
    title: 'Máy lọc nước gia đình: cách chọn đúng nhu cầu 2026',
    slug: 'may-loc-nuoc-gia-dinh',
    desc: 'Máy lọc nước nào phù hợp cho gia đình 4 người? Hướng dẫn cách chọn công suất, lõi lọc và chi phí thay lõi theo nhu cầu thực tế.',
    html: '<h2>Máy lọc nước gia đình gồm những loại nào?</h2>'
      + '<p>Máy lọc nước gia đình hiện nay chia thành ba nhóm chính: RO, Nano và UF. Dòng RO dùng màng thẩm thấu ngược, loại bỏ gần như toàn bộ tạp chất, vi khuẩn và kim loại nặng, phù hợp với nguồn nước máy có độ cứng cao hoặc nước giếng khoan đã qua xử lý thô. Dòng Nano giữ lại một phần khoáng chất tự nhiên, không cần điện và không có nước thải, nhưng yêu cầu nguồn nước đầu vào tương đối sạch. Dòng UF dùng màng siêu lọc, giữ khoáng, giá thành thấp, phù hợp với nước máy đô thị đã đạt chuẩn. Mỗi loại máy lọc nước đều có ưu điểm riêng, vì vậy việc chọn đúng loại cần dựa vào chất lượng nước đầu vào và nhu cầu sử dụng thực tế của gia đình.</p>'
      + '<p><img src="https://picsum.photos/800/450?random=11" alt="Máy lọc nước gia đình đặt trong bếp"></p>'
      + '<h2>Cách chọn máy lọc nước theo nhu cầu</h2>'
      + '<p>Trước khi mua máy lọc nước, hãy xác định ba yếu tố: số người dùng, chất lượng nước đầu vào và vị trí lắp đặt. Gia đình bốn người thường cần thiết bị có công suất từ 10 đến 15 lít mỗi giờ, bình chứa khoảng 10 lít để đủ dùng cho nấu ăn và uống trực tiếp. Nếu nguồn nước là nước giếng khoan, máy lọc nước RO là lựa chọn an toàn nhất vì màng RO xử lý được độ cứng, sắt và mangan. Với nước máy đô thị, dòng Nano hoặc UF đủ dùng và tiết kiệm điện hơn. Vị trí lắp đặt cũng quan trọng: gầm bếp cần mẫu nhỏ gọn, còn phòng khách có thể chọn mẫu có vỏ tủ đứng đẹp mắt. Cân nhắc kỹ ba yếu tố này giúp bạn chọn được thiết bị vừa đủ dùng, không lãng phí.</p>'
      + '<h3>Công suất bao nhiêu là đủ?</h3>'
      + '<p>Công suất thường ghi theo lít mỗi giờ, nhưng con số này chỉ đúng khi áp suất nước đầu vào ổn định. Nhà cao tầng hoặc khu vực nước yếu nên cộng thêm 20 đến 30% công suất dự phòng để máy không phải chạy liên tục. Bình chứa cũng đáng quan tâm: bình 8 lít đủ cho gia đình hai người, bình 10 đến 12 lít phù hợp với gia đình bốn người, còn nhà đông người hoặc có nhu cầu nấu ăn nhiều nên chọn bình lớn hơn hoặc lắp thêm bình phụ.</p>'
      + '<h3>Chi phí thay lõi máy lọc nước</h3>'
      + '<p>Chi phí vận hành gồm tiền điện, tiền nước thải và tiền thay lõi định kỳ. Lõi lọc thô thường thay sau 3 đến 6 tháng, lõi than hoạt tính sau 6 đến 12 tháng, màng RO sau 24 đến 36 tháng tùy chất lượng nước. Một gia đình bốn người tốn khoảng 500.000 đến 900.000 đồng mỗi năm cho lõi lọc của dòng RO, thấp hơn nhiều so với tiền mua nước đóng bình. Khi so sánh các mẫu, hãy hỏi rõ giá lõi thay thế và lịch thay của từng lõi, vì lõi rẻ nhưng thay thường xuyên có thể đắt hơn lõi tốt thay ít lần. Đừng quên kiểm tra chế độ bảo hành trước khi quyết định mua máy lọc nước.</p>'
      + '<p>Để tìm hiểu thêm về cách chăm sóc thiết bị trong nhà, bạn có thể xem <a href="/cong-cu-tinh-luong-gross-sang-net">công cụ tính lương Gross sang Net</a> trên cùng website, hoặc tham khảo tiêu chuẩn nước uống của <a href="https://www.who.int/water_sanitation_health/dwq/guidelines/en/">Tổ chức Y tế Thế giới</a>. Việc chọn thiết bị đúng nhu cầu giúp gia đình tiết kiệm chi phí dài hạn và yên tâm hơn về chất lượng nước uống mỗi ngày. Nếu còn băn khoăn giữa các dòng máy lọc nước, hãy đem mẫu nước đi xét nghiệm trước khi chốt mua.</p>'
      + '<p><img src="https://picsum.photos/800/450?random=22" alt="Lõi lọc của máy lọc nước RO"></p>'
      + '<h2>Bảo trì máy lọc nước định kỳ</h2>'
      + '<p>Sau khi lắp đặt, hãy ghi lại ngày thay từng lõi vào một tờ giấy dán cạnh thiết bị hoặc nhắc hẹn trên điện thoại. Lõi lọc quá hạn không chỉ làm nước kém sạch mà còn khiến máy chạy ồn và tốn điện hơn. Mỗi tháng, hãy lau vỏ máy, kiểm tra các khớp nối có rò rỉ không và xả thử một lít nước đầu tiên sau kỳ nghỉ dài. Nếu nước có mùi lạ hoặc chảy yếu hẳn, đó là dấu hiệu cần kiểm tra lõi ngay thay vì chờ đến kỳ hẹn. Bảo trì đều giúp thiết bị bền hơn và nước uống luôn đạt chất lượng ổn định.</p>'
      + '<h2>Kết luận</h2>'
      + '<p>Tóm lại, mẫu tốt nhất là mẫu phù hợp với nguồn nước và thói quen của gia đình bạn, không nhất thiết là mẫu đắt nhất. Hãy kiểm tra chất lượng nước đầu vào, tính đủ công suất và dự trù chi phí thay lõi trước khi mua. Một chiếc máy lọc nước được chọn đúng sẽ phục vụ gia đình nhiều năm mà không phát sinh rắc rối.</p>'
  };
}
/* PURE LOGIC END */

document.addEventListener('DOMContentLoaded', function () {
  var useFallback = typeof window.tinymce === 'undefined';
  var editorBox = document.getElementById('se2-content');
  var fallbackBox = document.getElementById('se2-fallback');
  var fallbackNote = document.getElementById('se2-fallback-note');
  var toastEl = document.getElementById('se2-toast');
  var toastTimer = null;
  function se2Toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 4500);
  }
  function se2GetDoc() {
    if (!useFallback) {
      var ed = window.tinymce && window.tinymce.activeEditor;
      if (!ed) return null;
      return ed.getBody();
    }
    var div = document.createElement('div');
    div.innerHTML = fallbackBox.value || '';
    return div;
  }
  function se2SyncBack(doc) {
    if (!useFallback) {
      var ed = window.tinymce && window.tinymce.activeEditor;
      if (ed) ed.setContent(doc.innerHTML);
    } else {
      fallbackBox.value = doc.innerHTML;
    }
  }
  function se2Fields() {
    var kws = document.getElementById('se2-keywords').value.split(',').map(function (k) { return k.trim(); }).filter(function (k) { return k; });
    return {
      keywords: kws,
      primary: kws.length > 0 ? kws[0] : '',
      domain: document.getElementById('se2-domain').value,
      title: document.getElementById('se2-title').value,
      slug: document.getElementById('se2-slug').value,
      desc: document.getElementById('se2-desc').value
    };
  }
  function se2RunChecks() {
    var doc = se2GetDoc();
    if (!doc) return;
    var res = se2Analyze(doc, se2Fields());
    document.getElementById('se2-stat-words').textContent = res.stats.words;
    document.getElementById('se2-stat-density').textContent = res.stats.density.toFixed(2) + '%';
    document.getElementById('se2-stat-images').textContent = res.stats.images;
    document.getElementById('se2-stat-links').textContent = res.stats.links;
    var secEl = document.getElementById('se2-secondary');
    if (res.stats.secondary.length > 0) {
      secEl.textContent = res.stats.secondary.map(function (s) { return s.kw + ': ' + s.count + ' lần'; }).join(' · ');
      secEl.hidden = false;
    } else {
      secEl.hidden = true;
    }
    var scoreEl = document.getElementById('se2-score');
    scoreEl.textContent = res.score;
    var verdict = document.getElementById('se2-verdict');
    if (res.score >= 80) verdict.textContent = 'Xuất sắc — bản nháp đã tối ưu tốt.';
    else if (res.score >= 60) verdict.textContent = 'Tốt — còn vài điểm nên sửa.';
    else if (res.score >= 40) verdict.textContent = 'Cần cải thiện — còn nhiều tiêu chí chưa đạt.';
    else verdict.textContent = 'Còn nhiều việc phải làm — hãy nhập từ khoá và nội dung trước.';
    var groups = { basic: 'SEO Cơ Bản', extra: 'Bổ Sung', read: 'Khả Năng Đọc' };
    var html = '';
    Object.keys(groups).forEach(function (g) {
      var list = res.checks.filter(function (c) { return c.group === g; });
      var passed = list.filter(function (c) { return c.status === 'pass'; }).length;
      html += '<div class="se2-group"><div class="se2-group-title">' + groups[g] + ' (' + passed + '/' + list.length + ')</div>';
      list.forEach(function (c) {
        var icon = c.status === 'pass' ? '✅' : c.status === 'fail' ? '❌' : c.status === 'warn' ? '⚠️' : '◻️';
        html += '<div class="se2-check-item ' + c.status + '"><div class="se2-icon">' + icon + '</div><div>' + c.text + '</div></div>';
      });
      html += '</div>';
    });
    document.getElementById('se2-results').innerHTML = html;
    var passCount = res.checks.filter(function (c) { return c.status === 'pass'; }).length;
    document.getElementById('se2-passline').textContent = 'Đạt ' + passCount + '/' + res.checks.length + ' tiêu chí · Tiêu chí chưa đánh giá được tính 0 điểm.';
  }
  function se2Counters() {
    var t = document.getElementById('se2-title').value;
    var tEl = document.getElementById('se2-title-count');
    tEl.textContent = t.length + '/60 ký tự';
    tEl.className = 'se2-count ' + (t.length === 0 ? '' : se2TitleVerdict(t.length));
    var d = document.getElementById('se2-desc').value;
    var dEl = document.getElementById('se2-desc-count');
    dEl.textContent = d.length + '/160 ký tự';
    dEl.className = 'se2-count ' + (d.length === 0 ? '' : se2MetaVerdict(d.length));
  }
  ['se2-keywords', 'se2-domain', 'se2-title', 'se2-slug', 'se2-desc'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', function () { se2Counters(); se2RunChecks(); });
  });
  se2Counters();
  if (useFallback) {
    editorBox.hidden = true;
    fallbackBox.hidden = false;
    fallbackNote.hidden = false;
    fallbackBox.addEventListener('input', se2RunChecks);
    se2RunChecks();
  } else {
    window.tinymce.init({
      selector: '#se2-content',
      height: 600,
      plugins: 'preview searchreplace autolink directionality code visualblocks visualchars fullscreen image link media template codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons',
      menubar: 'file edit view insert format tools table help',
      toolbar: 'undo redo | bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify | outdent indent | numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen preview | image media link codesample | ltr rtl',
      setup: function (editor) {
        editor.on('input change keyup', se2RunChecks);
        editor.on('init', se2RunChecks);
      }
    });
  }
  function se2CollectTextNodes(root, out) {
    var kids = root.childNodes;
    for (var i = 0; i < kids.length; i++) {
      var n = kids[i];
      if (n.nodeType === 3) { if (n.nodeValue.trim() !== '') out.push(n); }
      else if (n.nodeType === 1 && n.tagName !== 'MARK' && n.tagName !== 'SCRIPT' && n.tagName !== 'STYLE') se2CollectTextNodes(n, out);
    }
  }
  function se2MarkInNode(doc, node, phrase, bg) {
    var ownerDoc = doc.ownerDocument || document;
    var re = se2PhraseRegex(phrase);
    var text = node.nodeValue;
    var frag = ownerDoc.createDocumentFragment();
    var last = 0;
    var count = 0;
    var m;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      frag.appendChild(ownerDoc.createTextNode(text.slice(last, m.index)));
      var mark = ownerDoc.createElement('mark');
      mark.setAttribute('data-se2', '1');
      mark.style.backgroundColor = bg;
      mark.textContent = m[0];
      frag.appendChild(mark);
      last = m.index + m[0].length;
      count++;
      if (m[0].length === 0) re.lastIndex++;
    }
    frag.appendChild(ownerDoc.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
    return count;
  }
  function se2WithDoc(fn) {
    var doc = se2GetDoc();
    if (!doc) { se2Toast('Trình soạn thảo chưa sẵn sàng, hãy thử lại sau giây lát.'); return; }
    var out = fn(doc);
    se2SyncBack(doc);
    se2RunChecks();
    return out;
  }
  document.getElementById('se2-btn-highlight').addEventListener('click', function () {
    var f = se2Fields();
    if (!f.primary) { se2Toast('Vui lòng nhập từ khoá trước khi Highlight!'); return; }
    var total = se2WithDoc(function (doc) {
      doc.querySelectorAll('mark[data-se2]').forEach(function (mk) {
        var parent = mk.parentNode;
        while (mk.firstChild) parent.insertBefore(mk.firstChild, mk);
        parent.removeChild(mk);
        parent.normalize();
      });
      var n = 0;
      var nodes = [];
      se2CollectTextNodes(doc, nodes);
      nodes.forEach(function (nd) { n += se2MarkInNode(doc, nd, f.primary, 'yellow'); });
      f.keywords.slice(1).forEach(function (k) {
        var nodes2 = [];
        se2CollectTextNodes(doc, nodes2);
        nodes2.forEach(function (nd) { n += se2MarkInNode(doc, nd, k, '#a7f3d0'); });
      });
      return n;
    });
    if (typeof total === 'number') se2Toast('Đã highlight ' + total + ' vị trí! (Vàng: Key chính, Xanh: Key phụ).');
  });
  document.getElementById('se2-btn-clean-lines').addEventListener('click', function () {
    var removed = se2WithDoc(function (doc) {
      var n = 0;
      doc.querySelectorAll('p').forEach(function (p) {
        if (p.querySelector('img, video, iframe')) return;
        if (p.textContent.replace(/\u00a0/g, '').trim() !== '') return;
        var onlyBr = true;
        p.childNodes.forEach(function (ch) { if (ch.nodeType === 1 && ch.tagName !== 'BR') onlyBr = false; });
        if (onlyBr) { p.remove(); n++; }
      });
      return n;
    });
    if (typeof removed === 'number') se2Toast('Đã xoá ' + removed + ' dòng trắng thừa!');
  });
  document.getElementById('se2-btn-format-img').addEventListener('click', function () {
    var done = se2WithDoc(function (doc) {
      var images = doc.querySelectorAll('img');
      images.forEach(function (img) {
        img.setAttribute('width', '800');
        img.style.width = '800px';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '10px auto';
      });
      return images.length;
    });
    if (typeof done === 'number') {
      if (done === 0) se2Toast('Không tìm thấy ảnh nào!');
      else se2Toast('Đã chỉnh ' + done + ' ảnh về ngang 800px và căn giữa!');
    }
  });
  document.getElementById('se2-btn-auto-caption').addEventListener('click', function () {
    var count = se2WithDoc(function (doc) {
      var n = 0;
      var lastHeading = '';
      var ownerDoc = doc.ownerDocument || document;
      Array.prototype.slice.call(doc.querySelectorAll('*')).forEach(function (el) {
        if (/^H[2-6]$/i.test(el.tagName)) lastHeading = el.textContent.trim();
        if (el.tagName === 'IMG' && lastHeading) {
          var parent = el.parentNode;
          if (parent && parent.tagName !== 'FIGURE') {
            var figure = ownerDoc.createElement('figure');
            figure.style.textAlign = 'center';
            figure.style.margin = '20px 0';
            var imgClone = el.cloneNode(true);
            figure.appendChild(imgClone);
            var caption = ownerDoc.createElement('figcaption');
            caption.style.fontStyle = 'italic';
            caption.style.color = '#6b7280';
            caption.style.fontSize = '14px';
            caption.style.marginTop = '8px';
            caption.textContent = lastHeading;
            figure.appendChild(caption);
            parent.replaceChild(figure, el);
            n++;
          }
        }
      });
      return n;
    });
    if (typeof count === 'number') se2Toast('Đã tự động thêm Caption cho ' + count + ' ảnh dựa trên Heading trước đó!');
  });
  document.getElementById('se2-btn-sync-alt').addEventListener('click', function () {
    var count = se2WithDoc(function (doc) {
      var n = 0;
      doc.querySelectorAll('figure').forEach(function (fig) {
        var img = fig.querySelector('img');
        var caption = fig.querySelector('figcaption');
        if (img && caption && caption.textContent.trim() !== '') {
          img.alt = caption.textContent.trim();
          n++;
        }
      });
      return n;
    });
    if (typeof count === 'number') se2Toast('Đã đồng bộ thuộc tính ALT theo Caption cho ' + count + ' ảnh!');
  });
  document.getElementById('se2-btn-bold-headings').addEventListener('click', function () {
    var count = se2WithDoc(function (doc) {
      var headings = doc.querySelectorAll('h2, h3, h4, h5, h6');
      headings.forEach(function (h) { h.style.fontWeight = 'bold'; });
      return headings.length;
    });
    if (typeof count === 'number') se2Toast('Đã thiết lập in đậm cho ' + count + ' thẻ Heading!');
  });
  document.getElementById('se2-btn-sample').addEventListener('click', function () {
    var s = se2Sample();
    document.getElementById('se2-keywords').value = s.keywords;
    document.getElementById('se2-domain').value = s.domain;
    document.getElementById('se2-title').value = s.title;
    document.getElementById('se2-slug').value = s.slug;
    document.getElementById('se2-desc').value = s.desc;
    if (!useFallback) {
      var ed = window.tinymce && window.tinymce.activeEditor;
      if (ed) ed.setContent(s.html);
    } else {
      fallbackBox.value = s.html;
    }
    se2Counters();
    se2RunChecks();
    se2Toast('Đã nạp bài mẫu về máy lọc nước — xem điểm số và checklist bên phải.');
  });
  document.getElementById('se2-btn-copy').addEventListener('click', function () {
    var html = '';
    if (!useFallback) {
      var ed = window.tinymce && window.tinymce.activeEditor;
      html = ed ? ed.getContent() : '';
    } else {
      html = fallbackBox.value;
    }
    if (!html.trim()) { se2Toast('Chưa có nội dung để sao chép.'); return; }
    function done() { se2Toast('Đã sao chép HTML bài viết!'); }
    function fail() { se2Toast('Không sao chép được — trình duyệt đã chặn quyền clipboard.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(html).then(done, fail);
    } else {
      var ta = document.createElement('textarea');
      ta.value = html;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { fail(); }
      document.body.removeChild(ta);
    }
  });
  document.getElementById('se2-btn-download').addEventListener('click', function () {
    var html = '';
    if (!useFallback) {
      var ed = window.tinymce && window.tinymce.activeEditor;
      html = ed ? ed.getContent() : '';
    } else {
      html = fallbackBox.value;
    }
    if (!html.trim()) { se2Toast('Chưa có nội dung để tải xuống.'); return; }
    var slug = document.getElementById('se2-slug').value.trim() || 'bai-viet-seo';
    var blob = new Blob(['<!DOCTYPE html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<title>' + document.getElementById('se2-title').value + '</title>\n</head>\n<body>\n' + html + '\n</body>\n</html>'], { type: 'text/html;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = se2Slugify(slug) + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    se2Toast('Đã tải file ' + a.download + '!');
  });
  document.getElementById('se2-btn-reset').addEventListener('click', function () {
    ['se2-keywords', 'se2-domain', 'se2-title', 'se2-slug', 'se2-desc'].forEach(function (id) { document.getElementById(id).value = ''; });
    if (!useFallback) {
      var ed = window.tinymce && window.tinymce.activeEditor;
      if (ed) ed.setContent('');
    } else {
      fallbackBox.value = '';
    }
    se2Counters();
    se2RunChecks();
    se2Toast('Đã làm mới toàn bộ nội dung.');
  });
  document.getElementById('se2-btn-copy-results').addEventListener('click', function () {
    var doc = se2GetDoc();
    if (!doc) { se2Toast('Trình soạn thảo chưa sẵn sàng, hãy thử lại sau giây lát.'); return; }
    var res = se2Analyze(doc, se2Fields());
    var lines = ['Điểm SEO: ' + res.score + '/100', 'Số từ: ' + res.stats.words + ' · Mật độ Key: ' + res.stats.density.toFixed(2) + '% · Ảnh: ' + res.stats.images + ' · Liên kết: ' + res.stats.links];
    res.checks.forEach(function (c) {
      var mark = c.status === 'pass' ? '[Đạt]' : c.status === 'fail' ? '[Chưa đạt]' : c.status === 'warn' ? '[Cảnh báo]' : '[Chưa đánh giá]';
      lines.push(mark + ' ' + c.text);
    });
    var text = lines.join('\n');
    function done() { se2Toast('Đã sao chép kết quả đánh giá!'); }
    function fail() { se2Toast('Không sao chép được — trình duyệt đã chặn quyền clipboard.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
    else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { fail(); }
      document.body.removeChild(ta);
    }
  });
});

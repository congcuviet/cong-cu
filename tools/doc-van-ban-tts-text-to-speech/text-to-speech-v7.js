(function () {
  'use strict';

  var HF_BASE = 'https://huggingface.co/pnnbao-ump/VieNeu-TTS-v3-Nano/resolve/main/';
  var MODEL_BASE = (typeof window !== 'undefined' && window.VIENEU_MODEL_BASE) || HF_BASE;
  var ORT_VERSION = '1.20.1';
  var ORT_BASE = (typeof window !== 'undefined' && window.VIENEU_ORT_BASE) ||
    'https://cdn.jsdelivr.net/npm/onnxruntime-web@' + ORT_VERSION + '/dist/';
  var CANONICAL_ASSET_BASE = 'https://congcuviet.com/wp-content/themes/bricks-child/cong-cu/';
  var ASSET_BASE = (function () {

    if (typeof window !== 'undefined' && window.VIENEU_ASSET_BASE) return window.VIENEU_ASSET_BASE;

    function baseFromScriptSrc(src) {
      if (!src) return null;
      var clean = src.split(/[?#]/)[0];
      if (!/\/text-to-speech-v7\.js$/.test(clean)) return null;
      var base = clean.replace(/[^/]*$/, '');
      if (!/\/cong-cu\/$/.test(base)) return null;
      return base;
    }
    var s = document.currentScript;
    var b = baseFromScriptSrc(s && s.src);
    if (b) return b;
    var all = document.getElementsByTagName('script');
    for (var i = all.length - 1; i >= 0; i--) {
      b = baseFromScriptSrc(all[i].src || '');
      if (b) return b;
    }
    return CANONICAL_ASSET_BASE;
  })();

  var MODEL_FILES = [
    { name: 'config.json', bytes: 2927 },
    { name: 'text_encoder.onnx', bytes: 26519943 },
    { name: 'duration_predictor.onnx', bytes: 727809 },
    { name: 'vector_estimator.onnx', bytes: 155132418 },
    { name: 'codec_decoder.onnx', bytes: 99319941 }
  ];
  var MODEL_TOTAL_BYTES = 281703038;
  var CACHE_NAME = 'vieneu-nano-models-v1';
  var MODEL_KEY = 'vieneu-tts-model-v1';
  var TURBO_HF_BASE = 'https://huggingface.co/pnnbao-ump/VieNeu-TTS-v3-Turbo/resolve/main/onnx_int8/';
  var TURBO_CODEC_BASE = 'https://huggingface.co/OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX/resolve/main/';
  var TURBO_CACHE_NAME = 'vieneu-turbo-models-v1';
  var TURBO_SR = 48000;
  var TURBO_FILES = [
    { name: 'vieneu_prefill.onnx', bytes: 1090823, base: TURBO_HF_BASE },
    { name: 'vieneu_decode_step.onnx', bytes: 1062040, base: TURBO_HF_BASE },
    { name: 'vieneu_acoustic_cached.onnx', bytes: 7207223, base: TURBO_HF_BASE },
    { name: 'vieneu_backbone_shared.data', bytes: 103891968, base: TURBO_HF_BASE },
    { name: 'vieneu_v3_heads.npz', bytes: 52219622, base: TURBO_HF_BASE },
    { name: 'moss_audio_tokenizer_decode_full.onnx', bytes: 681902, base: TURBO_CODEC_BASE },
    { name: 'moss_audio_tokenizer_decode_shared.data', bytes: 44198912, base: TURBO_CODEC_BASE }
  ];
  var TURBO_TOTAL_BYTES = 210352490;
  var MAX_CHARS = 1000;
  var CFG_SCALE = 3.0;

(function (global) {
  'use strict';

  var DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroup(v, isLeading) {
    var h = Math.floor(v / 100);
    var rem = v % 100;
    var t = Math.floor(rem / 10);
    var u = rem % 10;
    var parts = [];
    if (h > 0) parts.push(DIGITS[h] + ' trăm');
    else if (!isLeading) parts.push('không trăm');
    if (rem === 0) return parts.join(' ');
    if (t === 0) {

      if (h > 0 || !isLeading) parts.push('lẻ ' + DIGITS[u]);
      else parts.push(DIGITS[u]);
    } else if (t === 1) {
      var s = 'mười';
      if (u === 5) s += ' lăm';
      else if (u > 0) s += ' ' + DIGITS[u];
      parts.push(s);
    } else {
      var s2 = DIGITS[t] + ' mươi';
      if (u === 1) s2 += ' mốt';
      else if (u === 4) s2 += ' tư';
      else if (u === 5) s2 += ' lăm';
      else if (u > 0) s2 += ' ' + DIGITS[u];
      parts.push(s2);
    }
    return parts.join(' ');
  }

  function intToWords(n) {
    if (n === 0) return 'không';
    var groups = [];
    var x = n;
    while (x > 0) { groups.push(x % 1000); x = Math.floor(x / 1000); }
    var units = ['', ' nghìn', ' triệu', ' tỷ'];
    var out = [];
    for (var i = groups.length - 1; i >= 0; i--) {
      var g = groups[i];
      if (g === 0) continue;
      var isLeading = (i === groups.length - 1);
      out.push(readGroup(g, isLeading) + units[i]);
    }
    return out.join(' ');
  }

  function digitWords(s) {
    return s.split('').map(function (d) { return DIGITS[parseInt(d, 10)]; }).join(' ');
  }

  function numberToWords(token) {
    var dotDec = /^(\d+)\.(\d{1,2})$/.exec(token);
    if (dotDec) return intToWords(parseInt(dotDec[1], 10)) + ' chấm ' + digitWords(dotDec[2]);
    var decPart = null;
    var intPart = token;
    var ci = token.indexOf(',');
    if (ci >= 0) { intPart = token.slice(0, ci); decPart = token.slice(ci + 1); }
    var digits = intPart.replace(/\./g, '');
    if (!/^\d+$/.test(digits)) return token;
    var n = parseInt(digits, 10);
    if (n > 999999999999) return token;
    var words = intToWords(n);
    if (decPart !== null) {
      if (!/^\d+$/.test(decPart)) return token;
      words += ' phẩy ' + digitWords(decPart);
    }
    return words;
  }

  var NUM_SRC = '\\d{1,3}(?:\\.\\d{3})+(?:,\\d+)?|\\d+\\.\\d{1,2}(?!\\d)|\\d+(?:,\\d+)?';
  var NUM_RE = new RegExp('(?<![\\p{L}\\d])(' + NUM_SRC + ')(?![\\p{L}\\d])', 'gu');

  var LETTER_NAMES = { a: 'a', b: 'bê', c: 'xê', d: 'đê', e: 'e', f: 'ép', g: 'gờ', h: 'hắt', i: 'i', j: 'giây', k: 'ca', l: 'lờ', m: 'mờ', n: 'nờ', o: 'o', p: 'pê', q: 'quy', r: 'rờ', s: 'ét', t: 'tê', u: 'u', v: 'vê', w: 'vê kép', x: 'ích', y: 'i dài', z: 'dét' };

  function spellLetters(s) {
    return s.split('').map(function (ch) { return LETTER_NAMES[ch.toLowerCase()] || ch; }).join(' ');
  }

  var LOANWORDS = { internet: 'in tơ nét', facebook: 'phây búc', youtube: 'du túp', iphone: 'ai phôn', ipad: 'ai pát', email: 'i meo', online: 'on lai', google: 'gu gồ', wifi: 'oai phai', covid: 'cô vít', zalo: 'da lô', tiktok: 'tíc tóc', laptop: 'láp tóp', shopee: 'sóp pi' };
  var LOAN_RE = new RegExp('(?<![\\p{L}\\d])(' + Object.keys(LOANWORDS).join('|') + ')(?![\\p{L}\\d])', 'giu');

  var TITLES = { 'ThS': 'thạc sĩ', 'PGS': 'phó giáo sư', 'TS': 'tiến sĩ', 'GS': 'giáo sư', 'TP': 'thành phố' };
  var TITLE_RE = new RegExp('(?<![\\p{L}])(' + Object.keys(TITLES).join('|') + ')\\.?(?![\\p{L}])', 'gu');

  var ABBREVS = { 'UBND': 'ủy ban nhân dân', 'HĐND': 'hội đồng nhân dân', 'THPT': 'trung học phổ thông', 'THCS': 'trung học cơ sở', 'NXB': 'nhà xuất bản', 'ĐH': 'đại học', 'BV': 'bệnh viện' };
  var ABBREV_RE = new RegExp('(?<![\\p{L}])(' + Object.keys(ABBREVS).join('|') + ')(?![\\p{L}])', 'gu');

  var UNITS = { 'km/h': 'ki lô mét trên giờ', 'kwh': 'ki lô oát giờ', 'km': 'ki lô mét', 'kg': 'ki lô gam', 'cm': 'xăng ti mét', 'mm': 'mi li mét', 'm²': 'mét vuông', 'm2': 'mét vuông', 'ml': 'mi li lít', 'ha': 'héc ta', 'gb': 'ghi', 'mb': 'mê', 'm': 'mét' };
  var UNIT_RE = new RegExp('(' + NUM_SRC + ')\\s*(km/h|kWh|km|kg|cm|mm|m²|m2|ml|ha|GB|MB|m)(?![\\p{L}])', 'giu');

  function expandNumbersInText(text) {
    var out = String(text);
    out = out.replace(/TP\.\s*HCM/gi, 'thành phố Hồ Chí Minh');
    out = out.replace(/COVID-19/gi, 'cô vít mười chín');
    out = out.replace(/(?<![\d/])(ngày\s+)?(\d{1,2})\/(\d{1,2})\/(\d{4})(?!\d)/g, function (m, pre, d, mo, y) {
      var dv = parseInt(d, 10), mv = parseInt(mo, 10);
      if (!dv || !mv || dv > 31 || mv > 12) return m;
      return 'ngày ' + intToWords(dv) + ' tháng ' + intToWords(mv) + ' năm ' + intToWords(parseInt(y, 10));
    });
    out = out.replace(/(?<![\d/])(ngày\s+)?(\d{1,2})\/(\d{1,2})(?![\d/])/g, function (m, pre, d, mo) {
      var dv = parseInt(d, 10), mv = parseInt(mo, 10);
      if (!dv || !mv || dv > 31 || mv > 12) return m;
      return 'ngày ' + intToWords(dv) + ' tháng ' + intToWords(mv);
    });
    out = out.replace(/(?<![\d])0\d{9}(?![\d])|(?<![\d])0\d{3}[ .-]\d{3}[ .-]\d{3}(?![\d])|(?<![\d])0\d{3}[ .-]\d{4}[ .-]\d{3}(?![\d])|(?<![\d])0\d{2}[ .-]\d{4}[ .-]\d{3}(?![\d])/g, function (m) {
      return digitWords(m.replace(/[ .-]/g, ''));
    });
    out = out.replace(/(?<![\d:])(\d{1,2}):(\d{2})(?![\d:])/g, function (m, h, mi) {
      var hv = parseInt(h, 10), mv = parseInt(mi, 10);
      if (hv > 23 || mv > 59) return m;
      var s = intToWords(hv) + ' giờ';
      if (mv > 0) s += ' ' + intToWords(mv) + ' phút';
      return s;
    });
    out = out.replace(new RegExp('(' + NUM_SRC + ')\\s*[-–]\\s*(' + NUM_SRC + ')(\\s*%)?', 'gu'), function (m, a, b, pct) {
      return numberToWords(a) + ' đến ' + numberToWords(b) + (pct ? ' phần trăm' : '');
    });
    out = out.replace(new RegExp('(^|[\\s(])-\\s*(' + NUM_SRC + ')(\\s*%)?', 'gmu'), function (m, pre, a, pct) {
      return pre + 'âm ' + numberToWords(a) + (pct ? ' phần trăm' : '');
    });
    out = out.replace(new RegExp('(' + NUM_SRC + ')\\s*%', 'gu'), function (m, a) {
      return numberToWords(a) + ' phần trăm';
    });
    out = out.replace(new RegExp('(' + NUM_SRC + ')\\s*đ(?![\\p{L}])', 'gu'), function (m, a) {
      return numberToWords(a) + ' đồng';
    });
    out = out.replace(UNIT_RE, function (m, a, u) {
      return numberToWords(a) + ' ' + UNITS[u.toLowerCase()];
    });
    out = out.replace(/°\s*C/g, ' độ xê').replace(/°/g, ' độ ');
    out = out.replace(/độ\s*C(?![\p{L}])/gu, 'độ xê');
    out = out.replace(TITLE_RE, function (m, k) { return TITLES[k]; });
    out = out.replace(ABBREV_RE, function (m, k) { return ABBREVS[k]; });
    out = out.replace(LOAN_RE, function (m) { return LOANWORDS[m.toLowerCase()]; });
    out = out.replace(/(?<![\p{L}\d])([A-Za-z]+\d+|\d+[A-Za-z]+)(?![\p{L}\d])/gu, function (m) {
      var runs = m.match(/[A-Za-z]+|\d+/g) || [];
      return runs.map(function (r) {
        if (/^\d+$/.test(r)) return r.length <= 12 ? numberToWords(r) : digitWords(r);
        return LOANWORDS[r.toLowerCase()] || spellLetters(r);
      }).join(' ');
    });
    out = out.replace(/(?<![\p{L}\d])[A-Z]{2,6}(?![\p{L}\d])/g, function (m) { return spellLetters(m); });
    out = out.replace(NUM_RE, function (m) { return numberToWords(m); });
    return out;
  }

  var api = { intToWords: intToWords, numberToWords: numberToWords, expandNumbersInText: expandNumbersInText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.VieneuNum = api;
})(typeof window !== 'undefined' ? window : globalThis);

(function (global) {
  'use strict';

  const TONE_MARKS = {
    '̀': '2',
    '́': 'ɜ',
    '̉': '4',
    '̃': '5',
    '̣': '6',
  };

  const ONSETS = [
    ['ngh', 'ŋ'], ['ng', 'ŋ'], ['nh', 'ɲ'], ['ch', 'tʃ'], ['gh', 'ɡ'],
    ['gi', 'z'], ['kh', 'x'], ['ph', 'f'], ['qu', 'kw'], ['th', 't'],
    ['tr', 'tʃ'], ['b', 'b'], ['c', 'k'], ['d', 'z'], ['đ', 'ɗ'],
    ['g', 'ɣ'], ['h', 'h'], ['k', 'k'], ['l', 'l'], ['m', 'm'],
    ['n', 'n'], ['p', 'p'], ['r', 'ɹ'], ['s', 's'], ['t', 't̪'],
    ['v', 'v'], ['x', 's'],
  ];

  const NUCLEI = {
    'a': ['aː', ''], 'ă': ['a', ''], 'â': ['ə', ''], 'e': ['ɛ', ''],
    'ê': ['e', ''], 'i': ['i', ''], 'o': ['ɔ', ''], 'ô': ['o', ''],
    'ơ': ['əː', ''], 'u': ['u', ''], 'ư': ['y', ''], 'y': ['i', ''],
    'ai': ['aː', 'j'], 'ao': ['aː', 'w'], 'au': ['aː', 'w'], 'âu': ['ə', 'w'],
    'ay': ['a', 'j'], 'ây': ['əɪ', ''], 'eo': ['ɛ', 'w'], 'êu': ['e1', 'w'],
    'ia': ['iə', ''], 'iu': ['i', 'w'], 'oi': ['ɔ', 'j'], 'ôi': ['o', 'j'],
    'ơi': ['əː', 'j'], 'ua': ['uə', ''], 'ui': ['u', 'j'], 'ưa': ['yə', ''],
    'ưi': ['y', 'j'], 'ưu': ['y', 'w'], 'iê': ['iɛ', ''], 'uô': ['uə', ''],
    'ươ': ['yə', ''], 'iêu': ['iɛ', 'w'], 'ươi': ['yə', 'j'], 'uôi': ['uə', 'j'],
  };

  const RHYME_CODA = {
    'a':  { m: 'aːm', ng: 'aːŋ', n: 'æn', p: 'æp', t: 'æt̪', c: 'æk', nh: 'e-ɲ', ch: 'e-c' },
    'ă':  { m: 'am', n: 'an', ng: 'aŋ', p: 'ap', t: 'at̪' },
    'â':  { m: 'əm', n: 'ən', ng: 'əŋ', p: 'əp', t: 'ət̪' },
    'e':  { m: 'ɛm', n: 'ɛn', ng: 'ɛŋ', nh: 'ɛɲ', p: 'ɛp', t: 'ɛt̪' },
    'ê':  { m: 'em', n: 'en', nh: 'eɲ', ng: 'eŋ', p: 'ep', t: 'et̪', ch: 'ec' },
    'i':  { m: 'im', n: 'in', nh: 'iɲ', p: 'ip', t: 'it̪', ch: 'ic', ng: 'iŋ' },
    'iê': { m: 'iɛm', n: 'iɛn', ng: 'iɛŋ', p: 'iɛp', c: 'iɛc', t: 'iɛt̪' },
    'o':  { m: 'ɔm', n: 'ʌn', ng: 'ɔŋ', p: 'ɔp', t: 'ɔt̪', c: 'ɔk' },
    'ô':  { m: 'om', n: 'on', ng: 'oŋ', p: 'op', t: 'ot̪', c: 'ok' },
    'ơ':  { m: 'əːm', n: 'əːn', p: 'əːp', t: 'əːt̪', ng: 'əːŋ' },
    'u':  { m: 'um', n: 'un', ng: 'uŋ', p: 'up', t: 'ut̪', c: 'uk' },
    'ư':  { m: 'ym', n: 'yn', ng: 'yŋ', p: 'yp', t: 'yt̪' },
    'uô': { n: 'uən', ng: 'uəŋ', c: 'uəc', t: 'uət̪' },
    'ươ': { n: 'yən', ng: 'yəŋ', c: 'yək', t: 'yət̪' },
    'ia': { ng: 'iəŋ', n: 'iən' },
    'ua': { n: 'uən', ng: 'uəŋ', t: 'uət̪' },
    'ưa': { n: 'yən', ng: 'yəŋ', t: 'yət̪' },
  };
  const CODA_IPA = { m: 'm', n: 'n', ng: 'ŋ', nh: 'ɲ', p: 'p', t: 't̪', c: 'k', ch: 'c' };

  const CODA_STRIP = { ng: 1, nh: 1, ch: 1, m: 1, n: 1, p: 1, t: 2, c: 1 };

  function splitTone(word) {
    const nfd = word.normalize('NFD');
    let tone = '';
    let base = '';
    for (const ch of nfd) {
      if (TONE_MARKS[ch] !== undefined) { tone = TONE_MARKS[ch]; continue; }
      if (/\p{M}/u.test(ch) && tone === 'KEEP') {   }
      base += ch;
    }
    return { base: base.normalize('NFC'), tone };
  }

  function parseSyllable(raw) {
    const { base, tone } = splitTone(raw.toLowerCase());
    let s = base;
    if (!s) return '';

    if (s[0] === 'y') s = 'i' + s.slice(1);

    let onset = '', rest = s;
    for (const [orth, ipa] of ONSETS) {
      if (s.startsWith(orth) && s.length > orth.length) {

        if (orth === 'gi' && s.length === 2) break;
        onset = ipa; rest = s.slice(orth.length);
        break;
      }
    }
    if (s === 'gi') { onset = 'z'; rest = 'i'; }

    if (onset === 'kw' && rest.startsWith('ô')) rest = 'uô' + rest.slice(1);

    let medial = '';
    if (onset) {
      if (/^uyê/.test(rest)) { medial = 'w'; rest = 'iê' + rest.slice(3); }
      else if (/^uya/.test(rest)) { medial = 'w'; rest = 'ia' + rest.slice(3); }
      else if (/^(uy)(?![êa])/.test(rest)) { medial = 'w'; rest = 'i' + rest.slice(2); }
      else if (/^u[ăâê]/.test(rest)) { medial = 'w'; rest = rest.slice(1); }
      else if (/^o[aeă]/.test(rest)) { medial = 'w'; rest = rest.slice(1); }
    }

    let coda = '';
    for (const c of ['ng', 'nh', 'ch', 'm', 'n', 'p', 't', 'c']) {
      if (rest.endsWith(c) && rest.length > c.length && /[aăâeêioôơuưy]/.test(rest.slice(0, -c.length))) {
        coda = c; rest = rest.slice(0, -c.length);
        break;
      }
    }

    let core, glide = '';
    if (coda && rest === 'a' && ['n', 't', 'c', 'p'].includes(coda) && tone && tone !== 'ɜ') {

      return onset + medial + 'ˈ' + 'aː' + tone + CODA_IPA[coda];
    }
    if (coda && RHYME_CODA[rest] && RHYME_CODA[rest][coda]) {

      const full = RHYME_CODA[rest][coda];
      const strip = CODA_STRIP[coda];
      const core = full.slice(0, full.length - strip);
      return onset + medial + 'ˈ' + core + tone + full.slice(full.length - strip);
    }
    if (!coda && NUCLEI[rest]) {
      [core, glide] = NUCLEI[rest];
      if (tone === 'ɜ' && glide && core === 'aː') core = 'a';
    } else if (coda) {

      const nuc = NUCLEI[rest.replace(/[^aăâeêioôơuưy]/g, '')];
      core = nuc ? nuc[0] : rest;
      return onset + medial + 'ˈ' + core + tone + (CODA_IPA[coda] || '');
    } else {

      core = '';
      for (const ch of rest) core += NUCLEI[ch] ? NUCLEI[ch][0] : '';
      if (!core) return '';
    }
    return onset + medial + 'ˈ' + core + tone + glide;
  }

  const FUNC_WORDS = new Set(['là', 'đang', 'và', 'mỗi', 'ở', 'của', 'sẽ', 'đã', 'bị', 'thì', 'mà', 'với', 'cho', 'khi']);

  function phonemize(text) {
    const out = [];
    const tokens = text.replace(/\s+/g, ' ').trim().split(' ');
    for (const tok of tokens) {
      if (!tok) continue;
      if (/^<\|emotion_\d\|>$/.test(tok)) { out.push(tok); continue; }
      const m = tok.match(/^([^,.!?;:]*)([,.!?;:]?)$/);
      if (!m) {
        for (const piece of tok.split(/([,.!?;:])/)) {
          if (!piece) continue;
          if (/^[,.!?;:]$/.test(piece)) { out.push(piece); continue; }
          const sub = parseSyllable(piece);
          if (sub) out.push(sub);
        }
        continue;
      }
      const word = m[1], punct = m[2] || '';
      let ph = word ? parseSyllable(word) : '';
      if (ph && FUNC_WORDS.has(word.toLowerCase())) ph = ph.replace('ˈ', 'ˌ');
      if (ph) out.push(ph + punct);
      else if (punct) out.push(punct);
    }
    let s = out.join(' ');
    if (s && !/[.!?…]$/.test(s)) s += '.';
    return s;
  }

  function chunkText(text) {
    const norm = text.replace(/\s+/g, ' ').trim();
    if (!norm) return [];
    const sentences = norm.match(/[^.!?…]+[.!?…]*\s*/g) || [norm];
    const chunks = [];
    for (const sent of sentences) {
      const t = sent.trim();
      if (!t) continue;
      if (t.length <= 90) { chunks.push(t); continue; }
      let buf = '';
      for (const part of t.split(/(?<=,)(?= )/)) {
        if ((buf + part).length > 90 && buf) { chunks.push(buf.trim()); buf = ''; }
        buf += part;
      }
      if (buf.trim()) chunks.push(buf.trim());
    }
    return chunks;
  }

  const api = { phonemize, chunkText, parseSyllable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.VNG2P = api;
})(typeof window !== 'undefined' ? window : globalThis);

const TONE_MARK_CHARS = { '\u0300': 2, '\u0301': 5, '\u0309': 4, '\u0303': 3, '\u0323': 6 };
const TONE_OUT = { 1: '', 2: '2', 3: '5', 4: '4', 5: 'ɜ', 6: '6' };

function stripTone(word) {
  const nfd = word.normalize('NFD');
  let tone = 1, out = '';
  for (const ch of nfd) {
    if (TONE_MARK_CHARS[ch]) tone = TONE_MARK_CHARS[ch];
    else out += ch;
  }
  return [out.normalize('NFC'), tone];
}

const ONSETS = ['ngh', 'ng', 'gh', 'gi', 'kh', 'nh', 'ph', 'qu', 'th', 'tr', 'ch',
  'b', 'c', 'd', 'đ', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'x'];
const ONSET_IPA = {
  '': '', b: 'b', c: 'k', ch: 'tʃ', d: 'z', 'đ': 'ɗ', g: 'ɣ', gh: 'ɣ', gi: 'z',
  h: 'h', k: 'k', kh: 'x', l: 'l', m: 'm', n: 'n', ng: 'ŋ', ngh: 'ŋ', nh: 'ɲ',
  p: 'p', ph: 'f', q: 'k', qu: 'kw', r: 'ɹ', s: 's', t: 't̪', th: 't', tr: 'tʃ', v: 'v', x: 's',
};

const NUC = {
  'a': [0, 'aːT', 0, 'm n ng p t c nh ch'], 'ă': [0, 'aT', 0, 'm n ng p t c'],
  'â': [0, 'əT', 0, 'm n ng p t c'], 'e': [0, 'ɛT', 0, 'm n ng p t c nh ch'],
  'ê': [0, 'eT', 0, 'm n ng p t nh ch'], 'i': [0, 'iT', 0, 'm n p t nh ch'],
  'o': [0, 'ɔT', 0, 'm n ng p t c'], 'ô': [0, 'oT', 0, 'm n ng p t c'],
  'ơ': [0, 'əːT', 0, 'm n p t'], 'u': [0, 'uT', 0, 'm n ng p t c'],
  'ư': [0, 'yT', 0, 'm n ng p t c'],
  'ai': [0, 'aːTj', 0, ''], 'ao': [0, 'aːTw', 0, ''], 'au': [0, 'aTw', 0, ''],
  'ay': [0, 'aTj', 0, ''], 'âu': [0, 'əTw', 1, ''], 'ây': [0, 'əɪT', 0, ''],
  'eo': [0, 'ɛTw', 0, ''], 'êu': [0, 'eTw', 1, ''],
  'ia': [0, 'iəT', 0, ''], 'iê': [0, 'iɛT', 0, 'm n ng p t c'],
  'iu': [0, 'iTw', 0, ''], 'oi': [0, 'ɔTj', 0, ''], 'ôi': [0, 'oTj', 0, ''],
  'ơi': [0, 'əːTj', 0, ''], 'ua': [0, 'uəT', 0, ''],
  'uô': [0, 'uəT', 0, 'm n ng p t c'], 'ưa': [0, 'yəT', 0, ''],
  'ươ': [0, 'yəT', 0, 'm n ng p t c'], 'ui': [0, 'uTj', 0, ''],
  'ưi': [0, 'yTj', 0, ''], 'ưu': [0, 'iTw', 0, ''],
  'iêu': [0, 'iɛTw', 0, ''], 'oa': [1, 'aːT', 0, 'm n ng p t c nh ch'],
  'oe': [1, 'ɛT', 0, 'm n'], 'oeo': [1, 'ɛTw', 0, ''],
  'oai': [1, 'aːTj', 0, ''], 'oay': [1, 'aTj', 0, ''],
  'uôi': [0, 'uəTj', 0, ''], 'ươi': [0, 'yəTj', 0, ''], 'ươu': [0, 'yəTw', 0, ''],
  'uy': [1, 'iT', 0, 'nh ch t'], 'uê': [1, 'eT', 0, 'nh ch'],
  'uâ': [1, 'əT', 0, 'n t'], 'uây': [1, 'əɪT', 0, ''], 'uyê': [1, 'iɛT', 0, 'n t'],
  'oă': [1, 'aT', 0, 'm n ng t c'], 'uơ': [1, 'əːT', 0, ''],
};
const NUC_ORDER = Object.keys(NUC).sort((a, b) => b.length - a.length);
const STOP_CODAS = new Set(['p', 't', 'c', 'ch']);

function codaOut(nucleus, coda) {
  if (coda === 'm') return 'm';
  if (coda === 'n') return 'n';
  if (coda === 'ng') return 'ŋ';
  if (coda === 'p') return 'p';
  if (coda === 't') return 't̪';
  if (coda === 'c') return (nucleus === 'o' || nucleus === 'ô') ? 'k' : 'c';
  return '';
}

function parseRime(rime) {
  for (const nuc of NUC_ORDER) {
    if (!rime.startsWith(nuc)) continue;
    const coda = rime.slice(nuc.length);
    const allowed = NUC[nuc][3] ? NUC[nuc][3].split(' ') : [];
    if (coda === '' || allowed.includes(coda)) return { nucleus: nuc, coda };
  }
  return null;
}

function parseBase(base) {
  let onset = '', rime = base;
  if (base.startsWith('qu') && base.length > 2) {
    const prB = parseRime(base.slice(1));
    if (prB && (prB.nucleus === 'uô' || prB.nucleus === 'u' || prB.nucleus === 'ươ' || prB.nucleus === 'ưa')) {
      return { onset: 'q', nucleus: prB.nucleus, coda: prB.coda };
    }
    const restA = base.slice(2);
    if (restA.startsWith('y') && restA.length > 1) {
      const prG = parseRime('u' + restA);
      if (prG) return { onset: 'qu', nucleus: prG.nucleus, coda: prG.coda };
    }
    const prA = parseRime(restA);
    if (prA) return { onset: 'qu', nucleus: prA.nucleus, coda: prA.coda };
    if (restA === 'y') return { onset: 'qu', nucleus: 'i', coda: '' };
    return null;
  }
  if (base === 'y') return { onset: '', nucleus: 'i', coda: '' };
  if (base.startsWith('gi')) {
    const rest = base.slice(2);
    onset = 'gi';
    if (rest === '') rime = 'i';
    else if (rest.startsWith('ê')) rime = 'i' + rest;
    else if ('aăâeêioôơuưy'.includes(rest[0])) rime = rest;
    else rime = 'i' + rest;
  } else if (base.startsWith('y')) {
    if (base === 'y') { onset = ''; rime = 'i'; }
    else if (base[1] === 'ê') { onset = ''; rime = 'i' + base.slice(1); }
    else return null;
  } else {
    for (const o of ONSETS) {
      if (o && base.startsWith(o) && base.length > o.length) { onset = o; rime = base.slice(o.length); break; }
    }
    if ((onset === 'gh' || onset === 'ngh') && !'eêi'.includes(rime[0])) return null;
    if ((onset === 'g' || onset === 'ng') && 'eêi'.includes(rime[0])) return null;
    if (onset === 'c' && 'eêi'.includes(rime[0])) return null;
  }
  if (rime === 'y') return { onset, nucleus: 'i', coda: '' };
  const pr = parseRime(rime);
  if (pr) return { onset, nucleus: pr.nucleus, coda: pr.coda };
  return null;
}

function parseWord(wordLower) {
  const [base, tone] = stripTone(wordLower);
  const p = parseBase(base);
  if (!p) return null;
  if (STOP_CODAS.has(p.coda) && tone !== 5 && tone !== 6) return null;
  p.tone = tone;
  return p;
}

const SEC_SET = new Set(('và là của các được không với đến đã cho những từ để như khoảng còn đang ' +
  'khi bị nhưng phải tới chưa hoặc con mà mỗi lúc sẽ vẫn nếu thì nên cái vì dù mọi bởi chẳng dẫu').split(' '));

const WORD_EXCEPTIONS = { 'giêng': 'zˈiɛ1ŋ', 'on': 'ˈəːn' };

function phonemizeSyllable(wordLower) {
  if (WORD_EXCEPTIONS[wordLower]) return WORD_EXCEPTIONS[wordLower];
  const p = parseWord(wordLower);
  if (!p) return null;
  const [glide, tpl0, tone1one] = NUC[p.nucleus];
  let tpl = tpl0, coda = '';
  if (p.coda === 'nh' || p.coda === 'ch') {
    const oc = p.coda === 'nh' ? 'ɲ' : 'c';
    if (p.nucleus === 'a' || p.nucleus === 'oa') tpl = 'e-T';
    else if (p.nucleus === 'ê' || p.nucleus === 'e' || p.nucleus === 'uê') tpl = 'eT';
    else if (p.nucleus === 'i' || p.nucleus === 'uy') tpl = 'iT';
    coda = oc;
  } else {
    coda = codaOut(p.nucleus, p.coda);
  }
  let marker = TONE_OUT[p.tone];
  if (p.tone === 1 && tone1one) marker = '1';
  const body = tpl.replace('T', marker) + coda;
  let onsetPart = ONSET_IPA[p.onset];
  if (glide && p.onset !== 'qu') onsetPart += 'w';
  const stress = SEC_SET.has(wordLower) ? 'ˌ' : 'ˈ';
  return onsetPart + stress + body;
}

const FOREIGN = {
  android: 'ˈændɹɔɪd', app: 'ˈæp', asean: 'ˈæsiən', audio: 'ˈɔːdɪˌoʊ', beta: 'bˈeɪɾə',
  bit: 'bˈɪt', bug: 'bˈʌɡ', byte: 'bˈaɪt', chat: 'tʃˈæt', cloud: 'klˈaʊd', code: 'kˈoʊd',
  comment: 'kˈɑːmɛnt', corona: 'kɔːɹˈoʊnə', covid: 'kˈɑːvɪd', data: 'dˈeɪɾə',
  deadline: 'dˈɛdlaɪn', delta: 'dˈɛltə', email: 'ˈiːmeɪl', facebook: 'fˈeɪsbʊk', gen: 'dʒˈɛn',
  gene: 'dʒˈiːn', dollar: 'dˈɑːlɚ', of: 'ʌv', east: 'ˈiːst', asian: 'ˈeɪʒən',
  bureau: 'bjˈʊɹɹoʊ', science: 'sˈaɪəns', amazon: 'ˈæmɐzˌɑːn', java: 'dʒˈɑːvə',
  metro: 'mˈɛtɹoʊ', hotline: 'hˈɑːtlaɪn', mekong: 'mˈɛkɑːŋ', oxi: 'ˈɑːksi',
  machine: 'məʃˈiːn', top: 'tˈɑːp',
  fanpage: 'fˈænpeɪdʒ', file: 'fˈaɪl', follow: 'fˈɑːloʊ', game: 'ɡˈeɪm',
  google: 'ɡˈuːɡəl', grab: 'ɡɹˈæb', hack: 'hˈæk', hello: 'həlˈoʊ', hot: 'hˈɑːt',
  internet: 'ˈɪntɚnˌɛt', iphone: 'ˈaɪfoʊn', laptop: 'lˈæptɑːp', lazada: 'læzˈɑːdə',
  leader: 'lˈiːdɚ', like: 'lˈaɪk', live: 'lˈaɪv', livestream: 'lˈaɪvstɹiːm',
  marketing: 'mˈɑːɹkɪɾɪŋ', mobifone: 'mˈɑːbɪfˌoʊn', momo: 'mˈoʊmoʊ', nasa: 'nˈæsɐ',
  offline: 'ˈɔflaɪn', ok: 'ˌoʊkˈeɪ', omega: 'oʊmˈeɪɡə', online: 'ˈɑːnlaɪn',
  pixel: 'pˈɪksəl', play: 'plˈeɪ', sale: 'sˈeɪl', samsung: 'sˈæmsʌŋ',
  server: 'sˈɜːvɚ', share: 'ʃˈɛɹ', ship: 'ʃˈɪp', shopee: 'ʃˈoʊpiː', show: 'ʃˈoʊ',
  sigma: 'sˈɪɡmə', stream: 'stɹˈiːm', team: 'tˈiːm', test: 'tˈɛst', tiktok: 'tˈɪktɑːk',
  trend: 'tɹˈɛnd', unesco: 'ʌnˈɛskoʊ', unicef: 'jˈuːnɪsˌɛf', video: 'vˈɪdɪoʊ',
  viettel: 'vˌiːətˈəl', view: 'vjˈuː', vinaphone: 'vˈɪnɐfˌoʊn', web: 'wˈɛb',
  website: 'wˈɛbsaɪt', who: 'hˈuː', wifi: 'wˈaɪfaɪ', youtube: 'jˈuːtuːb',
  zalo: 'zˈɑːloʊ', zoom: 'zˈuːm', banana: 'bɐnˈænə', canada: 'kˈænədə',
  dalat: 'dˈælæt', honda: 'hˈɑːndə', toyota: 'tɔɪˈoʊɾə', yamaha: 'jˈɑːməhˌɑː',
  suzuki: 'suːzˈuːki', mazda: 'mˈæzdə', vinfast: 'vˈɪnfæst', halong: 'hˈeɪlɔŋ',
  yoga: 'jˈoʊɡə', soda: 'sˈoʊdə', coca: 'kˈoʊkə', pepsi: 'pˈɛpsi', pasta: 'pˈɑːstə',
  pizza: 'pˈiːtsə', zebra: 'zˈiːbɹə', nova: 'nˈoʊvə', lava: 'lˈɑːvə', saga: 'sˈɑːɡə',
  mama: 'mˈɑːmɐ', papa: 'pˈɑːpə', baba: 'bˈɑːbə', nana: 'nˈɑːnə', tata: 'tˈɑːɾə',
  dada: 'dˈɑːdə', kaka: 'kˈɑːkə', sala: 'sˈɑːlə', para: 'pˈæɹə', mala: 'mˈɑːlə',
  supa: 'sˈuːpə', kapa: 'kˈɑːpə', tana: 'tˈɑːnə', dala: 'dˈɑːlə', saigon: 'saɪɡˈɑːn',
  hanoi: 'hænˈɔɪ', danang: 'dˈænæŋ', cantho: 'kˈænθoʊ', haiphong: 'hˈeɪfɑːŋ',
  vietnam: 'vˌiːətnˈɑːm', viet: 'vˌiːət', sapa: 'sˈɑːpə', alpha: 'ˈælfə',
};

const EN_LETTER = {
  a: 'eɪ', b: 'biː', c: 'siː', d: 'diː', e: 'iː', f: 'ɛf', g: 'dʒiː', h: 'eɪtʃ',
  i: 'aɪ', j: 'dʒeɪ', k: 'keɪ', l: 'ɛl', m: 'ɛm', n: 'ɛn', o: 'oʊ', p: 'piː',
  q: 'kjuː', r: 'ɑːɹ', s: 'ɛs', t: 'tiː', u: 'juː', v: 'viː', w: 'dʌbəljuː',
  x: 'ɛks', y: 'waɪ', z: 'ziː',
};
const VN_LETTER_WORD = {
  a: 'a', b: 'bê', c: 'xê', d: 'đê', e: 'e', f: 'ép', g: 'gờ', h: 'hắt', i: 'i',
  j: 'giây', k: 'ca', l: 'lờ', m: 'mờ', n: 'nờ', o: 'o', p: 'pê', q: 'quy',
  r: 'rờ', s: 'ét', t: 'tê', u: 'u', v: 'vê', x: 'ích', y: 'i',
};
const IPA_VOWEL_START = 'aeiouæɑɒɔəɛɪʊʌ';

function spellEnglish(word) {
  const letters = [...word.toLowerCase()].filter(c => EN_LETTER[c]);
  if (!letters.length) return word;
  return letters.map((c, i) => {
    const name = EN_LETTER[c];
    let k = 0;
    while (k < name.length && !IPA_VOWEL_START.includes(name[k])) k++;
    const mark = letters.length === 1 || i === letters.length - 1 ? 'ˈ' : 'ˌ';
    return name.slice(0, k) + mark + name.slice(k);
  }).join('');
}

const isLowerCh = (c) => c.toLowerCase() === c && c.toUpperCase() !== c;
const isUpperCh = (c) => c.toUpperCase() === c && c.toLowerCase() !== c;

const VN_MARK_RE = /[ăâêôơưđ]/;

function tryVnSplit(lower) {
  const chars = [...lower];
  const rec = (start, parts) => {
    if (start === chars.length) return parts.length >= 2 ? parts : null;
    if (parts.length >= 3) return null;
    for (let i = start + 1; i <= chars.length; i++) {
      const head = chars.slice(start, i).join('');
      const ph = phonemizeSyllable(head);
      if (ph) {
        const rest = rec(i, [...parts, ph]);
        if (rest) return rest;
      }
    }
    return null;
  };
  const r = rec(0, []);
  return r ? r.join(' ') : null;
}

function phonemizeLetters(run0) {
  const run = run0.replace(/\p{No}/gu, '');
  if (!run) return '';
  const subs = [''];
  for (const ch of run) {
    const prev = subs[subs.length - 1].slice(-1);
    if (prev && isLowerCh(prev) && isUpperCh(ch)) subs.push(ch);
    else subs[subs.length - 1] += ch;
  }
  if (subs.length > 1) return subs.map(phonemizeLetters).join(' ');
  const lower = run.toLowerCase();
  const vn = phonemizeSyllable(lower);
  if (vn) return vn;
  if (FOREIGN[lower]) return FOREIGN[lower];
  if ((VN_MARK_RE.test(lower) || stripTone(lower)[0] !== lower) && lower.length >= 3) {
    const split = tryVnSplit(lower);
    if (split) return split;
  }
  const isCaps = run.length >= 2 && run === run.toUpperCase() && run !== run.toLowerCase();
  if (isCaps) return spellEnglish(run);
  if (run.length === 1) {
    const c = lower;
    if (c === 'đ') return 'đ';
    const enName = () => {
      const name = EN_LETTER[c];
      let k = 0;
      while (k < name.length && !IPA_VOWEL_START.includes(name[k])) k++;
      return name.slice(0, k) + 'ˈ' + name.slice(k);
    };
    if (run === c) {
      if (VN_LETTER_WORD[c]) return phonemizeSyllable(VN_LETTER_WORD[c]) || enName();
      if (EN_LETTER[c]) return enName();
      return run;
    }
    if (c === 'a') return 'ˈaː';
    if (EN_LETTER[c]) return enName();
    if (VN_LETTER_WORD[c]) return phonemizeSyllable(VN_LETTER_WORD[c]) || run;
    return run;
  }
  return spellEnglish(run);
}

function phonemizeWord(word) {
  const dotParts = word.split('.');
  const outs = [];
  for (const part of dotParts) {
    if (!part) continue;
    const runs = part.split(/(?<=\D)(?=\d)|(?<=\d)(?=\D)/u).filter(Boolean);
    const seg = [];
    for (const r of runs) {
      if (/^\d+$/.test(r)) seg.push(r);
      else seg.push(r.split(/['’]/).filter(Boolean).map(phonemizeLetters).join(' '));
    }
    outs.push(seg.join(' '));
  }
  return outs.join('. ');
}

const TOKEN_RE = /([\p{L}\p{N}]+(?:[.'’][\p{L}\p{N}]+)*)|(\.\.\.|…)|([,.!?;:])|(\s+)|(.)/gu;

function phonemize(text) {
  const out = [];
  const attach = (ch) => {
    if (!out.length) return;
    if (ch === '.' && out[out.length - 1].endsWith('.')) return;
    out[out.length - 1] += ch;
  };
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(text)) !== null) {
    if (m[1]) out.push(phonemizeWord(m[1]));
    else if (m[2]) attach('.');
    else if (m[3]) {
      const c = m[3];
      attach(c === ':' || c === ';' ? ',' : c);
    }
  }
  return out.join(' ');
}

function puncNorm(text) {
  let t = String(text == null ? '' : text).trim();
  if (!t) return t;
  const nWords = t.split(/\s+/).filter(Boolean).length;
  if (nWords < 5) {
    t = t.replace(/[.!?…]+$/, '.');
  }
  if (!/[,.!?]$/.test(t)) t += '.';
  return t;
}

let TOK = null;
function setTokenizerData(data) {
  const vocab = data.vocab;
  const merges = data.merges.map((pr, i) => [Array.isArray(pr) ? pr.join(' ') : pr, i]);
  const rank = new Map(merges);
  const b2u = {};
  const bs = [];
  for (let i = 33; i <= 126; i++) bs.push(i);
  for (let i = 161; i <= 172; i++) bs.push(i);
  for (let i = 174; i <= 255; i++) bs.push(i);
  const cs = [...bs];
  let n = 0;
  for (let b = 0; b < 256; b++) if (!bs.includes(b)) { bs.push(b); cs.push(256 + n++); }
  bs.forEach((b, i) => { b2u[b] = String.fromCharCode(cs[i]); });
  TOK = { vocab, rank, b2u };
}
const PRETOK_RE = /'s|'t|'re|'ve|'m|'ll|'d|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+/giu;
const ENC = new TextEncoder();

function bpeEncode(text) {
  if (!TOK) throw new Error('tokenizer data not set');
  const s = String(text).normalize('NFC');
  const ids = [];
  PRETOK_RE.lastIndex = 0;
  let m;
  while ((m = PRETOK_RE.exec(s)) !== null) {
    const pre = m[0];
    if (!pre) continue;
    let word = [...ENC.encode(pre)].map(b => TOK.b2u[b]);
    while (word.length > 1) {
      let best = null, bestRank = Infinity;
      for (let i = 0; i < word.length - 1; i++) {
        const r = TOK.rank.get(word[i] + ' ' + word[i + 1]);
        if (r !== undefined && r < bestRank) { bestRank = r; best = i; }
      }
      if (best === null) break;
      const merged = word[best] + word[best + 1];
      const nw = [];
      let i = 0;
      while (i < word.length) {
        if (i < word.length - 1 && word[i] === word[best] && word[i + 1] === word[best + 1]) {
          nw.push(merged); i += 2;
        } else { nw.push(word[i]); i += 1; }
      }
      word = nw;
    }
    for (const tok of word) {
      const id = TOK.vocab[tok];
      if (id === undefined) throw new Error('token not in vocab: ' + JSON.stringify(tok));
      ids.push(id);
    }
  }
  return ids;
}

const IPA_VOWELS = new Set('aeiouyæɐɑɒɔəɘɛɜɤɯɵøœʉʊʌɪɨɚɝᵻᵿ');
const MARKUP_RE = /<\|emotion_\d+\|>|<\/?en>/g;

function syllableCount(phonemes) {
  const stripped = String(phonemes || '').replace(MARKUP_RE, '');
  let total = 0;
  for (const tok of stripped.split(/\s+/)) {
    if (!tok) continue;
    let groups = 0, inV = false, consSeen = true;
    for (const ch of tok) {
      if (IPA_VOWELS.has(ch)) {
        if (!inV && consSeen) groups += 1;
        inV = true; consSeen = false;
      } else if (ch === 'ː' || ch === 'ˈ' || ch === 'ˌ' || /\d/.test(ch)) {
        if ((ch === 'ˈ' || ch === 'ˌ') && groups > 0) { inV = false; consSeen = true; }
        else inV = false;
      } else {
        inV = false; consSeen = true;
      }
    }
    if (/[^\W\d_]/.test(tok)) total += Math.max(1, groups);
  }
  return total;
}

function isCueOnly(phonemes) {
  const ph = String(phonemes || '');
  return ph.includes('<|emotion_') && !/[^\W\d_]/.test(ph.replace(MARKUP_RE, ''));
}

function maxExpectedFrames(phonemes) {
  const stripped = String(phonemes || '').replace(MARKUP_RE, '');
  const effLen = [...stripped].length;
  let cap = 24 + Math.ceil(2.0 * effLen);
  if (isCueOnly(phonemes)) return Math.min(cap, 13);
  if (!String(phonemes || '').includes('<|emotion_')) {
    const syl = Math.max(1, syllableCount(phonemes));
    if (syl <= 4 && effLen <= 24 * syl) cap = Math.min(cap, 13 + 5 * (syl - 1));
  }
  return cap;
}

function countSpeechBursts(wav, sr) {
  const hop = Math.max(1, Math.floor(sr * 0.010));
  const n = Math.floor(wav.length / hop);
  if (n === 0) return 0;
  const env = new Float64Array(n);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < hop; j++) { const v = wav[i * hop + j]; s += v * v; }
    env[i] = Math.sqrt(s / hop);
    if (env[i] > peak) peak = env[i];
  }
  if (peak <= 1e-6) return 0;
  const thresh = peak * Math.pow(10, -18.0 / 20);
  const minGap = Math.max(1, Math.floor(60 / 10));
  const minLen = Math.max(1, Math.floor(30 / 10));
  let bursts = 0, start = -1, lastOn = -1;
  const flush = () => { if (start >= 0 && (lastOn - start + 1) >= minLen) bursts += 1; };
  for (let i = 0; i < n; i++) {
    if (env[i] > thresh) {
      if (start < 0) start = i;
      else if (i - lastOn > minGap) { flush(); start = i; }
      lastOn = i;
    }
  }
  flush();
  return bursts;
}

function babbleSuspect(wav, sr, phonemes, capFrames, nFrames) {
  if (nFrames === undefined || nFrames === null) {
    nFrames = Math.round(wav.length / (sr / 12.5));
  }
  if (isCueOnly(phonemes)) return [nFrames >= capFrames - 1, 0, 0, nFrames];
  const syl = syllableCount(phonemes);
  if (syl === 0 || syl > 3 || String(phonemes || '').includes('<|emotion_')) {
    return [false, syl, 0, 0];
  }
  const bursts = countSpeechBursts(wav, sr);
  const hitCap = syl <= 2 && nFrames >= capFrames - 1;
  return [bursts > syl || hitCap, syl, bursts, nFrames];
}

function babblePrefer(newT, oldT) {
  if (newT[0] !== oldT[0]) return !newT[0];
  return newT[2] < oldT[2] || (newT[2] === oldT[2] && newT[3] < oldT[3]);
}

const SeaG2P = {
  phonemize, puncNorm, bpeEncode, setTokenizerData,
  syllableCount, maxExpectedFrames, countSpeechBursts, babbleSuspect, babblePrefer,
  _parseWord: parseWord, _phonemizeSyllable: phonemizeSyllable,
};
if (typeof module !== 'undefined' && module.exports) module.exports = SeaG2P;
if (typeof globalThis !== 'undefined') globalThis.SeaG2P = SeaG2P;

  SeaG2P.setTokenizerData({"vocab": {"<|pad|>": 0, "<|bos|>": 1, "<|eos|>": 2, "<|TEXT_PROMPT_START|>": 3, "<|TEXT_PROMPT_END|>": 4, "<|SPEECH_GENERATION_START|>": 5, "<|SPEECH_GENERATION_END|>": 6, "<|audio_ref_slot|>": 7, "<|emotion_0|>": 8, "<|emotion_1|>": 9, "<|emotion_2|>": 10, "<|emotion_3|>": 11, "<|emotion_4|>": 12, "<|emotion_5|>": 13, "<|emotion_6|>": 14, "<|emotion_7|>": 15, "<|style_0|>": 16, "<|style_1|>": 17, "<|style_2|>": 18, "<|style_3|>": 19, "<|style_4|>": 20, "<|style_5|>": 21, "<|style_6|>": 22, "<|style_7|>": 23, "<|style_8|>": 24, "<|style_9|>": 25, "<|reserved_0|>": 26, "<|reserved_1|>": 27, "<|reserved_2|>": 28, "<|reserved_3|>": 29, "<|reserved_4|>": 30, "<|reserved_5|>": 31, "<|reserved_6|>": 32, "<|reserved_7|>": 33, "<|reserved_8|>": 34, "<|reserved_9|>": 35, "<|reserved_10|>": 36, "<|reserved_11|>": 37, "<|reserved_12|>": 38, "<|reserved_13|>": 39, "<|reserved_14|>": 40, "<|reserved_15|>": 41, "<|reserved_16|>": 42, "<|unk|>": 43, "Ā": 44, "ā": 45, "Ă": 46, "ă": 47, "Ą": 48, "ą": 49, "Ć": 50, "ć": 51, "Ĉ": 52, "ĉ": 53, "Ċ": 54, "ċ": 55, "Č": 56, "č": 57, "Ď": 58, "ď": 59, "Đ": 60, "đ": 61, "Ē": 62, "ē": 63, "Ĕ": 64, "ĕ": 65, "Ė": 66, "ė": 67, "Ę": 68, "ę": 69, "Ě": 70, "ě": 71, "Ĝ": 72, "ĝ": 73, "Ğ": 74, "ğ": 75, "Ġ": 76, "!": 77, "\"": 78, "#": 79, "$": 80, "%": 81, "&": 82, "'": 83, "(": 84, ")": 85, "*": 86, "+": 87, ",": 88, "-": 89, ".": 90, "/": 91, "0": 92, "1": 93, "2": 94, "3": 95, "4": 96, "5": 97, "6": 98, "7": 99, "8": 100, "9": 101, ":": 102, ";": 103, "<": 104, "=": 105, ">": 106, "?": 107, "@": 108, "A": 109, "B": 110, "C": 111, "D": 112, "E": 113, "F": 114, "G": 115, "H": 116, "I": 117, "J": 118, "K": 119, "L": 120, "M": 121, "N": 122, "O": 123, "P": 124, "Q": 125, "R": 126, "S": 127, "T": 128, "U": 129, "V": 130, "W": 131, "X": 132, "Y": 133, "Z": 134, "[": 135, "\\": 136, "]": 137, "^": 138, "_": 139, "`": 140, "a": 141, "b": 142, "c": 143, "d": 144, "e": 145, "f": 146, "g": 147, "h": 148, "i": 149, "j": 150, "k": 151, "l": 152, "m": 153, "n": 154, "o": 155, "p": 156, "q": 157, "r": 158, "s": 159, "t": 160, "u": 161, "v": 162, "w": 163, "x": 164, "y": 165, "z": 166, "{": 167, "|": 168, "}": 169, "~": 170, "ġ": 171, "Ģ": 172, "ģ": 173, "Ĥ": 174, "ĥ": 175, "Ħ": 176, "ħ": 177, "Ĩ": 178, "ĩ": 179, "Ī": 180, "ī": 181, "Ĭ": 182, "ĭ": 183, "Į": 184, "į": 185, "İ": 186, "ı": 187, "Ĳ": 188, "ĳ": 189, "Ĵ": 190, "ĵ": 191, "Ķ": 192, "ķ": 193, "ĸ": 194, "Ĺ": 195, "ĺ": 196, "Ļ": 197, "ļ": 198, "Ľ": 199, "ľ": 200, "Ŀ": 201, "ŀ": 202, "Ł": 203, "ł": 204, "¡": 205, "¢": 206, "£": 207, "¤": 208, "¥": 209, "¦": 210, "§": 211, "¨": 212, "©": 213, "ª": 214, "«": 215, "¬": 216, "Ń": 217, "®": 218, "¯": 219, "°": 220, "±": 221, "²": 222, "³": 223, "´": 224, "µ": 225, "¶": 226, "·": 227, "¸": 228, "¹": 229, "º": 230, "»": 231, "¼": 232, "½": 233, "¾": 234, "¿": 235, "À": 236, "Á": 237, "Â": 238, "Ã": 239, "Ä": 240, "Å": 241, "Æ": 242, "Ç": 243, "È": 244, "É": 245, "Ê": 246, "Ë": 247, "Ì": 248, "Í": 249, "Î": 250, "Ï": 251, "Ð": 252, "Ñ": 253, "Ò": 254, "Ó": 255, "Ô": 256, "Õ": 257, "Ö": 258, "×": 259, "Ø": 260, "Ù": 261, "Ú": 262, "Û": 263, "Ü": 264, "Ý": 265, "Þ": 266, "ß": 267, "à": 268, "á": 269, "â": 270, "ã": 271, "ä": 272, "å": 273, "æ": 274, "ç": 275, "è": 276, "é": 277, "ê": 278, "ë": 279, "ì": 280, "í": 281, "î": 282, "ï": 283, "ð": 284, "ñ": 285, "ò": 286, "ó": 287, "ô": 288, "õ": 289, "ö": 290, "÷": 291, "ø": 292, "ù": 293, "ú": 294, "û": 295, "ü": 296, "ý": 297, "þ": 298, "ÿ": 299, "Ã¦": 300, "Ã§": 301, "Ã°": 302, "Åĭ": 303, "ÉĲ": 304, "Éĳ": 305, "ÉĶ": 306, "ÉĹ": 307, "ÉĻ": 308, "Éļ": 309, "ÉĽ": 310, "Éľ": 311, "É¡": 312, "É£": 313, "Éª": 314, "É¬": 315, "É²": 316, "É¹": 317, "É¾": 318, "Êĥ": 319, "ÊĬ": 320, "ÊĮ": 321, "ÊĴ": 322, "ÊĶ": 323, "Ê²": 324, "ËĪ": 325, "ËĮ": 326, "ËĲ": 327, "Ìĥ": 328, "Ì©": 329, "Ìª": 330, "Î¸": 331, "áµ": 332, "áµ»": 333, "ĠĠ": 334, "Ġ-": 335, "Ġ1": 336, "Ġ2": 337, "Ġ4": 338, "Ġ5": 339, "Ġ6": 340, "Ġa": 341, "Ġb": 342, "Ġc": 343, "Ġd": 344, "Ġe": 345, "Ġf": 346, "Ġh": 347, "Ġi": 348, "Ġj": 349, "Ġk": 350, "Ġl": 351, "Ġm": 352, "Ġn": 353, "Ġo": 354, "Ġp": 355, "Ġr": 356, "Ġs": 357, "Ġt": 358, "Ġu": 359, "Ġv": 360, "Ġw": 361, "Ġx": 362, "Ġy": 363, "Ġz": 364, "ĠÃ": 365, "ĠÃ¦": 366, "ĠÃ§": 367, "ĠÃ°": 368, "ĠÅ": 369, "ĠÅĭ": 370, "ĠÉ": 371, "ĠÉĲ": 372, "ĠÉĳ": 373, "ĠÉĶ": 374, "ĠÉĹ": 375, "ĠÉĻ": 376, "ĠÉļ": 377, "ĠÉĽ": 378, "ĠÉľ": 379, "ĠÉ¡": 380, "ĠÉ£": 381, "ĠÉª": 382, "ĠÉ¬": 383, "ĠÉ²": 384, "ĠÉ¹": 385, "ĠÉ¾": 386, "ĠÊ": 387, "ĠÊĥ": 388, "ĠÊĬ": 389, "ĠÊĮ": 390, "ĠÊĴ": 391, "ĠÊĶ": 392, "ĠÊ²": 393, "ĠË": 394, "ĠËĪ": 395, "ĠËĮ": 396, "ĠËĲ": 397, "ĠÌ": 398, "ĠÌĥ": 399, "ĠÌ©": 400, "ĠÌª": 401, "ĠÎ": 402, "ĠÎ¸": 403, "Ġá": 404, "Ġáµ": 405, "Ġáµ»": 406, "Ġ.": 407, "Ġ?": 408, "Ġ!": 409, "Ġ,": 410, "Ġ;": 411, "Ġ:": 412, "Ġ(": 413, "Ġ)": 414, "Ġ[": 415, "Ġ]": 416, "Ġ{": 417, "Ġ}": 418}, "merges": [["Ã", "¦"], ["Ã", "§"], ["Ã", "°"], ["Å", "ĭ"], ["É", "Ĳ"], ["É", "ĳ"], ["É", "Ķ"], ["É", "Ĺ"], ["É", "Ļ"], ["É", "ļ"], ["É", "Ľ"], ["É", "ľ"], ["É", "¡"], ["É", "£"], ["É", "ª"], ["É", "¬"], ["É", "²"], ["É", "¹"], ["É", "¾"], ["Ê", "ĥ"], ["Ê", "Ĭ"], ["Ê", "Į"], ["Ê", "Ĵ"], ["Ê", "Ķ"], ["Ê", "²"], ["Ë", "Ī"], ["Ë", "Į"], ["Ë", "Ĳ"], ["Ì", "ĥ"], ["Ì", "©"], ["Ì", "ª"], ["Î", "¸"], ["á", "µ"], ["áµ", "»"], ["Ġ", "Ġ"], ["Ġ", "-"], ["Ġ", "1"], ["Ġ", "2"], ["Ġ", "4"], ["Ġ", "5"], ["Ġ", "6"], ["Ġ", "a"], ["Ġ", "b"], ["Ġ", "c"], ["Ġ", "d"], ["Ġ", "e"], ["Ġ", "f"], ["Ġ", "h"], ["Ġ", "i"], ["Ġ", "j"], ["Ġ", "k"], ["Ġ", "l"], ["Ġ", "m"], ["Ġ", "n"], ["Ġ", "o"], ["Ġ", "p"], ["Ġ", "r"], ["Ġ", "s"], ["Ġ", "t"], ["Ġ", "u"], ["Ġ", "v"], ["Ġ", "w"], ["Ġ", "x"], ["Ġ", "y"], ["Ġ", "z"], ["Ġ", "Ã"], ["ĠÃ", "¦"], ["ĠÃ", "§"], ["ĠÃ", "°"], ["Ġ", "Å"], ["ĠÅ", "ĭ"], ["Ġ", "É"], ["ĠÉ", "Ĳ"], ["ĠÉ", "ĳ"], ["ĠÉ", "Ķ"], ["ĠÉ", "Ĺ"], ["ĠÉ", "Ļ"], ["ĠÉ", "ļ"], ["ĠÉ", "Ľ"], ["ĠÉ", "ľ"], ["ĠÉ", "¡"], ["ĠÉ", "£"], ["ĠÉ", "ª"], ["ĠÉ", "¬"], ["ĠÉ", "²"], ["ĠÉ", "¹"], ["ĠÉ", "¾"], ["Ġ", "Ê"], ["ĠÊ", "ĥ"], ["ĠÊ", "Ĭ"], ["ĠÊ", "Į"], ["ĠÊ", "Ĵ"], ["ĠÊ", "Ķ"], ["ĠÊ", "²"], ["Ġ", "Ë"], ["ĠË", "Ī"], ["ĠË", "Į"], ["ĠË", "Ĳ"], ["Ġ", "Ì"], ["ĠÌ", "ĥ"], ["ĠÌ", "©"], ["ĠÌ", "ª"], ["Ġ", "Î"], ["ĠÎ", "¸"], ["Ġ", "á"], ["Ġá", "µ"], ["Ġáµ", "»"], ["Ġ", "."], ["Ġ", "?"], ["Ġ", "!"], ["Ġ", ","], ["Ġ", ";"], ["Ġ", ":"], ["Ġ", "("], ["Ġ", ")"], ["Ġ", "["], ["Ġ", "]"], ["Ġ", "{"], ["Ġ", "}"]]});
  var TURBO_VOICES = {"Adam": {"spk": [-1.770656, 0.497364, -0.467793, -2.082047, -0.55403, -0.497283, -0.871806, -1.02709, 2.329756, 1.667218, -1.267769, -0.498034, 0.486377, -1.90565, 0.718104, -0.713923, 2.002273, 0.693922, -0.725536, -1.178252, -0.895324, 0.398592, -1.148619, -0.456878, 0.470529, -0.658481, -2.498503, 3.26116, -1.221448, 1.503378, -1.146847, -2.889395, -0.226437, 1.003896, 0.981348, -2.636789, -1.413231, -0.472976, -0.468203, 0.313642, 1.584917, -0.943796, -2.10711, -0.206685, -1.681977, -0.576112, -0.138986, -0.301311, 1.946705, -0.301825, 1.891776, -2.193617, 1.670899, -1.214495, 0.514146, 0.015949, -2.268144, -1.724514, -0.470611, -0.11219, -2.516495, 0.44835, 1.906451, -0.757452, -0.808891, -0.322006, 0.611592, -0.582809, -2.271022, -0.566869, 0.423442, 1.996592, 0.338595, 2.151216, -1.967046, -0.721982, -1.109523, -0.388847, 0.622272, 2.8694, -0.134289, -0.111113, -0.478369, 2.319557, -0.370131, -1.313952, 2.906957, -0.844933, -1.698043, -1.883594, 1.045595, 2.592227, -0.735441, -0.839139, 0.60333, -0.956581, -0.02425, -0.671477, 0.566141, 0.562157, -0.261444, -0.985955, -0.025054, 0.687918, -0.209019, -0.087646, 1.672774, 2.603172, 0.766749, -0.291534, -0.677814, -0.868423, -1.999006, -1.002792, -0.264971, -0.925968, -0.456731, -0.486614, -2.098444, 1.020349, -0.567507, 0.505477, 1.70867, -0.968539, -2.018709, -2.516929, -0.757431, -0.818415, -0.838704, -1.884688, 0.86193, -1.138541, -0.999386, 0.968893, -1.54353, 0.141133, -0.267949, -0.961274, 0.238812, -2.151841, 2.336493, -1.814238, 0.884447, -1.444194, 0.596479, -0.304833, 0.031456, 2.654637, 0.747787, -4.19134, -1.868777, 1.715893, 2.286133, -0.315341, -0.214043, -0.995247, -1.979436, 0.878809, 0.082326, 0.170369, 0.364159, -0.096087, 0.777502, -0.497048, 0.315641, 1.57479, 1.420882, -0.336504, -1.540743, -0.845776, -0.483186, 2.066775, 1.978924, -2.002677, -0.799426, -0.110077, 0.928476, -1.293124, -0.69507, 0.359766, -0.926599, -4.399827, 0.179233, 0.638049, -1.043825, 0.971792, -0.05363, -2.269881, -0.059724, -0.472825, 0.699049, -0.486237], "codes": [[654, 410, 460, 536, 206, 259, 193, 32, 40, 987, 273, 193, 797, 266, 859, 857], [2, 76, 352, 181, 209, 514, 538, 679, 966, 212, 757, 297, 874, 536, 52, 993], [55, 346, 850, 1012, 265, 786, 850, 316, 725, 436, 618, 450, 580, 337, 181, 665], [77, 805, 823, 821, 773, 43, 519, 969, 66, 643, 703, 904, 760, 148, 884, 812], [777, 272, 531, 731, 952, 836, 525, 260, 1003, 93, 73, 402, 432, 126, 159, 201], [686, 83, 898, 351, 474, 954, 604, 43, 106, 781, 24, 584, 731, 382, 802, 416], [526, 611, 308, 219, 711, 442, 16, 132, 788, 835, 229, 437, 247, 664, 409, 546], [401, 709, 817, 918, 476, 425, 931, 592, 713, 343, 53, 536, 831, 1016, 330, 162], [402, 366, 131, 859, 616, 674, 340, 184, 615, 619, 444, 713, 824, 725, 701, 899], [756, 1009, 69, 907, 923, 520, 381, 948, 744, 780, 402, 289, 313, 119, 595, 509], [935, 824, 637, 276, 670, 278, 385, 224, 202, 281, 509, 930, 916, 284, 62, 941], [775, 100, 330, 639, 923, 241, 900, 805, 79, 382, 978, 195, 804, 986, 1002, 770], [275, 189, 842, 982, 581, 23, 836, 1000, 393, 180, 967, 1002, 608, 131, 918, 208], [671, 750, 180, 186, 713, 314, 452, 631, 412, 905, 792, 758, 732, 350, 145, 859], [44, 133, 407, 953, 456, 646, 17, 944, 231, 233, 246, 132, 313, 605, 603, 948], [684, 868, 237, 398, 235, 594, 611, 708, 776, 638, 513, 942, 360, 657, 952, 172], [496, 763, 448, 129, 1023, 749, 897, 670, 370, 497, 577, 570, 296, 309, 807, 616], [53, 288, 791, 755, 95, 491, 335, 516, 227, 36, 92, 663, 309, 612, 99, 711], [933, 275, 279, 223, 677, 454, 491, 270, 1019, 709, 1001, 563, 244, 544, 754, 8], [407, 97, 567, 555, 471, 762, 748, 700, 873, 775, 1008, 146, 663, 191, 884, 251], [880, 274, 748, 457, 303, 313, 436, 604, 649, 292, 216, 256, 15, 907, 754, 192], [50, 447, 557, 459, 38, 343, 149, 157, 545, 377, 782, 296, 396, 782, 554, 978], [914, 295, 162, 833, 740, 837, 848, 530, 979, 365, 661, 446, 805, 288, 790, 1014], [728, 474, 844, 379, 407, 115, 984, 114, 480, 821, 412, 544, 783, 277, 830, 314], [534, 130, 520, 314, 944, 534, 334, 540, 710, 306, 759, 499, 805, 87, 736, 52], [610, 521, 337, 25, 756, 710, 174, 118, 948, 429, 176, 500, 52, 461, 458, 714], [824, 942, 532, 228, 885, 561, 543, 21, 634, 130, 864, 378, 811, 149, 115, 942], [16, 698, 565, 176, 114, 122, 978, 323, 708, 84, 162, 639, 695, 954, 636, 140], [541, 251, 227, 701, 828, 52, 894, 248, 0, 358, 62, 871, 956, 841, 230, 967], [498, 94, 829, 585, 46, 1011, 513, 80, 742, 690, 782, 471, 340, 244, 98, 710], [808, 504, 41, 49, 77, 230, 691, 812, 662, 197, 869, 593, 76, 573, 114, 592], [259, 498, 878, 947, 146, 220, 738, 718, 369, 726, 129, 338, 134, 110, 398, 836], [577, 563, 582, 268, 985, 776, 857, 650, 809, 819, 1003, 599, 944, 498, 754, 23], [278, 75, 1012, 422, 965, 812, 218, 68, 310, 894, 316, 568, 652, 219, 74, 813], [299, 214, 990, 285, 568, 996, 581, 870, 293, 411, 713, 369, 964, 455, 122, 695], [475, 651, 916, 334, 133, 896, 681, 529, 265, 517, 551, 446, 403, 599, 915, 925], [62, 334, 96, 895, 188, 12, 371, 452, 139, 533, 720, 572, 726, 723, 797, 1003], [547, 633, 1006, 823, 379, 679, 953, 982, 52, 527, 951, 199, 443, 924, 795, 844]]}, "\u00c1i H\u00e2n": {"spk": [-0.112659, -0.051582, 0.214848, 0.094172, 0.270227, 0.062808, -1.303218, 0.99537, -0.031135, 1.777979, -0.139751, -0.079764, 0.716638, -0.008929, -0.008548, -2.476501, 2.028574, 0.347309, 1.135935, 1.201626, -0.159513, -3.026906, 0.259689, 0.328289, -1.782796, -0.469591, 0.404458, -0.213296, 0.266669, -0.27525, 0.33333, -0.80921, -0.104499, 0.340194, 1.511352, -1.438073, -1.717834, 0.673494, 0.532493, -1.087528, 0.988729, -1.289196, 0.004823, 0.62209, 0.135446, 1.387176, 1.956089, 0.62339, -0.645124, 1.160657, -0.316371, 0.818887, 0.169965, 0.235035, -0.556796, -0.346051, 1.228644, -0.040974, 1.704538, 0.370754, -2.207142, 0.982222, 0.799689, -0.765393, -0.707473, 0.396671, -0.398013, 0.473332, 0.287029, 0.319512, 0.710763, 0.895862, 0.176154, -0.266967, -1.368309, -1.082071, -0.65768, -1.086716, 1.039343, -0.212945, -0.161583, -0.574327, -0.163009, 0.390273, 0.535588, -0.149684, -0.016423, -1.661325, -1.123099, -1.587097, 0.042056, 0.368502, -0.729061, 0.328572, -0.349418, -1.467656, 0.379569, 0.868768, 0.802611, 0.117939, -1.340866, 1.21023, 0.809058, 0.820812, -0.902596, -0.45992, -0.521594, 0.367125, 0.232724, -0.317114, -1.2081, 0.668303, 0.680597, -1.222851, -0.07103, 1.067145, -1.383987, -0.147081, 0.485676, -0.631811, -0.806171, 0.424382, 1.017592, -0.73938, 0.987951, 0.047906, -0.806675, 1.046248, 0.378673, -0.372516, 0.622237, 0.190118, -0.564432, -1.256125, 0.47587, -0.303116, 0.751314, -2.228178, 0.63858, -0.585359, -0.130076, -0.870543, -0.063763, -1.678654, 1.100059, -1.488695, 0.665477, 0.638676, 0.62678, -0.576743, -1.480494, 0.505649, 0.129823, 0.577755, 0.29822, -1.048082, -0.779327, 0.159488, 1.540954, 2.103624, -0.385686, -1.321576, 0.146861, -0.26271, -1.06035, -0.565817, 1.91283, 0.339018, -0.85539, -0.189992, 0.454406, -1.172706, 0.296708, 0.368433, 0.047018, 0.674745, 0.368221, 0.549902, -0.073065, -0.153015, 0.094671, -0.48561, -0.273178, 1.653631, -0.238695, -0.102097, -0.859995, -1.661146, 0.552681, -0.243244, -0.207739, -0.065759], "codes": [[339, 540, 631, 35, 277, 272, 749, 117, 340, 74, 220, 166, 536, 668, 534, 467], [867, 729, 691, 155, 790, 763, 102, 161, 625, 554, 519, 577, 895, 995, 400, 548], [371, 548, 264, 823, 454, 69, 279, 442, 696, 600, 747, 592, 85, 901, 291, 1009], [439, 59, 237, 152, 788, 213, 822, 506, 987, 417, 364, 862, 556, 940, 78, 340], [499, 657, 546, 938, 36, 138, 69, 289, 974, 929, 368, 68, 934, 778, 951, 432], [587, 524, 581, 1016, 661, 1002, 281, 623, 488, 882, 172, 62, 130, 666, 383, 867], [847, 342, 304, 196, 451, 589, 395, 456, 697, 560, 356, 747, 667, 831, 233, 980], [198, 643, 798, 950, 360, 1011, 413, 161, 204, 244, 363, 454, 736, 792, 441, 761], [390, 516, 252, 187, 409, 794, 635, 376, 115, 186, 803, 729, 591, 419, 102, 768], [681, 347, 509, 213, 673, 336, 914, 301, 801, 579, 896, 978, 80, 582, 630, 576], [914, 246, 648, 846, 705, 752, 501, 789, 716, 740, 146, 716, 361, 519, 465, 232], [390, 699, 1000, 499, 1005, 545, 452, 481, 716, 607, 650, 207, 720, 993, 92, 574], [498, 438, 393, 833, 977, 184, 739, 575, 424, 1016, 46, 95, 802, 851, 266, 599], [1001, 412, 417, 553, 608, 194, 741, 977, 821, 518, 113, 732, 527, 223, 754, 1020], [13, 524, 773, 159, 449, 885, 548, 896, 724, 868, 967, 959, 918, 144, 41, 462], [724, 783, 685, 830, 643, 131, 142, 186, 418, 204, 405, 661, 153, 125, 829, 689], [105, 970, 646, 696, 908, 78, 335, 954, 539, 881, 517, 884, 878, 407, 135, 387], [394, 819, 873, 1001, 425, 346, 212, 471, 120, 148, 72, 401, 523, 742, 911, 991], [777, 1008, 959, 826, 997, 948, 396, 746, 897, 176, 281, 676, 66, 492, 906, 977], [654, 682, 813, 306, 603, 436, 177, 760, 182, 73, 19, 314, 868, 883, 275, 669], [196, 640, 656, 953, 281, 32, 666, 76, 744, 596, 901, 235, 580, 895, 52, 625], [702, 434, 725, 846, 82, 747, 29, 326, 630, 729, 31, 659, 990, 811, 524, 335], [13, 323, 24, 979, 751, 382, 216, 198, 656, 703, 238, 378, 624, 316, 167, 668], [864, 501, 944, 407, 551, 1001, 32, 452, 165, 770, 179, 848, 317, 636, 1016, 536], [857, 477, 717, 235, 704, 477, 893, 652, 580, 374, 1020, 318, 391, 479, 379, 344], [210, 220, 852, 769, 610, 918, 144, 663, 176, 110, 595, 372, 239, 182, 668, 345], [77, 479, 709, 295, 29, 779, 1018, 473, 743, 1012, 216, 404, 922, 255, 310, 125], [629, 688, 337, 362, 540, 960, 948, 90, 487, 824, 406, 189, 165, 200, 924, 763], [844, 438, 50, 425, 331, 624, 965, 1019, 61, 995, 855, 583, 704, 618, 370, 355], [973, 781, 51, 627, 157, 695, 239, 627, 475, 60, 98, 108, 102, 873, 587, 779], [23, 141, 529, 711, 887, 772, 491, 788, 154, 1004, 711, 813, 87, 565, 359, 44], [964, 644, 737, 875, 717, 444, 390, 253, 495, 871, 101, 424, 106, 31, 646, 511], [524, 826, 690, 924, 655, 789, 910, 857, 398, 689, 307, 539, 1011, 572, 270, 659], [721, 802, 195, 343, 501, 1005, 808, 14, 890, 862, 37, 441, 551, 655, 971, 549], [767, 111, 161, 376, 709, 310, 370, 631, 708, 206, 405, 693, 948, 885, 717, 612], [124, 485, 116, 276, 367, 1016, 663, 693, 909, 1015, 621, 420, 36, 268, 351, 765], [850, 193, 64, 42, 592, 663, 549, 616, 343, 145, 981, 303, 625, 490, 164, 850], [249, 545, 694, 662, 1017, 938, 267, 210, 133, 584, 396, 463, 753, 224, 202, 106], [592, 446, 805, 602, 706, 36, 619, 262, 202, 3, 668, 212, 164, 177, 264, 277], [401, 491, 1013, 535, 74, 417, 851, 55, 874, 463, 733, 592, 199, 954, 313, 263], [683, 952, 503, 339, 248, 795, 359, 489, 815, 317, 651, 877, 444, 312, 501, 724], [914, 511, 127, 542, 554, 98, 894, 188, 430, 367, 354, 647, 248, 1010, 126, 487], [155, 56, 648, 972, 74, 705, 694, 282, 531, 117, 855, 844, 876, 829, 100, 952], [365, 764, 1000, 496, 393, 892, 122, 568, 920, 14, 658, 913, 90, 1018, 676, 150], [496, 964, 512, 189, 23, 283, 506, 579, 838, 929, 614, 757, 474, 203, 446, 759], [557, 85, 948, 724, 953, 257, 929, 85, 521, 512, 786, 936, 9, 438, 606, 143], [557, 468, 116, 963, 718, 929, 609, 932, 455, 625, 310, 51, 397, 82, 602, 538], [678, 561, 904, 280, 401, 619, 36, 704, 302, 885, 19, 421, 178, 999, 778, 768], [654, 380, 710, 423, 293, 498, 113, 52, 718, 531, 586, 394, 316, 739, 54, 799], [268, 963, 982, 117, 73, 296, 370, 690, 519, 238, 949, 625, 199, 235, 628, 765], [888, 156, 398, 238, 381, 855, 248, 989, 939, 724, 316, 33, 646, 337, 355, 981], [767, 639, 36, 437, 246, 138, 176, 256, 240, 111, 955, 946, 594, 730, 767, 295], [915, 201, 22, 766, 402, 817, 194, 35, 505, 843, 742, 1002, 888, 71, 922, 378], [591, 650, 750, 11, 70, 429, 4, 363, 424, 216, 549, 188, 594, 803, 319, 172]]}, "M\u1ef9 Duy\u00ean": {"spk": [-0.290732, 0.479861, 0.857753, -0.728732, -0.71958, -0.304027, 0.572949, 0.430928, -0.226033, 0.280257, 0.293339, 2.202303, -0.346341, -0.767566, 1.014145, -1.166734, 0.194924, 2.174683, -0.898482, -0.822037, -0.815802, -1.317313, -0.090351, -1.64345, 0.482189, -0.487325, 0.71941, 0.080198, 0.212425, 1.191829, 2.198723, -1.541837, -1.135638, -0.290156, 0.07351, 0.001586, -0.214685, 0.071257, -0.095397, 0.379607, -0.691839, -1.121521, 1.181543, 0.259988, -1.176604, 0.362178, 0.524891, 0.178202, -0.29057, 1.895155, 0.423706, 0.479058, 0.704061, 0.218022, 0.473643, 0.274499, -0.183734, -0.6853, -1.069477, 0.281849, -0.451025, -0.167336, 0.487472, 0.719826, -0.991466, 0.791567, -1.569721, -0.561149, -0.4472, -0.002738, -0.36933, -0.748067, -0.022813, -0.278817, -0.63397, -0.027542, -0.458447, -0.779697, -0.142014, 0.094282, 0.131056, -0.14358, -0.796598, 2.054986, 0.213811, -0.230415, 0.184158, 0.097909, -0.617956, 1.217934, -0.61767, -0.350606, -0.601103, -0.002513, 2.000204, -1.734518, 1.776898, 0.599302, 1.324924, 0.292045, 0.194671, 2.551777, -0.885199, -1.021785, -0.075183, 0.592841, 0.805114, -0.215493, -0.453124, 0.880067, -2.220379, -0.430862, 0.19089, -0.342121, 1.044778, 0.246071, 0.24476, -1.073385, -0.524459, -0.672705, 0.509754, -0.44323, 0.744819, -0.090056, 0.352717, 1.275686, -1.532352, -0.538976, -0.612347, -0.755433, 0.149455, -0.43532, -0.818673, 1.877733, -0.135009, 0.130908, -0.245552, -1.297788, 0.709228, -2.485276, 1.659006, 0.043841, -1.687811, -0.531491, 1.538727, -0.586135, -0.975575, 0.047481, -0.016193, 0.440835, -1.161226, -0.215992, 0.032482, 0.377274, -0.792865, -0.099986, -0.254365, 1.076912, 0.423801, -0.375195, -0.103492, 0.343836, -0.636143, -0.218881, 0.848832, 0.261289, 0.275523, 0.08909, -1.404119, -0.051443, -0.423462, 0.06428, -0.802887, 1.471743, -0.662058, 0.521138, -0.076173, -0.075277, 0.042431, 1.355847, -1.438209, -0.537083, 0.750886, 0.031853, -0.219168, 1.214147, 0.15954, -0.224579, -0.132015, -0.834007, -0.525804, -0.138259], "codes": [[564, 181, 150, 983, 234, 430, 685, 294, 562, 357, 447, 267, 488, 716, 770, 286], [910, 69, 101, 601, 231, 875, 314, 662, 952, 516, 386, 247, 661, 281, 1009, 844], [46, 142, 590, 282, 912, 1004, 628, 533, 298, 166, 951, 957, 103, 284, 108, 93], [980, 587, 394, 130, 648, 561, 943, 218, 21, 83, 183, 554, 327, 613, 1016, 884], [757, 704, 545, 938, 107, 483, 315, 534, 835, 144, 987, 481, 222, 662, 459, 438], [170, 946, 390, 635, 870, 1018, 1006, 979, 320, 408, 763, 155, 642, 34, 922, 869], [460, 426, 694, 936, 4, 574, 295, 892, 100, 242, 924, 31, 679, 272, 937, 8], [857, 646, 57, 116, 843, 134, 168, 1000, 206, 97, 394, 983, 340, 827, 41, 514], [842, 679, 160, 935, 452, 872, 142, 932, 593, 228, 233, 840, 148, 74, 641, 239], [47, 214, 197, 358, 357, 89, 54, 770, 373, 574, 530, 613, 931, 924, 151, 592], [1014, 54, 753, 426, 667, 67, 992, 788, 818, 414, 290, 719, 292, 862, 137, 229], [980, 653, 238, 441, 803, 815, 479, 108, 396, 743, 48, 286, 128, 869, 152, 349], [1014, 194, 410, 911, 821, 136, 815, 578, 209, 851, 310, 571, 1, 967, 1010, 8], [677, 695, 489, 948, 90, 625, 963, 46, 552, 990, 718, 919, 657, 192, 806, 314], [844, 324, 437, 391, 307, 1006, 716, 909, 862, 482, 699, 771, 663, 772, 204, 441], [641, 415, 812, 938, 757, 735, 266, 142, 1004, 889, 829, 235, 231, 127, 948, 833], [172, 1021, 567, 134, 77, 703, 635, 254, 279, 949, 128, 938, 785, 128, 591, 867], [755, 848, 119, 472, 937, 337, 35, 530, 91, 535, 472, 846, 963, 998, 678, 235], [100, 356, 385, 724, 609, 5, 725, 560, 777, 929, 664, 176, 783, 179, 165, 206], [94, 99, 132, 366, 846, 242, 74, 976, 54, 483, 689, 281, 295, 741, 646, 591], [851, 532, 636, 99, 86, 501, 642, 102, 358, 414, 963, 63, 926, 428, 404, 597], [746, 944, 1005, 1015, 351, 867, 399, 350, 319, 891, 972, 1014, 909, 122, 657, 58], [263, 38, 759, 999, 70, 720, 930, 768, 547, 36, 111, 265, 557, 780, 730, 782], [522, 1019, 747, 529, 1014, 512, 689, 706, 406, 337, 190, 668, 976, 652, 25, 13], [538, 847, 605, 627, 973, 560, 684, 929, 101, 678, 186, 310, 494, 877, 287, 141], [661, 147, 276, 987, 13, 931, 531, 456, 425, 753, 494, 322, 558, 896, 819, 807], [33, 402, 592, 377, 107, 153, 442, 639, 393, 425, 814, 448, 824, 863, 17, 399], [751, 155, 51, 735, 24, 892, 163, 217, 865, 444, 109, 731, 129, 957, 610, 226], [133, 831, 132, 901, 258, 537, 634, 58, 453, 483, 430, 544, 271, 853, 494, 475], [794, 83, 708, 518, 843, 742, 692, 3, 642, 537, 127, 424, 114, 69, 367, 671], [265, 917, 167, 70, 282, 246, 583, 984, 534, 526, 332, 3, 579, 519, 320, 806], [541, 784, 439, 7, 869, 750, 773, 454, 635, 130, 208, 537, 83, 272, 611, 716], [471, 793, 786, 912, 276, 757, 444, 195, 819, 254, 216, 266, 294, 811, 354, 708], [103, 455, 618, 185, 505, 788, 370, 26, 297, 568, 373, 944, 379, 547, 1023, 184], [210, 1017, 437, 484, 314, 966, 627, 847, 963, 665, 635, 127, 267, 33, 666, 748], [813, 548, 811, 450, 758, 872, 3, 533, 560, 222, 790, 539, 835, 374, 862, 348], [1006, 824, 795, 740, 719, 667, 442, 813, 459, 409, 982, 839, 987, 353, 806, 174], [369, 33, 312, 690, 425, 524, 1010, 619, 71, 764, 470, 267, 514, 766, 76, 808], [734, 823, 947, 633, 170, 781, 571, 622, 817, 32, 736, 288, 281, 154, 514, 220], [872, 627, 225, 422, 457, 272, 58, 581, 197, 372, 908, 891, 182, 602, 911, 886], [523, 405, 376, 823, 996, 333, 486, 351, 1012, 703, 846, 65, 530, 601, 805, 517], [228, 28, 285, 720, 192, 964, 461, 469, 348, 607, 307, 232, 396, 834, 981, 676], [175, 634, 1005, 28, 562, 58, 15, 490, 365, 40, 470, 235, 182, 209, 524, 260], [527, 688, 1007, 858, 941, 336, 799, 184, 923, 679, 1010, 193, 749, 241, 311, 857], [915, 901, 539, 243, 838, 253, 581, 784, 930, 436, 121, 994, 915, 1022, 156, 124], [755, 283, 387, 0, 667, 290, 131, 825, 441, 347, 55, 183, 819, 155, 715, 319], [560, 190, 368, 214, 372, 980, 709, 232, 690, 17, 844, 346, 872, 299, 942, 884], [136, 381, 359, 269, 759, 858, 663, 5, 658, 808, 103, 259, 679, 292, 197, 582], [795, 414, 375, 251, 654, 68, 959, 297, 876, 564, 804, 269, 561, 238, 561, 553], [208, 195, 814, 311, 694, 234, 426, 605, 835, 508, 38, 736, 640, 880, 648, 214], [685, 119, 357, 957, 613, 585, 9, 543, 813, 412, 265, 369, 527, 751, 727, 573], [604, 305, 52, 155, 229, 452, 599, 793, 895, 509, 293, 246, 1004, 786, 113, 708], [517, 812, 866, 451, 626, 423, 291, 581, 215, 640, 654, 806, 297, 767, 140, 262], [246, 800, 35, 269, 757, 910, 665, 675, 361, 972, 239, 627, 334, 517, 299, 304], [647, 609, 487, 960, 750, 606, 892, 344, 736, 880, 366, 171, 67, 20, 354, 287], [858, 260, 504, 280, 644, 100, 734, 912, 59, 289, 775, 171, 592, 989, 22, 210], [903, 339, 636, 611, 893, 735, 513, 210, 286, 347, 785, 911, 416, 269, 209, 820], [756, 642, 852, 403, 804, 440, 638, 976, 547, 995, 341, 554, 1016, 686, 779, 78], [265, 57, 180, 961, 1008, 532, 525, 654, 192, 75, 215, 798, 717, 405, 862, 544], [699, 240, 770, 299, 178, 810, 722, 355, 2, 409, 645, 664, 175, 181, 1013, 809], [739, 375, 963, 1015, 53, 826, 368, 266, 284, 74, 520, 965, 344, 774, 516, 571], [448, 666, 485, 354, 437, 356, 495, 850, 336, 659, 606, 466, 825, 394, 534, 517], [522, 480, 168, 131, 950, 733, 183, 102, 374, 323, 199, 50, 909, 158, 955, 353], [538, 35, 749, 555, 993, 996, 467, 877, 820, 833, 843, 336, 76, 551, 562, 761], [522, 480, 366, 815, 87, 16, 773, 746, 961, 518, 904, 165, 767, 761, 665, 378], [522, 480, 168, 131, 87, 243, 144, 306, 467, 499, 25, 835, 659, 237, 423, 944], [538, 35, 749, 148, 448, 690, 268, 721, 706, 946, 918, 488, 228, 992, 133, 777], [538, 920, 108, 220, 255, 134, 0, 230, 854, 726, 304, 965, 663, 948, 1016, 392], [81, 548, 689, 79, 188, 434, 385, 636, 348, 229, 531, 114, 311, 143, 384, 412], [116, 588, 21, 220, 87, 778, 923, 531, 957, 872, 607, 159, 863, 776, 587, 189], [319, 1002, 509, 555, 909, 776, 782, 1012, 16, 727, 762, 942, 216, 507, 486, 863], [319, 1002, 701, 968, 672, 9, 389, 681, 1016, 230, 29, 774, 676, 897, 461, 657], [116, 870, 366, 657, 668, 666, 620, 715, 643, 294, 235, 216, 431, 304, 550, 231], [522, 763, 448, 561, 448, 332, 517, 602, 443, 798, 424, 675, 447, 693, 411, 448]]}, "\u0110\u1ee9c Tr\u00ed": {"spk": [-0.908976, 1.560112, -0.616798, -2.307392, -0.373108, 0.186267, -0.53772, -1.375046, 0.718846, 0.607291, -0.766126, 0.013193, 0.093165, 0.94549, -0.344003, -1.13474, 0.13909, 0.087023, -0.794476, -1.440437, 0.864555, 1.603745, 0.19253, 0.598646, -0.3857, -1.670238, 0.609015, 0.327948, 0.207983, -0.602036, 1.273216, -1.147279, -0.074713, 0.850707, 0.115544, -0.563923, -0.992673, -1.637548, -0.750892, 0.231887, -1.492783, -1.831868, 1.179467, 1.096233, -0.207509, -1.886922, 1.418344, -0.691867, -0.413989, -1.54158, 0.41301, -1.645052, 1.292948, 1.350855, -0.306675, 0.403067, 0.595197, -0.505945, -0.692515, 0.036298, 0.295824, 0.741711, -0.706027, 0.652311, -1.773135, 0.334958, -0.582889, 0.57455, 0.41588, 0.319016, 0.222585, 2.2843, -0.039814, -0.385621, -0.748839, -1.058548, 0.298418, -1.680377, 1.442414, 0.213982, -0.792637, 1.127041, 0.98297, -0.086003, 1.458984, -1.747427, 1.065511, -0.232971, -2.077337, 0.750388, 0.31731, 0.257933, -0.640042, 1.234712, -0.074774, -1.90857, 0.412046, 0.169769, 0.931592, 0.832997, -0.150862, 0.319294, 0.174823, 1.078604, -0.527482, 0.538802, -0.457917, 0.451679, -0.752123, -0.796211, -0.575332, -1.052999, -1.371449, 0.537385, -0.318784, 0.925829, -0.813378, -1.213665, -1.382222, 1.287861, 0.95276, -1.560625, 1.921953, -1.241724, 0.558979, 0.246908, 0.690964, -0.438097, -0.944625, 0.142701, -1.483131, 0.054694, -0.500788, 0.943468, 0.700346, 0.185333, 0.244031, -0.461276, 0.882716, -1.194674, 0.192775, 0.072805, 0.00867, -0.434751, -0.613414, 0.179999, -0.211868, -0.427273, 0.36981, 0.435746, -1.153024, 0.354054, 0.121458, 0.24258, 0.139506, -0.442304, -0.276882, -0.017238, -0.17741, 1.510609, -0.036766, 0.112993, 1.077925, -1.780936, 0.666283, -0.386005, 1.083056, 1.266155, 0.020385, 0.368288, -1.778604, -0.069878, 0.10185, -0.007952, 0.719061, -0.311589, 0.593785, -0.370697, 0.008536, -0.767184, -0.537885, -0.463877, 0.521558, -0.572947, -0.042913, 0.122069, -0.133043, 0.0299, -0.509828, -0.37889, -0.93635, 1.512138], "codes": [[685, 498, 802, 949, 854, 644, 636, 288, 154, 768, 862, 426, 582, 780, 114, 298], [929, 715, 804, 225, 962, 181, 662, 481, 868, 642, 885, 969, 127, 590, 1017, 489], [642, 124, 543, 631, 665, 464, 970, 289, 735, 0, 200, 152, 901, 574, 20, 333], [403, 882, 221, 860, 220, 119, 766, 948, 711, 134, 191, 788, 944, 396, 474, 715], [289, 343, 1000, 110, 633, 816, 168, 644, 819, 916, 339, 831, 562, 335, 496, 880], [541, 259, 724, 1001, 353, 151, 197, 880, 120, 695, 1005, 439, 447, 69, 259, 211], [128, 260, 902, 331, 862, 738, 436, 114, 861, 180, 335, 807, 916, 57, 831, 309], [307, 853, 355, 977, 457, 935, 554, 461, 393, 117, 816, 800, 421, 360, 175, 898], [269, 546, 187, 653, 95, 754, 589, 387, 193, 593, 1009, 349, 960, 342, 211, 698], [296, 968, 438, 405, 584, 288, 941, 488, 662, 780, 570, 929, 361, 252, 385, 240], [321, 471, 677, 352, 268, 972, 867, 856, 282, 359, 249, 599, 82, 79, 231, 667], [346, 497, 279, 405, 75, 512, 799, 630, 251, 319, 221, 777, 923, 378, 823, 540], [352, 683, 693, 41, 997, 461, 572, 707, 324, 55, 749, 581, 216, 703, 863, 829], [402, 261, 593, 378, 799, 959, 207, 1009, 140, 8, 98, 981, 878, 186, 789, 886], [100, 457, 892, 434, 1015, 351, 982, 776, 343, 45, 459, 409, 706, 373, 904, 939], [754, 386, 836, 539, 418, 99, 463, 181, 257, 797, 698, 558, 317, 190, 444, 68], [547, 66, 947, 1002, 917, 983, 353, 63, 1013, 779, 568, 654, 704, 528, 1, 798], [311, 556, 180, 807, 474, 857, 121, 288, 999, 530, 740, 756, 813, 208, 327, 768], [997, 556, 935, 122, 40, 952, 982, 730, 316, 899, 814, 257, 844, 748, 884, 888], [391, 823, 349, 860, 135, 974, 816, 254, 308, 538, 463, 537, 97, 503, 706, 538], [505, 345, 940, 655, 933, 533, 213, 241, 310, 850, 26, 842, 639, 269, 14, 167], [299, 180, 647, 599, 45, 498, 302, 991, 31, 89, 652, 63, 85, 153, 24, 167], [321, 882, 552, 988, 873, 298, 394, 548, 768, 1017, 914, 905, 102, 238, 647, 630], [799, 253, 441, 687, 812, 939, 318, 528, 26, 101, 44, 22, 48, 29, 704, 589], [596, 663, 945, 884, 503, 925, 40, 74, 203, 192, 77, 1021, 745, 157, 547, 829], [490, 134, 542, 541, 225, 1005, 102, 389, 477, 929, 514, 881, 572, 987, 921, 221], [681, 442, 109, 495, 699, 854, 532, 676, 437, 355, 307, 732, 943, 540, 114, 938], [596, 774, 924, 432, 548, 552, 261, 579, 611, 824, 301, 698, 118, 1006, 948, 666], [137, 380, 874, 481, 947, 5, 149, 76, 417, 630, 465, 420, 929, 803, 73, 658], [338, 892, 460, 770, 232, 445, 32, 436, 620, 578, 778, 381, 611, 126, 969, 774], [638, 603, 580, 428, 637, 133, 186, 406, 867, 73, 808, 136, 1020, 406, 740, 279], [313, 1016, 511, 524, 902, 936, 799, 814, 635, 642, 844, 398, 944, 112, 771, 654], [578, 65, 765, 620, 103, 245, 13, 916, 395, 433, 679, 575, 907, 815, 712, 91], [617, 302, 357, 1001, 312, 95, 1001, 522, 629, 278, 579, 152, 852, 1, 751, 224], [53, 650, 493, 860, 686, 394, 328, 746, 174, 653, 856, 696, 263, 407, 924, 342], [482, 631, 366, 555, 250, 599, 1013, 2, 813, 49, 658, 828, 291, 331, 679, 389], [482, 13, 82, 717, 986, 367, 417, 990, 733, 396, 361, 257, 608, 681, 256, 655], [116, 724, 510, 131, 42, 352, 783, 600, 720, 17, 490, 345, 928, 648, 236, 62], [19, 258, 944, 46, 293, 75, 292, 816, 515, 925, 40, 460, 652, 372, 432, 695], [58, 982, 293, 256, 713, 176, 577, 935, 481, 513, 930, 372, 919, 387, 672, 918], [762, 490, 644, 232, 823, 1015, 66, 964, 464, 438, 181, 460, 845, 720, 838, 133], [527, 74, 645, 16, 491, 639, 484, 505, 156, 123, 139, 294, 812, 600, 817, 395], [979, 857, 903, 103, 732, 429, 528, 830, 653, 480, 932, 460, 781, 271, 228, 948], [717, 886, 235, 163, 965, 216, 437, 553, 543, 1000, 894, 230, 606, 41, 339, 419], [307, 926, 258, 442, 849, 260, 1000, 240, 394, 313, 317, 560, 565, 242, 542, 189], [649, 926, 710, 270, 545, 638, 223, 109, 137, 280, 730, 44, 602, 919, 734, 79], [580, 320, 697, 997, 956, 848, 963, 758, 959, 63, 61, 90, 261, 28, 440, 907], [580, 563, 782, 404, 621, 878, 521, 553, 633, 486, 225, 872, 135, 41, 151, 213], [534, 275, 808, 216, 696, 1007, 302, 892, 924, 777, 530, 652, 789, 1012, 1007, 364], [133, 164, 888, 702, 1007, 1000, 708, 143, 526, 377, 274, 111, 316, 868, 612, 492], [973, 17, 545, 920, 975, 309, 693, 478, 782, 52, 722, 869, 811, 761, 476, 202], [855, 948, 373, 260, 123, 348, 150, 876, 113, 844, 706, 980, 406, 758, 932, 734], [77, 124, 869, 1005, 521, 621, 985, 576, 608, 948, 123, 435, 373, 293, 895, 321], [259, 676, 756, 351, 376, 1001, 70, 326, 813, 912, 374, 354, 315, 890, 62, 122], [771, 469, 45, 518, 165, 596, 233, 291, 261, 381, 515, 506, 346, 413, 112, 881], [469, 698, 301, 819, 249, 702, 579, 599, 584, 780, 583, 957, 857, 46, 716, 397], [139, 495, 434, 573, 267, 798, 426, 786, 340, 699, 52, 389, 149, 753, 45, 465], [230, 677, 644, 1007, 566, 358, 625, 938, 437, 929, 184, 541, 904, 832, 275, 81], [670, 288, 709, 880, 922, 599, 998, 458, 352, 76, 703, 698, 438, 469, 673, 378], [594, 850, 847, 232, 598, 525, 98, 166, 144, 53, 907, 846, 958, 804, 10, 530], [187, 941, 854, 359, 126, 662, 645, 267, 192, 1, 263, 949, 856, 522, 54, 797], [189, 219, 424, 413, 643, 915, 782, 437, 367, 913, 121, 436, 255, 549, 267, 468], [668, 118, 489, 338, 525, 607, 329, 488, 972, 96, 559, 609, 570, 122, 431, 981], [796, 127, 142, 613, 973, 626, 115, 696, 700, 422, 947, 31, 1019, 739, 769, 331], [482, 258, 672, 733, 250, 150, 303, 486, 161, 190, 500, 858, 53, 333, 955, 564], [744, 963, 453, 566, 659, 280, 115, 325, 161, 733, 230, 577, 212, 830, 706, 1017], [720, 285, 784, 29, 805, 169, 938, 637, 1003, 942, 856, 820, 39, 471, 177, 186], [615, 436, 929, 744, 187, 454, 631, 603, 887, 669, 826, 154, 915, 398, 604, 690], [129, 362, 136, 118, 863, 366, 449, 565, 140, 829, 875, 409, 364, 732, 393, 713], [980, 415, 904, 1021, 177, 769, 996, 367, 85, 121, 902, 298, 556, 853, 421, 274], [224, 629, 965, 907, 310, 1015, 550, 874, 937, 160, 815, 697, 474, 533, 602, 85], [1010, 633, 125, 578, 1, 885, 245, 1017, 989, 386, 645, 539, 479, 191, 48, 800], [254, 504, 429, 645, 772, 574, 544, 220, 846, 690, 47, 230, 284, 739, 1, 957], [711, 908, 887, 85, 519, 551, 71, 549, 226, 394, 272, 98, 293, 597, 331, 74], [442, 945, 934, 144, 405, 493, 262, 969, 568, 604, 585, 694, 162, 703, 432, 531], [997, 949, 864, 484, 295, 853, 23, 224, 83, 489, 690, 587, 807, 754, 813, 867]]}, "H\u1eefu Qu\u00e2n": {"spk": [-1.500403, 2.111019, 0.975654, -1.29126, -0.345293, 1.316437, 0.947763, -1.514523, 0.26295, -0.655465, -1.259382, 0.132953, 1.333879, 1.136391, -0.127278, -1.172179, 1.869915, 0.961462, -0.274869, 0.100697, -0.690509, -1.641005, -0.229649, 0.488056, -1.688119, -0.926182, 0.036827, 1.30006, 0.113788, 0.944787, 1.028874, -0.535805, -0.227459, 0.846926, 0.900515, -0.93748, -0.143106, -1.073462, -2.217929, -0.459873, -0.34257, -1.101099, -0.868437, -0.036505, -0.815381, -0.351245, 2.005937, -0.138054, -0.241583, 0.246207, -0.392703, -1.004371, 1.253301, 0.446283, -0.923676, 0.314526, -0.296523, -0.59364, -0.90943, 0.470103, -0.611952, 0.947408, 0.363633, -0.795788, -0.093778, -1.869928, -1.100082, -0.484958, -0.098341, 0.744825, 0.28153, 1.423142, -1.532965, -0.122807, -0.944981, -0.253094, -0.123247, -0.877152, 0.076331, -1.762231, 0.209647, 0.351871, -0.861475, 0.041266, 0.460786, 0.371328, 1.953314, 0.422532, -1.155718, 0.327296, 1.110376, 1.142301, -1.342983, 0.494188, 0.919925, -1.769815, 0.617375, 0.298827, -0.14558, 0.452914, 0.82607, 0.257148, -0.206069, 1.685891, -0.49775, -0.491506, 0.147869, 1.00722, 0.691508, -0.47533, -1.124715, -1.300866, -1.838206, 0.694513, -0.254914, 0.111702, -0.030105, -0.597673, -0.379583, 0.405373, 0.589611, -0.97756, 0.786514, 0.179423, -0.015681, -0.637044, 0.434512, -0.410933, 0.004963, -0.767518, -0.639955, 1.492513, -1.111603, 1.187579, 0.066958, 0.41231, -0.657365, -1.187475, 1.469387, -1.66092, -0.170851, -0.816499, -0.437106, -0.390414, 0.29418, 0.677445, -0.777639, 0.141922, 1.187578, -0.990352, -0.977156, 0.706073, 0.626757, -0.051858, -0.60367, -0.314762, 1.13491, -1.018486, 0.111367, -0.384572, 0.286822, -0.101223, 0.304463, -0.717091, 0.062195, 0.564743, 2.037846, -1.416531, -0.977523, 1.512038, -0.716005, 0.175923, 0.248611, -1.260831, -0.192686, 0.243137, 0.509374, -0.689328, -1.629119, 0.841002, -2.204734, -0.609948, 0.588583, 0.077043, -0.327949, -0.927205, -0.958398, 0.048318, 0.683441, -0.764766, -0.086485, 0.556878], "codes": [[642, 252, 409, 733, 686, 777, 111, 750, 776, 118, 254, 992, 483, 807, 19, 787], [828, 151, 380, 263, 340, 622, 521, 540, 856, 908, 587, 759, 853, 608, 146, 162], [920, 373, 258, 77, 832, 562, 702, 607, 99, 722, 119, 238, 130, 462, 257, 858], [286, 108, 1013, 678, 569, 70, 544, 616, 445, 647, 55, 731, 317, 702, 763, 512], [450, 618, 393, 1008, 919, 453, 785, 1003, 205, 784, 180, 898, 483, 475, 919, 79], [336, 109, 134, 671, 223, 996, 557, 325, 49, 214, 489, 971, 824, 642, 271, 375], [210, 412, 784, 971, 474, 236, 651, 73, 507, 127, 665, 249, 482, 880, 469, 920], [473, 384, 672, 724, 577, 702, 444, 567, 54, 734, 802, 731, 522, 774, 814, 494], [397, 573, 691, 283, 994, 315, 317, 89, 700, 307, 194, 606, 154, 925, 852, 264], [702, 686, 873, 687, 940, 339, 1017, 483, 562, 102, 802, 717, 530, 64, 9, 57], [262, 794, 987, 697, 203, 805, 56, 1005, 23, 554, 432, 934, 212, 473, 674, 1004], [933, 719, 230, 69, 665, 657, 216, 863, 617, 167, 849, 940, 204, 614, 42, 293], [400, 802, 82, 516, 978, 645, 39, 201, 48, 551, 417, 170, 651, 583, 212, 417], [685, 129, 753, 356, 663, 596, 74, 476, 479, 978, 598, 276, 355, 520, 175, 1014], [723, 3, 377, 59, 364, 499, 143, 560, 1009, 430, 2, 446, 684, 1007, 32, 861], [496, 763, 811, 221, 353, 692, 525, 171, 993, 755, 724, 998, 458, 148, 171, 914], [629, 226, 999, 321, 563, 850, 125, 460, 419, 488, 998, 464, 810, 311, 348, 370], [24, 847, 945, 322, 709, 273, 720, 97, 765, 837, 359, 423, 91, 326, 699, 901], [731, 314, 1014, 1008, 690, 77, 944, 495, 464, 547, 458, 546, 325, 980, 73, 629], [88, 382, 600, 327, 1012, 103, 834, 66, 355, 906, 630, 793, 419, 96, 893, 847], [877, 53, 185, 865, 748, 962, 945, 522, 485, 515, 523, 741, 1015, 46, 282, 957], [532, 298, 941, 1011, 46, 600, 736, 604, 529, 399, 469, 618, 605, 839, 177, 423], [524, 699, 803, 30, 289, 351, 36, 843, 485, 628, 939, 970, 460, 516, 676, 157], [80, 440, 731, 540, 526, 69, 847, 690, 310, 347, 458, 46, 1022, 535, 554, 747], [461, 699, 539, 460, 1014, 627, 450, 821, 287, 490, 149, 603, 458, 752, 332, 841], [917, 412, 669, 254, 896, 183, 893, 861, 739, 569, 957, 771, 919, 346, 156, 693], [223, 334, 780, 451, 1018, 132, 351, 275, 787, 397, 399, 167, 412, 577, 665, 515], [899, 441, 729, 879, 432, 5, 871, 148, 645, 658, 44, 45, 682, 272, 730, 652], [21, 157, 187, 434, 502, 539, 380, 365, 690, 1000, 405, 436, 309, 724, 778, 1017], [799, 942, 850, 46, 754, 62, 560, 886, 486, 265, 406, 1007, 618, 940, 908, 131], [980, 984, 157, 958, 425, 984, 435, 33, 781, 450, 992, 752, 143, 9, 974, 781], [723, 818, 931, 213, 48, 124, 787, 970, 608, 61, 208, 434, 150, 186, 362, 11], [629, 226, 360, 344, 714, 626, 489, 660, 978, 932, 642, 120, 32, 802, 48, 769], [642, 743, 617, 41, 555, 801, 877, 379, 62, 505, 547, 210, 587, 151, 663, 607], [799, 516, 759, 36, 615, 594, 288, 570, 604, 584, 938, 245, 513, 948, 249, 213], [696, 22, 46, 813, 799, 526, 222, 810, 57, 92, 139, 19, 853, 243, 660, 869], [179, 740, 396, 192, 256, 877, 135, 126, 872, 310, 290, 378, 57, 211, 677, 609], [128, 374, 975, 841, 54, 362, 670, 166, 114, 810, 543, 591, 553, 474, 286, 508], [791, 272, 381, 500, 873, 711, 240, 793, 800, 52, 577, 430, 214, 146, 981, 199], [787, 992, 808, 1022, 138, 376, 691, 204, 704, 522, 667, 378, 260, 360, 561, 130], [734, 914, 723, 340, 552, 927, 333, 612, 210, 1020, 411, 106, 103, 296, 909, 521], [825, 355, 510, 589, 950, 839, 104, 881, 650, 799, 430, 249, 566, 627, 259, 900], [391, 908, 763, 740, 889, 487, 609, 129, 708, 698, 563, 173, 928, 910, 403, 976], [14, 92, 526, 376, 243, 735, 520, 558, 499, 834, 536, 52, 552, 389, 325, 954], [719, 517, 411, 350, 391, 640, 748, 923, 362, 733, 441, 688, 834, 272, 206, 298], [768, 184, 723, 929, 217, 117, 1018, 692, 498, 951, 74, 993, 568, 44, 327, 570], [82, 150, 612, 805, 670, 66, 660, 145, 23, 453, 366, 353, 979, 299, 1005, 55], [698, 834, 879, 510, 214, 390, 554, 120, 322, 378, 333, 770, 729, 799, 1, 98], [421, 789, 768, 443, 959, 171, 228, 854, 939, 191, 963, 604, 900, 544, 114, 816], [947, 35, 911, 174, 305, 257, 575, 771, 1009, 202, 993, 136, 561, 63, 142, 248]]}, "Xu\u00e2n Ti\u00ean": {"spk": [-0.431298, 0.298097, 0.962866, -0.145387, -0.288572, 0.221055, 0.762883, 2.282464, -0.262568, 0.347422, -0.828413, -0.074272, 0.504616, -0.953397, -0.096077, -0.610665, 0.966281, 0.987326, 1.085951, -0.951331, 1.024588, 0.275153, -0.02819, 1.757316, -1.081056, 0.980422, 1.391507, 0.529451, 1.213979, -0.050682, -0.30576, -0.431513, 0.22753, -0.780932, -0.786803, -1.692204, -0.989591, -0.464454, -0.17097, -0.321688, -0.235731, -1.01969, -1.249639, 0.207792, -0.906437, 0.129864, 1.390972, -0.23963, 1.223799, 0.651978, -1.028504, -0.840227, 0.66636, 0.932308, 1.687389, 0.630436, 0.556883, -0.423085, 1.402127, -0.502966, -0.13136, -1.360937, -1.223328, -1.04204, -1.414193, -1.662058, -0.340337, -0.907263, -0.468442, 0.177554, -0.184271, 1.551112, -1.353555, 1.034253, -0.928198, -0.808711, -0.680107, 0.287699, 0.101902, 0.110531, 0.732716, -0.110562, -0.01386, 1.633662, 0.263078, -0.107957, -0.366873, -0.026242, -0.251882, -1.317392, -0.294737, 0.887497, 0.327028, 1.002365, 0.17297, -1.173268, -0.827297, 0.513151, 1.474935, 2.412539, 0.296193, -0.457763, -0.471059, 1.39841, 0.334317, 2.17992, 0.17625, 0.656608, -0.269849, -0.821389, -0.649894, -1.774876, -1.056159, 0.446272, 0.280932, 0.79564, 0.044361, 0.183537, -0.031988, 0.85543, 0.789334, -1.196179, 1.273163, -0.602917, 0.845299, -0.155078, 0.57855, -0.808515, 1.182478, -0.885867, -0.124103, 1.54703, -0.088716, 0.414578, 0.851104, -0.805537, 1.20638, -0.989438, -0.569504, -1.198599, -0.354889, -0.961189, -0.738898, 0.371938, -0.10857, 1.52692, 1.22628, -0.473431, 1.940094, -1.276636, -1.820547, 0.107041, 1.286005, -0.51922, -0.689749, 0.66006, -0.067039, -1.381719, 0.707878, -0.744549, -1.091429, 0.328346, 1.040779, -1.094911, 0.038951, -1.040723, 0.014602, 0.249302, 0.204018, -0.452457, 0.019648, -0.409171, 0.128675, 0.414093, 1.68243, 1.338939, -0.63903, -0.821319, -0.461736, 0.281132, 0.520684, 0.650853, 0.343831, -0.667033, 0.642766, 1.029664, -0.522578, 0.879785, -1.052122, 0.074913, -0.788848, 0.975528], "codes": [[156, 899, 382, 409, 102, 948, 525, 336, 322, 420, 637, 806, 552, 63, 37, 809], [896, 915, 359, 68, 931, 594, 817, 579, 671, 296, 989, 902, 664, 85, 326, 569], [724, 948, 567, 448, 537, 510, 235, 88, 536, 919, 516, 866, 668, 148, 709, 577], [702, 438, 140, 551, 75, 430, 459, 608, 888, 101, 380, 305, 996, 363, 971, 286], [369, 412, 564, 332, 303, 538, 554, 788, 2, 346, 639, 865, 1014, 1016, 998, 756], [847, 430, 386, 678, 798, 164, 733, 604, 421, 434, 340, 257, 961, 769, 886, 517], [246, 471, 863, 412, 186, 734, 851, 893, 730, 511, 913, 296, 126, 268, 926, 932], [386, 223, 810, 71, 844, 631, 509, 453, 646, 861, 952, 904, 578, 608, 418, 515], [349, 882, 787, 121, 295, 818, 222, 766, 1002, 835, 873, 231, 934, 15, 72, 619], [911, 913, 576, 680, 671, 415, 262, 817, 625, 28, 700, 457, 626, 862, 192, 514], [482, 419, 769, 524, 460, 112, 993, 611, 851, 488, 308, 1003, 687, 480, 574, 226], [771, 913, 13, 53, 69, 851, 264, 542, 965, 833, 584, 858, 414, 113, 11, 707], [343, 480, 689, 458, 245, 1008, 78, 261, 71, 409, 105, 394, 412, 710, 737, 716], [602, 511, 132, 216, 155, 432, 392, 374, 859, 1016, 339, 150, 131, 801, 171, 197], [681, 682, 894, 1004, 244, 724, 570, 7, 873, 935, 474, 586, 395, 691, 345, 591], [826, 122, 648, 537, 1011, 441, 986, 761, 16, 520, 915, 15, 695, 902, 978, 804], [851, 563, 682, 580, 973, 12, 396, 599, 495, 487, 969, 365, 621, 33, 188, 574], [888, 93, 473, 870, 851, 135, 214, 582, 92, 389, 71, 763, 359, 259, 228, 969], [375, 786, 644, 886, 616, 197, 779, 108, 416, 716, 438, 519, 883, 25, 586, 569], [972, 786, 134, 1014, 748, 978, 901, 945, 201, 871, 659, 524, 732, 822, 291, 382], [533, 729, 780, 177, 131, 780, 369, 535, 162, 290, 809, 825, 949, 65, 454, 153], [1012, 579, 423, 549, 250, 213, 633, 45, 404, 597, 798, 469, 471, 927, 327, 734], [835, 651, 153, 576, 573, 113, 518, 826, 752, 699, 528, 380, 217, 298, 924, 181], [69, 471, 816, 380, 865, 393, 405, 776, 471, 661, 485, 608, 424, 978, 951, 775], [713, 486, 569, 674, 487, 500, 903, 951, 353, 377, 981, 660, 616, 272, 23, 708], [255, 851, 99, 208, 249, 969, 311, 400, 285, 149, 657, 755, 430, 734, 406, 353], [1014, 176, 1001, 626, 441, 342, 69, 164, 374, 662, 376, 27, 514, 325, 890, 614], [723, 650, 803, 839, 74, 566, 91, 994, 905, 487, 766, 525, 901, 236, 912, 288], [358, 254, 747, 375, 313, 1013, 71, 994, 867, 384, 37, 960, 875, 154, 447, 661], [545, 783, 593, 747, 736, 895, 284, 901, 684, 1004, 966, 106, 708, 595, 222, 248], [993, 494, 766, 530, 518, 738, 1012, 289, 526, 875, 315, 334, 82, 373, 918, 940], [327, 869, 420, 906, 139, 438, 855, 326, 554, 939, 112, 845, 626, 154, 91, 273], [79, 811, 362, 635, 998, 326, 4, 944, 505, 55, 246, 637, 666, 566, 556, 831], [590, 488, 423, 523, 545, 792, 949, 469, 214, 890, 592, 135, 932, 82, 766, 325], [75, 169, 480, 156, 352, 696, 326, 629, 126, 778, 875, 870, 227, 199, 271, 817], [225, 576, 922, 54, 74, 218, 318, 899, 205, 637, 750, 471, 491, 132, 758, 194], [303, 708, 324, 919, 647, 671, 961, 822, 421, 971, 463, 613, 28, 792, 569, 886], [457, 462, 476, 1013, 757, 600, 725, 587, 470, 628, 380, 992, 832, 565, 17, 670], [842, 482, 185, 830, 865, 851, 560, 351, 851, 596, 927, 542, 106, 864, 395, 968], [455, 208, 241, 245, 213, 526, 694, 774, 756, 333, 289, 179, 38, 382, 511, 4], [107, 999, 1020, 539, 876, 84, 249, 316, 207, 112, 736, 447, 331, 771, 488, 599], [525, 559, 119, 696, 759, 368, 405, 357, 228, 739, 164, 373, 358, 516, 438, 578], [102, 199, 318, 628, 926, 251, 214, 365, 890, 850, 437, 402, 831, 468, 603, 254], [879, 29, 715, 457, 571, 962, 886, 303, 408, 598, 87, 40, 325, 769, 464, 453], [954, 540, 759, 160, 582, 322, 754, 374, 296, 203, 524, 686, 870, 928, 2, 880], [628, 70, 886, 410, 581, 143, 642, 829, 416, 191, 214, 742, 880, 72, 280, 624], [586, 805, 471, 490, 1012, 217, 972, 789, 17, 900, 697, 440, 967, 664, 947, 587], [586, 655, 471, 429, 665, 645, 36, 31, 332, 448, 367, 271, 958, 925, 792, 974], [954, 991, 744, 520, 962, 459, 16, 930, 683, 651, 142, 998, 449, 411, 391, 51], [933, 58, 289, 967, 691, 73, 406, 929, 43, 231, 212, 551, 787, 854, 799, 394], [1000, 591, 708, 966, 352, 611, 924, 166, 886, 684, 341, 196, 549, 268, 438, 865], [983, 1006, 546, 461, 649, 188, 707, 244, 786, 582, 267, 59, 79, 770, 885, 234], [842, 896, 777, 727, 604, 149, 33, 308, 867, 822, 259, 361, 428, 944, 687, 835], [651, 670, 690, 879, 792, 750, 115, 344, 244, 986, 662, 406, 627, 798, 856, 979], [82, 154, 685, 470, 559, 738, 562, 546, 145, 569, 198, 162, 142, 94, 535, 595], [923, 1, 948, 853, 568, 843, 392, 140, 673, 320, 712, 792, 618, 896, 322, 776], [560, 758, 701, 873, 695, 208, 565, 108, 137, 938, 354, 784, 194, 90, 336, 501]]}, "Mai Anh": {"spk": [-0.50049, -0.455188, 1.743194, -0.994862, -0.010228, 0.392848, -0.424006, -1.511579, 0.074241, 0.081986, 0.097966, -0.820819, 0.39285, 1.321132, 0.379981, -1.043951, 2.265754, -0.989332, 0.45883, 0.427748, 0.414378, -1.679425, -0.117604, -1.520899, -0.306016, 0.641675, -0.194977, 0.958256, -1.30247, 0.727651, -0.328028, 0.081538, -2.179134, -1.07984, 0.673325, -1.556046, 0.238952, -0.614286, 0.725479, -0.488702, -1.219152, -1.750911, 0.698894, 0.021052, -1.973948, -0.297926, 1.727888, 0.406567, -0.831423, 0.238068, -0.72016, -2.057353, 0.363021, 0.696587, -0.449361, 0.255889, 1.326197, -1.393341, -0.58554, 0.542845, -0.635217, -0.408454, 1.071014, -0.642591, -1.204981, -1.273632, -0.171181, -0.223752, 0.235715, -0.848288, -1.809715, 1.208658, 0.496828, 0.364611, -0.489845, 0.192169, 0.686042, -1.874804, 0.91159, -0.015264, 1.093593, 0.605192, -0.981166, 0.597283, 0.146474, -0.382495, 1.500409, 0.645302, -1.066172, -1.38183, 1.029109, 1.441001, 1.597495, 1.099673, 0.252458, -1.380289, 0.84981, 0.980429, -0.821358, 1.633274, 0.020303, 0.362365, 0.383472, 2.788858, 1.741243, 1.707415, -0.01531, 0.486192, 0.781, -0.470436, -1.187549, -0.65514, -0.880853, 0.011338, -1.317117, 0.315056, -1.571488, -0.7685, 0.298743, 0.501991, -0.179714, -0.259284, 1.021468, -2.036532, -0.913544, -0.154855, -0.444777, 0.637685, -0.215681, 0.66332, 0.266833, 0.803298, -0.095044, 0.784187, -0.925622, 0.16928, -0.554544, -1.290711, -0.101816, -2.11292, -0.069743, 0.111278, -0.242806, -0.247394, 2.565464, -0.482356, -0.497194, 1.572878, 1.369941, -0.672484, -1.38968, 0.184378, -1.02747, -0.584179, 0.416163, -1.941572, -0.143763, 0.370889, -0.155149, 0.249291, 0.693699, 0.026642, 0.912366, -2.646968, -0.545349, -0.075073, 0.73821, -1.142944, -1.277461, -0.536823, 0.505537, -0.523095, 1.165056, -1.651198, -0.412905, 0.610439, -0.02972, -0.684176, -0.221621, 0.206045, -1.408046, -0.38955, -0.32167, 1.93603, 0.398997, 1.945428, -0.908097, -0.835731, -0.650257, 0.503624, 1.13735, -0.218469], "codes": [[349, 711, 143, 648, 403, 1012, 268, 576, 68, 521, 800, 525, 682, 630, 513, 330], [643, 648, 978, 985, 801, 832, 870, 845, 358, 68, 787, 961, 621, 958, 1003, 345], [799, 142, 143, 208, 991, 712, 54, 534, 335, 964, 1015, 619, 267, 656, 448, 745], [1001, 78, 543, 218, 520, 1014, 833, 228, 750, 105, 277, 716, 780, 40, 883, 148], [888, 383, 920, 704, 65, 430, 332, 959, 962, 874, 477, 52, 978, 561, 855, 401], [743, 467, 592, 728, 943, 523, 473, 505, 20, 754, 270, 325, 806, 551, 452, 1008], [764, 171, 182, 111, 583, 712, 326, 186, 794, 162, 874, 766, 874, 55, 140, 64], [799, 609, 759, 898, 871, 280, 119, 525, 599, 902, 100, 176, 986, 669, 665, 799], [741, 929, 705, 50, 90, 789, 1003, 987, 520, 802, 105, 755, 329, 700, 361, 898], [751, 139, 603, 762, 92, 544, 676, 545, 709, 599, 670, 258, 817, 436, 859, 689], [755, 135, 524, 789, 126, 804, 906, 957, 660, 270, 486, 970, 20, 581, 431, 749], [317, 124, 178, 55, 591, 889, 257, 415, 880, 735, 305, 767, 407, 841, 214, 726], [316, 682, 801, 195, 309, 943, 292, 65, 473, 721, 683, 448, 452, 867, 929, 9], [554, 996, 331, 987, 261, 851, 947, 51, 165, 36, 97, 420, 718, 488, 11, 66], [525, 137, 219, 228, 855, 750, 559, 145, 194, 730, 400, 840, 11, 747, 650, 943], [106, 348, 67, 742, 713, 177, 101, 134, 763, 244, 537, 131, 156, 407, 22, 701], [858, 528, 500, 155, 274, 963, 865, 1023, 434, 663, 1022, 218, 804, 680, 44, 254], [684, 121, 608, 888, 666, 328, 675, 989, 213, 705, 440, 123, 570, 325, 279, 96], [731, 56, 562, 929, 654, 671, 344, 587, 651, 318, 308, 306, 573, 721, 42, 791], [793, 519, 384, 550, 326, 1017, 877, 59, 319, 491, 991, 1019, 355, 914, 477, 258], [919, 390, 139, 21, 371, 1023, 340, 635, 784, 880, 317, 551, 965, 374, 587, 731], [505, 97, 815, 823, 222, 169, 1019, 741, 597, 59, 438, 326, 709, 788, 335, 427], [903, 545, 716, 174, 723, 992, 283, 23, 9, 387, 236, 712, 324, 381, 789, 295], [692, 482, 568, 421, 393, 52, 637, 881, 362, 881, 534, 290, 626, 381, 971, 725], [698, 154, 743, 410, 935, 682, 213, 62, 888, 120, 410, 441, 202, 891, 507, 326], [755, 354, 619, 825, 762, 164, 442, 657, 650, 420, 602, 157, 94, 959, 775, 409], [993, 861, 654, 202, 837, 374, 769, 802, 560, 260, 885, 334, 627, 103, 223, 715], [482, 194, 670, 341, 96, 188, 793, 404, 561, 95, 501, 168, 629, 258, 94, 49], [482, 194, 670, 241, 909, 406, 417, 404, 171, 334, 501, 273, 112, 446, 272, 49], [482, 194, 670, 241, 909, 406, 417, 404, 171, 334, 501, 273, 112, 446, 272, 49], [482, 194, 670, 241, 909, 406, 417, 404, 171, 334, 501, 273, 112, 446, 272, 49], [482, 194, 670, 241, 909, 406, 417, 404, 407, 334, 501, 273, 112, 446, 272, 49], [482, 194, 670, 241, 950, 367, 417, 404, 171, 334, 981, 828, 870, 570, 515, 47], [8, 969, 581, 355, 990, 942, 57, 674, 487, 66, 866, 31, 297, 897, 720, 457], [102, 344, 307, 557, 875, 351, 826, 684, 942, 451, 757, 12, 774, 146, 192, 180], [453, 628, 878, 506, 170, 903, 335, 73, 110, 197, 410, 985, 763, 244, 972, 396], [302, 944, 107, 221, 123, 233, 84, 96, 687, 294, 194, 462, 815, 387, 748, 432], [827, 465, 108, 495, 798, 489, 18, 637, 339, 378, 454, 181, 139, 748, 845, 1006], [115, 327, 97, 555, 556, 496, 455, 60, 892, 517, 257, 191, 197, 54, 713, 677], [642, 591, 415, 438, 112, 397, 757, 320, 24, 1013, 357, 308, 1012, 257, 358, 175], [838, 523, 106, 683, 613, 182, 973, 746, 55, 1008, 498, 799, 628, 561, 141, 346], [590, 806, 976, 615, 517, 214, 456, 212, 815, 532, 518, 37, 256, 905, 915, 561], [670, 10, 560, 257, 545, 350, 273, 916, 901, 906, 100, 243, 211, 223, 14, 24], [499, 549, 437, 96, 135, 748, 843, 298, 777, 152, 255, 54, 26, 776, 204, 410], [903, 930, 451, 505, 61, 1010, 620, 516, 601, 707, 84, 201, 216, 319, 885, 699], [973, 259, 66, 924, 600, 470, 57, 493, 944, 175, 781, 6, 462, 735, 290, 636], [945, 823, 706, 818, 971, 199, 518, 96, 979, 535, 238, 341, 659, 457, 723, 481], [603, 787, 520, 948, 80, 950, 389, 857, 232, 320, 215, 46, 734, 43, 852, 906], [722, 789, 455, 195, 980, 177, 153, 457, 887, 537, 14, 71, 549, 787, 442, 351], [333, 929, 600, 526, 845, 11, 939, 803, 691, 502, 84, 400, 708, 269, 172, 160], [899, 139, 853, 30, 58, 994, 883, 999, 870, 518, 996, 256, 171, 60, 188, 135], [952, 183, 567, 581, 423, 515, 963, 605, 708, 905, 239, 469, 822, 113, 30, 655], [448, 265, 657, 21, 545, 704, 8, 704, 754, 106, 930, 624, 142, 452, 61, 727], [106, 569, 692, 234, 944, 853, 733, 481, 771, 550, 197, 796, 1001, 90, 102, 732], [80, 376, 736, 340, 935, 638, 951, 131, 547, 93, 668, 261, 646, 381, 75, 102], [128, 153, 767, 405, 835, 690, 426, 298, 235, 642, 8, 419, 950, 235, 650, 527], [392, 931, 132, 809, 942, 966, 173, 124, 256, 66, 569, 967, 780, 577, 220, 836], [133, 621, 553, 136, 424, 743, 33, 110, 330, 889, 196, 381, 25, 921, 241, 253], [51, 925, 929, 99, 616, 554, 195, 689, 998, 200, 280, 335, 635, 8, 82, 530], [873, 433, 525, 349, 450, 947, 783, 961, 998, 336, 27, 771, 7, 678, 488, 744], [734, 1001, 999, 171, 941, 960, 821, 216, 492, 80, 30, 933, 690, 811, 818, 924], [106, 516, 86, 27, 362, 133, 728, 305, 276, 955, 140, 431, 476, 881, 140, 935], [133, 255, 938, 939, 131, 27, 835, 574, 992, 254, 67, 670, 270, 641, 309, 675], [933, 259, 54, 564, 630, 53, 619, 355, 934, 717, 793, 410, 127, 772, 500, 625], [270, 828, 744, 255, 137, 470, 81, 227, 380, 552, 967, 1005, 890, 454, 675, 484], [245, 28, 384, 110, 150, 445, 484, 885, 349, 972, 457, 293, 623, 22, 346, 734], [86, 999, 37, 56, 814, 430, 968, 762, 645, 190, 815, 908, 405, 1005, 914, 265], [207, 422, 490, 612, 703, 973, 795, 653, 411, 826, 201, 78, 651, 31, 841, 465], [681, 806, 191, 884, 568, 766, 658, 765, 983, 565, 985, 598, 552, 152, 400, 765], [290, 991, 118, 554, 235, 103, 900, 335, 435, 439, 857, 174, 996, 276, 274, 665], [643, 410, 221, 430, 1019, 127, 544, 55, 699, 124, 342, 937, 557, 147, 557, 239], [54, 493, 242, 45, 740, 525, 292, 185, 207, 771, 1022, 741, 625, 520, 73, 401], [667, 10, 36, 256, 852, 5, 174, 1020, 917, 325, 985, 522, 265, 274, 11, 489]]}, "Tr\u00fac Ly": {"spk": [-0.555698, -0.165859, -0.675088, -0.357044, 0.228121, -1.070089, 0.291001, 0.011231, 0.327243, -1.094601, 0.67041, -0.346802, 2.934678, 1.01311, 0.638601, -1.87033, 1.247782, 0.083046, 1.683519, 0.16447, -0.728932, -1.055079, 1.757854, 0.020368, -0.829419, -1.576967, 1.141934, 0.574102, -0.886432, -2.225381, 1.214238, -0.661499, 0.414246, -0.239381, -0.89108, -1.268946, -0.272252, -0.51672, 0.000397, -1.033502, 0.505639, -0.146087, 0.477707, 0.941402, 0.216408, 0.5734, -0.33589, -0.139048, -0.336739, 0.605413, 0.897313, -0.150994, 0.055331, -0.589195, 0.00326, -0.107408, 2.010021, 0.025952, -0.001874, -1.365195, -1.79454, 0.946137, 1.298987, -0.525572, -0.223075, -1.177726, -0.691108, -1.523582, -1.725219, 0.102618, -0.488473, 1.184585, 0.208605, 1.276113, -1.953975, -1.693202, 0.46139, 0.867956, 0.678789, 1.217225, 0.735776, -1.14984, 0.740126, 0.215531, 1.593738, -0.556864, -0.742009, -0.588626, -1.485855, 0.250345, 0.800177, 0.278894, -1.564013, 1.65795, -0.415744, -0.997943, -1.318933, -1.662426, 0.412764, 2.421263, 0.79294, -0.203708, 0.830169, 2.197258, -1.384255, -0.459042, 0.011451, 1.516539, -1.837648, -0.307099, -0.235518, 1.556309, -0.755888, -0.857364, -0.38528, 0.554884, -0.319431, -0.427131, 0.033124, 0.401448, -0.553992, -2.39659, 0.574791, -0.501741, -0.172228, 0.271665, -0.325678, 0.584271, -0.455799, -0.904714, -1.859272, 0.89123, 1.18595, -0.619223, -0.791139, 0.545807, 0.439836, -1.004066, -0.085164, 0.150837, 1.525486, -2.027735, -0.656811, -0.905178, 0.987823, -0.618623, 0.192116, -0.854432, 0.041463, -0.043891, -0.532851, 0.189513, 0.31849, 0.150464, -0.03901, -1.09467, 0.559125, -1.132919, -0.421153, 0.536938, 0.367438, -1.705249, 0.366558, -1.991009, 0.454662, -0.339464, -0.365968, -0.557398, -0.474823, 1.414142, 1.303972, 0.051144, -0.542626, 1.150392, 0.267703, 1.336927, 0.333826, -0.860149, 0.238863, 0.939008, 0.41003, -0.248698, -0.105489, -0.072443, -1.102939, 0.728908, -0.72255, -0.779446, -1.339061, -0.024575, 0.369781, 0.561261], "codes": [[868, 495, 916, 595, 864, 319, 41, 771, 545, 620, 442, 671, 633, 660, 1002, 484], [857, 682, 277, 106, 47, 625, 887, 259, 834, 64, 76, 754, 229, 556, 734, 715], [210, 628, 1018, 573, 352, 791, 84, 437, 374, 53, 828, 419, 685, 695, 945, 70], [844, 533, 481, 712, 430, 973, 484, 23, 465, 979, 354, 245, 67, 404, 138, 643], [105, 793, 454, 1013, 90, 832, 773, 226, 80, 324, 874, 311, 137, 622, 112, 851], [12, 939, 797, 493, 132, 989, 881, 15, 265, 273, 427, 468, 550, 290, 326, 253], [899, 949, 434, 19, 7, 56, 34, 713, 155, 875, 774, 198, 77, 699, 24, 93], [724, 396, 546, 662, 672, 670, 237, 139, 184, 406, 713, 51, 371, 276, 8, 37], [771, 725, 387, 221, 966, 248, 555, 749, 175, 483, 341, 987, 630, 161, 1006, 474], [303, 930, 73, 207, 203, 898, 499, 661, 75, 724, 716, 370, 221, 260, 369, 497], [986, 479, 766, 427, 597, 950, 123, 639, 72, 961, 687, 232, 739, 110, 1018, 369], [789, 765, 373, 174, 239, 726, 125, 112, 316, 216, 215, 713, 435, 726, 670, 350], [104, 45, 841, 328, 681, 291, 4, 824, 912, 335, 710, 70, 767, 207, 1010, 168], [143, 195, 928, 303, 22, 705, 223, 946, 200, 557, 329, 840, 862, 866, 960, 388], [986, 627, 578, 1022, 483, 28, 195, 436, 378, 355, 1011, 16, 732, 470, 811, 570], [1003, 809, 332, 329, 477, 386, 680, 948, 730, 381, 445, 643, 781, 578, 526, 959], [369, 199, 679, 398, 449, 334, 586, 693, 319, 655, 42, 39, 745, 379, 929, 591], [737, 175, 976, 738, 493, 425, 759, 696, 598, 524, 661, 800, 906, 544, 358, 481], [408, 830, 994, 675, 40, 919, 253, 302, 604, 304, 1023, 919, 658, 855, 332, 447], [387, 229, 285, 332, 378, 821, 1015, 898, 476, 924, 962, 856, 776, 541, 121, 675], [443, 962, 296, 113, 159, 206, 4, 480, 116, 606, 651, 598, 950, 460, 59, 903], [947, 645, 444, 288, 356, 836, 171, 42, 925, 95, 562, 686, 984, 619, 996, 846], [602, 266, 827, 720, 926, 283, 301, 929, 756, 690, 670, 520, 136, 693, 57, 72], [343, 673, 790, 37, 499, 155, 61, 4, 825, 404, 818, 760, 712, 635, 809, 343], [617, 10, 670, 730, 610, 6, 292, 583, 280, 250, 193, 917, 768, 352, 977, 164], [24, 673, 360, 242, 141, 584, 81, 191, 589, 41, 529, 705, 260, 150, 423, 741], [890, 496, 712, 859, 884, 34, 938, 419, 901, 2, 455, 801, 421, 490, 420, 919], [812, 742, 1005, 595, 1017, 604, 797, 705, 581, 113, 801, 519, 673, 660, 446, 180], [780, 838, 246, 622, 608, 862, 442, 498, 240, 859, 86, 183, 521, 581, 535, 774], [556, 120, 331, 900, 128, 432, 757, 612, 90, 665, 825, 419, 582, 543, 218, 660], [783, 845, 730, 941, 260, 925, 739, 166, 66, 879, 108, 635, 110, 577, 694, 919], [344, 819, 262, 825, 529, 967, 65, 261, 7, 626, 40, 821, 632, 38, 523, 641], [743, 766, 987, 95, 634, 472, 504, 878, 26, 827, 653, 388, 712, 631, 820, 575], [28, 421, 688, 369, 13, 804, 186, 85, 722, 102, 47, 409, 801, 92, 298, 515], [454, 479, 992, 577, 140, 168, 1, 917, 361, 260, 995, 494, 512, 532, 770, 843], [969, 704, 154, 85, 19, 258, 652, 860, 960, 242, 922, 144, 493, 975, 547, 348], [888, 122, 137, 423, 685, 182, 64, 826, 799, 846, 741, 968, 369, 306, 298, 803], [3, 463, 946, 585, 15, 723, 460, 543, 942, 853, 650, 705, 115, 122, 244, 887], [980, 54, 608, 506, 84, 769, 686, 266, 834, 1023, 1010, 810, 467, 863, 712, 904], [386, 1005, 38, 864, 572, 471, 734, 721, 64, 202, 636, 591, 682, 655, 360, 148], [969, 386, 1004, 750, 92, 904, 356, 322, 17, 554, 896, 820, 486, 142, 830, 303], [81, 388, 965, 626, 723, 71, 870, 126, 368, 567, 46, 150, 16, 882, 1023, 686], [592, 898, 667, 879, 964, 230, 548, 290, 119, 884, 477, 37, 717, 766, 978, 124], [216, 85, 1010, 59, 688, 284, 752, 482, 746, 329, 594, 737, 900, 505, 572, 732], [888, 628, 311, 484, 290, 593, 803, 90, 948, 270, 472, 248, 463, 628, 293, 12], [315, 331, 819, 859, 356, 46, 492, 512, 915, 411, 47, 928, 763, 295, 610, 321], [872, 1010, 36, 120, 370, 559, 441, 416, 161, 963, 1004, 933, 797, 185, 563, 923], [544, 311, 1003, 833, 867, 186, 183, 278, 314, 152, 571, 94, 834, 336, 212, 676], [872, 49, 295, 391, 372, 159, 609, 77, 758, 617, 875, 797, 570, 298, 587, 250], [162, 678, 85, 645, 852, 141, 737, 813, 939, 672, 838, 547, 264, 71, 680, 725], [899, 617, 96, 45, 475, 6, 164, 188, 1003, 227, 489, 593, 979, 232, 713, 962], [556, 137, 521, 661, 486, 182, 77, 724, 783, 739, 887, 255, 513, 130, 790, 585], [209, 388, 876, 420, 470, 132, 239, 381, 757, 904, 356, 929, 147, 328, 902, 977], [556, 434, 881, 805, 7, 909, 641, 903, 426, 1016, 632, 474, 239, 216, 512, 895], [877, 427, 67, 36, 817, 694, 542, 258, 146, 766, 716, 388, 933, 151, 102, 934], [6, 980, 409, 996, 817, 615, 949, 982, 953, 654, 871, 958, 63, 201, 234, 471], [596, 60, 464, 182, 479, 685, 469, 1017, 358, 589, 626, 805, 776, 756, 864, 817], [945, 592, 521, 637, 825, 843, 819, 44, 703, 77, 754, 733, 825, 79, 707, 80], [482, 419, 606, 297, 90, 869, 805, 253, 595, 1015, 464, 766, 870, 150, 0, 300]]}, "Anh Kh\u00f4i": {"spk": [-2.102124, 0.823017, -0.315173, -2.310329, -0.065725, -0.344002, 0.458963, -1.221398, 1.708132, -0.258888, -0.63967, -1.5466, 1.196839, 0.902965, 0.339419, -0.209442, 0.495419, -1.412149, 0.774388, -0.087049, -0.841775, 0.806969, 0.765279, 0.677499, -1.134691, -0.197536, -0.146011, 1.212399, 0.109052, 1.363146, 0.520068, 0.140733, -0.884967, 0.644667, 1.334234, -1.674492, -1.464713, -0.195928, -0.572828, -0.1631, 0.757594, -1.32183, 0.012158, 0.2189, -0.511381, -1.377695, 1.522515, -0.086075, 0.53856, -0.163914, 0.161587, -1.182135, -0.169162, 1.817111, 0.095636, 1.000639, -0.054863, -1.147016, -1.633664, 0.201382, -1.177886, 0.939496, -0.109664, 0.303868, -1.513861, -0.827011, 0.394765, 0.147411, 0.804191, -0.688942, -2.556616, 1.616188, -1.085826, 2.036125, -1.594609, -1.471336, 1.986604, -1.349773, 0.553062, 0.361243, 1.097679, -0.511772, 1.552521, 0.480849, 1.475445, -2.079539, 0.369255, 0.931718, -2.859399, -0.032955, 0.170876, 1.192585, -0.458682, -1.029682, 0.706992, -0.589001, 0.030818, -0.298158, 0.844955, 0.647799, 0.25741, 0.050446, 0.25895, 2.035497, 0.405757, -0.804952, 1.488505, 2.361414, 0.958004, -0.86442, -1.229057, -1.048117, -1.589476, -0.181392, -0.079453, 0.783039, -1.299598, -1.685322, -1.585097, 0.632087, 0.460671, -1.365847, 0.004908, -1.360674, -1.559911, 0.199526, -1.545159, -0.495367, -0.028833, -0.511641, -1.041517, 1.061867, 0.011082, 1.542375, -0.506563, 0.659772, 0.447781, -1.295512, -0.276785, -1.525797, 0.856509, -1.13506, -0.427821, -2.034709, 0.843249, -1.248084, -0.445941, 1.135218, -1.02665, -2.248664, -2.369351, 0.462916, 1.1891, 0.363343, 1.009236, -0.306678, -0.63451, -0.312358, 0.120864, 0.76511, -1.304961, -1.388204, 0.519066, -2.795259, 0.943727, -0.878922, 0.396876, 0.65316, -1.162812, 0.463376, -0.949149, 0.841174, 0.562872, -0.037784, -1.743123, 0.538156, 0.450441, -0.707254, -0.781455, 0.704606, -2.103209, -1.290073, 0.445741, 1.828829, 1.13525, 0.275501, -1.450199, -1.624355, -0.060267, 0.822045, -0.505002, -0.172899], "codes": [[783, 362, 874, 1006, 304, 319, 962, 43, 292, 854, 887, 911, 435, 792, 508, 761], [225, 111, 968, 111, 226, 995, 1020, 154, 942, 64, 268, 877, 924, 889, 737, 554], [586, 579, 759, 204, 778, 233, 866, 980, 622, 798, 395, 611, 264, 34, 177, 41], [220, 201, 669, 720, 1016, 197, 257, 620, 294, 446, 55, 827, 453, 73, 55, 520], [1014, 419, 398, 553, 266, 182, 737, 156, 61, 709, 367, 874, 596, 657, 608, 148], [482, 419, 21, 733, 763, 216, 414, 152, 103, 454, 109, 909, 5, 642, 464, 978], [482, 194, 670, 241, 96, 255, 417, 404, 171, 334, 501, 533, 533, 570, 1012, 49], [741, 725, 346, 308, 286, 133, 605, 285, 419, 1000, 139, 483, 741, 577, 863, 631], [303, 458, 976, 196, 274, 719, 180, 357, 166, 1013, 484, 52, 551, 240, 148, 138], [935, 282, 580, 224, 347, 963, 175, 681, 520, 600, 591, 199, 347, 848, 668, 11], [882, 290, 244, 260, 351, 321, 158, 310, 656, 428, 365, 353, 883, 316, 96, 554], [460, 957, 763, 688, 845, 664, 973, 931, 86, 550, 510, 107, 223, 176, 789, 243], [289, 522, 752, 129, 826, 763, 291, 229, 1004, 631, 931, 807, 823, 45, 763, 688], [649, 849, 681, 193, 17, 201, 14, 102, 33, 857, 621, 554, 128, 813, 87, 534], [947, 1009, 617, 620, 767, 39, 159, 513, 324, 172, 642, 128, 931, 650, 527, 863], [919, 407, 229, 769, 204, 46, 876, 669, 533, 580, 754, 238, 819, 248, 425, 1001], [222, 882, 802, 437, 34, 260, 525, 36, 13, 47, 707, 141, 673, 58, 975, 17], [940, 476, 258, 243, 959, 798, 603, 821, 354, 303, 99, 465, 501, 367, 608, 741], [403, 91, 816, 995, 783, 529, 90, 397, 342, 131, 199, 312, 582, 585, 91, 733], [77, 327, 794, 392, 733, 15, 587, 84, 46, 591, 933, 996, 119, 714, 185, 799], [313, 462, 925, 446, 976, 289, 520, 288, 551, 471, 445, 804, 274, 735, 230, 148], [880, 577, 316, 794, 215, 449, 603, 834, 128, 921, 229, 990, 463, 896, 92, 786], [149, 653, 120, 814, 761, 278, 168, 413, 187, 103, 533, 833, 541, 256, 387, 328], [292, 898, 861, 817, 408, 962, 487, 423, 628, 653, 578, 289, 865, 278, 62, 524], [248, 938, 893, 992, 681, 465, 41, 1005, 12, 588, 410, 418, 508, 315, 213, 342], [24, 505, 238, 304, 236, 754, 611, 803, 605, 795, 570, 429, 815, 880, 613, 194], [220, 487, 777, 757, 619, 651, 382, 213, 539, 955, 531, 225, 210, 84, 535, 662], [920, 649, 841, 788, 189, 882, 773, 657, 775, 526, 21, 798, 978, 808, 241, 631], [296, 625, 96, 893, 872, 192, 415, 736, 697, 794, 411, 786, 474, 723, 597, 938], [1009, 435, 321, 195, 988, 73, 351, 943, 140, 292, 328, 543, 695, 145, 381, 194], [983, 869, 909, 903, 728, 447, 881, 360, 9, 197, 49, 232, 1000, 230, 604, 961], [877, 701, 131, 956, 857, 920, 923, 680, 801, 28, 547, 799, 495, 676, 199, 35], [743, 36, 802, 64, 870, 695, 189, 680, 515, 878, 812, 269, 946, 14, 43, 716], [320, 639, 157, 866, 423, 561, 809, 799, 299, 19, 821, 32, 234, 602, 0, 638], [649, 345, 3, 967, 152, 449, 26, 201, 44, 116, 741, 553, 103, 609, 161, 619], [12, 761, 111, 569, 2, 476, 391, 184, 178, 165, 269, 872, 97, 49, 101, 698], [540, 365, 284, 553, 977, 29, 713, 209, 225, 865, 473, 1012, 922, 474, 348, 200], [313, 586, 201, 301, 254, 816, 141, 697, 424, 1021, 84, 511, 621, 622, 778, 519], [195, 170, 180, 891, 655, 879, 581, 823, 508, 89, 424, 166, 487, 308, 792, 690], [54, 455, 485, 92, 700, 23, 863, 620, 582, 555, 252, 669, 912, 775, 875, 861], [299, 535, 579, 297, 319, 425, 648, 630, 891, 290, 248, 951, 404, 576, 507, 993], [869, 175, 770, 233, 630, 419, 772, 914, 739, 332, 481, 436, 117, 68, 192, 858], [524, 752, 461, 131, 261, 861, 450, 900, 9, 183, 393, 136, 490, 477, 223, 517], [1017, 857, 683, 501, 166, 40, 526, 148, 162, 711, 74, 229, 440, 606, 835, 525], [73, 848, 27, 807, 614, 389, 534, 243, 15, 884, 472, 955, 739, 485, 43, 283], [280, 301, 232, 775, 715, 105, 843, 315, 881, 392, 582, 842, 342, 203, 409, 8], [1012, 772, 321, 130, 843, 101, 453, 105, 864, 578, 155, 491, 644, 474, 830, 95], [1006, 1001, 1018, 387, 139, 157, 620, 117, 403, 307, 956, 744, 131, 492, 206, 569], [551, 961, 623, 422, 739, 750, 437, 396, 599, 678, 121, 951, 549, 575, 226, 861], [943, 146, 553, 352, 279, 287, 58, 500, 909, 956, 182, 332, 720, 523, 406, 317], [106, 73, 701, 23, 381, 420, 532, 578, 757, 888, 853, 162, 683, 360, 463, 263], [437, 864, 585, 440, 411, 358, 643, 431, 555, 658, 571, 124, 29, 977, 998, 753], [560, 236, 483, 743, 420, 536, 237, 717, 606, 880, 673, 56, 393, 661, 123, 932]]}, "Minh Qu\u00e2n": {"spk": [-0.210359, 1.532834, -0.894423, -0.231845, -0.116142, -0.530393, -1.14922, -0.757982, 0.22678, -0.75769, 0.963228, 1.594435, 0.591749, 1.136328, 0.001505, -2.915936, 1.26635, 0.808269, 0.913904, -0.836285, 1.03049, -0.30511, 0.561793, 0.978635, -1.150689, -0.333592, -0.523833, 0.710834, -0.456255, 0.152117, -0.099067, -1.012151, -0.471254, 0.520262, -0.141996, -1.125705, -0.677396, 0.195714, 0.429602, 1.140801, 0.745842, -0.284283, -0.905249, -1.038245, -0.477657, 0.078187, 0.866382, -1.16824, 0.238982, -0.703692, 0.824015, -0.907411, 1.410603, -0.485756, 0.086721, -0.860171, 1.347678, -1.278654, 0.323838, -1.892426, 0.352252, -0.015997, -0.205216, -0.766684, -1.751666, 0.876854, -0.037014, 0.03291, -0.717275, 0.124733, 0.559753, 2.320394, -0.141664, 0.823596, -1.256332, 0.328689, 0.269543, -1.066432, 1.412262, 0.370004, -0.035004, 1.378033, 0.419663, 0.891583, -0.808029, -1.475075, -0.507016, -0.401438, -1.43736, -0.719249, 0.082507, 0.629719, 0.534924, 0.91361, -0.625274, 0.27341, 0.053064, 0.513421, 0.945432, 1.209801, 0.919264, -0.734985, 0.573902, 0.013473, -1.833323, -0.794493, -0.216474, 1.2716, -0.422866, 0.195664, -0.630272, 0.026682, -1.249964, -0.905901, 0.409849, 0.832164, -1.344496, -0.415385, 0.905816, 0.735568, 0.395454, -0.828805, -0.655801, -0.463212, -1.397883, -0.189747, -0.589818, 0.538092, -1.235342, -1.440283, 0.578611, -0.255411, 0.692893, 1.027945, -0.473472, 0.676025, 1.838784, 0.307714, 0.327158, 0.571088, 0.827885, 0.183498, 0.428716, -0.309524, -0.463594, -0.069911, 0.587799, -1.314566, 0.637651, -0.851531, -1.558643, 0.206955, 0.39596, 0.080235, 0.549053, -0.666872, 0.580846, -0.585743, -0.119837, 0.889766, 0.583528, 0.348686, 0.868685, -0.500722, 0.487325, 0.70806, 0.678814, -0.684782, -0.419733, -0.056281, -0.185462, -0.093974, 1.979539, 0.025535, 0.719252, 0.640392, 0.800592, -0.653121, -0.756732, -0.43034, -0.57462, -0.761663, -0.943564, 0.727882, 0.5999, -0.937013, 0.417365, -0.693737, -1.291965, -0.184676, 0.246974, -0.283817], "codes": [[879, 704, 502, 738, 629, 434, 512, 704, 372, 564, 849, 864, 597, 395, 441, 513], [547, 31, 181, 82, 62, 485, 750, 783, 842, 666, 195, 111, 633, 656, 224, 741], [586, 905, 154, 583, 284, 970, 46, 299, 523, 324, 254, 630, 669, 654, 695, 579], [79, 897, 674, 845, 964, 731, 332, 236, 106, 194, 358, 526, 880, 133, 98, 142], [363, 167, 234, 541, 113, 424, 808, 801, 1013, 791, 96, 771, 777, 685, 237, 707], [360, 156, 476, 623, 827, 186, 155, 331, 373, 925, 388, 569, 633, 158, 502, 168], [360, 666, 132, 483, 581, 64, 498, 601, 263, 748, 920, 204, 750, 475, 1011, 221], [496, 116, 268, 192, 722, 68, 653, 225, 995, 576, 17, 683, 575, 814, 239, 483], [496, 666, 672, 709, 770, 0, 356, 743, 777, 453, 100, 249, 850, 821, 737, 696], [482, 419, 71, 470, 740, 990, 326, 724, 703, 469, 634, 773, 851, 785, 858, 397], [482, 194, 670, 241, 909, 406, 417, 404, 171, 675, 501, 533, 112, 570, 272, 49], [482, 194, 670, 241, 909, 406, 124, 404, 171, 334, 501, 533, 112, 689, 1012, 47], [685, 20, 976, 944, 988, 65, 696, 164, 823, 873, 545, 655, 30, 225, 21, 937], [571, 674, 470, 955, 929, 530, 930, 651, 922, 945, 707, 92, 323, 771, 717, 857], [868, 287, 861, 680, 805, 290, 366, 689, 185, 349, 184, 944, 524, 13, 763, 671], [513, 214, 826, 463, 883, 862, 1003, 159, 463, 897, 867, 5, 887, 189, 981, 234], [284, 382, 983, 411, 616, 803, 494, 828, 622, 461, 781, 450, 337, 417, 622, 76], [182, 424, 208, 129, 161, 822, 213, 151, 742, 1022, 646, 345, 956, 538, 315, 489], [731, 267, 706, 404, 743, 138, 382, 180, 157, 794, 412, 584, 836, 361, 83, 495], [400, 424, 710, 737, 125, 394, 939, 5, 107, 773, 543, 258, 108, 736, 343, 387], [167, 224, 840, 675, 131, 429, 666, 622, 290, 115, 795, 827, 115, 340, 614, 1001], [910, 887, 865, 909, 1019, 203, 676, 525, 377, 891, 447, 522, 627, 407, 940, 839], [70, 136, 619, 859, 762, 573, 537, 745, 709, 312, 858, 548, 199, 72, 964, 101], [844, 877, 941, 41, 657, 570, 430, 842, 480, 328, 838, 978, 336, 873, 667, 490], [815, 957, 689, 659, 1011, 696, 121, 166, 53, 641, 141, 980, 985, 958, 773, 164], [167, 10, 419, 655, 111, 211, 1023, 72, 545, 426, 731, 964, 207, 829, 228, 822], [156, 573, 988, 850, 990, 952, 400, 185, 335, 255, 641, 517, 59, 447, 238, 910], [305, 814, 485, 605, 512, 940, 845, 510, 262, 804, 311, 715, 341, 848, 96, 410], [642, 355, 663, 817, 749, 944, 163, 875, 959, 860, 976, 798, 907, 122, 385, 944], [483, 403, 150, 391, 655, 872, 701, 151, 629, 769, 917, 527, 703, 869, 841, 239], [606, 475, 977, 491, 112, 844, 887, 65, 697, 769, 225, 465, 964, 972, 110, 475], [500, 85, 388, 416, 377, 611, 439, 829, 680, 919, 572, 597, 522, 12, 282, 527], [11, 1014, 224, 556, 30, 452, 965, 847, 86, 293, 119, 491, 668, 691, 725, 798], [344, 19, 543, 184, 387, 330, 236, 468, 401, 903, 493, 620, 226, 59, 669, 340], [360, 927, 359, 943, 62, 399, 679, 329, 473, 236, 306, 254, 50, 782, 762, 141], [783, 847, 56, 34, 1019, 35, 279, 435, 604, 94, 866, 49, 712, 166, 829, 420], [784, 811, 612, 38, 596, 450, 213, 371, 336, 28, 661, 154, 668, 907, 600, 782], [584, 216, 939, 69, 819, 125, 565, 864, 347, 1016, 713, 359, 232, 72, 809, 293], [10, 216, 425, 755, 460, 249, 256, 514, 833, 206, 696, 112, 218, 434, 818, 729], [957, 752, 392, 788, 863, 714, 856, 935, 338, 976, 775, 154, 831, 577, 1005, 827], [935, 179, 208, 7, 439, 585, 452, 179, 657, 686, 323, 290, 967, 912, 509, 125], [570, 410, 487, 876, 635, 150, 441, 322, 396, 954, 176, 360, 771, 618, 788, 608], [804, 821, 605, 2, 883, 52, 922, 577, 487, 643, 242, 639, 225, 302, 637, 920], [958, 248, 543, 650, 805, 69, 426, 853, 406, 583, 853, 10, 220, 338, 635, 306], [882, 744, 516, 713, 139, 478, 504, 1002, 566, 61, 234, 523, 837, 814, 784, 333], [110, 358, 115, 693, 688, 729, 681, 954, 1002, 295, 330, 210, 6, 288, 918, 825], [133, 262, 132, 384, 132, 158, 251, 560, 473, 193, 700, 744, 813, 864, 670, 954], [498, 452, 214, 31, 141, 249, 176, 523, 724, 367, 622, 63, 962, 522, 428, 766], [680, 451, 491, 677, 837, 103, 1009, 14, 392, 655, 441, 252, 898, 525, 937, 504], [753, 765, 813, 594, 620, 956, 294, 671, 982, 248, 193, 566, 127, 88, 562, 178], [211, 78, 467, 1004, 963, 970, 182, 761, 793, 797, 465, 95, 557, 269, 683, 495], [128, 996, 510, 327, 427, 67, 246, 721, 803, 313, 1008, 1014, 343, 367, 617, 419], [313, 187, 1020, 745, 62, 3, 456, 320, 846, 668, 295, 778, 935, 429, 487, 174], [713, 905, 712, 409, 633, 497, 731, 540, 312, 562, 952, 418, 951, 477, 2, 5], [775, 262, 435, 218, 951, 807, 713, 950, 316, 670, 412, 833, 232, 738, 931, 294], [1009, 652, 369, 243, 619, 259, 525, 563, 19, 448, 184, 130, 6, 91, 735, 938], [524, 346, 378, 680, 452, 471, 761, 834, 583, 655, 957, 549, 867, 200, 578, 380], [850, 853, 663, 228, 932, 215, 644, 594, 820, 845, 270, 127, 128, 289, 416, 197], [407, 696, 893, 82, 440, 772, 875, 589, 716, 805, 553, 431, 824, 50, 338, 404], [245, 410, 1021, 830, 618, 140, 210, 549, 835, 515, 124, 380, 153, 432, 773, 976], [244, 952, 921, 841, 701, 492, 417, 464, 382, 458, 245, 132, 124, 294, 616, 734], [305, 472, 305, 123, 463, 640, 1006, 315, 653, 487, 792, 383, 768, 447, 310, 641], [467, 331, 789, 438, 30, 664, 760, 440, 382, 135, 574, 351, 918, 573, 1022, 419], [402, 241, 305, 42, 969, 871, 41, 385, 396, 827, 204, 202, 859, 962, 443, 447], [595, 490, 6, 147, 490, 146, 152, 31, 887, 507, 685, 87, 623, 497, 813, 520], [1005, 969, 582, 276, 837, 771, 431, 1, 139, 280, 491, 125, 366, 875, 199, 42], [474, 300, 594, 882, 130, 873, 960, 880, 173, 406, 107, 79, 731, 292, 334, 365], [167, 946, 727, 651, 554, 598, 305, 281, 464, 751, 285, 674, 511, 764, 25, 178]]}, "M\u1ea1nh D\u0169ng": {"spk": [-0.35907, -0.45749, 0.120499, -1.598761, 0.008164, -0.178917, 0.628176, -2.001215, 0.670458, -0.695042, -0.120634, 0.40686, -0.685411, 0.685141, 0.036081, -1.641273, 2.643903, 0.220502, -1.304832, -1.408018, -0.284115, 0.497701, -0.761679, -0.75957, -2.368033, -0.851378, -0.521042, 2.462129, -2.186242, 1.292891, 1.382547, -0.021958, -1.835084, 1.085283, -0.043871, -1.223882, -0.8277, 0.040372, -1.188603, 0.421949, 1.731628, -0.838143, -0.884753, -0.643377, -2.153649, -0.474143, 1.12787, -0.919381, 1.291053, -2.361383, 1.744981, -2.031849, 0.464873, -0.856354, 0.229808, 0.198542, -0.512947, 0.428026, -1.442048, 0.253487, -1.300528, 0.727721, 0.144211, -1.393379, -2.304489, 0.569606, -0.656467, 0.246863, -0.318006, -0.696941, 0.172951, 3.100134, 0.837322, -0.217417, 0.409794, -2.518152, 0.396792, -0.696241, 0.00869, -0.108224, -0.771489, 1.375684, -1.009059, 1.562359, 0.124451, 0.191982, 0.404535, -0.459429, -3.353901, -0.830603, 0.114212, 0.714942, -0.540416, 0.055355, -0.076393, -1.480701, 1.171386, 0.891753, -0.357601, 1.015507, 1.101987, -1.81899, 1.235289, 2.151335, 0.717021, -1.023946, 1.262135, 2.862881, -1.19706, 0.082524, 0.604137, -1.205418, -1.105019, -0.007337, -0.397682, 0.441276, -0.249319, -0.836683, -0.948524, 0.625452, 0.459117, -2.657949, -0.093769, -0.975261, -0.594165, -0.64596, -1.018048, -0.479978, 0.136018, -2.494673, -0.214525, -0.35581, 1.66898, 1.387825, -1.298724, 1.38248, 0.096274, -1.524199, 0.352362, -0.129463, 2.704749, 0.056389, 0.264073, -0.680299, -2.244861, -1.368612, 1.343529, 0.530177, 1.021863, 0.222961, -2.747938, -0.968145, -0.400129, 0.144408, 2.154069, -0.470349, 1.324048, -2.018373, 0.370248, -0.805599, -0.182942, -0.215922, 1.377496, -3.17701, 1.687458, -0.139354, 0.784322, -0.50219, -1.704123, 0.104858, -0.381366, -0.405189, 0.725438, -0.596185, 0.372412, 0.110361, -0.687884, 0.464663, -0.884314, 0.656335, -1.604951, -0.150253, 0.136925, -0.427732, -1.229609, 0.011047, -0.071542, -0.265528, -2.388911, 0.839062, 0.459258, -0.604156], "codes": [[75, 686, 288, 805, 764, 253, 617, 542, 432, 844, 1023, 286, 947, 87, 218, 550], [667, 54, 511, 655, 856, 339, 686, 960, 973, 61, 717, 408, 254, 973, 751, 109], [457, 559, 903, 600, 820, 555, 850, 145, 727, 1019, 842, 202, 510, 887, 896, 509], [3, 184, 646, 520, 139, 315, 892, 356, 227, 570, 910, 400, 1004, 118, 427, 483], [586, 107, 295, 254, 573, 563, 454, 978, 561, 133, 243, 917, 289, 161, 965, 219], [5, 591, 806, 783, 667, 914, 535, 984, 1, 89, 825, 315, 290, 263, 141, 846], [848, 512, 951, 234, 572, 489, 188, 764, 402, 977, 666, 787, 816, 437, 461, 332], [717, 616, 835, 553, 817, 929, 738, 385, 245, 917, 645, 195, 803, 849, 412, 769], [269, 818, 705, 1021, 372, 22, 487, 628, 701, 455, 34, 763, 210, 381, 858, 591], [105, 222, 538, 490, 683, 230, 669, 122, 402, 661, 3, 969, 374, 336, 895, 342], [4, 325, 397, 96, 817, 674, 381, 98, 207, 140, 957, 363, 265, 442, 6, 410], [164, 957, 546, 683, 824, 281, 817, 871, 720, 959, 838, 873, 98, 89, 1005, 504], [1014, 388, 693, 39, 1011, 781, 139, 418, 286, 304, 62, 379, 209, 783, 924, 618], [688, 530, 597, 439, 634, 790, 865, 922, 1000, 908, 371, 337, 339, 625, 688, 477], [920, 465, 382, 996, 780, 164, 193, 590, 604, 420, 788, 347, 864, 276, 612, 212], [978, 180, 438, 456, 300, 439, 284, 823, 537, 413, 657, 957, 794, 367, 568, 757], [578, 693, 752, 877, 974, 662, 229, 852, 633, 959, 739, 401, 959, 259, 407, 730], [613, 294, 380, 151, 552, 69, 134, 524, 950, 408, 575, 510, 356, 571, 167, 902], [402, 748, 80, 770, 989, 741, 881, 64, 79, 329, 381, 154, 671, 614, 353, 757], [905, 373, 571, 745, 801, 97, 487, 785, 235, 584, 988, 421, 617, 256, 961, 203], [402, 642, 646, 81, 306, 334, 341, 746, 638, 105, 947, 546, 701, 539, 605, 895], [79, 63, 943, 709, 347, 288, 409, 927, 233, 747, 190, 1012, 684, 222, 676, 213], [993, 966, 643, 939, 196, 703, 193, 115, 486, 932, 295, 442, 915, 822, 314, 373], [465, 446, 1021, 585, 158, 544, 67, 675, 280, 45, 588, 605, 351, 135, 4, 277], [112, 131, 418, 200, 220, 412, 115, 139, 726, 634, 868, 291, 30, 474, 627, 357], [402, 835, 646, 214, 551, 198, 43, 826, 92, 374, 611, 214, 742, 566, 734, 481], [498, 99, 333, 28, 461, 900, 231, 437, 314, 960, 154, 653, 537, 502, 837, 674], [681, 775, 512, 507, 1023, 402, 981, 442, 752, 990, 238, 115, 380, 929, 469, 235], [523, 677, 134, 11, 901, 463, 304, 16, 901, 391, 820, 120, 393, 108, 465, 680], [185, 853, 180, 957, 383, 439, 705, 866, 260, 584, 264, 481, 524, 795, 782, 310], [642, 457, 572, 969, 4, 170, 143, 16, 664, 290, 57, 694, 859, 556, 875, 174], [681, 400, 912, 501, 368, 213, 203, 420, 338, 24, 304, 743, 317, 630, 539, 785], [816, 115, 971, 85, 722, 993, 508, 457, 875, 694, 894, 580, 808, 911, 1014, 851], [402, 712, 904, 386, 838, 1010, 26, 314, 29, 904, 317, 56, 330, 391, 302, 263], [82, 22, 519, 880, 944, 105, 13, 464, 252, 643, 530, 599, 298, 359, 951, 403], [795, 897, 710, 510, 956, 947, 53, 486, 510, 351, 866, 635, 848, 781, 458, 810], [816, 578, 396, 164, 525, 317, 819, 959, 762, 420, 529, 702, 933, 338, 398, 62], [290, 222, 714, 984, 405, 443, 237, 583, 183, 138, 348, 591, 184, 604, 932, 8], [578, 508, 384, 451, 619, 9, 64, 673, 1020, 968, 34, 692, 910, 403, 413, 103], [586, 918, 746, 673, 362, 494, 201, 576, 882, 956, 787, 791, 185, 352, 119, 435], [248, 521, 602, 256, 803, 887, 1021, 555, 989, 896, 244, 474, 444, 878, 664, 470], [133, 243, 588, 1010, 327, 189, 130, 858, 13, 767, 304, 139, 736, 682, 826, 423], [373, 498, 114, 832, 56, 746, 80, 808, 337, 370, 871, 131, 688, 452, 482, 321], [142, 769, 850, 711, 339, 614, 238, 301, 989, 432, 453, 1004, 382, 802, 426, 764], [944, 908, 352, 864, 48, 435, 105, 162, 475, 638, 132, 340, 909, 990, 831, 140], [12, 582, 487, 735, 220, 149, 767, 857, 25, 766, 1011, 172, 570, 542, 599, 985], [333, 973, 477, 1017, 643, 233, 40, 122, 208, 535, 330, 193, 494, 746, 644, 700], [289, 554, 695, 396, 788, 239, 838, 547, 369, 465, 405, 235, 664, 363, 1000, 993], [747, 766, 1000, 912, 75, 1, 432, 277, 824, 2, 238, 631, 356, 337, 299, 471], [377, 236, 556, 146, 726, 345, 55, 560, 987, 143, 84, 816, 545, 556, 267, 248], [681, 365, 821, 817, 958, 791, 649, 299, 997, 221, 90, 551, 808, 76, 257, 890], [344, 291, 548, 953, 721, 1001, 32, 244, 82, 913, 214, 785, 581, 9, 734, 6], [993, 382, 661, 853, 727, 669, 786, 952, 225, 102, 907, 284, 295, 987, 837, 156], [565, 764, 307, 13, 152, 519, 89, 972, 582, 549, 230, 401, 780, 713, 467, 566], [437, 131, 1014, 91, 414, 79, 206, 723, 819, 535, 614, 444, 785, 769, 79, 537], [799, 765, 433, 488, 669, 263, 515, 185, 560, 937, 839, 757, 476, 704, 887, 992], [667, 898, 384, 977, 130, 389, 793, 462, 12, 86, 181, 662, 401, 302, 683, 970]]}};

  function $(id) { return document.getElementById(id); }

  function makeRng(seed) {
    var a = seed >>> 0;
    var next = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    var spare = null;
    return function () {
      if (spare !== null) { var v0 = spare; spare = null; return v0; }
      var u = 0, v = 0;
      while (u === 0) u = next();
      v = next();
      var r = Math.sqrt(-2 * Math.log(u)), th = 2 * Math.PI * v;
      spare = r * Math.sin(th);
      return r * Math.cos(th);
    };
  }

  function encodePhones(phones, cfg) {
    var ids = [cfg.bos_id];
    for (var i = 0; i < phones.length; i++) {
      var idx = cfg.vocab[phones[i]];
      if (idx !== undefined) ids.push(idx);
    }
    ids.push(cfg.eos_id);
    return ids;
  }

  function wavBlob(float32, sampleRate) {
    var n = float32.length;
    var buf = new ArrayBuffer(44 + n * 2);
    var v = new DataView(buf);
    var wstr = function (off, s) { for (var i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
    wstr(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); wstr(8, 'WAVEfmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true); wstr(36, 'data');
    v.setUint32(40, n * 2, true);
    for (var i = 0; i < n; i++) {
      var s = Math.max(-1, Math.min(1, float32[i]));
      v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([buf], { type: 'audio/wav' });
  }

  function trimFade(wav, sr) {
    var thr = 0.005, maxTrim = Math.floor(sr * 0.25);
    var a = 0, b = wav.length;
    while (a < Math.min(maxTrim, b) && Math.abs(wav[a]) < thr) a++;
    while (b > wav.length - maxTrim && b > a && Math.abs(wav[b - 1]) < thr) b--;
    var out = wav.slice(a, b);
    var fade = Math.min(Math.floor(sr * 0.005), out.length >> 1);
    for (var i = 0; i < fade; i++) {
      var g = i / fade;
      out[i] *= g; out[out.length - 1 - i] *= g;
    }
    return out;
  }

  function b64ToF32(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Float32Array(bytes.buffer);
  }

  var state = {
    ready: false, loading: false, synthing: false, provider: null, threads: 0,
    cfg: null, sessions: {}, nullCtx: null, nullMask: null,
    nullSpk: null, nullStyle: null, modelBuffers: null,
    gpuAvailable: false, gpuBroken: false,
    voices: {}, voiceOrder: [], selectedVoice: 'Adam',
    steps: 16, speed: 1, lastResult: null, lastCues: null, progHistory: [],
    model: 'lite',
    turbo: { ready: false, loading: false, sessions: null, heads: null, threads: 0 }
  };
  if (typeof window !== "undefined") window.__vieneu = state;

  async function fetchModelFile(file, onBytes) {
    var url = MODEL_BASE + file.name;
    var cache = null;
    try { cache = await caches.open(CACHE_NAME); } catch (e) { cache = null; }
    if (cache) {
      var hit = await cache.match(url);
      if (hit) { onBytes(file.bytes); return hit.arrayBuffer(); }
    }
    var resp = await fetch(url);
    if (!resp.ok) throw new Error('Không tải được ' + file.name + ' (HTTP ' + resp.status + ')');
    var chunks = [], received = 0;
    if (resp.body && resp.body.getReader) {
      var reader = resp.body.getReader();
      for (;;) {
        var rd = await reader.read();
        if (rd.done) break;
        chunks.push(rd.value); received += rd.value.byteLength; onBytes(rd.value.byteLength);
      }
    } else {
      var ab0 = await resp.arrayBuffer();
      chunks = [new Uint8Array(ab0)]; received = ab0.byteLength; onBytes(received);
    }
    var blob = new Blob(chunks, { type: 'application/octet-stream' });
    if (cache) {
      try { await cache.put(url, new Response(blob, { headers: { 'Content-Type': 'application/octet-stream' } })); } catch (e) {   }
    }
    return blob.arrayBuffer();
  }

  async function modelFullyCached() {
    try {
      var cache = await caches.open(CACHE_NAME);
      for (var i = 0; i < MODEL_FILES.length; i++) {
        if (!(await cache.match(MODEL_BASE + MODEL_FILES[i].name))) return false;
      }
      return true;
    } catch (e) { return false; }
  }

  function loadOrtScript() {
    return new Promise(function (resolve, reject) {
      if (window.ort) { resolve(); return; }
      var s = document.createElement('script');
      s.src = ORT_BASE + 'ort.webgpu.min.js';
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Không tải được thư viện ONNX Runtime Web từ CDN. Kiểm tra mạng rồi thử lại.')); };
      document.head.appendChild(s);
    });
  }

  async function fetchChecked(url) {
    var resp;
    try { resp = await fetch(url); }
    catch (e) { throw new Error('Không kết nối được tới ' + url + ' — ' + (e.message || e)); }
    if (!resp.ok) throw new Error('HTTP ' + resp.status + ' khi tải ' + url);
    return resp;
  }

  async function loadVoices() {
    var grid = $('vieneu-voices');
    try {
      var meta = await (await fetchChecked(ASSET_BASE + 'vieneu-voices-meta.json')).json();
      var bufs = await Promise.all([
        fetchChecked(ASSET_BASE + 'vieneu-voices-spk.bin').then(function (r) { return r.arrayBuffer(); }),
        fetchChecked(ASSET_BASE + 'vieneu-voices-style.bin').then(function (r) { return r.arrayBuffer(); })
      ]);

      var nVoices = (meta.order || []).length;
      if (!nVoices) throw new Error('File vieneu-voices-meta.json không có danh sách giọng (order rỗng).');
      if (bufs[0].byteLength !== nVoices * 192 * 4) throw new Error('File vieneu-voices-spk.bin sai kích thước: ' + bufs[0].byteLength + ' byte, kỳ vọng ' + (nVoices * 192 * 4) + ' cho ' + nVoices + ' giọng.');
      if (bufs[1].byteLength !== nVoices * 50 * 256 * 4) throw new Error('File vieneu-voices-style.bin sai kích thước: ' + bufs[1].byteLength + ' byte, kỳ vọng ' + (nVoices * 50 * 256 * 4) + ' cho ' + nVoices + ' giọng.');
      var vSpk = new Float32Array(bufs[0]);
      var vStyle = new Float32Array(bufs[1]);
      state.nullSpk = b64ToF32(meta.null_context.spk_b64);
      state.nullStyle = b64ToF32(meta.null_context.style_b64);
      state.voiceOrder = meta.order.slice();
      meta.order.forEach(function (name, i) {
        state.voices[name] = {
          spk: vSpk.slice(i * 192, (i + 1) * 192),
          style: vStyle.slice(i * 50 * 256, (i + 1) * 50 * 256),
          description: meta.per_voice[name].description
        };
      });
      grid.innerHTML = '';
      meta.order.forEach(function (name) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'vieneu-voice-chip' + (name === state.selectedVoice ? ' active' : '');
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', name === state.selectedVoice ? 'true' : 'false');
        b.dataset.voice = name;
        b.innerHTML = '<span class="vieneu-voice-name"></span><span class="vieneu-voice-desc"></span>';
        b.querySelector('.vieneu-voice-name').textContent = name;
        b.querySelector('.vieneu-voice-desc').textContent = state.voices[name].description;
        b.addEventListener('click', function () {
          state.selectedVoice = name;
          var chips = grid.querySelectorAll('.vieneu-voice-chip');
          for (var k = 0; k < chips.length; k++) {
            var on = chips[k].dataset.voice === name;
            chips[k].classList.toggle('active', on);
            chips[k].setAttribute('aria-checked', on ? 'true' : 'false');
          }
        });
        grid.appendChild(b);
      });
      var cnt = $('vieneu-voice-count');
      if (cnt) cnt.textContent = '(' + meta.order.length + ' giọng)';
    } catch (e) {

      if (window.console && console.error) console.error('[VieNeu TTS] Không tải được dữ liệu giọng đọc. ASSET_BASE = ' + ASSET_BASE + ' | Chi tiết: ' + (e.message || e));
      grid.innerHTML = '<p class="vieneu-hint vieneu-error-text">Không tải được danh sách giọng đọc. Kiểm tra mạng rồi tải lại trang.</p>';
    }
  }

  var prog = { value: 0, simTimer: null, hideTimer: null };

  function progEls() {
    return {
      wrap: $('vieneu-progress'), bar: $('vieneu-progress-bar'),
      meta: $('vieneu-progress-meta'), txt: $('vieneu-progress-text'), pct: $('vieneu-progress-pct')
    };
  }

  function progRender() {
    var e = progEls();
    var v = Math.round(prog.value * 100);
    if (e.bar) e.bar.style.width = v + '%';
    if (e.pct) e.pct.textContent = v + '%';
    state.progHistory.push(prog.value);
    if (state.progHistory.length > 400) state.progHistory.shift();
  }

  function progShow(label) {
    var e = progEls();
    if (e.wrap) { e.wrap.style.display = ''; e.wrap.classList.remove('vieneu-progress-error'); }
    if (e.meta) e.meta.style.display = '';
    if (label && e.txt) e.txt.textContent = label;
  }

  function progStopSim() {
    if (prog.simTimer) { clearInterval(prog.simTimer); prog.simTimer = null; }
  }

  function progStart(label) {
    progStopSim();
    if (prog.hideTimer) { clearTimeout(prog.hideTimer); prog.hideTimer = null; }
    prog.value = 0;
    state.progHistory.length = 0;
    progShow(label);
    progRender();
  }

  function progSet(frac, label) {
    progStopSim();
    if (prog.hideTimer) { clearTimeout(prog.hideTimer); prog.hideTimer = null; }
    progShow(label);
    var v = Math.max(0, Math.min(1, frac));
    if (v > prog.value) prog.value = v;
    progRender();
  }

  function progSim(label) {
    progShow(label);
    if (prog.simTimer) return;
    prog.simTimer = setInterval(function () {
      if (prog.value < 0.9) {
        prog.value += (0.9 - prog.value) * 0.08;
        progRender();
      }
    }, 200);
  }

  function progDone(label) {
    progStopSim();
    prog.value = 1;
    progShow(label);
    progRender();
    if (prog.hideTimer) clearTimeout(prog.hideTimer);
    prog.hideTimer = setTimeout(function () {
      var e = progEls();
      if (e.wrap) e.wrap.style.display = 'none';
      if (e.meta) e.meta.style.display = 'none';
      prog.hideTimer = null;
    }, 1600);
  }

  function progFail(label) {
    progStopSim();
    progShow(label);
    var e = progEls();
    if (e.wrap) e.wrap.classList.add('vieneu-progress-error');
    progRender();
  }

  function setLoadUI(pct, text, isError) {
    var st = $('vieneu-model-status');
    if (isError) {
      progFail(text);
      if (st && text) { st.textContent = text; st.classList.add('vieneu-error-text'); }
      return;
    }
    progSet(pct / 100, text);
    if (st && text) { st.textContent = text; st.classList.remove('vieneu-error-text'); }
  }

  function badFloatIndex(arr) {
    if (!arr || typeof arr.length !== 'number') return -1;
    for (var i = 0; i < arr.length; i++) {
      var v = arr[i];
      if (v !== v || v === Infinity || v === -Infinity) return i;
    }
    return -1;
  }

  function synthFail(stage, detail) {
    var e = new Error('Bước ' + stage + ' cho ra dữ liệu không hợp lệ' + (detail ? ' (' + detail + ')' : '') + '.');
    e.vieneuStage = stage;
    return e;
  }

  var GRAPH_NAMES = ['text_encoder', 'duration_predictor', 'vector_estimator', 'codec_decoder'];

  async function buildSessions(ep) {
    var out = {};
    for (var gi = 0; gi < GRAPH_NAMES.length; gi++) {
      var g = GRAPH_NAMES[gi];
      out[g] = await window.ort.InferenceSession.create(state.modelBuffers[g + '.onnx'].slice(0), { executionProviders: [ep] });
    }
    return out;
  }

  async function releaseSessions() {
    var names = Object.keys(state.sessions || {});
    for (var i = 0; i < names.length; i++) {
      try { if (state.sessions[names[i]].release) await state.sessions[names[i]].release(); } catch (e) {   }
    }
    state.sessions = {};
  }

  async function computeNullCtx() {
    var cfg = state.cfg;
    var nullIds = new BigInt64Array([BigInt(cfg.bos_id), BigInt(cfg.eos_id)]);
    var outNull = await state.sessions.text_encoder.run({
      ids: new window.ort.Tensor('int64', nullIds, [1, 2]),
      style: new window.ort.Tensor('float32', state.nullStyle, [1, 50, 256])
    });
    var t = outNull[Object.keys(outNull)[0]];
    if (t && t.data && badFloatIndex(t.data) >= 0) {
      throw synthFail('text_encoder', 'ngữ cảnh trống chứa giá trị NaN');
    }
    state.nullCtx = t;
    state.nullMask = new window.ort.Tensor('bool', new Uint8Array([1, 1]), [1, 2]);
  }

  function updateModelStatusLine() {
    var st = $('vieneu-model-status');
    if (!st) return;
    var txt = '✔ Model đã sẵn sàng — chạy bằng ' +
      (state.provider === 'webgpu' ? 'WebGPU (GPU của máy bạn)' : 'WASM · ' + state.threads + ' luồng CPU') +
      '. Văn bản không rời khỏi máy này.';
    if (state.gpuBroken && state.provider === 'wasm') {
      txt += ' GPU đã gặp lỗi trong phiên này — nên dùng nút CPU.';
    }
    st.textContent = txt;
    st.classList.remove('vieneu-error-text');
    st.classList.add('vieneu-ok-text');
  }

  async function switchEngine(targetEp) {
    await releaseSessions();
    state.ready = false;
    state.nullCtx = null;
    state.nullMask = null;
    var tryEps = targetEp === 'webgpu' ? ['webgpu', 'wasm'] : ['wasm'];
    var lastErr = null;
    for (var ei = 0; ei < tryEps.length; ei++) {
      try {
        state.sessions = await buildSessions(tryEps[ei]);
        state.provider = tryEps[ei];
        await computeNullCtx();
        state.ready = true;
        if (tryEps[ei] !== targetEp) state.gpuBroken = true;
        updateModelStatusLine();
        return state.provider;
      } catch (e) {
        lastErr = e;
        state.sessions = {};
        state.provider = null;
        if (tryEps[ei] === 'webgpu') state.gpuBroken = true;
      }
    }
    throw lastErr || new Error('Không chuyển được sang engine ' + targetEp + '.');
  }

  function setSpeakButtonsEnabled() {
    var cpu = $('vieneu-speak-cpu'), gpu = $('vieneu-speak-gpu');
    if (!cpu || !gpu) return;
    var busy = state.loading || state.synthing;
    cpu.disabled = busy;
    gpu.disabled = busy || state.model === 'turbo' || !state.gpuAvailable;
  }

  async function loadModel(preferredEp) {
    if (state.ready || state.loading) return;
    state.loading = true;
    setSpeakButtonsEnabled();
    progStart('Đang tải model…');
    var loadBtn = $('vieneu-load');
    loadBtn.disabled = true;
    try {

      if (!state.nullSpk || !state.nullStyle) {
        throw new Error('Chưa có dữ liệu giọng đọc (danh sách giọng chưa tải được — xem lỗi ở mục chọn giọng). Hãy kiểm tra mạng rồi tải lại trang trước khi nạp model.');
      }
      setLoadUI(0, 'Đang chuẩn bị thư viện xử lý…');
      await loadOrtScript();
      window.ort.env.wasm.wasmPaths = ORT_BASE;
      state.threads = self.crossOriginIsolated ? Math.min(navigator.hardwareConcurrency || 4, 8) : 1;
      window.ort.env.wasm.numThreads = state.threads;

      var buffers = {};
      var got = 0;
      for (var i = 0; i < MODEL_FILES.length; i++) {
        var f = MODEL_FILES[i];
        buffers[f.name] = await fetchModelFile(f, function (n) {
          got += n;
          var mb = (got / 1e6).toFixed(1), tot = (MODEL_TOTAL_BYTES / 1e6).toFixed(1);
          setLoadUI(Math.min(99, Math.round(got / MODEL_TOTAL_BYTES * 100)),
            'Đang tải model: ' + mb + ' / ' + tot + ' MB (' + Math.round(got / MODEL_TOTAL_BYTES * 100) + '%) — file ' + f.name);
        });
      }
      state.cfg = JSON.parse(new TextDecoder().decode(buffers['config.json']));

      state.modelBuffers = buffers;
      buffers = null;

      progSim('Đã tải xong. Đang khởi tạo model trên máy của bạn…');

      var tryEps;
      if (preferredEp === 'wasm') tryEps = ['wasm'];
      else if (preferredEp === 'webgpu') tryEps = ['webgpu', 'wasm'];
      else tryEps = navigator.gpu ? ['webgpu', 'wasm'] : ['wasm'];
      var provider = null, lastErr = null;
      for (var ei = 0; ei < tryEps.length; ei++) {
        try {
          state.sessions = await buildSessions(tryEps[ei]);
          state.provider = tryEps[ei];
          await computeNullCtx();
          provider = tryEps[ei];
          break;
        } catch (e) {
          lastErr = e;
          state.sessions = {};
          state.provider = null;

          if (tryEps[ei] === 'webgpu') state.gpuBroken = true;
        }
      }
      if (!provider) throw lastErr || new Error('Không khởi tạo được model trên máy này.');

      state.ready = true;
      loadBtn.style.display = 'none';
      progDone('Model đã sẵn sàng.');
      updateModelStatusLine();
    } catch (e) {
      if (window.console && console.error) console.error('[VieNeu TTS] Lỗi khi tải/khởi tạo model. provider = ' + state.provider + ', threads = ' + state.threads + ', crossOriginIsolated = ' + self.crossOriginIsolated + ' | Chi tiết: ' + (e.message || e));
      setLoadUI(0, 'Lỗi khi tải model: ' + (e.message || e) + ' — kiểm tra mạng rồi bấm thử lại.', true);
      loadBtn.disabled = false;
    }
    state.loading = false;
    setSpeakButtonsEnabled();
  }
  var TCFG = {
    hidden: 768, nVq: 16, audioVocab: 1024, audioPad: 1024,
    textVocab: 419, tps: 3, tpe: 4, sgs: 5, eosSpeech: 6, refSlot: 7,
    styleId: 16, layers: 12, locHeads: 8, locHeadDim: 96,
    temperature: 0.8, topK: 25, topP: 0.95, repPen: 1.2, repWindow: 64,
    maxFrames: 300
  };
  var TURBO_OPTS = { temperature: TCFG.temperature, topK: TCFG.topK, topP: TCFG.topP, repPen: TCFG.repPen, repWindow: TCFG.repWindow };

  function parseNpz(u8) {
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    var out = {};
    var off = 0;
    while (off + 4 <= u8.length && dv.getUint32(off, true) === 0x04034b50) {
      var method = dv.getUint16(off + 8, true);
      var compSize = dv.getUint32(off + 18, true);
      var fileSize32 = dv.getUint32(off + 22, true);
      var nameLen = dv.getUint16(off + 26, true);
      var extraLen = dv.getUint16(off + 28, true);
      var name = new TextDecoder().decode(u8.subarray(off + 30, off + 30 + nameLen));
      if (compSize === 0xFFFFFFFF || fileSize32 === 0xFFFFFFFF) {
        var eo = off + 30 + nameLen;
        var eEnd = eo + extraLen;
        while (eo + 4 <= eEnd) {
          var id = dv.getUint16(eo, true), sz = dv.getUint16(eo + 2, true);
          if (id === 0x0001) {
            var p = eo + 4;
            if (fileSize32 === 0xFFFFFFFF) p += 8;
            if (compSize === 0xFFFFFFFF) compSize = Number(dv.getBigUint64(p, true));
          }
          eo += 4 + sz;
        }
      }
      var dataOff = off + 30 + nameLen + extraLen;
      if (method !== 0) throw new Error('File heads.npz có mục nén không hỗ trợ: ' + name);
      out[name.replace(/\.npy$/, '')] = parseNpy(u8.subarray(dataOff, dataOff + compSize));
      off = dataOff + compSize;
    }
    return out;
  }

  function parseNpy(u8) {
    var major = u8[6];
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    var hlen, off;
    if (major === 1) { hlen = dv.getUint16(8, true); off = 10 + hlen; }
    else { hlen = dv.getUint32(8, true); off = 12 + hlen; }
    var header = new TextDecoder().decode(u8.subarray(major === 1 ? 10 : 12, off));
    var descr = /'descr':\s*'([^']+)'/.exec(header)[1];
    var shapeM = /'shape':\s*\(([^)]*)\)/.exec(header)[1];
    var shape = shapeM.split(',').map(function (s) { return s.trim(); }).filter(Boolean).map(Number);
    var raw = u8.subarray(off);
    var body = new Uint8Array(raw.length);
    body.set(raw);
    var data;
    if (descr === '<f4') data = new Float32Array(body.buffer, 0, body.byteLength / 4);
    else if (descr === '<f8') data = Float64Array.from(new Float64Array(body.buffer, 0, body.byteLength / 8));
    else if (descr === '<i8') data = new BigInt64Array(body.buffer, 0, body.byteLength / 8);
    else if (descr === '|u1') data = body;
    else throw new Error('Định dạng npy không hỗ trợ: ' + descr);
    return { data: data, shape: shape };
  }

  function matvecRow(mat, rowIdx, rowLen, vec, out) {
    for (var v = 0; v < out.length; v++) {
      var base = (rowIdx + v) * rowLen;
      var s = 0;
      for (var i = 0; i < rowLen; i += 4) {
        s += mat[base + i] * vec[i] + mat[base + i + 1] * vec[i + 1] +
             mat[base + i + 2] * vec[i + 2] + mat[base + i + 3] * vec[i + 3];
      }
      out[v] = s;
    }
  }

  function argmaxArr(arr) {
    var bi = 0, bv = arr[0];
    for (var i = 1; i < arr.length; i++) if (arr[i] > bv) { bv = arr[i]; bi = i; }
    return bi;
  }

  function RepHistory(nCh, win) {
    this.window = win;
    this.channels = [];
    for (var i = 0; i < nCh; i++) this.channels.push({ counts: new Map(), order: [] });
  }
  RepHistory.prototype.set = function (ch) { return new Set(this.channels[ch].counts.keys()); };
  RepHistory.prototype.add = function (ch, code) {
    var c = this.channels[ch];
    c.counts.set(code, (c.counts.get(code) || 0) + 1);
    if (this.window > 0) {
      c.order.push(code);
      if (c.order.length > this.window) {
        var old = c.order.shift();
        var n = c.counts.get(old);
        if (n <= 1) c.counts.delete(old); else c.counts.set(old, n - 1);
      }
    }
  };

  function sampleCode(logits, ch, hist, opts) {
    var L = Float32Array.from(logits);
    var i;
    if (opts.repPen !== 1.0 && hist) {
      var prev = hist.set(ch);
      if (prev.size) {
        prev.forEach(function (idx) {
          var s = L[idx];
          L[idx] = s < 0 ? s * opts.repPen : s / opts.repPen;
        });
      }
    }
    var code;
    if (!(opts.temperature && opts.temperature > 0)) {
      code = argmaxArr(L);
    } else {
      var V = L.length;
      for (i = 0; i < V; i++) L[i] /= opts.temperature;
      var idx = Array.from({ length: V }, function (_, k) { return k; });
      idx.sort(function (a, b) { return L[b] - L[a]; });
      var cand = (opts.topK && opts.topK > 0 && opts.topK < V) ? idx.slice(0, opts.topK) : idx;
      var cs = cand.map(function (k) { return L[k]; });
      var max = cs[0];
      var sum = 0;
      var p = cs.map(function (v) { var e = Math.exp(v - max); sum += e; return e; });
      for (i = 0; i < p.length; i++) p[i] /= sum;
      if (opts.topP && opts.topP < 1.0) {
        var run = 0, kept = 0;
        for (i = 0; i < p.length; i++) {
          var pi = p[i];
          p[i] = run < opts.topP ? pi : 0;
          run += pi;
          kept += p[i];
        }
        for (i = 0; i < p.length; i++) p[i] /= kept;
      }
      var r = Math.random(), pick = cand[cand.length - 1];
      for (i = 0; i < cand.length; i++) { r -= p[i]; if (r <= 0) { pick = cand[i]; break; } }
      code = pick;
    }
    if (hist) hist.add(ch, code);
    return code;
  }

  function turboSpeakerAnchor(emb192) {
    var H = TCFG.hidden, z = state.turbo.heads;
    var v = new Float64Array(H);
    for (var i = 0; i < H; i++) {
      var s = z.xvec_b.data[i];
      var base = i * 192;
      for (var j = 0; j < 192; j++) s += z.xvec_w.data[base + j] * emb192[j];
      v[i] = s;
    }
    var mean = 0;
    for (var i2 = 0; i2 < H; i2++) mean += v[i2];
    mean /= H;
    var varr = 0;
    for (var i3 = 0; i3 < H; i3++) varr += (v[i3] - mean) * (v[i3] - mean);
    varr /= H;
    var denom = Math.sqrt(varr + Number(z.xvec_ln_eps.data[0]));
    var out = new Float32Array(H);
    for (var i4 = 0; i4 < H; i4++) out[i4] = (v[i4] - mean) / denom * z.xvec_ln_w.data[i4] + z.xvec_ln_b.data[i4];
    return out;
  }

  function turboEmbedRows(rows, anchor) {
    var H = TCFG.hidden, z = state.turbo.heads;
    var out = new Float32Array(rows.length * H);
    for (var t = 0; t < rows.length; t++) {
      var row = rows[t], o = t * H, i;
      var tBase = row[0] * H;
      for (i = 0; i < H; i++) out[o + i] = z.text_emb.data[tBase + i];
      for (var ch = 0; ch < TCFG.nVq; ch++) {
        var code = row[ch + 1];
        if (code === TCFG.audioPad) continue;
        var aBase = (ch * TCFG.audioVocab + code) * H;
        for (i = 0; i < H; i++) out[o + i] += z.audio_emb.data[aBase + i];
      }
      if (anchor) for (i = 0; i < H; i++) out[o + i] += anchor[i];
    }
    return out;
  }

  function turboBuildRows(phoneIds, refCodes) {
    var rows = [];
    var textIds = [TCFG.styleId, TCFG.tps].concat(phoneIds, [TCFG.tpe]);
    var i, ch;
    for (i = 0; i < textIds.length; i++) {
      var r = new Array(TCFG.nVq + 1).fill(TCFG.audioPad);
      r[0] = textIds[i];
      rows.push(r);
    }
    if (refCodes) {
      for (i = 0; i < refCodes.length; i++) {
        var rc = new Array(TCFG.nVq + 1).fill(TCFG.audioPad);
        rc[0] = TCFG.refSlot;
        for (ch = 0; ch < TCFG.nVq; ch++) rc[ch + 1] = refCodes[i][ch];
        rows.push(rc);
      }
    }
    return rows;
  }

  function tF32(data, dims) { return new window.ort.Tensor('float32', data, dims); }
  function tI64(data, dims) { return new window.ort.Tensor('int64', data, dims); }

  async function turboAcousticFrame(h, hist) {
    var H = TCFG.hidden, z = state.turbo.heads, S = state.turbo.sessions, ort = window.ort;
    var tok = new Float32Array(2 * H);
    tok.set(h, 0);
    tok.set(z.text_emb.data.subarray(TCFG.sgs * H, (TCFG.sgs + 1) * H), H);
    var emptyK = tF32(new Float32Array(0), [1, TCFG.locHeads, 0, 96]);
    var emptyV = tF32(new Float32Array(0), [1, TCFG.locHeads, 0, 96]);
    var out = await S.ac.run({
      token_emb: tF32(tok, [1, 2, H]),
      position_ids: tI64(BigInt64Array.from([0n, 1n]), [1, 2]),
      past_k_0: emptyK, past_v_0: emptyV
    });
    var hidden = out.hidden.data;
    var pk = out.present_k_0, pv = out.present_v_0;
    var slot0 = hidden.subarray(0, H);
    var textLogits = new Float32Array(TCFG.textVocab);
    matvecRow(z.text_emb.data, 0, H, slot0, textLogits);
    var eos = argmaxArr(textLogits) === TCFG.eosSpeech;
    var codes = new Array(TCFG.nVq);
    var logits = new Float32Array(TCFG.audioVocab);
    matvecRow(z.audio_emb.data, 0, H, hidden.subarray(H, 2 * H), logits);
    codes[0] = sampleCode(logits, 0, hist, TURBO_OPTS);
    for (var ch = 1; ch < TCFG.nVq; ch++) {
      var prevRow = z.audio_emb.data.subarray(
        ((ch - 1) * TCFG.audioVocab + codes[ch - 1]) * H,
        ((ch - 1) * TCFG.audioVocab + codes[ch - 1] + 1) * H);
      out = await S.ac.run({
        token_emb: tF32(Float32Array.from(prevRow), [1, 1, H]),
        position_ids: tI64(BigInt64Array.from([BigInt(ch + 1)]), [1, 1]),
        past_k_0: pk, past_v_0: pv
      });
      pk = out.present_k_0; pv = out.present_v_0;
      matvecRow(z.audio_emb.data, ch * TCFG.audioVocab, H, out.hidden.data, logits);
      codes[ch] = sampleCode(logits, ch, hist, TURBO_OPTS);
    }
    return { codes: codes, eos: eos };
  }

  async function turboSynthChunkOnce(ids, capFrames, preset) {
    var ort = window.ort, S = state.turbo.sessions, H = TCFG.hidden;
    var anchor = turboSpeakerAnchor(Float32Array.from(preset.spk));
    var rows = turboBuildRows(ids, preset.codes);
    var tPrompt = rows.length;
    var promptEmb = turboEmbedRows(rows, anchor);
    var out = await S.pre.run({ inputs_embeds: tF32(promptEmb, [1, tPrompt, H]) });
    var pastK = [], pastV = [], i;
    for (i = 0; i < TCFG.layers; i++) { pastK.push(out['present_k_' + i]); pastV.push(out['present_v_' + i]); }
    var h = Float32Array.from(out.hidden.data.subarray((tPrompt - 1) * H, tPrompt * H));
    var hist = new RepHistory(TCFG.nVq, TCFG.repWindow);
    var frames = [];
    var maxFrames = Math.min(TCFG.maxFrames, capFrames);
    for (var t = 0; t < maxFrames; t++) {
      var fr = await turboAcousticFrame(h, hist);
      frames.push(fr.codes);
      if (fr.eos) break;
      var slotRow = new Array(TCFG.nVq + 1).fill(TCFG.audioPad);
      slotRow[0] = TCFG.sgs;
      for (var ch = 0; ch < TCFG.nVq; ch++) slotRow[ch + 1] = fr.codes[ch];
      var se = turboEmbedRows([slotRow], anchor);
      var feeds = { inputs_embeds: tF32(se, [1, 1, H]), position_ids: tI64(BigInt64Array.from([BigInt(tPrompt + t)]), [1, 1]) };
      for (i = 0; i < TCFG.layers; i++) { feeds['past_k_' + i] = pastK[i]; feeds['past_v_' + i] = pastV[i]; }
      out = await S.dec.run(feeds);
      h = Float32Array.from(out.hidden.data.subarray(0, H));
      pastK = []; pastV = [];
      for (i = 0; i < TCFG.layers; i++) { pastK.push(out['present_k_' + i]); pastV.push(out['present_v_' + i]); }
    }
    var T = frames.length;
    var codeArr = new Int32Array(T * TCFG.nVq);
    frames.forEach(function (f2, ix) { f2.forEach(function (c, ch2) { codeArr[ix * TCFG.nVq + ch2] = c; }); });
    var dec = await S.codec.run({
      audio_codes: new ort.Tensor('int32', codeArr, [1, T, TCFG.nVq]),
      audio_code_lengths: new ort.Tensor('int32', Int32Array.from([T]), [1])
    });
    var audio = dec.audio;
    var N = audio.dims[2];
    var mono = new Float32Array(N);
    var d = audio.data;
    for (var n2 = 0; n2 < N; n2++) mono[n2] = (d[n2] + d[N + n2]) / 2;
    if (badFloatIndex(mono) >= 0) throw synthFail('turbo_codec', 'âm thanh chứa giá trị NaN');
    return { wav: mono, frames: T };
  }

  async function synthTextTurbo(text, voiceName, onFrac) {
    var preset = TURBO_VOICES[voiceName];
    if (!preset) throw new Error('Giọng đã chọn chưa có bản Turbo tương ứng.');
    var expanded = window.VieneuNum.expandNumbersInText(text);
    var chunks = window.VNG2P.chunkText(expanded);
    if (!chunks.length) throw new Error('Câu này không có nội dung để đọc.');
    var gap = new Float32Array(Math.floor(TURBO_SR * 0.12));
    var parts = [];
    for (var c = 0; c < chunks.length; c++) {
      var phonemes = SeaG2P.phonemize(SeaG2P.puncNorm(chunks[c]));
      var ids = SeaG2P.bpeEncode(phonemes);
      var cap = Math.min(300, SeaG2P.maxExpectedFrames(phonemes));
      var best = null, bestVerdict = null;
      for (var attempt = 0; attempt < 3; attempt++) {
        var r = await turboSynthChunkOnce(ids, cap, preset);
        var verdict = SeaG2P.babbleSuspect(r.wav, TURBO_SR, phonemes, cap, r.frames);
        if (!verdict[0]) { best = r; break; }
        if (!best || SeaG2P.babblePrefer(verdict, bestVerdict)) { best = r; bestVerdict = verdict; }
      }
      if (onFrac) onFrac((c + 1) / chunks.length);
      if (c > 0) parts.push(gap);
      parts.push(trimFade(best.wav, TURBO_SR));
    }
    var totalLen = parts.reduce(function (a, p) { return a + p.length; }, 0);
    var all = new Float32Array(totalLen), off = 0;
    for (var q = 0; q < parts.length; q++) { all.set(parts[q], off); off += parts[q].length; }
    if (badFloatIndex(all) >= 0) throw synthFail('ghép đoạn âm thanh Turbo', 'âm thanh cuối chứa giá trị NaN');
    return all;
  }

  async function fetchTurboFile(file, onBytes) {
    var url = file.base + file.name;
    var cache = null;
    try { cache = await caches.open(TURBO_CACHE_NAME); } catch (e) { cache = null; }
    if (cache) {
      var hit = await cache.match(url);
      if (hit) { onBytes(file.bytes); return hit.arrayBuffer(); }
    }
    var resp = await fetch(url);
    if (!resp.ok) throw new Error('Không tải được ' + file.name + ' (HTTP ' + resp.status + ')');
    var chunks = [], received = 0;
    if (resp.body && resp.body.getReader) {
      var reader = resp.body.getReader();
      for (;;) {
        var rd = await reader.read();
        if (rd.done) break;
        chunks.push(rd.value); received += rd.value.byteLength; onBytes(rd.value.byteLength);
      }
    } else {
      var ab0 = await resp.arrayBuffer();
      chunks = [new Uint8Array(ab0)]; received = ab0.byteLength; onBytes(received);
    }
    var blob = new Blob(chunks, { type: 'application/octet-stream' });
    if (cache) {
      try { await cache.put(url, new Response(blob, { headers: { 'Content-Type': 'application/octet-stream' } })); } catch (e) {   }
    }
    return blob.arrayBuffer();
  }

  function updateTurboStatusLine() {
    var st = $('vieneu-model-status');
    if (!st) return;
    st.textContent = '✔ Model Turbo đã sẵn sàng — chạy bằng WASM · ' + (state.turbo.threads || 1) + ' luồng CPU. Văn bản không rời khỏi máy này.';
    st.classList.remove('vieneu-error-text');
    st.classList.add('vieneu-ok-text');
  }

  async function loadTurbo() {
    if (state.turbo.ready || state.turbo.loading) return state.turbo.ready;
    state.turbo.loading = true;
    setSpeakButtonsEnabled();
    var loadBtn = $('vieneu-load');
    if (loadBtn) loadBtn.disabled = true;
    try {
      progStart('Đang chuẩn bị thư viện xử lý…');
      await loadOrtScript();
      window.ort.env.wasm.wasmPaths = ORT_BASE;
      var threads = self.crossOriginIsolated ? 2 : 1;
      window.ort.env.wasm.numThreads = threads;
      state.turbo.threads = threads;
      var bufs = {};
      var got = 0;
      for (var i = 0; i < TURBO_FILES.length; i++) {
        var f = TURBO_FILES[i];
        bufs[f.name] = await fetchTurboFile(f, function (n) {
          got += n;
          var pct = Math.round(got / TURBO_TOTAL_BYTES * 100);
          var label = 'Đang tải model Turbo: ' + (got / 1e6).toFixed(1) + ' / ' + (TURBO_TOTAL_BYTES / 1e6).toFixed(1) + ' MB (' + pct + '%) — file ' + f.name;
          progSet(Math.min(99, pct) / 100, label);
          var stEl = $('vieneu-model-status');
          if (stEl) { stEl.textContent = label; stEl.classList.remove('vieneu-error-text'); }
        });
      }
      progSim('Đã tải xong. Đang khởi tạo model Turbo trên máy của bạn…');
      state.turbo.heads = parseNpz(new Uint8Array(bufs['vieneu_v3_heads.npz']));
      var ort = window.ort;
      var bbExt = [{ path: 'vieneu_backbone_shared.data', data: bufs['vieneu_backbone_shared.data'] }];
      var codecExt = [{ path: 'moss_audio_tokenizer_decode_shared.data', data: bufs['moss_audio_tokenizer_decode_shared.data'] }];
      var so = { executionProviders: ['wasm'] };
      var sessPre = await ort.InferenceSession.create(bufs['vieneu_prefill.onnx'], Object.assign({}, so, { externalData: bbExt }));
      var sessDec = await ort.InferenceSession.create(bufs['vieneu_decode_step.onnx'], Object.assign({}, so, { externalData: bbExt }));
      var sessAc = await ort.InferenceSession.create(bufs['vieneu_acoustic_cached.onnx'], so);
      var sessCodec = await ort.InferenceSession.create(bufs['moss_audio_tokenizer_decode_full.onnx'], Object.assign({}, so, { externalData: codecExt }));
      state.turbo.sessions = { pre: sessPre, dec: sessDec, ac: sessAc, codec: sessCodec };
      bufs = null;
      state.turbo.ready = true;
      progDone('Model Turbo đã sẵn sàng.');
      applyModelUI();
    } catch (e) {
      if (window.console && console.error) console.error('[VieNeu TTS] Lỗi khi tải/khởi tạo model Turbo. Chi tiết: ' + (e.message || e));
      progFail('Lỗi khi tải model Turbo: ' + (e.message || e));
      var st = $('vieneu-model-status');
      if (st) { st.textContent = 'Lỗi khi tải model Turbo: ' + (e.message || e) + ' — kiểm tra mạng rồi bấm thử lại.'; st.classList.add('vieneu-error-text'); }
      if (loadBtn) loadBtn.disabled = false;
    }
    state.turbo.loading = false;
    setSpeakButtonsEnabled();
    return state.turbo.ready;
  }

  function applyModelUI() {
    var btns = document.querySelectorAll('#vieneu-model button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-model') === state.model);
    }
    var loadBtn = $('vieneu-load');
    var st = $('vieneu-model-status');
    var cpuBtn = $('vieneu-speak-cpu');
    var note = $('vieneu-gpu-note');
    var speedHint = $('vieneu-speed-hint');
    var stepBtns = document.querySelectorAll('#vieneu-steps button');
    for (var si = 0; si < stepBtns.length; si++) stepBtns[si].disabled = state.model === 'turbo';
    if (state.model === 'turbo') {
      if (loadBtn) {
        loadBtn.style.display = state.turbo.ready ? 'none' : '';
        loadBtn.disabled = !!state.turbo.loading;
        loadBtn.textContent = '⬇ Nạp model Turbo (210 MB)';
      }
      if (cpuBtn) cpuBtn.textContent = '🖥️ Tạo giọng đọc · Turbo';
      if (note) { note.style.display = ''; note.textContent = 'Bản Turbo chạy bằng CPU (WASM), không dùng GPU.'; }
      if (speedHint) speedHint.textContent = 'Ở bản Turbo, tốc độ chỉ áp vào lúc nghe thử trong trình phát; file WAV và phụ đề tải về giữ tốc độ gốc.';
      if (state.turbo.ready) updateTurboStatusLine();
      else if (!state.turbo.loading && st) {
        st.textContent = 'Model Turbo chưa được nạp. Bấm “Nạp model Turbo (210 MB)” hoặc bấm nút tạo giọng đọc — model khoảng 210 MB được tải một lần từ Hugging Face rồi lưu trên máy này, dùng chung bộ nhớ đệm với công cụ Đọc Sách Nói Online.';
        st.classList.remove('vieneu-ok-text');
        st.classList.remove('vieneu-error-text');
      }
    } else {
      if (loadBtn) {
        loadBtn.style.display = state.ready ? 'none' : '';
        loadBtn.disabled = !!state.loading;
        loadBtn.textContent = '⬇ Tải model (282 MB)';
      }
      if (cpuBtn) cpuBtn.textContent = '🖥️ Tạo giọng đọc · CPU';
      if (note) {
        if (state.gpuAvailable) note.style.display = 'none';
        else { note.style.display = ''; note.textContent = 'Máy này không hỗ trợ GPU.'; }
      }
      if (speedHint) speedHint.textContent = 'Tốc độ áp trực tiếp vào file âm thanh tạo ra, nên file WAV và phụ đề tải về luôn khớp nhau.';
      if (state.ready) updateModelStatusLine();
      else if (!state.loading && st) {
        st.textContent = 'Model Lite (Nano) chưa được tải. Bấm “Tải model” — model khoảng 282 MB được tải một lần từ Hugging Face rồi lưu trên máy này, các lần sau dùng ngay.';
        st.classList.remove('vieneu-ok-text');
        st.classList.remove('vieneu-error-text');
        modelFullyCached().then(function (full) {
          if (full && !state.ready && state.model === 'lite') {
            st.textContent = 'Model đã có sẵn trên máy này từ lần dùng trước — bấm “Nạp model” để dùng ngay, không cần tải lại.';
            if (loadBtn) loadBtn.textContent = '⚡ Nạp model (đã tải sẵn trên máy)';
          }
        });
      }
    }
    var pl = $('vieneu-player');
    if (pl) { try { pl.playbackRate = state.model === 'turbo' ? state.speed : 1; } catch (e) {   } }
    setSpeakButtonsEnabled();
  }

  function setModel(m) {
    if (m !== 'turbo' && m !== 'lite') return;
    if (m === state.model) { applyModelUI(); return; }
    state.model = m;
    try { localStorage.setItem(MODEL_KEY, m); } catch (e) {   }
    applyModelUI();
  }

  async function runSynthTurbo(raw) {
    var stats = $('vieneu-stats');
    var text = window.VieneuNum.expandNumbersInText(raw);
    var chunks = window.VNG2P.chunkText(text);
    var sr = TURBO_SR;
    var gap = new Float32Array(Math.floor(sr * 0.12));
    var rawChunks = window.VNG2P.chunkText(raw);
    var parts = [], cues = [], t0 = performance.now();
    var acc = 0;
    if (!chunks.length) throw new Error('Không tách được đoạn văn nào để đọc.');
    progStart('Đang tạo giọng đọc…');
    for (var c = 0; c < chunks.length; c++) {
      var ci = c;
      var label = 'Đang tạo giọng đọc… đoạn ' + (ci + 1) + '/' + chunks.length;
      stats.textContent = label + ' (Turbo chạy bằng CPU, máy yếu có thể mất vài phút, đừng đóng trang)';
      var wav = await synthTextTurbo(chunks[ci], state.selectedVoice, function (f) {
        progSet((ci + f) / chunks.length, label);
      });
      if (ci > 0) { parts.push(gap); acc += gap.length; }
      var cueStart = acc / sr;
      parts.push(wav);
      acc += wav.length;
      cues.push({ text: rawChunks.length === chunks.length ? rawChunks[ci] : chunks[ci], start: cueStart, end: acc / sr });
      progSet((ci + 1) / chunks.length, label);
    }
    var total = parts.reduce(function (a, p) { return a + p.length; }, 0);
    var all = new Float32Array(total), off = 0;
    for (var q = 0; q < parts.length; q++) { all.set(parts[q], off); off += parts[q].length; }
    if (badFloatIndex(all) >= 0) throw synthFail('ghép đoạn âm thanh', 'âm thanh cuối chứa giá trị NaN');
    var synthMs = performance.now() - t0;
    var audioSecs = all.length / sr;
    var blob = wavBlob(all, sr);
    var url = URL.createObjectURL(blob);
    var player = $('vieneu-player');
    player.src = url;
    try { player.playbackRate = state.speed; } catch (e) {   }
    var dl = $('vieneu-download');
    dl.href = url; dl.style.display = '';
    state.lastCues = cues;
    var subRow = $('vieneu-sub-row');
    if (subRow) subRow.style.display = 'flex';
    state.lastResult = { synthMs: synthMs, audioSecs: audioSecs, voice: state.selectedVoice, steps: state.steps, speed: state.speed, provider: 'wasm', model: 'turbo', sampleRate: sr };
    stats.textContent = '✔ Đã tạo ' + audioSecs.toFixed(1) + ' giây audio trong ' + (synthMs / 1000).toFixed(1) +
      ' giây xử lý · giọng ' + state.selectedVoice + ' · model Turbo · WASM ' + (state.turbo.threads || 1) + ' luồng · tốc độ nghe thử ' + fmtSpeed(state.speed) + ' (file WAV và phụ đề giữ tốc độ gốc).';
    progDone('Đã tạo xong giọng đọc.');
  }

  async function synthesizeTurbo(raw) {
    var stats = $('vieneu-stats');
    if (!TURBO_VOICES[state.selectedVoice]) { stats.textContent = 'Giọng đã chọn chưa có bản Turbo tương ứng.'; return; }
    state.synthing = true;
    setSpeakButtonsEnabled();
    try {
      if (!state.turbo.ready) {
        await loadTurbo();
        if (!state.turbo.ready) return;
      }
      await runSynthTurbo(raw);
    } catch (e) {
      if (window.console && console.error) console.error('[VieNeu TTS] Lỗi khi tạo giọng đọc Turbo. Chi tiết: ' + (e.message || e));
      stats.textContent = 'Lỗi khi tạo giọng đọc: ' + (e.message || e);
      progFail(stats.textContent);
    }
    state.synthing = false;
    setSpeakButtonsEnabled();
  }

  async function synthChunk(phones, voice, steps, seed, speed, onStep) {
    var cfg = state.cfg, S = state.sessions, ort = window.ort;
    var idsArr = encodePhones(phones, cfg);
    var L = idsArr.length;
    var ids = new BigInt64Array(idsArr.map(BigInt));
    var maskData = new Uint8Array(idsArr.map(function (x) { return x !== cfg.pad_id ? 1 : 0; }));
    var styleT = new ort.Tensor('float32', voice.style, [1, 50, 256]);
    var spkT = new ort.Tensor('float32', voice.spk, [1, 192]);
    var maskT = new ort.Tensor('bool', maskData, [1, L]);

    var ctxOut = await S.text_encoder.run({ ids: new ort.Tensor('int64', ids, [1, L]), style: styleT });
    var ctx = ctxOut[Object.keys(ctxOut)[0]];
    if (ctx && ctx.data && badFloatIndex(ctx.data) >= 0) throw synthFail('text_encoder', 'ngữ cảnh chứa giá trị NaN');
    var durOut = await S.duration_predictor.run({ ctx: ctx, ctx_mask: maskT, spk: spkT });
    var logS = durOut[Object.keys(durOut)[0]].data[0];

    if (typeof logS !== 'number' || !isFinite(logS)) throw synthFail('duration_predictor', 'độ dài dự đoán = ' + logS);
    var secs = Math.min(Math.max(Math.exp(logS) / (speed || 1), 0.05), 15.0);
    var T = Math.round(secs * cfg.flow_fps);
    if (!isFinite(T) || T < 2) T = 2;

    var gauss = makeRng(seed);
    var x = new Float32Array(144 * T);
    for (var i = 0; i < x.length; i++) x[i] = gauss();

    var n = Math.max(1, steps | 0), dt = 1 / n;
    for (var step = 0; step < n; step++) {
      var t = new ort.Tensor('float32', new Float32Array([step * dt]), [1]);
      var xT = new ort.Tensor('float32', x, [1, 144, T]);
      var vOut = await S.vector_estimator.run({ x: xT, t: t, ctx: ctx, ctx_mask: maskT, spk: spkT, style: styleT });
      var v = vOut[Object.keys(vOut)[0]].data;
      if (badFloatIndex(v) >= 0) throw synthFail('vector_estimator', 'bước ' + (step + 1) + '/' + n + ' chứa giá trị NaN');
      var vFinal = v;
      if (CFG_SCALE > 0) {
        var vuOut = await S.vector_estimator.run({
          x: xT, t: t, ctx: state.nullCtx, ctx_mask: state.nullMask,
          spk: new ort.Tensor('float32', state.nullSpk, [1, 192]),
          style: new ort.Tensor('float32', state.nullStyle, [1, 50, 256])
        });
        var vu = vuOut[Object.keys(vuOut)[0]].data;
        if (badFloatIndex(vu) >= 0) throw synthFail('vector_estimator', 'nhánh vô điều kiện ở bước ' + (step + 1) + '/' + n + ' chứa giá trị NaN');
        vFinal = new Float32Array(x.length);
        for (var j = 0; j < x.length; j++) vFinal[j] = vu[j] + CFG_SCALE * (v[j] - vu[j]);
      }
      for (var k = 0; k < x.length; k++) x[k] += dt * vFinal[k];
      if (onStep) {
        onStep((step + 1) / n);
        await new Promise(function (r) { setTimeout(r, 0); });
      }
    }
    var decOut = await S.codec_decoder.run({ x: new ort.Tensor('float32', x, [1, 144, T]) });
    var decData = decOut[Object.keys(decOut)[0]].data;
    if (badFloatIndex(decData) >= 0) throw synthFail('codec_decoder', 'âm thanh chứa giá trị NaN');
    return trimFade(Float32Array.from(decData), cfg.sample_rate);
  }

  async function runSynth(raw, voice, rescued) {
    var stats = $('vieneu-stats');
    var text = window.VieneuNum.expandNumbersInText(raw);
    var chunks = window.VNG2P.chunkText(text);
    var sr = state.cfg.sample_rate;
    var gap = new Float32Array(Math.floor(sr * 0.12));
    var rawChunks = window.VNG2P.chunkText(raw);
    var parts = [], cues = [], t0 = performance.now();
    var acc = 0;
    if (!chunks.length) throw new Error('Không tách được đoạn văn nào để đọc.');
    progStart('Đang tạo giọng đọc…');
    for (var c = 0; c < chunks.length; c++) {
      var ci = c;
      var label = 'Đang tạo giọng đọc… đoạn ' + (ci + 1) + '/' + chunks.length;
      stats.textContent = label + ' (máy yếu có thể mất vài phút, đừng đóng trang)';
      var phones = window.VNG2P.phonemize(chunks[ci]);
      var wav = await synthChunk(phones, voice, state.steps, 1234 + ci, state.speed, function (f) {
        progSet((ci + f) / chunks.length, label);
      });
      if (ci > 0) { parts.push(gap); acc += gap.length; }
      var cueStart = acc / sr;
      parts.push(wav);
      acc += wav.length;
      cues.push({ text: rawChunks.length === chunks.length ? rawChunks[ci] : chunks[ci], start: cueStart, end: acc / sr });
      progSet((ci + 1) / chunks.length, label);
    }
    var total = parts.reduce(function (a, p) { return a + p.length; }, 0);
    var all = new Float32Array(total), off = 0;
    for (var q = 0; q < parts.length; q++) { all.set(parts[q], off); off += parts[q].length; }
    if (badFloatIndex(all) >= 0) throw synthFail('ghép đoạn âm thanh', 'âm thanh cuối chứa giá trị NaN');
    var synthMs = performance.now() - t0;
    var audioSecs = all.length / sr;
    var blob = wavBlob(all, sr);
    var url = URL.createObjectURL(blob);
    var player = $('vieneu-player');
    player.src = url;
    var dl = $('vieneu-download');
    dl.href = url; dl.style.display = '';
    state.lastCues = cues;
    var subRow = $('vieneu-sub-row');
    if (subRow) subRow.style.display = 'flex';
    state.lastResult = { synthMs: synthMs, audioSecs: audioSecs, voice: state.selectedVoice, steps: state.steps, speed: state.speed, provider: state.provider };
    stats.textContent = '✔ Đã tạo ' + audioSecs.toFixed(1) + ' giây audio trong ' + (synthMs / 1000).toFixed(1) +
      ' giây xử lý · giọng ' + state.selectedVoice + ' · ' + state.steps + ' bước · tốc độ ' + fmtSpeed(state.speed) + ' · ' +
      (state.provider === 'webgpu' ? 'WebGPU' : 'WASM ' + state.threads + ' luồng') + '.' +
      (rescued ? ' GPU của máy đã gặp lỗi khi sinh tiếng nên lần đọc này đã tự chuyển sang CPU.' : '');
    progDone('Đã tạo xong giọng đọc.');
  }

  function fmtSpeed(x) {
    return String(x).replace('.', ',') + '×';
  }

  function padNum(n, w) {
    var t = String(n);
    while (t.length < w) t = '0' + t;
    return t;
  }

  function fmtSRTTime(s) {
    var ms = Math.max(0, Math.round(s * 1000));
    var hh = Math.floor(ms / 3600000); ms -= hh * 3600000;
    var mm = Math.floor(ms / 60000); ms -= mm * 60000;
    var ss = Math.floor(ms / 1000);
    return padNum(hh, 2) + ':' + padNum(mm, 2) + ':' + padNum(ss, 2) + ',' + padNum(ms - ss * 1000, 3);
  }

  function buildSRT(cues) {
    var out = [];
    for (var i = 0; i < cues.length; i++) {
      out.push(String(i + 1) + '\n' + fmtSRTTime(cues[i].start) + ' --> ' + fmtSRTTime(cues[i].end) + '\n' + cues[i].text);
    }
    return out.join('\n\n') + '\n';
  }

  function buildTXT(cues) {
    var out = [];
    for (var i = 0; i < cues.length; i++) {
      var t = Math.max(0, Math.floor(cues[i].start));
      out.push('[' + padNum(Math.floor(t / 60), 2) + ':' + padNum(t % 60, 2) + '] ' + cues[i].text);
    }
    return out.join('\n') + '\n';
  }

  function downloadTextFile(name, content) {
    var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  if (typeof window !== 'undefined') window.__vieneu3 = { buildSRT: buildSRT, buildTXT: buildTXT, fmtSRTTime: fmtSRTTime };

  async function synthesize(requestedEp) {
    var raw = $('vieneu-text').value.trim();
    if (!raw || state.synthing) return;
    if (state.model === 'turbo') { await synthesizeTurbo(raw); return; }
    var voice = state.voices[state.selectedVoice];
    if (!voice) { $('vieneu-stats').textContent = 'Chưa chọn được giọng đọc — hãy tải lại trang.'; return; }
    var stats = $('vieneu-stats');
    state.synthing = true;
    setSpeakButtonsEnabled();
    var skippedBrokenGpu = false;
    try {
      if (!state.ready) {

        await loadModel(requestedEp);
        if (!state.ready) return;
      }
      if (state.provider !== requestedEp) {
        if (requestedEp === 'webgpu' && state.gpuBroken) {

          skippedBrokenGpu = true;
        } else {
          stats.textContent = requestedEp === 'webgpu' ? 'Đang chuyển model sang GPU…' : 'Đang chuyển model sang CPU…';
          progSim(stats.textContent);
          await switchEngine(requestedEp);
        }
      }
      await runSynth(raw, voice, false);
      if (skippedBrokenGpu) stats.textContent += ' GPU đã gặp lỗi trước đó trong phiên này nên lần này đã đọc bằng CPU.';
    } catch (e) {
      if (state.provider === 'webgpu') {

        state.gpuBroken = true;
        if (window.console && console.error) console.error('[VieNeu TTS] Sinh tiếng bằng GPU gặp lỗi, tự chuyển sang CPU. Chi tiết: ' + (e.message || e));
        stats.textContent = 'GPU của máy gặp lỗi khi sinh tiếng, đã tự chuyển sang CPU để đọc tiếp…';
        progSim('GPU gặp lỗi — đang dựng lại model bằng CPU…');
        try {
          await switchEngine('wasm');
          await runSynth(raw, voice, true);
        } catch (e2) {
          if (window.console && console.error) console.error('[VieNeu TTS] Đã tự chuyển CPU nhưng vẫn lỗi. Chi tiết: ' + (e2.message || e2));
          stats.textContent = 'Lỗi khi tạo giọng đọc: ' + (e2.message || e2);
          progFail(stats.textContent);
        }
      } else {
        stats.textContent = 'Lỗi khi tạo giọng đọc: ' + (e.message || e);
        progFail(stats.textContent);
      }
    }
    state.synthing = false;
    setSpeakButtonsEnabled();
  }

  function initUI() {
    var ta = $('vieneu-text');
    var counter = $('vieneu-counter');
    function updCount() { counter.textContent = ta.value.length + ' / 1.000 ký tự'; }
    ta.addEventListener('input', function () {
      if (ta.value.length > MAX_CHARS) ta.value = ta.value.slice(0, MAX_CHARS);
      updCount();
    });
    updCount();

    $('vieneu-clear').addEventListener('click', function () { ta.value = ''; updCount(); ta.focus(); });

    var samples = document.querySelectorAll('.vieneu-sample-chip');
    for (var i = 0; i < samples.length; i++) {
      samples[i].addEventListener('click', function () {
        ta.value = this.getAttribute('data-text') || '';
        updCount(); ta.focus();
      });
    }

    var segBtns = document.querySelectorAll('#vieneu-steps button');
    for (var j = 0; j < segBtns.length; j++) {
      segBtns[j].addEventListener('click', function () {
        state.steps = parseInt(this.getAttribute('data-steps'), 10) || 16;
        for (var k = 0; k < segBtns.length; k++) segBtns[k].classList.toggle('active', segBtns[k] === this);
      });
    }

    var speedBtns = document.querySelectorAll('#vieneu-speed button');
    for (var s2 = 0; s2 < speedBtns.length; s2++) {
      speedBtns[s2].addEventListener('click', function () {
        state.speed = parseFloat(this.getAttribute('data-speed')) || 1;
        for (var k2 = 0; k2 < speedBtns.length; k2++) speedBtns[k2].classList.toggle('active', speedBtns[k2] === this);
        if (state.model === 'turbo') {
          var pl = $('vieneu-player');
          if (pl) { try { pl.playbackRate = state.speed; } catch (e) {   } }
        }
      });
    }

    $('vieneu-dl-srt').addEventListener('click', function () {
      if (state.lastCues && state.lastCues.length) downloadTextFile('doc-van-ban-vieneu.srt', buildSRT(state.lastCues));
    });
    $('vieneu-dl-txt').addEventListener('click', function () {
      if (state.lastCues && state.lastCues.length) downloadTextFile('doc-van-ban-vieneu.txt', buildTXT(state.lastCues));
    });

    $('vieneu-load').addEventListener('click', function () { if (state.model === 'turbo') loadTurbo(); else loadModel(); });
    $('vieneu-speak-cpu').addEventListener('click', function () { synthesize('wasm'); });
    $('vieneu-speak-gpu').addEventListener('click', function () { synthesize('webgpu'); });

    (async function () {
      var ok = false;
      try { ok = !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch (e) { ok = false; }
      state.gpuAvailable = ok;
      if (!ok && state.model !== 'turbo') {
        var note = $('vieneu-gpu-note');
        if (note) note.style.display = '';
      }
      setSpeakButtonsEnabled();
    })();
    $('vieneu-clear-cache').addEventListener('click', async function () {
      try {
        await caches.delete(CACHE_NAME);
        await caches.delete(TURBO_CACHE_NAME);
        $('vieneu-cache-note').textContent = 'Đã xóa model đã tải trên máy này (cả Lite 282 MB và Turbo 210 MB). Lần mở sau, model sẽ được tải lại từ đầu (các session đang chạy trong phiên này vẫn dùng tiếp đến khi tải lại trang).';
      } catch (e) {
        $('vieneu-cache-note').textContent = 'Không xóa được bộ nhớ đệm: ' + (e.message || e);
      }
    });

    var modelBtns = document.querySelectorAll('#vieneu-model button');
    for (var mb = 0; mb < modelBtns.length; mb++) {
      modelBtns[mb].addEventListener('click', function () { setModel(this.getAttribute('data-model')); });
    }
    try {
      var savedModel = localStorage.getItem(MODEL_KEY);
      if (savedModel === 'turbo' || savedModel === 'lite') state.model = savedModel;
    } catch (e) {   }
    applyModelUI();

    loadVoices();
    modelFullyCached().then(function (full) {
      if (full && !state.ready && state.model === 'lite') {
        $('vieneu-model-status').textContent = 'Model đã có sẵn trên máy này từ lần dùng trước — bấm “Nạp model” để dùng ngay, không cần tải lại.';
        $('vieneu-load').textContent = '⚡ Nạp model (đã tải sẵn trên máy)';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI);
  else initUI();
})();

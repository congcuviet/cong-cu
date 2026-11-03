document.addEventListener('DOMContentLoaded', function() {
  var $ = function(id) { return document.getElementById(id); };
  var formulaEl = $('gr2Formula'), colorEl = $('gr2Color'), hexEl = $('gr2ColorHex');
  var xMinEl = $('gr2XMin'), xMaxEl = $('gr2XMax'), yMinEl = $('gr2YMin'), yMaxEl = $('gr2YMax');
  var errEl = $('gr2Error'), compiledEl = $('gr2Compiled'), traceEl = $('gr2Trace');
  var pointsEl = $('gr2Points'), resultEl = $('gr2Result'), canvas = $('gr2Canvas');
  var radBtn = $('gr2Rad'), degBtn = $('gr2Deg');
  var angleMode = 'rad';
  var view = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
  var lastFn = null, lastSamples = [], traceX = null, drag = null, timer = null;

  /* ---------- number formatting (vi-VN, comma decimal) ---------- */
  function fmt(n, dp) {
    if (typeof dp === 'undefined') dp = 4;
    if (!isFinite(n)) return '—';
    var r = Math.abs(n) < 0.0000005 ? 0 : n;
    return r.toLocaleString('vi-VN', { maximumFractionDigits: dp });
  }
  function fmtInput(n) {
    if (!isFinite(n)) return '';
    if (Number.isInteger(n)) return String(n);
    var s = n.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('.', ',');
  }
  function parseNum(str) {
    if (str == null) return NaN;
    var s = String(str).trim().replace(/\u2212/g, '-').replace(',', '.');
    if (s === '') return NaN;
    var v = Number(s);
    return v;
  }

  /* ---------- formula normalisation (keeps old shorthand, adds prefixes) ---------- */
  function normalizeFormula(raw) {
    var s = String(raw == null ? '' : raw).trim().toLowerCase();
    s = s.replace(/\u2212/g, '-').replace(/\s+/g, '');
    s = s.replace(/^f\(x\)=/, '').replace(/^y=/, '');
    s = s.replace(/²/g, '^2').replace(/³/g, '^3');
    s = s.replace(/x(\d+)/g, 'x^$1');
    s = s.replace(/,/g, '.');
    return s;
  }

  var FN1 = ['log10', 'sinh', 'cosh', 'tanh', 'asin', 'acos', 'atan', 'sqrt', 'sin', 'cos', 'tan', 'exp', 'abs', 'log', 'ln'];
  function isFn(name) { return FN1.indexOf(name) !== -1; }

  function tokenize(s) {
    var toks = [], i = 0;
    while (i < s.length) {
      var ch = s[i];
      if ((ch >= '0' && ch <= '9') || (ch === '.' && i + 1 < s.length && s[i + 1] >= '0' && s[i + 1] <= '9')) {
        var j = i;
        while (j < s.length && ((s[j] >= '0' && s[j] <= '9') || s[j] === '.')) j++;
        var num = parseFloat(s.slice(i, j));
        if (isNaN(num)) throw new Error('Số không hợp lệ: ' + s.slice(i, j));
        toks.push({ t: 'num', v: num }); i = j;
      } else if (ch >= 'a' && ch <= 'z') {
        var k = i;
        while (k < s.length && ((s[k] >= 'a' && s[k] <= 'z') || (s[k] >= '0' && s[k] <= '9'))) k++;
        var word = s.slice(i, k);
        if (word === 'x' || word === 'pi' || word === 'e' || isFn(word)) {
          toks.push({ t: word === 'x' ? 'x' : (isFn(word) ? 'fn' : 'const'), v: word });
        } else {
          /* split glued names: log10, xsin(x) -> x * sin, sinx -> sin(x) */
          var splitToks = (function splitWord(w) {
            if (w === 'x' || w === 'pi' || w === 'e' || isFn(w)) {
              return [{ t: w === 'x' ? 'x' : (isFn(w) ? 'fn' : 'const'), v: w }];
            }
            var names = FN1.concat(['pi', 'e', 'x']).sort(function(a, b) { return b.length - a.length; });
            for (var n = 0; n < names.length; n++) {
              var nm = names[n];
              if (w.indexOf(nm) === 0 && w.length > nm.length) {
                var rest = w.slice(nm.length);
                if (/^[0-9]+$/.test(rest)) {
                  return [{ t: nm === 'x' ? 'x' : (isFn(nm) ? 'fn' : 'const'), v: nm }, { t: 'num', v: parseFloat(rest) }];
                }
                var sub = splitWord(rest);
                if (sub) return [{ t: nm === 'x' ? 'x' : (isFn(nm) ? 'fn' : 'const'), v: nm }].concat(sub);
              }
            }
            return null;
          })(word);
          if (splitToks) { for (var s2 = 0; s2 < splitToks.length; s2++) toks.push(splitToks[s2]); }
          else throw new Error('Tên không xác định: ' + word);
        }
        i = k;
      } else if ('+-*/^()'.indexOf(ch) !== -1) {
        toks.push({ t: ch === '(' ? 'lp' : (ch === ')' ? 'rp' : 'op'), v: ch }); i++;
      } else {
        throw new Error('Ký tự không hợp lệ: ' + ch);
      }
    }
    /* implicit multiplication */
    var out = [];
    for (var m = 0; m < toks.length; m++) {
      var a = toks[m], b = toks[m + 1];
      out.push(a);
      if (b) {
        var aMul = (a.t === 'num' || a.t === 'x' || a.t === 'const' || a.t === 'rp');
        var bMul = (b.t === 'x' || b.t === 'const' || b.t === 'fn' || b.t === 'lp' || b.t === 'num');
        if (aMul && bMul) out.push({ t: 'op', v: '*' });
        else if (a.t === 'fn' && b.t === 'num') out.push({ t: 'op', v: '*' });
      }
    }
    return out;
  }

  function toRPN(toks) {
    var prec = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 4 };
    var out = [], stack = [], prev = null;
    for (var i = 0; i < toks.length; i++) {
      var tk = toks[i];
      if (tk.t === 'num' || tk.t === 'x' || tk.t === 'const') { out.push(tk); }
      else if (tk.t === 'fn') { stack.push(tk); }
      else if (tk.t === 'lp') { stack.push(tk); }
      else if (tk.t === 'rp') {
        var found = false;
        while (stack.length) {
          var top = stack.pop();
          if (top.t === 'lp') { found = true; break; }
          out.push(top);
        }
        if (!found) throw new Error('Dấu đóng ngoặc thừa');
        if (stack.length && stack[stack.length - 1].t === 'fn') out.push(stack.pop());
        if (stack.length && stack[stack.length - 1].t === 'fn' && stack[stack.length - 1].v === 'neg') out.push(stack.pop());
      } else if (tk.t === 'op') {
        var unary = (tk.v === '-') && (prev === null || prev.t === 'op' || prev.t === 'lp');
        if (unary) { stack.push({ t: 'fn', v: 'neg' }); }
        else {
          while (stack.length) {
            var st = stack[stack.length - 1];
            if (st.t === 'fn' && st.v !== 'neg') { out.push(stack.pop()); continue; }
            if (st.t === 'op' && (prec[st.v] > prec[tk.v] || (prec[st.v] === prec[tk.v] && tk.v !== '^'))) { out.push(stack.pop()); continue; }
            break;
          }
          stack.push(tk);
        }
      }
      prev = tk;
    }
    while (stack.length) {
      var last = stack.pop();
      if (last.t === 'lp') throw new Error('Thiếu dấu đóng ngoặc');
      out.push(last);
    }
    return out;
  }

  function applyFn(name, a) {
    var d2r = Math.PI / 180, r2d = 180 / Math.PI;
    switch (name) {
      case 'neg': return -a;
      case 'sin': return Math.sin(angleMode === 'deg' ? a * d2r : a);
      case 'cos': return Math.cos(angleMode === 'deg' ? a * d2r : a);
      case 'tan': return Math.tan(angleMode === 'deg' ? a * d2r : a);
      case 'asin': return angleMode === 'deg' ? Math.asin(a) * r2d : Math.asin(a);
      case 'acos': return angleMode === 'deg' ? Math.acos(a) * r2d : Math.acos(a);
      case 'atan': return angleMode === 'deg' ? Math.atan(a) * r2d : Math.atan(a);
      case 'sinh': return Math.sinh(a);
      case 'cosh': return Math.cosh(a);
      case 'tanh': return Math.tanh(a);
      case 'sqrt': return a < 0 ? NaN : Math.sqrt(a);
      case 'log': case 'ln': return a <= 0 ? NaN : Math.log(a);
      case 'log10': return a <= 0 ? NaN : Math.log10(a);
      case 'exp': return Math.exp(a);
      case 'abs': return Math.abs(a);
    }
    return NaN;
  }

  function evalRPN(rpn, x) {
    var st = [];
    for (var i = 0; i < rpn.length; i++) {
      var tk = rpn[i];
      if (tk.t === 'num') st.push(tk.v);
      else if (tk.t === 'x') st.push(x);
      else if (tk.t === 'const') st.push(tk.v === 'pi' ? Math.PI : Math.E);
      else if (tk.t === 'fn') {
        if (st.length < 1) throw new Error('Biểu thức chưa hoàn chỉnh, hãy kiểm tra toán tử và dấu ngoặc.');
        st.push(applyFn(tk.v, st.pop()));
      } else if (tk.t === 'op') {
        if (st.length < 2) throw new Error('Biểu thức chưa hoàn chỉnh, hãy kiểm tra toán tử và dấu ngoặc.');
        var b = st.pop(), a = st.pop();
        if (tk.v === '+') st.push(a + b);
        else if (tk.v === '-') st.push(a - b);
        else if (tk.v === '*') st.push(a * b);
        else if (tk.v === '/') st.push(a / b);
        else if (tk.v === '^') st.push(Math.pow(a, b));
      }
    }
    if (st.length !== 1) throw new Error('Biểu thức chưa hoàn chỉnh, hãy kiểm tra toán tử và dấu ngoặc.');
    return st[0];
  }

  function compileFormula(raw) {
    var norm = normalizeFormula(raw);
    if (!norm) throw new Error('Vui lòng nhập hàm số f(x).');
    var toks = tokenize(norm);
    var display = toks.map(function(tk) {
      if (tk.t === 'num') return String(tk.v);
      if (tk.t === 'lp') return '(';
      if (tk.t === 'rp') return ')';
      return tk.v;
    }).join('');
    var rpn = toRPN(toks);
    return { norm: display, fn: function(x) { return evalRPN(rpn, x); } };
  }

  /* ---------- sampling & special points ---------- */
  function sample(fn, xMin, xMax, n) {
    var pts = [], ySpan = Math.abs(view.yMax - view.yMin) || 1;
    for (var i = 0; i <= n; i++) {
      var x = xMin + (xMax - xMin) * i / n, y = NaN;
      try { y = fn(x); } catch (e) { y = NaN; }
      var valid = isFinite(y) && Math.abs(y) <= ySpan * 50;
      pts.push({ x: x, y: y, valid: valid });
    }
    return pts;
  }
  function dedupeSorted(arr, tol) {
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      if (!out.length || Math.abs(arr[i] - out[out.length - 1]) > tol) out.push(arr[i]);
    }
    return out;
  }
  function specialPoints(fn, xMin, xMax) {
    var res = { f0: null, roots: [], extrema: [] };
    var xr = xMax - xMin;
    if (xMin <= 0 && 0 <= xMax) {
      try { var v0 = fn(0); if (isFinite(v0)) res.f0 = v0; } catch (e) {}
    }
    var n = 2000, prev = null;
    for (var i = 0; i <= n; i++) {
      var x = xMin + xr * i / n, y = NaN;
      try { y = fn(x); } catch (e) { y = NaN; }
      var cur = { x: x, y: y, valid: isFinite(y) };
      if (prev && prev.valid && cur.valid) {
        if (prev.y === 0) res.roots.push(prev.x);
        else if (prev.y * cur.y < 0 && Math.abs(prev.y) < 1e4 && Math.abs(cur.y) < 1e4) {
          var lo = prev.x, hi = cur.x, flo = prev.y, ok = true;
          for (var k = 0; k < 60; k++) {
            var mid = (lo + hi) / 2, fm = NaN;
            try { fm = fn(mid); } catch (e) { fm = NaN; }
            if (!isFinite(fm) || Math.abs(fm) > 1e6) { ok = false; break; }
            if (fm === 0) { lo = mid; hi = mid; break; }
            if (flo * fm < 0) hi = mid; else { lo = mid; flo = fm; }
          }
          if (ok) {
            var r = (lo + hi) / 2, fr = NaN;
            try { fr = fn(r); } catch (e) {}
            if (isFinite(fr) && Math.abs(fr) < 1e-2) res.roots.push(r);
          }
        }
      }
      prev = cur;
    }
    res.roots = dedupeSorted(res.roots, Math.max(xr / 200, 1e-3)).slice(0, 8);
    /* extrema: sampled-derivative sign change + parabolic refine */
    var pts = sample(fn, xMin, xMax, 2000);
    for (var j = 1; j < pts.length - 1; j++) {
      if (!pts[j - 1].valid || !pts[j].valid || !pts[j + 1].valid) continue;
      var d1 = pts[j].y - pts[j - 1].y, d2 = pts[j + 1].y - pts[j].y;
      if (d1 === 0 || d2 === 0 || d1 * d2 >= 0) continue;
      var kind = d1 > 0 ? 'max' : 'min';
      var ax = pts[j - 1].x, bx = pts[j + 1].x, fa = pts[j - 1].y, fb = pts[j].y, fc = pts[j + 1].y;
      var den = (fa - 2 * fb + fc);
      var xv = pts[j].x;
      if (den !== 0) {
        var off = 0.5 * (fa - fc) / den;
        if (Math.abs(off) <= 1) xv = pts[j].x + off * (pts[j + 1].x - pts[j].x);
      }
      var yv = NaN;
      try { yv = fn(xv); } catch (e) {}
      if (!isFinite(yv)) continue;
      if (kind === 'max' && (yv < fa || yv < fc)) continue;
      if (kind === 'min' && (yv > fa || yv > fc)) continue;
      res.extrema.push({ kind: kind, x: xv, y: yv });
    }
    var seen = [];
    res.extrema = res.extrema.filter(function(p) {
      for (var s = 0; s < seen.length; s++) if (Math.abs(p.x - seen[s]) <= Math.max(xr / 200, 1e-3)) return false;
      seen.push(p.x); return true;
    }).slice(0, 8);
    return res;
  }

  /* ---------- canvas drawing (no external library) ---------- */
  function niceStep(range, target) {
    var raw = range / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), norm = raw / mag;
    var s = norm < 1.5 ? 1 : (norm < 3.5 ? 2 : (norm < 7.5 ? 5 : 10));
    return s * mag;
  }
  function draw(fn, samples) {
    if (!canvas) return;
    var ctx = null;
    try { ctx = canvas.getContext('2d'); } catch (e) { ctx = null; }
    if (!ctx) return;
    var W = canvas.clientWidth || canvas.width, H = canvas.clientHeight || canvas.height;
    if (!W || !H) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    var px = function(x) { return (x - view.xMin) / (view.xMax - view.xMin) * W; };
    var py = function(y) { return H - (y - view.yMin) / (view.yMax - view.yMin) * H; };
    var xs = niceStep(view.xMax - view.xMin, 8), ys = niceStep(view.yMax - view.yMin, 8);
    ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = '#475569';
    var gx = Math.ceil(view.xMin / xs) * xs;
    for (var x = gx; x <= view.xMax + 1e-9; x += xs) {
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px(x), 0); ctx.lineTo(px(x), H); ctx.stroke();
      if (Math.abs(x) > xs * 0.001) ctx.fillText(fmt(x, 4), px(x) + 3, py(0) > H - 14 ? H - 4 : (py(0) < 14 ? 14 : py(0) + 12));
    }
    var gy = Math.ceil(view.yMin / ys) * ys;
    for (var y = gy; y <= view.yMax + 1e-9; y += ys) {
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, py(y)); ctx.lineTo(W, py(y)); ctx.stroke();
      if (Math.abs(y) > ys * 0.001) ctx.fillText(fmt(y, 4), px(0) > W - 44 ? W - 44 : (px(0) < 4 ? 4 : px(0) + 4), py(y) - 3);
    }
    if (view.yMin <= 0 && 0 <= view.yMax) {
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, py(0)); ctx.lineTo(W, py(0)); ctx.stroke();
    }
    if (view.xMin <= 0 && 0 <= view.xMax) {
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px(0), 0); ctx.lineTo(px(0), H); ctx.stroke();
    }
    if (samples && samples.length) {
      ctx.strokeStyle = colorEl.value || '#e05a47'; ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      var started = false, prevPt = null;
      var ySpan = view.yMax - view.yMin;
      for (var i = 0; i < samples.length; i++) {
        var p = samples[i];
        if (!p.valid) { started = false; prevPt = null; continue; }
        if (prevPt && Math.abs(p.y - prevPt.y) > ySpan * 2) { started = false; }
        var X = px(p.x), Y = py(p.y);
        if (Y < -50 || Y > H + 50) { started = false; prevPt = p; continue; }
        if (!started) { ctx.moveTo(X, Y); started = true; }
        else ctx.lineTo(X, Y);
        prevPt = p;
      }
      ctx.stroke();
    }
    if (traceX !== null && lastFn) {
      var ty = NaN;
      try { ty = lastFn(traceX); } catch (e) {}
      if (isFinite(ty) && ty >= view.yMin && ty <= view.yMax) {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.arc(px(traceX), py(ty), 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(px(traceX), py(ty), 2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  /* ---------- main redraw ---------- */
  function showError(msg) {
    errEl.textContent = '❌ Lỗi: ' + msg;
    errEl.classList.remove('hidden');
  }
  function hideError() { errEl.classList.add('hidden'); errEl.textContent = ''; }
  function syncAxisInputs() {
    xMinEl.value = fmtInput(view.xMin); xMaxEl.value = fmtInput(view.xMax);
    yMinEl.value = fmtInput(view.yMin); yMaxEl.value = fmtInput(view.yMax);
  }
  function readAxis() {
    var xm = parseNum(xMinEl.value), xx = parseNum(xMaxEl.value);
    var ym = parseNum(yMinEl.value), yx = parseNum(yMaxEl.value);
    if ([xm, xx, ym, yx].some(isNaN)) throw new Error('Giá trị giới hạn trục tọa độ không hợp lệ.');
    if (xm >= xx || ym >= yx) throw new Error('Giá trị giới hạn trục tọa độ không hợp lệ.');
    view = { xMin: xm, xMax: xx, yMin: ym, yMax: yx };
  }
  function redraw() {
    hideError();
    try { readAxis(); } catch (e) { showError(e.message); draw(null, []); return; }
    var compiled;
    try { compiled = compileFormula(formulaEl.value); }
    catch (e) {
      showError(e.message); compiledEl.textContent = '';
      pointsEl.textContent = ''; resultEl.classList.add('hidden');
      lastFn = null; lastSamples = []; traceX = null; traceEl.textContent = 'Di chuột lên đồ thị để đọc tọa độ điểm.';
      draw(null, []); return;
    }
    lastFn = compiled.fn;
    compiledEl.textContent = '⚙️ Đã chuẩn hóa thành: f(x) = ' + compiled.norm;
    lastSamples = sample(compiled.fn, view.xMin, view.xMax, 900);
    draw(compiled.fn, lastSamples);
    var sp = specialPoints(compiled.fn, view.xMin, view.xMax);
    var parts = [];
    if (sp.f0 !== null) parts.push('f(0) = ' + fmt(sp.f0, 4));
    if (sp.roots.length) parts.push('Nghiệm gần đúng: x ≈ ' + sp.roots.map(function(r) { return fmt(r, 3); }).join(', '));
    var mx = sp.extrema.filter(function(p) { return p.kind === 'max'; });
    var mn = sp.extrema.filter(function(p) { return p.kind === 'min'; });
    if (mx.length) parts.push('Cực đại gần đúng: ' + mx.map(function(p) { return '(' + fmt(p.x, 3) + '; ' + fmt(p.y, 3) + ')'; }).join(', '));
    if (mn.length) parts.push('Cực tiểu gần đúng: ' + mn.map(function(p) { return '(' + fmt(p.x, 3) + '; ' + fmt(p.y, 3) + ')'; }).join(', '));
    pointsEl.textContent = parts.length ? parts.join(' · ') : 'Không tìm thấy điểm đặc biệt trong khung này (xem giới hạn bên dưới).';
    resultEl.classList.remove('hidden');
    updateTraceLabel();
  }
  function updateTraceLabel() {
    if (traceX === null || !lastFn) { traceEl.textContent = 'Di chuột lên đồ thị để đọc tọa độ điểm.'; return; }
    var y = NaN;
    try { y = lastFn(traceX); } catch (e) {}
    traceEl.textContent = isFinite(y)
      ? 'Tại x = ' + fmt(traceX, 4) + ': f(x) = ' + fmt(y, 4)
      : 'Tại x = ' + fmt(traceX, 4) + ': f(x) không xác định';
  }
  function schedule() { if (timer) clearTimeout(timer); timer = setTimeout(redraw, 200); }
  function zoomAt(fx, fy, factor) {
    var xr = view.xMax - view.xMin, yr = view.yMax - view.yMin;
    var ax = view.xMin + fx * xr, ay = view.yMax - fy * yr;
    var nxr = xr * factor, nyr = yr * factor;
    if (nxr < 1e-9 || nxr > 1e12 || nyr < 1e-9 || nyr > 1e12) return;
    view.xMin = ax - fx * nxr; view.xMax = view.xMin + nxr;
    view.yMax = ay + fy * nyr; view.yMin = view.yMax - nyr;
    syncAxisInputs(); redraw();
  }
  function fitY() {
    if (!lastFn) return;
    var pts = sample(lastFn, view.xMin, view.xMax, 900);
    var lo = Infinity, hi = -Infinity;
    pts.forEach(function(p) { if (p.valid && isFinite(p.y) && Math.abs(p.y) < 1e12) { if (p.y < lo) lo = p.y; if (p.y > hi) hi = p.y; } });
    if (!isFinite(lo) || !isFinite(hi)) return;
    var pad = (hi - lo) * 0.1 || 1;
    view.yMin = lo - pad; view.yMax = hi + pad;
    syncAxisInputs(); redraw();
  }

  /* ---------- events ---------- */
  colorEl.addEventListener('input', function() {
    hexEl.textContent = colorEl.value.toUpperCase();
    if (lastFn) draw(lastFn, lastSamples);
  });
  formulaEl.addEventListener('input', schedule);
  formulaEl.addEventListener('change', redraw);
  formulaEl.addEventListener('keydown', function(e) { if (e.key === 'Enter') redraw(); });
  [xMinEl, xMaxEl, yMinEl, yMaxEl].forEach(function(el) {
    el.addEventListener('input', schedule);
    el.addEventListener('change', redraw);
  });
  document.querySelectorAll('.gr2-chip').forEach(function(ch) {
    ch.addEventListener('click', function() { formulaEl.value = ch.getAttribute('data-fn'); redraw(); });
  });
  function setAngle(mode) {
    angleMode = mode;
    radBtn.classList.toggle('active', mode === 'rad'); degBtn.classList.toggle('active', mode === 'deg');
    radBtn.setAttribute('aria-pressed', mode === 'rad' ? 'true' : 'false');
    degBtn.setAttribute('aria-pressed', mode === 'deg' ? 'true' : 'false');
    redraw();
  }
  radBtn.addEventListener('click', function() { setAngle('rad'); });
  degBtn.addEventListener('click', function() { setAngle('deg'); });
  $('gr2ZoomIn').addEventListener('click', function() { zoomAt(0.5, 0.5, 0.8); });
  $('gr2ZoomOut').addEventListener('click', function() { zoomAt(0.5, 0.5, 1.25); });
  $('gr2Fit').addEventListener('click', fitY);
  $('gr2Reset').addEventListener('click', function() {
    view = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
    syncAxisInputs(); redraw();
  });
  function canvasPos(e) {
    var r = canvas.getBoundingClientRect();
    var cx = (e.clientX - r.left), cy = (e.clientY - r.top);
    return { fx: r.width ? cx / r.width : 0, fy: r.height ? cy / r.height : 0, x: view.xMin + (r.width ? cx / r.width : 0) * (view.xMax - view.xMin) };
  }
  canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    var p = canvasPos(e);
    zoomAt(p.fx, p.fy, e.deltaY < 0 ? 0.9 : 1.1);
  }, { passive: false });
  canvas.addEventListener('pointerdown', function(e) {
    drag = { x: e.clientX, y: e.clientY, view: { xMin: view.xMin, xMax: view.xMax, yMin: view.yMin, yMax: view.yMax } };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  });
  canvas.addEventListener('pointermove', function(e) {
    var p = canvasPos(e);
    traceX = p.x; updateTraceLabel();
    if (lastFn) draw(lastFn, lastSamples);
    if (!drag) return;
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    var xr = drag.view.xMax - drag.view.xMin, yr = drag.view.yMax - drag.view.yMin;
    view.xMin = drag.view.xMin - dx / r.width * xr;
    view.xMax = view.xMin + xr;
    view.yMin = drag.view.yMin + dy / r.height * yr;
    view.yMax = view.yMin + yr;
    syncAxisInputs();
    if (lastFn) { lastSamples = sample(lastFn, view.xMin, view.xMax, 900); draw(lastFn, lastSamples); }
  });
  function endDrag() {
    if (drag) { drag = null; syncAxisInputs(); redraw(); }
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', function() { traceX = null; updateTraceLabel(); if (lastFn) draw(lastFn, lastSamples); });
  window.addEventListener('resize', schedule);

  /* ---------- PNG export (direct canvas, no SVG serialisation) ---------- */
  $('gr2Download').addEventListener('click', function() {
    var ctx = null;
    try { ctx = canvas.getContext('2d'); } catch (e) { ctx = null; }
    if (!ctx || !lastFn || !lastSamples.length) { showError('Chưa có đồ thị nào để tải.'); return; }
    var f = (canvas.clientWidth && canvas.width) ? canvas.width / canvas.clientWidth : 1;
    var extra = 0;
    var withFn = $('gr2ChkFormula').checked, withGrid = $('gr2ChkGrid').checked;
    if (withFn) extra += 35 * f;
    if (withGrid) extra += 25 * f;
    if (extra > 0) extra += 20 * f;
    var out = document.createElement('canvas');
    out.width = canvas.width; out.height = Math.round(canvas.height + extra);
    var octx = out.getContext('2d');
    if (!octx) { showError('Trình duyệt này không hỗ trợ xuất ảnh.'); return; }
    octx.fillStyle = '#ffffff'; octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(canvas, 0, 0);
    if (extra > 0) {
      var cy = canvas.height + 25 * f;
      octx.textAlign = 'center';
      if (withFn) {
        octx.fillStyle = '#111111'; octx.font = 'bold ' + Math.round(20 * f) + 'px Arial, sans-serif';
        octx.fillText('Hàm số: f(x) = ' + formulaEl.value.trim(), out.width / 2, cy);
        cy += 30 * f;
      }
      if (withGrid) {
        octx.fillStyle = '#555555'; octx.font = Math.round(15 * f) + 'px Arial, sans-serif';
        octx.fillText('Trục X: [' + fmtInput(view.xMin) + ', ' + fmtInput(view.xMax) + '] | Trục Y: [' + fmtInput(view.yMin) + ', ' + fmtInput(view.yMax) + ']', out.width / 2, cy);
      }
    }
    var a = document.createElement('a');
    a.download = 'do-thi-ham-so.png'; a.href = out.toDataURL('image/png');
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  });

  /* ---------- copy compiled ---------- */
  $('gr2Copy').addEventListener('click', function() {
    var text = compiledEl.textContent.replace(/^⚙️ Đã chuẩn hóa thành: /, '');
    if (!text) text = 'f(x) = ' + formulaEl.value.trim();
    var toast = $('gr2Toast');
    function done() { toast.classList.add('show'); setTimeout(function() { toast.classList.remove('show'); }, 1800); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function() { done(); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); done();
    }
  });

  redraw();
});

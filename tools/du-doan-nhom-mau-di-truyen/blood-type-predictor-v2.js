document.addEventListener('DOMContentLoaded', function() {
  var ABO_GENO = { A: [['A', 'A'], ['A', 'O']], B: [['B', 'B'], ['B', 'O']], AB: [['A', 'B']], O: [['O', 'O']] };
  var RH_GENO = { '+': [['D', 'D'], ['D', 'd']], '-': [['d', 'd']] };
  var ABO_DISP = { A: 'Iᴬ', B: 'Iᴮ', O: 'i' };
  var ORDER = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  var state = { dad: { abo: 'A', rh: '+' }, mum: { abo: 'O', rh: '-' } };
  var heroEl = document.getElementById('bt2-hero');
  var pairEl = document.getElementById('bt2-pair');
  var possEl = document.getElementById('bt2-possible');
  var impEl = document.getElementById('bt2-impossible');
  var detailEl = document.getElementById('bt2-detail');
  var toastEl = document.getElementById('bt2-toast');
  var copyText = '';

  function pheno(a1, a2) {
    var hasA = a1 === 'A' || a2 === 'A';
    var hasB = a1 === 'B' || a2 === 'B';
    if (hasA && hasB) return 'AB';
    if (hasA) return 'A';
    if (hasB) return 'B';
    return 'O';
  }
  function genoStr(alleles) { return alleles.map(function(a) { return ABO_DISP[a]; }).join(''); }
  function passAlleles(phen) {
    var out = [];
    ABO_GENO[phen].forEach(function(g) { g.forEach(function(a) { if (out.indexOf(a) < 0) out.push(a); }); });
    return out;
  }
  function compute() {
    var aboSet = {}, rhSet = {};
    ABO_GENO[state.dad.abo].forEach(function(g1) {
      ABO_GENO[state.mum.abo].forEach(function(g2) {
        g1.forEach(function(a1) { g2.forEach(function(a2) { aboSet[pheno(a1, a2)] = true; }); });
      });
    });
    RH_GENO[state.dad.rh].forEach(function(g1) {
      RH_GENO[state.mum.rh].forEach(function(g2) {
        g1.forEach(function(a1) { g2.forEach(function(a2) { rhSet[(a1 === 'D' || a2 === 'D') ? '+' : '-'] = true; }); });
      });
    });
    var aboOrder = ['A', 'B', 'AB', 'O'];
    var aboPos = Object.keys(aboSet).sort(function(x, y) { return aboOrder.indexOf(x) - aboOrder.indexOf(y); });
    var rhPos = Object.keys(rhSet).sort(function(x, y) { return (x === '+' ? 0 : 1) - (y === '+' ? 0 : 1); });
    var poss = [];
    aboPos.forEach(function(a) { rhPos.forEach(function(r) { poss.push(a + r); }); });
    var imp = ORDER.filter(function(t) { return poss.indexOf(t) < 0; });
    poss.sort(function(x, y) { return ORDER.indexOf(x) - ORDER.indexOf(y); });
    return { aboPos: aboPos, rhPos: rhPos, poss: poss, imp: imp };
  }
  function rhNote() {
    if (state.dad.rh === '-' && state.mum.rh === '-') return 'Cả hai đều Rh− nên con chỉ có thể Rh−.';
    if (state.dad.rh === '+' && state.mum.rh === '+') return 'Con Rh− vẫn có thể xảy ra, nhưng chỉ khi cả hai bố mẹ đều mang kiểu gen Dd (dị hợp).';
    return 'Con Rh− có thể xảy ra khi người Rh+ mang kiểu gen Dd (dị hợp).';
  }
  function render() {
    var r = compute();
    var dadFull = state.dad.abo + state.dad.rh, mumFull = state.mum.abo + state.mum.rh;
    heroEl.textContent = 'Con có thể mang ' + r.poss.length + ' nhóm máu';
    pairEl.textContent = 'Bố ' + dadFull + ' × Mẹ ' + mumFull + '  ·  ABO có thể: ' + r.aboPos.join(', ') + '  ·  Rh có thể: ' + r.rhPos.join(', ');
    possEl.innerHTML = r.poss.map(function(t) { return '<span class="bt2-tag">' + t + '</span>'; }).join('');
    impEl.innerHTML = r.imp.length ? r.imp.map(function(t) { return '<span class="bt2-tag bt2-tag-no">' + t + '</span>'; }).join('') : '<span class="bt2-tag-none">Không có (Tất cả đều có thể)</span>';
    detailEl.innerHTML =
      '<p><strong>Bố (' + dadFull + '):</strong> kiểu gen có thể là ' + ABO_GENO[state.dad.abo].map(genoStr).join(' hoặc ') + '; có thể truyền alen ' + passAlleles(state.dad.abo).map(function(a) { return ABO_DISP[a]; }).join(', ') + '.</p>' +
      '<p><strong>Mẹ (' + mumFull + '):</strong> kiểu gen có thể là ' + ABO_GENO[state.mum.abo].map(genoStr).join(' hoặc ') + '; có thể truyền alen ' + passAlleles(state.mum.abo).map(function(a) { return ABO_DISP[a]; }).join(', ') + '.</p>' +
      '<p><strong>Rh:</strong> ' + rhNote() + '</p>' +
      '<p>Đổi bố và mẹ cho nhau không làm thay đổi kết quả, vì mỗi người đều truyền một alen cho con.</p>';
    copyText = 'Bố ' + dadFull + ' x Mẹ ' + mumFull + ' -> Con có thể: ' + r.poss.join(', ') + '; Không thể: ' + (r.imp.length ? r.imp.join(', ') : 'không có (tất cả đều có thể)');
    document.querySelectorAll('[data-bt2-group]').forEach(function(btn) {
      var parts = btn.getAttribute('data-bt2-group').split('-');
      var who = parts[0] === 'dad' ? state.dad : state.mum;
      var key = parts[1] === 'abo' ? 'abo' : 'rh';
      var on = who[key] === btn.getAttribute('data-bt2-value');
      btn.classList.toggle('bt2-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  document.querySelectorAll('[data-bt2-group]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var parts = btn.getAttribute('data-bt2-group').split('-');
      var who = parts[0] === 'dad' ? state.dad : state.mum;
      who[parts[1] === 'abo' ? 'abo' : 'rh'] = btn.getAttribute('data-bt2-value');
      toastEl.textContent = '';
      render();
    });
  });
  document.querySelectorAll('[data-bt2-ex]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var v = btn.getAttribute('data-bt2-ex').split('|');
      state.dad = { abo: v[0], rh: v[1] }; state.mum = { abo: v[2], rh: v[3] };
      toastEl.textContent = '';
      render();
    });
  });
  document.getElementById('bt2-reset').addEventListener('click', function() {
    state.dad = { abo: 'A', rh: '+' }; state.mum = { abo: 'O', rh: '-' };
    toastEl.textContent = '';
    render();
  });
  document.getElementById('bt2-copy').addEventListener('click', function() {
    function done() { toastEl.textContent = 'Đã sao chép!'; }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(copyText).then(done, function() { toastEl.textContent = copyText; }); }
    else { toastEl.textContent = copyText; }
  });
  render();
});

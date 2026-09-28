(function () {
'use strict';
var KS = 'ftthLossChallengeStudent', KG = 'ftthLossChallengeGame';
var ATT = 0.35, CONN = 0.25, TX = 7;
var $ = function (s) { return document.querySelector(s); };
var rnd = function (a) { return a[Math.floor(Math.random() * a.length)]; };
var shuf = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
var r3 = function (n) { return Math.round(n * 1000) / 1000; };
var fmt = function (n, d) { return (+n).toFixed(d === undefined ? 2 : d).replace('.', ','); };
var esc = function (s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
var num = function (v) { v = String(v).trim(); return /^[+-]?\d+([.,]\d+)?$/.test(v) ? parseFloat(v.replace(',', '.')) : NaN; };
function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function del(k) { try { localStorage.removeItem(k); } catch (e) {} }

var PAIRS = [
  { id: 'cable', img: 'cable.svg', label: 'Atenuasi / panjang kabel', val: '0,35 dB/km' },
  { id: 'splice', img: 'splice.svg', label: 'Splice', val: '0,1 dB' },
  { id: 'conn', img: 'connector.svg', label: 'Konektor', val: '0,25 dB' },
  { id: 's8', img: 'splitter1to8.svg', label: 'Splitter 1:8', val: '10,5 dB' },
  { id: 's4', img: 'splitter1to4.svg', label: 'Splitter 1:4', val: '7,2 dB' },
  { id: 'olt', img: 'olt.svg', label: 'Output OLT', val: '+7 dBm' }
];
var EVEN = [['Jakarta', 'Bandung', 150], ['Bandung', 'Cirebon', 120], ['Cirebon', 'Tegal', 140], ['Semarang', 'Solo', 110], ['Solo', 'Yogyakarta', 70], ['Yogyakarta', 'Magelang', 80], ['Surabaya', 'Malang', 90], ['Malang', 'Kediri', 100], ['Jakarta', 'Cirebon', 220], ['Surabaya', 'Jember', 200]];
var DEC = [['Jakarta', 'Bogor', 127.5], ['Bandung', 'Sumedang', 82.5], ['Semarang', 'Demak', 62.5]];
var L4 = [{ ratio: '1:8', loss: 10.5 }, { ratio: '1:4', loss: 7.2 }, { ratio: '1:8', loss: 10.5 }];
var STEPS = ['LEVEL 1', 'LEVEL 2', 'LEVEL 3', 'LEVEL 4'];

var S = load(KS), G = null, L1 = null, busy = false;
if (!S || !S.className || !S.fullName || S.fullName.trim().split(/\s+/).length < 2) S = null;
if (S) { G = load(KG); if (!validGame(G)) G = newGame(); }

function validGame(g) { return g && g.owner === (S && S.fullName + '|' + S.className) && g.step >= 1 && g.step <= 5 && (g.step < 5 || g.completed) && Array.isArray(g.q) && g.q.length === 4; }
function newGame() {
  var q = shuf(EVEN).slice(0, 3).concat([rnd(DEC)]);
  return { owner: S.fullName + '|' + S.className, step: 1, attempts: 1, matchAttempts: 0, q: q, qi: 0, cableLoss: 0, connectorCount: 0, q3i: 0, q3s: 0, connectorLoss: 0, l4: rnd(L4), splitterRatio: '', splitterLoss: 0, totalLoss: 0, rx: 0, score: 0, completed: false };
}
function save() { store(KG, G); }

function render() {
  busy = false;
  var top = $('#top'), app = $('#app');
  if (!S) { top.hidden = true; return loginView(app); }
  top.hidden = false;
  $('#hName').textContent = S.fullName; $('#hClass').textContent = 'Kelas: ' + S.className;
  $('#prog').innerHTML = STEPS.map(function (s, i) {
    var c = G.step > i + 1 ? 'done' : G.step === i + 1 ? 'cur' : '';
    return '<li class="' + c + '">' + (c === 'done' ? '✓ ' : '') + s + '</li>';
  }).join('');
  window.scrollTo(0, 0); app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter');
  [null, l1View, l2View, l3View, l4View, resultView][G.step](app);
}

function loginView(app) {
  app.innerHTML = '<div class="card"><h1>FTTH LOSS CHALLENGE</h1><p class="sub">Mission Individual — Link Budget Fiber Optic</p>' +
    '<label for="cls">KELAS</label><input id="cls" placeholder="contoh: XI TEL 1" autocomplete="off">' +
    '<label for="nm">NAMA LENGKAP</label><input id="nm" placeholder="contoh: Assa Rohana" autocomplete="off">' +
    '<div class="fb" id="fb"></div><p><button id="go" type="button">MASUK &amp; MULAI</button></p></div>';
  var go = function () {
    var c = $('#cls').value.trim().replace(/\s+/g, ' '), n = $('#nm').value.trim().replace(/\s+/g, ' '), fb = $('#fb');
    fb.className = 'fb bad';
    if (!c) return fb.textContent = 'Kelas wajib diisi.';
    if (!n) return fb.textContent = 'Nama lengkap wajib diisi.';
    if (n.split(' ').length < 2) return fb.textContent = 'Tulis nama lengkap (minimal 2 kata).';
    S = { className: c, fullName: n, loginAt: new Date().toISOString() };
    store(KS, S); G = newGame(); save(); render();
  };
  $('#go').onclick = go;
  app.onkeydown = function (e) { if (e.key === 'Enter') go(); };
}

/* ---------- LEVEL 1 ---------- */
function l1View(app) {
  L1 = { order: shuf(PAIRS.map(function (p) { return p.id; })), torder: shuf(PAIRS.map(function (p) { return p.id; })), placed: {}, locked: {}, wrong: {}, sel: null, msg: '', cls: '', fx: { stamp: {}, shake: {} } };
  app.onkeydown = null; drawL1(app);
}
function pcard(id) {
  var p = PAIRS.filter(function (x) { return x.id === id; })[0], lk = L1.locked[id];
  return '<div class="pc' + (L1.sel === id ? ' sel' : '') + (lk ? ' lk' : '') + (L1.fx.drop === id ? ' drop' : '') + (L1.fx.stamp[id] ? ' stamp' : '') + '" data-c="' + id + '" draggable="' + !lk + '"><img src="assets/' + p.img + '" alt="' + p.label + '"><span>' + p.label + '</span></div>';
}
function drawL1(app) {
  app = app || $('#app');
  var tOf = {}; for (var c in L1.placed) tOf[L1.placed[c]] = c;
  var pool = L1.order.filter(function (c) { return !L1.placed[c]; });
  var tg = L1.torder.map(function (t) {
    var p = PAIRS.filter(function (x) { return x.id === t; })[0];
    return '<div class="tgt' + (L1.wrong[t] ? ' bad' : '') + (L1.fx.shake[t] ? ' shake' : '') + '" data-t="' + t + '"><b>' + p.val + '</b><div class="slot">' + (tOf[t] ? pcard(tOf[t]) : 'Taruh gambar di sini') + '</div></div>';
  }).join('');
  app.innerHTML = '<div class="card"><h2>LEVEL 1 — Cocokkan Jenis Loss</h2>' +
    '<p class="sub">Seret gambar ke nilai yang sesuai. Di HP: ketuk gambar, lalu ketuk kotak nilainya.</p>' +
    '<div class="l1"><div><div class="zone" id="pool">' + (pool.length ? pool.map(pcard).join('') : '<em>Semua gambar sudah ditempatkan.</em>') + '</div></div><div>' + tg + '</div></div>' +
    '<div class="tools"><button id="chk" type="button">PERIKSA PASANGAN</button><span class="att' + (L1.fx.bump ? ' bump' : '') + '">Percobaan: ' + G.attempts + '</span></div>' +
    '<div class="fb ' + L1.cls + '" id="fb">' + L1.msg + '</div></div>';
  app.querySelectorAll('.pc').forEach(function (el) {
    var id = el.dataset.c; if (L1.locked[id]) return;
    el.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; });
    el.addEventListener('click', function (e) { e.stopPropagation(); L1.sel = L1.sel === id ? null : id; drawL1(); });
  });
  app.querySelectorAll('.tgt').forEach(function (el) {
    var t = el.dataset.t;
    el.addEventListener('dragover', function (e) { e.preventDefault(); el.classList.add('over'); });
    el.addEventListener('dragleave', function () { el.classList.remove('over'); });
    el.addEventListener('drop', function (e) { e.preventDefault(); var id = e.dataTransfer.getData('text/plain'); if (id) place(id, t); });
    el.addEventListener('click', function () { if (L1.sel) place(L1.sel, t); });
  });
  var pl = $('#pool');
  pl.addEventListener('dragover', function (e) { e.preventDefault(); });
  pl.addEventListener('drop', function (e) { e.preventDefault(); unplace(e.dataTransfer.getData('text/plain')); });
  pl.addEventListener('click', function () { if (L1.sel) unplace(L1.sel); });
  $('#chk').onclick = checkL1; L1.fx = { stamp: {}, shake: {} };
}
function place(c, t) {
  if (L1.locked[c]) return;
  var occ = null; for (var k in L1.placed) if (L1.placed[k] === t) occ = k;
  if (occ && L1.locked[occ]) return;
  if (occ) delete L1.placed[occ];
  L1.placed[c] = t; L1.fx.drop = c; L1.sel = null; L1.wrong = {}; L1.msg = ''; L1.cls = ''; drawL1();
}
function unplace(c) { if (!c || L1.locked[c]) return; delete L1.placed[c]; L1.sel = null; L1.wrong = {}; L1.msg = ''; L1.cls = ''; drawL1(); }
function checkL1() {
  if (busy) return;
  if (Object.keys(L1.placed).length < PAIRS.length) { L1.msg = 'Tempatkan semua gambar terlebih dahulu.'; L1.cls = 'bad'; return drawL1(); }
  var bad = [];
  L1.order.forEach(function (c) {
    if (L1.locked[c]) return;
    if (L1.placed[c] === c) { L1.locked[c] = true; L1.fx.stamp[c] = 1; } else { bad.push(L1.placed[c]); delete L1.placed[c]; }
  });
  L1.sel = null;
  if (!bad.length) {
    G.matchAttempts = G.attempts; G.step = 2; save(); busy = true;
    L1.msg = '✓ Semua pasangan benar dalam ' + G.attempts + ' percobaan.'; L1.cls = 'ok'; drawL1(); confetti(50);
    setTimeout(render, 1600);
  } else {
    G.attempts++; save(); L1.fx.bump = true; bad.forEach(function (t) { L1.wrong[t] = true; L1.fx.shake[t] = true; });
    L1.msg = '✗ Ada pasangan yang belum tepat (kotak merah). Perbaiki lalu periksa lagi.'; L1.cls = 'bad'; drawL1();
  }
}

/* ---------- ANSWER HELPER ---------- */
function bindAnswer(exp, okMsg, badMsg, next) {
  var inp = $('#ans'), fb = $('#fb'), btn = $('#chk');
  var go = function () {
    if (busy) return;
    var v = num(inp.value);
    if (isNaN(v)) { fb.className = 'fb bad'; fb.textContent = 'Masukkan angka terlebih dahulu.'; return; }
    if (Math.abs(v - exp) <= 0.001) {
      fb.className = 'fb ok'; fb.textContent = '✓ ' + okMsg; busy = true; btn.disabled = inp.disabled = true; inp.classList.add('okin'); confetti(18); setTimeout(next, 1200);
    } else { fb.className = 'fb bad'; fb.textContent = '✗ ' + badMsg; fx(fb, 'shake'); fx(inp, 'shake'); }
  };
  btn.onclick = go; inp.onkeydown = function (e) { if (e.key === 'Enter') go(); }; inp.focus();
}
var ansRow = function (unit) { return '<div class="row"><input id="ans" inputmode="decimal" autocomplete="off" placeholder="Jawaban (' + unit + ')"><button id="chk" type="button">PERIKSA</button></div><div class="fb" id="fb"></div>'; };

/* ---------- LEVEL 2 ---------- */
function l2View(app) {
  var q = G.q[G.qi], exp = r3(ATT * q[2]), dec = G.qi === 3;
  app.innerHTML = '<div class="card"><h2>LEVEL 2 — ATENUASI KABEL</h2><p class="sub">Soal ' + (G.qi + 1) + ' dari 4' + (dec ? ' (bilangan desimal)' : '') + '</p>' +
    '<div class="facts"><div class="fact"><small>Rute</small><b>' + q[0] + ' → ' + q[1] + '</b></div><div class="fact"><small>Jarak</small><b>' + fmt(q[2], dec ? 1 : 0) + ' km</b></div><div class="fact"><small>Atenuasi</small><b>0,35 dB/km</b></div></div>' +
    '<div class="formula">Loss = 0,35 × jarak</div><p>Berapa loss kabel dari ' + q[0] + ' ke ' + q[1] + '?</p>' + ansRow('dB') + '</div>';
  bindAnswer(exp, 'Benar! Loss = ' + fmt(exp, 3) + ' dB.', 'Belum tepat. Hitung 0,35 × ' + fmt(q[2], dec ? 1 : 0) + ' lalu coba lagi.', function () {
    G.cableLoss = r3(G.cableLoss + exp); G.qi++;
    if (G.qi >= 4) G.step = 3; save(); render();
  });
}

/* ---------- LEVEL 3 ---------- */
var L3 = [{ img: 'level3-konektor.png', n: 2 }, { img: '32.png', n: 4 }, { img: '33.png', n: 6 }];
function l3View(app) {
  var i = G.q3i | 0, q = L3[i], loss = r3(q.n * CONN);
  var dots = L3.map(function (x, k) { return '<li class="' + (k < i ? 'done' : k === i ? 'cur' : '') + '">' + (k < i ? '✓ ' : '') + 'Soal ' + (k + 1) + '</li>'; }).join('');
  app.innerHTML = '<div class="card lvl3"><h2>LEVEL 3 — HITUNG KONEKTOR</h2><ol class="qprog">' + dots + '</ol>' +
    '<p class="sub">Soal ' + (i + 1) + ' dari ' + L3.length + ' · Hitung seluruh konektor biru untuk <b>1 core</b> saja, lalu hitung total loss-nya (loss per konektor = 0,25 dB).</p>' +
    '<img src="assets/' + q.img + '" alt="Soal konektor ' + (i + 1) + '">' +
    '<div class="two"><div><label for="ans">Jumlah konektor</label><input id="ans" inputmode="numeric" autocomplete="off" placeholder="buah"></div>' +
    '<div><label for="ans2">Total loss</label><input id="ans2" inputmode="decimal" autocomplete="off" placeholder="dB"></div></div>' +
    '<button id="chk" type="button">PERIKSA</button><div class="fb" id="fb"></div></div>';
  var a = $('#ans'), b = $('#ans2'), fb = $('#fb'), btn = $('#chk');
  var go = function () {
    if (busy) return;
    var v1 = num(a.value), v2 = num(b.value);
    var bad = function (m, el) { fb.className = 'fb bad'; fb.textContent = '✗ ' + m; fx(fb, 'shake'); fx(el, 'shake'); };
    if (isNaN(v1) || isNaN(v2)) return bad('Isi jumlah konektor dan total loss terlebih dahulu.', isNaN(v1) ? a : b);
    var ok1 = Math.abs(v1 - q.n) <= 0.001, ok2 = Math.abs(v2 - loss) <= 0.001;
    a.classList.toggle('okin', ok1); b.classList.toggle('okin', ok2);
    if (!ok1) return bad('Belum tepat. Hitung konektor biru untuk 1 core saja.', a);
    if (!ok2) return bad('Jumlah konektor sudah benar, tetapi total loss belum tepat. Kalikan jumlah konektor dengan 0,25 dB.', b);
    fb.className = 'fb ok'; fb.textContent = '✓ Benar! ' + q.n + ' konektor × 0,25 = ' + fmt(loss) + ' dB.';
    busy = true; btn.disabled = a.disabled = b.disabled = true; confetti(18);
    setTimeout(function () {
      G.connectorCount = (G.connectorCount | 0) + q.n; G.connectorLoss = r3((G.connectorLoss || 0) + loss); G.q3i = i + 1;
      if (G.q3i >= L3.length) G.step = 4; save(); render();
    }, 1200);
  };
  btn.onclick = go; a.onkeydown = b.onkeydown = function (e) { if (e.key === 'Enter') go(); }; a.focus();
}

/* ---------- LEVEL 4 ---------- */
function l4View(app) {
  var q = G.l4, exp = r3(TX - q.loss);
  app.innerHTML = '<div class="card"><h2>LEVEL 4 — SPLITTER + OLT</h2><p class="sub">Hitung daya setelah melewati splitter.</p>' +
    '<div class="facts"><div class="fact"><small>Output OLT</small><b>+7 dBm</b></div><div class="fact"><small>Splitter</small><b>' + q.ratio + '</b></div><div class="fact"><small>Splitter loss</small><b>' + fmt(q.loss, 1) + ' dB</b></div></div>' +
    '<div class="formula">Power after splitter = Output OLT − Splitter Loss</div><p>Berapa daya setelah melewati splitter?</p>' + ansRow('dBm') + '</div>';
  bindAnswer(exp, 'Benar! Daya setelah splitter = ' + fmt(exp, 1) + ' dBm.', 'Belum tepat. Kurangi Output OLT dengan splitter loss.', function () {
    G.splitterRatio = q.ratio; G.splitterLoss = q.loss; G.score = Math.max(60, 100 - 5 * (G.matchAttempts - 1)); G.completed = true; G.step = 5; save(); render();
  });
}

/* ---------- RESULT ---------- */
function resultView(app) {
  var cell = function (t, b, w) { return '<div' + (w ? ' class="wide"' : '') + '><small>' + t + '</small>' + b + '</div>'; };
  app.innerHTML = '<div class="card res"><div class="sub">FTTH LOSS CHALLENGE — HASIL SISWA</div><h1>MISSION COMPLETE</h1><div class="grid">' +
    cell('Kelas', esc(S.className)) + cell('Nama', esc(S.fullName)) +
    cell('Level 1', G.matchAttempts + ' percobaan') + cell('Level 2', '4 soal selesai<br>Cable Loss: ' + fmt(G.cableLoss, 3) + ' dB') +
    cell('Level 3', G.connectorCount + ' konektor (3 soal)<br>Connector Loss: ' + fmt(G.connectorLoss) + ' dB') + cell('Level 4', 'Splitter ' + G.splitterRatio + '<br>Splitter Loss: ' + fmt(G.splitterLoss) + ' dB') +
    '</div>' +
    '<div class="score">SKOR: <span id="sc">0</span> / 100</div><div class="note">Screenshot halaman ini untuk dikumpulkan kepada guru.</div></div>';
  countUp($('#sc'), G.score); setTimeout(function () { confetti(90); }, 600);
}

function fx(el, c) { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); }
function countUp(el, to) { var t0 = performance.now(); (function f(t) { var k = Math.min(1, (t - t0) / 1000); el.textContent = Math.round(to * k); if (k < 1) requestAnimationFrame(f); })(t0); }
function confetti(n) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var box = document.createElement('div'); box.className = 'confetti';
  var cols = ['#1d5fd1', '#12805c', '#f5a300', '#0b2545', '#6ea2f5'];
  for (var i = 0; i < n; i++) {
    var p = document.createElement('i');
    p.style.cssText = 'left:' + Math.random() * 100 + '%;background:' + rnd(cols) + ';--dx:' + (Math.random() * 200 - 100) + 'px;--r:' + (Math.random() * 720 - 360) + 'deg;animation-duration:' + (1.6 + Math.random() * 1.4) + 's;animation-delay:' + Math.random() * .3 + 's';
    box.appendChild(p);
  }
  document.body.appendChild(box); setTimeout(function () { box.remove(); }, 3600);
}
$('#switchBtn').onclick = function () {
  if (!confirm('Ganti siswa? Data login dan progres di perangkat ini akan dihapus.')) return;
  del(KS); del(KG); S = null; G = null; render();
};
render();
})();

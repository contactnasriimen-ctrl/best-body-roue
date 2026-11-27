// Logique du jeu « الروّة متاع الزهر » : tirage pondéré (config.js), animation du lancer avec tics,
// une partie par jour et par téléphone (localStorage), code de gain unique, envoi WhatsApp/Instagram/Messenger.
(function () {
  const CFG = window.ROUE_CONFIG, W = window.BBWheel;
  const SEG = W.SEGMENTS, N = SEG.length, STEP = 360 / N;
  const $ = (id) => document.getElementById(id);
  const KEY = 'bb-roue-v1';

  // ---------- état sauvegardé ----------
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} },
  };
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // ---------- roue ----------
  $('stage').innerHTML = W.svg({ idPrefix: 'p', images: { bag: 'assets/bag.webp', jar: 'assets/jar.webp', hub: 'assets/logo-bb.webp' } });
  const svgEl = $('stage').querySelector('svg'), rotor = svgEl.querySelector('.rotor'), flap = svgEl.querySelector('.flap');
  svgEl.setAttribute('role', 'img');
  svgEl.setAttribute('aria-label', 'روّة فيها Gold Lean Mass و Gold Creatine');
  let theta = 0;
  const setRotor = (a) => rotor.setAttribute('transform', `rotate(${a.toFixed(3)})`);
  setRotor(theta);

  // ampoules : clignotent doucement au repos, vite pendant le lancer, toutes allumées en cas de gain
  let bulbMode = 'idle', bulbPhase = 0, lastBulb = 0;
  function bulbs(now) {
    const period = bulbMode === 'spin' ? 110 : bulbMode === 'win' ? 160 : 620;
    if (now - lastBulb > period) {
      lastBulb = now; bulbPhase ^= 1;
      svgEl.classList.remove('on0', 'on1', 'all');
      svgEl.classList.add(bulbMode === 'win' ? (bulbPhase ? 'all' : 'on0') : 'on' + bulbPhase);
    }
    requestAnimationFrame(bulbs);
  }
  requestAnimationFrame(bulbs);

  // ---------- sons (Web Audio, créés au premier geste) ----------
  let ac = null, muted = false;
  try { muted = localStorage.getItem('bb-roue-mute') === '1'; } catch {}
  const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 6 6M22 9l-6 6"/></svg>';
  const muteBtn = $('mute');
  const paintMute = () => { muteBtn.innerHTML = muted ? ICON_OFF : ICON_ON; muteBtn.setAttribute('aria-pressed', String(muted)); };
  paintMute();
  muteBtn.addEventListener('click', () => { muted = !muted; try { localStorage.setItem('bb-roue-mute', muted ? '1' : '0'); } catch {} paintMute(); });
  function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch {} } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
  function tone(f, t0, len, type = 'sine', gain = 0.2, f1) {
    if (!ac || muted) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + len);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + len + 0.02);
  }
  const tick = () => { if (ac) tone(2100, ac.currentTime, 0.035, 'square', 0.05, 900); };
  const winSound = () => { if (!ac) return; const t = ac.currentTime; [72, 76, 79, 84, 88].forEach((m, i) => tone(440 * 2 ** ((m - 69) / 12), t + i * 0.09, 0.6, 'triangle', 0.16)); };
  const loseSound = () => { if (!ac) return; const t = ac.currentTime; tone(392, t, 0.28, 'triangle', 0.14, 370); tone(311, t + 0.3, 0.55, 'triangle', 0.14, 262); };

  // ---------- tirage ----------
  function draw() {
    const r = Math.random() * 100; let acc = 0;
    for (const [id, lot] of Object.entries(CFG.lots)) { acc += Number(lot.chance) || 0; if (r < acc) return id; }
    return 'X';
  }
  const pickIndex = (id) => { const ix = SEG.map((s, i) => (s.id === id ? i : -1)).filter((i) => i >= 0); return ix[Math.floor(Math.random() * ix.length)]; };
  function makeCode(id) {
    const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', rnd = new Uint32Array(5);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(rnd) : rnd.forEach((_, i) => (rnd[i] = Math.random() * 1e9));
    const body = [...rnd.slice(0, 4)].map((v) => A[v % A.length]).join('');
    let sum = 0; for (const ch of id + body) sum = (sum * 31 + ch.charCodeAt(0)) % A.length;   // lettre de contrôle
    return `BB-${id}-${body}${A[sum]}`;
  }

  // ---------- état du jour ----------
  const spinBtn = $('spin'), hint = $('hint'), today = $('today');
  const t = new Date(), key = dayKey(t);
  const closed = (CFG.fin && key > CFG.fin) ? 'fin' : (CFG.debut && key < CFG.debut) ? 'debut' : '';
  let timer = null;
  function lotName(id) { return id === 'X' ? '' : CFG.lots[id].nom; }
  function renderToday() {
    const s = store.get();
    if (closed) {
      spinBtn.disabled = true; spinBtn.classList.remove('pulse');
      spinBtn.textContent = closed === 'fin' ? 'اللعبة وفات' : 'قريب تبدا!';
      hint.textContent = closed === 'fin' ? 'يعيشك على المشاركة! تابعنا للعبة الجاية.' : `اللعبة تبدا نهار ${CFG.debut}`;
      return;
    }
    if (s.day !== key) return;
    spinBtn.disabled = true; spinBtn.classList.remove('pulse'); spinBtn.textContent = 'ارجع غدوة!';
    hint.innerHTML = 'لعبت اليوم · المحاولة الجاية بعد';
    today.hidden = false;
    today.innerHTML = s.res === 'X'
      ? `<div class="lbl">نتيجتك اليوم</div><div class="res">ما ربحتش المرة هذي، زهرك غدوة!</div><div class="timer" id="cd"></div>`
      : `<div class="lbl">نتيجتك اليوم</div><div class="res win">ربحت ${bidi(lotName(s.res))}</div><div class="code">${s.code}</div><p class="small" style="margin:8px 0 0;color:var(--muted);font-size:14px">ابعثلنا الكود في الميساج باش تاخو الكادو متاعك.</p>
         <div class="actions">${claimButtons(s.res, s.code)}</div><div class="timer" id="cd" style="margin-top:10px"></div>`;
    clearInterval(timer);
    const cd = () => {
      const now = new Date(), next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), ms = next - now;
      if (ms <= 0 || dayKey(now) !== key) { location.reload(); return; }
      const h = Math.floor(ms / 36e5), m = Math.floor(ms / 6e4) % 60, sec = Math.floor(ms / 1e3) % 60;
      const el = $('cd'); if (el) el.textContent = [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
    };
    cd(); timer = setInterval(cd, 1000);
  }
  const bidi = (s) => s.replace(/([A-Za-z][A-Za-z ]*[A-Za-z])/g, '<bdi>$1</bdi>');

  // ---------- réclamation du lot ----------
  const WA = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.89-9.88 9.89m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41"/></svg>';
  const IG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>';
  const FB = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17v3.6l3.04-1.67c.89.25 1.83.38 2.82.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2Zm1 12.9-2.55-2.72-4.98 2.72 5.48-5.82 2.6 2.72 4.93-2.72L13 14.9Z"/></svg>';
  function claimButtons(id, code) {
    const msg = `عسلامة ${CFG.marque}! ربحت ${lotName(id)} في الروّة متاع الزهر. الكود متاعي: ${code}`;
    const b = [];
    if (CFG.whatsapp) b.push(`<a class="btn wa" href="https://wa.me/${CFG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${WA}ابعث الكود على واتساب</a>`);
    if (CFG.instagram) b.push(`<a class="btn ig" href="https://ig.me/m/${CFG.instagram.replace(/^@/, '')}" target="_blank" rel="noopener" data-copy="${code}">${IG}ابعث الكود على إنستغرام</a>`);
    if (CFG.facebook) b.push(`<a class="btn fb" href="https://m.me/${CFG.facebook}" target="_blank" rel="noopener" data-copy="${code}">${FB}ابعث الكود على ماسنجر</a>`);
        b.push(`<button class="btn ghost" type="button" data-copy="${code}">انسخ الكود</button>`);
    return b.join('');
  }
  // copier le code (le message Instagram/Messenger ne peut pas être pré-rempli)
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-copy]'); if (!el) return;
    const code = el.getAttribute('data-copy');
    const done = () => toast('الكود تنسخ! ' + (el.tagName === 'A' ? 'لصقو في الميساج' : ''));
    if (navigator.clipboard) navigator.clipboard.writeText(code).then(done, () => {}); else done();
  });
  function toast(s) { const el = $('toast'); el.textContent = s; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2200); }

  // ---------- fenêtre de résultat ----------
  const modal = $('modal'), sheet = $('sheet');
  const CLOSE = '<button class="icon-btn close" type="button" data-close aria-label="سكّر"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
  function showResult(id, code, segLabel) {
    if (id === 'X') {
      sheet.innerHTML = `${CLOSE}<h3 id="mTitle">معليش!</h3><p>الروّة وقفت على «${segLabel}»</p><p class="small">زهرك يستنّى فيك غدوة. ارجع جرّب مرّة أخرى!</p>
        <div class="actions"><button class="btn gold" type="button" id="share">قول لصاحبك يجرّب زهرو</button><button class="btn ghost" type="button" data-close>باهي</button></div>`;
    } else {
      sheet.innerHTML = `${CLOSE}<img class="pz" src="${CFG.lots[id].image}" alt=""><h3 id="mTitle">مبروك!</h3><p>ربحت <b>${bidi(lotName(id))}</b></p>
        <div class="code">${code}</div><p class="small">صوّر الشاشة و ابعثلنا الكود في الميساج باش تاخو الكادو متاعك.</p>
        <div class="actions">${claimButtons(id, code)}</div>`;
    }
    modal.classList.add('show');
    const sh = $('share'); if (sh) sh.addEventListener('click', share);
    setTimeout(() => sheet.focus({ preventScroll: true }), 350);
  }
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('[data-close]')) modal.classList.remove('show'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.classList.remove('show'); });
  async function share() {
    const url = CFG.lien || location.href.split('?')[0];
    const data = { title: 'الروّة متاع الزهر · ' + CFG.marque, text: 'دوّر الروّة و جرّب تربح Gold Lean Mass ولا Gold Creatine ببلاش!', url };
    try { if (navigator.share) return await navigator.share(data); } catch { return; }
    try { await navigator.clipboard.writeText(url); toast('الرابط تنسخ!'); } catch {}
  }

  // ---------- confettis ----------
  const cv = $('confetti'), cx = cv.getContext('2d');
  function confetti() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const COL = ['#FFF1B8', '#F2C94C', '#E9BE48', '#C08A1E', '#ffffff', '#8A5E0E'];
    const P = Array.from({ length: 170 }, () => ({ x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.42, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 17 - 5,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4, w: 6 + Math.random() * 7, h: 9 + Math.random() * 9, c: COL[(Math.random() * COL.length) | 0] }));
    const t0 = performance.now();
    (function frame(now) {
      const k = (now - t0) / 1000; cx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of P) { p.vy += 0.42; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.scale(1, Math.cos(p.r * 3)); cx.globalAlpha = Math.max(0, 1 - Math.max(0, k - 2.2)); cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore(); }
      if (k < 3.3) requestAnimationFrame(frame); else cx.clearRect(0, 0, innerWidth, innerHeight);
    })(t0);
  }

  // ---------- lancer ----------
  let spinning = false;
  spinBtn.addEventListener('click', () => {
    if (spinning || spinBtn.disabled) return;
    audio();
    spinning = true; spinBtn.disabled = true; spinBtn.classList.remove('pulse'); spinBtn.textContent = 'الروّة تدور…';
    const id = draw(), k = pickIndex(id), code = id === 'X' ? '' : makeCode(id);
    // on enregistre AVANT l'animation : recharger la page ne redonne pas de lancer
    store.set({ day: key, res: id, code, seg: k });
    const jitter = (Math.random() - 0.5) * STEP * 0.7;
    const start = theta, delta = ((W.targetAngle(k, N, jitter) - (start % 360)) % 360 + 360) % 360;
    const end = start + 360 * 6 + delta, D = 6200, t0 = performance.now();
    let pegs = W.pegCount(start, N), flapAt = -1e9;
    bulbMode = 'spin';
    (function frame(now) {
      const p = Math.min(1, (now - t0) / D);
      theta = start + (end - start) * W.spinEase(p);
      setRotor(theta);
      const pc = W.pegCount(theta, N);
      if (pc !== pegs) { pegs = pc; tick(); flapAt = now; }
      const fa = -24 * Math.exp(-(now - flapAt) / 70);
      flap.setAttribute('transform', `rotate(${fa.toFixed(2)})`);
      if (p < 1) return requestAnimationFrame(frame);
      flap.setAttribute('transform', 'rotate(0)');
      spinning = false;
      const seg = SEG[W.segmentAt(theta, N)];
      if (id === 'X') { bulbMode = 'idle'; loseSound(); }
      else { bulbMode = 'win'; winSound(); confetti(); if (navigator.vibrate) navigator.vibrate([60, 40, 120]); setTimeout(() => (bulbMode = 'idle'), 4000); }
      setTimeout(() => { showResult(id, code, seg.l1 ? `${seg.l1} ${seg.l2}` : ''); renderToday(); }, id === 'X' ? 500 : 900);
    })(t0);
  });

  // ---------- textes ----------
  const RULES = [
    `اللعبة مفتوحة للناس الكل في تونس، و لازم تكون متابع صفحة <bdi>${CFG.marque}</bdi>.`,
    'محاولة وحدة في النهار لكل شخص.',
    'كادو واحد لكل شخص طول مدّة اللعبة.',
    `الكادوات محدودة: ${bidi(CFG.stock)}. كي يوفاو، نعلنو على الصفحة.`,
    'باش تاخو الكادو، ابعثلنا الكود و اسمك و ولايتك في الميساج في أجل 48 ساعة، و نتّصلو بيك باش نتفاهمو على التسليم.',
    'الكود يخدم مرّة وحدة برك. أي غش (حسابات وهمية، برشا حسابات، كود مبدّل) يلغي المشاركة.',
    'اللعبة هذي متاع <bdi>' + CFG.marque + '</bdi> برك، و ما عندها حتى علاقة بـ <bdi>Instagram</bdi> ولا <bdi>Facebook</bdi>.',
  ];
  if (CFG.fin) RULES.splice(1, 0, `اللعبة توفى نهار ${CFG.fin} في نص الليل.`);
  $('rules').innerHTML = RULES.map((r) => `<li>${r}</li>`).join('');
  $('foot').innerHTML = `© ${new Date().getFullYear()} <bdi>${CFG.marque}</bdi>`;
  renderToday();
  // si une partie gagnante d'aujourd'hui existe, la fenêtre n'est pas rouverte : le bloc « نتيجتك اليوم » suffit
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
})();

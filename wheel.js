// Roue « Best Body » en SVG — partagée par la page du jeu (roue/), les visuels (visuels/) et le Reel (reel/).
// window.BBWheel.svg(opts) renvoie le code SVG ; la partie qui tourne est <g class="rotor">,
// l'aiguille est <g class="pointer"> (pivot en haut), les ampoules sont des <circle class="bulb b0|b1">.
// Convention : rotor tourné de θ degrés (sens horaire) → le segment i (centre à i×45°) est sous l'aiguille
// quand (i×N° + θ) ≡ 0 (mod 360).
(function (g) {
  const SEGMENTS = [
    { id: 'LM', kind: 'prize', name: 'LEAN MASS', sub: '6 KG', img: 'bag' },
    { id: 'X', kind: 'lose', l1: 'عاود', l2: 'غدوة' },
    { id: 'CR', kind: 'prize', name: 'CREATINE', sub: '300 G', img: 'jar' },
    { id: 'X', kind: 'lose', l1: 'قريب', l2: 'برشا!' },
    { id: 'LM', kind: 'prize', name: 'LEAN MASS', sub: '6 KG', img: 'bag' },
    { id: 'X', kind: 'lose', l1: 'زهرك', l2: 'غدوة' },
    { id: 'CR', kind: 'prize', name: 'CREATINE', sub: '300 G', img: 'jar' },
    { id: 'X', kind: 'lose', l1: 'مازال', l2: 'شوية!' },
  ];
  const R = 440;            // rayon des segments
  const f = (n) => +n.toFixed(2);
  const pt = (deg, r) => { const a = (deg - 90) * Math.PI / 180; return [f(r * Math.cos(a)), f(r * Math.sin(a))]; };
  const STAR = 'M0-16 4.7-4.9 16-4.9 6.9 1.9 10.4 13 0 6.3-10.4 13-6.9 1.9-16-4.9-4.7-4.9Z';

  function svg(o = {}) {
    const segs = o.segments || SEGMENTS, n = segs.length, step = 360 / n, p = o.idPrefix || 'w';
    const img = o.images || {};
    const bulbs = o.bulbs || 24;
    let defs = `
      <radialGradient id="${p}gold" cx="0" cy="0" r="${R}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#FFF3C4"/><stop offset=".45" stop-color="#F3CD5A"/><stop offset=".8" stop-color="#D9A632"/><stop offset="1" stop-color="#A9760F"/></radialGradient>
      <radialGradient id="${p}dark" cx="0" cy="0" r="${R}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#2c2a27"/><stop offset=".7" stop-color="#151413"/><stop offset="1" stop-color="#070707"/></radialGradient>
      <linearGradient id="${p}rim" x1="0" y1="-500" x2="0" y2="500" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#FFE89A"/><stop offset=".3" stop-color="#C9971C"/><stop offset=".55" stop-color="#7A520C"/><stop offset=".8" stop-color="#E9BE48"/><stop offset="1" stop-color="#8A5E0E"/></linearGradient>
      <linearGradient id="${p}txt" x1="0" y1="-1" x2="0" y2="1" gradientUnits="objectBoundingBox">
        <stop offset="0" stop-color="#FFF1B8"/><stop offset=".5" stop-color="#F2C94C"/><stop offset="1" stop-color="#C08A1E"/></linearGradient>
      <radialGradient id="${p}bulb"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#FFF1B0"/><stop offset="1" stop-color="#E7B53A"/></radialGradient>
      <radialGradient id="${p}bulbOff"><stop offset="0" stop-color="#8d7440"/><stop offset="1" stop-color="#4a3a17"/></radialGradient>
      <filter id="${p}sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".55"/></filter>
      <filter id="${p}glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>`;
    // ---- rotor : segments + contenu + séparateurs + picots
    let rotor = '';
    segs.forEach((s, i) => {
      const a0 = i * step - step / 2, a1 = i * step + step / 2;
      const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
      rotor += `<path d="M0 0L${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}Z" fill="url(#${p}${s.kind === 'prize' ? 'gold' : 'dark'})"/>`;
    });
    segs.forEach((s, i) => {
      let c = `<g transform="rotate(${f(i * step)})">`;
      if (s.kind === 'prize') {
        c += `<text y="-388" text-anchor="middle" font-family="Montserrat, sans-serif" font-weight="900" font-size="31" letter-spacing="1" fill="#16130d">${s.name}</text>`;
        c += `<text y="-356" text-anchor="middle" font-family="Montserrat, sans-serif" font-weight="900" font-size="22" letter-spacing="3" fill="#6b4a0b">GOLD · ${s.sub}</text>`;
        const src = img[s.img];
        if (src) { const h = s.img === 'bag' ? 178 : 160, w = s.img === 'bag' ? h * 815 / 1016 : h * 422 / 540; c += `<image href="${src}" x="${f(-w / 2)}" y="${f(-338)}" width="${f(w)}" height="${h}" filter="url(#${p}sh)"/>`; }
      } else {
        c += `<text y="-345" text-anchor="middle" direction="rtl" font-family="Cairo, sans-serif" font-weight="900" font-size="58" fill="url(#${p}txt)">${s.l1}</text>`;
        c += `<text y="-277" text-anchor="middle" direction="rtl" font-family="Cairo, sans-serif" font-weight="900" font-size="58" fill="url(#${p}txt)">${s.l2}</text>`;
        c += `<path d="${STAR}" transform="translate(0 -200) scale(1.1)" fill="#C9971C" opacity=".85"/>`;
      }
      rotor += c + '</g>';
    });
    for (let i = 0; i < n; i++) {
      const [x, y] = pt(i * step + step / 2, R);
      rotor += `<line x1="0" y1="0" x2="${x}" y2="${y}" stroke="#E9BE48" stroke-width="5"/><line x1="0" y1="0" x2="${x}" y2="${y}" stroke="#7A520C" stroke-width="1.5"/>`;
      const [px, py] = pt(i * step + step / 2, R - 14);
      rotor += `<circle cx="${px}" cy="${py}" r="9" fill="#FFE89A" stroke="#6b4a0b" stroke-width="3"/>`;
    }
    rotor += `<circle r="${R}" fill="none" stroke="#6b4a0b" stroke-width="4"/>`;
    // ---- jante + ampoules (fixes)
    let rim = `<circle r="500" fill="url(#${p}rim)"/><circle r="482" fill="#0b0b0b"/><circle r="482" fill="none" stroke="#000" stroke-width="3" opacity=".6"/>`;
    for (let i = 0; i < bulbs; i++) {
      const [x, y] = pt(i * 360 / bulbs + 360 / bulbs / 2, 462);
      rim += `<circle class="bulb b${i % 2}" cx="${x}" cy="${y}" r="10"/>`;
    }
    // ---- moyeu : logo BB
    const hub = `<g filter="url(#${p}sh)"><circle r="104" fill="url(#${p}rim)"/><circle r="92" fill="#0b0b0b"/>
      ${img.hub ? `<image href="${img.hub}" x="-78" y="-78" width="156" height="156"/>` : ''}</g>`;
    // ---- aiguille (pivot en haut, pointe vers le centre)
    const pointer = `<g class="pointer" transform="translate(0 -512)"><g class="flap" filter="url(#${p}sh)">
      <path d="M-46 0C-46-30 46-30 46 0C46 28 14 54 0 104C-14 54-46 28-46 0Z" fill="url(#${p}rim)" stroke="#5a3d08" stroke-width="4"/>
      <circle r="17" fill="#0b0b0b" stroke="#FFE89A" stroke-width="4"/></g></g>`;
    const vb = o.viewBox || '-520 -560 1040 1080';
    return `<svg class="bbwheel" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">
      <defs>${defs}
        <style>.bbwheel .bulb{fill:url(#${p}bulbOff)}.bbwheel.on0 .b0,.bbwheel.on1 .b1,.bbwheel.all .bulb{fill:url(#${p}bulb)}</style></defs>
      <g filter="url(#${p}sh)">${rim}</g>
      <g class="rotor">${rotor}</g>
      ${hub}${pointer}</svg>`;
  }

  // angle du rotor (deg) qui met le segment k sous l'aiguille, avec un décalage « humain » dans le segment
  function targetAngle(k, n, jitter = 0) { return ((-k * 360 / n + jitter) % 360 + 360) % 360; }
  // segment sous l'aiguille pour un angle de rotor donné
  function segmentAt(theta, n) { return ((Math.round(-theta / (360 / n)) % n) + n) % n; }
  // nombre de picots passés sous l'aiguille (change de 1 à chaque « tic »)
  function pegCount(theta, n) { const s = 360 / n; return Math.floor((theta + s / 2) / s); }
  // courbe de lancer : départ rapide, longue décélération (p ∈ [0,1])
  const spinEase = (p) => 1 - Math.pow(1 - p, 3.6);

  g.BBWheel = { SEGMENTS, svg, targetAngle, segmentAt, pegCount, spinEase };
})(typeof window !== 'undefined' ? window : globalThis);

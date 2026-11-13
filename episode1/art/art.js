// Общая графика сериала «Ограбление». Плоский 2D, тёмная тревожная палитра.
// Каждый персонаж — функция, возвращающая SVG-группу в системе 200×400 (ступни на y=392).
const P = {
  night: '#0a0d16', deep: '#121826', steel: '#1d2536', steel2: '#2a3448', fog: '#3c4760',
  lamp: '#e8c547', lampGlow: 'rgba(232,197,71,0.35)', alarm: '#e2383f', alarmGlow: 'rgba(226,56,63,0.4)',
  teal: '#1f8a84', tealD: '#145c58', skin: '#d39c7a', skinD: '#b07c5e', skinOld: '#c98f72',
  ink: '#07090f', white: '#e9e6dc', gold: '#d8a93a',
};

// глаза: dx — взгляд по горизонтали (-1..1), blink 0..1, brow — 'worry' | 'calm' | 'angry'
function eyes(cx, cy, gap, { dx = 0, blink = 0, brow = 'calm', r = 7 } = {}) {
  const h = Math.max(0.6, r * (1 - blink));

  let s = '';
  for (const side of [-1, 1]) {
    const x = cx + side * gap;
    s += `<ellipse cx="${x}" cy="${cy}" rx="${r}" ry="${h}" fill="${P.white}"/>`;
    if (blink < 0.7) s += `<circle cx="${x + dx * r * 0.45}" cy="${cy + 0.5}" r="${r * 0.48}" fill="${P.ink}"/>`;
    // бровь: внутренний конец (к переносице) поднят при тревоге, опущен при злости
    const base = cy - r - 5, lift = brow === 'worry' ? -4 : brow === 'angry' ? 4 : 0;
    const ix = x - side * 6, ox = x + side * 7, iy = base + lift, oy = base - lift * 0.4;
    s += `<path d="M${ox} ${oy} L${ix} ${iy}" stroke="${P.ink}" stroke-width="3.2" stroke-linecap="round"/>`;
  }
  return s;
}

// АЛИСА, 36, таксистка. Каре, кожанка с шашечками, ключ с биркой «кв. 7».
function alisa(o = {}) {
  const { dx = 0, blink = 0, brow = 'worry', key = true, mouth = 'tight', armUp = 0 } = o;
  const m = mouth === 'open' ? `<ellipse cx="100" cy="128" rx="6" ry="7" fill="${P.ink}"/>`
    : mouth === 'gasp' ? `<ellipse cx="100" cy="129" rx="4" ry="5" fill="${P.ink}"/>`
    : `<path d="M92 127 Q100 124 108 127" stroke="${P.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const ay = 228 - armUp * 60;
  return `<g class="alisa">
  <path d="M72 390 L78 300 L96 300 L94 390 Z" fill="#232c42"/><path d="M106 390 L104 300 L122 300 L128 390 Z" fill="#232c42"/>
  <rect x="68" y="382" width="30" height="12" rx="5" fill="${P.ink}"/><rect x="102" y="382" width="32" height="12" rx="5" fill="${P.ink}"/>
  <path d="M64 180 Q100 165 136 180 L142 310 L58 310 Z" fill="#3a3528"/>
  <path d="M100 176 L100 310" stroke="#26231a" stroke-width="3"/>
  <path d="M86 172 L100 196 L114 172" fill="#7a2f33"/>
  <g>${[0,1,2,3].map(i => `<rect x="${136 + (i%2)*0}" y="${200 + i*9}" width="8" height="9" fill="${i%2? P.ink : P.lamp}"/>`).join('')}</g>
  <path d="M64 184 Q48 210 52 270 L64 270 Q64 220 74 196 Z" fill="#3a3528"/>
  <path d="M136 184 Q156 ${ay - 30} ${150} ${ay + 40} L138 ${ay + 40} Q140 ${ay} 128 196 Z" fill="#3a3528"/>
  <circle cx="58" cy="276" r="9" fill="${P.skin}"/><circle cx="144" cy="${ay + 46}" r="9" fill="${P.skin}"/>
  ${key ? `<g transform="translate(144 ${ay + 52})"><circle r="5" fill="none" stroke="${P.gold}" stroke-width="2.5"/><rect x="-2" y="4" width="4" height="20" fill="${P.gold}"/><rect x="2" y="16" width="5" height="3" fill="${P.gold}"/><rect x="2" y="21" width="4" height="3" fill="${P.gold}"/><path d="M-4 0 L-18 12 L-12 22 L-2 8" fill="#c9c2a8"/><text x="-12" y="17" font-size="6" font-family="Arial" font-weight="700" fill="${P.ink}" transform="rotate(-35 -12 15)">кв.7</text></g>` : ''}
  <rect x="91" y="150" width="18" height="22" fill="${P.skinD}"/>
  <path d="M62 112 Q60 58 100 54 Q140 58 138 112 Q138 150 100 154 Q62 150 62 112 Z" fill="${P.skin}"/>
  <path d="M56 120 Q52 50 100 44 Q150 48 146 120 L134 124 Q136 84 118 72 Q98 90 66 92 Q64 110 66 124 Z" fill="#4a2326"/>
  ${eyes(100, 108, 17, { dx, blink, brow })}
  <path d="M100 112 L97 120 L102 120" stroke="${P.skinD}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  ${m}
  <circle cx="64" cy="122" r="3" fill="${P.lamp}"/>
</g>`;
}

// КУРЬЕР. Длинный, худой, кепка, огромный кубический термокороб «ЕДА».
function courier(o = {}) {
  const { dx = 0, blink = 0, brow = 'calm', mouth = 'smirk', radio = false } = o;
  const m = mouth === 'open' ? `<ellipse cx="102" cy="122" rx="6" ry="6" fill="${P.ink}"/>`
    : mouth === 'flat' ? `<path d="M93 121 L111 121" stroke="${P.ink}" stroke-width="3" stroke-linecap="round"/>`
    : `<path d="M92 119 Q104 127 112 117" stroke="${P.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return `<g class="courier">
  <g transform="translate(0 0)">
    <rect x="-56" y="150" width="150" height="150" rx="10" fill="${P.tealD}"/>
    <rect x="-56" y="150" width="150" height="30" rx="10" fill="#18736e"/>
    <text x="6" y="250" font-size="34" font-family="Arial Black,Arial" font-weight="900" fill="${P.lamp}" text-anchor="middle" opacity="0.9">ЕДА</text>
    <rect x="-40" y="268" width="100" height="6" rx="3" fill="#0f4744"/>
    ${radio ? `<g><rect x="120" y="186" width="14" height="30" rx="3" fill="${P.ink}"/><rect x="126" y="166" width="3" height="22" fill="${P.ink}"/><circle cx="127" cy="196" r="3" fill="${P.alarm}"/></g>` : ''}
  </g>
  <path d="M82 390 L86 290 L100 290 L98 390 Z" fill="#1a1f2c"/><path d="M106 390 L104 290 L118 290 L124 390 Z" fill="#1a1f2c"/>
  <rect x="76" y="382" width="26" height="12" rx="5" fill="${P.white}"/><rect x="104" y="382" width="28" height="12" rx="5" fill="${P.white}"/>
  <path d="M74 170 Q102 158 130 170 L134 296 L72 296 Z" fill="${P.teal}"/>
  <path d="M74 176 L64 290 L76 290 L84 200 Z" fill="${P.teal}"/><path d="M130 176 L140 290 L128 290 L122 200 Z" fill="${P.teal}"/>
  <path d="M80 172 L94 290" stroke="#0f4744" stroke-width="6"/><path d="M124 172 L112 290" stroke="#0f4744" stroke-width="6"/>
  <circle cx="70" cy="294" r="8" fill="#a8775a"/><circle cx="134" cy="294" r="8" fill="#a8775a"/>
  <rect x="94" y="140" width="16" height="30" fill="#93664c"/>
  <ellipse cx="102" cy="108" rx="30" ry="38" fill="#a8775a"/>
  <path d="M70 92 Q72 60 102 58 Q134 60 134 92 Z" fill="${P.tealD}"/><path d="M126 88 L156 92 L128 98 Z" fill="${P.tealD}"/>
  ${eyes(102, 106, 13, { dx, blink, brow, r: 6 })}
  <path d="M104 110 L101 116 L106 116" stroke="#7d553f" stroke-width="2.2" fill="none"/>
  ${m}
</g>`;
}

// СТАРЫЙ МАШИНИСТ. Плотный, седые усы, железнодорожная фуражка с кокардой.
function machinist(o = {}) {
  const { dx = 0, blink = 0, brow = 'calm', finger = true, mouth = 'talk' } = o;
  const m = mouth === 'talk' ? `<ellipse cx="100" cy="134" rx="7" ry="5" fill="${P.ink}"/>` : `<path d="M92 133 L108 133" stroke="${P.ink}" stroke-width="3"/>`;
  return `<g class="machinist">
  <path d="M70 390 L74 304 L98 304 L96 390 Z" fill="#141c30"/><path d="M104 390 L102 304 L126 304 L130 390 Z" fill="#141c30"/>
  <rect x="64" y="382" width="34" height="12" rx="5" fill="${P.ink}"/><rect x="102" y="382" width="34" height="12" rx="5" fill="${P.ink}"/>
  <path d="M54 186 Q100 168 146 186 Q158 260 146 310 L54 310 Q42 260 54 186 Z" fill="#1e2b4a"/>
  ${[0,1,2].map(i => `<circle cx="100" cy="${206 + i*28}" r="3.5" fill="${P.gold}"/>`).join('')}
  <path d="M54 192 L40 280 L54 282 L64 214 Z" fill="#1e2b4a"/><circle cx="46" cy="286" r="9" fill="${P.skinOld}"/>
  ${finger ? `<path d="M146 192 Q172 170 168 128 L156 126 Q156 160 136 200 Z" fill="#1e2b4a"/><circle cx="163" cy="120" r="9" fill="${P.skinOld}"/><rect x="160" y="96" width="6" height="18" rx="3" fill="${P.skinOld}"/>`
    : `<path d="M146 192 L160 280 L146 282 L136 214 Z" fill="#1e2b4a"/><circle cx="154" cy="286" r="9" fill="${P.skinOld}"/>`}
  <ellipse cx="100" cy="118" rx="40" ry="40" fill="${P.skinOld}"/>
  <circle cx="72" cy="128" r="8" fill="#d9776a" opacity="0.6"/><circle cx="128" cy="128" r="8" fill="#d9776a" opacity="0.6"/>
  <path d="M56 86 Q100 58 144 86 L148 96 L52 96 Z" fill="#1e2b4a"/><rect x="50" y="92" width="100" height="10" rx="4" fill="${P.ink}"/>
  <circle cx="100" cy="80" r="6" fill="${P.gold}"/>
  ${eyes(100, 114, 16, { dx, blink, brow, r: 5.5 })}
  <path d="M100 118 Q92 132 100 132" stroke="#a5705a" stroke-width="3" fill="none"/>
  <path d="M78 130 Q100 118 122 130 Q112 138 100 132 Q88 138 78 130 Z" fill="#cfcac0"/>
  ${m}
</g>`;
}

// ОХРАННИК БЕЗ ФОРМЫ. Тёмная куртка, лицо в тени, витой провод наушника. Их четверо.
function guard(o = {}) {
  const { dx = 0, glow = 1 } = o;
  return `<g class="guard">
  <path d="M70 390 L74 296 L98 296 L96 390 Z" fill="#11151f"/><path d="M104 390 L102 296 L126 296 L130 390 Z" fill="#11151f"/>
  <rect x="64" y="382" width="34" height="12" rx="4" fill="${P.ink}"/><rect x="102" y="382" width="34" height="12" rx="4" fill="${P.ink}"/>
  <path d="M52 176 Q100 160 148 176 L154 304 L46 304 Z" fill="#20242e"/>
  <path d="M52 182 L38 296 L52 298 L66 206 Z" fill="#20242e"/><path d="M148 182 L162 296 L148 298 L134 206 Z" fill="#20242e"/>
  <circle cx="45" cy="300" r="9" fill="#6d5546"/><circle cx="155" cy="300" r="9" fill="#6d5546"/>
  <rect x="88" y="140" width="24" height="26" fill="#3a2f28"/>
  <path d="M66 110 Q64 62 100 60 Q136 62 134 110 Q134 148 100 150 Q66 148 66 110 Z" fill="#5a463a"/>
  <path d="M66 100 Q64 60 100 58 Q136 60 134 100 Q118 90 100 92 Q82 90 66 100 Z" fill="#14171e"/>
  <rect x="68" y="98" width="64" height="20" rx="9" fill="${P.ink}" opacity="0.85"/>
  <rect x="${78 + dx*4}" y="105" width="12" height="5" rx="2" fill="${P.white}" opacity="${0.35*glow}"/><rect x="${110 + dx*4}" y="105" width="12" height="5" rx="2" fill="${P.white}" opacity="${0.35*glow}"/>
  <path d="M92 134 L108 134" stroke="${P.ink}" stroke-width="3"/>
  <path d="M134 112 Q142 116 138 124 Q134 132 140 140 Q146 148 140 156 Q134 164 140 176" stroke="#c9c2a8" stroke-width="2.2" fill="none"/>
  <circle cx="134" cy="112" r="4" fill="#c9c2a8"/>
</g>`;
}

// «ТОТ, КТО ШИПИТ» — второй поезд из темноты. Монстр-силуэт: две фары-глаза, пар.
function beast(o = {}) {
  const { eye = 1, steam = 0 } = o;
  return `<g class="beast">
  <path d="M10 392 L10 120 Q10 40 100 34 Q190 40 190 120 L190 392 Z" fill="#05070b"/>
  <path d="M30 150 Q100 120 170 150" stroke="#161b26" stroke-width="5" fill="none"/>
  <rect x="40" y="300" width="120" height="16" rx="4" fill="#11151d"/>
  ${[0,1,2,3,4].map(i => `<rect x="${46 + i*24}" y="330" width="12" height="40" fill="#0c0f15"/>`).join('')}
  <circle cx="58" cy="210" r="${30*eye+6}" fill="${P.lampGlow}"/><circle cx="142" cy="210" r="${30*eye+6}" fill="${P.lampGlow}"/>
  <circle cx="58" cy="210" r="16" fill="${eye > 0.05 ? '#fff6cf' : '#1a1d24'}" opacity="${0.3 + 0.7*eye}"/>
  <circle cx="142" cy="210" r="16" fill="${eye > 0.05 ? '#fff6cf' : '#1a1d24'}" opacity="${0.3 + 0.7*eye}"/>
  <path d="M30 196 L84 204" stroke="#05070b" stroke-width="7"/><path d="M170 196 L116 204" stroke="#05070b" stroke-width="7"/>
  <g opacity="${0.4 + 0.6*steam}" fill="#9aa3b5">
    <ellipse cx="0" cy="380" rx="${30 + steam*25}" ry="14" opacity="0.5"/><ellipse cx="200" cy="378" rx="${30 + steam*25}" ry="16" opacity="0.5"/>
    <ellipse cx="40" cy="372" rx="${20 + steam*20}" ry="10" opacity="0.35"/><ellipse cx="164" cy="370" rx="${20 + steam*20}" ry="10" opacity="0.35"/>
  </g>
</g>`;
}

// ===== ФОНЫ 1080×1920 =====
function rain(n = 90, seed = 1, t = 0, w = 1080, h = 1920, color = 'rgba(160,180,210,0.35)') {
  let s = '', x = seed;
  const r = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) {
    const px = r() * w, sp = 900 + r() * 700, py = (r() * h + t * sp) % (h + 100) - 50, len = 30 + r() * 40;
    s += `<path d="M${px} ${py} l-6 ${len}" stroke="${color}" stroke-width="${1.5 + r()*1.5}"/>`;
  }
  return s;
}

// 1. Такси ночью: салон, лобовое стекло с дождём, зеркало заднего вида.
function bgTaxi(o = {}) {
  const { t = 0 } = o;
  return `<g class="bg-taxi">
  <rect width="1080" height="1920" fill="#0b1020"/>
  <rect x="0" y="260" width="1080" height="900" fill="#121a2e"/>
  ${[0,1,2,3,4,5].map(i => `<rect x="${(i*230 - t*120) % 1400 - 120}" y="${520 + (i%3)*40}" width="${110 + (i%2)*60}" height="${520 - (i%3)*60}" fill="#0e1424"/>`).join('')}
  ${[0,1,2,3,4,5,6,7].map(i => `<circle cx="${(i*170 + 60 - t*200) % 1300 - 60}" cy="${700 + (i%3)*70}" r="${10 + (i%3)*4}" fill="${i%3 ? P.lamp : P.alarm}" opacity="0.5"/>`).join('')}
  <g>${rain(80, 7, t)}</g>
  <path d="M0 1160 L1080 1160 L1080 1920 L0 1920 Z" fill="#070a12"/>
  <path d="M0 1160 Q540 1080 1080 1160" stroke="#1c2436" stroke-width="40" fill="none"/>
  <path d="M0 250 L1080 250 L1080 300 Q540 330 0 300 Z" fill="#070a12"/>
  <rect x="380" y="300" width="320" height="110" rx="20" fill="#05070c"/><rect x="396" y="314" width="288" height="82" rx="14" fill="#1a2235"/>
  <rect x="330" y="1260" width="420" height="80" rx="16" fill="#111827"/>
  <rect x="460" y="1276" width="160" height="48" rx="8" fill="${P.lamp}" opacity="0.85"/><text x="540" y="1311" font-size="30" font-family="Arial Black,Arial" font-weight="900" text-anchor="middle" fill="${P.ink}">TAXI</text>
  <circle cx="540" cy="1640" r="210" fill="none" stroke="#1a2232" stroke-width="44"/><rect x="520" y="1440" width="40" height="200" fill="#1a2232"/>
</g>`;
}

// 2. Последний вагон: сиденья, поручни, мигающая лампа сигнализации.
function bgCar(o = {}) {
  const { lamp = 1, alarm = 1, t = 0 } = o;
  return `<g class="bg-car">
  <rect width="1080" height="1920" fill="#0d1220"/>
  <path d="M0 0 L1080 0 L1080 260 Q540 340 0 260 Z" fill="#161d2e"/>
  <rect x="380" y="150" width="320" height="40" rx="18" fill="${lamp > 0.5 ? '#f3dd8a' : '#3a3520'}"/>
  <ellipse cx="540" cy="300" rx="${560*lamp}" ry="${380*lamp}" fill="${P.lampGlow}" opacity="${0.6*lamp}"/>
  ${[0,1,2].map(i => `<g><rect x="${60 + i*340}" y="440" width="280" height="300" rx="26" fill="#05070c"/><rect x="${74 + i*340}" y="454" width="252" height="272" rx="20" fill="#141b2c"/>
     <path d="M${100 + i*340 - ((t*900) % 600)} 470 l90 0" stroke="#3c4760" stroke-width="6" opacity="0.6"/></g>`).join('')}
  <rect x="0" y="300" width="1080" height="10" fill="#3c4760"/><rect x="0" y="330" width="1080" height="6" fill="#2a3448"/>
  ${[0,1,2,3].map(i => `<rect x="${120 + i*280}" y="300" width="8" height="780" fill="#3c4760"/>`).join('')}
  <rect x="0" y="880" width="1080" height="200" fill="#2a1d24"/><rect x="0" y="880" width="1080" height="24" fill="#3a2830"/>
  <rect x="0" y="1080" width="1080" height="840" fill="#0a0d16"/>
  ${[0,1,2,3,4,5].map(i => `<rect x="0" y="${1120 + i*130}" width="1080" height="4" fill="#141a28"/>`).join('')}
  <g transform="translate(940 380)"><rect x="-34" y="-34" width="68" height="68" rx="12" fill="#1a0f12"/>
    <circle r="22" fill="${alarm > 0.5 ? P.alarm : '#3a1416'}"/><circle r="${80*alarm}" fill="${P.alarmGlow}" opacity="${alarm}"/></g>
</g>`;
}

// 3. Туннель с дверью «7»: тюбинги, кабели, служебная дверь, лампа сигнализации.
function bgTunnel(o = {}) {
  const { alarm = 1, door = 0, t = 0 } = o;
  const rings = [0,1,2,3,4,5,6].map(i => {
    const k = 1 - i * 0.13, w = 1080 * k * 1.1, h = 1500 * k;
    return `<path d="M${540 - w/2} ${1500 - (1500-h)*0.2} L${540 - w/2} ${960 - h*0.42} Q540 ${960 - h*0.82} ${540 + w/2} ${960 - h*0.42} L${540 + w/2} ${1500 - (1500-h)*0.2}" stroke="#1a2131" stroke-width="${18*k}" fill="none"/>`;
  }).join('');
  return `<g class="bg-tunnel">
  <rect width="1080" height="1920" fill="#080b12"/>
  ${rings}
  <ellipse cx="540" cy="860" rx="120" ry="160" fill="#030406"/>
  ${[0,1,2].map(i => `<path d="M-20 ${560 + i*30} Q540 ${640 + i*30} 1100 ${560 + i*30}" stroke="#121722" stroke-width="10" fill="none"/>`).join('')}
  <rect x="140" y="760" width="300" height="560" rx="10" fill="#1d2536"/>
  <rect x="160" y="780" width="260" height="520" rx="6" fill="${door > 0 ? '#c9b57a' : '#2a3448'}"/>
  ${door > 0 ? `<path d="M160 780 L${160 + 260*(1-door)} ${780 + 30*door} L${160 + 260*(1-door)} ${1300 - 30*door} L160 1300 Z" fill="#2a3448"/>
     ${[0,1,2,3,4,5].map(i => `<rect x="${200 + i*12}" y="${1240 - i*80}" width="${180 - i*20}" height="12" fill="#8a7a4e" opacity="${door}"/>`).join('')}` : ''}
  <text x="290" y="900" font-size="120" font-family="Arial Black,Arial" font-weight="900" text-anchor="middle" fill="${P.white}" opacity="0.85">7</text>
  <rect x="380" y="1020" width="18" height="40" rx="4" fill="${P.gold}"/>
  <g transform="translate(290 700)"><rect x="-30" y="-24" width="60" height="48" rx="8" fill="#1a0f12"/>
    <circle r="16" fill="${alarm > 0.5 ? P.alarm : '#3a1416'}"/><circle r="${120*alarm}" fill="${P.alarmGlow}" opacity="${alarm}"/></g>
  <path d="M0 1500 L1080 1500 L1080 1920 L0 1920 Z" fill="#06080d"/>
  <path d="M180 1920 L470 1500 M900 1920 L610 1500" stroke="#2a3448" stroke-width="10"/>
  ${[0,1,2,3,4,5,6].map(i => { const y = 1500 + Math.pow(i/6, 1.7)*420; const k = (y-1500)/420; return `<rect x="${470 - k*290 - 20}" y="${y}" width="${140 + k*580 + 40}" height="${6 + k*16}" fill="#141a26"/>`; }).join('')}
</g>`;
}

// 4. Схема перегона: туннель сбоку, оба портала перекрыты красными огнями.
function bgBlocked(o = {}) {
  const { alarm = 1, t = 0 } = o;
  const gate = x => `<g transform="translate(${x} 960)"><rect x="-70" y="-160" width="140" height="320" fill="none" stroke="${P.alarm}" stroke-width="8"/>
    ${[-1,0,1].map(i => `<path d="M-70 ${i*90 - 30} L70 ${i*90 + 30}" stroke="${P.alarm}" stroke-width="8"/>`).join('')}
    <circle cy="-210" r="18" fill="${alarm > 0.5 ? P.alarm : '#3a1416'}"/><circle cy="-210" r="${90*alarm}" fill="${P.alarmGlow}" opacity="${alarm}"/></g>`;
  return `<g class="bg-blocked">
  <rect width="1080" height="1920" fill="#080b12"/>
  <path d="M0 640 L1080 640 L1080 760 L0 760 Z" fill="#141a26"/>
  <path d="M0 1160 L1080 1160 L1080 1920 L0 1920 Z" fill="#0b0f18"/>
  <rect x="0" y="760" width="1080" height="400" fill="#05070b"/>
  <rect x="0" y="1120" width="1080" height="8" fill="#2a3448"/>
  <g transform="translate(${540 - 300} 1000)">${[0,1,2,3].map(i => `<rect x="${i*150}" y="0" width="140" height="110" rx="10" fill="#1d2536"/><rect x="${i*150 + 14}" y="18" width="40" height="34" fill="${P.lamp}" opacity="0.6"/><rect x="${i*150 + 76}" y="18" width="40" height="34" fill="${P.lamp}" opacity="0.6"/>`).join('')}</g>
  ${gate(110)}${gate(970)}
  <text x="540" y="560" font-size="46" font-family="Arial Black,Arial" font-weight="900" text-anchor="middle" fill="${P.fog}" letter-spacing="6">ПЕРЕГОН</text>
</g>`;
}

if (typeof module !== 'undefined') module.exports = { P, alisa, courier, machinist, guard, beast, bgTaxi, bgCar, bgTunnel, bgBlocked, rain };

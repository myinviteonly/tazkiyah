/* ================================================================
   Tazkiyah: UI helpers (icons, stars, butterfly bursts, toast, sheet)
   ================================================================ */
(function (global) {
  const s = (p, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}>${p}</svg>`;
  const ICONS = {
    check: s('<path d="M5 12.5l4.2 4.2L19 7"/>', 'stroke-width="3" stroke="#fff"'),
    today: s('<path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3L4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/><circle cx="12" cy="12" r="4"/>'),
    dumbbell: s('<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>'),
    briefcase: s('<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>'),
    chart: s('<path d="M4 19h16"/><path d="M6 15l4-4 3 3 5-6"/><circle cx="18" cy="8" r="1.2" fill="currentColor"/>'),
    gear: s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    moon: s('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
    book: s('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>'),
    grad: s('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>'),
    heart: s('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
    shield: s('<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>'),
    walk: s('<circle cx="13" cy="4" r="2"/><path d="M10 21l2-6 3 3v3M8 12l2-4 4 1 2 4M10 8l-2 4"/>'),
    share: s('<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
    plus: s('<path d="M12 5v14M5 12h14"/>'),
    link: s('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    copy: s('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
    sparkle: s('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'),
    clock: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    alert: s('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'),
    trash: s('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    search: s('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    butterfly: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8C10.9 7.6 8.2 4.4 5.2 4.3 2.7 4.2 2.6 6.9 3.6 9c1 2 3.3 3.1 6 3.2-2.4.6-4.2 2-4.4 3.9-.2 2.2 1.8 3.4 3.6 2.5 1.6-.8 2.6-3.3 3.2-5.4.6 2.1 1.6 4.6 3.2 5.4 1.8.9 3.8-.3 3.6-2.5-.2-1.9-2-3.3-4.4-3.9 2.7-.1 5-1.2 6-3.2 1-2.1.9-4.8-1.6-4.7-3 .1-5.7 3.3-6.8 6.5z"/></svg>`
  };

  // ---------- star field ----------
  function stars() {
    const c = document.getElementById('stars'); if (!c) return;
    const ctx = c.getContext('2d'); let W, H, pts = [];
    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr; c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
      pts = Array.from({ length: Math.round((innerWidth * innerHeight) / 9000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.1 + 0.3) * dpr, a: Math.random(), s: Math.random() * 0.015 + 0.004 }));
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) { p.a += p.s; const o = 0.25 + Math.abs(Math.sin(p.a)) * 0.6; ctx.fillStyle = `rgba(200,222,255,${o})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(draw);
    }
    size(); addEventListener('resize', size); draw();
  }

  // ---------- butterfly burst ----------
  let fxCanvas, fxCtx, flies = [], running = false;
  function wing(ctx, x, y, sz, flap, rot, hue, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha;
    const w = Math.abs(Math.cos(flap)) * 0.85 + 0.15;
    const g = ctx.createLinearGradient(-sz, -sz, sz, sz);
    g.addColorStop(0, `hsl(${hue},100%,85%)`); g.addColorStop(1, `hsl(${hue + 8},95%,58%)`);
    ctx.fillStyle = g;
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side * w, 1);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(sz * 0.3, -sz * 1.1, sz * 1.25, -sz * 1.05, sz * 1.05, -sz * 0.15); ctx.bezierCurveTo(sz * 0.95, sz * 0.2, sz * 0.4, sz * 0.15, 0, 0.05 * sz); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, sz * 0.05); ctx.bezierCurveTo(sz * 0.5, sz * 0.15, sz * 0.85, sz * 0.5, sz * 0.6, sz * 0.85); ctx.bezierCurveTo(sz * 0.35, sz * 1.05, sz * 0.1, sz * 0.6, 0, sz * 0.15); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#0B1C4A'; ctx.fillRect(-sz * 0.06, -sz * 0.45, sz * 0.12, sz * 1.15);
    ctx.restore();
  }
  function loop() {
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    flies = flies.filter(f => f.life > 0);
    for (const f of flies) {
      f.t += 1; f.life -= 1; f.flap += f.fs;
      f.vx += Math.sin(f.t / 18 + f.seed) * 0.05; f.vy -= 0.02;
      f.x += f.vx; f.y += f.vy;
      const a = Math.min(1, f.life / 40);
      wing(fxCtx, f.x, f.y, f.sz, f.flap, Math.atan2(f.vy, f.vx) + Math.PI / 2, f.hue, a);
    }
    if (flies.length) requestAnimationFrame(loop); else { running = false; fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height); }
  }
  function burst(x, y, n, big) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!fxCanvas) {
      fxCanvas = document.getElementById('fx'); if (!fxCanvas) return; fxCtx = fxCanvas.getContext('2d');
      const sz = () => { const dpr = Math.min(2, devicePixelRatio || 1); fxCanvas.width = innerWidth * dpr; fxCanvas.height = innerHeight * dpr; fxCanvas.style.width = innerWidth + 'px'; fxCanvas.style.height = innerHeight + 'px'; fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0); };
      sz(); addEventListener('resize', sz);
    }
    n = n || 4;
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * (big ? 2.6 : 1.6);
      const sp = (big ? 3.2 : 2.2) + Math.random() * 1.8;
      flies.push({ x: x == null ? innerWidth * Math.random() : x, y: y == null ? innerHeight * 0.85 : y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, sz: (big ? 9 : 7) + Math.random() * 6, flap: Math.random() * 6, fs: 0.35 + Math.random() * 0.2, t: 0, seed: Math.random() * 10, life: 90 + Math.random() * 60, hue: 212 + Math.random() * 14 });
    }
    if (!running) { running = true; requestAnimationFrame(loop); }
  }
  function burstAt(el, n, big) { const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, n, big); }
  function celebrate() { for (let i = 0; i < 4; i++) setTimeout(() => burst(innerWidth * (0.15 + Math.random() * 0.7), innerHeight * 0.9, 5, true), i * 180); }

  // ---------- toast ----------
  let toastT;
  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
  }

  // ---------- bottom sheet ----------
  function sheet(html, onMount) {
    let bg = document.querySelector('.sheet-bg'), sh = document.querySelector('.sheet');
    if (!bg) { bg = document.createElement('div'); bg.className = 'sheet-bg'; document.body.appendChild(bg); bg.onclick = closeSheet; }
    if (!sh) { sh = document.createElement('div'); sh.className = 'sheet'; document.body.appendChild(sh); }
    sh.innerHTML = `<div class="grab"></div><div class="sheet-in">${html}</div>`;
    bg.classList.add('show'); requestAnimationFrame(() => sh.classList.add('show'));
    if (onMount) onMount(sh);
    return sh;
  }
  function closeSheet() { const bg = document.querySelector('.sheet-bg'), sh = document.querySelector('.sheet'); if (sh) sh.classList.remove('show'); if (bg) bg.classList.remove('show'); }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Copied'); return true; }
    catch (e) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Copied'); } catch (_) { toast('Could not copy'); } ta.remove(); }
  }

  global.TZUI = { ICONS, stars, burst, burstAt, celebrate, toast, sheet, closeSheet, copyText };
})(window);

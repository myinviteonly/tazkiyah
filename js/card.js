/* ================================================================
   Tazkiyah: daily summary card (image you can send in one tap)
   ================================================================ */
(function (global) {
  const T = global.TZ;

  function loadImg(src) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); }

  function wrap(ctx, text, x, y, maxW, lh, maxLines) {
    const words = String(text).split(' '); let line = '', lines = [];
    for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    if (maxLines && lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/\s+\S*$/, '') + '…'; }
    lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
    return lines.length * lh;
  }

  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  async function render(s, day, settings, jobs) {
    try { await document.fonts.ready; } catch (e) {}
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const sum = T.summaryFor(s, day, settings);
    const rem = T.reminderFor(s), les = T.lessonFor(s);
    const wk = T.jobsThisWeek(jobs, s).length;

    // background
    let g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0D1B44'); g.addColorStop(1, '#050B1D'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(W * 0.85, 60, 10, W * 0.85, 60, 700); g.addColorStop(0, 'rgba(76,141,255,0.38)'); g.addColorStop(1, 'rgba(76,141,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(200,222,255,${Math.random() * 0.5 + 0.15})`; ctx.beginPath(); ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.8 + 0.4, 0, 6.283); ctx.fill(); }

    const icon = await loadImg('assets/icons/icon-192.png');
    if (icon) { ctx.save(); roundRect(ctx, 72, 70, 96, 96, 24); ctx.clip(); ctx.drawImage(icon, 72, 70, 96, 96); ctx.restore(); }
    ctx.fillStyle = '#EEF4FF'; ctx.font = '600 50px Fraunces, Georgia, serif'; ctx.fillText('Tazkiyah', 190, 118);
    ctx.fillStyle = '#8FA6D3'; ctx.font = '500 28px Manrope, sans-serif'; ctx.fillText(`${T.C.ownerName}'s day · ${T.fmtDate(s, { weekday: 'long', month: 'long', day: 'numeric' })}`, 190, 158);

    // ring
    const cx = 230, cy = 380, r = 128;
    ctx.lineWidth = 26; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(156,196,255,0.14)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r); g.addColorStop(0, '#BFDBFF'); g.addColorStop(1, '#3D7BFF');
    ctx.strokeStyle = g; ctx.shadowColor = 'rgba(76,141,255,0.6)'; ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (sum.score / 100)); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '600 78px Fraunces, Georgia, serif'; ctx.fillText(`${sum.score}%`, cx, cy + 20);
    ctx.fillStyle = '#8FA6D3'; ctx.font = '600 22px Manrope, sans-serif'; ctx.fillText(`${sum.done} OF ${sum.total} DONE`, cx, cy + 58); ctx.textAlign = 'left';

    // stats list
    const rows = [
      ['Salah', `${sum.prayers}/5 prayed`, sum.prayers === 5],
      ['Classes', sum.classesTotal ? `${sum.classesAttended}/${sum.classesTotal} attended` : 'No classes today', sum.classesTotal ? sum.classesAttended === sum.classesTotal : null],
      ['Workout', sum.workoutType === 'rest' ? 'Rest day' : `${sum.workout}${sum.setsPlanned ? ` · ${sum.setsDone}/${sum.setsPlanned} sets` : ''}`, sum.workoutType === 'rest' ? null : sum.workoutDone],
      ['Steps', `${sum.steps.toLocaleString()} / ${sum.stepGoal.toLocaleString()}`, sum.steps >= sum.stepGoal],
      ['Character', `${sum.character}/3 kept`, sum.character === 3],
      ['Job applications', `${wk} this week`, wk > 0]
    ];
    let y = 270;
    rows.forEach(([k, v, ok]) => {
      ctx.fillStyle = ok === true ? '#7DB2FF' : ok === false ? 'rgba(156,196,255,0.25)' : 'rgba(156,196,255,0.12)';
      ctx.beginPath(); ctx.arc(442, y - 9, 11, 0, 6.283); ctx.fill();
      if (ok === true) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(436, y - 9); ctx.lineTo(441, y - 4); ctx.lineTo(449, y - 14); ctx.stroke(); }
      ctx.fillStyle = '#8FA6D3'; ctx.font = '600 22px Manrope, sans-serif'; ctx.fillText(k.toUpperCase(), 470, y - 18);
      ctx.fillStyle = '#EEF4FF'; ctx.font = '600 30px Manrope, sans-serif'; ctx.fillText(v, 470, y + 14);
      y += 66;
    });

    // reminder box
    const bx = 72, by = 690, bw = W - 144, bh = 330;
    g = ctx.createLinearGradient(bx, by, bx + bw, by + bh); g.addColorStop(0, 'rgba(76,141,255,0.30)'); g.addColorStop(1, 'rgba(20,40,96,0.55)');
    ctx.fillStyle = g; roundRect(ctx, bx, by, bw, bh, 34); ctx.fill(); ctx.strokeStyle = 'rgba(156,196,255,0.3)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#BFDBFF'; ctx.font = '700 22px Manrope, sans-serif'; ctx.fillText(`TODAY'S REMINDER${sum.reminderRead ? '  ·  READ ✓' : ''}`, bx + 36, by + 54);
    ctx.fillStyle = '#F5F9FF'; ctx.font = '400 44px Amiri, serif'; ctx.textAlign = 'right'; ctx.direction = 'rtl';
    wrap(ctx, rem.ar, bx + bw - 36, by + 118, bw - 72, 62, 2);
    ctx.textAlign = 'left'; ctx.direction = 'ltr';
    ctx.fillStyle = '#EEF4FF'; ctx.font = '500 29px Manrope, sans-serif';
    wrap(ctx, rem.en, bx + 36, by + 232, bw - 72, 40, 2);
    ctx.fillStyle = '#8FA6D3'; ctx.font = '500 22px Manrope, sans-serif'; ctx.fillText(rem.ref, bx + 36, by + bh - 28);

    // lesson
    ctx.fillStyle = '#BFDBFF'; ctx.font = '700 22px Manrope, sans-serif'; ctx.fillText(`TODAY'S LESSON${sum.lessonDone ? '  ·  DONE ✓' : ''}`, 72, 1084);
    ctx.fillStyle = '#EEF4FF'; ctx.font = '500 40px Fraunces, Georgia, serif'; wrap(ctx, les.title, 72, 1136, W - 144, 50, 1);
    ctx.fillStyle = '#C3D3F2'; ctx.font = '500 26px Manrope, sans-serif'; wrap(ctx, les.action, 72, 1186, W - 144, 36, 2);

    ctx.fillStyle = '#6E82AD'; ctx.font = '500 22px Manrope, sans-serif'; ctx.fillText(T.C.tagline, 72, H - 54);
    return c;
  }

  async function share(s, day, settings, jobs) {
    const c = await render(s, day, settings, jobs);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const file = new File([blob], `tazkiyah-${s}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'My day on Tazkiyah' }); return 'shared'; }
      catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
    }
    const url = URL.createObjectURL(blob);
    global.TZUI.sheet(`<h3 class="h-serif" style="font-size:22px;margin-bottom:6px">Today's card</h3><p class="muted small">Press and hold the image, then tap Save or Share.</p><img src="${url}" style="width:100%;border-radius:18px;margin-top:10px;border:1px solid rgba(156,196,255,.2)" alt="Summary card"><a class="btn block mt12" href="${url}" download="tazkiyah-${s}.png">Download image</a>`);
    return 'preview';
  }

  global.TZCard = { render, share };
})(window);

/* ================================================================
   Tazkiyah: Marwa's live, read-only view
   ================================================================ */
(function () {
  const T = window.TZ, U = window.TZUI, I = U.ICONS, C = T.C;
  const { esc, $ } = T;

  const params = new URLSearchParams(location.search || location.hash.slice(1));
  const KEY = 'tazkiyah:view';
  let cfg = { api: params.get('api'), k: params.get('k') };
  try {
    if (cfg.api && cfg.k) localStorage.setItem(KEY, JSON.stringify(cfg));
    else cfg = JSON.parse(localStorage.getItem(KEY)) || cfg;
  } catch (e) {}
  const demo = params.get('demo') === '1';

  let data = null, selected = T.today(), lastFetch = 0;

  async function load(quiet) {
    if (demo) { data = demoData(); lastFetch = Date.now(); render(); return; }
    if (!cfg.api || !cfg.k) { $('#main').innerHTML = `<div class="card center-msg"><div class="float" style="width:64px;margin:0 auto 12px;color:var(--blue-2)">${I.butterfly}</div><div class="lesson-title">This link is missing its key</div><p class="muted small">Ask Danial to send the link again from his app.</p></div>`; return; }
    try {
      const res = await fetch(`${cfg.api}?k=${encodeURIComponent(cfg.k)}&t=${Date.now()}`, { redirect: 'follow' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'error');
      data = json; lastFetch = Date.now(); render();
    } catch (e) {
      if (!data && !quiet) $('#main').innerHTML = `<div class="card center-msg"><div class="lesson-title">Could not load right now</div><p class="muted small">Check your connection and pull down to refresh.</p><button class="btn mt12" onclick="location.reload()">Try again</button></div>`;
    }
  }

  function ago(iso) {
    if (!iso) return 'not yet';
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60); if (h < 24) return `${h} hr ago`;
    return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  }

  const settingsFrom = p => ({ stepGoal: (p && p.stepGoal) || 9000, labDayBonus: p && p.labDayBonus != null ? p.labDayBonus : 2500 });

  function render() {
    const days = data.days || {}; const set = settingsFrom(data.profile);
    const s = selected; const day = days[s] || T.blankDay();
    day.workout = day.workout || {}; day.prayers = day.prayers || {}; day.classes = day.classes || {}; day.character = day.character || {};
    const ev = T.evaluate(s, day, set);
    const sum = day.summary || T.summaryFor(s, day, set);
    const rem = T.reminderFor(s), les = T.lessonFor(s);
    const isToday = s === T.today();
    const latest = Object.values(days).map(d => d.updatedAt).filter(Boolean).sort().pop();
    $('#live').innerHTML = `<i></i>Updated ${ago(latest)}`;

    const picks = Array.from({ length: 10 }, (_, i) => T.addDays(T.today(), -i)).map(d => {
      const e = T.evaluate(d, days[d], set);
      return `<button data-day="${d}" class="${d === s ? 'sel' : ''}"><span>${d === T.today() ? 'Today' : T.parse(d).toLocaleDateString('en-CA', { weekday: 'short' })}</span><b>${days[d] ? e.pct + '%' : '·'}</b></button>`;
    }).join('');

    const tick = on => `<span class="tick ${on ? 'on' : ''}">${I.check}</span>`;
    const rrow = (on, title, sub, end) => `<div class="row ${on ? 'on' : ''}">${tick(on)}<span class="row-main"><span class="row-title">${title}</span>${sub ? `<span class="row-sub">${sub}</span>` : ''}</span>${end || ''}</div>`;

    const classes = T.classesFor(s);
    const classHTML = classes.length ? classes.map(c => {
      const v = day.classes[c.id];
      const tag = v === 'attended' ? '<span class="state ok">Attended</span>' : v === 'cancelled' ? '<span class="state cx">Cancelled</span>' : `<span class="state">${isToday && c.start > new Date().toTimeString().slice(0, 5) ? 'Upcoming' : 'Not marked'}</span>`;
      return rrow(v === 'attended', esc(c.course), `${c.kind} · ${T.to12(c.start)} to ${T.to12(c.end)}`, tag);
    }).join('') : `<div class="empty">No classes ${isToday ? 'today' : 'this day'}.</div>`;

    const sess = ev.session;
    let body = '';
    if (sess.type === 'lift') body = rrow(sum.workoutDone, esc(sess.name), `${sum.setsDone}/${sum.setsPlanned} sets logged · ${esc(sess.focus)}`);
    else if (sess.type === 'walk') body = rrow(sum.workoutDone, esc(sess.name), esc(sess.focus));
    else body = rrow(false, 'Rest day', 'Recovery is part of the plan');
    const pctSteps = Math.min(100, Math.round((sum.steps / Math.max(1, sum.stepGoal)) * 100));
    body += `<div class="row" style="display:block"><div style="display:flex;justify-content:space-between"><span class="row-title">Steps</span><span class="row-end">${Number(sum.steps).toLocaleString()} / ${Number(sum.stepGoal).toLocaleString()}</span></div><div class="bar"><i style="width:${pctSteps}%"></i></div></div>`;
    body += rrow(sum.protein, 'Protein target', 'About 180-200 g');

    // week strip
    const ws = T.weekStart(T.today());
    const strip = Array.from({ length: 7 }, (_, i) => T.addDays(ws, i)).map(d => {
      const e = T.evaluate(d, days[d], set); const fut = d > T.today();
      return `<div class="wd ${d === T.today() ? 'today' : ''} ${fut ? 'future' : ''} ${e.pct >= 80 ? 'hi' : ''}"><div class="wn">${T.parse(d).toLocaleDateString('en-CA', { weekday: 'short' })}</div><div class="wv">${fut || !days[d] ? '·' : e.pct}</div><div class="wp">${fut || !days[d] ? '' : e.prayers + '/5'}</div></div>`;
    }).join('');

    // jobs
    const jobs = (data.jobs || []).slice().sort((a, b) => a.date < b.date ? 1 : -1);
    const wk = T.jobsThisWeek(jobs);
    const jobGoal = (data.profile && data.profile.jobGoal) || 10;
    const modeCls = m => m === 'Remote' ? 'remote' : m === 'Hybrid' ? 'hybrid' : 'onsite';
    const jobRow = j => `<div class="item"><div class="item-main"><div class="item-t">${esc(j.role)}</div><div class="item-s">${esc(j.company)} · ${T.fmtShort(j.date)}</div></div><span class="badge ${modeCls(j.mode)}">${esc(j.mode)}</span><span class="status ${esc(String(j.status).replace(' ', ''))}">${esc(j.status)}</span></div>`;

    const weights = (data.weights || []).slice().sort((a, b) => a.date < b.date ? -1 : 1);
    const lastW = weights[weights.length - 1];

    $('#main').innerHTML = `
      <div style="margin:0 2px 14px">
        <div class="hello">${isToday ? 'Today' : T.fmtDate(s, { weekday: 'long' })}, <em>${T.fmtDate(s, { month: 'long', day: 'numeric' })}</em></div>
        <div class="dateline">${window.SalahHijri ? esc(window.SalahHijri.formatHijri(T.parse(s))) : ''}</div>
      </div>
      <div class="daypick">${picks}</div>

      <div class="card hero">
        <div class="ring-box">${T.ring(ev.pct, 112, 10)}<div class="ring-num"><div><b>${ev.pct}%</b><span>${isToday ? 'so far' : 'done'}</span></div></div></div>
        <div class="hero-txt"><h2>${ev.done} of ${ev.total} done</h2><p>${isToday ? 'Updates live as he checks things off.' : 'His full day.'}</p>
          <div class="chips"><span class="chip ${ev.prayers === 5 ? 'ok' : ''}">${ev.prayers}/5 salah</span><span class="chip">${T.streak(days, set)} day streak</span></div></div>
      </div>

      <div class="card bubble">
        <div class="card-h"><span class="card-t">${I.sparkle} ${isToday ? "Today's" : 'That day\'s'} reminder</span><span class="state ${day.reminderRead ? 'ok' : ''}">${day.reminderRead ? 'Read ✓' : 'Not yet'}</span></div>
        <div class="ar" lang="ar">${esc(rem.ar)}</div><div class="tr">${esc(rem.tr)}</div><div class="en">${esc(rem.en)}</div><div class="ref">${esc(rem.ref)}</div>
      </div>

      <div class="card ro"><div class="card-h"><span class="card-t">${I.moon} Salah</span><span class="card-meta">${ev.prayers}/5</span></div>
        <div class="pills">${T.PRAYERS.map(p => `<div class="pill ${day.prayers[p.id] ? 'on' : ''}">${tick(day.prayers[p.id])}<div>${p.name}</div><div class="arn">${p.ar}</div></div>`).join('')}</div>
      </div>

      <div class="card ro"><div class="card-h"><span class="card-t">${I.grad} Classes</span><span class="card-meta">${sum.classesTotal ? sum.classesAttended + '/' + sum.classesTotal : ''}</span></div><div class="rows">${classHTML}</div></div>

      <div class="card ro"><div class="card-h"><span class="card-t">${I.dumbbell} Body</span></div><div class="rows">${body}</div></div>

      <div class="card ro"><div class="card-h"><span class="card-t">${I.shield} Character</span><span class="card-meta">${T.CHARACTER.filter(c => day.character[c.id]).length}/3</span></div>
        <div class="rows">${T.CHARACTER.map(ch => rrow(day.character[ch.id], ch.label, ch.sub)).join('')}</div></div>

      <div class="card"><div class="card-h"><span class="card-t">${I.heart} His lesson ${isToday ? 'today' : 'that day'}</span><span class="state ${day.lessonDone ? 'ok' : ''}">${day.lessonDone ? 'Done ✓' : 'Not yet'}</span></div>
        <div class="lesson-title">${esc(les.title)}</div><div class="lesson-body">${esc(les.body)}</div>
        <div class="action-box"><b>His action</b>${esc(les.action)}</div></div>

      <div class="card"><div class="card-h"><span class="card-t">${I.today} This week</span><span class="card-meta">Score per day</span></div><div class="week">${strip}</div></div>

      <div class="card"><div class="card-h"><span class="card-t">${I.briefcase} Job applications</span><span class="card-meta">${wk.length}/${jobGoal} this week</span></div>
        <div class="bar" style="margin:0 0 6px"><i style="width:${Math.min(100, Math.round(wk.length / jobGoal * 100))}%"></i></div>
        ${jobs.length ? jobs.slice(0, 30).map(jobRow).join('') : '<div class="empty">No applications logged yet.</div>'}
        <p class="tiny muted mt8" style="margin-bottom:0">${jobs.length} total · ${jobs.filter(j => j.mode === 'Remote').length} remote · ${jobs.filter(j => j.status === 'Interview' || j.status === 'Offer').length} interviews</p>
      </div>

      <div class="card"><div class="card-h"><span class="card-t">${I.chart} Weigh-ins</span><span class="card-meta">${lastW ? `${lastW.weight} lb · ${T.fmtShort(lastW.date)}` : 'None yet'}</span></div>
        ${T.weightChart(weights)}
        <div class="legend"><span><i></i>Weigh-ins</span><span><i class="plan"></i>Plan</span><span><i class="goal"></i>Goal ${C.goalWeight} lb</span></div>
      </div>

      <p class="center tiny muted">${esc(C.tagline)}</p>
      <p class="center tiny muted">Read-only view. Refreshes every minute.</p>`;
  }

  document.addEventListener('click', e => { const b = e.target.closest('[data-day]'); if (b) { selected = b.dataset.day; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastFetch > 15000) { selected = T.today(); load(true); } });
  setInterval(() => { if (!document.hidden) load(true); }, 60000);

  // ---------- demo data for previewing (share.html?demo=1) ----------
  function demoData() {
    const d = {}; const t = T.today();
    for (let i = 0; i < 7; i++) {
      const s = T.addDays(t, -i); const day = T.blankDay();
      T.PRAYERS.forEach((p, j) => { day.prayers[p.id] = i === 0 ? j < 3 : (j + i) % 6 !== 0; });
      T.classesFor(s).forEach((c, j) => { day.classes[c.id] = i === 0 && j > 0 ? undefined : 'attended'; });
      day.workout.done = i !== 0; day.steps = i === 0 ? 6200 : 8000 + i * 700; day.protein = i !== 0;
      day.reminderRead = true; day.lessonDone = i !== 0; day.character = { gaze: true, speech: true, present: i !== 2 };
      day.updatedAt = new Date(Date.now() - i * 86400000 - 300000).toISOString(); d[s] = day;
    }
    return {
      ok: true, profile: { jobGoal: 10, stepGoal: 9000, labDayBonus: 2500 }, days: d,
      jobs: [
        { id: 'a', company: 'Shopify', role: 'Junior Developer', mode: 'Remote', status: 'Applied', date: t },
        { id: 'b', company: 'Wealthsimple', role: 'Full Stack Developer', mode: 'Remote', status: 'Interview', date: T.addDays(t, -1) },
        { id: 'c', company: 'Geotab', role: 'Web Developer', mode: 'Hybrid', status: 'Applied', date: T.addDays(t, -2) }
      ],
      weights: [{ date: '2026-10-21', weight: 221.4 }, { date: T.addDays(t, -2), weight: 219.8 }]
    };
  }

  U.stars(); load();
})();

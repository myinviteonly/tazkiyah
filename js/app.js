/* ================================================================
   Tazkiyah: main app
   ================================================================ */
(function () {
  const T = window.TZ, S = window.TZStore, U = window.TZUI, C = T.C, I = U.ICONS;
  const { esc, $, $$ } = T;
  S.load();
  const st = () => S.state;
  let current = 'today';
  let workoutKey = null; // session shown on the workout tab

  // ---------- prayer times ----------
  function prayerTimes(s) {
    const set = st().settings;
    const d = T.parse(s);
    let t = {};
    try { t = window.SalahTimes.getTimesForDate(d, set.lat, set.lng, set.method, set.asr); } catch (e) { return {}; }
    const out = {};
    T.PRAYERS.forEach(p => {
      const v = t[p.id]; if (!v || v.indexOf(':') < 0) return;
      let [h, m] = v.split(':').map(Number); let mins = h * 60 + m + (Number(set.offsets[p.id]) || 0);
      mins = (mins + 1440) % 1440; out[p.id] = `${T.pad(Math.floor(mins / 60))}:${T.pad(mins % 60)}`;
    });
    return out;
  }
  function nextPrayer(times) {
    const now = new Date(); const n = now.getHours() * 60 + now.getMinutes();
    for (const p of T.PRAYERS) { if (!times[p.id]) continue; const [h, m] = times[p.id].split(':').map(Number); if (h * 60 + m > n) return p.id; }
    return null;
  }

  // ---------- sync pill ----------
  const syncLabels = { synced: 'Synced', syncing: 'Syncing', pending: 'Saving', error: 'Sync error', 'offline-setup': 'Not connected' };
  function setSync(status) {
    const el = $('#sync'); if (!el) return;
    el.className = 'sync ' + status; el.innerHTML = `<i></i>${syncLabels[status] || ''}`;
  }
  S.onSync(setSync);

  // ================================================================
  // TODAY
  // ================================================================
  function renderToday() {
    const s = T.today(); const day = S.day(s); const set = st().settings;
    const ev = T.evaluate(s, day, set);
    const times = prayerTimes(s); const nxt = nextPrayer(times);
    const rem = T.reminderFor(s), les = T.lessonFor(s);
    const classes = T.classesFor(s);
    const sess = ev.session;
    const hijri = window.SalahHijri ? window.SalahHijri.formatHijri(new Date()) : '';
    const hour = new Date().getHours();
    const wkJobs = T.jobsThisWeek(st().jobs, s).length;
    const strk = T.streak(st().days, set);

    let sleepBanner = '';
    if (hour >= 19 && T.earlyClassTomorrow(s)) sleepBanner = `<div class="banner">${I.moon}<div><b>8:10 AM class tomorrow.</b> Be in bed by 1 AM at the latest so you can make it rested.</div></div>`;
    else if (hour < 5 && T.classesFor(s).some(c => c.start <= '09:00')) sleepBanner = `<div class="banner">${I.moon}<div><b>You have class at 8:10 AM today.</b> Time to sleep now.</div></div>`;

    const setupBanner = S.configured() ? '' : `<div class="banner info">${I.link}<div><b>Connect your Google Sheet</b> so Marwa's live view updates. <a href="#settings">Open Settings</a></div></div>`;

    const row = (attrs, on, title, sub, end, extraCls) => `<button class="row ${on ? 'on' : ''} ${extraCls || ''}" ${attrs}><span class="tick">${I.check}</span><span class="row-main"><span class="row-title">${title}</span>${sub ? `<span class="row-sub">${sub}</span>` : ''}</span>${end ? `<span class="row-end">${end}</span>` : ''}</button>`;

    const prayersHTML = T.PRAYERS.map(p => row(`data-pray="${p.id}"`, day.prayers[p.id], `${p.name} <span class="arn">${p.ar}</span>`, '', times[p.id] ? T.to12(times[p.id]) : '', nxt === p.id ? 'next' : '')).join('');

    const classesHTML = classes.length ? classes.map(c => {
      const v = day.classes[c.id];
      return `<div class="row ${v === 'attended' ? 'on' : ''} ${v === 'cancelled' ? 'na' : ''}"><span class="tick ${v === 'attended' ? 'on' : ''}">${I.check}</span>
        <span class="row-main"><span class="row-title">${esc(c.course)}</span><span class="row-sub">${c.kind} · ${c.room} · ${T.to12(c.start)} to ${T.to12(c.end)}</span></span>
        <span class="seg"><button data-class="${c.id}" data-v="attended" class="${v === 'attended' ? 'sel' : ''}">Went</button><button data-class="${c.id}" data-v="cancelled" class="${v === 'cancelled' ? 'sel alt' : ''}">Cancelled</button></span></div>`;
    }).join('') : `<div class="empty">${s > C.termEnd ? 'The term is over. No classes to track.' : 'No classes today.'}</div>`;

    // body card
    let bodyMain = '';
    if (sess.type === 'lift') {
      const sum = T.summaryFor(s, day, set);
      bodyMain = `<button class="row ${day.workout.done ? 'on' : ''}" data-go="workout"><span class="tick">${I.check}</span><span class="row-main"><span class="row-title">${esc(sess.name)}</span><span class="row-sub">${esc(sess.focus)} · ${sum.setsDone}/${sum.setsPlanned} sets logged</span></span><span class="row-end">Open ›</span></button>`;
    } else if (sess.type === 'walk') {
      bodyMain = row('data-walk="1"', day.workout.walk || day.workout.done, esc(sess.name), `${esc(sess.focus)}`, '');
      if (sess.optional) bodyMain += `<button class="row" data-go="workout"><span class="tick" style="border-style:dashed">${I.plus.replace('currentColor', '#9CC4FF')}</span><span class="row-main"><span class="row-title">Optional 8-minute core</span><span class="row-sub">Reverse crunch, dead bug, plank</span></span><span class="row-end">Open ›</span></button>`;
    } else {
      bodyMain = `<div class="row"><span class="tick" style="opacity:.4"></span><span class="row-main"><span class="row-title">Rest day</span><span class="row-sub">Meal prep, sleep and recovery. Rest is part of the plan.</span></span></div>`;
    }
    const goal = ev.stepGoal; const pctSteps = Math.min(100, Math.round(((day.steps || 0) / goal) * 100));
    const labNote = T.isLabDay(s) ? `<div class="tiny muted mt8">Lab day: use the free time after attendance for a long walk. Goal is higher today.</div>` : '';

    const charHTML = T.CHARACTER.map(ch => row(`data-char="${ch.id}"`, day.character[ch.id], ch.label, ch.sub, '')).join('');

    const html = `
      ${setupBanner}${sleepBanner}
      <div class="mt8" style="margin:0 2px 16px">
        <div class="hello">Assalamu alaikum, <em>${esc(C.ownerName)}</em></div>
        <div class="dateline">${T.fmtDate(s)}<span class="dot">•</span>${esc(hijri)}</div>
      </div>

      <div class="card hero">
        <div class="ring-box">${T.ring(ev.pct, 112, 10)}<div class="ring-num"><div><b>${ev.pct}%</b><span>today</span></div></div></div>
        <div class="hero-txt">
          <h2>${ev.pct === 100 ? 'A complete day. Alhamdulillah.' : ev.pct >= 60 ? 'Keep going, you are close.' : 'One step at a time.'}</h2>
          <p>${ev.done} of ${ev.total} done</p>
          <div class="chips">
            <span class="chip ${ev.prayers === 5 ? 'ok' : ''}">${ev.prayers}/5 salah</span>
            <span class="chip">${strk} day streak</span>
            <span class="chip">${wkJobs} jobs this week</span>
          </div>
        </div>
      </div>

      <div class="card bubble" id="reminder">
        <div class="card-h"><span class="card-t">${I.sparkle} Today's reminder</span><span class="type-tag">${esc(rem.type)}</span></div>
        <div class="ar" lang="ar">${esc(rem.ar)}</div>
        <div class="tr">${esc(rem.tr)}</div>
        <div class="en">${esc(rem.en)}</div>
        <div class="ref">${esc(rem.ref)}</div>
        <div class="mt12">${row('data-flag="reminderRead"', day.reminderRead, day.reminderRead ? 'Read and reflected' : 'I read this today', '', '')}</div>
      </div>

      <div class="card">
        <div class="card-h"><span class="card-t">${I.moon} Salah</span><span class="card-meta">${ev.prayers}/5</span></div>
        <div class="rows">${prayersHTML}</div>
      </div>

      <div class="card">
        <div class="card-h"><span class="card-t">${I.grad} Classes</span><span class="card-meta">${classes.length ? ev.items.filter(i => i.group === 'Classes' && i.done).length + '/' + ev.items.filter(i => i.group === 'Classes' && !i.na).length : ''}</span></div>
        <div class="rows">${classesHTML}</div>
      </div>

      <div class="card">
        <div class="card-h"><span class="card-t">${I.dumbbell} Body</span><span class="card-meta">Week ${Math.max(1, T.planWeek(s))} of plan</span></div>
        <div class="rows">${bodyMain}
          <div class="row" style="display:block">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="row-title">${I.walk.replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px;margin-right:6px"')}Steps</span><span class="row-end">${(day.steps || 0).toLocaleString()} / ${goal.toLocaleString()}</span></div>
            <div class="steps-wrap"><input id="steps" class="in" type="number" inputmode="numeric" min="0" placeholder="0" value="${day.steps || ''}"><button class="btn ghost sm" data-add="1000">+1k</button><button class="btn ghost sm" data-add="2500">+2.5k</button></div>
            <div class="bar"><i style="width:${pctSteps}%"></i></div>${labNote}
          </div>
          ${row('data-flag="protein"', day.protein, 'Hit protein target', 'About 180-200 g today', '')}
        </div>
      </div>

      <div class="card">
        <div class="card-h"><span class="card-t">${I.shield} Character</span><span class="card-meta">${T.CHARACTER.filter(c => day.character[c.id]).length}/3</span></div>
        <div class="rows">${charHTML}</div>
      </div>

      <div class="card">
        <div class="card-h"><span class="card-t">${I.heart} Today's lesson</span><span class="card-meta">Being a better partner</span></div>
        <div class="lesson-title">${esc(les.title)}</div>
        <div class="lesson-body">${esc(les.body)}</div>
        <div class="action-box"><b>Try this today</b>${esc(les.action)}</div>
        <div class="mt12">${row('data-flag="lessonDone"', day.lessonDone, day.lessonDone ? 'Done today' : 'I did today\'s action', '', '')}</div>
      </div>

      <div class="card">
        <div class="card-h"><span class="card-t">${I.briefcase} Job search</span><span class="card-meta">${wkJobs}/${set.jobGoal} this week</span></div>
        <div class="bar" style="margin-top:0"><i style="width:${Math.min(100, Math.round(wkJobs / Math.max(1, set.jobGoal) * 100))}%"></i></div>
        <div class="btn-row mt12"><button class="btn ghost" data-addjob="1">${I.plus} Log an application</button></div>
      </div>

      <button class="btn block" id="shareCard">${I.share} Send today's card to Marwa</button>
      <p class="center tiny muted mt12">${esc(C.tagline)}</p>
    `;
    $('#view-today').innerHTML = html;
  }

  function onTodayClick(e) {
    const s = T.today(); const day = S.day(s);
    const b = e.target.closest('button'); if (!b) return;
    const before = T.evaluate(s, day, st().settings).pct;
    let changed = false, turnedOn = false;
    if (b.dataset.pray) { const k = b.dataset.pray; day.prayers[k] = !day.prayers[k]; turnedOn = day.prayers[k]; changed = true; }
    else if (b.dataset.class) { const k = b.dataset.class, v = b.dataset.v; day.classes[k] = day.classes[k] === v ? undefined : v; if (!day.classes[k]) delete day.classes[k]; turnedOn = day.classes[k] === 'attended'; changed = true; }
    else if (b.dataset.char) { const k = b.dataset.char; day.character[k] = !day.character[k]; turnedOn = day.character[k]; changed = true; }
    else if (b.dataset.flag) { const k = b.dataset.flag; day[k] = !day[k]; turnedOn = day[k]; changed = true; }
    else if (b.dataset.walk) { day.workout.walk = !day.workout.walk; turnedOn = day.workout.walk; changed = true; }
    else if (b.dataset.add) { day.steps = (Number(day.steps) || 0) + Number(b.dataset.add); turnedOn = day.steps >= T.stepGoalFor(s, st().settings); changed = true; }
    else if (b.dataset.go) { location.hash = b.dataset.go; return; }
    else if (b.dataset.addjob) { jobSheet(); return; }
    else if (b.id === 'shareCard') { window.TZCard.share(s, day, st().settings, st().jobs); return; }
    if (!changed) return;
    if (turnedOn) U.burstAt(b, 3);
    S.touchDay(s); renderToday();
    const after = T.evaluate(s, day, st().settings);
    if (after.pct === 100 && before < 100) { U.celebrate(); U.toast('A complete day. Alhamdulillah.'); }
    else if (b.dataset.pray && after.prayers === 5 && turnedOn) { U.celebrate(); U.toast('All five prayers. MashaAllah.'); }
  }

  function onTodayChange(e) {
    if (e.target.id === 'steps') {
      const s = T.today(); const day = S.day(s);
      day.steps = Math.max(0, Math.round(Number(e.target.value) || 0));
      S.touchDay(s); renderToday();
    }
  }

  // ================================================================
  // WORKOUT
  // ================================================================
  function lastSets(exId, s) {
    const dates = Object.keys(st().days).filter(d => d < s).sort().reverse();
    for (const d of dates) { const w = st().days[d].workout; const arr = w && w.sets && w.sets[exId]; if (arr && arr.some(x => x && x.done)) return { date: d, sets: arr.filter(x => x && x.done) }; }
    return null;
  }
  const restSecs = r => { const m = String(r).match(/\d+/); return m ? Number(m[0]) : 60; };

  function renderWorkout() {
    const s = T.today(); const day = S.day(s);
    const scheduled = T.sessionKeyFor(s);
    const key = workoutKey || day.workout.session || scheduled;
    const sess = C.sessions[key];
    const week = Math.max(1, T.planWeek(s));
    const lifts = ['upperA', 'lowerA', 'upperB', 'lowerB'];
    const tabs = [scheduled].concat(lifts.filter(k => k !== scheduled)).map(k => `<button data-sess="${k}" class="${k === key ? 'sel' : ''}">${k === scheduled ? 'Today · ' : ''}${esc(C.sessions[k].name)}</button>`).join('');

    let body = '';
    if (sess.type === 'lift') {
      const note = week <= C.techniqueWeeks ? `<div class="banner info">${I.sparkle}<div><b>Week ${week}: technique phase.</b> Only 2 working sets per exercise until ${T.fmtDate(T.addDays(C.planStart, C.techniqueWeeks * 7 - 1), { month: 'short', day: 'numeric' })}.</div></div>` : '';
      const sets = day.workout.sets || {};
      body = note + sess.exercises.map(ex => {
        const n = T.setsFor(ex, s); const logged = sets[ex.id] || [];
        const last = lastSets(ex.id, s);
        const lastTxt = last ? `Last time (${T.fmtShort(last.date)}): ${last.sets.map(x => (x.w ? x.w + '×' : '') + (x.r || '?')).join(', ')}` : 'First time logging this one. Pick a weight that leaves 1-3 reps in reserve.';
        const complete = logged.slice(0, n).filter(x => x && x.done).length === n;
        let rows = '';
        for (let i = 0; i < n; i++) {
          const v = logged[i] || {}; const lp = last && last.sets[i] ? last.sets[i] : (last ? last.sets[last.sets.length - 1] : {});
          rows += `<div class="set"><span class="n">${i + 1}</span>
            <input class="in" inputmode="decimal" type="number" step="0.5" data-ex="${ex.id}" data-i="${i}" data-f="w" placeholder="${ex.bodyweight ? 'BW' : (lp.w || 'lb')}" value="${v.w || ''}">
            <input class="in" inputmode="numeric" type="number" data-ex="${ex.id}" data-i="${i}" data-f="r" placeholder="${lp.r || (ex.timed ? 'sec' : 'reps')}" value="${v.r || ''}">
            <button class="tick ${v.done ? 'on' : ''}" data-settick="${ex.id}" data-i="${i}" data-rest="${restSecs(ex.rest)}" aria-label="Set done">${I.check}</button></div>`;
        }
        return `<div class="ex ${complete ? 'complete' : ''}" id="ex-${ex.id}">
          <div class="ex-h"><div><div class="ex-name">${esc(ex.name)}</div><div class="ex-meta">${n} × ${esc(ex.reps)} · rest ${esc(ex.rest)} · ${esc(ex.target)}</div></div></div>
          <div class="ex-last">${esc(lastTxt)}</div>
          <div class="set-labels"><span>Set</span><span>${ex.bodyweight ? 'Weight' : 'lb each'}</span><span>${ex.timed ? 'Seconds' : 'Reps'}</span><span></span></div>
          ${rows}
          <details><summary>How to do it ›</summary><p>${esc(ex.cue)}</p></details>
        </div>`;
      }).join('') + `
        <button class="btn block mt12" id="finishWorkout">${day.workout.done && (day.workout.session || scheduled) === key ? 'Workout complete ✓' : 'Finish workout'}</button>
        <p class="tiny muted center mt8">Short on time? Do 2 sets of any 3 main movements and tap Finish. A 20-minute workout beats losing the week.</p>`;
    } else if (sess.type === 'walk') {
      const core = day.workout.core || {};
      body = `<div class="card"><div class="lesson-title">${esc(sess.name)}</div><p class="lesson-body">${esc(sess.focus)}. Talk-in-full-sentences pace, slightly breathless.</p>
        <button class="row ${day.workout.walk ? 'on' : ''}" data-wwalk="1"><span class="tick">${I.check}</span><span class="row-main"><span class="row-title">Walk done</span><span class="row-sub">${esc(sess.time)}</span></span></button></div>`;
      if (sess.optional) {
        body += `<div class="card"><div class="card-h"><span class="card-t">Optional 8-min core</span><span class="card-meta">2 rounds</span></div><div class="rows">` +
          [0, 1].map(r => sess.optional.map(x => { const k = `${x.id}-${r}`; return `<button class="row ${core[k] ? 'on' : ''}" data-core="${k}"><span class="tick">${I.check}</span><span class="row-main"><span class="row-title">${esc(x.name)}</span><span class="row-sub">Round ${r + 1} · ${esc(x.reps)}</span></span></button>`; }).join('')).join('') +
          `</div><p class="tiny muted mt8">Rest 30-45 seconds between rounds.</p></div>`;
      }
    } else {
      body = `<div class="card center"><div class="float" style="width:64px;margin:6px auto 10px;color:var(--blue-2)">${I.butterfly}</div><div class="lesson-title">Rest day</div><p class="lesson-body">Meal prep, sleep and recovery. Muscle is built while you rest.</p><p class="small muted">Missed a workout this week? Pick one from the tabs above. Do not double up sets.</p></div>`;
    }

    $('#view-workout').innerHTML = `<h1 class="page-h">Workout<small>${esc(sess.name)}${sess.time ? ' · ' + esc(sess.time) : ''} · Week ${week}</small></h1>
      <div class="tabs-mini">${tabs}</div>${body}`;
  }

  let restInt;
  function startRest(secs) {
    const el = $('#restTimer'); clearInterval(restInt); let left = secs;
    const draw = () => { el.innerHTML = `${I.clock.replace('<svg', '<svg width="18" height="18"')} Rest ${Math.floor(left / 60)}:${T.pad(left % 60)} <button id="skipRest">Skip</button>`; };
    draw(); el.classList.add('show');
    restInt = setInterval(() => { left--; if (left <= 0) { clearInterval(restInt); el.classList.remove('show'); U.toast('Rest done. Next set.'); try { navigator.vibrate && navigator.vibrate(200); } catch (e) {} return; } draw(); }, 1000);
  }

  function onWorkoutClick(e) {
    const s = T.today(); const day = S.day(s);
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'skipRest') { clearInterval(restInt); $('#restTimer').classList.remove('show'); return; }
    if (b.dataset.sess) { workoutKey = b.dataset.sess; renderWorkout(); return; }
    const key = workoutKey || day.workout.session || T.sessionKeyFor(s);
    if (b.dataset.settick) {
      const ex = b.dataset.settick, i = Number(b.dataset.i);
      day.workout.sets[ex] = day.workout.sets[ex] || [];
      const cur = day.workout.sets[ex][i] = day.workout.sets[ex][i] || {};
      cur.done = !cur.done;
      if (cur.done) {
        const wIn = $(`input[data-ex="${ex}"][data-i="${i}"][data-f="w"]`), rIn = $(`input[data-ex="${ex}"][data-i="${i}"][data-f="r"]`);
        if (!wIn.value && wIn.placeholder && !isNaN(Number(wIn.placeholder))) { wIn.value = wIn.placeholder; cur.w = Number(wIn.placeholder); }
        if (!rIn.value && rIn.placeholder && !isNaN(Number(rIn.placeholder))) { rIn.value = rIn.placeholder; cur.r = Number(rIn.placeholder); }
        U.burstAt(b, 2); startRest(Number(b.dataset.rest));
      }
      b.classList.toggle('on', cur.done);
      if (key !== T.sessionKeyFor(s)) day.workout.session = key;
      const sess = C.sessions[key];
      const exDef = sess.exercises.find(x => x.id === ex);
      const n = T.setsFor(exDef, s);
      $('#ex-' + ex).classList.toggle('complete', day.workout.sets[ex].slice(0, n).filter(x => x && x.done).length === n);
      const all = sess.exercises.every(x => (day.workout.sets[x.id] || []).slice(0, T.setsFor(x, s)).filter(y => y && y.done).length === T.setsFor(x, s));
      if (all && !day.workout.done) { day.workout.done = true; day.workout.session = key === T.sessionKeyFor(s) ? undefined : key; S.touchDay(s); U.celebrate(); U.toast('Workout complete. Strong work.'); renderWorkout(); return; }
      S.touchDay(s); return;
    }
    if (b.id === 'finishWorkout') {
      day.workout.done = true; if (key !== T.sessionKeyFor(s)) day.workout.session = key;
      S.touchDay(s); U.celebrate(); U.toast('Workout saved.'); renderWorkout(); return;
    }
    if (b.dataset.wwalk) { day.workout.walk = !day.workout.walk; if (day.workout.walk) U.burstAt(b, 3); S.touchDay(s); renderWorkout(); return; }
    if (b.dataset.core) { const k = b.dataset.core; day.workout.core[k] = !day.workout.core[k]; if (day.workout.core[k]) U.burstAt(b, 2); S.touchDay(s); renderWorkout(); return; }
  }

  let inputT;
  function onWorkoutInput(e) {
    const t = e.target; if (!t.dataset.ex) return;
    const s = T.today(); const day = S.day(s);
    const ex = t.dataset.ex, i = Number(t.dataset.i), f = t.dataset.f;
    day.workout.sets[ex] = day.workout.sets[ex] || [];
    const cur = day.workout.sets[ex][i] = day.workout.sets[ex][i] || {};
    cur[f] = t.value === '' ? undefined : Number(t.value);
    const key = workoutKey || T.sessionKeyFor(s);
    if (key !== T.sessionKeyFor(s)) day.workout.session = key;
    clearTimeout(inputT); inputT = setTimeout(() => S.touchDay(s), 600);
  }

  // ================================================================
  // JOBS
  // ================================================================
  const MODES = ['Remote', 'Hybrid', 'On-site'];
  const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected', 'No response'];
  const modeCls = m => m === 'Remote' ? 'remote' : m === 'Hybrid' ? 'hybrid' : 'onsite';

  function jobSheet(job) {
    const j = job || { company: '', role: '', mode: 'Remote', status: 'Applied', date: T.today(), link: '' };
    U.sheet(`
      <h3 class="h-serif" style="font-size:24px">${job ? 'Edit application' : 'Log an application'}</h3>
      <label class="f">Company</label><input class="in" id="jCompany" value="${esc(j.company)}" placeholder="e.g. Shopify" autocomplete="off">
      <label class="f">Role</label><input class="in" id="jRole" value="${esc(j.role)}" placeholder="e.g. Junior Full Stack Developer" autocomplete="off">
      <div class="grid2"><div><label class="f">Work type</label><select class="in" id="jMode">${MODES.map(m => `<option ${m === j.mode ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
      <div><label class="f">Date applied</label><input class="in" type="date" id="jDate" value="${esc(j.date)}"></div></div>
      <label class="f">Status</label><select class="in" id="jStatus">${STATUSES.map(m => `<option ${m === j.status ? 'selected' : ''}>${m}</option>`).join('')}</select>
      <label class="f">Posting link (optional)</label><input class="in" id="jLink" value="${esc(j.link || '')}" placeholder="https://" inputmode="url" autocomplete="off">
      <div class="btn-row mt16"><button class="btn" id="jSave">${I.check.replace('stroke-width="3"', 'stroke-width="2.4"')} Save</button>${job ? `<button class="btn danger" id="jDel">${I.trash}</button>` : ''}</div>
    `, sh => {
      $('#jSave', sh).onclick = () => {
        const data = { id: j.id, company: $('#jCompany', sh).value.trim(), role: $('#jRole', sh).value.trim(), mode: $('#jMode', sh).value, date: $('#jDate', sh).value || T.today(), status: $('#jStatus', sh).value, link: $('#jLink', sh).value.trim() };
        if (!data.company || !data.role) { U.toast('Add the company and role'); return; }
        S.upsertJob(data); U.closeSheet(); U.toast(job ? 'Updated' : 'Application logged'); if (!job) U.burst(innerWidth / 2, innerHeight * 0.8, 4); render();
      };
      const del = $('#jDel', sh); if (del) del.onclick = () => { if (confirmInline(del)) { S.deleteJob(j.id); U.closeSheet(); U.toast('Deleted'); render(); } };
    });
  }
  // two-tap confirm without browser dialogs
  function confirmInline(btn) { if (btn.dataset.armed) return true; btn.dataset.armed = '1'; btn.textContent = 'Tap again to delete'; setTimeout(() => { delete btn.dataset.armed; btn.innerHTML = I.trash; }, 2500); return false; }

  function renderJobs() {
    const set = st().settings; const jobs = st().jobs.slice().sort((a, b) => a.date < b.date ? 1 : -1);
    const wk = T.jobsThisWeek(jobs).length;
    const interviews = jobs.filter(j => j.status === 'Interview' || j.status === 'Offer').length;
    const groups = {};
    jobs.forEach(j => { const w = T.weekStart(j.date); (groups[w] = groups[w] || []).push(j); });
    const list = Object.keys(groups).sort().reverse().map(w => `
      <div class="card"><div class="card-h"><span class="card-t">Week of ${T.fmtDate(w, { month: 'short', day: 'numeric' })}</span><span class="card-meta">${groups[w].length} applied</span></div>
      ${groups[w].map(j => `<div class="item" data-job="${j.id}" style="cursor:pointer"><div class="item-main"><div class="item-t">${esc(j.role)}</div><div class="item-s">${esc(j.company)} · ${T.fmtShort(j.date)}</div></div><span class="badge ${modeCls(j.mode)}">${esc(j.mode)}</span><span class="status ${esc(j.status.replace(' ', ''))}">${esc(j.status)}</span></div>`).join('')}</div>`).join('');

    const li = q => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=Canada&f_WT=2%2C3&f_E=1%2C2&sortBy=DD`;
    const ind = q => `https://ca.indeed.com/jobs?q=${encodeURIComponent(q)}&l=Remote&sort=date`;

    $('#view-jobs').innerHTML = `<h1 class="page-h">Job search<small>Entry level, remote or hybrid</small></h1>
      <div class="stats">
        <div class="stat"><b>${wk}<span style="font-size:14px;color:var(--muted)">/${set.jobGoal}</span></b><span>This week</span></div>
        <div class="stat"><b>${jobs.length}</b><span>Total applied</span></div>
        <div class="stat"><b>${interviews}</b><span>Interviews</span></div>
      </div>
      <div class="bar"><i style="width:${Math.min(100, Math.round(wk / Math.max(1, set.jobGoal) * 100))}%"></i></div>
      <button class="btn block mt16" data-addjob="1">${I.plus} Log an application</button>

      <div class="card mt16"><div class="card-h"><span class="card-t">${I.search} Find roles that fit your resume</span></div>
        <p class="small muted" style="margin-top:-4px">Newest first, remote and hybrid, entry level, in Canada.</p>
        ${C.jobSearches.map(q => `<div class="item"><div class="item-main"><div class="item-t">${esc(q)}</div></div><a class="btn ghost sm" href="${li(q)}" target="_blank" rel="noopener">LinkedIn</a><a class="btn ghost sm" href="${ind(q)}" target="_blank" rel="noopener">Indeed</a></div>`).join('')}
      </div>
      ${list || `<div class="card empty">No applications logged yet. Each one you log shows up in Marwa's view with the company, role and work type.</div>`}`;
  }
  function onJobsClick(e) {
    const add = e.target.closest('[data-addjob]'); if (add) { jobSheet(); return; }
    const it = e.target.closest('[data-job]'); if (it) { jobSheet(st().jobs.find(j => j.id === it.dataset.job)); }
  }

  // ================================================================
  // PROGRESS
  // ================================================================
  function weightSheet() {
    const last = st().weights[st().weights.length - 1];
    U.sheet(`<h3 class="h-serif" style="font-size:24px">Weigh-in</h3><p class="small muted">Morning, after the bathroom, before eating. Marwa sees your weight only. Waist stays private on your phone.</p>
      <div class="grid2"><div><label class="f">Weight (lb)</label><input class="in" id="wW" type="number" step="0.1" inputmode="decimal" placeholder="${last ? last.weight : C.startWeight}"></div>
      <div><label class="f">Waist (in, private)</label><input class="in" id="wWaist" type="number" step="0.1" inputmode="decimal" placeholder="optional"></div></div>
      <label class="f">Date</label><input class="in" id="wD" type="date" value="${T.today()}">
      <button class="btn block mt16" id="wSave">Save weigh-in</button>`, sh => {
      setTimeout(() => $('#wW', sh).focus(), 350);
      $('#wSave', sh).onclick = () => {
        const w = Number($('#wW', sh).value); if (!w || w < 80 || w > 500) { U.toast('Enter your weight in lb'); return; }
        const rec = { date: $('#wD', sh).value || T.today(), weight: Math.round(w * 10) / 10 };
        const waist = Number($('#wWaist', sh).value); if (waist) rec.waist = waist;
        S.upsertWeight(rec); U.closeSheet(); U.toast('Weigh-in saved'); render();
      };
    });
  }

  function renderProgress() {
    const set = st().settings, s = T.today(), ws = T.weekStart(s);
    const weekDays = Array.from({ length: 7 }, (_, i) => T.addDays(ws, i));
    let pr = 0, prT = 0, lifts = 0, liftT = 0, cl = 0, clT = 0, stepsSum = 0, stepsN = 0;
    const strip = weekDays.map(d => {
      const day = st().days[d]; const ev = T.evaluate(d, day, set);
      if (d <= s) {
        pr += ev.prayers; prT += 5;
        if (ev.session.type === 'lift') { liftT++; if (day && day.workout && day.workout.done) lifts++; }
        ev.items.filter(i => i.group === 'Classes' && !i.na).forEach(i => { clT++; if (i.done) cl++; });
        if (day && day.steps) { stepsSum += day.steps; stepsN++; }
      }
      return `<div class="wd ${d === s ? 'today' : ''} ${d > s ? 'future' : ''} ${ev.pct >= 80 ? 'hi' : ''}"><div class="wn">${T.parse(d).toLocaleDateString('en-CA', { weekday: 'short' })}</div><div class="wv">${d > s ? '·' : ev.pct}</div><div class="wp">${d > s ? '' : ev.prayers + '/5'}</div></div>`;
    }).join('');

    const ws_ = st().weights;
    const lastW = ws_.length ? ws_[ws_.length - 1] : null;
    const a7 = T.avg7(ws_, s);
    const cur = a7 || (lastW && lastW.weight) || C.startWeight;
    const lost = C.startWeight - cur;
    const togo = cur - C.goalWeight;
    const weeksLeft = Math.max(0.1, T.diffDays(s, C.goalDate) / 7);
    const need = togo / weeksLeft;
    const planned = T.plannedWeight(s);
    const onPace = cur <= planned + 1;
    const phase = C.roadmap.find(r => s >= r.from && s <= r.to) || C.roadmap[0];

    $('#view-progress').innerHTML = `<h1 class="page-h">Progress<small>This week and the road to ${C.goalWeight} lb</small></h1>
      <div class="card"><div class="card-h"><span class="card-t">${I.today} This week</span><span class="card-meta">Score per day</span></div>
        <div class="week">${strip}</div>
        <div class="stats mt12">
          <div class="stat"><b>${pr}<span style="font-size:14px;color:var(--muted)">/${prT}</span></b><span>Prayers</span></div>
          <div class="stat"><b>${lifts}<span style="font-size:14px;color:var(--muted)">/${liftT}</span></b><span>Workouts</span></div>
          <div class="stat"><b>${clT ? cl + '<span style="font-size:14px;color:var(--muted)">/' + clT + '</span>' : '–'}</b><span>Classes</span></div>
        </div>
        <p class="small muted mt12" style="margin-bottom:0">Average steps: <b style="color:var(--ink)">${stepsN ? Math.round(stepsSum / stepsN).toLocaleString() : '–'}</b></p>
      </div>

      <div class="card"><div class="card-h"><span class="card-t">${I.chart} Weight</span><button class="btn sm" id="addWeight">${I.plus} Weigh-in</button></div>
        ${T.weightChart(ws_)}
        <div class="legend"><span><i></i>Your weigh-ins</span><span><i class="plan"></i>Plan</span><span><i class="goal"></i>Goal</span></div>
        <div class="stats mt12">
          <div class="stat"><b>${cur.toFixed(1)}</b><span>${a7 ? '7-day avg' : 'Current'}</span></div>
          <div class="stat"><b>${lost >= 0 ? '−' : '+'}${Math.abs(lost).toFixed(1)}</b><span>Since start</span></div>
          <div class="stat"><b>${Math.max(0, togo).toFixed(1)}</b><span>To go</span></div>
        </div>
        <div class="chips mt12"><span class="chip ${onPace ? 'ok' : 'warn'}">${onPace ? 'On pace' : 'Behind plan line'}</span><span class="chip">Needs ${need.toFixed(2)} lb/week</span><span class="chip">${Math.round(weeksLeft)} weeks to ${T.fmtDate(C.goalDate, { month: 'short', day: 'numeric' })}</span></div>
        <p class="tiny muted mt12" style="margin-bottom:0">Safe range is about 1 to 1.5 lb a week. Going faster mostly costs muscle, and muscle is what gives you the shape you want. Extra walking is the safest way to speed things up.</p>
      </div>

      <div class="card"><div class="card-h"><span class="card-t">${I.sparkle} Roadmap</span></div>
        ${C.roadmap.map(r => `<div class="item"><div class="item-main"><div class="item-t" style="white-space:normal;${r === phase ? 'color:var(--blue-3)' : ''}">${r === phase ? '● ' : ''}${esc(r.name)}</div><div class="item-s">${T.fmtDate(r.from, { month: 'short', day: 'numeric' })} to ${T.fmtDate(r.to, { month: 'short', day: 'numeric' })} · ${esc(r.text)}</div></div></div>`).join('')}
      </div>

      <div class="card"><div class="card-h"><span class="card-t">Weigh-in history</span></div>
        ${ws_.length ? ws_.slice().reverse().map(w => `<div class="item"><div class="item-main"><div class="item-t">${w.weight} lb</div><div class="item-s">${T.fmtShort(w.date)}${w.waist ? ` · waist ${w.waist} in (private)` : ''}</div></div><button class="btn ghost sm" data-delw="${w.date}">${I.trash}</button></div>`).join('') : '<div class="empty">No weigh-ins yet. Your plan started at 221.4 lb on Oct 21.</div>'}
      </div>`;
  }
  function onProgressClick(e) {
    if (e.target.closest('#addWeight')) { weightSheet(); return; }
    const d = e.target.closest('[data-delw]'); if (d) { if (confirmInline(d)) { S.deleteWeight(d.dataset.delw); render(); } }
  }

  // ================================================================
  // SETTINGS
  // ================================================================
  function herLink() {
    const set = st().settings; if (!set.apiUrl || !set.readKey) return '';
    const base = new URL('share.html', location.href.split('#')[0]).href;
    return `${base}?k=${encodeURIComponent(set.readKey)}&api=${encodeURIComponent(set.apiUrl)}`;
  }
  function renderSettings() {
    const set = st().settings; const link = herLink();
    const methods = (window.SalahTimes && window.SalahTimes.METHODS) || [];
    const times = prayerTimes(T.today());
    $('#view-settings').innerHTML = `<h1 class="page-h">Settings</h1>

      <div class="card"><div class="card-h"><span class="card-t">${I.link} 1. Your keys</span></div>
        <p class="small muted" style="margin-top:-4px">Two random passwords. The write key lets this app save. The read key lets Marwa view. Copy both into the Google Script (see the guide).</p>
        <label class="f">Write key (keep private)</label><div class="code" id="wk">${esc(set.writeKey || 'Not generated yet')}</div>
        <label class="f">Read key (goes in Marwa's link)</label><div class="code" id="rk">${esc(set.readKey || 'Not generated yet')}</div>
        <div class="btn-row mt12">
          <button class="btn ${set.writeKey ? 'ghost' : ''}" id="genKeys">${set.writeKey ? 'Make new keys' : 'Generate keys'}</button>
          ${set.writeKey ? `<button class="btn ghost" id="copyKeys">${I.copy} Copy for script</button>` : ''}
        </div>
      </div>

      <div class="card"><div class="card-h"><span class="card-t">${I.link} 2. Google Sheet connection</span><span id="sync2" class="card-meta">${st().lastSync ? 'Last sync ' + new Date(st().lastSync).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}</span></div>
        <label class="f">Web app URL (ends in /exec)</label><input class="in mono" id="apiUrl" value="${esc(set.apiUrl)}" placeholder="https://script.google.com/macros/s/.../exec" autocomplete="off" autocapitalize="off" spellcheck="false">
        ${st().lastError ? `<p class="small" style="color:var(--bad)">Last error: ${esc(st().lastError)}</p>` : ''}
        <div class="btn-row mt12"><button class="btn" id="saveApi">Save &amp; test</button><button class="btn ghost" id="syncAll">Sync everything</button></div>
        <button class="btn ghost block mt8" id="restore">Restore my data from the sheet</button>
      </div>

      <div class="card"><div class="card-h"><span class="card-t">${I.heart} 3. Marwa's live link</span></div>
        ${link ? `<p class="small muted" style="margin-top:-4px">She opens this in Safari, taps Share, then Add to Home Screen. It updates live whenever you check something off. It is read-only.</p>
          <div class="code">${esc(link)}</div>
          <div class="btn-row mt12"><button class="btn" id="shareLink">${I.share} Send link</button><button class="btn ghost" id="copyLink">${I.copy} Copy</button><a class="btn ghost" href="${esc(link)}" target="_blank" rel="noopener">Preview</a></div>`
          : `<p class="small muted">Finish steps 1 and 2 first. Her link appears here.</p>`}
      </div>

      <div class="card"><div class="card-h"><span class="card-t">${I.moon} Prayer times</span></div>
        <p class="small muted" style="margin-top:-4px">Match your masjid: pick the method closest to its timetable, then nudge each prayer by minutes until the times below match.</p>
        <div class="grid2"><div><label class="f">Method</label><select class="in" id="method">${methods.map(m => `<option value="${m.id}" ${m.id === set.method ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>
        <div><label class="f">Asr</label><select class="in" id="asr"><option value="Standard" ${set.asr !== 'Hanafi' ? 'selected' : ''}>Standard</option><option value="Hanafi" ${set.asr === 'Hanafi' ? 'selected' : ''}>Hanafi</option></select></div></div>
        ${T.PRAYERS.map(p => `<div class="item"><div class="item-main"><div class="item-t">${p.name}</div><div class="item-s">Today: ${times[p.id] ? T.to12(times[p.id]) : '–'}</div></div>
          <div class="seg"><button data-off="${p.id}" data-d="-1">−1</button><button disabled style="min-width:44px;color:var(--ink)">${(set.offsets[p.id] > 0 ? '+' : '') + (set.offsets[p.id] || 0)}m</button><button data-off="${p.id}" data-d="1">+1</button></div></div>`).join('')}
        <div class="btn-row mt12"><button class="btn ghost" id="gps">Use my location</button><button class="btn ghost" id="resetLoc">Reset to ${esc(C.location.label)}</button></div>
        <p class="tiny muted mt8">Location: ${esc(set.locLabel || '')} (${Number(set.lat).toFixed(3)}, ${Number(set.lng).toFixed(3)})</p>
      </div>

      <div class="card"><div class="card-h"><span class="card-t">${I.walk} Goals</span></div>
        <div class="grid3">
          <div><label class="f">Daily steps</label><input class="in" type="number" inputmode="numeric" id="gSteps" value="${set.stepGoal}"></div>
          <div><label class="f">Lab day extra</label><input class="in" type="number" inputmode="numeric" id="gLab" value="${set.labDayBonus}"></div>
          <div><label class="f">Jobs / week</label><input class="in" type="number" inputmode="numeric" id="gJobs" value="${set.jobGoal}"></div>
        </div>
        <p class="tiny muted mt8">Your plan says to build up steps by about 1,000-1,500 a week until you sit at a level you can keep.</p>
      </div>

      <div class="card"><div class="card-h"><span class="card-t">Backup</span></div>
        <div class="btn-row"><button class="btn ghost" id="exportBtn">Export backup</button><label class="btn ghost" style="cursor:pointer">Import backup<input type="file" id="importFile" accept="application/json,.json" hidden></label></div>
      </div>
      <p class="center tiny muted">Tazkiyah · prayer times by PrayTimes.org (LGPL)</p>`;
  }

  async function onSettingsClick(e) {
    const set = st().settings; const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'genKeys') {
      if (set.writeKey && !b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'Tap again: old keys stop working'; setTimeout(() => { delete b.dataset.armed; b.textContent = 'Make new keys'; }, 3000); return; }
      set.writeKey = 'w_' + S.randomKey(20); set.readKey = 'r_' + S.randomKey(16); S.save(); renderSettings(); U.toast('Keys created'); return;
    }
    if (b.id === 'copyKeys') { U.copyText(`const WRITE_KEY = '${set.writeKey}';\nconst READ_KEY  = '${set.readKey}';`); return; }
    if (b.id === 'saveApi') {
      const v = $('#apiUrl').value.trim();
      if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(v)) { U.toast('That URL should start with script.google.com and end in /exec'); return; }
      if (!set.writeKey) { U.toast('Generate keys first (step 1)'); return; }
      set.apiUrl = v; S.save(); b.textContent = 'Testing…';
      try { await S.ping(); S.markAllDirty(); await S.sync(); U.toast('Connected. Syncing your data.'); U.celebrate(); }
      catch (err) { st().lastError = String(err.message || err); S.save(); U.toast('Could not connect: ' + st().lastError); }
      renderSettings(); return;
    }
    if (b.id === 'syncAll') { S.markAllDirty(); const r = await S.sync(); U.toast(r && r.ok ? 'Everything synced' : 'Sync failed: ' + ((r && r.error) || 'not connected')); renderSettings(); return; }
    if (b.id === 'restore') { try { const n = await S.restore(); U.toast(`Restored ${n} items`); render(); } catch (err) { U.toast('Restore failed: ' + (err.message || err)); } return; }
    if (b.id === 'copyLink') { U.copyText(herLink()); return; }
    if (b.id === 'shareLink') { const l = herLink(); if (navigator.share) { try { await navigator.share({ title: 'Tazkiyah', text: 'My daily progress, live:', url: l }); } catch (e) {} } else U.copyText(l); return; }
    if (b.dataset.off) { set.offsets[b.dataset.off] = (Number(set.offsets[b.dataset.off]) || 0) + Number(b.dataset.d); S.save(); renderSettings(); return; }
    if (b.id === 'gps') {
      if (!navigator.geolocation) { U.toast('Location not available'); return; }
      navigator.geolocation.getCurrentPosition(p => { set.lat = p.coords.latitude; set.lng = p.coords.longitude; set.locLabel = 'My location'; S.save(); renderSettings(); U.toast('Location updated'); }, () => U.toast('Location permission denied'), { timeout: 10000 });
      return;
    }
    if (b.id === 'resetLoc') { set.lat = C.location.lat; set.lng = C.location.lng; set.locLabel = C.location.label; S.save(); renderSettings(); return; }
    if (b.id === 'exportBtn') {
      const blob = new Blob([S.exportJSON()], { type: 'application/json' }); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `tazkiyah-backup-${T.today()}.json`; document.body.appendChild(a); a.click(); a.remove(); return;
    }
  }
  function onSettingsChange(e) {
    const set = st().settings; const t = e.target;
    if (t.id === 'method') { set.method = t.value; S.save(); renderSettings(); }
    if (t.id === 'asr') { set.asr = t.value; S.save(); renderSettings(); }
    if (t.id === 'gSteps') { set.stepGoal = Math.max(1000, Number(t.value) || 9000); S.save(); }
    if (t.id === 'gLab') { set.labDayBonus = Math.max(0, Number(t.value) || 0); S.save(); }
    if (t.id === 'gJobs') { set.jobGoal = Math.max(1, Number(t.value) || 10); S.save(); }
    if (t.id === 'importFile' && t.files[0]) {
      const r = new FileReader(); r.onload = () => { try { S.importJSON(r.result); U.toast('Backup imported'); render(); } catch (err) { U.toast(err.message); } }; r.readAsText(t.files[0]);
    }
  }

  // ================================================================
  // ROUTER
  // ================================================================
  const VIEWS = { today: renderToday, workout: renderWorkout, jobs: renderJobs, progress: renderProgress, settings: renderSettings };
  function render() { (VIEWS[current] || renderToday)(); }
  function route() {
    const h = (location.hash || '#today').slice(1);
    current = VIEWS[h] ? h : 'today';
    $$('.view').forEach(v => v.classList.toggle('show', v.id === 'view-' + current));
    $$('.nav button').forEach(b => b.classList.toggle('sel', b.dataset.nav === current));
    if (current !== 'workout') workoutKey = null;
    render(); window.scrollTo(0, 0);
  }

  function boot() {
    $('#nav').innerHTML = `<div class="nav-in">
      <button data-nav="today">${I.today}Today</button>
      <button data-nav="workout">${I.dumbbell}Workout</button>
      <button data-nav="jobs">${I.briefcase}Jobs</button>
      <button data-nav="progress">${I.chart}Progress</button>
      <button data-nav="settings">${I.gear}Settings</button></div>`;
    $('#nav').addEventListener('click', e => { const b = e.target.closest('[data-nav]'); if (b) location.hash = b.dataset.nav; });
    $('#view-today').addEventListener('click', onTodayClick);
    $('#view-today').addEventListener('change', onTodayChange);
    $('#view-workout').addEventListener('click', onWorkoutClick);
    $('#view-workout').addEventListener('input', onWorkoutInput);
    $('#view-jobs').addEventListener('click', onJobsClick);
    $('#view-progress').addEventListener('click', onProgressClick);
    $('#view-settings').addEventListener('click', onSettingsClick);
    $('#view-settings').addEventListener('change', onSettingsChange);
    document.addEventListener('click', e => { const s = e.target.closest('#restTimer #skipRest'); if (s) { clearInterval(restInt); $('#restTimer').classList.remove('show'); } });
    addEventListener('hashchange', route);
    U.stars(); route();
    setSync(S.configured() ? 'synced' : 'offline-setup');
    S.scheduleSync(800);
    // refresh at midnight / when reopened
    let lastDay = T.today();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (T.today() !== lastDay) { lastDay = T.today(); } render(); S.scheduleSync(300); } });
    setInterval(() => { if (T.today() !== lastDay) { lastDay = T.today(); render(); } }, 60000);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
  boot();
})();

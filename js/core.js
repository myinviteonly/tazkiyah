/* ================================================================
   Tazkiyah: shared logic (used by the app and by her live view)
   ================================================================ */
(function (global) {
  const C = global.TZ_CONFIG;

  // ---------- dates ----------
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const today = () => ymd(new Date());
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const dayIndex = s => Math.round(parse(s).getTime() / 86400000);
  const diffDays = (a, b) => dayIndex(b) - dayIndex(a);
  const weekStart = s => { const d = parse(s); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return ymd(d); }; // Monday
  const fmtDate = (s, opts) => parse(s).toLocaleDateString('en-CA', opts || { weekday: 'long', month: 'long', day: 'numeric' });
  const fmtShort = s => parse(s).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
  const to12 = hhmm => { if (!hhmm) return ''; let [h, m] = hhmm.split(':').map(Number); const p = h < 12 ? 'AM' : 'PM'; h = h % 12 || 12; return `${h}:${pad(m)} ${p}`; };

  // ---------- plan ----------
  function planWeek(s) { return Math.floor(diffDays(C.planStart, s) / 7) + 1; }
  function setsFor(ex, s) { return planWeek(s) <= C.techniqueWeeks ? Math.min(2, ex.sets) : ex.sets; }
  function sessionKeyFor(s) { return C.schedule[parse(s).getDay()]; }
  function classesFor(s) {
    if (s > C.termEnd) return [];
    const wd = parse(s).getDay();
    return C.classes.filter(c => c.day === wd);
  }
  function isLabDay(s) { return classesFor(s).some(c => c.kind === 'Lab'); }
  function stepGoalFor(s, settings) {
    const base = Number(settings && settings.stepGoal) || 9000;
    const bonus = Number(settings && settings.labDayBonus);
    return base + (isLabDay(s) ? (isNaN(bonus) ? 2500 : bonus) : 0);
  }
  function earlyClassTomorrow(s) { return classesFor(addDays(s, 1)).some(c => c.start <= '09:00'); }

  // ---------- daily content ----------
  function reminderFor(s) { const R = global.TZ_REMINDERS; const i = ((dayIndex(s) % R.length) + R.length) % R.length; return Object.assign({ idx: i }, R[i]); }
  function lessonFor(s) { const L = global.TZ_LESSONS; const i = (((dayIndex(s) + 17) % L.length) + L.length) % L.length; return Object.assign({ idx: i }, L[i]); }

  const PRAYERS = [
    { id: 'fajr', name: 'Fajr', ar: 'الفجر' },
    { id: 'dhuhr', name: 'Dhuhr', ar: 'الظهر' },
    { id: 'asr', name: 'Asr', ar: 'العصر' },
    { id: 'maghrib', name: 'Maghrib', ar: 'المغرب' },
    { id: 'isha', name: 'Isha', ar: 'العشاء' }
  ];
  const CHARACTER = [
    { id: 'gaze', label: 'Lowered my gaze', sub: 'Guarded my eyes and stayed away from lustful content' },
    { id: 'speech', label: 'Kept my speech clean', sub: 'No dirty talk, no weird jokes' },
    { id: 'present', label: 'Was present for her', sub: 'Replied right away and gave her real attention' }
  ];

  function blankDay() {
    return { prayers: {}, classes: {}, workout: { done: false, sets: {}, walk: false, core: {} }, steps: 0, protein: false, reminderRead: false, lessonDone: false, character: {} };
  }

  // ---------- scoring ----------
  // Returns a list of {group, label, done, na} items plus counts.
  function evaluate(s, day, settings) {
    day = day || blankDay();
    const items = [];
    PRAYERS.forEach(p => items.push({ group: 'Salah', label: p.name, done: !!(day.prayers && day.prayers[p.id]) }));
    classesFor(s).forEach(c => {
      const st = day.classes && day.classes[c.id];
      items.push({ group: 'Classes', label: `${c.course} ${c.kind}`, done: st === 'attended', na: st === 'cancelled', state: st || 'pending' });
    });
    const sk = (day.workout && day.workout.session && C.sessions[day.workout.session]) ? day.workout.session : sessionKeyFor(s);
    const sess = C.sessions[sk];
    if (sess.type === 'lift') items.push({ group: 'Body', label: sess.name, done: !!(day.workout && day.workout.done) });
    if (sess.type === 'walk') items.push({ group: 'Body', label: sess.name, done: !!(day.workout && (day.workout.done || day.workout.walk)) });
    const goal = day.stepGoal || stepGoalFor(s, settings);
    items.push({ group: 'Body', label: `${goal.toLocaleString()} steps`, done: (day.steps || 0) >= goal });
    items.push({ group: 'Body', label: 'Protein target', done: !!day.protein });
    CHARACTER.forEach(ch => items.push({ group: 'Character', label: ch.label, done: !!(day.character && day.character[ch.id]) }));
    items.push({ group: 'Deen', label: "Read today's reminder", done: !!day.reminderRead });
    items.push({ group: 'Growth', label: "Did today's lesson", done: !!day.lessonDone });
    const counted = items.filter(i => !i.na);
    const done = counted.filter(i => i.done).length;
    return {
      items, done, total: counted.length,
      pct: counted.length ? Math.round((done / counted.length) * 100) : 0,
      prayers: PRAYERS.filter(p => day.prayers && day.prayers[p.id]).length,
      session: sess, sessionKey: sk, stepGoal: goal
    };
  }

  function summaryFor(s, day, settings) {
    const ev = evaluate(s, day, settings);
    const cls = ev.items.filter(i => i.group === 'Classes');
    let setsDone = 0, setsPlanned = 0;
    if (ev.session.type === 'lift') {
      ev.session.exercises.forEach(ex => {
        const n = setsFor(ex, s); setsPlanned += n;
        const logged = (day && day.workout && day.workout.sets && day.workout.sets[ex.id]) || [];
        setsDone += logged.slice(0, n).filter(x => x && x.done).length;
      });
    }
    return {
      score: ev.pct, done: ev.done, total: ev.total,
      prayers: ev.prayers,
      classesAttended: cls.filter(c => c.done).length,
      classesTotal: cls.filter(c => !c.na).length,
      workout: ev.session.name, workoutType: ev.session.type,
      workoutDone: ev.items.some(i => i.group === 'Body' && i.label === ev.session.name && i.done),
      setsDone, setsPlanned,
      steps: (day && day.steps) || 0, stepGoal: ev.stepGoal,
      protein: !!(day && day.protein),
      character: CHARACTER.filter(ch => day && day.character && day.character[ch.id]).length,
      reminderRead: !!(day && day.reminderRead),
      lessonDone: !!(day && day.lessonDone)
    };
  }

  function streak(days, settings, threshold) {
    threshold = threshold == null ? 80 : threshold;
    let n = 0; let s = today();
    const t = days[s] ? evaluate(s, days[s], settings).pct : 0;
    if (t < threshold) s = addDays(s, -1); // today not finished yet: count from yesterday
    while (days[s] && evaluate(s, days[s], settings).pct >= threshold) { n++; s = addDays(s, -1); }
    return n;
  }

  function jobsThisWeek(jobs, s) {
    const ws = weekStart(s || today()); const we = addDays(ws, 6);
    return (jobs || []).filter(j => j.date >= ws && j.date <= we);
  }

  // ---------- weight ----------
  function plannedWeight(s) {
    const total = diffDays(C.planStart, C.goalDate);
    const t = Math.max(0, Math.min(1, diffDays(C.planStart, s) / total));
    return C.startWeight + (C.goalWeight - C.startWeight) * t;
  }
  function avg7(weights, s) {
    const from = addDays(s, -6);
    const xs = (weights || []).filter(w => w.date >= from && w.date <= s && w.weight).map(w => Number(w.weight));
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  }

  // ---------- small DOM helpers ----------
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function ring(pct, size, stroke) {
    size = size || 120; stroke = stroke || 10;
    const r = (size - stroke) / 2; const c = 2 * Math.PI * r; const off = c * (1 - pct / 100);
    return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
      <defs><linearGradient id="rg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#BFDBFF"/><stop offset="1" stop-color="#3D7BFF"/></linearGradient></defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(156,196,255,.12)" stroke-width="${stroke}"/>
      <circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#rg${size})" stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>`;
  }

  // Weight chart as inline SVG
  function weightChart(weights, opts) {
    opts = opts || {};
    const W = opts.width || 340, H = opts.height || 180, P = { l: 34, r: 10, t: 12, b: 22 };
    const start = C.planStart, end = C.goalDate;
    const span = diffDays(start, end);
    const pts = (weights || []).filter(w => w.weight).sort((a, b) => a.date < b.date ? -1 : 1);
    const vals = pts.map(p => Number(p.weight)).concat([C.startWeight, C.goalWeight]);
    const lo = Math.floor(Math.min(...vals) - 2), hi = Math.ceil(Math.max(...vals) + 2);
    const x = s => P.l + (diffDays(start, s) / span) * (W - P.l - P.r);
    const y = v => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
    const grid = [];
    const step = (hi - lo) > 20 ? 10 : 5;
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) grid.push(`<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" class="cg"/><text x="${P.l - 6}" y="${y(v) + 3}" class="ct" text-anchor="end">${v}</text>`);
    const months = [];
    for (let d = parse(start); ymd(d) <= end; d.setMonth(d.getMonth() + 1, 1)) { const s = ymd(d); if (s > start) months.push(`<text x="${x(s)}" y="${H - 6}" class="ct" text-anchor="middle">${d.toLocaleDateString('en-CA', { month: 'short' })}</text>`); }
    const plan = `<line x1="${x(start)}" y1="${y(C.startWeight)}" x2="${x(end)}" y2="${y(C.goalWeight)}" class="cplan"/>`;
    const goal = `<line x1="${P.l}" x2="${W - P.r}" y1="${y(C.goalWeight)}" y2="${y(C.goalWeight)}" class="cgoal"/><text x="${W - P.r}" y="${y(C.goalWeight) - 5}" class="ct goalt" text-anchor="end">Goal ${C.goalWeight}</text>`;
    let line = '', dots = '';
    if (pts.length) {
      const inRange = pts.filter(p => p.date >= start);
      line = `<polyline class="cline" points="${inRange.map(p => `${x(p.date).toFixed(1)},${y(p.weight).toFixed(1)}`).join(' ')}"/>`;
      dots = inRange.map((p, i) => `<circle cx="${x(p.date).toFixed(1)}" cy="${y(p.weight).toFixed(1)}" r="${i === inRange.length - 1 ? 4.5 : 3}" class="cdot${i === inRange.length - 1 ? ' last' : ''}"/>`).join('');
    }
    return `<svg class="wchart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Weight trend">${grid.join('')}${months.join('')}${goal}${plan}${line}${dots}</svg>`;
  }

  global.TZ = {
    C, pad, ymd, parse, today, addDays, diffDays, dayIndex, weekStart, fmtDate, fmtShort, to12,
    planWeek, setsFor, sessionKeyFor, classesFor, isLabDay, stepGoalFor, earlyClassTomorrow,
    reminderFor, lessonFor, PRAYERS, CHARACTER, blankDay, evaluate, summaryFor, streak, jobsThisWeek,
    plannedWeight, avg7, esc, $, $$, ring, weightChart
  };
})(window);

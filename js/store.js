/* ================================================================
   Tazkiyah: storage + sync to your Google Sheet
   Everything saves on the phone first, then syncs in the background.
   Waist measurements never leave the phone.
   ================================================================ */
(function (global) {
  const KEY = 'tazkiyah:v1';
  const T = global.TZ;

  const defaults = () => ({
    settings: {
      apiUrl: '', writeKey: '', readKey: '',
      method: 'ISNA', asr: 'Standard',
      offsets: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
      lat: T.C.location.lat, lng: T.C.location.lng, locLabel: T.C.location.label,
      stepGoal: 9000, labDayBonus: 2500, jobGoal: 10
    },
    days: {}, jobs: [], weights: [],
    dirty: { days: [], jobs: [], weights: [], deletedJobs: [], deletedWeights: [] },
    lastSync: null, lastError: null
  });

  let state;
  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY)) || defaults(); } catch (e) { state = defaults(); }
    const d = defaults();
    state.settings = Object.assign(d.settings, state.settings || {});
    state.settings.offsets = Object.assign(d.settings.offsets, state.settings.offsets || {});
    state.dirty = Object.assign(d.dirty, state.dirty || {});
    state.days = state.days || {}; state.jobs = state.jobs || []; state.weights = state.weights || [];
    return state;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('save failed', e); } }

  function day(s) {
    if (!state.days[s]) state.days[s] = T.blankDay();
    const d = state.days[s];
    d.workout = Object.assign({ done: false, sets: {}, walk: false, core: {} }, d.workout || {});
    d.prayers = d.prayers || {}; d.classes = d.classes || {}; d.character = d.character || {};
    return d;
  }

  function addDirty(kind, id) { const arr = state.dirty[kind]; if (!arr.includes(id)) arr.push(id); }
  function touchDay(s) { const d = day(s); d.updatedAt = new Date().toISOString(); d.stepGoal = T.stepGoalFor(s, state.settings); addDirty('days', s); save(); scheduleSync(); }

  // ---------- jobs ----------
  function upsertJob(job) {
    if (!job.id) job.id = 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const i = state.jobs.findIndex(j => j.id === job.id);
    job.updatedAt = new Date().toISOString();
    if (i >= 0) state.jobs[i] = job; else state.jobs.unshift(job);
    addDirty('jobs', job.id); save(); scheduleSync(); return job;
  }
  function deleteJob(id) {
    state.jobs = state.jobs.filter(j => j.id !== id);
    state.dirty.jobs = state.dirty.jobs.filter(x => x !== id);
    addDirty('deletedJobs', id); save(); scheduleSync();
  }

  // ---------- weights ----------
  function upsertWeight(w) {
    const i = state.weights.findIndex(x => x.date === w.date);
    if (i >= 0) state.weights[i] = Object.assign(state.weights[i], w); else state.weights.push(w);
    state.weights.sort((a, b) => a.date < b.date ? -1 : 1);
    addDirty('weights', w.date); save(); scheduleSync();
  }
  function deleteWeight(date) {
    state.weights = state.weights.filter(w => w.date !== date);
    state.dirty.weights = state.dirty.weights.filter(x => x !== date);
    addDirty('deletedWeights', date); save(); scheduleSync();
  }

  // ---------- sync ----------
  let timer = null, syncing = false, listeners = [];
  function onSync(fn) { listeners.push(fn); }
  function emit(status) { listeners.forEach(fn => { try { fn(status); } catch (e) {} }); }
  function configured() { return !!(state.settings.apiUrl && state.settings.writeKey); }
  function hasDirty() { const d = state.dirty; return d.days.length || d.jobs.length || d.weights.length || d.deletedJobs.length || d.deletedWeights.length; }
  function scheduleSync(ms) { clearTimeout(timer); if (!configured()) { emit('offline-setup'); return; } emit('pending'); timer = setTimeout(sync, ms == null ? 1500 : ms); }

  async function post(body) {
    const res = await fetch(state.settings.apiUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Server error');
    return json;
  }

  async function sync() {
    if (!configured()) { emit('offline-setup'); return { ok: false, error: 'Not connected yet' }; }
    if (syncing) { scheduleSync(2000); return; }
    if (!hasDirty()) { emit('synced'); return { ok: true, nothing: true }; }
    syncing = true; emit('syncing');
    const snap = JSON.parse(JSON.stringify(state.dirty));
    const payload = {
      action: 'push', key: state.settings.writeKey,
      days: {}, jobs: [], weights: [],
      deletedJobs: snap.deletedJobs, deletedWeights: snap.deletedWeights,
      profile: {
        name: T.C.ownerName, startWeight: T.C.startWeight, goalWeight: T.C.goalWeight, goalDate: T.C.goalDate, planStart: T.C.planStart,
        jobGoal: state.settings.jobGoal, stepGoal: state.settings.stepGoal, labDayBonus: state.settings.labDayBonus, updatedAt: new Date().toISOString()
      }
    };
    snap.days.forEach(s => { if (state.days[s]) payload.days[s] = Object.assign({}, state.days[s], { summary: T.summaryFor(s, state.days[s], state.settings), reminderIdx: T.reminderFor(s).idx, lessonIdx: T.lessonFor(s).idx }); });
    snap.jobs.forEach(id => { const j = state.jobs.find(x => x.id === id); if (j) payload.jobs.push(j); });
    snap.weights.forEach(dt => { const w = state.weights.find(x => x.date === dt); if (w) payload.weights.push({ date: w.date, weight: w.weight }); }); // waist stays private
    try {
      await post(payload);
      // clear only what we sent (new edits made during sync stay dirty)
      const d = state.dirty;
      ['days', 'jobs', 'weights', 'deletedJobs', 'deletedWeights'].forEach(k => { d[k] = d[k].filter(x => !snap[k].includes(x)); });
      state.lastSync = new Date().toISOString(); state.lastError = null; save();
      syncing = false; emit('synced');
      if (hasDirty()) scheduleSync(500);
      return { ok: true };
    } catch (e) {
      state.lastError = String(e.message || e); save();
      syncing = false; emit('error');
      clearTimeout(timer); timer = setTimeout(sync, 30000);
      return { ok: false, error: state.lastError };
    }
  }

  async function ping() { return post({ action: 'ping', key: state.settings.writeKey }); }

  function markAllDirty() {
    Object.keys(state.days).forEach(s => addDirty('days', s));
    state.jobs.forEach(j => addDirty('jobs', j.id));
    state.weights.forEach(w => addDirty('weights', w.date));
    save();
  }

  async function restore() {
    const res = await post({ action: 'pull', key: state.settings.writeKey });
    let n = 0;
    Object.entries(res.days || {}).forEach(([s, d]) => {
      const local = state.days[s];
      if (!local || (d.updatedAt || '') > (local.updatedAt || '')) { delete d.summary; delete d.reminderIdx; delete d.lessonIdx; state.days[s] = d; n++; }
    });
    (res.jobs || []).forEach(j => { if (!state.jobs.find(x => x.id === j.id)) { state.jobs.push(j); n++; } });
    (res.weights || []).forEach(w => { if (!state.weights.find(x => x.date === w.date)) { state.weights.push(w); n++; } });
    state.jobs.sort((a, b) => a.date < b.date ? 1 : -1);
    state.weights.sort((a, b) => a.date < b.date ? -1 : 1);
    save(); return n;
  }

  function exportJSON() { return JSON.stringify({ app: 'tazkiyah', exportedAt: new Date().toISOString(), days: state.days, jobs: state.jobs, weights: state.weights, settings: state.settings }, null, 2); }
  function importJSON(text) {
    const data = JSON.parse(text);
    if (data.app !== 'tazkiyah') throw new Error('This is not a Tazkiyah backup file');
    state.days = data.days || {}; state.jobs = data.jobs || []; state.weights = data.weights || [];
    if (data.settings) state.settings = Object.assign(state.settings, data.settings);
    markAllDirty(); save(); scheduleSync();
  }

  function randomKey(len) {
    const a = new Uint8Array(len || 18); crypto.getRandomValues(a);
    return Array.from(a, b => 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 56]).join('');
  }

  global.TZStore = {
    load, save, day, touchDay, get state() { return state; },
    upsertJob, deleteJob, upsertWeight, deleteWeight,
    sync, scheduleSync, onSync, configured, ping, restore, markAllDirty, exportJSON, importJSON, randomKey
  };
})(window);

/* ================================================================
   Tazkiyah: Google Sheets backend (Google Apps Script)

   1. Paste this whole file into Extensions > Apps Script in your Sheet.
   2. Replace the two lines below with the ones you copy from the app
      (Settings > 1. Your keys > Copy for script).
   3. Deploy > New deployment > Web app
        Execute as: Me
        Who has access: Anyone
   4. Copy the Web app URL (ends in /exec) into the app.
   ================================================================ */

const WRITE_KEY = 'PASTE-WRITE-KEY-HERE';
const READ_KEY  = 'PASTE-READ-KEY-HERE';

const SHARE_DAYS = 60; // how many days of history Marwa's view can load

// ---------------------------------------------------------------
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!validKeys()) return json({ ok: false, error: 'Keys not set in the script yet' });
  if (p.k !== READ_KEY && p.k !== WRITE_KEY) return json({ ok: false, error: 'Invalid key' });
  return json(Object.assign({ ok: true }, readAll(false)));
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'Bad request' }); }
  if (!validKeys()) return json({ ok: false, error: 'Keys not set in the script yet' });
  if (body.key !== WRITE_KEY) return json({ ok: false, error: 'Invalid write key' });

  if (body.action === 'ping') { setup_(); return json({ ok: true, pong: true, at: new Date().toISOString() }); }
  if (body.action === 'pull') return json(Object.assign({ ok: true }, readAll(true)));
  if (body.action !== 'push') return json({ ok: false, error: 'Unknown action' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    setup_();
    const store = stateIndex_();
    let n = 0;
    Object.keys(body.days || {}).forEach(date => { putState_(store, 'day:' + date, body.days[date]); writeLogRow_(date, body.days[date]); n++; });
    (body.jobs || []).forEach(job => { putState_(store, 'job:' + job.id, job); n++; });
    (body.deletedJobs || []).forEach(id => { deleteState_(store, 'job:' + id); n++; });
    (body.weights || []).forEach(w => { putState_(store, 'weight:' + w.date, { date: w.date, weight: w.weight }); n++; });
    (body.deletedWeights || []).forEach(d => { deleteState_(store, 'weight:' + d); n++; });
    if (body.profile) putState_(store, 'profile', body.profile);
    if ((body.jobs || []).length || (body.deletedJobs || []).length) rebuildJobsSheet_();
    if ((body.weights || []).length || (body.deletedWeights || []).length) rebuildWeightsSheet_();
    return json({ ok: true, saved: n, at: new Date().toISOString() });
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------
function readAll(full) {
  const sh = sheet_('State');
  const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues() : [];
  const cutoff = Utilities.formatDate(new Date(Date.now() - SHARE_DAYS * 86400000), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const out = { days: {}, jobs: [], weights: [], profile: null };
  rows.forEach(r => {
    const key = String(r[0]); if (!key) return;
    let v; try { v = JSON.parse(r[1]); } catch (e) { return; }
    if (key.indexOf('day:') === 0) {
      const date = key.slice(4);
      if (!full && date < cutoff) return;
      if (!full && v.workout) { v.workout = { done: v.workout.done, walk: v.workout.walk, session: v.workout.session }; }
      out.days[date] = v;
    } else if (key.indexOf('job:') === 0) out.jobs.push(full ? v : { id: v.id, company: v.company, role: v.role, mode: v.mode, status: v.status, date: v.date });
    else if (key.indexOf('weight:') === 0) out.weights.push({ date: v.date, weight: v.weight });
    else if (key === 'profile') out.profile = v;
  });
  return out;
}

// ---------------------------------------------------------------
function setup_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const defs = {
    'Daily Log': ['Date', 'Day', 'Score %', 'Prayers /5', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Classes', 'Workout', 'Workout done', 'Sets', 'Steps', 'Step goal', 'Protein', 'Character /3', 'Reminder read', 'Lesson done', 'Last update'],
    'Jobs': ['Date applied', 'Company', 'Role', 'Work type', 'Status', 'Link'],
    'Weigh-ins': ['Date', 'Weight (lb)'],
    'State': ['key', 'json', 'updated']
  };
  Object.keys(defs).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.getRange(1, 1, 1, defs[name].length).setValues([defs[name]]).setFontWeight('bold').setBackground('#0F1D42').setFontColor('#EEF4FF');
      sh.setFrozenRows(1);
      if (name === 'State') sh.hideSheet();
    }
  });
  const s1 = ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s1);
}

function sheet_(name) { setup_(); return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name); }

function stateIndex_() {
  const sh = sheet_('State');
  const last = sh.getLastRow();
  const keys = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0])) : [];
  const map = {}; keys.forEach((k, i) => { if (k) map[k] = i + 2; });
  return { sh: sh, map: map };
}
function putState_(store, key, value) {
  const row = [key, JSON.stringify(value), new Date()];
  if (store.map[key]) store.sh.getRange(store.map[key], 1, 1, 3).setValues([row]);
  else { store.sh.appendRow(row); store.map[key] = store.sh.getLastRow(); }
}
function deleteState_(store, key) {
  const r = store.map[key]; if (!r) return;
  store.sh.getRange(r, 1, 1, 3).clearContent(); delete store.map[key];
}

function writeLogRow_(date, d) {
  const sh = sheet_('Daily Log');
  const s = d.summary || {};
  const p = d.prayers || {};
  const yes = v => v ? '✓' : '';
  const dayName = Utilities.formatDate(new Date(date + 'T12:00:00'), Session.getScriptTimeZone(), 'EEE');
  const row = ["'" + date, dayName, s.score || 0, s.prayers || 0, yes(p.fajr), yes(p.dhuhr), yes(p.asr), yes(p.maghrib), yes(p.isha),
    s.classesTotal ? (s.classesAttended + '/' + s.classesTotal) : '–', s.workout || '', yes(s.workoutDone),
    s.setsPlanned ? (s.setsDone + '/' + s.setsPlanned) : '', s.steps || 0, s.stepGoal || '', yes(s.protein),
    s.character || 0, yes(s.reminderRead), yes(s.lessonDone), new Date()];
  const last = sh.getLastRow();
  const dates = last > 1 ? sh.getRange(2, 1, last - 1, 1).getDisplayValues().map(r => r[0]) : [];
  const i = dates.indexOf(date);
  if (i >= 0) sh.getRange(i + 2, 1, 1, row.length).setValues([row]);
  else {
    sh.appendRow(row);
    if (sh.getLastRow() > 2) sh.getRange(2, 1, sh.getLastRow() - 1, row.length).sort({ column: 1, ascending: false });
  }
}

function rebuildJobsSheet_() {
  const all = readAll(true).jobs.sort((a, b) => a.date < b.date ? 1 : -1);
  const sh = sheet_('Jobs');
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 6).clearContent();
  if (all.length) sh.getRange(2, 1, all.length, 6).setNumberFormat('@').setValues(all.map(j => [j.date, j.company, j.role, j.mode, j.status, j.link || '']));
}
function rebuildWeightsSheet_() {
  const all = readAll(true).weights.sort((a, b) => a.date < b.date ? -1 : 1);
  const sh = sheet_('Weigh-ins');
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).clearContent();
  if (all.length) sh.getRange(2, 1, all.length, 2).setValues(all.map(w => [w.date, w.weight]));
}

function validKeys() { return WRITE_KEY.indexOf('PASTE') !== 0 && READ_KEY.indexOf('PASTE') !== 0 && WRITE_KEY !== READ_KEY; }
function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

// Run this once from the editor (select "authorize" and press Run) to grant permissions.
function authorize() { setup_(); Logger.log('Sheets created. Now deploy as a web app.'); }

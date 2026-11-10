// StudentHub app.
// DATABASE SETTINGS: paste your Supabase publishable key into anonKey (it starts with sb_publishable_).
// Never paste the service_role or secret key here.
const SH_CONFIG = { url: 'https://bsnkqmsomotfqnweoujq.supabase.co', anonKey: 'sb_publishable_SbTsbh9fnny2aYfYQzvWOA_1hKbtqKX' };

(() => {
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const I = (n) => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const uid = () => Math.random().toString(36).slice(2, 10);
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const CATS = ['Food','Transport','Data and airtime','School fees','Books and printing','Other'];
const GRADES = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
const WINDOWS = { Morning: [420, 660], Afternoon: [720, 960], Evening: [1020, 1260], Night: [1260, 1380], Flexible: [480, 1320] };
const TITLES = { profile: 'Profile', messages: 'Messages', discover: 'Discover', tasks: 'Tasks', login: 'Account', notes: 'Study notes', home: ['StudentHub', 'Dashboard'], classes: 'Classes and exams', study: 'Study planner', money: 'Money', gpa: 'GPA calculator', materials: ['Study materials', 'Course materials'], more: 'More', settings: 'Settings', privacy: 'Privacy', terms: 'Terms' };
const SUBS = { profile: 'Profile and connection.', messages: 'Chats with students you are connected with.', discover: 'Find students who chose to be visible to other students.', tasks: 'Deadlines and to-dos in one list.', login: 'Sign in, your profile and your privacy choices.', notes: 'Course notes, pinned and searchable.', home: ['Your classes, exams and spending in one place.', 'Your teaching week, reminders and materials.'], classes: 'Your weekly timetable, exam dates and reminders.', study: 'Turn your classes and exams into sessions you can keep.', money: 'Track what you spend against your monthly budget.', gpa: 'Enter your courses to calculate your semester GPA.', materials: ['Trusted places to find textbooks and past questions.', 'Share links and notes with your students.'], more: 'Tools and settings.', settings: 'Your name, role, budget and theme.', privacy: 'What StudentHub stores, and which Google services run on this site.', terms: 'The short version.' };
const ROUTES = {
  student: { views: ['home','classes','study','discover','profile','messages','tasks','money','gpa','materials','more','settings','notes','login','privacy','terms'], nav: [['home','home','Home'],['classes','calendar','Classes'],['study','book','Study'],['discover','search','Discover'],['messages','send','Messages'],['tasks','check','Tasks'],['money','wallet','Money'],['gpa','calc','GPA'],['materials','file','Materials'],['notes','file','Notes'],['settings','gear','Settings']], tab: [['home','home','Home'],['classes','calendar','Classes'],['discover','search','Discover'],['messages','send','Messages'],['study','book','Study']] },
  lecturer: { views: ['home','materials','login','settings','privacy','terms'], nav: [['home','home','Dashboard'],['materials','upload','Course materials'],['settings','gear','Settings']], tab: [['home','home','Dashboard'],['materials','upload','Materials'],['settings','gear','Settings']] }
};
const DEFAULT_PREFS = { budget: 0, theme: 'system', perDay: 1, lead: 15, remind: false };
const blank = () => ({ course: '', units: '', grade: 'A' });

let role = localStorage.getItem('studenthubRole') || 'student';
let prefs = { ...DEFAULT_PREFS, ...load('studentPrefs', {}) };
let classes = load('studentClasses', []);
let teach = load('lecturerClasses', []);
let exams = load('studentExams', []);
let expenses = load('studentExpenses', []);
let gpa = load('studentGpa', []);
let materials = load('lecturerMaterials', []);
let studentNotes = load('studentNotes', []);
let activeNoteId = null;
let noteQuery = '', noteCourse = '', noteSort = 'updated';
let noteSaveTimer = null;
if (!gpa.length) gpa = [blank()];
let current = 'home';
const sent = new Set();
let toastTimer;

const saveAll = () => { save('studentPrefs', prefs); save('studentClasses', classes); save('lecturerClasses', teach); save('studentExams', exams); save('studentExpenses', expenses); save('studentGpa', gpa); save('lecturerMaterials', materials); };
const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
const hm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const t12 = (t) => { let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + String(m).padStart(2, '0') + ' ' + ap; };
const dayName = (d) => DAYS[(d.getDay() + 6) % 7];
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const daysTo = (iso) => Math.round((new Date(iso + 'T00:00') - today0()) / 864e5);
const naira = (n) => '₦' + Math.round(Number(n) || 0).toLocaleString('en-NG');
const cnt = (n) => n === 0 ? 'today' : n === 1 ? 'tomorrow' : n < 0 ? 'passed' : 'in ' + n + ' days';
const monthKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
const todayIso = () => { const d = new Date(); return monthKey(d) + '-' + String(d.getDate()).padStart(2, '0'); };
const fmtDate = (iso) => iso ? new Date(iso + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
const dayOf = (list, d) => list.filter((c) => c.day === d).sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
const clashes = (list, d, s, e, skip) => dayOf(list, d).some((c) => c.id !== skip && toMin(c.startTime) < e && toMin(c.endTime) > s);
const examsSorted = () => [...exams].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
const upcomingExams = () => examsSorted().filter((e) => daysTo(e.date) >= 0);
const monthSpent = (cat) => expenses.filter((e) => (e.date || '').startsWith(monthKey()) && (!cat || e.category === cat)).reduce((a, e) => a + Number(e.amount), 0);
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const studentName = () => localStorage.getItem('studentName') || '';
const applyTheme = () => { document.documentElement.dataset.theme = prefs.theme === 'system' ? '' : prefs.theme; };
const pick = (v) => Array.isArray(v) ? v[role === 'lecturer' ? 1 : 0] : v;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2600); }
function notify(title, body) { try { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body }); } catch {} }

function makePlan() {
  const session = Number(localStorage.getItem('studyDuration')) || 60;
  const [ws, we] = WINDOWS[localStorage.getItem('studyPreference')] || WINDOWS.Evening;
  const subjects = [...upcomingExams().map((e) => (e.code || e.title) + ', exam ' + cnt(daysTo(e.date))), ...new Set(classes.map((c) => c.course))];
  if (!subjects.length) return [];
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes(), base = today0(), out = [];
  let k = 0;
  for (let d = 0; d < 7; d++) {
    const day = new Date(base); day.setDate(base.getDate() + d);
    const list = dayOf(classes, dayName(day));
    let placed = 0;
    for (let s = ws; s + session <= we && placed < prefs.perDay; s += 30) {
      const e = s + session;
      if ((d === 0 && s < nowMin) || list.some((c) => toMin(c.startTime) < e && toMin(c.endTime) > s)) continue;
      out.push({ day, s, e, subject: subjects[k++ % subjects.length] });
      placed++;
      s = e - 30;
    }
  }
  return out;
}

function checkReminders() {
  if (!prefs.remind) return;
  const now = Date.now(), lead = prefs.lead * 60000, list = [], today = today0();
  dayOf(role === 'lecturer' ? teach : classes, dayName(today)).forEach((c) => {
    const [h, m] = c.startTime.split(':').map(Number);
    const at = new Date(today); at.setHours(h, m, 0, 0);
    list.push({ key: c.id + todayIso(), t: at.getTime(), title: c.course, body: 'Starts at ' + t12(c.startTime) + (c.room ? ' in ' + c.room : '') });
  });
  if (role !== 'lecturer') exams.forEach((e) => { if (e.time) list.push({ key: e.id + e.date, t: new Date(e.date + 'T' + e.time).getTime(), title: (e.code || e.title) + ' exam', body: 'Starts at ' + t12(e.time) + (e.venue ? ', ' + e.venue : '') }); });
  list.forEach((ev) => { const diff = ev.t - now; if (diff > 0 && diff <= lead && !sent.has(ev.key)) { sent.add(ev.key); toast(ev.title + ': ' + ev.body); notify(ev.title, ev.body); } });
}
async function toggleRemind() {
  if (prefs.remind) { prefs.remind = false; toast('Reminders turned off.'); }
  else {
    prefs.remind = true;
    if ('Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch {} }
    toast('Reminders on. Alerts appear while StudentHub is open.');
    checkReminders();
  }
  saveAll(); render();
}

const classForm = (id) => `<form class="inline" id="${id}">
  <label class="full">Course<input name="course" required maxlength="60" placeholder="MTH 101"></label>
  <label>Day<select name="day">${DAYS.map((d) => `<option>${d}</option>`).join('')}</select></label>
  <label>Start<input type="time" name="start" required></label>
  <label>End<input type="time" name="end" required></label>
  <label>Room<input name="room" maxlength="40" placeholder="LT 3"></label>
  <button class="btn" type="submit">Save class</button></form>`;
const remindPanel = () => `<div class="sec"><h3>Reminders</h3><span class="chip ${prefs.remind ? '' : 'line'}">${I('bell')}${prefs.remind ? 'On' : 'Off'}</span></div>
  <p class="muted">Heads-ups before classes${role === 'lecturer' ? '' : ' and exams'}. Alerts show in the app while this tab is open. System notifications need your permission.</p>
  <div class="inline" style="margin-top:18px"><label>Remind me before<select data-pref="lead">${[5, 10, 15, 30, 60].map((m) => `<option value="${m}" ${prefs.lead == m ? 'selected' : ''}>${m === 60 ? '1 hour' : m + ' minutes'}</option>`).join('')}</select></label><button class="btn" data-act="remind">${prefs.remind ? 'Turn off reminders' : 'Turn on reminders'}</button></div>`;
function week(list, k) {
  return `<div class="scroll"><div class="week">${DAYS.map((d) => `<div class="day"><h3>${d}</h3>${dayOf(list, d).map((c) => { const hit = clashes(list, d, toMin(c.startTime), toMin(c.endTime), c.id); return `<div class="slot ${hit ? 'clash' : ''}"><strong>${esc(c.course)}</strong><small>${t12(c.startTime)} to ${t12(c.endTime)}</small><small>${esc(c.room || 'Room to be confirmed')}${hit ? ', clashes' : ''}</small><button class="btn icon" data-act="del-class" data-k="${k}" data-id="${c.id}" aria-label="Delete ${esc(c.course)}">${I('x')}</button></div>`; }).join('') || '<p class="muted" style="font-size:13px">No classes</p>'}</div>`).join('')}</div></div>`;
}
const rowOf = (c) => `<div class="row"><span class="time">${t12(c.startTime)}</span><div><strong>${esc(c.course)}</strong><small>${esc(c.room || 'Room to be confirmed')}, until ${t12(c.endTime)}</small></div></div>`;
const installBtn = () => `<button class="btn install" type="button" data-act="install" hidden>${I('download')}<span>Install app</span></button>`;
const greetHero = (sub) => { const n = studentName(); return `<section class="glass hero edge">${role === 'lecturer' ? '' : installBtn()}<p class="muted">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p><h2 class="big" style="margin-top:14px">${greeting()}${n ? ', ' + esc(n) : ''}.</h2><p class="muted" style="margin-top:12px">${sub}</p></section>`; };

function renderToday() {
  const now = new Date(), todays = dayOf(classes, dayName(now)), ups = upcomingExams(), ex = ups[0], plan = makePlan()[0];
  const spent = monthSpent(), left = prefs.budget - spent;
  return `${greetHero(`${todays.length} class${todays.length === 1 ? '' : 'es'} today${ups.length ? ', ' + ups.length + ' exam' + (ups.length > 1 ? 's' : '') + ' ahead' : ''}.`)}
  <div class="grid2" style="margin-top:18px">
    <section class="glass"><h3 class="sec">Classes today</h3>${todays.map(rowOf).join('') || '<p class="empty">Nothing scheduled today. Add classes in Classes.</p>'}</section>
    <section class="glass stack" style="align-content:start">
      <div><p class="muted">Next exam</p>${ex ? `<p class="big" style="font-size:34px;margin-top:10px">${esc(ex.code || ex.title)}</p><p class="muted" style="margin-top:8px">${esc(ex.title)}, ${cnt(daysTo(ex.date))}</p>` : '<p style="margin-top:10px;font-weight:700">No exams yet</p><p class="muted">Add exam dates in Classes.</p>'}</div>
      <div><p class="muted">Next study session</p>${plan ? `<p style="margin-top:10px;font-weight:700">${esc(plan.subject)}</p><p class="muted">${plan.day.toLocaleDateString('en-GB', { weekday: 'long' })}, ${t12(hm(plan.s))} to ${t12(hm(plan.e))}</p>` : '<p class="muted" style="margin-top:10px">Build a plan in Study.</p>'}</div>
    </section>
  </div>
  <section class="glass" style="margin-top:18px"><div class="sec"><h3>Spent this month</h3>${I('wallet')}</div><p class="big" style="font-size:40px">${naira(spent)}</p>${prefs.budget > 0 ? `<div class="bar" style="margin:16px 0 8px"><i style="width:${Math.min(100, spent / prefs.budget * 100)}%"></i></div><p class="muted">${left >= 0 ? naira(left) + ' left' : naira(-left) + ' over'} of ${naira(prefs.budget)}</p>` : '<p class="muted" style="margin-top:10px">Set a monthly budget in Settings.</p>'}</section>`;
}

function renderTeach() {
  const list = dayOf(teach, dayName(new Date()));
  return `${greetHero(`${list.length} teaching session${list.length === 1 ? '' : 's'} today.`)}
  <div class="grid2" style="margin-top:18px">
    <section class="glass"><h3 class="sec">Teaching today</h3>${list.map(rowOf).join('') || '<p class="empty">No teaching today. Add your schedule below.</p>'}</section>
    <section class="glass">${remindPanel()}</section>
  </div>
  <section class="glass" style="margin-top:18px"><h3 class="sec">Add to your schedule</h3>${classForm('teachForm')}</section>
  <h2 class="sec" style="margin:34px 0 16px">Weekly schedule</h2>
  ${week(teach, 'teach')}
  <section class="glass" style="margin-top:22px"><div class="sec"><h3>Course materials</h3><a class="chip" href="#materials">${materials.length} shared</a></div><p class="muted">Share links and short notes with your students.</p></section>`;
}

function renderClasses() {
  return `<div class="grid2">
    <section class="glass"><h3 class="sec">Add a class</h3>${classForm('classForm')}</section>
    <section class="glass">${remindPanel()}</section>
  </div>
  <h2 class="sec" style="margin:34px 0 16px">Weekly timetable</h2>
  ${week(classes, 'student')}
  <div class="grid2" style="margin-top:34px">
    <section class="glass"><h3 class="sec" id="examTitle">Add an exam</h3>
      <form class="form inline" id="examForm"><input type="hidden" name="eid">
        <label>Course code<input name="code" required maxlength="20" placeholder="MTH 101"></label>
        <label>Title<input name="title" required maxlength="60" placeholder="Calculus I"></label>
        <label>Date<input type="date" name="date" required></label>
        <label>Time<input type="time" name="time"></label>
        <label>Venue<input name="venue" maxlength="60" placeholder="Hall A"></label>
        <label class="full">Notes<textarea name="notes" rows="2" maxlength="200" placeholder="Topics or what to bring"></textarea></label>
        <div class="full" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="examSave" type="submit">Save exam</button><button class="btn ghost" id="examCancel" type="button" data-act="cancel-exam" hidden>Cancel</button></div>
      </form></section>
    <section class="glass"><h3 class="sec">Exams</h3>${examsSorted().map((e) => { const n = daysTo(e.date); const cls = n < 0 ? 'ghost' : n <= 3 ? 'bad' : n <= 7 ? 'warn' : ''; return `<div class="row"><span class="chip ${cls}" style="min-width:72px;justify-content:center">${n < 0 ? 'Done' : n === 0 ? 'Today' : n + ' days'}</span><div><strong>${esc(e.code)}, ${esc(e.title)}</strong><small>${fmtDate(e.date)}${e.time ? ', ' + t12(e.time) : ''}${e.venue ? ', ' + esc(e.venue) : ''}</small>${e.notes ? `<small>${esc(e.notes)}</small>` : ''}</div><button class="btn icon" data-act="edit-exam" data-id="${e.id}" aria-label="Edit ${esc(e.title)}">Edit</button><button class="btn icon" data-act="del-exam" data-id="${e.id}" aria-label="Delete ${esc(e.title)}">${I('x')}</button></div>`; }).join('') || '<p class="empty">No exams yet. Add your exam dates so they show on Today.</p>'}</section>
  </div>`;
}

function renderStudy() {
  const plan = makePlan(), time = localStorage.getItem('studyPreference') || 'Evening', dur = localStorage.getItem('studyDuration') || '60';
  return `<div class="grid2">
    <section class="glass"><h3 class="sec">Your study rhythm</h3>
      <form class="form" id="studyForm">
        <div class="inline">
          <label>Preferred time<select name="time">${Object.keys(WINDOWS).map((k) => `<option ${k === time ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
          <label>Session length<select name="session">${[30, 45, 60, 90, 120].map((m) => `<option value="${m}" ${m == dur ? 'selected' : ''}>${m} minutes</option>`).join('')}</select></label>
          <label>Sessions a day<select name="perDay">${[1, 2, 3].map((n) => `<option value="${n}" ${n == prefs.perDay ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        </div>
        <div><button class="btn" type="submit">Build study plan</button></div>
      </form></section>
    <section class="glass"><h3 class="sec">Study notes</h3><p class="muted">Keep notes for each course, pin the ones you revise most, and search them in seconds.</p><div style="margin-top:18px"><a class="btn" href="#notes">${I('file')}Open study notes</a></div></section>
  </div>
  <h2 class="sec" style="margin:34px 0 16px">Next seven days</h2>
  ${plan.length ? plan.map((p) => `<div class="row"><span class="time" style="min-width:160px">${p.day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}, ${t12(hm(p.s))}</span><div><strong>${esc(p.subject)}</strong><small>${t12(hm(p.s))} to ${t12(hm(p.e))}</small></div></div>`).join('') : `<p class="empty">${classes.length || exams.length ? 'No free slots in your preferred time. Try another time or a shorter session.' : 'Add classes or exams first, then build your plan.'}</p>`}`;
}

function renderMoneyBase() {
  const spent = monthSpent(), total = expenses.reduce((a, e) => a + Number(e.amount), 0), left = prefs.budget - spent;
  const cats = CATS.map((c) => [c, monthSpent(c)]), max = Math.max(1, ...cats.map((x) => x[1]));
  return `<div class="grid2">
    <section class="glass"><p class="muted">Spent this month</p><p class="big" style="margin-top:10px">${naira(spent)}</p>
      ${prefs.budget > 0 ? `<div class="bar" style="margin:18px 0 8px"><i style="width:${Math.min(100, spent / prefs.budget * 100)}%"></i></div><p class="muted">${left >= 0 ? naira(left) + ' left' : naira(-left) + ' over'} of ${naira(prefs.budget)}</p>` : '<p class="muted" style="margin-top:12px">Set a monthly budget in Settings to track progress.</p>'}
      <div style="margin-top:24px">${cats.map(([c, v]) => `<div class="sec" style="margin:12px 0 6px"><span>${esc(c)}</span><span class="num muted">${naira(v)}</span></div><div class="bar" style="height:6px"><i style="width:${v / max * 100}%"></i></div>`).join('')}</div></section>
    <section class="glass"><h3 class="sec">Log an expense</h3>
      <form class="inline" id="expForm">
        <label class="full">What was it?<input name="name" required maxlength="60" placeholder="Lunch at the canteen"></label>
        <label>Amount (₦)<input name="amount" type="number" min="1" step="any" required></label>
        <label>Category<select name="category">${CATS.map((c) => `<option>${esc(c)}</option>`).join('')}</select></label>
        <label>Date<input type="date" name="date" value="${todayIso()}" required></label>
        <button class="btn" type="submit">Add expense</button>
      </form></section>
  </div>
  <h2 class="sec" style="margin:34px 0 16px">History <span class="muted" style="font-size:15px;font-weight:600">All time, ${naira(total)}</span></h2>
  <section class="glass">${[...expenses].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((e) => `<div class="row"><span class="chip line">${esc(e.category)}</span><div><strong>${esc(e.name)}</strong><small>${fmtDate(e.date)}</small></div><strong class="num">${naira(e.amount)}</strong><button class="btn icon" data-act="del-exp" data-id="${e.id}" aria-label="Delete ${esc(e.name)}">${I('x')}</button></div>`).join('') || '<p class="empty">No expenses logged yet.</p>'}</section>`;
}

function renderGpa() {
  return `<div class="grid2">
    <section class="glass"><div class="sec"><h3>Your courses</h3><button class="btn ghost" data-act="gpa-add">${I('plus')}Add course</button></div>
      <form id="gpaForm">${gpa.map((r, i) => `<div class="inline" style="grid-template-columns:1fr 78px 88px 40px;margin-bottom:10px"><input name="course" placeholder="Course" value="${esc(r.course)}" aria-label="Course ${i + 1}"><input name="units" type="number" min="1" max="12" step="1" placeholder="Units" value="${esc(r.units)}" aria-label="Units, course ${i + 1}"><select name="grade" aria-label="Grade, course ${i + 1}">${Object.keys(GRADES).map((g) => `<option ${g === r.grade ? 'selected' : ''}>${g}</option>`).join('')}</select><button type="button" class="btn icon" data-act="gpa-del" data-i="${i}" aria-label="Remove course ${i + 1}">${I('x')}</button></div>`).join('')}</form></section>
    <section class="glass"><h3 class="sec">Your GPA</h3><p class="big" id="gpaOut">—</p><p class="muted" id="gpaCls" style="margin-top:10px">Enter units and grades to see your GPA.</p>
      <p class="muted" style="margin-top:20px;font-size:14px">Grades: A is 5, B is 4, C is 3, D is 2, E is 1 and F is 0. Classes run from 4.50 for First Class, 3.50 for Upper Second, 2.40 for Lower Second, 1.50 for Third and 1.00 for Pass.</p></section>
  </div>`;
}

function renderCourseMats() {
  const courses = [...new Set(teach.map((c) => c.course).filter(Boolean))];
  return `<div class="grid2">
    <section class="glass"><h3 class="sec">Add material</h3>
      <form class="form" id="matForm">
        <label>Title<input name="title" required maxlength="80" placeholder="Week 3 lecture notes"></label>
        <label>Course<input name="course" maxlength="40" list="courseList" placeholder="MTH 101"><datalist id="courseList">${courses.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label>
        <label>Link or note<textarea name="value" required rows="4" maxlength="2000" placeholder="Paste a link starting with https:// or write a short note"></textarea></label>
        <div><button class="btn" type="submit">${I('plus')}Add material</button></div>
      </form></section>
    <section class="glass"><h3 class="sec">Shared with students</h3>${materials.map((m) => { const link = /^https?:\/\//i.test(m.value); return `<div class="row">${I(link ? 'link' : 'file')}<div><strong>${esc(m.title)}</strong><small>${m.course ? esc(m.course) + ', ' : ''}${fmtDate(m.date)}</small>${link ? `<a class="chip line" style="margin-top:10px" href="${esc(m.value)}" target="_blank" rel="noopener">Open link</a>` : `<p class="muted" style="margin-top:8px;white-space:pre-wrap">${esc(m.value)}</p>`}</div><button class="btn icon" data-act="del-mat" data-id="${m.id}" aria-label="Delete ${esc(m.title)}">${I('trash')}</button></div>`; }).join('') || '<p class="empty">No materials yet. Add your first link or note.</p>'}</section>
  </div>`;
}

function renderMaterials() {
  const courses = [...new Set(classes.map((c) => (c.course || '').trim()).filter(Boolean))];
  const q = (c) => 'https://www.google.com/search?q=' + encodeURIComponent(c + ' past questions');
  const explore = [['AbSApp, AbS Tech Connect', 'Books, past questions, handouts and notes.', 'https://www.abstechconnect.com/library'], ['Rugga Library', 'Library resources and academic reading.', 'https://www.google.com/search?q=Rugga%20Library%20official%20website'], ['ExamGuard', 'Exam preparation, practice questions and revision.', 'https://www.google.com/search?q=ExamGuard%20student%20learning%20website'], ['ArewaUniHub', 'Student-contributed notes, summaries and past questions.', 'https://arewaunihub.com/'], ['Acadron', 'Nigerian university past questions and study notes.', 'https://acadron.com.ng/'], ['OpenStax', 'Free, openly licensed textbooks.', 'https://openstax.org/subjects'], ['Open Textbook Library', 'Openly licensed textbooks across many subjects.', 'https://open.umn.edu/opentextbooks'], ['DOAB', 'Open-access scholarly books, peer reviewed.', 'https://www.doabooks.org/']];
  return `<label style="margin-bottom:24px">Search resources<input id="matSearch" type="search" placeholder="Try textbook, past questions or OpenStax"></label>
  ${courses.length ? `<h2 class="sec">For your courses</h2><section class="glass">${courses.map((c) => `<a class="row" href="${q(c)}" target="_blank" rel="noopener" data-t="${esc((c + ' past questions').toLowerCase())}">${I('search')}<div><strong>${esc(c)}, past questions</strong><small>Search the web for papers and notes for this course.</small></div></a>`).join('')}</section>` : ''}
  <h2 class="sec" style="margin-top:30px">Explore</h2>
  <section class="glass">${explore.map(([n, d, u]) => `<a class="row" href="${u}" target="_blank" rel="noopener" data-t="${esc((n + ' ' + d).toLowerCase())}">${I('book')}<div><strong>${esc(n)}</strong><small>${esc(d)}</small></div></a>`).join('')}</section>`;
}

const roleBtn = (r, label, desc, icon) => `<button class="role" type="button" data-set-role="${r}" aria-pressed="${role === r}"><span class="bubble">${I(icon)}</span><span><strong>${label}</strong><small>${desc}</small></span></button>`;
function renderSettings() {
  return `<div class="grid2">
    <section class="glass"><h3 class="sec">Profile</h3>
      <form class="form" id="prefForm">
        <label>Your name<input name="name" maxlength="40" value="${esc(studentName())}" placeholder="What should we call you?"></label>
        ${role === 'student' ? `<label>Monthly budget (₦)<input name="budget" type="number" min="0" step="500" value="${prefs.budget || ''}" placeholder="Leave empty for none"></label>` : ''}
        <label>Theme<select name="theme">${[['system', 'Match my device'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<option value="${v}" ${prefs.theme === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <div><button class="btn" type="submit">Save changes</button></div>
      </form></section>
    <section class="glass"><h3 class="sec">Your role</h3>
      <div class="roles">${roleBtn('student', 'Student', 'Classes, exams, study plans and spending.', 'cap')}${roleBtn('lecturer', 'Lecturer', 'Teaching schedule, reminders and course materials.', 'screen')}</div>
      <p class="muted" style="margin-top:16px">Switching takes you to the matching dashboard.</p></section>
  </div>
  <section class="glass" style="margin-top:18px"><h3 class="sec">Your data</h3><p class="muted">Your planner data is saved in this browser on this device. Sign-in is optional and only needed for Discover.</p><div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:18px"><a class="btn ghost" href="privacy.html">Privacy</a><a class="btn ghost" href="terms.html">Terms</a><a class="btn ghost" href="about.html">About</a><a class="btn ghost" href="contact.html">Contact</a></div><div style="margin-top:18px"><button class="btn ghost" data-act="wipe" style="color:var(--bad)">Erase all data</button></div></section>`;
}

const renderMore = () => `<section class="glass">${[['notes', 'file', 'Study notes', 'Course notes, pinned and searchable.'], ['learn', 'book', 'Study guides', 'Practical guides on timetables, GPA and exams.'], ['gpa', 'calc', 'GPA calculator', 'Calculate your semester GPA.'], ['materials', 'search', 'Study materials', 'Find textbooks and past questions.'], ['settings', 'gear', 'Settings', 'Name, role, budget and theme.'], ['privacy', 'file', 'Privacy', 'What is stored, and which Google services run.'], ['terms', 'file', 'Terms', 'The short version.'], ['about', 'info', 'About', 'Who StudentHub is for and how it works.'], ['contact', 'mail', 'Contact', 'Questions, bugs and privacy requests.']].map(([v, ic, t, d]) => `<a class="row" href="#${v}">${I(ic)}<div><strong>${t}</strong><small>${d}</small></div></a>`).join('')}</section>`;

const PRIVACY = `<article class="glass prose"><p class="muted">Last updated 9 November 2026.</p>
<h3>Google services on this site</h3><p>StudentHub uses Google Analytics to measure visits, and Google AdSense to show advertisements. These services can set cookies and collect technical and usage information. You can manage ad personalisation in Google Ads Settings.</p>
<h3>What stays on your device</h3><p>Your name, role, timetable, exam dates, expenses, GPA entries, course materials and settings are saved only in this browser on this device. StudentHub does not send them to a server.</p>
<h3>Reminders</h3><p>Alerts appear while StudentHub is open. System notifications need your permission, and you can turn reminders off at any time.</p>
<h3>Accounts</h3><p>If you create an account, we store your email, display name, university, department, interests and connections on Supabase servers so that Discover works. Your planner data stays on this device.</p>
<h3>Erasing your data</h3><p>Use Erase all data in Settings, or clear this site’s storage in your browser.</p>
<h3>Contact</h3><p>getstudenthub@gmail.com</p></article>`;
const TERMS = `<article class="glass prose"><ul>
<li>StudentHub is a personal planning tool for students and lecturers. It is not an official university system.</li>
<li>Confirm exam dates, venues and timetables with your department or the official portal.</li>
<li>GPAs, budgets and study plans are estimates to help you plan. They are not official results.</li>
<li>Study materials link to websites we do not control. Their own terms apply.</li>
<li>StudentHub is provided as is. You use it at your own discretion.</li></ul></article>`;

const RENDER = { messages: renderMessages, profile: renderPersonProfile, home: () => role === 'lecturer' ? renderTeach() : renderToday() + quickAccess(), classes: renderClasses, notes: renderNotes, login: renderLogin, discover: renderDiscover, tasks: renderTasks, study: renderStudy, money: renderMoney, gpa: renderGpa, materials: () => role === 'lecturer' ? renderCourseMats() : renderMaterials(), more: renderMore, settings: renderSettings, privacy: () => PRIVACY, terms: () => TERMS };
function render() { const el = $('#v-' + current); if (!el) return; el.innerHTML = RENDER[current](); if (current === 'gpa') updateGpa(); if (current === 'notes') { paintFilters(); paintList(); paintEditor(); } paintInstall(); paintAvatar(); if (current === 'messages' && me) refreshChat().catch(handleError); }

function readGpa() {
  gpa = [...document.querySelectorAll('.inline input[name=course]')].map((c) => { const row = c.parentElement; return { course: c.value, units: row.querySelector('[name=units]').value, grade: row.querySelector('[name=grade]').value }; });
  if (!gpa.length) gpa = [blank()];
}
const classify = (g) => g >= 4.5 ? 'First Class' : g >= 3.5 ? 'Upper Second Class' : g >= 2.4 ? 'Lower Second Class' : g >= 1.5 ? 'Third Class' : g >= 1 ? 'Pass' : 'Below pass';
function updateGpa() {
  if (!$('#gpaOut')) return;
  readGpa(); saveAll();
  const rows = gpa.filter((r) => Number(r.units) > 0);
  const units = rows.reduce((a, r) => a + Number(r.units), 0);
  const points = rows.reduce((a, r) => a + Number(r.units) * (GRADES[r.grade] ?? 0), 0);
  $('#gpaOut').textContent = units ? (points / units).toFixed(2) : '—';
  $('#gpaCls').textContent = units ? classify(points / units) + ', ' + units + ' units' : 'Enter units and grades to see your GPA.';
}

function fillExam(id) {
  const e = exams.find((x) => x.id === id), f = $('#examForm');
  if (!e || !f) return;
  const set = (n, v) => { f.elements[n].value = v || ''; };
  set('eid', e.id); set('code', e.code); set('title', e.title); set('date', e.date); set('time', e.time); set('venue', e.venue); set('notes', e.notes);
  $('#examTitle').textContent = 'Edit exam'; $('#examSave').textContent = 'Update exam'; $('#examCancel').hidden = false;
  f.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function resetExam() {
  const f = $('#examForm'); if (!f) return;
  f.reset(); f.elements.eid.value = '';
  $('#examTitle').textContent = 'Add an exam'; $('#examSave').textContent = 'Save exam'; $('#examCancel').hidden = true;
}
function filterMats() { const q = $('#matSearch').value.trim().toLowerCase(); $$('[data-t]').forEach((el) => { el.hidden = !!q && !el.dataset.t.includes(q); }); }

function buildNav() {
  const R = ROUTES[role] || ROUTES.student;
  $('#nav').innerHTML = R.nav.map(([v, ic, l]) => `<a href="#${v}" data-nav="${v}">${I(ic)}<span>${l}</span></a>`).join('');
  $('#tab').innerHTML = R.tab.map(([v, ic, l]) => v === 'discover'
    ? `<a class="ball-tab" href="#${v}" data-nav="${v}" aria-label="${l}"><span class="ball-gap" aria-hidden="true"></span><span class="ball" aria-hidden="true">${I(ic)}</span><span>${l}</span></a>`
    : `<a href="#${v}" data-nav="${v}">${I(ic)}<span>${l}</span></a>`).join('');
  $('#views').innerHTML = R.views.map((v) => `<section class="view" id="v-${v}" hidden></section>`).join('');
  document.body.dataset.role = role;
}
const tabFor = (v) => role === 'lecturer' ? (v === 'privacy' || v === 'terms' || v === 'login' ? 'settings' : v) : ({ notes: 'study', money: 'home', gpa: 'home', materials: 'home', settings: 'home', privacy: 'home', terms: 'home', profile: 'discover' }[v] || v);
function route() {
  const R = ROUTES[role] || ROUTES.student;
  let v = location.hash.slice(1);
  if (['privacy', 'terms', 'about', 'contact', 'learn'].includes(v)) { location.href = v + '.html'; return; }
  if (!R.views.includes(v)) v = 'home';
  if (gateOn() && !PUBLIC_VIEWS.includes(v)) { location.hash = '#login'; return; }
  document.body.classList.toggle('gated', gateOn());
  current = v;
  $$('.view').forEach((s) => { s.hidden = s.id !== 'v-' + v; });
  $$('#nav a').forEach((a) => a.dataset.nav === (v === 'notes' ? 'study' : v) ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  $$('#tab a').forEach((a) => a.dataset.nav === tabFor(v) ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  $('#ttl').textContent = pick(TITLES[v]);
  $('#sub').textContent = pick(SUBS[v]);
  document.title = pick(TITLES[v]) === 'StudentHub' ? 'StudentHub | Class timetable, exams and study planner' : pick(TITLES[v]) + ' | StudentHub';
  render();
  if ((current === 'discover' || current === 'profile') && me) loadPeople();
  startChatPolling();
  window.scrollTo(0, 0);
}
function setRole(r) {
  role = r; localStorage.setItem('studenthubRole', r);
  buildNav(); location.hash = '#home'; route();
  toast(r === 'lecturer' ? 'Lecturer dashboard ready.' : 'Student dashboard ready.');
}

let step = 0, chosen = role;
const onb = $('#onb');
function showStep(i) {
  step = i;
  $$('.onb-step').forEach((s) => s.classList.toggle('on', Number(s.dataset.s) === i));
  $$('.progress span').forEach((b, k) => b.classList.toggle('on', k <= i));
  $('#onbBack').hidden = i === 0;
  $('#onbNext').innerHTML = (i === 2 ? 'Enter StudentHub ' : 'Continue ') + I('arrow');
}
$$('.role[data-role]').forEach((b) => b.addEventListener('click', () => {
  chosen = b.dataset.role;
  $$('.role[data-role]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
}));
$('#onbName').value = studentName();
$('#onbBack').addEventListener('click', () => showStep(Math.max(0, step - 1)));
$('#onbNext').addEventListener('click', () => {
  if (step === 0) return showStep(1);
  if (step === 1) {
    if (!chosen) return toast('Choose student or lecturer to continue.');
    const n = $('#onbName').value.trim();
    $('#onbReadyTitle').textContent = n ? 'You’re all set, ' + n + '.' : 'You’re all set.';
    $('#onbReadyText').textContent = chosen === 'lecturer' ? 'Your dashboard shows your teaching schedule, reminders and course materials.' : 'Your dashboard shows today’s classes, exams, study plan and spending.';
    return showStep(2);
  }
  const n = $('#onbName').value.trim().slice(0, 40);
  if (n) localStorage.setItem('studentName', n); else localStorage.removeItem('studentName');
  localStorage.setItem('studenthubOnboardingComplete', 'true');
  onb.hidden = true;
  setRole(chosen);
});

document.addEventListener('click', (e) => {
  const sr = e.target.closest('[data-set-role]');
  if (sr) { if (sr.dataset.setRole !== role) setRole(sr.dataset.setRole); return; }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act, id = b.dataset.id;
  switch (a) {
    case 'remind': return toggleRemind();
    case 'install': return installApp();
    case 'close-sheet': return closeSheet();
    case 'edit-exam': return fillExam(id);
    case 'cancel-exam': return resetExam();
    case 'wipe': {
      if (!confirm('Erase all StudentHub data on this device?')) return;
      ['studenthubRole', 'studenthubOnboardingComplete', 'studentName', 'studyPreference', 'studyDuration', 'studentPrefs', 'studentClasses', 'lecturerClasses', 'studentExams', 'studentExpenses', 'studentGpa', 'lecturerMaterials', 'studentNotes', 'studentTasks'].forEach((k) => localStorage.removeItem(k));
      location.reload(); return;
    }
    case 'del-class': if (b.dataset.k === 'teach') teach = teach.filter((x) => x.id !== id); else classes = classes.filter((x) => x.id !== id); break;
    case 'del-exam': exams = exams.filter((x) => x.id !== id); break;
    case 'del-exp': expenses = expenses.filter((x) => x.id !== id); break;
    case 'del-mat': materials = materials.filter((x) => x.id !== id); break;
    case 'gpa-add': readGpa(); gpa.push(blank()); break;
    case 'gpa-del': readGpa(); gpa.splice(Number(b.dataset.i), 1); if (!gpa.length) gpa.push(blank()); break;
    default: return;
  }
  saveAll(); render();
});

document.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target, v = Object.fromEntries(new FormData(f));
  if (f.id === 'gpaForm') return updateGpa();
  if (f.id === 'classForm' || f.id === 'teachForm') {
    if (toMin(v.end) <= toMin(v.start)) return toast('End time must be after start time.');
    const item = { id: uid(), course: v.course.trim(), day: v.day, startTime: v.start, endTime: v.end, room: (v.room || '').trim() };
    if (f.id === 'teachForm') teach.push(item); else classes.push(item);
    toast('Class saved.');
  } else if (f.id === 'examForm') {
    const item = { id: v.eid || uid(), code: v.code.trim(), title: v.title.trim(), date: v.date, time: v.time || '', venue: (v.venue || '').trim(), notes: (v.notes || '').trim() };
    exams = v.eid ? exams.map((x) => (x.id === v.eid ? item : x)) : [...exams, item];
    resetExam(); toast('Exam saved.');
  } else if (f.id === 'expForm') {
    const amount = Number(v.amount);
    if (!(amount > 0)) return toast('Enter an amount above zero.');
    expenses.push({ id: uid(), name: v.name.trim(), amount, category: v.category, date: v.date });
    toast('Expense added.');
  } else if (f.id === 'matForm') {
    materials.unshift({ id: uid(), title: v.title.trim(), course: (v.course || '').trim(), value: v.value.trim(), date: todayIso() });
    toast('Material shared.');
  } else if (f.id === 'studyForm') {
    localStorage.setItem('studyPreference', v.time);
    localStorage.setItem('studyDuration', v.session);
    prefs.perDay = Number(v.perDay);
    toast('Study plan updated.');
  } else if (f.id === 'prefForm') {
    const n = (v.name || '').trim().slice(0, 40);
    if (n) localStorage.setItem('studentName', n); else localStorage.removeItem('studentName');
    if (v.budget !== undefined) prefs.budget = Math.max(0, Number(v.budget) || 0);
    prefs.theme = v.theme;
    applyTheme(); toast('Settings saved.');
  } else if (f.id === 'taskForm') { addTask(v); }
  else if (f.id === 'authForm') { authSubmit(f); return; }
  else if (f.id === 'newPassForm') { setNewPassword(f); return; }
  else if (f.id === 'chatForm') { sendChat(v.body).catch(handleError); return; }
  else if (f.id === 'accountForm') { saveAccount(v); return; }
  else return;
  saveAll(); render();
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'matSearch') filterMats();
  else if (e.target.closest('.inline') && e.target.closest('#gpaForm')) updateGpa();
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.closest('#gpaForm')) return updateGpa();
  if (t.dataset.pref) { const v = t.value; prefs[t.dataset.pref] = isNaN(v) ? v : Number(v); saveAll(); toast('Saved.'); }
});

const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function paintInstall() {
  $$('[data-act="install"]').forEach((b) => { b.hidden = isInstalled(); b.dataset.ready = window.__installPrompt ? 'true' : 'false'; });
}
window.addEventListener('sh-installable', paintInstall);
window.addEventListener('appinstalled', () => { window.__installPrompt = null; paintInstall(); toast('StudentHub is installed. Open it from your home screen.'); });
function installStatus() {
  if (isInstalled()) return 'StudentHub is already installed on this device. Open it from your home screen.';
  if (isIOS()) return 'On iPhone or iPad, open this page in Safari, tap the Share button, then choose Add to Home Screen.';
  if (!window.isSecureContext || !('serviceWorker' in navigator)) return 'Installing needs the live site at mystudenthubapp.com, opened in Chrome, Edge, Samsung Internet or Safari. This preview cannot install the app.';
  if (window.__swError) return 'The offline setup could not start in this browser, so it cannot offer installation yet. Open the live site in Chrome or Edge and try again.';
  if (!navigator.serviceWorker.controller) return 'StudentHub is finishing its offline setup. Reload this page once, then try again.';
  return 'This browser has not offered the install prompt yet. Use the install icon in the address bar, or open the browser menu and choose Install app. If you closed the prompt earlier, the browser may wait before offering it again.';
}
function openSheet() {
  $('#sheetBody').textContent = installStatus();
  $('#sheet').hidden = false;
}
function closeSheet() { $('#sheet').hidden = true; }
async function installApp() {
  const promptEvent = window.__installPrompt;
  if (!promptEvent) return openSheet();
  window.__installPrompt = null; paintInstall();
  promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  toast(choice.outcome === 'accepted' ? 'Installing StudentHub.' : 'Install cancelled. Tap Install app whenever you are ready.');
}
$('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('service-worker.js');
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller && !sessionStorage.getItem('studenthub-sw-reload')) {
        sessionStorage.setItem('studenthub-sw-reload', '1');
        location.reload();
      }
    } catch (err) { window.__swError = err; }
  });
}

// ---------- Study notes ----------
const NOTE_COLOURS = ['#5367f5', '#e0a030', '#22a06b', '#e0457b'];
function saveNotes() { save('studentNotes', studentNotes); }
function noteCourses() { return [...new Set(classes.map((c) => (c.course || '').trim()).filter(Boolean))]; }
function noteById(id) { return studentNotes.find((n) => n.id === id); }
function wordsOf(text) { return (text || '').trim().split(/\s+/).filter(Boolean).length; }
function fmtAgo(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + ' min ago';
  const h = Math.round(m / 60);
  if (h < 24) return h + ' h ago';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function metaText(n) { const w = wordsOf(n.body); return `${w} ${w === 1 ? 'word' : 'words'}, about ${Math.max(1, Math.ceil(w / 200))} min read, edited ${fmtAgo(n.updated)}`; }
function snippet(n) { return (n.body || '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'No text yet'; }
function visibleNotes() {
  const q = noteQuery.trim().toLowerCase();
  const byTitle = (a, b) => (a.title || 'Untitled note').localeCompare(b.title || 'Untitled note');
  const byCourse = (a, b) => (a.course || '').localeCompare(b.course || '') || b.updated - a.updated;
  const order = noteSort === 'title' ? byTitle : noteSort === 'course' ? byCourse : (a, b) => b.updated - a.updated;
  return studentNotes
    .filter((n) => !noteCourse || n.course === noteCourse)
    .filter((n) => !q || (n.title + ' ' + n.body + ' ' + n.course).toLowerCase().includes(q))
    .sort((a, b) => (!!b.pinned - !!a.pinned) || order(a, b));
}
function renderNotes() {
  return `<div class="notes" id="notesRoot">
  <section class="glass notes-top">
    <label class="search-row"><span class="sr-only">Search notes</span>${I('search')}<input id="noteSearch" type="search" value="${esc(noteQuery)}" placeholder="Search titles, notes and courses"></label>
    <div class="notes-bar">
      <div class="chips" id="noteFilters" role="group" aria-label="Filter by course"></div>
      <div class="notes-bar-end">
        <label class="sort">Sort<select id="noteSort">${[['updated', 'Recently edited'], ['title', 'Title A to Z'], ['course', 'Course']].map(([v, l]) => `<option value="${v}" ${noteSort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <button class="btn" type="button" data-note-act="new">${I('plus')}New note</button>
      </div>
    </div>
  </section>
  <div class="notes-grid">
    <section class="glass editor" id="editor" aria-label="Note editor"></section>
    <section class="glass list-card" aria-labelledby="notesListTitle">
      <div class="sec"><h3 id="notesListTitle">Your notes</h3><span class="muted" id="noteCount"></span></div>
      <div id="noteList"></div>
    </section>
  </div>
</div>`;
}
function paintFilters() {
  const el = $('#noteFilters'); if (!el) return;
  const courses = [...new Set([...noteCourses(), ...studentNotes.map((n) => n.course).filter(Boolean)])];
  el.innerHTML = [['', 'All notes'], ...courses.map((c) => [c, c])].map(([v, l]) => `<button class="chip-btn" type="button" data-note-act="filter" data-course="${esc(v)}" aria-pressed="${noteCourse === v}">${esc(l)}</button>`).join('');
}
function paintList() {
  const el = $('#noteList'); if (!el) return;
  const list = visibleNotes();
  $('#noteCount').textContent = list.length + ' of ' + studentNotes.length;
  el.innerHTML = list.length
    ? list.map((n) => `<button class="note-item" type="button" data-note-act="open" data-id="${n.id}" aria-current="${n.id === activeNoteId}"><span class="dot" style="background:${NOTE_COLOURS[n.color] || NOTE_COLOURS[0]}"></span><span><strong>${esc(n.title || 'Untitled note')}</strong><small class="clamp">${esc(snippet(n))}</small><small>${esc(n.course || 'No course')}, ${fmtAgo(n.updated)}</small></span>${n.pinned ? I('pin') : ''}</button>`).join('')
    : `<div class="empty-note">${I('file')}<h3>${studentNotes.length ? 'No notes match' : 'No notes yet'}</h3><p class="muted">${studentNotes.length ? 'Try another search or course filter.' : 'Start with a course filter, or write a general note.'}</p></div>`;
}
function paintEditor() {
  const el = $('#editor'); if (!el) return;
  const n = noteById(activeNoteId);
  if (!n) {
    el.innerHTML = `<div class="empty-note">${I('file')}<h3>Choose a note or start a new one</h3><p class="muted">Notes save as you type, on this device only.</p><button class="btn" type="button" data-note-act="new">${I('plus')}New note</button></div>`;
    return;
  }
  const courses = [...new Set([...noteCourses(), n.course].filter(Boolean))];
  el.innerHTML = `
    <div class="editor-head">
      <span class="save-state" id="saveState" aria-live="polite">Saved</span>
      <div class="tools">
        <button class="btn icon" type="button" data-note-act="pin" aria-pressed="${!!n.pinned}" aria-label="${n.pinned ? 'Unpin note' : 'Pin note'}">${I('pin')}</button>
        <button class="btn icon" type="button" data-note-act="copy" aria-label="Copy note text">${I('copy')}</button>
        <button class="btn icon" type="button" data-note-act="download" aria-label="Download as a text file">${I('download')}</button>
        <button class="btn icon" type="button" data-note-act="delete" aria-label="Delete note">${I('trash')}</button>
      </div>
    </div>
    <label>Title<input id="noteTitle" maxlength="120" value="${esc(n.title)}" placeholder="For example, Week 4 lecture"></label>
    <div class="inline">
      <label>Course<select id="noteCourseSel"><option value="">No course</option>${courses.map((c) => `<option ${c === n.course ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
      <div class="field"><span class="lbl">Colour</span><div class="swatches" role="radiogroup" aria-label="Note colour">${NOTE_COLOURS.map((c, i) => `<button class="swatch" type="button" role="radio" aria-checked="${n.color === i}" style="--c:${c}" data-note-act="colour" data-i="${i}" aria-label="Colour ${i + 1}"></button>`).join('')}</div></div>
    </div>
    <label>Note<textarea id="noteBody" class="body" placeholder="Start typing. Your note saves as you type.">${esc(n.body)}</textarea></label>
    <p class="muted meta" id="noteMeta">${metaText(n)}</p>`;
}
function setSave(t) { const s = $('#saveState'); if (s) s.textContent = t; }
function saveNoteSoon() {
  setSave('Saving');
  clearTimeout(noteSaveTimer);
  noteSaveTimer = setTimeout(() => { saveNotes(); setSave('Saved'); }, 350);
}
function onNoteInput(t) {
  if (t.id === 'noteSearch') { noteQuery = t.value; paintList(); return; }
  const n = noteById(activeNoteId); if (!n) return;
  if (t.id === 'noteTitle') n.title = t.value;
  else if (t.id === 'noteBody') n.body = t.value;
  else return;
  n.updated = Date.now();
  const m = $('#noteMeta'); if (m) m.textContent = metaText(n);
  saveNoteSoon();
  paintList();
}
function newNote() {
  const n = { id: uid(), title: '', body: '', course: noteCourse, color: 0, pinned: false, created: Date.now(), updated: Date.now() };
  studentNotes.unshift(n); activeNoteId = n.id; saveNotes();
  paintFilters(); paintList(); paintEditor();
  const t = $('#noteTitle'); if (t) t.focus();
}
async function copyNote(n) {
  const text = (n.title ? n.title + '\n\n' : '') + (n.body || '');
  try { await navigator.clipboard.writeText(text); toast('Note copied.'); }
  catch { toast('Copy is not available here. Select the text and copy it instead.'); }
}
function downloadNote(n) {
  const text = (n.title ? n.title + '\n' + '='.repeat(Math.min(n.title.length, 40)) + '\n\n' : '') + (n.body || '');
  const base = (n.title || 'note').replace(/[^a-z0-9 _-]+/gi, '').trim().slice(0, 60) || 'note';
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url; a.download = base + '.txt';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Note downloaded.');
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-note-act]');
  if (!b) return;
  const a = b.dataset.noteAct;
  if (a === 'new') return newNote();
  if (a === 'open') { activeNoteId = b.dataset.id; paintList(); paintEditor(); return; }
  if (a === 'filter') { noteCourse = b.dataset.course; paintFilters(); paintList(); return; }
  const n = noteById(activeNoteId); if (!n) return;
  if (a === 'pin') { n.pinned = !n.pinned; n.updated = Date.now(); saveNotes(); paintList(); paintEditor(); }
  else if (a === 'colour') { n.color = Number(b.dataset.i); n.updated = Date.now(); saveNotes(); paintList(); paintEditor(); }
  else if (a === 'copy') copyNote(n);
  else if (a === 'download') downloadNote(n);
  else if (a === 'delete') {
    if (!confirm('Delete this note? This cannot be undone.')) return;
    studentNotes = studentNotes.filter((x) => x.id !== n.id);
    activeNoteId = null; saveNotes(); paintFilters(); paintList(); paintEditor(); toast('Note deleted.');
  }
});
document.addEventListener('input', (e) => { if (e.target.closest && e.target.closest('#notesRoot')) onNoteInput(e.target); });
document.addEventListener('change', (e) => {
  const t = e.target;
  if (!t.closest || !t.closest('#notesRoot')) return;
  if (t.id === 'noteSort') { noteSort = t.value; paintList(); return; }
  if (t.id === 'noteCourseSel') {
    const n = noteById(activeNoteId); if (!n) return;
    n.course = t.value; n.updated = Date.now(); saveNotes();
    paintFilters(); paintList(); paintEditor();
  }
});
window.addEventListener('pagehide', saveNotes);

// ---------- Accounts, Discover, Tasks and charts ----------
const CHART_COLOURS = ['#5367f5', '#22a06b', '#e0a030', '#e0457b', '#8b5cf6', '#8a94b0'];
let sb = null, me = null, myProfile = null, authMode = 'signin';
let tasks = load('studentTasks', []), taskFilter = 'open';
let discoverRows = [], connMap = {}, requestRows = [], requestNames = {};
const saveTasks = () => save('studentTasks', tasks);
const configured = () => /^https:\/\//.test(SH_CONFIG.url) && SH_CONFIG.anonKey.length > 20 && !/PASTE_/.test(SH_CONFIG.anonKey);
let recovering = false; // true after the user opens a password-reset link
let authChecked = false; // true once the first sign-in check has finished
const PUBLIC_VIEWS = ['login']; // screens that can be opened without signing in
// Signed-out users see the sign-in page first, unless they chose to continue without an account
const gateOn = () => configured() && authChecked && !me && localStorage.getItem('studenthubGuest') !== 'true';
const setAuthMsg = (t) => { const el = $('#authMsg'); if (el) el.textContent = t; };
const notice = (text) => `<section class="glass"><p class="muted">${text}</p></section>`;

function friendly(err) {
  const m = String((err && (err.message || err.code)) || '');
  if (/rate_limited|rate limit|too many|429/i.test(m)) return 'You are going too fast. Wait a few minutes, then try again.';
  if (/not_connected/.test(m)) return 'You can message a student once they accept your connection request.';
  if (/\bblocked\b/.test(m)) return 'This action is not available between these two accounts.';
  if (/invalid login/i.test(m)) return 'That email and password do not match.';
  if (/already registered|already exists/i.test(m)) return 'An account with this email already exists. Try signing in.';
  if (/not confirmed/i.test(m)) return 'Confirm your email first. Check your inbox, or resend the email below.';
  if (/password/i.test(m)) return 'Choose a longer password, at least 8 characters.';
  if (/fetch|network|failed to load/i.test(m)) return 'No connection. Check your internet and try again.';
  if (/row-level security|permission denied|42501/i.test(m)) return 'You do not have permission to do that.';
  return 'Something went wrong. Try again.';
}
function handleError(err) { console.error(err); toast(friendly(err)); }

function loadSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabase) return resolve(window.supabase);
    const tag = document.createElement('script');
    tag.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/dist/umd/supabase.js';
    tag.onload = () => resolve(window.supabase);
    tag.onerror = () => reject(new Error('Supabase script failed to load'));
    document.head.appendChild(tag);
  });
}
async function initAccounts() {
  if (!configured()) return;
  try {
    const lib = await loadSupabase();
    sb = lib.createClient(SH_CONFIG.url, SH_CONFIG.anonKey);
    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { recovering = true; location.hash = '#login'; render(); return; }
      setUser(session ? session.user : null).catch(handleError);
    });
    const { data } = await sb.auth.getSession();
    await setUser(data.session ? data.session.user : null);
  } catch (err) { handleError(err); }
}
async function setUser(user) {
  me = user || null; myProfile = null; authChecked = true;
  if (me && sb) {
    const pending = load('studentPendingProfile', null);
    if (pending) {
      const { error } = await sb.from('public_profiles').update(pending).eq('id', me.id);
      if (!error) localStorage.removeItem('studentPendingProfile');
    }
    const { data, error } = await sb.from('public_profiles').select('*').eq('id', me.id).maybeSingle();
    if (error) console.error(error);
    myProfile = data || null;
  }
  paintAvatar();
  if (gateOn() && !PUBLIC_VIEWS.includes(current)) { location.hash = '#login'; return; }
  if (current === 'login' || current === 'discover') render();
  if (current === 'discover' && me) loadPeople();
}
function paintAvatar() {
  const btn = $('#avatarBtn');
  if (!btn) return;
  const name = (myProfile && myProfile.display_name) || studentName() || (me && me.email) || '';
  btn.innerHTML = name ? esc(name.charAt(0).toUpperCase()) : I('cap');
  btn.setAttribute('aria-label', name ? 'Open your account, ' + name : 'Sign in or create an account');
}
async function authSubmit(f) {
  if (!sb) return setAuthMsg('Accounts are not connected yet.');
  const v = Object.fromEntries(new FormData(f));
  const email = (v.email || '').trim(), password = v.password || '';
  if (authMode === 'signup' && !v.age) return setAuthMsg('You must be 16 or older to create an account.');
  setAuthMsg('Please wait.');
  try {
    if (authMode === 'signup') {
      const name = (v.name || '').trim();
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw error;
      save('studentPendingProfile', { display_name: name, university: (v.university || '').trim(), department: (v.department || '').trim() });
      setAuthMsg(data.session ? 'Account created.' : 'Check your email and tap the confirmation link, then sign in.');
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setAuthMsg('');
      location.hash = '#home';
    }
  } catch (err) { console.error(err); setAuthMsg(friendly(err)); }
}
async function resetPassword() {
  if (!sb) return toast('Accounts are not connected yet.');
  const email = (document.querySelector('#authEmail')?.value || '').trim();
  if (!email) return toast('Enter your email first, then tap Forgot password.');
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/index.html#login' });
  if (error) return handleError(error);
  toast('If an account exists for that email, a reset link is on its way.');
}
async function resendConfirmation() {
  if (!sb) return toast('Accounts are not connected yet.');
  const email = (document.querySelector('#authEmail')?.value || '').trim();
  if (!email) return toast('Enter your email first.');
  const { error } = await sb.auth.resend({ type: 'signup', email });
  if (error) return handleError(error);
  toast('Confirmation email sent again.');
}
async function setNewPassword(f) {
  if (!sb) return;
  const v = Object.fromEntries(new FormData(f));
  if (v.password !== v.confirm) return setAuthMsg('The two passwords do not match.');
  setAuthMsg('Please wait.');
  const { error } = await sb.auth.updateUser({ password: v.password });
  if (error) return setAuthMsg(friendly(error));
  recovering = false; toast('Password updated. You are signed in.'); render();
}
async function signOut() {
  if (!sb) return;
  const { error } = await sb.auth.signOut();
  if (error) return handleError(error);
  localStorage.removeItem('studenthubGuest'); toast('Signed out.'); location.hash = '#login';
}
async function deleteAccount() {
  if (!sb || !me) return;
  if (!confirm('Delete your StudentHub account and its server data? This cannot be undone.')) return;
  const { error } = await sb.rpc('delete_my_account');
  if (error) return handleError(error);
  await sb.auth.signOut();
  toast('Your account has been deleted.');
}
async function saveAccount(v) {
  if (!sb || !me) return;
  const interests = (v.interests || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 10);
  const update = { display_name: (v.display_name || '').trim(), university: (v.university || '').trim(), department: (v.department || '').trim(), interests, discoverable: !!v.discoverable };
  if (!update.display_name) return toast('Add a display name.');
  const { error } = await sb.from('public_profiles').update(update).eq('id', me.id);
  if (error) return handleError(error);
  myProfile = { ...myProfile, ...update };
  paintAvatar(); toast('Profile saved.'); render();
}

// Tasks
function addTask(v) {
  const title = (v.title || '').trim();
  if (!title) return toast('Add a title for the task.');
  tasks.unshift({ id: uid(), title, course: (v.course || '').trim(), due: v.due || '', priority: Number(v.priority) || 2, done: false, created: Date.now() });
  saveTasks(); toast('Task added.');
}
function taskAction(a, b) {
  const id = b.dataset.id;
  if (a === 'filter') { taskFilter = b.dataset.f; return render(); }
  if (a === 'toggle') { const t = tasks.find((x) => x.id === id); if (t) { t.done = !t.done; saveTasks(); } return render(); }
  if (a === 'delete') { if (!confirm('Delete this task?')) return; tasks = tasks.filter((x) => x.id !== id); saveTasks(); return render(); }
}
function renderTasks() {
  const today = todayIso();
  const open = tasks.filter((t) => !t.done);
  const overdue = open.filter((t) => t.due && t.due < today).length;
  const views = { open: (t) => !t.done, today: (t) => !t.done && t.due === today, overdue: (t) => !t.done && t.due && t.due < today, done: (t) => t.done, all: () => true };
  const list = tasks.filter(views[taskFilter] || views.open).sort((x, y) => (x.done - y.done) || ((x.due || '9999') < (y.due || '9999') ? -1 : 1) || (y.priority - x.priority));
  const filters = [['open', 'Open'], ['today', 'Due today'], ['overdue', 'Overdue'], ['done', 'Done'], ['all', 'All']];
  return `<div class="grid2">
    <section class="glass"><h3 class="sec">Add a task</h3>
      <form class="form" id="taskForm">
        <label>Task<input name="title" required maxlength="120" placeholder="For example, read chapter 4"></label>
        <div class="inline">
          <label>Course<input name="course" maxlength="40" list="taskCourses" placeholder="MTH 101"><datalist id="taskCourses">${noteCourses().map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label>
          <label>Due date<input name="due" type="date"></label>
          <label>Priority<select name="priority"><option value="3">High</option><option value="2" selected>Medium</option><option value="1">Low</option></select></label>
        </div>
        <div><button class="btn" type="submit">${I('plus')}Add task</button></div>
      </form></section>
    <section class="glass"><div class="sec"><h3>Your tasks</h3><span class="muted">${open.length} open, ${overdue} overdue</span></div>
      <div class="chips">${filters.map(([v, l]) => `<button class="chip-btn" type="button" data-task-act="filter" data-f="${v}" aria-pressed="${taskFilter === v}">${l}</button>`).join('')}</div>
      <div style="margin-top:10px">${list.map((t) => `<div class="row"><button class="check" type="button" role="checkbox" aria-checked="${!!t.done}" data-task-act="toggle" data-id="${t.id}" aria-label="Mark ${esc(t.title)} as ${t.done ? 'not done' : 'done'}">${t.done ? I('check') : ''}</button><div><strong class="${t.done ? 'done-text' : ''}">${esc(t.title)}</strong><small>${esc(t.course || 'No course')}${t.due ? ', due ' + fmtDate(t.due) : ''}${t.due && !t.done && t.due < today ? ' (overdue)' : ''}</small></div><span class="chip ${t.priority === 3 ? 'bad' : t.priority === 2 ? 'warn' : 'line'}">${['', 'Low', 'Medium', 'High'][t.priority]}</span><button class="btn icon" type="button" data-task-act="delete" data-id="${t.id}" aria-label="Delete ${esc(t.title)}">${I('x')}</button></div>`).join('') || `<p class="empty">${tasks.length ? 'No tasks in this view.' : 'No tasks yet. Add your first one.'}</p>`}</div></section>
  </div>`;
}

// Spending charts (on the Money page)
function donut(parts) {
  const total = parts.reduce((acc, p) => acc + p[1], 0);
  const r = 38, c = 2 * Math.PI * r;
  if (!total) return `<svg viewBox="0 0 100 100" role="img" aria-label="No spending this month"><circle cx="50" cy="50" r="${r}" fill="none" stroke-width="14" style="stroke:var(--line)"/></svg>`;
  let off = 0;
  const segs = parts.filter((p) => p[1] > 0).map(([, v, col]) => { const len = v / total * c; const seg = `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${col}" stroke-width="14" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 50 50)"/>`; off += len; return seg; }).join('');
  return `<svg viewBox="0 0 100 100" role="img" aria-label="Spending by category this month"><circle cx="50" cy="50" r="${r}" fill="none" stroke-width="14" style="stroke:var(--line)"/>${segs}<text x="50" y="46" text-anchor="middle" font-size="7" style="fill:var(--muted)">Total</text><text x="50" y="58" text-anchor="middle" font-size="9" font-weight="800" style="fill:var(--ink)">${naira(total)}</text></svg>`;
}
function bars(months) {
  const max = Math.max(1, ...months.map((m) => m.v)), W = 320, H = 170, bw = 34, gap = 18, base = H - 26;
  const body = months.map((m, i) => { const h = m.v / max * (base - 18); const x = 12 + i * (bw + gap); return `<rect x="${x}" y="${(base - h).toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="8" style="fill:var(--accent);opacity:${m.current ? 1 : 0.42}"/><text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" font-size="11" style="fill:var(--muted)">${m.label}</text>` + (m.v ? `<text x="${x + bw / 2}" y="${(base - h - 6).toFixed(1)}" text-anchor="middle" font-size="9" style="fill:var(--ink)">₦${Math.round(m.v / 1000)}k</text>` : ''); }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Spending over the last six months">${body}</svg>`;
}
function expenseCharts() {
  const k = monthKey();
  const parts = CATS.map((c, i) => [c, expenses.filter((e) => (e.date || '').startsWith(k) && e.category === c).reduce((acc, e) => acc + Number(e.amount), 0), CHART_COLOURS[i]]);
  const now = new Date(), months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1), key = monthKey(d);
    months.push({ label: d.toLocaleDateString('en-GB', { month: 'short' }), v: expenses.filter((e) => (e.date || '').startsWith(key)).reduce((acc, e) => acc + Number(e.amount), 0), current: i === 0 });
  }
  const legend = parts.filter((p) => p[1] > 0).map(([l, v, c]) => `<li><span class="swatch-dot" style="background:${c}"></span>${esc(l)}<strong>${naira(v)}</strong></li>`).join('') || '<li class="muted">No spending yet this month</li>';
  return `<div class="grid2 chart-grid" style="margin-bottom:22px">
    <section class="glass"><h3 class="sec">This month by category</h3><div class="donut-wrap">${donut(parts)}<ul class="legend">${legend}</ul></div></section>
    <section class="glass"><h3 class="sec">Last six months</h3>${bars(months)}</section></div>`;
}
function renderMoney() { return expenseCharts() + renderMoneyBase(); }
function quickAccess() {
  return `<h2 class="sec" style="margin:34px 0 14px">Quick access</h2><div class="tiles">${[['money', 'wallet', 'Money'], ['materials', 'file', 'Materials'], ['tasks', 'check', 'Tasks'], ['classes', 'calendar', 'Classes'], ['notes', 'file', 'Notes'], ['gpa', 'calc', 'GPA'], ['settings', 'gear', 'Settings']].map(([v, ic, l]) => `<a class="glass tile" href="#${v}">${I(ic)}<span>${l}</span></a>`).join('')}<a class="glass tile" href="/learn.html">${I('book')}<span>Study guides</span></a></div>`;
}

// Sign in, sign up and account
const newPasswordForm = () => `<section class="glass" id="recoverySection"><h3>Choose a new password</h3>
  <form class="form" id="newPassForm" style="margin-top:14px">
    <div class="pass-row"><label>New password<input id="newPassword" name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="At least 8 characters"></label></div>
    <label>Confirm new password<input id="newPasswordConfirm" name="confirm" type="password" required minlength="8" autocomplete="new-password"></label>
    <div><button class="btn" id="btnSaveNewPassword" type="submit">Save new password</button></div>
  </form>
  <p class="note-line" id="authMsg" aria-live="polite"></p></section>`;

function renderLogin() {
  if (recovering) return newPasswordForm();
  if (me) return renderAccount();
  const signup = authMode === 'signup';
  return `<div class="grid2">
    <section class="glass" id="loginSection">
      <div class="seg" role="tablist" aria-label="Account">
        <button id="tabSignIn" type="button" role="tab" aria-selected="${!signup}" data-auth-act="mode" data-mode="signin">Sign in</button>
        <button id="tabSignUp" type="button" role="tab" aria-selected="${signup}" data-auth-act="mode" data-mode="signup">Create account</button>
      </div>
      ${configured() ? '' : '<p class="note-banner" id="notConnectedBanner" style="margin-top:14px">Accounts are not connected yet. The owner needs to add the Supabase details to turn them on.</p>'}
      <form class="form" id="authForm" style="margin-top:16px">
        ${signup ? `<label>Display name<input id="signupName" name="name" required maxlength="40" autocomplete="name" placeholder="How other students see you"></label>
        <label>University<input id="signupUniversity" name="university" maxlength="80" placeholder="For example, University of Ilorin"></label>
        <label>Department<input id="signupDepartment" name="department" maxlength="80" placeholder="For example, Computer Science"></label>` : ''}
        <label>Email<input id="authEmail" name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label>
        <div class="pass-row"><label>Password<input id="authPassword" name="password" type="password" required minlength="8" autocomplete="${signup ? 'new-password' : 'current-password'}" placeholder="At least 8 characters"></label><button class="btn ghost" id="btnShowPass" type="button" data-auth-act="show-pass">Show</button></div>
        ${signup ? `<label class="opt"><input id="ageCheck" type="checkbox" name="age" required> I am 16 or older</label>
        <label class="opt"><input id="termsCheck" type="checkbox" name="terms" required> I agree to the <a href="/terms.html">Terms</a> and <a href="/privacy.html">Privacy policy</a></label>` : ''}
        <div><button class="btn" id="btnAuthSubmit" type="submit">${signup ? 'Create account' : 'Sign in'}</button></div>
      </form>
      <p class="note-line" id="authMsg" aria-live="polite"></p>
      <div class="actions" style="margin-top:10px">
        <button class="btn quiet" id="btnForgot" type="button" data-auth-act="reset">Forgot password?</button>
        <button class="btn quiet" id="btnResend" type="button" data-auth-act="resend">Resend confirmation email</button>
        <button class="btn quiet" id="btnGuest" type="button" data-auth-act="guest">Continue without an account</button>
      </div>
    </section>
    <section class="glass" id="whySection"><h3 class="sec">Why create an account?</h3>
      <ul><li>Find students who choose to be visible, and send them a connection request.</li><li>Once they accept, message each other in Discover.</li><li>Keep your profile, university and interests in one place.</li></ul>
      <p class="note-line">We ask only for what these features need. Read our <a href="/privacy.html">privacy policy</a> before you sign up.</p>
    </section>
  </div>`;
}
function renderAccount() {
  const p = myProfile || {};
  return `<div class="grid2">
    <section class="glass" id="profileSection"><h3 class="sec">Your profile</h3>
      <form class="form" id="accountForm">
        <label>Display name<input id="profileName" name="display_name" required maxlength="40" value="${esc(p.display_name || '')}"></label>
        <label>University<input id="profileUniversity" name="university" maxlength="80" value="${esc(p.university || '')}"></label>
        <label>Department<input id="profileDepartment" name="department" maxlength="80" value="${esc(p.department || '')}"></label>
        <label>Interests<input id="profileInterests" name="interests" maxlength="200" value="${esc((p.interests || []).join(', '))}" placeholder="Coding, Football, Anime"></label>
        <label class="opt"><input id="profileDiscoverable" type="checkbox" name="discoverable" ${p.discoverable ? 'checked' : ''}> Show my profile to other students in Discover</label>
        <div><button class="btn" id="btnSaveProfile" type="submit">Save profile</button></div>
      </form></section>
    <section class="glass" id="accountSection"><h3 class="sec">Account</h3>
      <p class="muted">Signed in as ${esc(me.email)}.</p>
      <div class="actions" style="margin-top:14px"><button class="btn quiet" id="btnSignOut" type="button" data-auth-act="signout">Sign out</button><button class="btn danger" id="btnDeleteAccount" type="button" data-auth-act="delete">Delete account</button></div>
      <p class="note-line">Deleting your account removes your profile, connections, messages and server-side data.</p>
    </section></div>`;
}

// Discover, requests, connections, profiles and messages
let connections = [], chatUnread = {}, chatPreview = {}, chatMessages = [], chatWith = null, chatTimer = null, viewPerson = null;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cleanText = (t) => String(t || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, 1000);
const dayLabel = (d) => {
  const now = new Date(), yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
const clockOf = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const initialOf = (name) => (String(name || '?').trim().charAt(0) || '?').toUpperCase();
const schoolOf = (p) => [p.university, p.department].filter(Boolean).join(', ') || 'Student';

function relationOf(id) {
  if (connections.some((c) => c.partner_id === id && c.status === 'accepted')) return 'accepted';
  if (requestRows.some((r) => r.requester_id === id)) return 'received';
  if (connMap[id] === 'pending') return 'sent';
  if (connMap[id] === 'declined') return 'declined';
  return 'none';
}
function personOf(id) {
  const c = connections.find((x) => x.partner_id === id);
  if (c) return { display_name: c.display_name, university: c.university, department: c.department, interests: [] };
  const p = discoverRows.find((x) => x.id === id);
  if (p) return { display_name: p.display_name, university: p.university, department: p.department, interests: p.interests || [] };
  return { display_name: 'Student', university: '', department: '', interests: [] };
}
function requestRowHtml(x) {
  const name = requestNames[x.requester_id] || 'A student';
  return `<div class="row"><span class="avatar">${esc(initialOf(name))}</span><div><strong>${esc(name)}</strong><small>wants to connect</small></div><button class="btn" type="button" data-discover-act="accept" data-id="${x.id}">Accept</button><button class="btn quiet" type="button" data-discover-act="decline" data-id="${x.id}">Decline</button></div>`;
}

function renderDiscover() {
  if (!configured()) return notice('Discover needs accounts, and accounts are not connected yet.');
  if (!me) return `<section class="glass" id="discoverSignIn"><h3 class="sec">Sign in to find students</h3><p class="muted">Create an account to see students who chose to be visible, connect with them and message them.</p><div class="actions" style="margin-top:14px"><a class="btn" id="btnDiscoverSignIn" href="#login">Sign in or create an account</a></div></section>`;
  return `<div class="grid2">
    <section class="glass" id="requestsSection"><h3 class="sec">Requests for you</h3><div id="requestList"><p class="muted">Loading.</p></div></section>
    <section class="glass" id="connectionsSection"><div class="sec"><h3>Your connections</h3><span class="muted" id="connectionCount"></span></div><div id="connectionList"><p class="muted">Loading.</p></div></section>
  </div>
  <section class="glass" id="studentsSection" style="margin-top:18px"><div class="sec"><h3>Students you might connect with</h3><span class="muted" id="discoverCount"></span></div>
    <label class="search-field"><span class="sr-only">Search students</span>${I('search')}<input id="discoverSearch" type="search" placeholder="Search by name, university, department or interest"></label>
    <div id="discoverList" style="margin-top:8px"><p class="muted">Loading.</p></div>
  </section>
  <section class="glass" id="visibilitySection" style="margin-top:18px"><h3 class="sec">Visibility</h3><p class="muted">Only students who switch on "Show my profile" appear here. Email addresses and contact details are never shown.</p><div class="actions" style="margin-top:14px"><a class="btn quiet" id="btnEditProfile" href="#login">Edit your profile</a></div></section>`;
}

function profileActions(rel) {
  if (rel === 'accepted') return `<button class="paper-btn" id="btnPersonSend" type="button" data-profile-act="chat" aria-label="Send message">${I('send')}</button>`;
  if (rel === 'received') {
    const r = requestRows.find((x) => x.requester_id === viewPerson);
    return r ? `<button class="btn" id="btnPersonAccept" type="button" data-discover-act="accept" data-id="${r.id}">Accept</button><button class="btn quiet" id="btnPersonDecline" type="button" data-discover-act="decline" data-id="${r.id}">Decline</button>` : '';
  }
  if (rel === 'sent') return '<span class="chip line" id="personRequestSent">Request sent</span>';
  if (rel === 'declined') return '';
  return `<button class="btn" id="btnPersonConnect" type="button" data-discover-act="connect" data-id="${viewPerson}">${I('plus')}Connect</button>`;
}
function renderPersonProfile() {
  if (!configured()) return notice('Profiles need accounts, and accounts are not connected yet.');
  if (!me) return `<section class="glass"><h3 class="sec">Sign in to view profiles</h3><div class="actions" style="margin-top:14px"><a class="btn" href="#login">Sign in or create an account</a></div></section>`;
  if (!UUID_RE.test(viewPerson || '')) return `<section class="glass"><p class="muted">Choose a student in Discover to see their profile.</p><div class="actions" style="margin-top:14px"><a class="btn quiet" href="#discover">Back to Discover</a></div></section>`;
  const p = personOf(viewPerson), rel = relationOf(viewPerson);
  return `<section class="glass profile-card" id="personCard">
    <div class="person-top">
      <span class="avatar big-avatar" id="personAvatar">${esc(initialOf(p.display_name))}</span>
      ${rel === 'accepted' ? `<button class="icon-round" id="btnPersonMessages" type="button" data-profile-act="chat" aria-label="Open messages with ${esc(p.display_name || 'this student')}">${I('msg')}</button>` : ''}
    </div>
    <h2 id="personName">${esc(p.display_name || 'Student')}</h2>
    <p class="muted" id="personSchool">${esc(schoolOf(p))}</p>
    ${p.interests.length ? `<div class="chips" style="margin-top:10px">${p.interests.map((i) => `<span class="chip line">${esc(i)}</span>`).join('')}</div>` : ''}
    <div class="person-actions" id="personActions">${profileActions(rel)}</div>
    <div class="actions" style="margin-top:16px"><button class="btn quiet" id="btnPersonBlock" type="button" data-discover-act="block" data-id="${viewPerson}">Block</button><button class="btn quiet" id="btnPersonReport" type="button" data-discover-act="report" data-id="${viewPerson}">Report</button><a class="btn quiet" id="btnPersonBack" href="#discover">Back</a></div>
  </section>`;
}

function renderMessages() {
  if (!configured()) return notice('Messages need accounts, and accounts are not connected yet.');
  if (!me) return `<section class="glass" id="messagesSignIn"><h3 class="sec">Sign in to message</h3><p class="muted">Sign in to see your chats with the students you are connected with.</p><div class="actions" style="margin-top:14px"><a class="btn" id="btnMessagesSignIn" href="#login">Sign in or create an account</a></div></section>`;
  return `<div class="msg-app" id="msgApp" data-open="${chatWith ? 1 : 0}">
    <section class="glass inbox" id="inboxPane">
      <div class="sec"><h3>Messages</h3><span class="muted" id="inboxCount"></span></div>
      <div id="requestsStrip"></div>
      <div id="inboxList"><p class="muted">Loading.</p></div>
    </section>
    <section class="glass thread-pane" id="chatSection" ${chatWith ? '' : 'hidden'}>
      <div class="thread-head" id="chatHead"></div>
      <div class="thread" id="chatThread" aria-live="polite"></div>
      <form class="composer" id="chatForm"><label class="sr-only" for="chatBody">Message</label><textarea id="chatBody" name="body" rows="1" maxlength="1000" required placeholder="Message"></textarea><button class="send-btn" id="btnSendChat" type="submit" aria-label="Send message">${I('send')}</button></form>
    </section>
  </div>
  <p class="note-line" id="messagesNote">Text only. Only students you are connected with can message you. You can report or block anyone at any time.</p>`;
}

async function loadConnections() {
  const [c, m] = await Promise.all([
    sb.rpc('my_connections'),
    sb.from('messages').select('sender_id, recipient_id, body, created_at, read_at').or(`sender_id.eq.${me.id},recipient_id.eq.${me.id}`).order('created_at', { ascending: false }).limit(500)
  ]);
  if (c.error) throw c.error;
  if (m.error) throw m.error;
  connections = c.data || [];
  chatUnread = {}; chatPreview = {};
  (m.data || []).forEach((x) => {
    const mine = x.sender_id === me.id;
    const partner = mine ? x.recipient_id : x.sender_id;
    if (!chatPreview[partner]) chatPreview[partner] = { body: x.body, created_at: x.created_at, mine };
    if (!mine && !x.read_at) chatUnread[x.sender_id] = (chatUnread[x.sender_id] || 0) + 1;
  });
  paintConnections(); paintInbox();
}
function paintConnections() {
  const el = $('#connectionList'); if (!el) return;
  const accepted = connections.filter((c) => c.status === 'accepted');
  const count = $('#connectionCount'); if (count) count.textContent = accepted.length ? accepted.length + ' connected' : '';
  el.innerHTML = accepted.length ? accepted.map((c) => `<div class="row"><span class="avatar">${esc(initialOf(c.display_name))}</span><div><strong>${esc(c.display_name || 'Student')}</strong><small>${esc(schoolOf(c))}</small></div><button class="paper-btn sm" type="button" data-discover-act="open-chat" data-id="${c.partner_id}" aria-label="Send message">${I('send')}</button></div>`).join('')
    : '<p class="empty">No connections yet. Send a request to a student below. When they accept, you can message them here.</p>';
}
function paintInbox() {
  const el = $('#inboxList'); if (!el) return;
  const accepted = connections.filter((c) => c.status === 'accepted');
  const count = $('#inboxCount'); if (count) count.textContent = accepted.length ? accepted.length + (accepted.length === 1 ? ' chat' : ' chats') : '';
  el.innerHTML = accepted.length ? accepted.map((c) => {
    const pv = chatPreview[c.partner_id], n = chatUnread[c.partner_id] || 0;
    const preview = pv ? (pv.mine ? 'You: ' : '') + pv.body : 'Say hello';
    const when = pv ? (dayLabel(new Date(pv.created_at)) === 'Today' ? clockOf(pv.created_at) : dayLabel(new Date(pv.created_at))) : '';
    return `<button class="inbox-row ${n ? 'unread' : ''} ${c.partner_id === chatWith ? 'on' : ''}" type="button" data-chat-act="open" data-id="${c.partner_id}"><span class="avatar">${esc(initialOf(c.display_name))}</span><span class="inbox-text"><strong>${esc(c.display_name || 'Student')}</strong><small>${esc(preview.slice(0, 70))}</small></span><span class="inbox-meta"><small>${when}</small>${n ? `<span class="unread-dot">${n > 99 ? '99+' : n}</span>` : ''}</span></button>`;
  }).join('') : `<div class="empty-note">${I('msg')}<h3>No chats yet</h3><p class="muted">Connect with a student in Discover. Once they accept, your chat appears here.</p></div>`;
}
function paintShell() {
  const app = $('#msgApp'); if (app) app.dataset.open = chatWith ? '1' : '0';
  const section = $('#chatSection'); if (section) section.hidden = !chatWith;
}
function paintChatHead() {
  const el = $('#chatHead'); if (!el) return;
  const p = connections.find((c) => c.partner_id === chatWith) || { display_name: 'Student' };
  el.innerHTML = `<button class="btn icon back-btn" id="btnCloseChat" type="button" data-chat-act="close" aria-label="Back to chats">${I('arrow')}</button><span class="avatar">${esc(initialOf(p.display_name))}</span><div><strong>${esc(p.display_name || 'Student')}</strong><small>${esc(schoolOf(p))}</small></div><button class="btn quiet" id="btnReportChat" type="button" data-chat-act="report">Report</button><button class="btn quiet" id="btnBlockChat" type="button" data-chat-act="block">Block</button>`;
}
function paintThread() {
  const el = $('#chatThread'); if (!el) return;
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
  let lastDay = '';
  el.innerHTML = chatMessages.length ? chatMessages.map((m) => {
    const d = new Date(m.created_at), key = d.toDateString();
    const sep = key !== lastDay ? `<div class="day-sep"><span>${dayLabel(d)}</span></div>` : '';
    lastDay = key;
    const mine = m.sender_id === me.id;
    return `${sep}<div class="bubble-row ${mine ? 'mine' : ''}"><div class="bubble">${esc(m.body)}<span class="bubble-time">${clockOf(m.created_at)}</span></div>${mine ? `<button class="bubble-del" type="button" data-chat-act="delete-msg" data-id="${m.id}" aria-label="Delete this message">${I('x')}</button>` : ''}</div>`;
  }).join('') : `<div class="empty-note">${I('send')}<h3>Say hello</h3><p class="muted">Messages are text only. Report anything that feels wrong.</p></div>`;
  if (nearBottom || el.scrollTop === 0) el.scrollTop = el.scrollHeight;
}
async function loadThread() {
  if (!sb || !me || !UUID_RE.test(chatWith || '')) return;
  const { data, error } = await sb.from('messages').select('id, sender_id, body, created_at, read_at')
    .or(`and(sender_id.eq.${me.id},recipient_id.eq.${chatWith}),and(sender_id.eq.${chatWith},recipient_id.eq.${me.id})`)
    .order('created_at', { ascending: true }).limit(200);
  if (error) throw error;
  chatMessages = data || [];
  const { error: readErr } = await sb.from('messages').update({ read_at: new Date().toISOString() })
    .eq('recipient_id', me.id).eq('sender_id', chatWith).is('read_at', null);
  if (readErr) throw readErr;
  paintThread();
}
async function openChat(id) {
  if (!sb || !me || !UUID_RE.test(id || '')) return;
  if (!connections.some((c) => c.partner_id === id)) await loadConnections();
  if (!connections.some((c) => c.partner_id === id && c.status === 'accepted')) {
    return toast('You can message a student once they accept your connection request.');
  }
  chatWith = id;
  if (current !== 'messages') { location.hash = '#messages'; return; }
  paintShell(); paintChatHead(); paintInbox();
  try { await loadThread(); } catch (err) { handleError(err); }
  startChatPolling();
}
function closeChat() {
  chatWith = null; chatMessages = [];
  paintShell(); paintInbox(); startChatPolling();
}
async function sendChat(text) {
  const body = cleanText(text);
  if (!body) return toast('Write a message first.');
  if (!sb || !me || !UUID_RE.test(chatWith || '')) return toast('Choose a chat first.');
  const { error } = await sb.from('messages').insert({ sender_id: me.id, recipient_id: chatWith, body });
  if (error) throw error;
  const box = $('#chatBody'); if (box) { box.value = ''; box.style.height = 'auto'; }
  await loadThread();
  await loadConnections();
}
async function chatAction(a, b) {
  if (!sb || !me) return;
  try {
    if (a === 'open') {
      chatWith = b.dataset.id;
      paintShell(); paintChatHead(); paintInbox();
      await loadThread();
      return;
    }
    if (a === 'close') return closeChat();
    if (a === 'delete-msg') {
      const { error } = await sb.from('messages').delete().eq('id', b.dataset.id);
      if (error) throw error;
      return loadThread();
    }
    if (a === 'block') {
      if (!confirm('Block this student? You will no longer be able to message each other.')) return;
      const { error } = await sb.from('blocks').insert({ blocker_id: me.id, blocked_id: chatWith });
      if (error) throw error;
      toast('Student blocked.'); closeChat(); return loadPeople();
    }
    if (a === 'report') {
      const reason = (prompt('Why are you reporting this student? Describe what happened.') || '').trim();
      if (!reason) return;
      const { error } = await sb.from('reports').insert({ reporter_id: me.id, reported_id: chatWith, reason: reason.slice(0, 500) });
      if (error) throw error;
      toast('Thank you. We will review this report.');
    }
  } catch (err) { handleError(err); }
}
function startChatPolling() {
  clearInterval(chatTimer); chatTimer = null;
  if (current === 'messages') chatTimer = setInterval(() => { refreshChat().catch(handleError); }, 8000);
}
async function refreshChat() {
  if (!sb || !me || current !== 'messages') return;
  await loadRequests();
  await loadConnections();
  if (chatWith && !connections.some((c) => c.partner_id === chatWith && c.status === 'accepted')) { closeChat(); return; }
  paintShell(); paintChatHead();
  if (chatWith) await loadThread();
}

async function loadRequests() {
  const { data, error } = await sb.from('connections').select('id, requester_id').eq('addressee_id', me.id).eq('status', 'pending');
  if (error) throw error;
  requestRows = data || [];
  const ids = [...new Set(requestRows.map((x) => x.requester_id))];
  requestNames = {};
  if (ids.length) {
    const r = await sb.from('public_profiles').select('id, display_name').in('id', ids);
    if (r.error) throw r.error;
    (r.data || []).forEach((p) => { requestNames[p.id] = p.display_name; });
  }
  paintRequests();
}
async function loadPeople() {
  if (!sb || !me) return;
  try {
    const [d, c] = await Promise.all([
      sb.rpc('discover_students', { max_results: 30 }),
      sb.from('connections').select('requester_id, addressee_id, status')
    ]);
    const firstError = d.error || c.error;
    if (firstError) handleError(firstError);
    discoverRows = d.data || [];
    connMap = {};
    (c.data || []).forEach((x) => { connMap[x.requester_id === me.id ? x.addressee_id : x.requester_id] = x.status; });
    await loadRequests();
    paintDiscover();
    await loadConnections();
    if (current === 'profile') render();
  } catch (err) { handleError(err); }
}
function paintRequests() {
  const list = $('#requestList');
  if (list) list.innerHTML = requestRows.length ? requestRows.map(requestRowHtml).join('') : '<p class="empty">No requests right now.</p>';
  const strip = $('#requestsStrip');
  if (strip) strip.innerHTML = requestRows.length ? `<p class="strip-title">Requests</p>${requestRows.map(requestRowHtml).join('')}` : '';
}
function paintDiscover() {
  const el = $('#discoverList'); if (!el) return;
  const q = ($('#discoverSearch') ? $('#discoverSearch').value : '').trim().toLowerCase();
  const rows = discoverRows.filter((p) => !q || [p.display_name, p.university, p.department, ...(p.interests || [])].join(' ').toLowerCase().includes(q));
  const count = $('#discoverCount'); if (count) count.textContent = rows.length + (rows.length === 1 ? ' student' : ' students');
  el.innerHTML = rows.length ? rows.map((p) => {
    const rel = relationOf(p.id);
    const action = rel === 'accepted' ? `<button class="paper-btn sm" type="button" data-discover-act="open-chat" data-id="${p.id}" aria-label="Send message">${I('send')}</button>`
      : rel === 'received' ? `<button class="btn" type="button" data-discover-act="accept" data-id="${requestRows.find((x) => x.requester_id === p.id).id}">Accept</button>`
      : rel === 'sent' ? '<span class="chip line">Request sent</span>'
      : rel === 'declined' ? ''
      : `<button class="btn" type="button" data-discover-act="connect" data-id="${p.id}">${I('plus')}Connect</button>`;
    return `<div class="row"><button class="person-link" type="button" data-discover-act="view" data-id="${p.id}" aria-label="View profile"><span class="avatar">${esc(initialOf(p.display_name))}</span><span><strong>${esc(p.display_name || 'Student')}</strong><small>${esc(schoolOf(p))}</small><span class="chips" style="margin-top:6px">${(p.interests || []).map((i) => `<span class="chip line">${esc(i)}</span>`).join('')}</span></span></button><div class="stack-sm">${action}<button class="btn icon" type="button" data-discover-act="block" data-id="${p.id}" aria-label="Block this student">Block</button><button class="btn icon" type="button" data-discover-act="report" data-id="${p.id}" aria-label="Report this profile">Report</button></div></div>`;
  }).join('') : `<p class="empty">${discoverRows.length ? 'No students match your search.' : 'No students are visible yet. Switch on "Show my profile" in your account to be the first.'}</p>`;
}
async function discoverAction(a, b) {
  if (!sb || !me) return;
  const id = b.dataset.id;
  if (a === 'view') { viewPerson = id; location.hash = '#profile'; return; }
  if (a === 'open-chat') return openChat(id);
  try {
    if (a === 'connect') {
      const { error } = await sb.from('connections').insert({ requester_id: me.id, addressee_id: id });
      if (error) throw error;
      toast('Request sent. You can message them once they accept.'); return loadPeople();
    }
    if (a === 'accept' || a === 'decline') {
      const { error } = await sb.from('connections').update({ status: a === 'accept' ? 'accepted' : 'declined' }).eq('id', id);
      if (error) throw error;
      if (a === 'accept') toast('Connected. You can message them now.');
      return loadPeople();
    }
    if (a === 'block') {
      if (!confirm('Block this student? You will not see each other in Discover.')) return;
      const { error } = await sb.from('blocks').insert({ blocker_id: me.id, blocked_id: id });
      if (error) throw error;
      toast('Student blocked.');
      if (current === 'profile') { viewPerson = null; location.hash = '#discover'; return; }
      return loadPeople();
    }
    if (a === 'report') {
      const reason = (prompt('Why are you reporting this profile? Describe it briefly.') || '').trim();
      if (!reason) return;
      const { error } = await sb.from('reports').insert({ reporter_id: me.id, reported_id: id, reason: reason.slice(0, 500) });
      if (error) throw error;
      toast('Thank you. We will review this report.');
    }
  } catch (err) { handleError(err); }
}
async function profileAction(a) {
  if (a === 'chat') return openChat(viewPerson);
}
function authAction(a, b) {
  if (a === 'mode') { authMode = b.dataset.mode; return render(); }
  if (a === 'show-pass') {
    const inp = $('#authPassword'); if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
    b.textContent = inp.type === 'password' ? 'Show' : 'Hide';
    return;
  }
  if (a === 'reset') return resetPassword();
  if (a === 'resend') return resendConfirmation();
  if (a === 'guest') { localStorage.setItem('studenthubGuest', 'true'); location.hash = '#home'; route(); return; }
  if (a === 'signout') return signOut();
  if (a === 'delete') return deleteAccount();
}
// The account button in the top-right corner opens the account page
document.addEventListener('click', (e) => {
  if (e.target.closest('#avatarBtn')) { location.hash = '#login'; return; }
  const b = e.target.closest('[data-auth-act],[data-task-act],[data-discover-act],[data-chat-act],[data-profile-act]');
  if (!b) return;
  if (b.dataset.authAct) return authAction(b.dataset.authAct, b);
  if (b.dataset.taskAct) return taskAction(b.dataset.taskAct, b);
  if (b.dataset.chatAct) return chatAction(b.dataset.chatAct, b);
  if (b.dataset.profileAct) return profileAction(b.dataset.profileAct);
  return discoverAction(b.dataset.discoverAct, b);
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'discoverSearch') paintDiscover();
  if (e.target.id === 'chatBody') { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px'; }
});

applyTheme();
buildNav();
if (localStorage.getItem('studenthubOnboardingComplete') !== 'true') { onb.hidden = false; showStep(0); }
window.addEventListener('hashchange', route);
setInterval(checkReminders, 30000);
route();
checkReminders();
initAccounts();
})();

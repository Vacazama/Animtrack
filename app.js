// ══════════════════════════════════════════════
//  AnimTrack v2 — app.js
// ══════════════════════════════════════════════

// ── State ──────────────────────────────────────
let episodes   = JSON.parse(localStorage.getItem('at2_episodes')   || '[]');
let tasks      = JSON.parse(localStorage.getItem('at2_tasks')      || '[]');
let milestones = JSON.parse(localStorage.getItem('at2_milestones') || '[]');
let members    = JSON.parse(localStorage.getItem('at2_members')    || '[]');

function save() {
  localStorage.setItem('at2_episodes',   JSON.stringify(episodes));
  localStorage.setItem('at2_tasks',      JSON.stringify(tasks));
  localStorage.setItem('at2_milestones', JSON.stringify(milestones));
  localStorage.setItem('at2_members',    JSON.stringify(members));
}

// ── Color map per task type ─────────────────────
const TYPE_COLOR = {
  animasi:     '#1D9E75',
  modeling:    '#7F77DD',
  rendering:   '#D85A30',
  compositing: '#BA7517',
  editing:     '#185FA5',
  lainnya:     '#888780',
};

const TYPE_LABEL = {
  animasi:'Animasi', modeling:'Modeling', rendering:'Rendering',
  compositing:'Compositing', editing:'Editing', lainnya:'Lainnya',
};

const STATUS_LABEL = { todo:'Belum mulai', wip:'Dikerjakan', review:'Review', done:'Selesai' };
const STATUS_BADGE = { todo:'badge-todo', wip:'badge-wip', review:'badge-review', done:'badge-done' };

const MILE_LABEL = { delivery:'Delivery', review:'Client Review', signoff:'Sign-off', internal:'Internal' };

function fmtDate(d) {
  if (!d) return '';
  const [y,m,day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
}

// ── Tab ────────────────────────────────────────
function switchTab(name, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  const titles = { dashboard:'Dashboard', gantt:'Gantt Chart', episodes:'Episode', tasks:'Task', milestones:'Milestone', team:'Tim' };
  document.getElementById('topbar-title').textContent = titles[name] || name;
  if (name === 'dashboard')  renderDashboard();
  if (name === 'gantt')      { syncGanttFilter(); renderGantt(); }
  if (name === 'tasks')      { syncEpSelects(); renderTasks(); }
  if (name === 'milestones') { syncMileEpSelect(); renderMilestones(); }
  if (name === 'team')       renderTeam();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── Episode ────────────────────────────────────
function addEpisode() {
  const name  = document.getElementById('ep-name').value.trim();
  const color = document.getElementById('ep-color').value;
  const start = document.getElementById('ep-start').value;
  const dead  = document.getElementById('ep-dead').value;
  const desc  = document.getElementById('ep-desc').value.trim();
  if (!name) { alert('Nama episode wajib diisi!'); return; }
  episodes.push({ id: Date.now(), name, color, start, dead, desc });
  save();
  ['ep-name','ep-start','ep-dead','ep-desc'].forEach(id => document.getElementById(id).value = '');
  renderEpisodes();
  syncEpSelects();
  syncGanttFilter();
}

function deleteEpisode(id) {
  if (!confirm('Hapus episode ini? Task & milestone terkait juga dihapus.')) return;
  episodes   = episodes.filter(e => e.id !== id);
  tasks      = tasks.filter(t => t.epId !== id);
  milestones = milestones.filter(m => m.epId !== id);
  save();
  renderEpisodes();
  syncEpSelects();
}

function renderEpisodes() {
  const el = document.getElementById('ep-list');
  if (!episodes.length) { el.innerHTML = '<div class="empty-state">Belum ada episode.</div>'; return; }
  el.innerHTML = episodes.map(ep => {
    const epT = tasks.filter(t => t.epId === ep.id);
    const done = epT.filter(t => t.status === 'done').length;
    const pct  = epT.length ? Math.round(done / epT.length * 100) : 0;
    return `<div class="ep-item">
      <div class="ep-color-dot" style="background:${ep.color};margin-top:6px"></div>
      <div style="flex:1">
        <div class="ep-title">${ep.name}</div>
        <div class="ep-meta">
          ${ep.start ? fmtDate(ep.start) + ' → ' : ''}${ep.dead ? fmtDate(ep.dead) : 'Belum ada deadline'}
          ${ep.desc ? ' · ' + ep.desc.substring(0,50) + (ep.desc.length>50?'…':'') : ''}
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${ep.color}"></div></div>
          <span style="font-size:12px;color:var(--text-muted)">${pct}% · ${done}/${epT.length} task</span>
        </div>
      </div>
      <button class="btn danger" onclick="deleteEpisode(${ep.id})" title="Hapus">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
      </button>
    </div>`;
  }).join('');
}

// ── Task ───────────────────────────────────────
function addTask() {
  const name   = document.getElementById('t-name').value.trim();
  const type   = document.getElementById('t-type').value;
  const epId   = parseInt(document.getElementById('t-ep').value) || 0;
  const div    = document.getElementById('t-div').value;
  const start  = document.getElementById('t-start').value;
  const dead   = document.getElementById('t-dead').value;
  const pic    = document.getElementById('t-pic').value.trim();
  const status = document.getElementById('t-status').value;
  if (!name)  { alert('Nama task wajib diisi!'); return; }
  if (!start) { alert('Tanggal mulai wajib diisi!'); return; }
  if (!dead)  { alert('Tanggal selesai wajib diisi!'); return; }
  if (start > dead) { alert('Tanggal mulai tidak boleh lebih dari tanggal selesai!'); return; }
  tasks.push({ id: Date.now(), name, type, epId, div, start, dead, pic, status });
  save();
  ['t-name','t-pic','t-start','t-dead'].forEach(id => document.getElementById(id).value = '');
  renderTasks();
  renderEpisodes();
}

function updateStatus(id, val) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.status = val; save(); }
  renderTasks(); renderEpisodes(); renderDashboard();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  renderTasks(); renderEpisodes(); renderDashboard();
}

function renderTasks() {
  const fEp  = document.getElementById('f-ep')?.value;
  const fTyp = document.getElementById('f-type')?.value;
  const fDiv = document.getElementById('f-div')?.value;
  const fSt  = document.getElementById('f-status')?.value;
  let list = tasks.filter(t => {
    if (fEp  && t.epId !== parseInt(fEp)) return false;
    if (fTyp && t.type !== fTyp)          return false;
    if (fDiv && t.div  !== fDiv)          return false;
    if (fSt  && t.status !== fSt)         return false;
    return true;
  });
  const el = document.getElementById('task-list');
  if (!list.length) { el.innerHTML = '<div class="empty-state">Tidak ada task.</div>'; return; }
  el.innerHTML = list.map(t => {
    const ep = episodes.find(e => e.id === t.epId);
    const color = TYPE_COLOR[t.type] || TYPE_COLOR.lainnya;
    return `<div class="task-item type-${t.type} status-${t.status}" style="border-left-color:${color}">
      <div style="flex:1">
        <div class="task-name">${t.name}</div>
        <div class="task-meta">
          <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color};margin-right:4px;vertical-align:middle"></span>
          ${TYPE_LABEL[t.type] || 'Lainnya'} ·
          ${ep ? ep.name + ' · ' : ''}
          ${t.div === 'ilustrasi' ? 'Tim Ilustrasi' : 'Tim Editing'}
          ${t.pic ? ' · ' + t.pic : ''}
          ${t.start ? ' · ' + fmtDate(t.start) : ''} → ${fmtDate(t.dead)}
        </div>
      </div>
      <div class="task-controls">
        <select class="status-select" onchange="updateStatus(${t.id},this.value)">
          <option value="todo"   ${t.status==='todo'  ?'selected':''}>Belum mulai</option>
          <option value="wip"    ${t.status==='wip'   ?'selected':''}>Dikerjakan</option>
          <option value="review" ${t.status==='review'?'selected':''}>Review</option>
          <option value="done"   ${t.status==='done'  ?'selected':''}>Selesai</option>
        </select>
        <button class="btn danger sm" onclick="deleteTask(${t.id})" title="Hapus">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');
}

// ── Milestone ──────────────────────────────────
function addMilestone() {
  const name = document.getElementById('m-name').value.trim();
  const date = document.getElementById('m-date').value;
  const epId = parseInt(document.getElementById('m-ep').value) || 0;
  const type = document.getElementById('m-type').value;
  const note = document.getElementById('m-note').value.trim();
  if (!name) { alert('Nama milestone wajib diisi!'); return; }
  if (!date) { alert('Tanggal milestone wajib diisi!'); return; }
  milestones.push({ id: Date.now(), name, date, epId, type, note });
  save();
  ['m-name','m-date','m-note'].forEach(id => document.getElementById(id).value = '');
  renderMilestones();
}

function deleteMilestone(id) {
  milestones = milestones.filter(m => m.id !== id);
  save();
  renderMilestones();
}

function renderMilestones() {
  const el = document.getElementById('milestone-list');
  if (!milestones.length) { el.innerHTML = '<div class="empty-state">Belum ada milestone.</div>'; return; }
  const sorted = [...milestones].sort((a,b) => a.date.localeCompare(b.date));
  el.innerHTML = sorted.map(m => {
    const ep = episodes.find(e => e.id === m.epId);
    return `<div class="mile-item">
      <div class="mile-diamond">◆</div>
      <div style="flex:1">
        <div class="mile-title">${m.name}</div>
        <div class="mile-meta">
          📅 ${fmtDate(m.date)}
          ${ep ? ' · ' + ep.name : ''}
          ${m.note ? ' · ' + m.note : ''}
        </div>
      </div>
      <span class="mile-type">${MILE_LABEL[m.type]||m.type}</span>
      <button class="btn danger sm" onclick="deleteMilestone(${m.id})" title="Hapus">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
      </button>
    </div>`;
  }).join('');
}

// ── Team ───────────────────────────────────────
function addMember() {
  const name  = document.getElementById('mem-name').value.trim();
  const div   = document.getElementById('mem-div').value;
  const role  = document.getElementById('mem-role').value.trim();
  const email = document.getElementById('mem-email').value.trim();
  if (!name) { alert('Nama wajib diisi!'); return; }
  members.push({ id: Date.now(), name, div, role, email });
  save();
  ['mem-name','mem-role','mem-email'].forEach(id => document.getElementById(id).value = '');
  renderTeam();
}

function deleteMember(id) {
  members = members.filter(m => m.id !== id);
  save();
  renderTeam();
}

function renderTeam() {
  ['ilustrasi','editing'].forEach(div => {
    const el = document.getElementById('team-' + div);
    const list = members.filter(m => m.div === div);
    if (!list.length) { el.innerHTML = '<div class="empty-state">Belum ada anggota.</div>'; return; }
    el.innerHTML = list.map(m => {
      const taskCount = tasks.filter(t => t.pic && t.pic.toLowerCase() === m.name.toLowerCase()).length;
      return `<div class="member-card">
        <div class="member-avatar av-${div}">${initials(m.name)}</div>
        <div style="flex:1">
          <div class="member-name">${m.name}</div>
          <div class="member-role">${m.role || (div==='ilustrasi'?'Ilustrator':'Editor')} ${m.email ? '· '+m.email : ''}</div>
        </div>
        <span class="task-count">${taskCount} task</span>
        <button class="btn danger sm" onclick="deleteMember(${m.id})" title="Hapus">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </button>
      </div>`;
    }).join('');
  });
}

// ── GANTT CHART ENGINE ─────────────────────────
function syncGanttFilter() {
  const sel = document.getElementById('gantt-ep-filter');
  if (!sel) return;
  sel.innerHTML = '<option value="">Semua Episode</option>' +
    episodes.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
}

function renderGantt() {
  const wrapper = document.getElementById('gantt-wrapper');
  const zoom    = document.getElementById('gantt-zoom')?.value || 'month';
  const fEp     = document.getElementById('gantt-ep-filter')?.value;

  // Collect all dates
  let allDates = [];
  tasks.forEach(t => { if (t.start) allDates.push(new Date(t.start)); if (t.dead) allDates.push(new Date(t.dead)); });
  milestones.forEach(m => { if (m.date) allDates.push(new Date(m.date)); });
  episodes.forEach(e => { if (e.start) allDates.push(new Date(e.start)); if (e.dead) allDates.push(new Date(e.dead)); });

  if (!allDates.length) {
    wrapper.innerHTML = '<div class="empty-state" style="color:#888;padding:40px">Tambahkan task dengan tanggal mulai & selesai untuk melihat Gantt Chart.</div>';
    return;
  }

  const minD = new Date(Math.min(...allDates));
  const maxD = new Date(Math.max(...allDates));
  // pad 7 days each side
  minD.setDate(minD.getDate() - 7);
  maxD.setDate(maxD.getDate() + 14);

  const totalDays = Math.ceil((maxD - minD) / 86400000) + 1;
  const DAY_W = zoom === 'week' ? 28 : 18; // px per day

  function dayOffset(dateStr) {
    if (!dateStr) return 0;
    return Math.round((new Date(dateStr) - minD) / 86400000);
  }

  function dayWidth(startStr, endStr) {
    const s = new Date(startStr);
    const e = new Date(endStr);
    return Math.max(DAY_W, Math.round((e - s) / 86400000 + 1) * DAY_W);
  }

  // Build month + day header
  let months = [];
  let cur = new Date(minD.getFullYear(), minD.getMonth(), 1);
  while (cur <= maxD) {
    const y = cur.getFullYear(), mo = cur.getMonth();
    const startDay = Math.max(0, Math.round((new Date(y, mo, 1) - minD) / 86400000));
    const endDay   = Math.round((new Date(y, mo + 1, 0) - minD) / 86400000);
    const clampEnd = Math.min(endDay, totalDays - 1);
    const w = (clampEnd - startDay + 1) * DAY_W;
    if (w > 0) {
      months.push({ label: cur.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }), width: w });
    }
    cur.setMonth(cur.getMonth() + 1);
  }

  const monthsHtml = months.map(m =>
    `<div class="gantt-month" style="width:${m.width}px">${m.label}</div>`
  ).join('');

  const daysHtml = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(minD); d.setDate(minD.getDate() + i);
    const isToday = d.toDateString() === new Date().toDateString();
    return `<div class="gantt-day${isToday?' today':''}" style="width:${DAY_W}px">${d.getDate()}</div>`;
  }).join('');

  const trackW = totalDays * DAY_W;

  // Today line
  const todayOffset = Math.round((new Date() - minD) / 86400000);
  const todayLine = todayOffset >= 0 && todayOffset < totalDays
    ? `<div class="gantt-today-line" style="left:${todayOffset * DAY_W}px"></div>` : '';

  // Grid lines (every 7 days)
  let gridLines = '';
  for (let i = 0; i < totalDays; i += 7) {
    gridLines += `<div class="gantt-grid-line" style="left:${i*DAY_W}px"></div>`;
  }

  // Filter episodes
  let epList = episodes;
  if (fEp) epList = episodes.filter(e => e.id === parseInt(fEp));

  // Build rows
  let rowsHtml = '';

  epList.forEach(ep => {
    // Episode header bar
    const epStart = ep.start || (tasks.filter(t=>t.epId===ep.id&&t.start).sort((a,b)=>a.start.localeCompare(b.start))[0]?.start);
    const epEnd   = ep.dead  || (tasks.filter(t=>t.epId===ep.id&&t.dead).sort((a,b)=>b.dead.localeCompare(a.dead))[0]?.dead);

    let epBarHtml = '';
    if (epStart && epEnd) {
      const left = dayOffset(epStart) * DAY_W;
      const width = dayWidth(epStart, epEnd);
      epBarHtml = `<div class="gantt-ep-bar" style="left:${left}px;width:${width}px;background:${ep.color}"></div>`;
    }

    // Milestone diamonds for this episode
    const epMiles = milestones.filter(m => m.epId === ep.id);
    const mileHtml = epMiles.map(m => {
      const left = (dayOffset(m.date) * DAY_W) - 8;
      return `<div class="gantt-milestone" style="left:${left}px;background:#E24B4A" title="${m.name} — ${fmtDate(m.date)}"></div>
              <div class="gantt-milestone-label" style="left:${left+16}px">${m.name}</div>`;
    }).join('');

    rowsHtml += `
      <div class="gantt-ep-group">
        <div class="gantt-ep-header">
          <div class="gantt-ep-label">
            <div class="ep-dot" style="background:${ep.color}"></div>
            <span class="gantt-ep-name">${ep.name}</span>
          </div>
          <div class="gantt-ep-track" style="width:${trackW}px">
            ${todayLine}${gridLines}${epBarHtml}${mileHtml}
          </div>
        </div>`;

    // Task rows for this episode
    const epTasks = tasks.filter(t => t.epId === ep.id);
    epTasks.forEach(t => {
      if (!t.start || !t.dead) return;
      const left  = dayOffset(t.start) * DAY_W;
      const width = dayWidth(t.start, t.dead);
      const color = TYPE_COLOR[t.type] || TYPE_COLOR.lainnya;
      const striped = t.status === 'wip' ? ' striped' : '';
      const opacity = t.status === 'done' ? '0.55' : '1';

      rowsHtml += `
        <div class="gantt-task-row">
          <div class="gantt-task-label">
            <div style="width:8px;height:8px;border-radius:2px;background:${color};flex-shrink:0"></div>
            <span class="gantt-task-name" title="${t.name}">${t.name}</span>
          </div>
          <div class="gantt-task-track" style="width:${trackW}px">
            ${todayLine}${gridLines}
            <div class="gantt-bar${striped}" style="left:${left}px;width:${width}px;background:${color};opacity:${opacity}" title="${t.name} (${fmtDate(t.start)} → ${fmtDate(t.dead)})">
              <span class="gantt-bar-label">${t.name}</span>
            </div>
          </div>
        </div>`;
    });

    rowsHtml += `</div>`;
  });

  // Milestones not tied to an episode
  const looseM = milestones.filter(m => !m.epId);
  if (looseM.length) {
    rowsHtml += `<div class="gantt-ep-group">
      <div class="gantt-ep-header">
        <div class="gantt-ep-label"><span class="gantt-ep-name" style="color:#F09595">◆ Milestone Umum</span></div>
        <div class="gantt-ep-track" style="width:${trackW}px">${todayLine}${gridLines}
          ${looseM.map(m => {
            const left = (dayOffset(m.date) * DAY_W) - 8;
            return `<div class="gantt-milestone" style="left:${left}px;background:#E24B4A" title="${m.name}"></div>
                    <div class="gantt-milestone-label" style="left:${left+16}px">${m.name}</div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }

  if (!rowsHtml) {
    wrapper.innerHTML = '<div class="empty-state" style="color:#888;padding:40px">Belum ada data untuk ditampilkan.</div>';
    return;
  }

  wrapper.innerHTML = `
    <div class="gantt-scroll">
      <div style="display:flex;min-width:${220+trackW}px">
        <div style="width:${220+trackW}px">
          <div class="gantt-head">
            <div class="gantt-head-row">
              <div class="gantt-label-col">Episode / Task</div>
              <div class="gantt-dates" style="width:${trackW}px">${monthsHtml}</div>
            </div>
            <div class="gantt-days-row">
              <div class="gantt-label-col" style="padding:4px 14px"></div>
              <div style="display:flex;width:${trackW}px">${daysHtml}</div>
            </div>
          </div>
          ${rowsHtml}
        </div>
      </div>
    </div>`;
}

// ── Dashboard ──────────────────────────────────
function renderDashboard() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.status === 'done').length;
  const pct   = total ? Math.round(done / total * 100) : 0;

  document.getElementById('s-ep').textContent   = episodes.length;
  document.getElementById('s-task').textContent = total;
  document.getElementById('s-done').textContent = done;
  document.getElementById('s-mile').textContent = milestones.length;

  // Progress per episode
  const epEl = document.getElementById('ep-progress-list');
  if (!episodes.length) {
    epEl.innerHTML = '<div class="empty-state">Belum ada episode.</div>';
  } else {
    epEl.innerHTML = episodes.map(ep => {
      const epT = tasks.filter(t => t.epId === ep.id);
      const d   = epT.filter(t => t.status === 'done').length;
      const tot = epT.length;
      const p   = tot ? Math.round(d / tot * 100) : 0;
      return `<div class="prog-row">
        <div class="prog-row-top">
          <span style="display:flex;align-items:center;gap:6px">
            <span style="width:8px;height:8px;border-radius:50%;background:${ep.color};display:inline-block"></span>
            ${ep.name}
          </span>
          <span style="color:var(--text-muted);font-size:12px">${p}%</span>
        </div>
        <div class="progress-bar" style="width:100%">
          <div class="progress-fill" style="width:${p}%;background:${ep.color}"></div>
        </div>
      </div>`;
    }).join('');
  }

  // Recent tasks
  const rtEl = document.getElementById('recent-tasks');
  const last5 = [...tasks].reverse().slice(0, 5);
  if (!last5.length) {
    rtEl.innerHTML = '<div class="empty-state">Belum ada task.</div>';
  } else {
    rtEl.innerHTML = last5.map(t => `
      <div class="recent-row">
        <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${TYPE_COLOR[t.type]||'#888'};flex-shrink:0"></span>
        <span class="recent-name">${t.name}</span>
        <span class="badge ${STATUS_BADGE[t.status]}">${STATUS_LABEL[t.status]}</span>
      </div>`).join('');
  }

  // Status chart
  const counts = { todo:0, wip:0, review:0, done:0 };
  tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
  const maxC = Math.max(...Object.values(counts), 1);
  const scColors = { todo:'#D3D1C7', wip:'#EF9F27', review:'#7F77DD', done:'#1D9E75' };
  const scLabels = { todo:'Belum', wip:'Jalan', review:'Review', done:'Selesai' };
  const scEl = document.getElementById('status-chart');
  if (!total) {
    scEl.innerHTML = '<div class="empty-state" style="padding:8px">Belum ada task.</div>';
  } else {
    scEl.innerHTML = Object.entries(counts).map(([k,v]) => {
      const h = Math.round((v / maxC) * 56) + 4;
      return `<div class="sc-bar-wrap">
        <div class="sc-num" style="color:${scColors[k]}">${v}</div>
        <div class="sc-bar" style="height:${h}px;background:${scColors[k]}"></div>
        <div class="sc-lbl">${scLabels[k]}</div>
      </div>`;
    }).join('');
  }
}

// ── Sync selects ───────────────────────────────
function syncEpSelects() {
  const opts  = '<option value="">-- Pilih episode --</option>' + episodes.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
  const fOpts = '<option value="">Semua episode</option>'       + episodes.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
  ['t-ep'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = opts; });
  ['f-ep'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = fOpts; });
}

function syncMileEpSelect() {
  const el = document.getElementById('m-ep');
  if (!el) return;
  el.innerHTML = '<option value="">-- Opsional --</option>' + episodes.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
}

// ── Init ───────────────────────────────────────
document.getElementById('topbar-date').textContent =
  new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

renderDashboard();
renderEpisodes();
syncEpSelects();
syncMileEpSelect();
syncGanttFilter();
renderTasks();
renderMilestones();
renderTeam();

// ── State ──────────────────────────────────────────────
let episodes = JSON.parse(localStorage.getItem('at_episodes') || '[]');
let tasks    = JSON.parse(localStorage.getItem('at_tasks')    || '[]');

function save() {
  localStorage.setItem('at_episodes', JSON.stringify(episodes));
  localStorage.setItem('at_tasks',    JSON.stringify(tasks));
}

// ── Helpers ────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function statusLabel(s) {
  return { todo: 'Belum mulai', wip: 'Dikerjakan', review: 'Review', done: 'Selesai' }[s] || s;
}

function badgeClass(s) {
  return { todo: 'badge-todo', wip: 'badge-wip', review: 'badge-review', done: 'badge-done' }[s] || '';
}

// ── Tab switching ──────────────────────────────────────
function switchTab(name, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('topbar-title').textContent =
    { dashboard: 'Dashboard', episodes: 'Episode', tasks: 'Task', timeline: 'Timeline' }[name] || name;

  if (name === 'dashboard') renderDashboard();
  if (name === 'tasks')     { syncEpSelects(); renderTasks(); }
  if (name === 'timeline')  renderTimeline();
}

// ── Sidebar mobile ─────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── Episode ────────────────────────────────────────────
function addEpisode() {
  const name = document.getElementById('ep-name').value.trim();
  const dead = document.getElementById('ep-dead').value;
  const desc = document.getElementById('ep-desc').value.trim();
  if (!name) { alert('Nama episode wajib diisi!'); return; }
  episodes.push({ id: Date.now(), name, dead, desc });
  save();
  document.getElementById('ep-name').value = '';
  document.getElementById('ep-dead').value = '';
  document.getElementById('ep-desc').value = '';
  renderEpisodes();
  syncEpSelects();
}

function deleteEpisode(id) {
  if (!confirm('Hapus episode ini? Semua task terkait juga akan dihapus.')) return;
  episodes = episodes.filter(e => e.id !== id);
  tasks    = tasks.filter(t => t.epId !== id);
  save();
  renderEpisodes();
  syncEpSelects();
}

function renderEpisodes() {
  const el = document.getElementById('ep-list');
  if (!episodes.length) {
    el.innerHTML = '<div class="empty-state">Belum ada episode. Tambahkan menggunakan form di atas.</div>';
    return;
  }
  el.innerHTML = episodes.map(ep => {
    const epTasks = tasks.filter(t => t.epId === ep.id);
    const done    = epTasks.filter(t => t.status === 'done').length;
    const total   = epTasks.length;
    const pct     = total ? Math.round(done / total * 100) : 0;
    return `
      <div class="ep-item">
        <div style="flex:1">
          <div class="ep-title">${ep.name}</div>
          <div class="ep-meta">
            ${ep.dead ? '📅 Deadline: ' + fmtDate(ep.dead) : 'Belum ada deadline'}
            ${ep.desc ? ' · ' + ep.desc.substring(0, 60) + (ep.desc.length > 60 ? '…' : '') : ''}
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            <span style="font-size:12px;color:var(--text-muted)">${pct}% · ${done}/${total} task</span>
          </div>
        </div>
        <button class="btn danger" onclick="deleteEpisode(${ep.id})" title="Hapus episode">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>`;
  }).join('');
}

// ── Task ───────────────────────────────────────────────
function addTask() {
  const name   = document.getElementById('t-name').value.trim();
  const epId   = parseInt(document.getElementById('t-ep').value) || 0;
  const div    = document.getElementById('t-div').value;
  const dead   = document.getElementById('t-dead').value;
  const pic    = document.getElementById('t-pic').value.trim();
  const status = document.getElementById('t-status').value;
  if (!name) { alert('Nama task wajib diisi!'); return; }
  tasks.push({ id: Date.now(), name, epId, div, dead, pic, status });
  save();
  document.getElementById('t-name').value = '';
  document.getElementById('t-pic').value  = '';
  document.getElementById('t-dead').value = '';
  renderTasks();
  renderEpisodes();
}

function updateStatus(id, val) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.status = val; save(); }
  renderTasks();
  renderEpisodes();
  renderDashboard();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  renderTasks();
  renderEpisodes();
  renderDashboard();
}

function renderTasks() {
  const fEp  = document.getElementById('f-ep')?.value;
  const fDiv = document.getElementById('f-div')?.value;
  const fSt  = document.getElementById('f-status')?.value;

  let list = tasks.filter(t => {
    if (fEp  && t.epId !== parseInt(fEp)) return false;
    if (fDiv && t.div  !== fDiv)          return false;
    if (fSt  && t.status !== fSt)         return false;
    return true;
  });

  const el = document.getElementById('task-list');
  if (!list.length) {
    el.innerHTML = '<div class="empty-state">Tidak ada task yang sesuai filter.</div>';
    return;
  }

  el.innerHTML = list.map(t => {
    const ep = episodes.find(e => e.id === t.epId);
    const divLabel = t.div === 'ilustrasi' ? 'Tim Ilustrasi' : 'Tim Editing';
    return `
      <div class="task-item div-${t.div} status-${t.status}">
        <div class="task-info">
          <div class="task-name">${t.name}</div>
          <div class="task-meta">
            ${ep ? ep.name + ' · ' : ''}
            ${divLabel}
            ${t.pic  ? ' · PIC: ' + t.pic : ''}
            ${t.dead ? ' · ' + fmtDate(t.dead) : ''}
          </div>
        </div>
        <div class="task-controls">
          <select class="status-select" onchange="updateStatus(${t.id}, this.value)">
            <option value="todo"   ${t.status==='todo'   ? 'selected':''}>Belum mulai</option>
            <option value="wip"    ${t.status==='wip'    ? 'selected':''}>Dikerjakan</option>
            <option value="review" ${t.status==='review' ? 'selected':''}>Review</option>
            <option value="done"   ${t.status==='done'   ? 'selected':''}>Selesai</option>
          </select>
          <button class="btn danger sm" onclick="deleteTask(${t.id})" title="Hapus task">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </div>`;
  }).join('');
}

function syncEpSelects() {
  const opts = '<option value="">-- Pilih episode --</option>' +
    episodes.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
  const fOpts = '<option value="">Semua episode</option>' +
    episodes.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
  const tEp = document.getElementById('t-ep');
  const fEp = document.getElementById('f-ep');
  if (tEp) tEp.innerHTML = opts;
  if (fEp) fEp.innerHTML = fOpts;
}

// ── Dashboard ──────────────────────────────────────────
function renderDashboard() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.status === 'done').length;
  const pct   = total ? Math.round(done / total * 100) : 0;

  document.getElementById('s-ep').textContent   = episodes.length;
  document.getElementById('s-task').textContent = total;
  document.getElementById('s-done').textContent = done;
  document.getElementById('s-pct').textContent  = pct + '%';

  // Progress per episode
  const epEl = document.getElementById('ep-progress-list');
  if (!episodes.length) {
    epEl.innerHTML = '<div class="empty-state">Belum ada episode.</div>';
  } else {
    epEl.innerHTML = episodes.map(ep => {
      const epTasks = tasks.filter(t => t.epId === ep.id);
      const d   = epTasks.filter(t => t.status === 'done').length;
      const tot = epTasks.length;
      const p   = tot ? Math.round(d / tot * 100) : 0;
      return `
        <div class="prog-row">
          <div class="prog-row-top">
            <span>${ep.name}</span>
            <span class="prog-row-pct">${p}%</span>
          </div>
          <div class="progress-bar" style="width:100%"><div class="progress-fill" style="width:${p}%"></div></div>
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
        <span class="recent-name">${t.name}</span>
        <span class="badge ${badgeClass(t.status)}">${statusLabel(t.status)}</span>
      </div>`).join('');
  }

  // Status chart
  const counts = { todo: 0, wip: 0, review: 0, done: 0 };
  tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
  const maxCount = Math.max(...Object.values(counts), 1);
  const colors = { todo: '#D3D1C7', wip: '#EF9F27', review: '#7F77DD', done: '#1D9E75' };
  const labels = { todo: 'Belum mulai', wip: 'Dikerjakan', review: 'Review', done: 'Selesai' };
  const scEl = document.getElementById('status-chart');
  if (!total) {
    scEl.innerHTML = '<div class="empty-state" style="padding:8px">Belum ada task.</div>';
  } else {
    scEl.innerHTML = Object.entries(counts).map(([key, val]) => {
      const h = Math.round((val / maxCount) * 60) + 4;
      return `
        <div class="sc-bar-wrap">
          <div class="sc-num" style="color:${colors[key]}">${val}</div>
          <div class="sc-bar" style="height:${h}px;background:${colors[key]}"></div>
          <div class="sc-lbl">${labels[key]}</div>
        </div>`;
    }).join('');
  }
}

// ── Timeline ───────────────────────────────────────────
function renderTimeline() {
  const el = document.getElementById('timeline-content');
  const withDead = episodes.filter(e => e.dead).sort((a, b) => a.dead.localeCompare(b.dead));

  if (!withDead.length) {
    el.innerHTML = '<div class="empty-state">Belum ada episode dengan deadline. Tambahkan deadline saat membuat episode.</div>';
    return;
  }

  const minDate = new Date(withDead[0].dead);
  const maxDate = new Date(withDead[withDead.length - 1].dead);
  const totalDays = Math.max((maxDate - minDate) / 86400000, 1);

  // Build month labels
  const months = [];
  let cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 1);
  while (cur < end) {
    months.push(cur.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }));
    cur.setMonth(cur.getMonth() + 1);
  }

  const monthsHtml = `<div class="tl-months">${months.map(m => `<div class="tl-month">${m}</div>`).join('')}</div>`;

  const rows = withDead.map(ep => {
    const epTasks = tasks.filter(t => t.epId === ep.id);
    const done    = epTasks.filter(t => t.status === 'done').length;
    const total   = epTasks.length;
    const pct     = total ? Math.round(done / total * 100) : 0;

    const daysFromStart = (new Date(ep.dead) - minDate) / 86400000;
    const leftPct  = Math.max(0, Math.min(90, (daysFromStart / totalDays) * 90));
    const barStatus = pct === 100 ? 'status-done' : pct > 0 ? 'status-wip' : 'status-todo';

    return `
      <div class="tl-row">
        <div class="tl-label" title="${ep.name}">${ep.name}</div>
        <div class="tl-track">
          <div class="tl-bar ${barStatus}" style="left:${leftPct}%;width:max(40px,8%)">
            <span class="tl-bar-label">${fmtDate(ep.dead)}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="tl-header">
      <div>Episode</div>
      ${monthsHtml}
    </div>
    ${rows}`;
}

// ── Init ───────────────────────────────────────────────
document.getElementById('topbar-date').textContent =
  new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

renderDashboard();
renderEpisodes();
syncEpSelects();
renderTasks();

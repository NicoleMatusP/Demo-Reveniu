// Registro de tiempos de la prueba. Todo vive en el navegador (localStorage).
const KEY = 'reveniu-prueba-sesiones';

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};
const save = (all) => {
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* sin almacenamiento */ }
};

let session = null;
let current = null; // { id, title, enteredAt }

export function startSession(participant) {
  session = {
    id: Date.now().toString(36),
    participant: participant || 'Sin código',
    startedAt: new Date().toISOString(),
    t0: performance.now(),
    steps: {},      // id -> { title, ms, visits }
    order: [],      // orden en que se vieron
    events: [],     // { t, type, detail }
    finishedAt: null,
    totalMs: null,
  };
  current = null;
  persist();
  return session;
}

export function getSession() { return session; }

const now = () => (session ? performance.now() - session.t0 : 0);

export function enterStep(id, title) {
  if (!session) return;
  leaveStep();
  current = { id, title, enteredAt: performance.now() };
  if (!session.steps[id]) session.steps[id] = { title, ms: 0, visits: 0 };
  session.steps[id].visits += 1;
  session.order.push({ id, title, at: Math.round(now()) });
  persist();
}

export function leaveStep() {
  if (!session || !current) return;
  const s = session.steps[current.id];
  if (s) s.ms += performance.now() - current.enteredAt;
  current = null;
}

export function track(type, detail = '') {
  if (!session) return;
  session.events.push({ t: Math.round(now()), type, detail });
  persist();
}

export function finishSession(answers) {
  if (!session || session.finishedAt) return;
  leaveStep();
  session.finishedAt = new Date().toISOString();
  session.totalMs = Math.round(now());
  session.answers = answers;
  persist();
}

function persist() {
  if (!session) return;
  const all = load().filter((s) => s.id !== session.id);
  all.push({ ...session, t0: undefined });
  save(all);
}

export function allSessions() { return load(); }
export function clearSessions() { save([]); }

export const fmt = (ms) => {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m ? `${m} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`;
};

export function toCSV(sessions) {
  const rows = [['sesion', 'participante', 'inicio', 'paso', 'pregunta', 'segundos', 'visitas', 'total_segundos', 'volver_atras', 'ayuda_abierta', 'guardar_y_salir']];
  for (const s of sessions) {
    const back = s.events.filter((e) => e.type === 'atras').length;
    const help = s.events.filter((e) => e.type === 'ayuda').length;
    const exit = s.events.filter((e) => e.type === 'guardar_y_salir').length;
    for (const [id, st] of Object.entries(s.steps)) {
      rows.push([s.id, s.participant, s.startedAt, id, st.title, (st.ms / 1000).toFixed(1), st.visits, s.totalMs != null ? (s.totalMs / 1000).toFixed(1) : '', back, help, exit]);
    }
  }
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function download(name, text, type = 'text/csv') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

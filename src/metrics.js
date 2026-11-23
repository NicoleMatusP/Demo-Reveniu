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
let phase = null;   // 'alta' | 'validacion'

// Las dos partes que se miden por separado.
export const PHASES = { alta: 'Alta', validacion: 'Validación de empresa', plan: 'Crear el plan', link: 'Link y rastreo', catalogo: 'Tareas en el catálogo' };

// Cada prueba es un flujo distinto, con sus propias partes.
export const FLOWS = {
  alta: { label: 'Alta y validación', phases: ['alta', 'validacion'], inicio: '#' },
  planes: { label: 'Productos y planes', phases: ['plan', 'link', 'catalogo'], inicio: '#planes' },
};
export const flowOf = (s) => s.flow || 'alta';

export function startSession(participant, flow = 'alta') {
  session = {
    id: Date.now().toString(36),
    flow,
    participant: participant || 'Sin código',
    device: window.innerWidth <= 900 ? 'Mobile' : 'Desktop',
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    startedAt: new Date().toISOString(),
    t0: performance.now(),
    steps: {},      // id -> { title, ms, visits }
    order: [],      // orden en que se vieron
    events: [],     // { t, type, detail }
    phases: {},     // alta / validacion -> { startMs, ms }
    finishedAt: null,
    totalMs: null,
  };
  current = null;
  phase = null;
  startPhase(FLOWS[flow].phases[0]);
  return session;
}

export function getSession() { return session; }

const now = () => (session ? performance.now() - session.t0 : 0);

export function enterStep(id, title) {
  if (!session) return;
  leaveStep();
  current = { id, title, enteredAt: performance.now() };
  if (!session.steps[id]) session.steps[id] = { title, ms: 0, visits: 0, phase };
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

/** Empieza a medir una parte de la prueba (alta o validación). */
export function startPhase(name) {
  if (!session || session.phases[name]) return;
  leaveStep();
  if (phase && phase !== name) endPhase(phase);
  session.phases[name] = { startMs: Math.round(now()), ms: null };
  phase = name;
  track(`fase_inicio_${name}`);
}

/** Cierra una parte: su tiempo queda fijo aunque la persona siga en otra pantalla. */
export function endPhase(name) {
  const p = session?.phases[name];
  if (!p || p.ms != null) return;
  leaveStep();
  p.ms = Math.round(now()) - p.startMs;
  if (phase === name) phase = null;
  track(`fase_fin_${name}`);
}

export function saveAnswers(answers) {
  if (!session) return;
  session.answers = answers;
  persist();
}

export function finishSession() {
  if (!session || session.finishedAt) return;
  leaveStep();
  if (phase) endPhase(phase);
  session.finishedAt = new Date().toISOString();
  session.totalMs = Math.round(now());
  persist();
}

/** Tiempo de una parte. Para pruebas antiguas (sin partes) todo cuenta como alta. */
export function phaseMs(s, name) {
  if (s.phases?.[name]) return s.phases[name].ms;
  return name === 'alta' && !s.flow ? s.totalMs : null;
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
  const sec = (ms) => (ms != null ? (ms / 1000).toFixed(1) : '');
  const rows = [['sesion', 'flujo', 'participante', 'dispositivo', 'pantalla', 'inicio', 'fase', 'paso', 'pregunta', 'segundos', 'visitas', 'alta_segundos', 'validacion_segundos', 'plan_segundos', 'link_segundos', 'catalogo_segundos', 'total_segundos', 'volver_atras', 'ayuda_abierta', 'guardar_y_salir']];
  for (const s of sessions) {
    const back = s.events.filter((e) => e.type === 'atras').length;
    const help = s.events.filter((e) => e.type === 'ayuda').length;
    const exit = s.events.filter((e) => e.type === 'guardar_y_salir').length;
    for (const [id, st] of Object.entries(s.steps)) {
      rows.push([s.id, FLOWS[flowOf(s)].label, s.participant, s.device || 'Desktop', s.viewport || '', s.startedAt, PHASES[st.phase || 'alta'], id, st.title, sec(st.ms), st.visits, sec(phaseMs(s, 'alta')), sec(phaseMs(s, 'validacion')), sec(phaseMs(s, 'plan')), sec(phaseMs(s, 'link')), sec(phaseMs(s, 'catalogo')), sec(s.totalMs), back, help, exit]);
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

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Archive, Check, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, Copy, Eye, House, Link2, Mail, MessageCircle, MoreHorizontal, Package, Pause, Pencil, Plus, QrCode, RotateCcw, Search, Sparkles, Tag, X } from 'lucide-react';
import { Logo, Options, Ring, TextArea, TextField, useFit } from './ui.jsx';
import { Shell } from './Shell.jsx';
import { endPhase, enterStep, finishSession, saveAnswers, startPhase, startSession, track } from './metrics.js';

/*
  Prueba 2 · Productos y planes
  Mide cuánto se demora una persona en:
   1. Crear un plan (desde el catálogo hasta «Publicar plan»)
   2. Dejar listo el link con UTM y publicarlo
   3. Hacer tareas en el catálogo (archivar y encontrar lo archivado)
*/

const STAGES_P = ['Producto', 'Cobros', 'Condiciones', 'Revisión'];
const PESOS = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;
const SEGMENTOS0 = [
  { n: 'VIP', c: 'Etiqueta es «VIP»', k: 18 },
  { n: 'Colegios en convenio', c: 'Empresa es colegio en convenio', k: 41 },
  { n: 'Becados', c: 'Etiqueta es «Beca»', k: 9 },
  { n: 'Morosos recurrentes', c: 'Lo mantiene Recovery · automático', k: 6, agente: true },
];
const MESES = ['Enero 2027', 'Febrero 2027', 'Marzo 2027', 'Abril 2027', 'Mayo 2027', 'Junio 2027', 'Julio 2027', 'Agosto 2027', 'Septiembre 2027', 'Octubre 2027', 'Noviembre 2027', 'Diciembre 2027'];
const CANALES_UTM = [['Instagram · bio', 'instagram', 'bio'], ['Facebook · anuncio', 'facebook', 'cpc'], ['TikTok · bio', 'tiktok', 'bio'], ['WhatsApp · estado', 'whatsapp', 'estado'], ['Google Ads', 'google', 'cpc'], ['Correo', 'email', 'correo'], ['QR impreso', 'qr', 'afiche'], ['Personalizado', '', '']];
const CLIENTES = ['Camila Rojas', 'Pedro Soto', 'Josefa Muñoz', 'Tomás Vera', 'Ignacio Pérez', 'Martina Lagos', 'Andrés Rojas', 'Valentina Díaz', 'Benjamín Silva', 'Florencia Castro', 'Matías Herrera', 'Antonia Reyes', 'Diego Fuentes', 'Sofía Morales', 'Joaquín Ortiz', 'Isidora Núñez'];
const PLANTILLAS = [
  { t: 'Mensualidad con matrícula', d: 'Colegios, academias, jardines · matrícula + cuotas' },
  { t: 'Membresía', d: 'Gimnasios, clubes · fijo cada mes, sin término' },
  { t: 'Cuotas', d: 'Cursos, tratamientos · un total en n cuotas' },
  { t: 'Por usuario', d: 'Software, licencias · por unidad cada mes' },
  { t: 'Por uso', d: 'SMS, consumo · por tramos, mes vencido' },
  { t: 'Por hitos', d: 'Consultorías, proyectos · % por etapa' },
  { t: 'Donación', d: 'Fundaciones · monto libre' },
  { t: 'Pago único', d: 'Inscripciones y entradas · una vez' },
];
const PRODUCTOS0 = [
  { t: 'Inglés B2', d: 'Se cuenta por alumno · está en 3 planes' },
  { t: 'Material de estudio', d: 'Se cuenta por unidad · está en 2 planes' },
  { t: 'Clases de refuerzo', d: 'Se cuenta por sesión · está en 1 plan' },
  { t: 'Inglés niños', d: 'Se cuenta por alumno · está en 1 plan' },
  { t: 'Taller de conversación', d: 'Se cuenta por persona · todavía sin planes' },
];
const PLANES0 = [
  { id: 'p1', nombre: 'Inglés B2 · 2026', desc: 'Matrícula + 10 cuotas', productos: ['Inglés B2', 'Material de estudio'], precio: '$37.900 / mes', subs: 112, estado: 'Publicado' },
  { id: 'p2', nombre: 'Mensual flexible', desc: 'Mes a mes, sin permanencia', productos: ['Inglés B2'], precio: '$45.900 / mes', subs: 36, estado: 'Publicado' },
  { id: 'p3', nombre: 'Pack familiar', desc: 'Un adulto y un niño', productos: ['Inglés B2', 'Inglés niños'], precio: '$69.900 / mes', subs: 12, estado: 'Publicado' },
  { id: 'p4', nombre: 'Material suelto', desc: 'Pago único', productos: ['Material de estudio'], precio: '$6.500', subs: 0, estado: 'Publicado' },
  { id: 'p5', nombre: 'Verano intensivo', desc: 'Enero y febrero', productos: ['Inglés B2', 'Taller de conversación'], precio: '$120.000', subs: 0, estado: 'Borrador' },
  { id: 'p6', nombre: 'Pack hermanos 2025', desc: 'Dos alumnos', productos: ['Inglés B2'], precio: '$64.900 / mes', subs: 0, estado: 'Archivado' },
];
const TAREAS = {
  plan: { n: 1, t: 'Crea el plan «Inglés B2 · 2027»', d: 'Matrícula de $90.000 y 10 cuotas de $39.900 de marzo a diciembre. Los clientes VIP deben tener su propia regla si un cobro falla. Publica el link con UTM para Instagram.' },
  catalogo: { n: 2, t: 'Archiva «Mensual flexible»', d: 'Después, deja la lista mostrando solo los planes archivados.' },
};

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const initialPlan = () => ({
  plantilla: '', productos: ['Inglés B2'], nombre: '', descripcion: '',
  cobros: [], primerCobro: 'Marzo 2027', dia: 'Día fijo: el 5', matricula: 'Junto con la primera cuota', matDesde: '2027-02-01', matHasta: '2027-02-28',
  incluye: [{ n: 'Clases en vivo', l: '8 por mes' }, { n: 'Acceso a plataforma', l: 'Ilimitado' }],
  prueba: false, pruebaDias: '14', descuentos: [],
  permanencia: true, permMeses: '10 meses', permSalida: 'Paga el saldo pendiente', permSeg: 'todos',
  reglaSeg: 'todos', reglaSegNombre: 'VIP', regla: 'Estándar', reglaEditada: false, reintentos: ['1 día', '3 días', '7 días'], canales: ['Correo', 'WhatsApp'], siFalla: 'Pausar la suscripción', reglaNombre: '',
  avisosSeg: 'todos', avisos: 'Estándar', avisosOn: { 'Recordatorio antes de cobrar': true, 'Comprobante de pago': true, 'Aviso de última cuota': true },
  fechaTipo: 'Una fecha', rangoDesde: 'Marzo 2027', rangoHasta: 'Diciembre 2027', pruebaTarjeta: 'Sí, es obligatoria',
  pausa: true, pausaMax: '2 meses', pausaVeces: '1 vez', pausaCobro: 'No se cobra',
  cancelSeg: 'todos', cancel: 'Estándar', cancelPortal: true, cancelMotivo: true, motivos: ['Me cambié de colegio', 'Es muy caro para mí', 'Terminé lo que necesitaba', 'Otro (lo escribe)'],
  slug: '', utm: { on: false, source: '', medium: '', campaign: '' }, utms: [], meta: { title: '', desc: '', index: true, pixelOn: true, gaOn: true },
});

export default function Planes() {
  const [screen, setScreen] = useState('inicio');
  const [plans, setPlans] = useState(PLANES0);
  const [p, setP] = useState(initialPlan);
  const [idx, setIdx] = useState(0);
  const [help, setHelp] = useState(false);
  const [nuevoId, setNuevoId] = useState(null);
  const set = (patch) => setP((x) => ({ ...x, ...patch }));
  const steps = useSteps(p, set, setIdx);
  const step = steps[idx];

  const stepKey = screen === 'wizard' ? step.id : screen;
  const stepTitle = screen === 'wizard' ? step.title : TITLES[screen];
  useEffect(() => { if (!['inicio', 'fin'].includes(screen)) enterStep(stepKey, stepTitle); }, [stepKey]); // eslint-disable-line

  const go = (s) => setScreen(s);

  if (screen === 'inicio') return <InicioPrueba onStart={(code) => { startSession(code, 'planes'); go('catalogo'); }} />;
  if (screen === 'catalogo') return (
    <Catalogo plans={plans} setPlans={setPlans} nuevoId={nuevoId}
      tarea={nuevoId ? TAREAS.catalogo : TAREAS.plan}
      onNewPlan={() => { setP(initialPlan()); setIdx(0); go('wizard'); }}
      onTaskDone={() => { endPhase('catalogo'); finishSession(); go('fin'); }} />
  );
  if (screen === 'wizard') {
    const stageSteps = steps.filter((s) => s.stage === step.stage);
    const pos = stageSteps.indexOf(step);
    const ok = step.valid ? !!step.valid(p) : true;
    const next = () => {
      if (step.id === 'revisar') { endPhase('plan'); startPhase('link'); set({ slug: p.slug || slugify(p.nombre || 'mi-plan') }); return go('link'); }
      setIdx(Math.min(idx + 1, steps.length - 1));
    };
    const back = () => { track('atras', step.id); if (idx > 0) setIdx(idx - 1); else go('catalogo'); };
    return (
      <Shell name="Camila" proceso="Nuevo plan" stages={STAGES_P} stageIdx={step.stage} fill={(pos + 1) / stageSteps.length}
        onHelp={() => { track('ayuda', step.id); setHelp(true); }} onExit={() => { track('guardar_y_salir', step.id); go('catalogo'); }}
        help={help} closeHelp={() => setHelp(false)} helpCtx={[step.title, idx + 1, { correo: '', nombre: 'Camila' }]}
        wide={step.wide}
        footer={<>
          <span className="t-help note">Guardamos un borrador a medida que avanzas</span>
          <button className="btn btn-secondary" onClick={back}>Atrás</button>
          <button className="btn btn-primary" disabled={!ok} onClick={next}>{step.cta || 'Continuar'}</button>
        </>}>
        <div key={step.id} className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 className="t-l q-title">{step.title}</h1>
          {step.sub && <p className="t-body q-sub" style={{ marginBottom: 20 }}>{step.sub}</p>}
          {step.render()}
        </div>
      </Shell>
    );
  }
  if (screen === 'link') return (
    <LinkStep p={p} set={set} onBack={() => { track('atras', 'link'); setIdx(steps.length - 1); go('wizard'); }}
      onPublish={() => {
        const id = 'n' + Date.now();
        const cuota = p.cobros.find((c) => c.frec !== 'Una vez');
        setPlans((ps) => [{ id, nombre: p.nombre || 'Plan sin nombre', desc: p.cobros.map((c) => c.nombre).join(' + ') || p.plantilla, productos: p.productos, precio: cuota ? `${PESOS(cuota.monto)} / mes` : PESOS(p.cobros[0]?.monto), subs: 0, estado: 'Publicado' }, ...ps]);
        setNuevoId(id);
        saveAnswers({ ...p });
        go('publicado');
      }} />
  );
  if (screen === 'publicado') return <Publicado p={p} onCatalog={() => { endPhase('link'); startPhase('catalogo'); go('catalogo'); }} />;
  if (screen === 'fin') return <FinPrueba />;
  return null;
}

const TITLES = { catalogo: 'Catálogo · Planes', link: 'Elige cómo se verá el link', publicado: 'Plan publicado (celebración)' };

/* ---------------- Inicio de la prueba ---------------- */
function InicioPrueba({ onStart }) {
  const [code, setCode] = useState('');
  return (
    <div className="stage" style={{ background: 'var(--lienzo)' }}>
      <div className="center-card">
        <Logo />
        <span className="tag neutral">Flujo 3</span>
        <h1 className="t-l">Prueba de Productos y planes</h1>
        <p className="t-body">Medimos el tiempo en tres partes: crear un plan (del catálogo a «Publicar plan»), dejar listo su link con UTM y publicarlo, y una tarea en el catálogo (archivar y encontrar lo archivado). Las tareas aparecen abajo a la izquierda.</p>
        <TextField label="Código del participante" value={code} onChange={setCode} placeholder="Ej: P01" autoFocus onEnter={() => onStart(code)} />
        <button className="btn btn-primary btn-block" onClick={() => onStart(code)}>Comenzar prueba</button>
        <a className="t-small" href="#" onClick={() => setTimeout(() => location.reload())} style={{ color: 'var(--texto)', fontWeight: 500 }}>← Volver al menú de flujos</a>
        <a className="t-small" href="#moderador" style={{ color: 'var(--texto-2)' }}>Ver resultados</a>
      </div>
    </div>
  );
}

/* ---------------- Piezas compartidas ---------------- */
function Switch({ on, onChange, label, desc }) {
  return (
    <button type="button" className="sw-row" onClick={() => onChange(!on)} aria-pressed={on}>
      <span className={`switch${on ? ' on' : ''}`} />
      <span style={{ textAlign: 'left' }}><span className="t-label" style={{ display: 'block' }}>{label}</span>{desc && <span className="t-help">{desc}</span>}</span>
    </button>
  );
}
function Seg({ options, value, onChange }) {
  return <div className="seg">{options.map((o) => <button key={o} type="button" className={o === value ? 'on' : ''} onClick={() => onChange(o)}>{o}</button>)}</div>;
}
function Pills({ options, value, onChange, multi }) {
  const sel = multi ? value : [value];
  return (
    <div className="chips">
      {options.map((o) => <button key={o} type="button" className={`chip m${sel.includes(o) ? ' on' : ''}`} onClick={() => onChange(multi ? (sel.includes(o) ? sel.filter((x) => x !== o) : [...sel, o]) : o)}>{o}</button>)}
    </div>
  );
}
function DesdeCero({ title, desc, onClick, on }) {
  return (
    <button type="button" className={`desde-cero${on ? ' on' : ''}`} onClick={onClick}>
      <Plus size={16} />
      <span><span className="t-label" style={{ display: 'block', color: 'inherit' }}>{title}</span><span className="t-help">{desc}</span></span>
    </button>
  );
}
function SegmentoRow({ value, nombre, onChange, onNombre, segs, onAddSeg }) {
  const [panel, setPanel] = useState(null); // null | 'lista' | 'nuevo'
  const [nuevo, setNuevo] = useState({ n: 'Alumnos nuevos 2027', conds: [['Fecha de alta', 'es posterior a', '1 ene 2027'], ['Sede', 'es', 'Providencia']] });
  const cuenta = 6 + nuevo.conds.length * 6;
  const crear = () => { track('segmento_creado', nuevo.n); onAddSeg({ n: nuevo.n, c: nuevo.conds.map((c) => c.join(' ')).join(' y '), k: cuenta }); onChange('segmento'); onNombre(nuevo.n); setPanel(null); };
  return (
    <div className="bloque">
      <div style={{ display: 'flex', alignItems: 'center' }}><span className="t-label" style={{ flex: 1 }}>¿A quién se aplica?</span><button type="button" className="flink" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 2 }} onClick={() => { track('gestionar_segmentos'); setPanel('lista'); }}>Gestionar segmentos <ChevronRight size={14} /></button></div>
      <div className="chips" style={{ alignItems: 'center' }}>
        <button type="button" className={`chip m${value === 'todos' ? ' on' : ''}`} onClick={() => onChange('todos')}>Todos los clientes del plan</button>
        <button type="button" className={`chip m${value === 'segmento' ? ' on' : ''}`} onClick={() => { onChange('segmento'); track('segmento', nombre); }}>Solo un segmento</button>
        {value === 'segmento' && (
          <select className="input select" style={{ width: 'auto', height: 34, padding: '4px 36px 4px 12px', fontSize: 14 }} value={nombre} onChange={(e) => { onNombre(e.target.value); track('segmento', e.target.value); }}>
            {segs.map((s) => <option key={s.n}>{s.n}</option>)}
          </select>
        )}
      </div>
      {value === 'segmento' && (() => { const s = segs.find((x) => x.n === nombre); return s ? <span className="t-help">{s.k} clientes · {s.c}</span> : null; })()}
      {panel && (
        <Panel title={panel === 'lista' ? 'Segmentos' : 'Nuevo segmento'} sub={panel === 'lista' ? 'Grupos de clientes que puedes usar en reglas, avisos y precios de cualquier plan.' : 'Define quiénes entran. Se actualiza solo cuando un cliente cumple o deja de cumplir las condiciones.'}
          onClose={() => setPanel(null)}
          foot={panel === 'lista'
            ? <button className="btn btn-primary btn-block" onClick={() => setPanel(null)}>Listo</button>
            : <><button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPanel('lista')}>Cancelar</button><button className="btn btn-primary" style={{ flex: 1 }} disabled={!nuevo.n.trim()} onClick={crear}>Crear segmento</button></>}>
          {panel === 'lista' ? (<>
            <button className="btn btn-secondary btn-s" style={{ alignSelf: 'flex-start' }} onClick={() => setPanel('nuevo')}><Plus size={16} />Nuevo segmento</button>
            {segs.map((s) => (
              <div key={s.n} className="seg-item">
                <span style={{ flex: 1, minWidth: 0 }}><span className="t-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{s.n}{s.agente && <span className="tag agent" style={{ padding: '1px 8px', fontSize: 11 }}>Agente</span>}</span><span className="t-help">{s.c}</span></span>
                <span style={{ textAlign: 'right' }}><span className="t-label" style={{ display: 'block' }}>{s.k}</span><span className="t-help">clientes</span></span>
              </div>
            ))}
            <span className="t-help">Editar un segmento cambia a quién aplican las reglas que lo usan. Te mostraremos cuáles antes de guardar.</span>
          </>) : (<>
            <TextField label="Nombre" value={nuevo.n} onChange={(v) => setNuevo({ ...nuevo, n: v })} autoFocus />
            <span className="t-label">Condiciones</span>
            {nuevo.conds.map((c, i) => (
              <div key={i} className="cond">
                {i > 0 && <span className="tag neutral" style={{ marginBottom: 6 }}>y</span>}
                <div className="cond-fila">{c.map((v, k) => <span key={k} className="cond-sel">{v} <ChevronDown size={13} /></span>)}<button className="icon-btn" aria-label="Quitar condición" onClick={() => setNuevo({ ...nuevo, conds: nuevo.conds.filter((_, j) => j !== i) })}><X size={14} /></button></div>
              </div>
            ))}
            <button className="flink" style={{ alignSelf: 'flex-start', fontSize: 13 }} onClick={() => setNuevo({ ...nuevo, conds: [...nuevo.conds, ['Antigüedad', 'mayor a', '6 meses']] })}>+ Agregar condición</button>
            <div className="aviso" style={{ flexDirection: 'column', gap: 2 }}><span className="t-l" style={{ fontSize: 22 }}>{cuenta} <span className="t-help">clientes cumplen hoy</span></span><span className="t-help">Camila Rojas, Josefa Muñoz, Martina Lagos y {cuenta - 3} más</span></div>
          </>)}
        </Panel>
      )}
    </div>
  );
}

/* Panel lateral (en móvil, hoja inferior). El contenido hace scroll y el pie queda fijo. */
function Panel({ title, sub, children, foot, onClose }) {
  return (
    <div className="panel-veil" onClick={onClose}>
      <div className="panel pop" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="panel-head"><div style={{ flex: 1 }}><h2 className="t-m">{title}</h2>{sub && <p className="t-help" style={{ marginTop: 4 }}>{sub}</p>}</div><button className="icon-btn" aria-label="Cerrar" onClick={onClose}><X size={18} /></button></div>
        <div className="panel-body">{children}</div>
        {foot && <div className="panel-foot">{foot}</div>}
      </div>
    </div>
  );
}

/* ---------------- Pasos del asistente ---------------- */
function useSteps(p, set, setIdx) {
  const [nuevoProd, setNuevoProd] = useState(null);
  const [prods, setProds] = useState(PRODUCTOS0);
  const [feat, setFeat] = useState({ n: '', l: 'Ilimitado' });
  const [motivo, setMotivo] = useState('');
  const [segs, setSegs] = useState(SEGMENTOS0);
  const segProps = { segs, onAddSeg: (x) => setSegs((l) => [...l.filter((y) => y.n !== x.n), x]) };
  const elegirPlantilla = (t) => {
    track('plantilla', t);
    const cobros = t === 'Mensualidad con matrícula'
      ? [{ nombre: 'Matrícula', monto: 90000, frec: 'Una vez', cuotas: '' }, { nombre: 'Mensualidad', monto: 39900, frec: 'Cuotas', cuotas: '10' }]
      : t === 'Desde cero' ? [] : [{ nombre: t === 'Pago único' ? 'Pago' : 'Mensualidad', monto: '', frec: t === 'Pago único' ? 'Una vez' : 'Mensual', cuotas: '' }];
    set({ plantilla: t, cobros });
  };
  const upd = (i, patch) => set({ cobros: p.cobros.map((c, k) => (k === i ? { ...c, ...patch } : c)) });
  const tieneMatricula = p.cobros.some((c) => c.frec === 'Una vez') && p.cobros.some((c) => c.frec !== 'Una vez');

  return [
    { id: 'plantilla', stage: 0, title: '¿Cómo le cobras a tus clientes?', sub: 'Elige la forma más parecida. Partimos con los cobros típicos y después cambias lo que quieras.', valid: (x) => x.plantilla,
      render: () => (<>
        <Options options={PLANTILLAS} value={p.plantilla} onChange={elegirPlantilla} />
        <div style={{ height: 10 }} />
        <DesdeCero title="Empezar desde cero" desc="Para combinaciones que no calzan con ninguna plantilla." on={p.plantilla === 'Desde cero'} onClick={() => { track('desde_cero', 'plantilla'); elegirPlantilla('Desde cero'); }} />
      </>) },
    { id: 'productos', stage: 0, title: '¿Qué productos incluye este plan?', sub: 'Elige uno o varios de tu catálogo, o crea uno nuevo. Un producto puede estar en varios planes.', valid: (x) => x.productos.length,
      render: () => (<>
        <Options multi options={prods} value={p.productos} onChange={(v) => set({ productos: v })} />
        <div style={{ height: 10 }} />
        <DesdeCero title="Crear un producto nuevo" desc="Lo agregas al catálogo y a este plan." onClick={() => setNuevoProd({ t: '', u: 'Por alumno' })} />
        {nuevoProd && (
          <Modal title="Nuevo producto" onClose={() => setNuevoProd(null)} primary="Crear producto" disabled={!nuevoProd.t.trim()}
            onPrimary={() => { track('producto_nuevo', nuevoProd.t); setProds((ps) => [...ps, { t: nuevoProd.t, d: `Se cuenta ${nuevoProd.u.toLowerCase()} · nuevo` }]); set({ productos: [...p.productos, nuevoProd.t] }); setNuevoProd(null); }}>
            <TextField label="Nombre" value={nuevoProd.t} onChange={(v) => setNuevoProd({ ...nuevoProd, t: v })} placeholder="Ej: Clases de conversación" autoFocus />
            <div className="field"><span className="t-label">¿Cómo se cuenta?</span><Pills options={['Por alumno', 'Por unidad', 'Por sesión', 'Por persona']} value={nuevoProd.u} onChange={(v) => setNuevoProd({ ...nuevoProd, u: v })} /></div>
          </Modal>
        )}
      </>) },
    { id: 'nombre', stage: 1, title: 'Ponle nombre al plan', sub: 'Así lo verán tus clientes en el checkout y en su portal.', valid: (x) => x.nombre.trim(),
      render: () => (<div className="gap-col">
        <TextField label="Nombre del plan" value={p.nombre} onChange={(v) => set({ nombre: v })} placeholder="Ej: Inglés B2 · 2027" autoFocus />
        <TextArea label="Descripción (opcional)" value={p.descripcion} onChange={(v) => set({ descripcion: v })} placeholder="Qué incluye, para quién es, cuándo empieza…" rows={4} />
      </div>) },
    { id: 'cobros', stage: 1, title: 'Arma los cobros del plan', sub: 'Cada cobro es un monto con su frecuencia. Por ejemplo: matrícula una vez y mensualidad en cuotas.', valid: (x) => x.cobros.length && x.cobros.every((c) => c.nombre && Number(c.monto) > 0),
      render: () => (<div className="gap-col">
        {p.cobros.length === 0 && <div className="aviso"><Plus size={17} /><div className="t-small">Todavía no hay cobros. Agrega el primero.</div></div>}
        {p.cobros.map((c, i) => (
          <div key={i} className="cobro">
            <div className="cobro-fila">
              <input className="input" style={{ flex: 2 }} value={c.nombre} placeholder="Nombre del cobro" onChange={(e) => upd(i, { nombre: e.target.value })} aria-label="Nombre del cobro" />
              <div className="monto"><span>$</span><input className="input" inputMode="numeric" value={c.monto === '' ? '' : Number(c.monto).toLocaleString('es-CL')} placeholder="Monto" onChange={(e) => upd(i, { monto: e.target.value.replace(/\D/g, '') })} aria-label="Monto" /></div>
              <button className="icon-btn" aria-label="Quitar cobro" onClick={() => { track('cobro_quitado', c.nombre); set({ cobros: p.cobros.filter((_, k) => k !== i) }); }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Pills options={['Una vez', 'Mensual', 'Anual', 'Cuotas']} value={c.frec} onChange={(v) => upd(i, { frec: v })} />
              {c.frec === 'Cuotas' && <label className="cuotas"><input className="input" inputMode="numeric" value={c.cuotas} onChange={(e) => upd(i, { cuotas: e.target.value.replace(/\D/g, '') })} aria-label="Número de cuotas" /> cuotas</label>}
            </div>
          </div>
        ))}
        <button className="btn btn-secondary btn-s" style={{ alignSelf: 'flex-start' }} onClick={() => { track('cobro_agregado'); set({ cobros: [...p.cobros, { nombre: '', monto: '', frec: 'Mensual', cuotas: '' }] }); }}><Plus size={16} />Agregar cobro</button>
      </div>) },
    { id: 'fechas', stage: 1, title: '¿Cuándo se cobra?', sub: 'Define cuándo parte y qué día del mes se cobra.',
      render: () => (<div className="gap-col">
        <div className="dos">
          <div className="field">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="t-label" style={{ flex: 1 }}>{p.fechaTipo === 'Rango' ? 'Periodo de cobro' : 'Primer cobro'}</span><Seg options={['Una fecha', 'Rango']} value={p.fechaTipo} onChange={(v) => { track('fecha_tipo', v); set({ fechaTipo: v }); }} /></div>
            {p.fechaTipo === 'Rango' ? (<>
              <div className="rango">
                <select className="input select" aria-label="Desde" value={p.rangoDesde} onChange={(e) => set({ rangoDesde: e.target.value })}>{MESES.map((m) => <option key={m}>{m}</option>)}</select>
                <span className="t-help">→</span>
                <select className="input select" aria-label="Hasta" value={p.rangoHasta} onChange={(e) => set({ rangoHasta: e.target.value })}>{MESES.filter((m) => MESES.indexOf(m) >= MESES.indexOf(p.rangoDesde)).map((m) => <option key={m}>{m}</option>)}</select>
              </div>
              <span className="t-help">{Math.max(1, MESES.indexOf(p.rangoHasta) - MESES.indexOf(p.rangoDesde) + 1)} cobros · {p.dia === 'Aniversario' ? 'el día en que contrata' : 'el día 5'} de cada mes. Las cuotas se calculan con el periodo.</span>
            </>) : (<>
              <select className="input select" value={p.primerCobro} onChange={(e) => set({ primerCobro: e.target.value })}>{MESES.slice(0, 4).map((m) => <option key={m}>{m}</option>)}</select>
              <span className="t-help">Luego el mismo día cada mes. ¿Cobras solo en un periodo? Usa «Rango».</span>
            </>)}
          </div>
          <div className="field"><span className="t-label">Día de cobro</span><Pills options={['Aniversario', 'Día fijo: el 5']} value={p.dia} onChange={(v) => set({ dia: v })} /></div>
        </div>
        {tieneMatricula && (<div className="bloque">
          <span className="t-label">¿Cuándo se cobra la matrícula?</span>
          <Options options={[{ t: 'Junto con la primera cuota', d: 'Un solo cobro el primer mes' }, { t: 'Al inscribirse', d: 'Se cobra hoy y la cuota después' }, { t: 'En otra fecha', d: 'Eliges el día' }, { t: 'Que el cliente elija', d: 'Dentro de un rango que tú defines' }]} value={p.matricula} onChange={(v) => set({ matricula: v })} />
          {p.matricula === 'Que el cliente elija' && (<div className="dos">
            <TextField label="Desde" type="date" value={p.matDesde} onChange={(v) => set({ matDesde: v })} />
            <TextField label="Hasta" type="date" value={p.matHasta} onChange={(v) => set({ matHasta: v })} help="Si no elige, se cobra el último día del rango." />
          </div>)}
        </div>)}
      </div>) },
    { id: 'incluye', stage: 2, title: '¿Qué incluye el plan?', sub: 'Lo que recibe tu cliente. Aparece en el checkout y en su portal.', wide: true,
      render: () => (<div className="incluye">
        <div className="gap-col" style={{ flex: 1, minWidth: 0 }}>
          <div className="lista">
            {p.incluye.map((f, i) => (
              <div key={i} className="lista-fila"><span className="ok-dot"><Check size={12} /></span><span className="t-label" style={{ flex: 1 }}>{f.n}</span><span className="chipm">{f.l}</span><button className="icon-btn" aria-label={`Quitar ${f.n}`} onClick={() => set({ incluye: p.incluye.filter((_, k) => k !== i) })}><X size={14} /></button></div>
            ))}
          </div>
          <div className="agregando">
            <input className="input" value={feat.n} placeholder="Escribe una característica, ej: Acceso a grabaciones" onChange={(e) => setFeat({ ...feat, n: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && feat.n.trim()) { track('caracteristica', feat.n); set({ incluye: [...p.incluye, feat] }); setFeat({ n: '', l: 'Ilimitado' }); } }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Seg options={['Ilimitado', 'Con límite', 'Con costo']} value={feat.l} onChange={(v) => setFeat({ ...feat, l: v })} />
              <span className="spacer" style={{ flex: 1 }} />
              <button className="btn btn-primary btn-s" disabled={!feat.n.trim()} onClick={() => { track('caracteristica', feat.n); set({ incluye: [...p.incluye, feat] }); setFeat({ n: '', l: 'Ilimitado' }); }}>Agregar</button>
            </div>
          </div>
          <div className="chips" style={{ gap: 6, alignItems: 'center' }}><span className="t-help">Ideas:</span>{['Certificado', 'Descargables', 'Soporte'].map((s) => <button key={s} className="chip m idea" onClick={() => setFeat({ ...feat, n: s })}>+ {s}</button>)}</div>
        </div>
        <div className="preview-checkout">
          <span className="t-help">Así lo ve tu cliente</span>
          <div className="card" style={{ padding: 16 }}>
            <div className="t-label">{p.nombre || 'Tu plan'}</div>
            <div className="t-m" style={{ marginTop: 4 }}>{PESOS(p.cobros.find((c) => c.frec !== 'Una vez')?.monto || p.cobros[0]?.monto)} <span className="t-help">/ mes</span></div>
            <div className="t-help" style={{ margin: '10px 0 6px' }}>Incluye</div>
            {p.incluye.map((f, i) => <div key={i} className="t-small" style={{ display: 'flex', gap: 6, color: 'var(--texto)' }}><Check size={14} style={{ marginTop: 3 }} /><span>{f.n}<br /><span className="t-help">{f.l}</span></span></div>)}
          </div>
        </div>
      </div>) },
    { id: 'descuentos', stage: 2, title: 'Descuentos y prueba gratis', sub: 'Automáticos o con código, en un solo lugar.',
      render: () => (<div className="gap-col">
        <div className="field"><span className="t-label">Descuentos que aplican a este plan</span><Pills multi options={['Descuento hermanos · 15%', 'Pago anual · 10%', 'Cupón PRIMAVERA27']} value={p.descuentos} onChange={(v) => set({ descuentos: v })} /></div>
        <Switch on={p.prueba} onChange={(v) => set({ prueba: v })} label="Ofrecer prueba gratis" desc="El primer cobro se hace al terminar la prueba." />
        {p.prueba && (<>
          <TextField label="Días de prueba" value={p.pruebaDias} onChange={(v) => set({ pruebaDias: v.replace(/\D/g, '') })} />
          <div className="field"><span className="t-label">¿Pedir la tarjeta al inscribirse?</span>
            <Options options={[{ t: 'Sí, es obligatoria', d: 'Se cobra solo al terminar la prueba. Menos abandonos.' }, { t: 'No, puede agregarla después', d: 'Más gente prueba. Le pedimos la tarjeta antes de que termine.' }]} value={p.pruebaTarjeta} onChange={(v) => { track('prueba_tarjeta', v); set({ pruebaTarjeta: v }); }} /></div>
          {p.pruebaTarjeta === 'Sí, es obligatoria'
            ? <div className="field"><span className="t-label">Al terminar la prueba</span><Pills options={['Cobra automáticamente', 'Pide confirmación']} value="Cobra automáticamente" onChange={() => {}} /></div>
            : <div className="aviso" style={{ flexDirection: 'column', gap: 2 }}><span className="t-label">3 días antes de terminar, le enviamos un link para agregar su tarjeta.</span><span className="t-help">Si no la agrega, la suscripción queda en pausa y puede retomarla cuando quiera. En tu checkout verán «Prueba {p.pruebaDias} días gratis · sin tarjeta».</span></div>}
        </>)}
      </div>) },
    { id: 'permanencia', stage: 2, title: '¿Hay permanencia mínima?', sub: 'Cuánto dura el compromiso y qué pasa si se retira antes.',
      render: () => (<div className="gap-col">
        <SegmentoRow {...segProps} value={p.permSeg} nombre={p.reglaSegNombre} onChange={(v) => set({ permSeg: v })} onNombre={(v) => set({ reglaSegNombre: v })} />
        <Switch on={p.permanencia} onChange={(v) => set({ permanencia: v })} label="Exigir permanencia mínima" desc="El cliente se compromete por un período." />
        {p.permanencia && (<>
          <div className="field"><span className="t-label">Duración mínima</span><Pills options={['3 meses', '6 meses', '10 meses', '12 meses']} value={p.permMeses} onChange={(v) => set({ permMeses: v })} /></div>
          <div className="field"><span className="t-label">Si se retira antes</span><Pills options={['Paga el saldo pendiente', 'Paga una multa', 'Sale sin costo']} value={p.permSalida} onChange={(v) => set({ permSalida: v })} /></div>
        </>)}
      </div>) },
    { id: 'reintentos', stage: 2, title: '¿Qué pasa si un cobro falla?', sub: 'Puedes usar la regla estándar, cambiarla aquí mismo o crear una desde cero. También puedes darle a un segmento su propia regla.',
      render: () => {
        const seg = p.reglaSeg === 'segmento';
        const opciones = seg
          ? [{ t: `Regla de ${p.reglaSegNombre}`, d: p.reglaSegNombre === 'VIP' ? '5 reintentos en 15 días · sin aviso de mora' : 'Configurada en Segmentos' }, { t: 'Estándar · regla general', d: '3 reintentos en 7 días · aviso por correo y WhatsApp' }]
          : [{ t: 'Estándar · regla general', d: '3 reintentos en 7 días · aviso por correo y WhatsApp · pausa al cuarto intento' }, { t: 'Colegios · flexible', d: '5 reintentos en 15 días · sin pausa' }];
        const editando = p.regla === 'Estándar · regla general' && p.reglaEditada;
        return (<div className="gap-col">
          <SegmentoRow {...segProps} value={p.reglaSeg} nombre={p.reglaSegNombre} onChange={(v) => set({ reglaSeg: v, regla: v === 'segmento' ? `Regla de ${p.reglaSegNombre}` : 'Estándar · regla general', reglaEditada: false })} onNombre={(v) => set({ reglaSegNombre: v, regla: `Regla de ${v}` })} />
          <Options cols={1} options={opciones} value={p.regla} onChange={(v) => set({ regla: v, reglaEditada: false })} />
          {p.regla === 'Estándar · regla general' && !editando && <button className="flink" style={{ alignSelf: 'flex-start' }} onClick={() => { track('editar_estandar'); set({ reglaEditada: true }); }}>Editar la estándar aquí</button>}
          <DesdeCero title={seg ? `Crear una regla desde cero para ${p.reglaSegNombre}` : 'Crear una regla desde cero'} desc={seg ? `Solo para los clientes ${p.reglaSegNombre} de este plan` : 'Para este plan, o para el segmento que elijas'} on={p.regla === 'Desde cero'} onClick={() => { track('desde_cero', 'reintentos'); set({ regla: 'Desde cero', reintentos: ['2 días'], canales: ['Correo'], siFalla: '' }); }} />
          {(editando || p.regla === 'Desde cero') && (
            <div className="editor">
              <div style={{ display: 'flex', alignItems: 'center' }}><span className="t-label" style={{ flex: 1 }}>{p.regla === 'Desde cero' ? 'Regla nueva' : 'Estándar · editando para este plan'}</span>{editando && <button className="flink" style={{ fontSize: 13 }} onClick={() => set({ reglaEditada: false, reintentos: ['1 día', '3 días', '7 días'] })}>Restablecer</button>}</div>
              {p.regla === 'Desde cero' && <TextField label="Nombre de la regla" value={p.reglaNombre} onChange={(v) => set({ reglaNombre: v })} placeholder="Ej: Cuotas colegio · flexible" />}
              {p.reintentos.map((r, i) => (
                <div key={i} className="reintento"><span className="t-small" style={{ width: 90 }}>Reintento {i + 1}</span>
                  <select className="input select" style={{ width: 'auto', height: 36, padding: '4px 36px 4px 12px' }} value={r} onChange={(e) => set({ reintentos: p.reintentos.map((x, k) => (k === i ? e.target.value : x)) })}>{['1 día', '2 días', '3 días', '5 días', '7 días', '10 días', '15 días'].map((d) => <option key={d}>{d}</option>)}</select>
                  <span className="t-help">después del cobro fallido</span>
                  <button className="icon-btn" aria-label="Quitar reintento" onClick={() => set({ reintentos: p.reintentos.filter((_, k) => k !== i) })}><X size={14} /></button></div>
              ))}
              <button className="flink" style={{ alignSelf: 'flex-start', fontSize: 13 }} onClick={() => set({ reintentos: [...p.reintentos, '10 días'] })}>+ Agregar reintento</button>
              <div className="field"><span className="t-help">Avisar por</span><Pills multi options={['Correo', 'WhatsApp', 'SMS']} value={p.canales} onChange={(v) => set({ canales: v })} /></div>
              <div className="field"><span className="t-help">Si todo falla</span><Pills options={['Pausar la suscripción', 'Cancelarla', 'Seguir intentando']} value={p.siFalla} onChange={(v) => set({ siFalla: v })} /></div>
            </div>
          )}
          {seg && <div className="aviso"><Check size={17} /><div className="t-small" style={{ color: 'var(--texto)' }}>Así queda este plan: <b>{p.reglaSegNombre}</b> → {p.regla} · Todos los demás → Estándar</div></div>}
        </div>);
      } },
    { id: 'avisos', stage: 2, title: 'Avisos a tu cliente', sub: 'Recordatorios y comprobantes. Por defecto usamos los avisos generales de tu cuenta.',
      render: () => (<div className="gap-col">
        <SegmentoRow {...segProps} value={p.avisosSeg} nombre={p.reglaSegNombre} onChange={(v) => set({ avisosSeg: v })} onNombre={(v) => set({ reglaSegNombre: v })} />
        <div className="dos">
          <Options cols={1} options={[{ t: 'Estándar · avisos generales', d: 'Ajústalos abajo; solo cambian para este plan' }]} value={p.avisos} onChange={() => set({ avisos: 'Estándar · avisos generales' })} />
          <DesdeCero title="Crear desde cero" desc="Arma tus propios avisos" on={p.avisos === 'Desde cero'} onClick={() => { track('desde_cero', 'avisos'); set({ avisos: 'Desde cero' }); }} />
        </div>
        {p.avisos !== 'Desde cero'
          ? <div className="gap-col" style={{ gap: 12 }}>{Object.entries(p.avisosOn).map(([k, v]) => <Switch key={k} on={v} label={k} onChange={(nv) => set({ avisosOn: { ...p.avisosOn, [k]: nv } })} />)}</div>
          : <div className="lista">{[['Recordatorio antes de cobrar', '5 días antes · WhatsApp'], ['Comprobante de pago', 'Al pagar · correo']].map(([a, d]) => <div key={a} className="lista-fila"><span style={{ flex: 1 }}><span className="t-label" style={{ display: 'block' }}>{a}</span><span className="t-help">{d}</span></span><span className="flink" style={{ fontSize: 13 }}>Editar</span></div>)}<div className="lista-fila"><span className="flink" style={{ fontSize: 13 }}>+ Agregar aviso</span></div></div>}
      </div>) },
    { id: 'cancelacion', stage: 2, title: 'Cancelación', sub: 'Qué puede hacer tu cliente desde su portal y qué le preguntamos si se va.', cta: 'Revisar plan',
      render: () => (<div className="gap-col">
        <SegmentoRow {...segProps} value={p.cancelSeg} nombre={p.reglaSegNombre} onChange={(v) => set({ cancelSeg: v })} onNombre={(v) => set({ reglaSegNombre: v })} />
        <div className="dos">
          <Options cols={1} options={[{ t: 'Estándar de tu cuenta', d: 'Motivos y opciones generales · edítalos abajo' }]} value={p.cancel} onChange={() => set({ cancel: 'Estándar de tu cuenta' })} />
          <DesdeCero title="Crear desde cero" desc="Pregunta y motivos solo para este plan" on={p.cancel === 'Desde cero'} onClick={() => { track('desde_cero', 'cancelacion'); set({ cancel: 'Desde cero', motivos: [] }); }} />
        </div>
        <Switch on={p.cancelPortal} onChange={(v) => set({ cancelPortal: v })} label="Puede cancelar desde su portal" desc="Respetando la permanencia mínima." />
        <Switch on={p.cancelMotivo} onChange={(v) => set({ cancelMotivo: v })} label="Pedir motivo al cancelar" />
        <Switch on={p.pausa} onChange={(v) => { track('pausa', String(v)); set({ pausa: v }); }} label="Puede pausar su plan" desc="Sin perder su lugar ni su precio. No se cobra mientras está en pausa." />
        {p.pausa && (<div className="sub-ajustes">
          <div className="field"><span className="t-help">Hasta cuánto tiempo</span><Pills options={['1 mes', '2 meses', '3 meses', 'Lo que necesite']} value={p.pausaMax} onChange={(v) => set({ pausaMax: v })} /></div>
          <div className="field"><span className="t-help">Cuántas veces al año</span><Pills options={['1 vez', '2 veces', 'Sin límite']} value={p.pausaVeces} onChange={(v) => set({ pausaVeces: v })} /></div>
          <div className="field"><span className="t-help">Mientras está en pausa</span><Pills options={['No se cobra', 'Cobra un monto reducido']} value={p.pausaCobro} onChange={(v) => set({ pausaCobro: v })} /></div>
          <span className="t-help">Al terminar la pausa se reactiva sola y le avisamos 3 días antes.</span>
        </div>)}
        {p.cancelMotivo && (<div className="field"><div style={{ display: 'flex' }}><span className="t-label" style={{ flex: 1 }}>Motivos (tu cliente elige uno)</span><span className="t-help" style={{ color: p.motivos.length >= 10 ? 'var(--naranja-tinta)' : undefined, fontWeight: 500 }}>{p.motivos.length} de 10</span></div>
          <div className="chips" style={{ gap: 6 }}>{p.motivos.map((m) => <span key={m} className="chip m" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{m}<button aria-label={`Quitar ${m}`} onClick={() => set({ motivos: p.motivos.filter((x) => x !== m) })}><X size={12} /></button></span>)}</div>
          {p.motivos.length < 10 ? (
            <div style={{ display: 'flex', gap: 8 }}><input className="input" value={motivo} placeholder="Agregar motivo" onChange={(e) => setMotivo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && motivo.trim()) { set({ motivos: [...p.motivos, motivo] }); setMotivo(''); } }} /><button className="btn btn-secondary" disabled={!motivo.trim()} onClick={() => { set({ motivos: [...p.motivos, motivo] }); setMotivo(''); }}>Agregar</button></div>
          ) : <span className="t-help" style={{ color: 'var(--naranja-tinta)' }}>Llegaste al máximo de 10 motivos. Quita uno para agregar otro.</span>}
          <span className="t-help">Máximo 10 motivos: con pocas opciones tu cliente elige más rápido.</span>
        </div>)}
      </div>) },
    { id: 'revisar', stage: 3, title: 'Revisa el plan antes de publicarlo', sub: 'Así lo verá tu cliente. Toca «Editar» en cualquier parte para cambiarla.', cta: 'Publicar plan', wide: true,
      render: () => {
        const ir = (id) => { track('editar_desde_revision', id); setIdx(STEP_IDS.indexOf(id)); };
        const sec = [
          ['Producto', p.productos.join(', '), 'productos'],
          ['Cobros', p.cobros.map((c) => `${c.nombre} ${PESOS(c.monto)}${c.frec === 'Cuotas' ? ` · ${c.cuotas} cuotas` : c.frec === 'Una vez' ? ' · una vez' : ` · ${c.frec.toLowerCase()}`}`).join(' · ') || '—', 'cobros'],
          ['Fechas', `${p.fechaTipo === 'Rango' ? `De ${p.rangoDesde} a ${p.rangoHasta}` : `Primer cobro ${p.primerCobro}`} · ${p.dia}${p.cobros.some((c) => c.frec === 'Una vez') ? ` · matrícula: ${p.matricula.toLowerCase()}` : ''}`, 'fechas'],
          ['Si un cobro falla', `${p.reglaSeg === 'segmento' ? `${p.reglaSegNombre} → ${p.regla} · Demás → Estándar` : p.regla}${p.reglaEditada ? ' (editada para este plan)' : ''}`, 'reintentos'],
          ['Avisos y cancelación', `${p.avisos} · ${p.cancel}${p.pausa ? ` · pausa hasta ${p.pausaMax}` : ''}`, 'avisos'],
          ['Condiciones', `${p.permanencia ? `Permanencia ${p.permMeses}` : 'Sin permanencia'}${p.prueba ? ` · prueba ${p.pruebaDias} días ${p.pruebaTarjeta.startsWith('Sí') ? 'con tarjeta' : 'sin tarjeta'}` : ''}${p.descuentos.length ? ` · ${p.descuentos.join(', ')}` : ''}`, 'permanencia'],
        ];
        return (<div className="revisar">
          <div className="checklist">{['Productos', 'Cobros', 'Condiciones', 'Avisos y cancelación'].map((t) => <span key={t}><Check size={14} />{t}</span>)}<span className="t-help" style={{ marginLeft: 'auto' }}>Siguiente: eliges el link</span></div>
          <div className="revisar-grid">
            <div className="card" style={{ padding: 20 }}>
              <span className="t-help">Así lo verá tu cliente</span>
              <div className="t-m" style={{ marginTop: 10 }}>{p.nombre}</div>
              <div className="t-xl" style={{ fontSize: 32, marginTop: 4 }}>{PESOS(p.cobros.reduce((a, c, i) => a + (i === 0 || c.frec === 'Una vez' ? Number(c.monto || 0) : 0), 0))} <span className="t-help">el primer pago</span></div>
              <div className="lista" style={{ marginTop: 14 }}>{p.cobros.map((c, i) => <div key={i} className="lista-fila"><span style={{ flex: 1 }}><span className="t-label" style={{ display: 'block' }}>{c.nombre}</span><span className="t-help">{c.frec === 'Cuotas' ? `${c.cuotas} cuotas` : c.frec}</span></span><span className="t-label">{PESOS(c.monto)}</span></div>)}</div>
            </div>
            <div className="card" style={{ padding: 0 }}>
              {sec.map(([t, v, id]) => <div key={t} className="rev-fila"><span style={{ flex: 1, minWidth: 0 }}><span className="t-help" style={{ display: 'block' }}>{t}</span><span className="t-label">{v}</span></span><button className="flink" style={{ fontSize: 13 }} onClick={() => ir(id)}>Editar</button></div>)}
            </div>
          </div>
        </div>);
      } },
  ];
}
const STEP_IDS = ['plantilla', 'productos', 'nombre', 'cobros', 'fechas', 'incluye', 'descuentos', 'permanencia', 'reintentos', 'avisos', 'cancelacion', 'revisar'];

/* ---------------- Modal genérico ---------------- */
function Modal({ title, sub, children, onClose, primary, onPrimary, disabled, danger, wide, xwide, head, secondary = 'Cancelar', onSecondary }) {
  return (
    <div className="edit-veil" style={{ position: 'fixed', zIndex: 70 }} onClick={onClose}>
      <div className="edit-card pop" style={{ width: xwide ? 'min(1000px,100%)' : wide ? 'min(620px,100%)' : 'min(500px,100%)' }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="modal-head">
          <h2 className="t-m">{title}</h2>
          {sub && <p className="t-small">{sub}</p>}
          {head}
        </div>
        <div className="edit-body" style={{ gap: 14 }}>{children}</div>
        <div className="edit-foot" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-s" onClick={onSecondary || onClose}>{secondary}</button>
          <button className={`btn btn-primary btn-s${danger ? ' danger' : ''}`} disabled={disabled} onClick={onPrimary}>{primary}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Link del plan · UTM y meta tags ---------------- */
function LinkStep({ p, set, onBack, onPublish }) {
  const [utmOpen, setUtmOpen] = useState(false);
  const [tab, setTab] = useState('UTM');
  const [draft, setDraft] = useState({ utms: p.utms.length ? p.utms : [], meta: { ...p.meta, title: p.meta.title || `${p.nombre} · Academia Andes`, desc: p.meta.desc || p.descripcion || 'Inscríbete y paga online en minutos.' } });
  const [abierto, setAbierto] = useState(p.utms.length ? null : 'nuevo-elegir'); // índice en edición | 'nuevo-elegir' | null
  const [utmOn, setUtmOn] = useState(p.utm.on || p.utms.length > 0);
  const base = `pagar.academiaandes.cl/${p.slug}`;
  const utmQ = (u) => (u && (u.source || u.medium || u.campaign) ? `?${[['utm_source', u.source], ['utm_medium', u.medium], ['utm_campaign', u.campaign]].filter(([, v]) => v).map(([k, v]) => `${k}=${slugify(v)}`).join('&')}` : '');
  const updU = (i, patch) => setDraft((d) => ({ ...d, utms: d.utms.map((u, k) => (k === i ? { ...u, ...patch } : u)) }));
  const elegirCanal = ([n, s, m]) => { track('utm_canal', n); setDraft((d) => ({ ...d, utms: [...d.utms, { n: n === 'Personalizado' ? 'Mi link' : n, source: s, medium: m, campaign: 'matricula-2027', nuevo: true }] })); setAbierto(draft.utms.length); };
  const guardarUtm = (i) => { track('utm_guardado_item', draft.utms[i].n); setAbierto(null); };
  const configurado = p.utms.length || p.meta.title;
  return (
    <Shell name="Camila" proceso="Nuevo plan" stages={STAGES_P} stageIdx={3} fill={0.75} onHelp={() => {}} onExit={onBack} help={false} closeHelp={() => {}} helpCtx={['Link', 13, {}]} wide
      footer={<><span className="t-help note">Puedes cambiar el link después</span><button className="btn btn-secondary" onClick={onBack}>Atrás</button><button className="btn btn-primary" disabled={!p.slug} onClick={onPublish}>Publicar con este link</button></>}>
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
        <h1 className="t-l q-title">Elige cómo se verá el link del plan</h1>
        <p className="t-body q-sub" style={{ marginBottom: 20 }}>Lo armamos con el nombre del plan. Puedes cambiar el final antes de publicarlo.</p>
        <div className="link-grid">
          <div className="gap-col">
            <div className="field"><span className="t-label">Dirección del link</span>
              <div className="slug"><span>pagar.academiaandes.cl/</span><input value={p.slug} onChange={(e) => set({ slug: slugify(e.target.value) || '' })} aria-label="Final del link" /></div>
              <span className="t-help" style={{ color: 'var(--ok-texto)' }}>{p.slug ? 'Disponible · Usa minúsculas y guiones.' : 'Escribe el final del link.'}</span></div>
            <button type="button" className="entrada" onClick={() => { track('utm_abierto'); setUtmOpen(true); }}>
              <span style={{ flex: 1, textAlign: 'left' }}><span className="t-label" style={{ display: 'block' }}>UTM y meta tags</span><span className="t-help">{configurado ? `${p.utms.length ? `${p.utms.length} link${p.utms.length > 1 ? 's' : ''} con UTM (${p.utms.map((u) => u.n).join(', ')})` : 'Sin UTM'} · Píxel y Analytics activos` : 'Opcional · rastrea por dónde llegan y cómo se ve al compartir'}</span></span>
              <span className="btn btn-secondary btn-s">{configurado ? 'Editar' : 'Configurar'}</span>
            </button>
            <div className="aviso"><Link2 size={17} /><div className="t-small" style={{ color: 'var(--texto)', overflowWrap: 'anywhere' }}>{base}{utmQ(p.utm)}</div></div>
          </div>
          <div className="preview-checkout">
            <span className="t-help">Así se ve al abrirlo</span>
            <div className="card" style={{ padding: 16 }}>
              <div className="t-help" style={{ marginBottom: 8, overflowWrap: 'anywhere' }}>{base}</div>
              <div className="t-label">Academia Andes</div>
              <div className="t-m" style={{ marginTop: 4 }}>{p.nombre}</div>
              <div className="t-l" style={{ marginTop: 6 }}>{PESOS(p.cobros[0]?.monto)}</div>
              <div style={{ height: 10 }} />
              {['Nombre y apellido', 'Correo', 'Número de tarjeta'].map((l) => <div key={l} className="fake-input">{l}</div>)}
              <div className="btn btn-primary btn-block btn-s" style={{ marginTop: 8, background: '#2346d8' }}>Pagar {PESOS(p.cobros[0]?.monto)}</div>
            </div>
          </div>
        </div>
      </div>
      {utmOpen && (
        <Modal wide title="UTM y meta tags" sub="Opcional. Puedes cambiarlo después desde el link." primary="Guardar" onClose={() => setUtmOpen(false)} head={<Seg options={['UTM', 'Meta tags']} value={tab} onChange={setTab} />}
          onPrimary={() => { const utms = utmOn ? draft.utms.map(({ nuevo: _n, ...u }) => u) : []; const f = utms[0]; track('utm_guardado', utms.map((u) => `${u.source}/${u.medium}/${u.campaign}`).join(' | ')); set({ utms, utm: f ? { on: true, source: f.source, medium: f.medium, campaign: f.campaign } : { on: false, source: '', medium: '', campaign: '' }, meta: draft.meta }); setUtmOpen(false); }}>
          {tab === 'UTM' ? (<>
            <Switch on={utmOn} onChange={setUtmOn} label="Agregar parámetros UTM" desc="Se suman al final del link para saber por dónde llega cada pago." />
            {utmOn && (<div className="gap-col" style={{ gap: 10 }}>
              {draft.utms.map((u, i) => abierto === i ? (
                <div key={i} className="utm-item on">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="utm-badge">{u.n.slice(0, 2).toUpperCase()}</span><input className="input utm-nombre" value={u.n} onChange={(e) => updU(i, { n: e.target.value })} aria-label="Nombre del link" /><button className="flink" style={{ fontSize: 13 }} onClick={() => { setDraft((d) => ({ ...d, utms: d.utms.filter((_, k) => k !== i) })); setAbierto(null); }}>Quitar</button></div>
                  {u.nuevo && u.source && <div className="aviso naranja"><span className="t-small">Completamos fuente y medio por ser «{u.n}». Cambia la campaña si quieres.</span></div>}
                  <div className="tres">
                    <TextField label="Fuente" value={u.source} onChange={(v) => updU(i, { source: v })} placeholder="instagram" help="utm_source" />
                    <TextField label="Medio" value={u.medium} onChange={(v) => updU(i, { medium: v })} placeholder="bio" help="utm_medium" />
                    <TextField label="Campaña" value={u.campaign} onChange={(v) => updU(i, { campaign: v })} placeholder="matricula-2027" help="utm_campaign" />
                  </div>
                  <div className="aviso"><Link2 size={17} /><div><div className="t-help">Link final</div><div className="t-small" style={{ color: 'var(--texto)', overflowWrap: 'anywhere' }}>{base}{utmQ(u)}</div></div></div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button className="btn btn-secondary btn-s" onClick={() => setAbierto(null)}>Cancelar</button><button className="btn btn-primary btn-s" disabled={!u.source} onClick={() => guardarUtm(i)}>Guardar UTM</button></div>
                </div>
              ) : (
                <div key={i} className={`utm-item${u.nuevo && abierto === null ? ' nuevo' : ''}`}>
                  <span className="utm-badge">{u.n.slice(0, 2).toUpperCase()}</span>
                  <span style={{ flex: 1, minWidth: 0 }}><span className="t-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{u.n}{u.nuevo && abierto === null && <span className="tag ok" style={{ padding: '1px 8px', fontSize: 11 }}>Nuevo</span>}</span><span className="t-help">{u.source || '—'} · {u.medium || '—'} · {u.campaign || '—'}</span></span>
                  <button className="btn btn-secondary btn-s" onClick={() => track('utm_copiado', u.n)}>Copiar link</button>
                  <button className="icon-btn" aria-label={`Editar ${u.n}`} onClick={() => setAbierto(i)}><Pencil size={15} /></button>
                </div>
              ))}
              {abierto === 'nuevo-elegir' ? (
                <div className="utm-elegir">
                  <span className="t-label">¿Dónde vas a compartir este link?</span>
                  <span className="t-help">Completamos fuente y medio por ti. Puedes cambiarlos.</span>
                  <div className="chips" style={{ gap: 8 }}>{CANALES_UTM.filter(([n]) => !draft.utms.some((u) => u.n === n)).map((c) => <button key={c[0]} className="chip m" onClick={() => elegirCanal(c)}>{c[0]}</button>)}</div>
                  {draft.utms.length > 0 && <button className="flink" style={{ alignSelf: 'flex-start', fontSize: 13 }} onClick={() => setAbierto(null)}>Cancelar</button>}
                </div>
              ) : abierto === null && <button className="agregar-utm" onClick={() => { track('utm_agregar'); setAbierto('nuevo-elegir'); }}><Plus size={16} />Agregar UTM para otra red o formato</button>}
              <span className="t-help">{draft.utms.length > 1 ? `${draft.utms.length} links con UTM. ` : ''}Cada pago guarda su origen: compáralos en «Compartir y medir».</span>
            </div>)}
          </>) : (<>
            <TextField label="Título (meta title)" value={draft.meta.title} onChange={(v) => setDraft({ ...draft, meta: { ...draft.meta, title: v } })} help={`${draft.meta.title.length}/60 · lo que se ve en Google y al compartir`} />
            <TextArea label="Descripción (meta description)" value={draft.meta.desc} max={160} onChange={(v) => setDraft({ ...draft, meta: { ...draft.meta, desc: v } })} />
            <div className="share"><div className="share-img">{p.nombre}</div><div style={{ padding: '8px 10px' }}><div className="t-label">{draft.meta.title}</div><div className="t-help">{draft.meta.desc}</div><div className="t-help">pagar.academiaandes.cl</div></div></div>
            <Switch on={draft.meta.index} onChange={(v) => setDraft({ ...draft, meta: { ...draft.meta, index: v } })} label="Mostrar en buscadores" desc="Si lo apagas, agregamos «noindex»." />
            <div className="field">
              <div style={{ display: 'flex', alignItems: 'center' }}><span className="t-label" style={{ flex: 1 }}>Píxeles y analítica</span><span className="t-help">Gestionar en Integraciones ›</span></div>
              {[['pixelOn', 'Meta Pixel', 'f', '1043 2287 6610'], ['gaOn', 'Google Analytics', 'G', 'G-8XK2LQ7M1T']].map(([k, n, l, id]) => (
                <div key={k} className="utm-item">
                  <span className="utm-badge">{l}</span>
                  <span style={{ flex: 1, minWidth: 0 }}><span className="t-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{n}<span className={`tag ${draft.meta[k] ? 'neutral' : 'naranja'}`} style={{ padding: '1px 8px', fontSize: 11 }}>{draft.meta[k] ? 'Por defecto' : 'Apagado en este link'}</span></span><span className="t-help">{draft.meta[k] ? `${id} · de tu cuenta` : 'Sigue activo en tus otros links'}</span></span>
                  <button type="button" className={`switch${draft.meta[k] ? ' on' : ''}`} aria-label={n} onClick={() => { track('pixel', `${n} ${!draft.meta[k]}`); setDraft({ ...draft, meta: { ...draft.meta, [k]: !draft.meta[k] } }); }} />
                </div>
              ))}
              <span className="t-help">Se activan solos en todos tus links. Apágalos si no quieres medir este link.</span>
            </div>
          </>)}
        </Modal>
      )}
    </Shell>
  );
}

/* ---------------- Plan publicado ---------------- */
function Publicado({ p, onCatalog }) {
  const z = useFit(820);
  const [copiado, setCopiado] = useState(false);
  const [correo, setCorreo] = useState(false);
  const [qr, setQr] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [mail, setMail] = useState({ para: ['camila@correo.cl', 'pedro.soto@correo.cl', 'josefa.munoz@correo.cl'], extra: '', asunto: `Ya puedes inscribirte en ${p.nombre}`, cuerpo: `Hola {nombre},\n\nAbrimos inscripciones para ${p.nombre}. Puedes pagar en línea con tarjeta o transferencia desde este link.\n\n¡Te esperamos!\nAcademia Andes` });
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(null), 3600); return () => clearTimeout(t); }, [aviso]);
  const conf = useMemo(() => Array.from({ length: 36 }, (_, i) => ({ left: Math.random() * 100, delay: Math.random() * 4, dur: 5 + Math.random() * 5, c: ['#ff5b2e', '#a78bfa', '#5c8ff2', '#f9bf2e', '#12a37a'][i % 5], w: 6 + Math.random() * 6 })), []);
  const q = p.utm.on && p.utm.source ? `?utm_source=${slugify(p.utm.source)}${p.utm.medium ? `&utm_medium=${slugify(p.utm.medium)}` : ''}${p.utm.campaign ? `&utm_campaign=${slugify(p.utm.campaign)}` : ''}` : '';
  return (
    <div className="celebra">
      {conf.map((c, i) => <span key={i} className="confeti" style={{ left: `${c.left}%`, width: c.w * 0.6, height: c.w * 1.6, background: c.c, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s`, opacity: .7 }} />)}
      <div className="premio fade-in" style={z < 1 ? { zoom: z } : null}>
        <div className="medalla">
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(255,91,46,.08)' }} />
          <div style={{ position: 'absolute' }}><Ring pct={1} size={112} stroke={9}><span /></Ring></div>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#ff7a4d,#ee4d1f)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 20px -6px rgba(238,77,31,.45)', position: 'relative' }}><Check color="#fff" size={36} strokeWidth={3} /></div>
        </div>
        <div style={{ height: 20 }} />
        <div className="t-label" style={{ color: 'var(--naranja-tinta)' }}>¡Bien hecho!</div>
        <h1 className="t-xl" style={{ marginTop: 8 }}>«{p.nombre}» ya está publicado</h1>
        <p className="t-body" style={{ marginTop: 10, fontSize: 18 }}>Comparte el link y empieza a recibir inscripciones.</p>
        <div style={{ height: 22 }} />
        <div className="aviso" style={{ width: '100%', alignItems: 'center', textAlign: 'left' }}><Link2 size={17} /><span className="t-small" style={{ flex: 1, color: 'var(--texto)', overflowWrap: 'anywhere' }}>pagar.academiaandes.cl/{p.slug}{q}</span></div>
        <div className="compartir">
          <button className="btn btn-secondary btn-s" onClick={() => { track('link_copiado'); setCopiado(true); }}><Copy size={15} />{copiado ? 'Copiado' : 'Copiar link'}</button>
          <button className="btn btn-secondary btn-s" onClick={() => { track('compartir', 'whatsapp'); setAviso('Abrimos WhatsApp con el link listo para enviar'); }}><MessageCircle size={15} />Enviar por WhatsApp</button>
          <button className="btn btn-secondary btn-s" onClick={() => { track('compartir', 'correo'); setCorreo(true); }}><Mail size={15} />Enviar por correo</button>
          <button className="btn btn-secondary btn-s" onClick={() => { track('compartir', 'qr'); setQr(true); }}><QrCode size={15} />Código QR</button>
        </div>
        <div style={{ height: 24 }} />
        <div className="m-pin" style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={onCatalog}>Ir al catálogo</button>
        </div>
      </div>
      {correo && (
        <Modal xwide title="Enviar el link por correo" primary={`Enviar a ${mail.para.length} persona${mail.para.length === 1 ? '' : 's'}`} disabled={!mail.para.length || !mail.asunto.trim()} onClose={() => setCorreo(false)}
          onPrimary={() => { track('correo_enviado', String(mail.para.length)); setCorreo(false); setAviso(`Link enviado a ${mail.para.length} persona${mail.para.length === 1 ? '' : 's'}. Te avisamos cuando alguien pague.`); }}>
          <div className="correo-grid">
            <div className="gap-col" style={{ gap: 14, minWidth: 0 }}>
              <div className="field"><span className="t-label">Para</span>
                <div className="para">{mail.para.map((e) => <span key={e} className="chip-mail">{e}<button aria-label={`Quitar ${e}`} onClick={() => setMail({ ...mail, para: mail.para.filter((x) => x !== e) })}><X size={12} /></button></span>)}
                  <input value={mail.extra} placeholder="Agregar correo o cliente" onChange={(e) => setMail({ ...mail, extra: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && mail.extra.includes('@') && mail.para.length < 20) setMail({ ...mail, para: [...mail.para, mail.extra.trim()], extra: '' }); }} /></div>
                <span className="t-help">{mail.para.length} de 20 · presiona Enter para agregar</span></div>
              <TextField label="Asunto" value={mail.asunto} onChange={(v) => setMail({ ...mail, asunto: v })} />
              <TextArea label="Mensaje" value={mail.cuerpo} max={800} rows={7} onChange={(v) => setMail({ ...mail, cuerpo: v })} />
              <div className="chips" style={{ gap: 6, alignItems: 'center' }}><span className="t-help">Insertar:</span>{['{nombre}', '{precio}'].map((x) => <button key={x} className="chip m" onClick={() => setMail({ ...mail, cuerpo: `${mail.cuerpo} ${x}` })}>{x}</button>)}</div>
            </div>
            <div className="gap-col" style={{ gap: 8, minWidth: 0 }}>
              <span className="t-help">Así lo verá {(mail.para[0] || 'tu cliente').split('@')[0].split('.')[0].replace(/^./, (c) => c.toUpperCase())}</span>
              <div className="correo-prev">
                <div className="correo-mail">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="utm-badge" style={{ background: 'var(--texto)', color: '#fff' }}>AA</span><span><span className="t-label" style={{ display: 'block' }}>Academia Andes</span><span className="t-help">pagos@academiaandes.cl{mail.para[0] ? ` · para ${mail.para[0]}` : ''}</span></span></div>
                  <div className="t-m" style={{ fontSize: 17 }}>{mail.asunto || 'Sin asunto'}</div>
                  <div className="t-small" style={{ whiteSpace: 'pre-line', color: 'var(--texto)' }}>{mail.cuerpo.replaceAll('{nombre}', (mail.para[0] || 'Camila').split('@')[0].split('.')[0].replace(/^./, (c) => c.toUpperCase())).replaceAll('{precio}', PESOS(p.cobros[0]?.monto))}</div>
                  <div className="correo-cta"><span style={{ flex: 1 }}><span className="t-label" style={{ display: 'block' }}>{p.nombre}</span><span className="t-help">{PESOS(p.cobros.find((c) => c.frec !== 'Una vez')?.monto || p.cobros[0]?.monto)}</span></span><span className="btn btn-primary btn-s">Pagar</span></div>
                  <span className="t-help">Pago seguro con Reveniu · pagar.academiaandes.cl/{p.slug}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="aviso"><Mail size={16} /><span className="t-small">Esto no reemplaza tu email marketing: sirve para enviar el link a pocas personas (hasta 20 por envío). Para campañas o listas grandes, usa tu herramienta de correo y pega el link.</span></div>
        </Modal>
      )}
      {qr && (
        <Modal title="Código QR del plan" sub={`Al escanearlo se abre el checkout de ${p.nombre}. Imprímelo en afiches, flyers o en tu mostrador.`} primary="Descargar PNG" secondary="SVG para imprimir" onSecondary={() => { track('qr_svg'); setQr(false); setAviso('Descargamos el QR en SVG'); }} onClose={() => setQr(false)} onPrimary={() => { track('qr_png'); setQr(false); setAviso('Descargamos el QR en PNG'); }}>
          <div className="qr-box"><QrFake seed={p.slug} /><span className="t-small" style={{ overflowWrap: 'anywhere' }}>pagar.academiaandes.cl/{p.slug}</span></div>
        </Modal>
      )}
      {aviso && <div className="toast pop" style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Check size={16} />{aviso}</div>}
    </div>
  );
}

/* QR de muestra (no escaneable): patrón estable a partir del slug */
function QrFake({ seed = 'x' }) {
  const n = 25; let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100) / 100; };
  const finder = (x, y) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7);
  const fill = (x, y) => { for (const [a, b] of [[0, 0], [n - 7, 0], [0, n - 7]]) { if (x >= a && x < a + 7 && y >= b && y < b + 7) { const i = x - a, j = y - b; return i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4); } } return rnd() > 0.52; };
  const cells = []; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (fill(x, y)) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
  return <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} width="180" height="180" style={{ background: '#fff', borderRadius: 8 }} aria-label="Código QR" data-finder={finder(0, 0)}><g fill="#0d0e10">{cells}</g></svg>;
}

/* ---------------- Catálogo ---------------- */
function Catalogo({ plans, setPlans, nuevoId, tarea, onNewPlan, onTaskDone }) {
  const [nuevo, setNuevo] = useState(false);
  const [menu, setMenu] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [prod, setProd] = useState('Todos');
  const [tareaOpen, setTareaOpen] = useState(true);
  const [cancelarSubs, setCancelarSubs] = useState(false);
  const [confirm2, setConfirm2] = useState(null);
  const [modoTabla, setModoTabla] = useState('Páginas');
  const [precio, setPrecio] = useState(null); // { x, paso: 'form'|'elegir'|'confirmar', nuevo, aplica, elegidos, q }
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3600); return () => clearTimeout(t); }, [toast]);
  const mensualArchivado = plans.some((x) => x.id === 'p2' && x.estado === 'Archivado');
  const done = nuevoId && mensualArchivado && estado === 'Archivados';
  useEffect(() => { if (done) track('tarea_cumplida', 'catalogo'); }, [done]);

  const visibles = plans.filter((x) => (estado === 'Todos' || (estado === 'Publicados' && x.estado === 'Publicado') || (estado === 'Borradores' && x.estado === 'Borrador') || (estado === 'Pausados' && x.estado === 'Pausado') || (estado === 'Archivados' && x.estado === 'Archivado'))
    && (prod === 'Todos' || x.productos.includes(prod)) && (!q || x.nombre.toLowerCase().includes(q.toLowerCase())));
  const activos = visibles.filter((x) => x.estado !== 'Archivado');
  const archivados = visibles.filter((x) => x.estado === 'Archivado');
  const upd = (id, patch) => setPlans((ps) => ps.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const accion = (a, x) => {
    setMenu(null);
    if (a === 'Duplicar' || a === 'Archivar' || a === 'Pausar ventas') { setCancelarSubs(false); return setConfirm({ a, x }); }
    if (a === 'Cambiar precio') { track('cambiar_precio', x.nombre); const actual = Number(String(x.precio).replace(/\D/g, '')) || 0; return setPrecio({ x, paso: 'form', actual, nuevo: String(Math.round(actual * 1.075 / 100) * 100), aplica: 'Solo a clientes nuevos', elegidos: [], q: '' }); }
    if (a === 'Restaurar') { track('restaurar', x.nombre); upd(x.id, { estado: 'Borrador' }); return setToast({ t: `«${x.nombre}» volvió como borrador` }); }
    if (a === 'Reanudar ventas') { upd(x.id, { estado: 'Publicado' }); return setToast({ t: `Reanudaste las ventas de «${x.nombre}»` }); }
    if (a === 'Copiar link') { track('link_copiado', x.nombre); return setToast({ t: 'Link copiado' }); }
    setToast({ t: `«${a}» no está incluido en esta prueba` });
  };
  const confirmar = () => {
    const { a, x } = confirm; setConfirm(null);
    if (a === 'Duplicar') { track('duplicar', x.nombre); const id = 'c' + Date.now(); setPlans((ps) => [{ ...x, id, nombre: `${x.nombre} (copia)`, estado: 'Borrador', subs: 0, copia: true }, ...ps]); setToast({ t: `«${x.nombre} (copia)» se creó como borrador` }); }
    if (a === 'Archivar' && cancelarSubs && x.subs) { return setConfirm2(x); }
    if (a === 'Archivar') { track('archivar', x.nombre); const prev = x.estado; upd(x.id, { estado: 'Archivado' }); setToast({ t: `«${x.nombre}» se archivó · quedó al final de la lista`, undo: () => { track('deshacer', x.nombre); upd(x.id, { estado: prev }); } }); }
    if (a === 'Pausar ventas') { track('pausar', x.nombre); upd(x.id, { estado: 'Pausado' }); setToast({ t: `Pausaste las ventas de «${x.nombre}»` }); }
  };
  const tag = (e) => <span className={`tag ${e === 'Publicado' ? 'ok' : e === 'Pausado' ? 'pausado' : 'neutral'}`}>{e === 'Pausado' ? 'Ventas pausadas' : e}</span>;
  const menuDe = (x) => x.estado === 'Archivado' ? ['Ver detalle', 'Restaurar'] : ['Ver detalle', 'Editar', 'Cambiar precio', 'Copiar link', 'Duplicar', x.estado === 'Pausado' ? 'Reanudar ventas' : 'Pausar ventas', '—', 'Archivar'];
  const ICON = { 'Ver detalle': Eye, Editar: Pencil, 'Cambiar precio': Tag, 'Copiar link': Link2, Duplicar: Copy, 'Pausar ventas': Pause, 'Reanudar ventas': RotateCcw, Archivar: Archive, Restaurar: RotateCcw };
  const menuEl = (x) => (
    <div className="menu" onClick={(e) => e.stopPropagation()}>
      <div className="menu-title t-label">{x.nombre}</div>
      {menuDe(x).map((o, i) => o === '—' ? <hr key={i} /> : (() => { const I = ICON[o]; return <button key={o} className={o === 'Archivar' ? 'danger' : ''} onClick={() => accion(o, x)}><I size={16} />{o}</button>; })())}
    </div>
  );
  const fila = (x) => (
    <tr key={x.id} className={`${x.estado === 'Archivado' ? 'arch' : ''}${x.id === nuevoId || x.copia ? ' nuevo' : ''}`}>
      <td><div className="t-label">{x.nombre}</div><div className="t-help">{x.desc}</div></td>
      <td>{x.productos.map((p) => <span key={p} className="chipm">{p}</span>)}</td>
      <td>{x.precio}</td><td className="num">{x.subs || '—'}</td><td>{tag(x.estado)}</td>
      <td style={{ position: 'relative', width: 48 }}><button className="icon-btn" aria-label={`Acciones de ${x.nombre}`} onClick={(e) => { e.stopPropagation(); track('menu_fila', x.nombre); setMenu(menu === x.id ? null : x.id); }}><MoreHorizontal size={18} /></button>{menu === x.id && menuEl(x)}</td>
    </tr>
  );
  const card = (x) => (
    <div key={x.id} className={`cat-card${x.estado === 'Archivado' ? ' arch' : ''}${x.id === nuevoId || x.copia ? ' nuevo' : ''}`}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><div style={{ flex: 1 }}><div className="t-label">{x.nombre}</div><div className="t-help">{x.desc}</div></div>{tag(x.estado)}<button className="icon-btn" aria-label={`Acciones de ${x.nombre}`} onClick={(e) => { e.stopPropagation(); track('menu_fila', x.nombre); setMenu(x.id); }}><MoreHorizontal size={18} /></button></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>{x.productos.map((p) => <span key={p} className="chipm">{p}</span>)}<span className="spacer" style={{ flex: 1 }} /><span className="t-label">{x.precio}</span></div>
    </div>
  );
  const menuPlan = plans.find((x) => x.id === menu);
  return (
    <div className="app-inicio" onClick={() => { setMenu(null); setNuevo(false); }}>
      <aside className="app-side"><span className="logo-mark" style={{ width: 28, height: 28, borderRadius: 8 }} /><span className="avatar" style={{ background: 'var(--suave)', color: 'var(--texto)' }}>AA</span></aside>
      <div className="app-main" style={{ overflow: 'auto' }}>
        <div className="app-topbar"><span className="logo-mark" style={{ width: 28, height: 28, borderRadius: 8 }} /><span className="spacer" /><span className="avatar" style={{ background: 'var(--suave)', color: 'var(--texto)' }}>CR</span></div>
        <div className="franja-prueba">Modo prueba · Los cobros no son reales.</div>
        <div className="app-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="cat-head">
            <div style={{ flex: 1 }}><h1 className="t-xl">Catálogo</h1><p className="t-small">Lo que vendes, cuánto cuesta y cómo lo agrupas.</p></div>
            <div style={{ position: 'relative' }}>
              <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); track('menu_nuevo'); setNuevo(!nuevo); }}><Plus size={18} />Nuevo<ChevronDown size={16} /></button>
              {nuevo && (
                <div className="menu nuevo-menu" onClick={(e) => e.stopPropagation()}>
                  {[['Producto', 'Lo que vendes y cómo se cuenta'], ['Precio', 'Cuánto cuesta un producto'], ['Plan', 'Junta productos y cobros en una canasta'], ['Descuento o cupón', 'Automático o con código'], ['Vender algo ahora', 'Producto, precio y link en un paso']].map(([t, d]) => (
                    <button key={t} onClick={() => { setNuevo(false); if (t === 'Plan') onNewPlan(); else { track('nuevo_no_disponible', t); setToast({ t: `En esta prueba solo creamos planes` }); } }}><span style={{ textAlign: 'left' }}><span className="t-label" style={{ display: 'block' }}>{t}</span><span className="t-help">{d}</span></span></button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="cat-tabs">{[['Productos', 5], ['Precios', 8], ['Planes', plans.length], ['Descuentos', 5]].map(([t, n]) => <button key={t} className={t === 'Planes' ? 'on' : ''} onClick={() => { if (t !== 'Planes') setToast({ t: 'En esta prueba trabajamos en «Planes»' }); }}>{t} <span className="t-help">{n}</span></button>)}</div>
          <div className="cat-filtros">
            <label className="buscar"><Search size={16} /><input value={q} placeholder="Buscar planes" onChange={(e) => setQ(e.target.value)} onBlur={() => q && track('buscar', q)} /></label>
            <label className="filtro">Estado: <select value={estado} onChange={(e) => { setEstado(e.target.value); track('filtro', `estado ${e.target.value}`); }}>{['Todos', 'Publicados', 'Borradores', 'Pausados', 'Archivados'].map((o) => <option key={o}>{o}</option>)}</select></label>
            <label className="filtro">Producto: <select value={prod} onChange={(e) => { setProd(e.target.value); track('filtro', `producto ${e.target.value}`); }}>{['Todos', ...PRODUCTOS0.map((x) => x.t)].map((o) => <option key={o}>{o}</option>)}</select></label>
            {(estado !== 'Todos' || prod !== 'Todos' || q) && <button className="flink" style={{ fontSize: 13 }} onClick={() => { setEstado('Todos'); setProd('Todos'); setQ(''); }}>Limpiar filtros</button>}
            <span className="spacer" style={{ flex: 1 }} /><span className="filtro">Orden: Más recientes</span>
          </div>
          <div className="card cat-tabla" style={{ padding: 0, overflow: 'visible' }}>
            <table className="table">
              <thead><tr><th>Plan</th><th>Productos que incluye</th><th>Precio</th><th className="num">Suscripciones</th><th>Estado</th><th /></tr></thead>
              <tbody>
                {activos.map(fila)}
                {!!archivados.length && estado !== 'Archivados' && <tr className="cat-sep"><td colSpan={6}>Archivados · {archivados.length} · se muestran al final, atenuados</td></tr>}
                {archivados.map(fila)}
                {!visibles.length && <tr><td colSpan={6} className="t-small" style={{ padding: 24, textAlign: 'center' }}>No hay planes con estos filtros.</td></tr>}
              </tbody>
            </table>
            <div className="pie-tabla">
              <span className="t-help">{modoTabla === 'Páginas' ? `1–${visibles.length} de ${visibles.length}` : `Mostrando ${visibles.length} de ${visibles.length}`}</span>
              <span className="spacer" style={{ flex: 1 }} />
              {modoTabla === 'Páginas'
                ? <><span className="t-help">Filas por página</span><span className="filtro" style={{ height: 32 }}>25 <ChevronDown size={14} /></span><button className="icon-btn" aria-label="Página anterior" disabled><ChevronLeft size={16} /></button><button className="icon-btn" aria-label="Página siguiente" disabled><ChevronRight size={16} /></button></>
                : <><span className="t-help">Se cargan 25 más al llegar al final</span><button className="flink" style={{ fontSize: 13 }}>Volver arriba ↑</button></>}
              <span className="sep" />
              <Seg options={['Páginas', 'Scroll infinito']} value={modoTabla} onChange={(v) => { track('modo_tabla', v); setModoTabla(v); }} />
            </div>
          </div>
          <div className="cat-cards">
            {activos.map(card)}
            {!!archivados.length && estado !== 'Archivados' && <div className="t-caps" style={{ color: 'var(--texto-2)', marginTop: 6 }}>Archivados · {archivados.length}</div>}
            {archivados.map(card)}
            {!visibles.length && <div className="t-small">No hay planes con estos filtros.</div>}
            <div className="pie-cards"><span className="t-help" style={{ flex: 1 }}>{modoTabla === 'Páginas' ? `1–${visibles.length} de ${visibles.length}` : 'Se cargan más al bajar'}</span><Seg options={['Páginas', 'Scroll infinito']} value={modoTabla} onChange={(v) => { track('modo_tabla', v); setModoTabla(v); }} /></div>
          </div>
        </div>
      </div>
      <nav className="tabbar">{[[House, 'Inicio'], [Sparkles, 'Agentes'], [CircleDollarSign, 'Cobrar'], [Package, 'Vender'], [MoreHorizontal, 'Más']].map(([I, l]) => <span key={l} className={l === 'Vender' ? 'on' : ''}><I size={21} />{l}</span>)}</nav>
      {menuPlan && <div className="hoja-menu" onClick={() => setMenu(null)}>{menuEl(menuPlan)}</div>}
      {confirm && (() => {
        const { a, x } = confirm;
        const txt = {
          Duplicar: { t: `¿Duplicar «${x.nombre}»?`, s: `Se crea «${x.nombre} (copia)» como borrador para que la ajustes. No se copian sus suscripciones ni su link.`, b: 'Duplicar', l: null },
          Archivar: { t: `¿Archivar «${x.nombre}»?`, s: 'No se borra nada: lo puedes restaurar cuando quieras.', b: 'Archivar', l: ['Deja de venderse y su link queda en pausa.', `Las ${x.subs || 0} suscripciones vigentes siguen cobrando igual.`, 'Queda al final de la lista, atenuado y con la etiqueta «Archivado». Puedes filtrarlo por Estado.'] },
          'Pausar ventas': { t: `¿Pausar las ventas de «${x.nombre}»?`, s: null, b: 'Pausar ventas', l: ['Su link muestra «Inscripciones pausadas».', 'Las suscripciones vigentes siguen cobrando igual.', 'Lo reanudas cuando quieras desde el menú ⋯.'] },
        }[a];
        const cancela = a === 'Archivar' && cancelarSubs && x.subs;
        return (
          <Modal title={txt.t} sub={txt.s} primary={cancela ? 'Archivar y cancelar…' : txt.b} danger={cancela} onClose={() => setConfirm(null)} onPrimary={confirmar}>
            {txt.l && <div className="bullets">{txt.l.map((t) => cancela && t.includes('suscripciones vigentes') ? <div key={t} className="bullet-alerta"><AlertTriangle size={16} /><span><b>Se cancelan las {x.subs} suscripciones.</b> Dejan de cobrarse hoy. Esto no se puede deshacer.</span></div> : <div key={t}><Check size={16} /><span>{t}</span></div>)}</div>}
            {a === 'Archivar' && !!x.subs && <label className="check-row"><input type="checkbox" checked={cancelarSubs} onChange={(e) => { track('archivar_cancelar_subs', String(e.target.checked)); setCancelarSubs(e.target.checked); }} />También cancelar las suscripciones vigentes</label>}
          </Modal>
        );
      })()}
      {confirm2 && (
        <Modal title={`¿Seguro que quieres cancelar ${confirm2.subs} suscripciones?`} sub={`Esta acción no se puede deshacer. Las suscripciones de «${confirm2.nombre}» dejan de cobrarse hoy. Para volver, cada cliente tendría que inscribirse de nuevo.`}
          primary={`Sí, cancelar ${confirm2.subs} suscripciones`} danger secondary="Volver" onClose={() => setConfirm2(null)}
          onPrimary={() => { const x = confirm2; track('archivar_y_cancelar', x.nombre); upd(x.id, { estado: 'Archivado', subs: 0 }); setConfirm2(null); setToast({ t: `«${x.nombre}» archivado y ${x.subs} suscripciones canceladas. Avisamos a los clientes por correo.` }); }}>
          <div className="resumen-lista">
            <div><span>Suscripciones canceladas</span><b>{confirm2.subs}</b></div>
            <div><span>Ingreso mensual que deja de entrar</span><b>{PESOS((Number(String(confirm2.precio).replace(/\D/g, '')) || 0) * confirm2.subs)}</b></div>
            <div><span>Cobros pendientes</span><b>Se mantienen y se siguen cobrando</b></div>
          </div>
          <label className="check-row"><input type="checkbox" defaultChecked />Avisar a los {confirm2.subs} clientes por correo</label>
        </Modal>
      )}
      {precio && precio.paso === 'form' && (() => {
        const subs = precio.x.subs || 0;
        const ops = [
          { t: 'Solo a clientes nuevos', d: `Los ${subs} actuales siguen pagando ${PESOS(precio.actual)} hasta terminar su plan.` },
          { t: 'Solo a clientes actuales', d: `Los ${subs} actuales pasan a ${PESOS(precio.nuevo)} desde su próximo cobro. Los nuevos siguen entrando a ${PESOS(precio.actual)}.` },
          { t: 'A todos', d: `Nuevos desde la fecha elegida y los ${subs} actuales desde su próximo cobro, con aviso automático 30 días antes.` },
          { t: 'A clientes que elijas', d: 'Elige a mano quiénes pagan el nuevo precio: por nombre, sede o antigüedad.' },
        ];
        const falta = precio.aplica === 'A clientes que elijas' && !precio.elegidos.length;
        return (
          <Modal wide title="Cambiar precio de la mensualidad" sub="Se crea la versión 2 del precio. La versión 1 no se borra: queda en el historial y en las suscripciones que la usan." primary="Crear versión 2" disabled={falta || !Number(precio.nuevo)} onClose={() => setPrecio(null)}
            onPrimary={() => { track('precio_aplica', precio.aplica); if (precio.aplica === 'Solo a clientes nuevos') { upd(precio.x.id, { precio: `${PESOS(precio.nuevo)} / mes` }); setToast({ t: `La versión 2 (${PESOS(precio.nuevo)}) ya está programada para clientes nuevos` }); setPrecio(null); } else setPrecio({ ...precio, paso: 'confirmar' }); }}>
            <div className="dos">
              <TextField label="Precio actual" value={PESOS(precio.actual)} onChange={() => {}} />
              <TextField label="Precio nuevo" value={precio.nuevo ? PESOS(precio.nuevo) : ''} onChange={(v) => setPrecio({ ...precio, nuevo: v.replace(/\D/g, '') })} help={precio.actual ? `${((Number(precio.nuevo) / precio.actual - 1) * 100).toFixed(1).replace('.', ',')}%` : ''} />
            </div>
            <TextField label="Vigente desde" type="date" value="2027-03-01" onChange={() => {}} help="Antes del primer cobro de marzo." />
            <span className="t-label">¿A quién se aplica?</span>
            <Options cols={1} options={ops} value={precio.aplica} onChange={(v) => { setPrecio({ ...precio, aplica: v, ...(v === 'A clientes que elijas' && !precio.elegidos.length ? { paso: 'elegir' } : {}) }); }} />
            {precio.aplica === 'A clientes que elijas' && !!precio.elegidos.length && (
              <div className="aviso" style={{ alignItems: 'center' }}><span style={{ flex: 1 }}><span className="t-label" style={{ display: 'block' }}>{precio.elegidos.length} clientes · {precio.elegidos.slice(0, 2).join(', ')}{precio.elegidos.length > 2 ? ` y ${precio.elegidos.length - 2} más` : ''}</span><span className="t-help">+{PESOS((Number(precio.nuevo) - precio.actual) * precio.elegidos.length)} al mes</span></span><button className="flink" style={{ fontSize: 13 }} onClick={() => setPrecio({ ...precio, paso: 'elegir' })}>Editar</button></div>
            )}
            {precio.aplica !== 'Solo a clientes nuevos' && <div className="aviso naranja"><AlertTriangle size={16} /><span className="t-small">Si aplicas a clientes actuales (o a todos), revisa tus términos y la normativa de protección al consumidor antes de cambiar el precio de un contrato vigente.</span></div>}
          </Modal>
        );
      })()}
      {precio && precio.paso === 'elegir' && (() => {
        const lista = CLIENTES.filter((c) => !precio.q || c.toLowerCase().includes(precio.q.toLowerCase()));
        const todos = lista.length && lista.every((c) => precio.elegidos.includes(c));
        const toggle = (c) => setPrecio({ ...precio, elegidos: precio.elegidos.includes(c) ? precio.elegidos.filter((x) => x !== c) : [...precio.elegidos, c] });
        return (
          <Modal wide title="¿A quiénes les cambias el precio?" sub={`${precio.x.nombre} · los que elijas pasan de ${PESOS(precio.actual)} a ${PESOS(precio.nuevo)} desde su próximo cobro.`}
            primary={precio.elegidos.length ? `Usar estos ${precio.elegidos.length} clientes` : 'Usar clientes elegidos'} disabled={!precio.elegidos.length} secondary="Volver"
            onClose={() => setPrecio({ ...precio, paso: 'form', aplica: precio.elegidos.length ? 'A clientes que elijas' : 'Solo a clientes nuevos' })}
            onPrimary={() => { track('precio_elegidos', String(precio.elegidos.length)); setPrecio({ ...precio, paso: 'form', aplica: 'A clientes que elijas' }); }}
            head={<label className="buscar" style={{ width: '100%' }}><Search size={16} /><input value={precio.q} placeholder="Buscar por nombre, correo o RUT" onChange={(e) => setPrecio({ ...precio, q: e.target.value })} /></label>}>
            <div className="sel-lista">
              <label className="sel-fila head"><input type="checkbox" checked={!!todos} onChange={() => setPrecio({ ...precio, elegidos: todos ? precio.elegidos.filter((c) => !lista.includes(c)) : [...new Set([...precio.elegidos, ...lista])] })} /><span className="t-help" style={{ flex: 1 }}>{precio.q ? `${lista.length} resultados para «${precio.q}»` : `Seleccionar los ${lista.length}`}</span><span className="t-help">Precio hoy</span></label>
              {lista.map((c) => <label key={c} className={`sel-fila${precio.elegidos.includes(c) ? ' on' : ''}`}><input type="checkbox" checked={precio.elegidos.includes(c)} onChange={() => toggle(c)} /><span style={{ flex: 1 }}>{c}</span><span className="t-small">{PESOS(precio.actual)}</span></label>)}
              {!lista.length && <div className="t-small" style={{ padding: 20, textAlign: 'center' }}>No encontramos clientes con «{precio.q}». <button className="flink" onClick={() => setPrecio({ ...precio, q: '' })}>Limpiar búsqueda</button></div>}
            </div>
            <div className="aviso" style={{ alignItems: 'center' }}><span style={{ flex: 1 }}><span className="t-label" style={{ display: 'block' }}>{precio.elegidos.length ? `${precio.elegidos.length} clientes seleccionados` : 'Ningún cliente seleccionado'}</span><span className="t-help">{precio.elegidos.length ? `+${PESOS((Number(precio.nuevo) - precio.actual) * precio.elegidos.length)} al mes · cada uno recibe aviso 30 días antes` : 'Elige al menos 1 cliente para continuar'}</span></span>{!!precio.elegidos.length && <button className="flink" style={{ fontSize: 13 }} onClick={() => setPrecio({ ...precio, elegidos: [] })}>Quitar selección</button>}</div>
          </Modal>
        );
      })()}
      {precio && precio.paso === 'confirmar' && (() => {
        const n = precio.aplica === 'A clientes que elijas' ? precio.elegidos.length : (precio.x.subs || 0);
        return (
          <Modal title={precio.aplica === 'A clientes que elijas' ? `¿Cambiar el precio a estos ${n} clientes?` : `¿Cambiar el precio también a los ${n} clientes actuales?`} sub="Les avisaremos por correo y WhatsApp 30 días antes." primary="Sí, crear versión 2" secondary="Volver"
            onClose={() => setPrecio({ ...precio, paso: 'form' })} onPrimary={() => { track('precio_confirmado', precio.aplica); upd(precio.x.id, { precio: `${PESOS(precio.nuevo)} / mes` }); setToast({ t: `La versión 2 ya está programada${precio.aplica === 'A clientes que elijas' ? ` para ${n} clientes elegidos` : ''}` }); setPrecio(null); }}>
            <div className="resumen-lista">
              <div><span>Clientes afectados</span><b>{n}{precio.aplica === 'A clientes que elijas' ? ' elegidos' : ''}</b></div>
              <div><span>Precio</span><b>{PESOS(precio.actual)} → {PESOS(precio.nuevo)}</b></div>
              <div><span>Les avisamos</span><b>30 ene 2027</b></div>
              <div><span>Primer cobro con precio nuevo</span><b>5 mar 2027</b></div>
            </div>
            <label className="check-row"><input type="checkbox" defaultChecked />Revisé mis términos y la normativa al consumidor</label>
          </Modal>
        );
      })()}
      {toast && <div className="toast pop" style={{ display: 'flex', gap: 14, alignItems: 'center' }}><Check size={16} />{toast.t}{toast.undo && <button style={{ color: '#ffb59c', fontWeight: 600 }} onClick={() => { toast.undo(); setToast(null); }}>Deshacer</button>}</div>}
      {tarea && !done && (
        <div className={`tarea${tareaOpen ? '' : ' min'}`} onClick={(e) => e.stopPropagation()}>
          <button className="tarea-head" onClick={() => { setTareaOpen(!tareaOpen); track('tarea_ver'); }}><span className="t-caps" style={{ opacity: .7 }}>Tarea {tarea.n} de 2</span><ChevronDown size={16} style={{ transform: tareaOpen ? 'none' : 'rotate(180deg)' }} /></button>
          {tareaOpen && <><div className="t-label" style={{ fontSize: 15 }}>{tarea.t}</div><div style={{ fontSize: 13, opacity: .8, lineHeight: 1.45 }}>{tarea.d}</div></>}
        </div>
      )}
      {done && (
        <div className="fin-prueba pop" onClick={(e) => e.stopPropagation()}>
          <div style={{ flex: 1 }}><div className="t-label">¡Listo, terminaste las tareas!</div><div className="t-help">Avísale a quien te acompaña.</div></div>
          <button className="btn btn-primary btn-s" onClick={onTaskDone}>Terminar</button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Fin ---------------- */
function FinPrueba() {
  return (
    <div className="stage" style={{ background: 'var(--lienzo)' }}>
      <div className="center-card fade-in">
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--ok-fondo)', display: 'grid', placeItems: 'center' }}><Check color="var(--ok-texto)" size={30} /></div>
        <h1 className="t-l">Gracias, terminaste la prueba</h1>
        <p className="t-body">Guardamos los tiempos en este navegador.</p>
        <a className="btn btn-primary btn-block" href="#moderador">Ver resultados</a>
        <a className="t-small" href="#" onClick={() => setTimeout(() => location.reload())} style={{ color: 'var(--texto-2)' }}>Elegir otro flujo</a>
      </div>
    </div>
  );
}

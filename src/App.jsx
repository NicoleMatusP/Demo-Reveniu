import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Mail, Pencil, Link2, Sparkles, Globe, ChevronRight, Package, Users } from 'lucide-react';
import { Logo, Ring, TextArea, TextField, useFit } from './ui.jsx';
import { STAGES, STEPS, initialAnswers, usuariosDe, TOTAL_PREGUNTAS } from './steps.jsx';
import { Shell } from './Shell.jsx';
import { G } from './glossary.jsx';
import Moderador from './Moderador.jsx';
import { endPhase, enterStep, finishSession, saveAnswers, startPhase, startSession, track } from './metrics.js';
import Validacion from './Validacion.jsx';

const CODE = 'K7Q2M9';

export default function App() {
  const [route, setRoute] = useState(() => (location.hash === '#moderador' ? 'moderador' : 'inicio'));
  const [screen, setScreen] = useState('inicio');
  const [user, setUser] = useState({ nombre: '', apellido: '', correo: '', clave: '' });
  const [a, setA] = useState(initialAnswers);
  const [idx, setIdx] = useState(0);
  const [help, setHelp] = useState(false);
  const [review, setReview] = useState(false);
  const [edit, setEdit] = useState(null);
  const set = (patch) => setA((p) => ({ ...p, ...patch }));

  useEffect(() => {
    const on = () => setRoute(location.hash === '#moderador' ? 'moderador' : 'inicio');
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  // Registro de tiempos por pantalla
  const stepKey = screen === 'alta' ? (review ? 'revisar-sitio' : STEPS[idx].id) : screen === 'ficha' && edit ? `editar-${STEPS[edit.i].id}` : screen;
  const stepTitle = screen === 'alta' ? (review ? '¿Es esto correcto? (revisar sitio)' : STEPS[idx].title) : screen === 'ficha' && edit ? `Editar desde la ficha · ${STEPS[edit.i].title}` : TITLES[screen];
  useEffect(() => { if (!['inicio', 'fin', 'validacion'].includes(screen)) enterStep(stepKey, stepTitle); }, [stepKey]); // eslint-disable-line
  useEffect(() => { if (screen === 'alta') STEPS[idx].onEnter?.(a, set); }, [idx, screen]); // eslint-disable-line

  if (route === 'moderador') return <Moderador />;

  const go = (s) => setScreen(s);
  const next = () => {
    const step = STEPS[idx];
    if (step.id === 'pais' && a.pais === 'Otro país') return go('pais-no');
    if (idx < STEPS.length - 1) setIdx(idx + 1); else go('cargando');
  };
  const back = () => { track('atras', STEPS[idx].id); if (idx > 0) setIdx(idx - 1); else go('bienvenida'); };

  switch (screen) {
    case 'inicio': return <Inicio onStart={(code) => { startSession(code); go('registro'); }} />;
    case 'registro': return <Registro user={user} setUser={setUser} onDone={() => go('codigo')} />;
    case 'codigo': return <Codigo email={user.correo} onBack={() => go('registro')} onDone={() => go('bienvenida')} />;
    case 'bienvenida': return <Bienvenida name={user.nombre} onStart={() => { track('inicio_alta'); setIdx(0); go('alta'); }} onLater={() => { track('guardar_y_salir', 'bienvenida'); go('pausa'); }} />;
    case 'pais-no': return <Shell name={user.nombre} stageIdx={0} fill={0.1} onHelp={() => setHelp(true)} onExit={() => go('pausa')} help={help} closeHelp={() => setHelp(false)} helpCtx={['¿Dónde opera tu empresa?', 1, user]}>
      <PaisNo onWrong={() => { set({ pais: 'Chile' }); setIdx(0); go('alta'); }} onNotify={() => go('pais-aviso')} />
    </Shell>;
    case 'pais-aviso': return <Shell name={user.nombre} stageIdx={0} fill={0.1} onHelp={() => setHelp(true)} onExit={() => go('pausa')} help={help} closeHelp={() => setHelp(false)} helpCtx={['¿Dónde opera tu empresa?', 1, user]}>
      <PaisAviso email={user.correo} onWrong={() => { set({ pais: 'Chile' }); setIdx(0); go('alta'); }} onOk={() => { saveAnswers(a); finishSession(); go('fin'); }} />
    </Shell>;
    case 'alta': {
      const step = STEPS[idx];
      const stageSteps = STEPS.filter((s) => s.stage === step.stage);
      const pos = stageSteps.indexOf(step);
      const ok = !!step.valid(a);
      return (
        <Shell name={user.nombre} stageIdx={step.stage} fill={(pos + 1) / (stageSteps.length + (step.stage === 2 ? 1 : 0))}
          onHelp={() => { track('ayuda', step.id); setHelp(true); }} onExit={() => { track('guardar_y_salir', step.id); go('pausa'); }}
          help={help} closeHelp={() => setHelp(false)} helpCtx={[step.title, idx + 1, user]}
          footer={review ? null : (<>
            <span className="t-help note">Puedes cambiar esto después</span>
            <button className="btn btn-secondary" onClick={back}>Atrás</button>
            <button className="btn btn-primary" disabled={!ok} onClick={next}>{step.cta || 'Continuar'}</button>
          </>)}>
          {review
            ? <Revisar a={a} set={set} onDone={() => setReview(false)} />
            : <div key={step.id} className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>{step.render(a, set, { openReview: () => { track('revisar_sitio'); setReview(true); } })}</div>}
        </Shell>
      );
    }
    case 'cargando': return <Shell name={user.nombre} stageIdx={2} fill={0.5} wide onHelp={() => setHelp(true)} onExit={() => go('pausa')} help={help} closeHelp={() => setHelp(false)} helpCtx={['Armando tu ficha', 12, user]} footer={<span style={{ height: 46 }} />}>
      <Ficha a={a} loading onLoaded={() => go('ficha')} />
    </Shell>;
    case 'ficha': return <Shell name={user.nombre} stageIdx={2} fill={1} wide onHelp={() => { track('ayuda', 'ficha'); setHelp(true); }} onExit={() => go('pausa')} help={help} closeHelp={() => setHelp(false)} helpCtx={['Esto es lo que entendimos', 12, user]}
      footer={<><button className="btn btn-secondary" onClick={() => { track('atras', 'ficha'); setIdx(STEPS.length - 1); go('alta'); }}>Atrás</button><button className="btn btn-primary" onClick={() => { saveAnswers({ ...a, usuario: user.nombre }); go('lista'); }}>Continuar</button></>}>
      <Ficha a={a} onEdit={(i) => { track('editar_desde_ficha', STEPS[i].id); setEdit({ i, snap: a }); }} />
      {edit && <EditarDato step={STEPS[edit.i]} a={a} set={set}
        onCancel={() => { setA(edit.snap); setEdit(null); }}
        onSave={() => { track('guardo_edicion', STEPS[edit.i].id); setEdit(null); }} />}
    </Shell>;
    case 'lista': return <Lista a={a} name={user.nombre}
      onValidate={() => { endPhase('alta'); startPhase('validacion'); go('validacion'); }}
      onEnd={() => { finishSession(); go('fin'); }} />;
    case 'validacion': return <Validacion user={user} a={a} onBack={() => go('lista')} onDone={() => go('fin')} />;
    case 'pausa': return <Retomar name={user.nombre} idx={idx} onResume={() => { track('retomar'); go(idx === 0 && !a.pais ? 'bienvenida' : 'alta'); }} />;
    case 'fin': return <Fin />;
    default: return null;
  }
}

const TITLES = { registro: 'Registro', codigo: 'Código de verificación', bienvenida: 'Bienvenida', 'pais-no': 'Todavía no llegamos', 'pais-aviso': 'Aviso guardado', cargando: 'Armando tu ficha (carga)', ficha: 'Esto es lo que entendimos', lista: 'Configuración lista', pausa: 'Retomar configuración' };

/* ---------------- Inicio de la prueba (moderador) ---------------- */
function Inicio({ onStart }) {
  const [code, setCode] = useState('');
  return (
    <div className="stage" style={{ background: 'var(--lienzo)' }}>
      <div className="center-card">
        <Logo />
        <h1 className="t-l">Prueba del alta</h1>
        <p className="t-body">Escribe un código para identificar a la persona que hará la prueba. Medimos el tiempo en dos partes: el alta (del registro a la cuenta lista) y la validación de la empresa (del SII a la empresa aprobada).</p>
        <TextField label="Código del participante" value={code} onChange={setCode} placeholder="Ej: P01" autoFocus onEnter={() => onStart(code)} />
        <button className="btn btn-primary btn-block" onClick={() => onStart(code)}>Comenzar prueba</button>
        <a className="t-small" href="#moderador" style={{ color: 'var(--texto-2)' }}>Ver resultados de pruebas anteriores</a>
      </div>
    </div>
  );
}

/* ---------------- Registro ---------------- */
function BrandPanel({ title, sub }) {
  return (
    <div className="brand-panel">
      <div className="blob" style={{ width: 520, height: 520, left: -160, top: -140, background: '#2b5bb5' }} />
      <div className="blob" style={{ width: 420, height: 420, right: -80, top: 60, background: '#3f78d6', opacity: .9 }} />
      <div className="blob" style={{ width: 360, height: 360, right: -120, bottom: -100, background: '#ff5c2e', opacity: .85 }} />
      <div className="blob" style={{ width: 300, height: 300, left: -60, bottom: 40, background: '#0a1121', opacity: .8 }} />
      <div style={{ position: 'relative' }}>
        <h2 style={{ fontSize: 48, lineHeight: 1.05, fontWeight: 500, letterSpacing: '-.02em' }}>{title}</h2>
        <p style={{ marginTop: 20, fontSize: 18, opacity: .85, maxWidth: 440 }}>{sub}</p>
      </div>
      <div className="notif">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, opacity: .9 }}><span className="notif-mark" />Recuperado · hoy 10:42</div>
        <div style={{ fontSize: 22, fontWeight: 600 }}>Recuperaste $45.000 de Marta R.</div>
      </div>
      <p style={{ position: 'relative', marginTop: 20, fontSize: 13, opacity: .7 }}>Hecho en Chile · seis años cobrando en pesos, UF y PAC</p>
    </div>
  );
}

function Registro({ user, setUser, onDone }) {
  const [tried, setTried] = useState(false);
  const u = (k) => (v) => setUser((p) => ({ ...p, [k]: v }));
  const err = {
    nombre: !user.nombre.trim() && 'Escribe tu nombre.',
    correo: !/^\S+@\S+\.\S+$/.test(user.correo) && 'Revisa tu correo.',
    clave: user.clave.length < 10 && 'Mínimo 10 caracteres.',
  };
  const ok = !err.nombre && !err.correo && !err.clave;
  const submit = () => { setTried(true); if (ok) onDone(); };
  return (
    <div className="auth">
      <div className="auth-form">
        <Logo />
        <form className="auth-inner" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <h1 className="t-l">Crea tu cuenta gratis.</h1>
          <p className="t-small"><G>Dos minutos. Partes en modo prueba, sin tarjeta, y activas cobros reales cuando valides tu empresa.</G></p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <TextField label="Nombre" value={user.nombre} onChange={u('nombre')} autoFocus error={tried && err.nombre} />
            <TextField label="Apellido" value={user.apellido} onChange={u('apellido')} />
          </div>
          <TextField label="Correo de trabajo" type="email" value={user.correo} onChange={u('correo')} help="Con el correo de tu empresa completamos más por ti." error={tried && err.correo} />
          <TextField label="Contraseña" type="password" value={user.clave} onChange={u('clave')} help="Mínimo 10 caracteres." error={tried && err.clave} />
          <div className="m-pin"><button className="btn btn-primary btn-block" type="submit">Crear cuenta gratis</button></div>
          <p className="t-help">Al crear tu cuenta aceptas los Términos y la Política de privacidad. Tratamos tus datos conforme a la Ley 21.719.</p>
        </form>
      </div>
      <BrandPanel title={<>Tu negocio, imparable.<br />Tu equipo, libre.</>} sub="Crea tu cuenta y prueba sin cobros reales. Activas los cobros cuando quieras." />
    </div>
  );
}

function Codigo({ email, onBack, onDone }) {
  const [vals, setVals] = useState(Array(6).fill(''));
  const [mail, setMail] = useState(false);
  const [error, setError] = useState(false);
  const refs = useRef([]);
  useEffect(() => { const t = setTimeout(() => setMail(true), 1500); return () => clearTimeout(t); }, []);
  const setAt = (i, v) => {
    const clean = v.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length > 1) { const arr = clean.slice(0, 6).split(''); setVals([...arr, ...Array(6 - arr.length).fill('')]); refs.current[Math.min(arr.length, 5)]?.focus(); return; }
    const n = [...vals]; n[i] = clean; setVals(n); setError(false);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };
  const verify = () => { if (vals.join('') === CODE) onDone(); else { setError(true); track('codigo_incorrecto'); } };
  return (
    <div className="stage" style={{ background: 'radial-gradient(60% 60% at 15% 10%, #d6e7f8, transparent 70%), var(--lienzo)' }}>
      {mail && (
        <div className="pop mail-toast" style={{ position: 'fixed', top: 20, right: 20, width: 340, background: '#fff', border: '1px solid var(--borde)', borderRadius: 14, boxShadow: 'var(--sombra-modal)', padding: 16, display: 'flex', gap: 12 }}>
          <Mail size={20} />
          <div><div className="t-label">Nuevo correo · Reveniu</div><div className="t-small">Tu código de verificación es <b style={{ color: 'var(--texto)', letterSpacing: '.1em' }}>{CODE}</b></div></div>
        </div>
      )}
      <div className="center-card">
        <Logo />
        <h1 className="t-l">Revisa tu correo.</h1>
        <p className="t-small">Enviamos un código de 6 caracteres a <b style={{ color: 'var(--texto)' }}>{email}</b>. Vence en 10 minutos. Puedes pegar el código completo.</p>
        <div className="code">
          {vals.map((v, i) => (
            <input key={i} ref={(el) => (refs.current[i] = el)} value={v} autoFocus={i === 0} aria-label={`Carácter ${i + 1}`}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Backspace' && !v && i > 0) refs.current[i - 1]?.focus(); if (e.key === 'Enter') verify(); }} />
          ))}
        </div>
        {error && <p className="t-help" style={{ color: 'var(--late-texto)' }}>Ese código no calza. Revisa el correo que te enviamos.</p>}
        <div className="m-pin"><button className="btn btn-primary btn-block" disabled={vals.join('').length < 6} onClick={verify}>Verificar y continuar</button></div>
        <div className="t-help" style={{ display: 'flex', justifyContent: 'space-between' }}><span>¿No llegó? Revisa spam o reenvía en 0:42</span><button className="t-help" style={{ textDecoration: 'underline' }} onClick={onBack}>Cambiar correo</button></div>
      </div>
    </div>
  );
}

function Bienvenida({ name, onStart, onLater }) {
  return (
    <div className="stage" style={{ background: 'radial-gradient(60% 60% at 15% 10%, #d6e7f8, transparent 70%), radial-gradient(40% 40% at 90% 90%, rgba(255,91,46,.10), transparent 70%), var(--lienzo)' }}>
      <div className="center-card fade-in" style={{ width: 'min(640px,100%)' }}>
        <span className="tag ok">Cuenta creada · modo prueba</span>
        <h1 className="t-l">Hola, {name || 'hola'}. Qué bueno tenerte aquí.</h1>
        <p className="t-body"><G>Necesitamos dos minutos de tu tiempo. Con unas pocas preguntas configuramos Reveniu para tu negocio: tu forma de cobrar, tu marca y tus agentes.</G></p>
        <div className="m-pin" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={onStart}>Empecemos</button>
          <button className="btn btn-text" onClick={onLater}>Prefiero hacerlo después</button>
        </div>
        <p className="t-help">Preguntas cortas, unos 3 minutos. Puedes volver atrás o cambiar cualquier respuesta después.</p>
      </div>
    </div>
  );
}

/* ---------------- Ramas de "Otro país" ---------------- */
function PaisNo({ onWrong, onNotify }) {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, maxWidth: 560, margin: '0 auto' }}>
      <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--superficie)', display: 'grid', placeItems: 'center' }}><Globe size={40} strokeWidth={1.5} /></div>
      <h1 className="t-l">Todavía no llegamos a tu país</h1>
      <p className="t-body">Por ahora Reveniu cobra solo desde Chile.</p>
      <div style={{ textAlign: 'left', background: 'var(--superficie)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        <div className="t-caps" style={{ color: 'var(--texto-2)' }}>Mientras tanto</div>
        <div style={{ display: 'flex', gap: 10 }}><Check size={18} /><div><div className="t-label">Cobra desde Chile a clientes de otros países</div><div className="t-help">Si tu empresa está en Chile, tus clientes pueden pagar desde cualquier país.</div></div></div>
        <div style={{ display: 'flex', gap: 10 }}><Check size={18} /><div><div className="t-label">Te avisamos cuando lleguemos</div><div className="t-help">Un solo correo, el día que abramos en tu país.</div></div></div>
      </div>
      <div className="m-pin" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}><button className="btn btn-primary btn-block" onClick={onNotify}>Avisarme cuando lleguen</button>
      <button className="btn btn-text" onClick={onWrong}>Me equivoqué, sí opero en Chile</button></div>
    </div>
  );
}
function PaisAviso({ email, onWrong, onOk }) {
  const [saving, setSaving] = useState(true);
  useEffect(() => { const t = setTimeout(() => setSaving(false), 1200); return () => clearTimeout(t); }, []);
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, maxWidth: 520, margin: 'auto' }}>
      {saving ? (<><Ring pct={0.7} size={56}><span /></Ring><p className="t-body">Guardando tu aviso…</p></>) : (<>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--ok-fondo)', display: 'grid', placeItems: 'center' }}><Check color="var(--ok-texto)" size={32} /></div>
        <h1 className="t-l">Listo, te avisaremos</h1>
        <p className="t-body">Te escribiremos a {email} apenas Reveniu llegue a tu país. Revisa también tu carpeta de spam.</p>
        <div className="m-pin" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}><button className="btn btn-primary btn-block" onClick={onOk}>Entendido</button>
        <button className="btn btn-text" onClick={onWrong}>Me equivoqué, sí opero en Chile</button></div>
      </>)}
    </div>
  );
}

/* ---------------- Revisar lo que leímos ---------------- */
function Revisar({ a, set, onDone }) {
  const [desc, setDesc] = useState(a.vende || 'Cursos online');
  const [nota, setNota] = useState('');
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h1 className="t-l">¿Es esto correcto?</h1>
      <p className="t-body" style={{ marginTop: -6 }}>Puedes cambiar cualquier dato en línea antes de seguir.</p>
      <div className="card" style={{ padding: 0 }}>
        {[['Empresa', a.org, (v) => set({ org: v })], ['Descripción', desc, setDesc]].map(([l, v, fn]) => (
          <div key={l} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--borde)' }}>
            <span className="t-small">{l}</span><input className="input" value={v} onChange={(e) => fn(e.target.value)} />
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
          <span className="t-small">Logo y colores</span>
          <div style={{ display: 'flex', gap: 6 }}>{['#2a5ce3', '#f9bf2e', '#171c29', '#ffffff'].map((c) => <span key={c} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: '1px solid var(--borde)' }} />)}</div>
        </div>
      </div>
      <TextArea label="¿Qué falta o qué cambiarías? (opcional)" value={nota} onChange={setNota} help="Lo guardamos como contexto para tus agentes y nuestro equipo." />
      <div className="m-pin" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => { if (!a.vende) set({ vende: desc }); onDone(); }}>Sí, es correcto</button>
      </div>
    </div>
  );
}

/* ---------------- Ficha de la empresa ---------------- */
function Ficha({ a, loading, onLoaded, onEdit }) {
  const [n, setN] = useState(loading ? 0 : 6);
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setN((x) => x + 1), 450);
    return () => clearInterval(t);
  }, [loading]);
  useEffect(() => { if (loading && n >= 7) onLoaded(); }, [n]); // eslint-disable-line
  const org = a.org || 'Tu organización';
  const ini = org.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const usuarios = usuariosDe(a);
  const cobro = a.cobro.map((c) => (c === 'Otro' ? a.cobroOtro : c));
  const datos = [
    ['Qué vendes', a.productos.length ? `${a.productos.length} ${a.productos.length === 1 ? 'producto' : 'productos'}` : (a.vende || '—'), a.productos.length ? a.productos.join(', ') : 'Lo que nos contaste', 4],
    ['Cómo cobras', cobro.slice(0, 2).join(' y ') || '—', cobro.length > 2 ? `y ${cobro.length - 2} más` : 'Armamos tu primer plan con esto', 5],
    ['A quién le cobras', `${a.quien || '—'}${a.cuando.length ? ', ' + a.cuando[0].toLowerCase() : ''}`, a.quien === 'Personas' ? 'Boletas automáticas en el SII' : 'Facturas o boletas en el SII', 7],
    ['Cómo llamas a tus usuarios', usuarios, 'Así aparecerá en mensajes y en tu portal', 3],
    ['Con qué cobras hoy', a.hoy.join(' · ') || '—', a.migrar.startsWith('Sí') ? `Te ayudamos a traer a tus ${usuarios.toLowerCase()}` : 'Puedes migrar cuando quieras', 9],
    ['Tu tamaño', a.clientes ? `${a.clientes} ${usuarios.toLowerCase()}` : '—', a.mensual ? `${a.mensual} al mes` : '', 8],
  ];
  const sitio = a.presencia !== 'No tengo ninguno' && a.sitio;
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      <h1 className="t-l q-title">{loading ? 'Estamos armando tu ficha…' : `Esto es lo que entendimos de ${org}`}</h1>
      <p className="t-body" style={{ marginBottom: 18 }}>{loading ? 'Juntamos lo que leímos de tu sitio, el SII y tus respuestas. Toma unos segundos.' : 'Así va a quedar tu cuenta. Si algo no calza, cámbialo con un clic.'}</p>
      <div className="ficha">
        <div className="ficha-head">
          <div className="ficha-logo">{ini}</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="t-l" style={{ fontSize: 28 }}>{org}</span><span className="tag ok" style={{ background: '#fff' }}>Modo prueba</span></div>
            <span className="t-small">{a.industria === 'Otra' ? a.industriaOtra : a.industria} · {a.rol === 'Otro' ? a.rolOtro : a.rol}</span>
            {sitio && <span className="t-help" style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}><Link2 size={14} style={{ flex: 'none', marginTop: 2 }} />{a.sitio}</span>}
          </div>
          {sitio && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}><span className="t-help">Tu marca</span><div style={{ display: 'flex', gap: 6 }}>{['#2a5ce3', '#f9bf2e', '#171c29', '#ffffff'].map((c) => <span key={c} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: '1px solid var(--borde)' }} />)}</div></div>}
        </div>
        <div className="ficha-grid">
          {datos.map(([l, v, d, i], k) => (
            <div key={l} className="dato">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="t-help" style={{ flex: 1 }}>{l}</span>
                {loading ? (k < n ? <Check size={14} color="var(--ok-texto)" /> : null) : <button aria-label={`Editar ${l}`} onClick={() => onEdit(i)}><Pencil size={14} color="var(--texto-3)" /></button>}
              </div>
              {loading && k >= n ? (<><div className="skeleton" style={{ width: '60%', height: 12, marginTop: 6 }} /><div className="skeleton" style={{ width: '85%', marginTop: 8 }} /></>) : (<><span className="t-label pop" style={{ fontSize: 15 }}>{v}</span><span className="t-help pop"><G>{d}</G></span></>)}
            </div>
          ))}
        </div>
        <div className="ficha-foot">
          {loading ? (<><Ring pct={Math.min(n, 6) / 6} size={20} stroke={3} color="var(--texto)"><span /></Ring><span style={{ flex: 1 }}>{n < 6 ? `Ordenando ${datos[Math.min(n, 5)][0].toLowerCase()}…` : 'Listo'}</span><span className="t-help">{Math.min(n, 6)} de 6</span></>) : (<>
            <Sparkles size={16} color="var(--agente-texto)" />
            <span style={{ flex: 1 }}><G>{`Tus agentes: Recovery para reintentar cobros e Inbox para responder a tus ${usuarios.toLowerCase()}.`}</G></span>
            <span className="tag agent">Recovery</span><span className="tag agent">Inbox</span>
          </>)}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Celebración ---------------- */
function Lista({ a, name, onValidate, onEnd }) {
  const z = useFit(820);
  const conf = useMemo(() => Array.from({ length: 36 }, (_, i) => ({ left: Math.random() * 100, delay: Math.random() * 4, dur: 5 + Math.random() * 5, c: ['#ff5b2e', '#a78bfa', '#5c8ff2', '#f9bf2e', '#12a37a'][i % 5], w: 6 + Math.random() * 6 })), []);
  return (
    <div className="celebra">
      {conf.map((c, i) => <span key={i} className="confeti" style={{ left: `${c.left}%`, width: c.w * 0.6, height: c.w * 1.6, background: c.c, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s`, opacity: .7 }} />)}
      <div className="premio fade-in" style={z < 1 ? { zoom: z } : null}>
        <div className="medalla">
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(255,91,46,.08)' }} />
          <div style={{ position: 'absolute' }}><Ring pct={0.67} size={112} stroke={9}><span /></Ring></div>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#ff7a4d,#ee4d1f)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 20px -6px rgba(238,77,31,.45)', position: 'relative' }}><Check color="#fff" size={36} strokeWidth={3} /></div>
        </div>
        <div style={{ height: 20 }} />
        <div className="t-label" style={{ color: 'var(--naranja-tinta)' }}>¡Bien hecho, {name || 'listo'}!</div>
        <h1 className="t-xl" style={{ marginTop: 8 }}>Tu cuenta ya está lista</h1>
        <p className="t-body" style={{ marginTop: 10, fontSize: 18 }}>Reveniu ya habla como {a.org || 'tu negocio'}. Puedes probar todo ahora; para cobrar de verdad te falta un solo paso.</p>
        <div style={{ height: 28 }} />
        <div className="logros">
          {[[Package, a.productos.length > 1 ? `${a.productos.length} productos` : (a.productos.length ? '1 producto' : 'Tu catálogo'), a.productos.length ? 'en tu catálogo' : 'listo para tus planes'], [Sparkles, '2 agentes', 'listos para trabajar'], [Users, 'Tu portal', `para tus ${usuariosDe(a).toLowerCase()}`]].map(([I, t, d]) => (
            <div key={t} className="logro"><div style={{ width: 32, height: 32, borderRadius: 10, background: '#fff', display: 'grid', placeItems: 'center', marginBottom: 8 }}><I size={18} color={t === '2 agentes' ? 'var(--agente-texto)' : 'var(--texto)'} /></div><span className="t-label">{t}</span><span className="t-help"><G>{d}</G></span></div>
          ))}
        </div>
        <div style={{ height: 16 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', border: '1px solid var(--naranja)', background: 'var(--naranja-suave)', borderRadius: 16, width: '100%', textAlign: 'left' }}>
          <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', color: 'var(--naranja-tinta)', fontWeight: 600, fontSize: 14 }}>3</span>
          <div style={{ flex: 1 }}><div className="t-label">Falta 1 paso: valida tu empresa y tu cuenta bancaria</div><div className="t-help">Unos 5 minutos. Lo pedimos solo cuando quieras cobrar de verdad.</div></div>
        </div>
        <div style={{ height: 28 }} />
        <div className="m-pin" style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => { track('final', 'validar'); onValidate(); }}>Validar mi empresa ahora</button>
          <button className="btn btn-text" style={{ padding: '0 16px' }} onClick={() => { track('final', 'despues'); onEnd(); }}>Lo hago después</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Retomar ---------------- */
function Retomar({ name, idx, onResume }) {
  const pct = idx / TOTAL_PREGUNTAS;
  const cur = STEPS[idx];
  return (
    <Shell name={name} stageIdx={cur.stage} fill={0.4} onHelp={() => {}} onExit={() => {}} help={false} closeHelp={() => {}} helpCtx={['', 0, {}]}
      footer={<button className="btn btn-primary" onClick={onResume}>Seguir donde quedé</button>}>
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="t-help">Bienvenida de vuelta</div>
        <h1 className="t-l" style={{ marginTop: 8 }}>Hola de nuevo, {name || ''}</h1>
        <p className="t-body" style={{ marginTop: 8, marginBottom: 16 }}>Guardamos todo lo que respondiste. Te faltan {TOTAL_PREGUNTAS - idx} preguntas.</p>
        <div className="ficha">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '20px 24px', background: 'var(--superficie)' }}>
            <Ring pct={pct}>{Math.round(pct * 100)}%</Ring>
            <div><div className="t-m">Llevas {idx} de {TOTAL_PREGUNTAS} preguntas</div><div className="t-help">Guardado recién</div></div>
          </div>
          {STAGES.map((s, i) => {
            const n = STEPS.filter((x) => x.stage === i).length + (i === 2 ? 1 : 0);
            const done = STEPS.filter((x, j) => x.stage === i && j < idx).length;
            const state = done === n ? 'done' : i === cur.stage ? 'cur' : 'todo';
            return (
              <div key={s} style={{ display: 'flex', alignItems: state === 'cur' ? 'flex-start' : 'center', gap: 16, padding: '16px 24px', borderTop: '1px solid var(--borde)' }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', background: state === 'done' ? 'var(--texto)' : state === 'cur' ? 'var(--naranja-suave)' : 'transparent', border: state === 'done' ? 0 : `1.5px solid ${state === 'cur' ? 'var(--naranja)' : 'var(--borde-fuerte)'}` }}>
                  {state === 'done' ? <Check size={16} color="#fff" /> : state === 'cur' ? <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--naranja)' }} /> : null}
                </span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', minHeight: 28, alignItems: 'center' }}><span className="t-label" style={{ flex: 1, color: state === 'todo' ? 'var(--texto-2)' : undefined }}>{s}</span><span className="t-help">{done} de {n}</span></div>
                  {state === 'cur' && <button onClick={onResume} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid var(--naranja)', background: 'var(--naranja-suave)', borderRadius: 12, textAlign: 'left' }}><span className="t-label" style={{ color: 'var(--naranja-tinta)' }}>Aquí quedaste</span><span className="t-small" style={{ flex: 1, color: 'var(--texto)' }}>{cur.title}</span><ChevronRight size={16} color="var(--naranja-tinta)" /></button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

function Fin() {
  return (
    <div className="stage" style={{ background: 'var(--lienzo)' }}>
      <div className="center-card" style={{ textAlign: 'center', alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--ok-fondo)', display: 'grid', placeItems: 'center' }}><Check color="var(--ok-texto)" size={30} /></div>
        <h1 className="t-l">¡Gracias por participar!</h1>
        <p className="t-body">Terminaste la prueba. Ya puedes avisarle a quien te acompaña.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <a className="btn btn-secondary" href="#moderador">Ver resultados</a>
          <button className="btn btn-primary" onClick={() => location.reload()}>Nueva prueba</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Editar un dato desde la ficha ---------------- */
function EditarDato({ step, a, set, onCancel, onSave }) {
  const ok = !!step.valid(a);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []); // eslint-disable-line
  return (
    <div className="edit-veil" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="edit-card pop" role="dialog" aria-label={`Editar: ${step.title}`}>
        <div className="edit-body">{step.render(a, set, { openReview: () => {} })}</div>
        <div className="edit-foot">
          <span className="t-help" style={{ flex: 1 }}>Vuelves a tu ficha al guardar.</span>
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" disabled={!ok} onClick={onSave}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Check, CircleDollarSign, Clock, Copy, Eye, FileText, House, IdCard, Info, Lock, MoreHorizontal, Package, RefreshCw, ScanFace, Shield, Sparkles, Users, X } from 'lucide-react';
import { Shell } from './Shell.jsx';
import { Options, Ring, TextField } from './ui.jsx';
import { G } from './glossary.jsx';
import { endPhase, enterStep, finishSession, track } from './metrics.js';

/* Flujo 2 · Validación de empresa (Figma 2.01 → 2.06). */

export const V_STAGES = ['Datos de la empresa', 'Representante legal', 'Cuenta bancaria', 'Revisión'];
const DOCS = ['e-RUT', 'Carpeta tributaria', 'Representantes legales', 'Inicio de actividades y giro', 'Declaraciones de IVA (F29)'];
const BANCOS = ['Banco de Chile', 'Banco Estado', 'Santander', 'BCI', 'Scotiabank', 'Itaú', 'Banco Security', 'Banco Falabella'];

const TITLES = {
  'v-sii': '2.01 · Conecta tu empresa con el SII',
  'v-leyendo': '2.01b · Leyendo el SII (carga)',
  'v-datos': '2.01c · Datos encontrados en el SII',
  'v-rep': '2.02 · ¿Eres el representante legal?',
  'v-identidad': '2.02 · Verificando identidad (simulado)',
  'v-invitada': '2.02c · Invitación enviada',
  'v-banco': '2.03 · Cuenta bancaria',
  'v-revision': '2.04 · Verificando tu empresa',
  'v-aprobada': '2.06 · Empresa aprobada · Inicio',
  'v-pausa': 'Validación · retomar',
};

/* ---------- RUT ---------- */
const limpiar = (r) => r.toUpperCase().replace(/[^0-9K]/g, '');
const dv = (cuerpo) => {
  let s = 0, m = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) { s += Number(cuerpo[i]) * m; m = m === 7 ? 2 : m + 1; }
  const r = 11 - (s % 11);
  return r === 11 ? '0' : r === 10 ? 'K' : String(r);
};
export const rutValido = (r) => { const c = limpiar(r); return c.length >= 8 && /^\d+$/.test(c.slice(0, -1)) && dv(c.slice(0, -1)) === c.slice(-1); };
const formatear = (r) => {
  const c = limpiar(r); if (c.length < 2) return c;
  return `${c.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${c.slice(-1)}`;
};
const iniciales = (t) => t.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export default function Validacion({ user, a, onBack, onDone }) {
  const [screen, setScreen] = useState('v-sii');
  const [last, setLast] = useState('v-sii');
  const [help, setHelp] = useState(false);
  const [toast, setToast] = useState('');
  const [rut, setRut] = useState('');
  const [clave, setClave] = useState('');
  const [consent, setConsent] = useState(false);
  const [tried, setTried] = useState(false);
  const [rep, setRep] = useState('Sí, soy yo');
  const [inv, setInv] = useState({ nombre: '', contacto: '' });
  const [banco, setBanco] = useState({ banco: '', tipo: 'Cuenta corriente', numero: '', correo: user.correo || '' });
  const [aviso, setAviso] = useState(true);

  const org = a.org?.trim() || 'Academia Andes SpA';
  const giro = a.industria === 'Otra' ? (a.industriaOtra || 'Servicios') : (a.industria || 'Enseñanza de idiomas');
  const repName = `${user.nombre} ${user.apellido}`.trim() || 'Camila Rojas Pérez';
  const invitado = rep === 'No, es otra persona';

  useEffect(() => { enterStep(screen, TITLES[screen]); }, [screen]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2400); return () => clearTimeout(t); }, [toast]);

  const go = (s) => setScreen(s);
  const shellProps = (stageIdx, fill, title) => ({
    name: user.nombre, stageIdx, fill, stages: V_STAGES, proceso: 'Valida tu empresa',
    onHelp: () => { track('ayuda', screen); setHelp(true); }, help, closeHelp: () => setHelp(false), helpCtx: [title, stageIdx + 1, user],
    onExit: () => { track('guardar_y_salir', screen); setLast(screen); go('v-pausa'); },
  });

  let body;
  switch (screen) {
    case 'v-sii': {
      const okRut = rutValido(rut);
      const listo = rut && clave.length >= 4 && consent;
      const conectar = () => {
        setTried(true);
        if (!okRut) { track('rut_invalido', rut); return; }
        go('v-leyendo');
      };
      body = (
        <Shell {...shellProps(0, 0.25, 'Conecta tu empresa con el SII')}
          footer={<>
            <button className="btn btn-text t-help note" style={{ textDecoration: 'underline' }} onClick={() => { track('subir_documentos'); setToast('En esta prueba seguimos con la conexión al SII.'); }}>Prefiero subir los documentos yo</button>
            <button className="btn btn-secondary" onClick={() => { track('atras', 'v-sii'); onBack(); }}>Atrás</button>
            <button className="btn btn-primary" disabled={!listo} onClick={conectar}>Conectar con el SII</button>
          </>}>
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 className="t-l q-title"><G>Conecta tu empresa con el SII</G></h1>
            <p className="t-body q-sub">Con el RUT y la clave tributaria de tu empresa traemos solos los documentos que necesitamos para validarla. No tienes que subir nada.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TextField label="RUT de la empresa" value={rut} onChange={(v) => { setRut(formatear(v)); setTried(false); }} placeholder="76.543.210-3" autoFocus
                error={tried && !okRut && 'Revisa el RUT: el dígito verificador no calza.'} help={okRut ? org : 'Con puntos y guion, como aparece en tu e-RUT.'} />
              <TextField label="Clave tributaria del SII" type="password" value={clave} onChange={setClave} help="La misma con que entras a sii.cl. No es tu ClaveÚnica." />
            </div>
            <div className="gap-m" />
            <div className="sii-docs">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={16} /><span className="t-label" style={{ flex: 1 }}>Lo que traemos del SII, en solo lectura</span><span className="t-help">5 documentos</span></div>
              <div className="doc-chips">{DOCS.map((d) => <span key={d} className="doc-chip"><FileText size={13} />{d}</span>)}</div>
            </div>
            <div className="gap-m" />
            <div className="garantias">
              {[[Eye, 'Solo leemos', 'No presentamos ni firmamos nada en tu nombre.'], [Lock, 'Cifrada', 'Tu clave se guarda cifrada y nadie del equipo la ve.'], [Shield, 'Tú decides', 'Puedes desconectar el SII cuando quieras.']].map(([I, t, d]) => (
                <div key={t} style={{ display: 'flex', gap: 10 }}><span className="ico-chip"><I size={15} /></span><div><div className="t-label">{t}</div><div className="t-help">{d}</div></div></div>
              ))}
            </div>
            <div className="gap-m" />
            <button className={`check-row${consent ? ' on' : ''}`} onClick={() => setConsent(!consent)} aria-pressed={consent}>
              <span className="mark check">{consent && <Check size={12} color="#fff" strokeWidth={3} />}</span>
              <span className="t-small" style={{ color: 'var(--texto)' }}><G>Autorizo a Reveniu a consultar estos documentos en el SII para validar mi empresa.</G></span>
            </button>
          </div>
        </Shell>
      );
      break;
    }
    case 'v-leyendo':
      body = <Shell {...shellProps(0, 0.5, 'Leyendo el SII')} footer={<span style={{ height: 46 }} />}><Leyendo org={org} rut={rut} giro={giro} onDone={() => go('v-datos')} /></Shell>;
      break;
    case 'v-datos':
      body = (
        <Shell {...shellProps(0, 0.9, 'Datos encontrados en el SII')}
          footer={<>
            <button className="btn btn-text t-help note" style={{ textDecoration: 'underline' }} onClick={() => { track('algo_no_calza'); go('v-sii'); }}>Algo no calza: corregir</button>
            <button className="btn btn-secondary" onClick={() => { track('atras', 'v-datos'); go('v-sii'); }}>Atrás</button>
            <button className="btn btn-primary" onClick={() => go('v-rep')}>Sí, es mi empresa</button>
          </>}>
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 className="t-l q-title">Listo, encontramos todo lo que necesitamos</h1>
            <p className="t-body q-sub">Revisa que los datos sean de tu empresa. Los documentos ya quedaron guardados en tu cuenta.</p>
            <div className="ficha">
              <div className="ficha-head">
                <div className="ficha-logo">{iniciales(org)}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="t-m">{org}</span><span className="tag ok" style={{ background: 'rgba(255,255,255,.8)' }}>Activa en el SII</span></div>
                  <span className="t-small">RUT {rut}</span>
                </div>
              </div>
              <div className="ficha-grid">
                {[['Giro', giro], ['Inicio de actividades', '14 de marzo de 2019'], ['Dirección', 'Providencia 1208, of. 402'], ['Representante legal', repName], ['Tipo de sociedad', 'Sociedad por Acciones'], ['Régimen tributario', 'Pro Pyme General']].map(([l, v]) => (
                  <div key={l} className="dato" style={{ minHeight: 0, padding: '12px 20px' }}><span className="t-help">{l}</span><span className="t-label" style={{ fontSize: 15 }}>{v}</span></div>
                ))}
              </div>
            </div>
            <div className="gap-m" />
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}><span className="t-label" style={{ flex: 1 }}>Documentos guardados</span><span className="t-help">5 de 5</span></div>
            <div className="doc-chips">{DOCS.map((d) => <span key={d} className="doc-chip on"><span className="mini-check"><Check size={10} color="#fff" strokeWidth={3} /></span>{d}</span>)}</div>
          </div>
        </Shell>
      );
      break;
    case 'v-rep': {
      const okInv = inv.nombre.trim() && inv.contacto.trim().length >= 6;
      body = (
        <Shell {...shellProps(1, invitado ? 0.6 : 0.3, '¿Eres el representante legal?')}
          footer={<>
            <button className="btn btn-secondary" onClick={() => { track('atras', 'v-rep'); go('v-datos'); }}>Atrás</button>
            {invitado
              ? <button className="btn btn-primary" disabled={!okInv} onClick={() => { track('invitacion_enviada'); go('v-invitada'); }}>Enviar invitación</button>
              : <button className="btn btn-primary" onClick={() => go('v-identidad')}>Verificar mi identidad</button>}
          </>}>
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="tag ok">Encontrado en el SII</span>
            <div style={{ height: 14 }} />
            <h1 className="t-l q-title">¿Eres {repName}?</h1>
            <p className="t-body" style={{ marginBottom: 28 }}>El SII registra a esta persona como representante legal de {org}.</p>
            <Options value={rep} onChange={(v) => { track('representante', v); setRep(v); }} options={[{ t: 'Sí, soy yo', d: 'Verifico mi identidad ahora.' }, { t: 'No, es otra persona', d: 'Le pedimos que lo haga y tú sigues.' }]} />
            <div style={{ height: 28 }} />
            {invitado ? (
              <div className="vpanel pop" key="no">
                <div className="vband">
                  <span className="vavatar"><Users size={20} /></span>
                  <div style={{ flex: 1 }}><div className="t-m" style={{ fontSize: 18 }}>Invita al representante legal</div><div className="t-help">Le enviamos un link para verificarse en 2 minutos. Mientras tanto, tú sigues configurando.</div></div>
                </div>
                <div className="vbody" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <TextField label="Nombre" value={inv.nombre} onChange={(v) => setInv((p) => ({ ...p, nombre: v }))} placeholder="Ej: Pedro Andes" />
                  <TextField label="Correo o WhatsApp" value={inv.contacto} onChange={(v) => setInv((p) => ({ ...p, contacto: v }))} placeholder="nombre@empresa.cl" />
                </div>
              </div>
            ) : (
              <div className="vpanel pop" key="si">
                <div className="vband">
                  <div style={{ flex: 1 }}><div className="t-m" style={{ fontSize: 18 }}>Verifica tu identidad en 2 minutos</div><div className="t-help"><G>Con un proveedor certificado. No guardamos la foto de tu cédula.</G></div></div>
                  <div style={{ textAlign: 'right' }}><div className="t-label">¿Mejor en el celular?</div><div className="t-help">Escanea el código</div></div>
                  <Qr />
                </div>
                <div className="vbody vsteps">
                  {[[IdCard, 'Foto de tu cédula', 'Por ambos lados'], [ScanFace, 'Una selfie', 'Para saber que eres tú'], [Check, 'Listo', 'Lo comparamos con el SII']].map(([I, t, d], i) => (
                    <div key={t} className="vstep">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className={`vtile${i === 2 ? ' dark' : ''}`}><I size={19} color={i === 2 ? '#fff' : 'var(--texto)'} /></span>{i < 2 && <span className="vline" />}</div>
                      <div className="t-label" style={{ marginTop: 12 }}>{t}</div><div className="t-help">{d}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Shell>
      );
      break;
    }
    case 'v-identidad':
      body = <Shell {...shellProps(1, 0.8, 'Verificando tu identidad')} footer={null}><Identidad onDone={() => go('v-banco')} /></Shell>;
      break;
    case 'v-invitada': {
      const contacto = inv.contacto.trim();
      body = (
        <Shell {...shellProps(1, 1, 'Invitación enviada')} footerStack
          footer={<>
            <button className="btn btn-secondary" onClick={() => { track('cambiar_correo'); go('v-rep'); }}>Cambiar correo</button>
            <button className="btn btn-primary" onClick={() => go('v-banco')}>Seguir con la cuenta bancaria</button>
          </>}>
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="ok-badge"><Check size={24} color="var(--ok-texto)" /></span>
            <div style={{ height: 22 }} />
            <h1 className="t-l q-title">Invitación enviada</h1>
            <p className="t-body" style={{ marginBottom: 28 }}>Le enviamos el link a {inv.nombre.trim()}. Te avisamos apenas verifique su identidad.</p>
            <div className="vpanel">
              <div className="vband" style={{ background: 'var(--base)' }}>
                <span className="vavatar" style={{ border: '1px solid var(--borde)' }}>{iniciales(inv.nombre) || <Users size={18} />}</span>
                <div style={{ flex: 1 }}><div className="t-m" style={{ fontSize: 18 }}>{inv.nombre.trim()}</div><div className="t-help">{contacto}</div></div>
                <span className="tag due">Esperando verificación</span>
              </div>
              <div className="vbody resend" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--superficie)', borderTop: '1px solid var(--borde)', padding: '14px 28px' }}>
                <span className="t-small" style={{ flex: 1 }}>¿No le llegó? Reenvíalo o comparte el link tú.</span>
                <button className="btn btn-secondary btn-s" onClick={() => { track('reenviar_invitacion'); setToast('Invitación reenviada.'); }}><RefreshCw size={15} />Reenviar</button>
                <button className="btn btn-secondary btn-s" onClick={() => { track('copiar_link'); setToast('Link copiado.'); }}><Copy size={15} />Copiar link</button>
              </div>
            </div>
            <div style={{ height: 22 }} />
            <div className="t-small" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={15} />No necesitas esperar: mientras se verifica, sigue con la cuenta bancaria.</div>
          </div>
        </Shell>
      );
      break;
    }
    case 'v-banco': {
      const ok = banco.banco && banco.numero.replace(/\D/g, '').length >= 6 && /^\S+@\S+\.\S+$/.test(banco.correo);
      const b = (k) => (v) => setBanco((p) => ({ ...p, [k]: v }));
      body = (
        <Shell {...shellProps(2, 0.5, 'Cuenta bancaria')}
          footer={<>
            <button className="btn btn-secondary" onClick={() => { track('atras', 'v-banco'); go(invitado ? 'v-invitada' : 'v-rep'); }}>Atrás</button>
            <button className="btn btn-primary" disabled={!ok} onClick={() => go('v-revision')}>Enviar a revisión</button>
          </>}>
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 className="t-l q-title">Cuenta bancaria</h1>
            <p className="t-body q-sub"><G>Aquí depositamos lo que cobras. Te avisamos cada vez que liquidemos.</G></p>
            {aviso && (
              <div className="aviso">
                <Info size={17} />
                <div style={{ flex: 1 }}><div className="t-label">La cuenta debe estar a nombre de la empresa</div><div className="t-help"><G>Si es de una persona, el banco rechaza el depósito y se atrasa tu liquidación.</G></div></div>
                <button aria-label="Cerrar aviso" onClick={() => setAviso(false)}><X size={16} /></button>
              </div>
            )}
            <div className="gap-m" />
            <label className="field"><span className="t-label">Banco</span>
              <select className="input select" value={banco.banco} onChange={(e) => b('banco')(e.target.value)}><option value="" disabled>Elige tu banco</option>{BANCOS.map((x) => <option key={x}>{x}</option>)}</select>
            </label>
            <div className="gap-m" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="field"><span className="t-label">Tipo de cuenta</span>
                <select className="input select" value={banco.tipo} onChange={(e) => b('tipo')(e.target.value)}>{['Cuenta corriente', 'Cuenta vista', 'Cuenta de ahorro'].map((x) => <option key={x}>{x}</option>)}</select>
              </label>
              <TextField label="Número de cuenta" value={banco.numero} onChange={b('numero')} placeholder="00-123-45678-09" />
            </div>
            <div className="gap-m" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="field"><span className="t-label">RUT del titular</span>
                <div className="input" style={{ display: 'flex', alignItems: 'center', background: 'var(--superficie)' }}><span style={{ flex: 1 }}>{rut}</span><Check size={16} color="var(--ok-texto)" /></div>
                <span className="t-help">Coincide con la empresa</span>
              </label>
              <TextField label="Correo para avisos de depósito" value={banco.correo} onChange={b('correo')} help="Te avisamos cada vez que liquidemos." />
            </div>
          </div>
        </Shell>
      );
      break;
    }
    case 'v-revision':
      body = <Shell {...shellProps(3, 0.75, 'Verificando tu empresa')} footer={null}>
        <Revision org={org} repName={invitado ? inv.nombre.trim() : repName} invitado={invitado} banco={banco} onDone={() => go('v-aprobada')} />
      </Shell>;
      break;
    case 'v-aprobada':
      body = <Aprobada name={user.nombre} org={org} onEnd={onDone} />;
      break;
    case 'v-pausa':
      body = (
        <Shell {...shellProps(V_STAGES.length - 1, 0, '')} footer={<button className="btn btn-primary" onClick={() => { track('retomar'); go(last); }}>Seguir donde quedé</button>}>
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="t-help">Guardado recién</div>
            <h1 className="t-l">Guardamos tu avance, {user.nombre || ''}</h1>
            <p className="t-body">Cuando vuelvas, sigues la validación de tu empresa justo donde quedaste.</p>
          </div>
        </Shell>
      );
      break;
    default: body = null;
  }

  return <>{body}{toast && <div className="toast pop" role="status">{toast}</div>}</>;
}

/* ---------- 2.01b · Leyendo el SII ---------- */
function Leyendo({ org, rut, giro, onDone }) {
  const [n, setN] = useState(0);
  useEffect(() => { const t = setInterval(() => setN((x) => x + 1), 1100); return () => clearInterval(t); }, []);
  useEffect(() => { if (n === 6) onDone(); }, [n]); // eslint-disable-line
  const items = [['e-RUT', `${org} · ${rut}`], ['Situación tributaria', 'Activa, sin observaciones'], ['Inicio de actividades y giro', `14 mar 2019 · ${giro}`], ['Carpeta tributaria', 'Socios y representantes'], ['Declaraciones de IVA (F29)', 'Últimos 12 meses']];
  const done = Math.min(n, 5);
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      <h1 className="t-l q-title"><G>Estamos leyendo tu empresa en el SII</G></h1>
      <p className="t-body q-sub">Toma unos segundos. Puedes quedarte aquí: te avisamos apenas esté listo.</p>
      <div className="leyendo">
        <div className="leyendo-ilus">
          <div className="hoja">
            <span className="hoja-tag">SII</span>
            {[80, 64, 90, 56, 74].map((w, i) => <span key={i} className="hoja-linea" style={{ width: `${w}%` }} />)}
            <span className="scan" />
            <span className="hoja-lock"><Lock size={12} /></span>
          </div>
        </div>
        <div className="leyendo-lista">
          <div style={{ display: 'flex' }}><span className="t-label" style={{ flex: 1 }}>Leyendo documentos</span><span className="t-help">{done} de 5</span></div>
          <div className="barra"><div style={{ width: `${(done / 5) * 100}%` }} /></div>
          {items.map(([t, d], i) => (
            <div key={t} className="leyendo-item">
              {i < done ? <span className="mini-check l"><Check size={12} color="#fff" strokeWidth={3} /></span> : i === done ? <Ring pct={0.3} size={20} stroke={2.5}><span /></Ring> : <span className="mini-empty" />}
              <div style={{ flex: 1 }}>
                <div className="t-label" style={{ color: i > done ? 'var(--texto-2)' : undefined }}>{t}</div>
                {i < done ? <div className="t-help pop">{d}</div> : i === done ? <div className="t-help" style={{ color: 'var(--naranja-tinta)' }}>Leyendo…</div> : <div className="skeleton" style={{ width: 120, marginTop: 6 }} />}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 14 }} />
      <div className="t-help" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Lock size={13} />Conexión cifrada y de solo lectura. Nunca presentamos ni firmamos nada en tu nombre.</div>
    </div>
  );
}

/* ---------- 2.02 · Verificación de identidad (simulada) ---------- */
function Identidad({ onDone }) {
  const [n, setN] = useState(0);
  useEffect(() => { const t = setInterval(() => setN((x) => Math.min(x + 1, 3)), 1300); return () => clearInterval(t); }, []);
  const steps = [[IdCard, 'Foto de tu cédula', 'Leímos ambos lados'], [ScanFace, 'Selfie', 'Coincide con tu cédula'], [Check, 'Comparación con el SII', 'Eres representante legal']];
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      <h1 className="t-l q-title">{n < 3 ? 'Verificando tu identidad…' : 'Identidad verificada'}</h1>
      <p className="t-body q-sub">En esta prueba simulamos la cámara: no necesitas tu cédula.</p>
      <div className="vpanel">
        {steps.map(([I, t, d], i) => (
          <div key={t} className="leyendo-item" style={{ padding: '16px 24px', borderTop: i ? '1px solid var(--borde)' : 0 }}>
            <span className={`vtile${i < n ? ' dark' : ''}`}><I size={19} color={i < n ? '#fff' : 'var(--texto)'} /></span>
            <div style={{ flex: 1 }}><div className="t-label">{t}</div><div className="t-help">{i < n ? d : i === n ? 'Revisando…' : 'Pendiente'}</div></div>
            {i < n ? <span className="tag ok">Listo</span> : i === n ? <Ring pct={0.3} size={20} stroke={2.5}><span /></Ring> : null}
          </div>
        ))}
      </div>
      <div style={{ height: 24 }} />
      {n >= 3 && <div className="pop m-pin" style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" onClick={onDone}>Seguir con la cuenta bancaria</button></div>}
    </div>
  );
}

/* ---------- 2.04 · Revisión ---------- */
function Revision({ org, repName, invitado, banco, onDone }) {
  const [n, setN] = useState(0);
  useEffect(() => { const t = setInterval(() => setN((x) => x + 1), 1300); return () => clearInterval(t); }, []);
  useEffect(() => { if (n === 5) onDone(); }, [n]); // eslint-disable-line
  const last4 = banco.numero.replace(/\D/g, '').slice(-4);
  const items = [
    ['RUT y situación en el SII', `${org} · activa`],
    ['Identidad del representante', invitado ? `${repName} · se verificó con cédula y selfie` : `${repName} · verificada con cédula y selfie`],
    ['Cuenta bancaria a nombre de la empresa', `${banco.banco} ···· ${last4} · RUT coincide`],
    ['Últimos controles de seguridad', 'Listas de riesgo sin observaciones'],
  ];
  const done = Math.min(n, 4);
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      <h1 className="t-l q-title">Verificando tu empresa</h1>
      <div style={{ display: 'flex', marginTop: 6 }}><span className="t-label" style={{ flex: 1 }}>{done} de 4 revisiones listas</span><span className="t-help">{done * 25}%</span></div>
      <div className="barra" style={{ margin: '10px 0 18px' }}><div style={{ width: `${done * 25}%` }} /></div>
      <div className="vpanel">
        {items.map(([t, d], i) => (
          <div key={t} className="leyendo-item" style={{ padding: '14px 20px', borderTop: i ? '1px solid var(--borde)' : 0 }}>
            {i < done ? <Check size={17} color="var(--ok-texto)" /> : <Clock size={17} color="var(--texto-3)" />}
            <div style={{ flex: 1 }}><div className="t-label">{t}</div><div className="t-help">{i < done ? d : i === done ? 'Revisando…' : 'En espera'}</div></div>
            {i < done ? <span className="tag ok">Listo</span> : i === done ? <span className="tag neutral">En curso</span> : null}
          </div>
        ))}
      </div>
      <div style={{ height: 16 }} />
      <div className="aviso"><Info size={17} /><div style={{ flex: 1 }}><div className="t-label">Si algo no calza, te decimos qué es aquí mismo</div><div className="t-help"><G>Lo corriges en el momento. Solo los casos poco comunes pasan a una persona, que responde en menos de 2 horas hábiles; mientras, sigues en modo prueba.</G></div></div></div>
    </div>
  );
}

/* ---------- 2.06 · Empresa aprobada en Inicio ---------- */
function Aprobada({ name, org, onEnd }) {
  useEffect(() => { endPhase('validacion'); finishSession(); }, []);
  const pasos = [['Crea tu producto', 'Lo que vendes y cómo lo cuentas: por alumno, por usuario, por sesión.'], ['Arma tu plan', 'Te sugerimos uno con lo que nos contaste.'], ['Publica tu checkout o link de pago', 'Tus clientes pagan desde un link o desde tu sitio.'], ['Haz un pago de prueba', 'Usa la tarjeta 4242 4242 4242 4242.']];
  return (
    <div className="app-inicio">
      <aside className="app-side"><span className="logo-mark" style={{ width: 28, height: 28, borderRadius: 8 }} /><span className="avatar" style={{ background: 'var(--suave)', color: 'var(--texto)' }}>{iniciales(org)}</span></aside>
      <div className="app-main">
        <div className="app-topbar"><span className="logo-mark" style={{ width: 28, height: 28, borderRadius: 8 }} /><span className="spacer" /><span className="avatar" style={{ background: 'var(--suave)', color: 'var(--texto)' }}>CR</span></div>
        <div className="franja-prueba"><G>Modo prueba</G> · Los cobros no son reales. <u>Activar cobros reales</u></div>
        <div className="app-content fade-in">
          <div className="t-help">Hoy</div>
          <h1 className="t-xl" style={{ marginTop: 4 }}>Primeros pasos</h1>
          <div className="aviso ok pop" style={{ marginTop: 24 }}>
            <Check size={18} color="var(--ok-texto)" />
            <div style={{ flex: 1 }}><div className="t-label">Tu empresa está validada</div><div className="t-help">Ya puedes cobrar de verdad. Tus datos quedaron en Ajustes › Empresa.</div></div>
            <button className="btn btn-text t-label" style={{ textDecoration: 'underline', color: 'var(--ok-texto)' }} onClick={() => track('activar_cobros_reales')}>Activar cobros reales</button>
          </div>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 860 }}>
            {pasos.map(([t, d], i) => (
              <div key={t} className={`paso${i === 0 ? ' on' : ''}`}><span className="paso-n">{i + 1}</span><div><div className="t-label" style={{ fontSize: 15 }}><G>{t}</G></div><div className="t-help">{d}</div></div></div>
            ))}
          </div>
        </div>
      </div>
      <nav className="tabbar">{[[House, 'Inicio'], [Sparkles, 'Agentes'], [CircleDollarSign, 'Cobrar'], [Package, 'Vender'], [MoreHorizontal, 'Más']].map(([I, l], i) => <span key={l} className={i === 0 ? 'on' : ''}><I size={21} />{l}</span>)}</nav>
      <div className="fin-prueba pop">
        <div style={{ flex: 1 }}><div className="t-label">¡Listo, {name || 'terminaste'}!</div><div className="t-help">Terminaste la prueba. Avísale a quien te acompaña.</div></div>
        <button className="btn btn-primary btn-s" onClick={onEnd}>Terminar</button>
      </div>
    </div>
  );
}

/* ---------- QR decorativo ---------- */
function Qr() {
  const cells = useMemo(() => {
    const n = 21, out = []; let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const finder = (x, y) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (finder(x, y)) {
        const [fx, fy] = x < 7 && y < 7 ? [0, 0] : x >= n - 7 ? [n - 7, 0] : [0, n - 7];
        const dx = x - fx, dy = y - fy; const ring = Math.min(dx, dy, 6 - dx, 6 - dy);
        if (ring !== 1) out.push([x, y]);
      } else if (rnd() > 0.52) out.push([x, y]);
    }
    return out;
  }, []);
  return <svg className="qr" viewBox="0 0 21 21" aria-label="Código QR para seguir en el celular">{cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)}</svg>;
}

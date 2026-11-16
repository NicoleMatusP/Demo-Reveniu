import { Eye } from 'lucide-react';
import { Chips, Options, TextArea, TextField } from './ui.jsx';
import { G } from './glossary.jsx';

export const STAGES = ['Tu empresa', 'Tu cobro', 'Tu realidad'];

const ROLES = [
  { t: 'Gerencia general o fundador', d: 'El negocio y las prioridades del mes.' },
  { t: 'Finanzas', d: 'Ingresos, proyección y fugas.' },
  { t: 'Tesorería', d: 'Conciliación, abonos y caja.' },
  { t: 'Cobranza o administración', d: 'Deuda vencida y planes de pago.' },
  { t: 'Tecnología', d: 'API, webhooks e integraciones.' },
  { t: 'Marketing o crecimiento', d: 'Conversión, planes y campañas.' },
  { t: 'Otro', d: 'Te mostramos un resumen general.' },
];
const INDUSTRIAS = ['Colegios', 'Educación online', 'Gimnasios', 'Fundaciones', 'Salud', 'SaaS', 'Otra'];
const USUARIOS = ['Clientes', 'Alumnos', 'Apoderados', 'Socios', 'Pacientes', 'Otro'];
const COBRO = [
  { t: 'Suscripción', d: 'Un monto fijo cada mes o cada año.' },
  { t: 'Suscripción con tarjeta inscrita', d: 'Se cobra solo cada mes.' },
  { t: 'Cobro recurrente variable', d: 'El monto cambia cada período.' },
  { t: 'Cobro en cuotas', d: 'Un total dividido en cuotas.' },
  { t: 'Cobro por consumo', d: 'Según lo que usa cada cliente.' },
  { t: 'Facturas por cobrar', d: 'A empresas, con fecha de vencimiento.' },
  { t: 'Pagos puntuales', d: 'Una sola vez, con link o checkout.' },
  { t: 'Aportes o donaciones', d: 'El monto lo elige quien aporta.' },
  { t: 'Otro' },
];
const METODOS = [
  { t: 'Tarjeta de crédito, débito y prepago', d: 'Pago al momento, con Webpay.' },
  { t: 'Cuotas con y sin interés', d: 'El cliente elige en cuántas cuotas paga.' },
  { t: 'Tarjeta inscrita', d: 'Se cobra solo cada mes.' },
  { t: 'Transferencia bancaria', d: 'Te avisamos cuando llega y la conciliamos.' },
  { t: 'PAC · cargo automático en cuenta', d: 'Se descuenta de su cuenta corriente.' },
  { t: 'Cobrar a clientes de otros países', d: 'Tarjetas internacionales, en pesos o dólares.' },
];
const CUANDO = [
  { t: 'Por adelantado', d: 'Antes de entregar el servicio.' },
  { t: 'A medida que entregas', d: 'Por sesión, avance o hito.' },
  { t: 'Contra entrega', d: 'Cuando el trabajo está listo.' },
];
const HOY = [
  { t: 'Transbank directo', d: 'Webpay o PAC con contrato propio' },
  { t: 'Flow', d: 'Pasarela de pagos' },
  { t: 'Mercado Pago', d: 'Links y suscripciones' },
  { t: 'Khipu', d: 'Transferencias' },
  { t: 'Planilla y transferencias', d: 'Cobras a mano' },
  { t: 'Recién empiezo', d: 'Aún no cobras' },
];
const COMPLICA = ['Pagos que fallan y nadie los recupera', 'Cobranza manual que se come al equipo', 'Clientes que se van sin aviso', 'Conciliar lo que entró con lo facturado', 'No veo bien mis ingresos', 'Facturación electrónica y SII', 'Deuda vencida que no logro cobrar', 'Todo repartido en varios sistemas', 'Otro'];

export const initialAnswers = {
  pais: '', org: '', presencia: '', sitio: '', rol: '', rolOtro: '',
  industria: '', industriaOtra: '', usuarios: '', usuariosOtro: '',
  vende: '', productos: [], cobro: [], cobroOtro: '', metodos: [],
  quien: '', cuando: [], mensual: '', ticket: '', clientes: '',
  hoy: [], migrar: '', complica: [], complicaOtro: '',
};

const leido = (a) => (a.presencia === 'Tengo sitio web' || a.presencia === 'Solo redes sociales') && a.sitio.trim().length > 2;
const Q = ({ title, sub }) => (<><h1 className="t-l q-title">{title}</h1><p className="t-body q-sub"><G>{sub}</G></p></>);
const Gap = ({ s = 'l' }) => <div className={`gap-${s}`} />;

export const STEPS = [
  {
    id: 'pais', stage: 0, title: '¿Dónde opera tu empresa?',
    valid: (a) => !!a.pais,
    render: (a, set) => (<>
      <Q title="¿Dónde opera tu empresa?" sub="Lo preguntamos primero porque define qué podemos cobrar por ti." />
      <Options cols={1} value={a.pais} onChange={(v) => set({ pais: v })} options={[
        { t: 'Chile', d: 'Transbank, PAC, transferencia, SII y cobro internacional entrante.' },
        { t: 'Otro país', d: 'Todavía no operamos fuera de Chile.' },
      ]} />
    </>),
  },
  {
    id: 'org', stage: 0, title: '¿Cómo se llama tu organización?',
    valid: (a) => a.org.trim() && a.presencia && (a.presencia === 'No tengo ninguno' || a.sitio.trim()),
    render: (a, set) => (<>
      <Q title="¿Cómo se llama tu organización?" sub="Si tienes sitio web o redes sociales, los leemos mientras respondes y te ahorramos preguntas." />
      <TextField label="Nombre de la organización" value={a.org} onChange={(v) => set({ org: v })} placeholder="Ej: Academia Andes" help="Así te verán tus clientes." autoFocus />
      <Gap s="m" />
      <div className="block-label">¿Dónde te encuentran tus clientes?</div>
      <Chips options={['Tengo sitio web', 'Solo redes sociales', 'No tengo ninguno']} value={a.presencia} onChange={(v) => set({ presencia: v })} />
      {a.presencia === 'Tengo sitio web' && <div className="pop" style={{ marginTop: 18 }}><TextField label="Sitio web o nombre de la empresa" value={a.sitio} onChange={(v) => set({ sitio: v })} placeholder="tuempresa.cl" help="Puede ser tu sitio o tu Instagram. Si escribes solo el nombre, lo buscamos por ti." autoFocus /></div>}
      {a.presencia === 'Solo redes sociales' && <div className="pop" style={{ marginTop: 18 }}><TextField label="Tu Instagram, Facebook o TikTok" value={a.sitio} onChange={(v) => set({ sitio: v })} placeholder="@tuempresa" help="Leemos tu perfil público: nombre, logo, colores y lo que ofreces. Nunca publicamos nada." autoFocus /></div>}
      {a.presencia === 'No tengo ninguno' && <p className="t-small pop" style={{ marginTop: 16 }}>Sin problema. Te haremos un par de preguntas más en los próximos pasos para armar tu cuenta.</p>}
    </>),
  },
  {
    id: 'rol', stage: 0, title: '¿Cuál es tu rol?',
    valid: (a) => a.rol && (a.rol !== 'Otro' || a.rolOtro.trim()),
    render: (a, set) => (<>
      <Q title="¿Cuál es tu rol?" sub="Define qué ves primero en tu panel. Puedes cambiarlo cuando quieras." />
      <Options value={a.rol} onChange={(v) => set({ rol: v })} options={ROLES} />
      {a.rol === 'Otro' && <div className="pop" style={{ marginTop: 16 }}><TextField label="¿Cuál es tu rol?" value={a.rolOtro} onChange={(v) => set({ rolOtro: v })} placeholder="Ej: Jefa de administración y finanzas" help="Lo usamos para mostrarte primero lo que más te sirve." autoFocus /></div>}
    </>),
  },
  {
    id: 'industria', stage: 0, title: '¿En qué industria estás?',
    onEnter: (a, set) => { if (!a.industria && leido(a)) set({ industria: 'Educación online' }); },
    valid: (a) => a.industria && (a.industria !== 'Otra' || a.industriaOtra.trim()) && a.usuarios && (a.usuarios !== 'Otro' || a.usuariosOtro.trim()),
    render: (a, set) => (<>
      <Q title="¿En qué industria estás?" sub={leido(a) ? 'Marcamos la que sugiere tu sitio. Puedes elegir otra.' : 'Elige la que más se parezca.'} />
      <Chips options={INDUSTRIAS} value={a.industria} onChange={(v) => set({ industria: v })} />
      {a.industria === 'Otra' && <div className="pop" style={{ marginTop: 16 }}><TextField label="¿En qué industria?" value={a.industriaOtra} onChange={(v) => set({ industriaOtra: v })} placeholder="Ej: Academia de música" help="Con esto ajustamos los ejemplos y recomendaciones." autoFocus /></div>}
      <Gap />
      <div className="block-label">¿Cómo llamas a tus usuarios?</div>
      <Chips options={USUARIOS} value={a.usuarios} onChange={(v) => set({ usuarios: v })} />
      {a.usuarios === 'Otro'
        ? <div className="pop" style={{ marginTop: 16 }}><TextField label="¿Cómo los llamas?" value={a.usuariosOtro} onChange={(v) => set({ usuariosOtro: v })} placeholder="Ej: Estudiantes" help="Así los nombraremos en tus mensajes, recibos y portal." autoFocus /></div>
        : <p className="t-help" style={{ marginTop: 10 }}>Así los nombraremos en tus mensajes, recibos y portal.</p>}
    </>),
  },
  {
    id: 'vende', stage: 0, title: '¿Qué vendes?',
    valid: (a) => a.vende.trim() || a.productos.length,
    render: (a, set, ui) => (<>
      <Q title="¿Qué vendes?" sub="Lo usamos para nombrar tu catálogo y los mensajes a tus clientes." />
      <TextArea label="Descríbelo con tus palabras" value={a.vende} onChange={(v) => set({ vende: v })} placeholder="Ej: Cursos de inglés online para adultos y empresas." help={`Con esto ajustamos las palabras que usa tu cuenta: ${usuariosDe(a).toLowerCase()}, planes y cobros.`} />
      {leido(a) && (<>
        <Gap s="m" />
        <div className="block-label">Encontramos en tu {a.presencia === 'Solo redes sociales' ? 'perfil' : 'sitio'}</div>
        <Chips multi options={['Plan mensual', 'Plan trimestral', 'Matrícula', 'Clases particulares']} value={a.productos} onChange={(v) => set({ productos: v })} />
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--superficie)', borderRadius: 12 }}>
          <Eye size={18} color="var(--texto-2)" />
          <div style={{ flex: 1 }}><div className="t-label">Leímos {a.sitio}</div><div className="t-help">Nombre, logo, colores, tipografías y 4 productos.</div></div>
          <button className="btn btn-secondary btn-s" onClick={ui.openReview}>Revisar y corregir</button>
        </div>
      </>)}
    </>),
  },
  {
    id: 'cobro', stage: 1, title: '¿Cómo cobras?',
    valid: (a) => a.cobro.length && (!a.cobro.includes('Otro') || a.cobroOtro.trim()),
    render: (a, set) => (<>
      <Q title="¿Cómo cobras?" sub="Elige la que más se parezca; puedes marcar varias. Con esto armamos tu primer plan." />
      <div style={{ position: 'relative' }}>
        <Options multi value={a.cobro} onChange={(v) => set({ cobro: v })} options={COBRO} />
        {a.cobro.includes('Otro') && (
          <div className="pop" style={{ position: 'absolute', right: 0, bottom: 0, width: 'calc(50% - 6px)' }}>
            <TextField label="¿Cuál?" value={a.cobroOtro} onChange={(v) => set({ cobroOtro: v })} placeholder="Ej: Clases particulares por hora" autoFocus />
          </div>
        )}
      </div>
    </>),
  },
  {
    id: 'metodos', stage: 1, title: '¿Con qué métodos quieres cobrar?',
    valid: (a) => a.metodos.length,
    render: (a, set) => (<>
      <Q title="¿Con qué métodos quieres cobrar?" sub="Marca todos los que quieras ofrecer. Puedes sumar más después." />
      <Options multi value={a.metodos} onChange={(v) => set({ metodos: v })} options={METODOS} />
    </>),
  },
  {
    id: 'quien', stage: 1, title: '¿A quién le cobras y cuándo?',
    valid: (a) => a.quien && a.cuando.length,
    render: (a, set) => (<>
      <Q title="¿A quién le cobras y cuándo?" sub="Con esto definimos si emitimos boletas o facturas y cuándo se cobra." />
      <div className="block-label">Le cobras a</div>
      <Chips options={['Personas', 'Empresas', 'A las dos']} value={a.quien} onChange={(v) => set({ quien: v })} />
      <Gap />
      <div className="block-label">El cobro es · puedes marcar varias</div>
      <Options multi cols={3} value={a.cuando} onChange={(v) => set({ cuando: v })} options={CUANDO} />
      {(a.quien === 'Empresas' || a.quien === 'A las dos') && <p className="t-help pop" style={{ marginTop: 14 }}><G>Como cobras a empresas, te pediremos la orden de compra o HES cuando corresponda.</G></p>}
    </>),
  },
  {
    id: 'tamano', stage: 1, title: '¿De qué tamaño es tu cobro?',
    valid: (a) => a.mensual && a.ticket && a.clientes,
    render: (a, set) => (<>
      <Q title="¿De qué tamaño es tu cobro?" sub="Rangos basta. Sirve para estimar cuánta plata se te está cayendo hoy." />
      <div className="block-label">Lo que cobras al mes</div>
      <Chips options={['Menos de $5M', '$5M – $50M', 'Más de $50M']} value={a.mensual} onChange={(v) => set({ mensual: v })} />
      <Gap />
      <div className="block-label">Ticket promedio</div>
      <Chips options={['Menos de $10.000', '$10.000 – $50.000', 'Más de $50.000']} value={a.ticket} onChange={(v) => set({ ticket: v })} />
      <Gap />
      <div className="block-label">{usuariosDe(a)} a los que cobras al mes</div>
      <Chips options={['Menos de 100', '100 – 1.000', 'Más de 1.000']} value={a.clientes} onChange={(v) => set({ clientes: v })} />
    </>),
  },
  {
    id: 'hoy', stage: 1, title: '¿Con qué método de pago cobras hoy?',
    valid: (a) => a.hoy.length && (a.hoy.every((h) => h === 'Recién empiezo') || a.migrar),
    render: (a, set) => (<>
      <Q title="¿Con qué método de pago cobras hoy?" sub={`Si te cambias desde otra plataforma, te ayudamos a traer a tus ${usuariosDe(a).toLowerCase()}.`} />
      <Options multi value={a.hoy} onChange={(v) => set({ hoy: v })} options={HOY} />
      {a.hoy.some((h) => h !== 'Recién empiezo') && (
        <div className="pop" style={{ marginTop: 22 }}>
          <div className="block-label">¿Te ayudamos a migrar?</div>
          <Chips options={['Sí, quiero ayuda para traerme todo', 'No por ahora']} value={a.migrar} onChange={(v) => set({ migrar: v })} />
          {a.migrar.startsWith('Sí') && <p className="t-help pop" style={{ marginTop: 10 }}>Abrimos un caso y alguien del equipo te escribe hoy.</p>}
        </div>
      )}
    </>),
  },
  {
    id: 'complica', stage: 2, title: '¿Qué te complica hoy?', cta: 'Ver lo que entendimos',
    valid: (a) => a.complica.length && (!a.complica.includes('Otro') || a.complicaOtro.trim()),
    render: (a, set) => (<>
      <Q title="¿Qué es lo que más te complica hoy?" sub="Última pregunta antes de mostrarte lo que entendimos. Marca hasta tres." />
      <div className="block-label">Lo que más te complica · hasta 3</div>
      <Chips multi max={3} options={COMPLICA} value={a.complica} onChange={(v) => set({ complica: v })} />
      {a.complica.includes('Otro') && <div className="pop" style={{ marginTop: 18 }}><TextField label="¿Qué otra cosa te complica?" value={a.complicaOtro} onChange={(v) => set({ complicaOtro: v })} placeholder="Ej: Cobrar a apoderados que pagan en efectivo" help="Lo tomamos en cuenta para lo que te recomendamos." autoFocus /></div>}
    </>),
  },
];

export const usuariosDe = (a) => (a.usuarios === 'Otro' ? a.usuariosOtro || 'Clientes' : a.usuarios || 'Clientes');
export const TOTAL_PREGUNTAS = STEPS.length + 1; // + la ficha

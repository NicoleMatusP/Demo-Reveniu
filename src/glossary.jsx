import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Mismo glosario que los «Tooltip de término» de Figma.
const DEFS = [
  ['Modo prueba', ['modo prueba'], 'Puedes probar todo sin mover dinero real. Los cobros son simulados hasta que actives los cobros reales.'],
  ['Agentes', ['agentes', 'agente'], 'Asistentes automáticos que hacen tareas por ti, como reintentar cobros o responder clientes, siguiendo las reglas que tú defines.'],
  ['SII', ['sii'], 'Servicio de Impuestos Internos. Ahí se emiten y registran tus boletas y facturas.'],
  ['Reintento', ['reintentos', 'reintento', 'reintentar'], 'Volver a intentar un cobro que falló, en el momento con más probabilidad de que el banco lo apruebe.'],
  ['Recupero', ['tasa de recupero', 'recupero'], 'Dinero de cobros fallidos que se logró cobrar después, con reintentos o avisos al cliente.'],
  ['Conciliación', ['conciliación', 'conciliar', 'conciliamos'], 'Cruzar lo que cobraste con lo que llegó a tu banco para confirmar que todo calza.'],
  ['Liquidación', ['liquidaciones', 'liquidación'], 'Transferencia que Reveniu hace a tu cuenta con lo cobrado, ya descontadas las comisiones.'],
  ['PAC', ['pac'], 'Pago automático de cuentas: el banco descuenta el cobro de la cuenta corriente del cliente, con su autorización.'],
  ['Tarjeta inscrita', ['tarjeta inscrita'], 'El cliente deja su tarjeta guardada una vez y Reveniu le cobra solo cada período, sin que tenga que pagar a mano.'],
  ['OC', ['orden de compra'], 'Orden de compra: documento con el que una empresa autoriza un pago. Algunas lo exigen para pagar una factura.'],
  ['HES', ['hes'], 'Hoja de entrada de servicio: confirma que el servicio se recibió. Algunas empresas la piden antes de pagar.'],
  ['Morosidad', ['morosa', 'morosos'], 'Clientes con pagos vencidos que todavía no se cobran.'],
  ['Prorrateo', ['prorrateo'], 'Cobrar solo la parte proporcional cuando un plan cambia a mitad de período.'],
  ['Webhook', ['webhooks'], 'Aviso automático que Reveniu envía a tu sistema cuando pasa algo, por ejemplo un pago aprobado.'],
  ['API', ['api'], 'Conexión que permite que tu sistema hable con Reveniu sin pasar por el panel.'],
  ['Checkout', ['checkout'], 'Página donde tu cliente ingresa su medio de pago y paga.'],
  ['UF', ['uf'], 'Unidad de Fomento: se reajusta con la inflación, así que su valor en pesos cambia cada día.'],
  ['Semáforo', ['semáforo'], 'Color que muestra si vas bien (verde), en riesgo (ámbar) o mal (rojo) respecto a tu meta.'],
];
const FORM = new Map();
DEFS.forEach((d) => d[1].forEach((f) => FORM.set(f, d)));
const KEYS = [...FORM.keys()].sort((a, b) => b.length - a.length);
const RE = new RegExp(`(?<![\\p{L}\\p{N}])(${KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}\\p{N}])`, 'giu');

function Term({ children, def }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const show = () => { const r = ref.current.getBoundingClientRect(); setPos({ x: r.left + r.width / 2, y: r.top, b: r.bottom }); };
  const hide = () => setPos(null);
  return (
    <>
      <span ref={ref} className="term" tabIndex={0} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>{children}</span>
      {pos && createPortal(
        <span className={`tip${pos.y < 150 ? ' below' : ''}`} role="tooltip" style={{ left: Math.max(16, Math.min(pos.x - 150, window.innerWidth - 316)), top: pos.y < 150 ? pos.b + 10 : pos.y - 10 }}>
          <b>{def[0]}</b>{def[2]}
        </span>, document.body)}
    </>
  );
}

/** Marca con subrayado punteado los términos del glosario dentro de un texto. */
export function G({ children }) {
  if (typeof children !== 'string') return children;
  const out = []; let last = 0; const seen = new Set(); let m;
  RE.lastIndex = 0;
  while ((m = RE.exec(children))) {
    const d = FORM.get(m[1].toLowerCase());
    if (seen.has(d[0])) continue;
    seen.add(d[0]);
    out.push(children.slice(last, m.index));
    out.push(<Term key={m.index} def={d}>{m[1]}</Term>);
    last = m.index + m[1].length;
  }
  if (!out.length) return children;
  out.push(children.slice(last));
  return <>{out}</>;
}

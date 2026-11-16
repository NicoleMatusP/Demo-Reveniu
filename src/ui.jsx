import { Check } from 'lucide-react';

export function Logo() {
  return (
    <div className="logo"><span className="logo-mark" />Reveniu</div>
  );
}

export function TextField({ label, help, value, onChange, placeholder, autoFocus, type = 'text', error, onEnter }) {
  return (
    <label className="field">
      {label && <span className="t-label">{label}</span>}
      <input
        className={`input${error ? ' error' : ''}`}
        type={type}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter(); }}
      />
      {(error || help) && <span className="t-help" style={error ? { color: 'var(--late-texto)' } : null}>{error || help}</span>}
    </label>
  );
}

export function TextArea({ label, help, value, onChange, placeholder, max = 280, rows = 3 }) {
  return (
    <label className="field">
      {label && <span className="t-label">{label}</span>}
      <div className="textarea-box">
        <textarea className="textarea" rows={rows} value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        <span className="counter">{value.length}/{max}</span>
      </div>
      {help && <span className="t-help">{help}</span>}
    </label>
  );
}

/** Píldoras. multi: permite varias; max: tope de selecciones. */
export function Chips({ options, value, onChange, multi = false, max, size }) {
  const sel = multi ? value : [value];
  const toggle = (o) => {
    if (!multi) return onChange(value === o ? '' : o);
    if (sel.includes(o)) return onChange(sel.filter((x) => x !== o));
    if (max && sel.length >= max) return;
    onChange([...sel, o]);
  };
  return (
    <div className="chips">
      {options.map((o) => {
        const on = sel.includes(o);
        const blocked = multi && max && !on && sel.length >= max;
        return (
          <button key={o} type="button" className={`chip${on ? ' on' : ''}${size === 'm' ? ' m' : ''}`} disabled={blocked} onClick={() => toggle(o)} aria-pressed={on}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

/** Tarjetas de opción con radio o casilla. options: [{t, d}] */
export function Options({ options, value, onChange, multi = false, cols = 2 }) {
  const sel = multi ? value : [value];
  const toggle = (t) => {
    if (!multi) return onChange(t);
    onChange(sel.includes(t) ? sel.filter((x) => x !== t) : [...sel, t]);
  };
  return (
    <div className={`options${cols === 1 ? ' one' : ''}${cols === 3 ? ' three' : ''}`}>
      {options.map((o) => {
        const on = sel.includes(o.t);
        return (
          <button key={o.t} type="button" className={`opt${on ? ' on' : ''}`} onClick={() => toggle(o.t)} aria-pressed={on} style={o.full ? { gridColumn: '1 / -1' } : null}>
            <span className={`mark ${multi ? 'check' : 'radio'}`}>{multi && on && <Check size={12} color="#fff" strokeWidth={3} />}</span>
            <span>
              <span className="opt-t" style={{ display: 'block' }}>{o.t}</span>
              {o.d && <span className="opt-d" style={{ display: 'block' }}>{o.d}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Ring({ pct, size = 64, stroke = 6, color = 'var(--naranja)', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--borde)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 600 }}>{children}</div>
    </div>
  );
}

/** Panel de fondo que se ve difuminado detrás del modal. */
export function FakeApp({ name }) {
  const box = (w, h, extra = {}) => ({ width: w, height: h, borderRadius: 14, background: '#fff', border: '1px solid #e8ebef', ...extra });
  return (
    <div className="bg-app" aria-hidden>
      <div style={{ display: 'flex', height: '100%', background: '#fbfbfc' }}>
        <div style={{ width: 72, background: '#fff', borderRight: '1px solid #e8ebef', padding: 20 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ff5b2e' }} />
        </div>
        <div style={{ flex: 1, padding: '84px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 600 }}>Hola, {name || 'Camila'}</div>
          <div style={{ display: 'flex', gap: 16 }}>{[0, 1, 2].map((i) => <div key={i} style={box('33%', 160)} />)}</div>
          <div style={{ display: 'flex', gap: 16 }}>{[0, 1, 2].map((i) => <div key={i} style={box('33%', 320)} />)}</div>
        </div>
      </div>
    </div>
  );
}

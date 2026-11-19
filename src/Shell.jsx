import { FakeApp, Logo, useFit } from './ui.jsx';
import { STAGES } from './steps.jsx';
import { HelpCircle } from 'lucide-react';
import Assistant from './Assistant.jsx';

/* ---------------- Marco del alta ---------------- */
export function Shell({ name, stageIdx, fill, children, footer, wide, onHelp, onExit, help, closeHelp, helpCtx, stages = STAGES, proceso = 'Configura tu cuenta', footerStack = false, extra = null }) {
  const z = useFit(800);
  return (
    <div className="stage">
      <FakeApp name={name} />
      <div className="veil" />
      <div className="modal" style={z < 1 ? { zoom: z } : null}>
        <div className="mhead">
          <div className="mbar">
            <Logo /><span className="sep" /><span className="t-small">{proceso}</span>
            <span className="spacer" />
            <button className="btn btn-text btn-s help-txt" onClick={onHelp}>¿Dudas?</button>
            <button className="help-ico" aria-label="¿Dudas?" onClick={onHelp}><HelpCircle size={20} /></button>
            <button className="btn btn-secondary btn-s" onClick={onExit}>Guardar y salir</button>
          </div>
          <div className="stages" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
            {stages.map((s, i) => (
              <div key={s}>
                <div className="seg-track"><div className="seg-fill" style={{ width: `${i < stageIdx ? 100 : i === stageIdx ? Math.round(fill * 100) : 0}%` }} /></div>
                <div className={`seg-label${i <= stageIdx ? ' on' : ''}`}>{s}</div>
              </div>
            ))}
          </div>
          <div className="m-progress" role="progressbar" aria-valuenow={Math.round(((stageIdx + fill) / stages.length) * 100)}><div style={{ width: `${((stageIdx + fill) / stages.length) * 100}%` }} /></div>
        </div>
        <div className="mbody">
          <div className={`area${wide ? ' wide' : ''}`}>{children}</div>
          {footer && <div className={`mfoot${wide ? ' wide' : ''}${footerStack ? ' stack' : ''}`}>{footer}</div>}
        </div>
        {extra}
        {help && <Assistant step={helpCtx[0]} stepNumber={helpCtx[1]} email={helpCtx[2].correo} name={helpCtx[2].nombre} onClose={closeHelp} />}
      </div>
    </div>
  );
}

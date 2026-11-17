import { FakeApp, Logo, useFit } from './ui.jsx';
import { STAGES } from './steps.jsx';
import Assistant from './Assistant.jsx';

/* ---------------- Marco del alta ---------------- */
export function Shell({ name, stageIdx, fill, children, footer, wide, onHelp, onExit, help, closeHelp, helpCtx, stages = STAGES, proceso = 'Configura tu cuenta', footerStack = false }) {
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
            <button className="btn btn-text btn-s" onClick={onHelp}>¿Dudas?</button>
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
          <div className="stage-now">{stages[stageIdx]} · {stageIdx + 1} de {stages.length}</div>
        </div>
        <div className="mbody">
          <div className={`area${wide ? ' wide' : ''}`}>{children}</div>
          {footer && <div className={`mfoot${wide ? ' wide' : ''}${footerStack ? ' stack' : ''}`}>{footer}</div>}
        </div>
        {help && <Assistant step={helpCtx[0]} stepNumber={helpCtx[1]} email={helpCtx[2].correo} name={helpCtx[2].nombre} onClose={closeHelp} />}
      </div>
    </div>
  );
}

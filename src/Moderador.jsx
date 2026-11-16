import { useState } from 'react';
import { allSessions, clearSessions, download, fmt, toCSV } from './metrics.js';
import { Logo } from './ui.jsx';

export default function Moderador() {
  const [sessions, setSessions] = useState(() => allSessions().reverse());
  const [open, setOpen] = useState(sessions[0]?.id);
  const s = sessions.find((x) => x.id === open);
  const count = (x, t) => x.events.filter((e) => e.type === t).length;
  return (
    <div style={{ minHeight: '100%', background: 'var(--lienzo)' }}>
      <div className="mod">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo /><span className="sep" /><span className="t-small">Resultados de la prueba del alta</span>
          <span className="spacer" />
          <a className="btn btn-secondary btn-s" href="#" onClick={() => setTimeout(() => location.reload())}>Nueva prueba</a>
        </div>
        <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="t-small" style={{ flex: 1 }}>{sessions.length} pruebas guardadas en este navegador. Descárgalas antes de borrar el historial del navegador.</span>
          <button className="btn btn-secondary btn-s" disabled={!sessions.length} onClick={() => download('pruebas-alta-reveniu.csv', toCSV(sessions))}>Descargar CSV</button>
          <button className="btn btn-secondary btn-s" disabled={!sessions.length} onClick={() => download('pruebas-alta-reveniu.json', JSON.stringify(sessions, null, 2), 'application/json')}>Descargar JSON</button>
          <button className="btn btn-text btn-s" disabled={!sessions.length} onClick={() => { if (confirm('¿Borrar todas las pruebas guardadas?')) { clearSessions(); setSessions([]); } }}>Borrar todo</button>
        </div>
        {!sessions.length && <div className="card t-body">Todavía no hay pruebas. Vuelve al inicio y comienza una.</div>}
        {!!sessions.length && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead><tr><th>Participante</th><th>Fecha</th><th className="num">Tiempo total</th><th className="num">Atrás</th><th className="num">Ayuda</th><th>Estado</th></tr></thead>
              <tbody>
                {sessions.map((x) => (
                  <tr key={x.id} onClick={() => setOpen(x.id)} style={{ cursor: 'pointer', background: x.id === open ? 'var(--superficie)' : undefined }}>
                    <td className="t-label">{x.participant}</td>
                    <td>{new Date(x.startedAt).toLocaleString('es-CL')}</td>
                    <td className="num">{fmt(x.totalMs)}</td>
                    <td className="num">{count(x, 'atras')}</td>
                    <td className="num">{count(x, 'ayuda')}</td>
                    <td>{x.finishedAt ? <span className="tag ok">Terminó</span> : <span className="t-help">Sin terminar</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {s && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px' }} className="t-m">Detalle · {s.participant}</div>
            <table className="table">
              <thead><tr><th>Pantalla</th><th className="num">Tiempo</th><th className="num">Veces</th><th style={{ width: '35%' }} /></tr></thead>
              <tbody>
                {(() => {
                  const rows = Object.entries(s.steps);
                  const max = Math.max(...rows.map(([, v]) => v.ms), 1);
                  return rows.map(([id, v]) => (
                    <tr key={id}>
                      <td>{v.title}</td>
                      <td className="num">{fmt(v.ms)}</td>
                      <td className="num">{v.visits}</td>
                      <td><div style={{ height: 8, borderRadius: 4, background: 'var(--suave)' }}><div style={{ width: `${(v.ms / max) * 100}%`, height: '100%', borderRadius: 4, background: 'var(--texto)' }} /></div></td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
            {!!s.events.length && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--borde)' }}>
                <div className="t-label" style={{ marginBottom: 8 }}>Acciones</div>
                <div className="t-small" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {s.events.map((e, i) => <span key={i}>{fmt(e.t)} · {LABEL[e.type] || e.type}{e.detail ? ` · ${e.detail}` : ''}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const LABEL = { atras: 'Volvió atrás', ayuda: 'Abrió ¿Dudas?', ayuda_pregunta: 'Preguntó al asistente', ayuda_videollamada: 'Quiso agendar videollamada', videollamada_agendada: 'Agendó videollamada', guardar_y_salir: 'Guardar y salir', retomar: 'Retomó', revisar_sitio: 'Revisó lo leído del sitio', editar_desde_ficha: 'Editó desde la ficha', codigo_incorrecto: 'Código incorrecto', inicio_alta: 'Empezó las preguntas', final: 'Eligió al final' };

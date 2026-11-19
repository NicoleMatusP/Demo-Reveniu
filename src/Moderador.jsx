import { useState } from 'react';
import { allSessions, clearSessions, download, fmt, phaseMs, PHASES, toCSV } from './metrics.js';
import { Logo } from './ui.jsx';

export default function Moderador() {
  const [sessions, setSessions] = useState(() => allSessions().reverse());
  const [open, setOpen] = useState(sessions[0]?.id);
  const s = sessions.find((x) => x.id === open);
  const count = (x, t) => x.events.filter((e) => e.type === t).length;
  const avg = (name) => {
    const v = sessions.map((x) => phaseMs(x, name)).filter((m) => m != null);
    return v.length ? { ms: v.reduce((p, c) => p + c, 0) / v.length, n: v.length } : { ms: null, n: 0 };
  };
  const estado = (x) => phaseMs(x, 'validacion') != null ? <span className="tag ok">Validó la empresa</span>
    : x.phases?.validacion ? <span className="tag due">Validación sin terminar</span>
    : phaseMs(x, 'alta') != null ? <span className="tag neutral">Solo alta</span>
    : <span className="t-help">Sin terminar</span>;
  return (
    <div style={{ minHeight: '100%', background: 'var(--lienzo)' }}>
      <div className="mod">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo /><span className="sep" /><span className="t-small">Resultados de la prueba · alta y validación</span>
          <span className="spacer" />
          <a className="btn btn-secondary btn-s" href="#" onClick={() => setTimeout(() => location.reload())}>Nueva prueba</a>
        </div>
        <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="t-small" style={{ flex: 1 }}>{sessions.length} pruebas guardadas en este navegador. Descárgalas antes de borrar el historial del navegador.</span>
          <button className="btn btn-secondary btn-s" disabled={!sessions.length} onClick={() => download('pruebas-alta-reveniu.csv', toCSV(sessions))}>Descargar CSV</button>
          <button className="btn btn-secondary btn-s" disabled={!sessions.length} onClick={() => download('pruebas-alta-reveniu.json', JSON.stringify(sessions, null, 2), 'application/json')}>Descargar JSON</button>
          <button className="btn btn-text btn-s" disabled={!sessions.length} onClick={() => { if (confirm('¿Borrar todas las pruebas guardadas?')) { clearSessions(); setSessions([]); } }}>Borrar todo</button>
        </div>
        {!!sessions.length && (
          <div className="resumen">
            {[['alta', 'Del registro a la cuenta lista'], ['validacion', 'Del SII a la empresa aprobada']].map(([k, d]) => {
              const r = avg(k);
              return (
                <div key={k} className="card">
                  <div className="t-help">Promedio · {PHASES[k]}</div>
                  <div className="t-l" style={{ marginTop: 6 }}>{fmt(r.ms)}</div>
                  <div className="t-help" style={{ marginTop: 4 }}>{d} · {r.n} {r.n === 1 ? 'persona' : 'personas'}</div>
                </div>
              );
            })}
          </div>
        )}
        {!sessions.length && <div className="card t-body">Todavía no hay pruebas. Vuelve al inicio y comienza una.</div>}
        {!!sessions.length && (
          <div className="card" style={{ padding: 0, overflow: 'auto' }}>
            <table className="table">
              <thead><tr><th>Participante</th><th>Dispositivo</th><th>Fecha</th><th className="num">Alta</th><th className="num">Validación</th><th className="num">Total</th><th className="num">Atrás</th><th className="num">Ayuda</th><th>Estado</th></tr></thead>
              <tbody>
                {sessions.map((x) => (
                  <tr key={x.id} onClick={() => setOpen(x.id)} style={{ cursor: 'pointer', background: x.id === open ? 'var(--superficie)' : undefined }}>
                    <td className="t-label">{x.participant}</td>
                    <td>{x.device || 'Desktop'}</td>
                    <td>{new Date(x.startedAt).toLocaleString('es-CL')}</td>
                    <td className="num">{fmt(phaseMs(x, 'alta'))}</td>
                    <td className="num">{fmt(phaseMs(x, 'validacion'))}</td>
                    <td className="num t-label">{fmt(x.totalMs)}</td>
                    <td className="num">{count(x, 'atras')}</td>
                    <td className="num">{count(x, 'ayuda')}</td>
                    <td>{estado(x)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {s && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', display: 'flex', gap: 24, alignItems: 'baseline' }}><span className="t-m" style={{ flex: 1 }}>Detalle · {s.participant}</span><span className="t-small">Alta {fmt(phaseMs(s, 'alta'))} · Validación {fmt(phaseMs(s, 'validacion'))} · Total {fmt(s.totalMs)}</span></div>
            {['alta', 'validacion'].map((k, n) => {
              const rows = Object.entries(s.steps).filter(([, v]) => (v.phase || 'alta') === k);
              if (!rows.length) return null;
              const max = Math.max(...rows.map(([, v]) => v.ms), 1);
              return (
                <table key={k} className="table">
                  <thead>
                    <tr className="fase-row"><th colSpan={2}>{n + 1} · {PHASES[k]}</th><th className="num">{fmt(phaseMs(s, k))}</th><th /></tr>
                    <tr><th>Pantalla</th><th className="num">Tiempo</th><th className="num">Veces</th><th style={{ width: '35%' }} /></tr>
                  </thead>
                  <tbody>
                    {rows.map(([id, v]) => (
                      <tr key={id}>
                        <td>{v.title}</td>
                        <td className="num">{fmt(v.ms)}</td>
                        <td className="num">{v.visits}</td>
                        <td><div style={{ height: 8, borderRadius: 4, background: 'var(--suave)' }}><div style={{ width: `${(v.ms / max) * 100}%`, height: '100%', borderRadius: 4, background: k === 'alta' ? 'var(--texto)' : 'var(--texto-2)' }} /></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })}
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

const LABEL = { atras: 'Volvió atrás', ayuda: 'Abrió ¿Dudas?', ayuda_pregunta: 'Preguntó al asistente', ayuda_videollamada: 'Quiso agendar videollamada', videollamada_agendada: 'Agendó videollamada', guardar_y_salir: 'Guardar y salir', retomar: 'Retomó', revisar_sitio: 'Revisó lo leído del sitio', editar_desde_ficha: 'Editó desde la ficha', codigo_incorrecto: 'Código incorrecto', inicio_alta: 'Empezó las preguntas', final: 'Eligió al final', fase_inicio_alta: '▸ Empezó el alta', fase_fin_alta: '■ Terminó el alta', fase_inicio_validacion: '▸ Empezó la validación', fase_fin_validacion: '■ Terminó la validación', rut_invalido: 'RUT inválido', subir_documentos: 'Eligió subir los documentos', subir_pdf: 'Subió un PDF', reintentar_pdf: 'Reintentó un PDF', pdf_ilegible: 'PDF ilegible', cambiar_pdf: 'Cambió un PDF', documentos_enviados: 'Envió los documentos', ver_documentos: 'Abrió la lista de documentos', ver_guia: 'Abrió una guía «Ver cómo…»', abrir_sii: 'Abrió sii.cl desde la guía', no_es_mi_empresa: 'Dijo que no es su empresa', correccion_enviada: 'Envió una corrección', algo_no_calza: 'Dijo que algo no calza', representante: 'Eligió representante', invitacion_enviada: 'Envió invitación', reenviar_invitacion: 'Reenvió invitación', copiar_link: 'Copió el link', cambiar_correo: 'Cambió el correo', activar_cobros_reales: 'Quiso activar cobros reales' };

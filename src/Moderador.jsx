import { useState } from 'react';
import { allSessions, clearSessions, download, flowOf, FLOWS, fmt, phaseMs, PHASES, toCSV } from './metrics.js';
import { Logo } from './ui.jsx';

export default function Moderador() {
  const [all, setAll] = useState(() => allSessions().reverse());
  const [flow, setFlow] = useState(() => all[0] ? flowOf(all[0]) : 'alta');
  const sessions = all.filter((x) => flowOf(x) === flow);
  const setSessions = setAll;
  const F = FLOWS[flow];
  const [open, setOpen] = useState(all[0]?.id);
  const s = sessions.find((x) => x.id === open);
  const count = (x, t) => x.events.filter((e) => e.type === t).length;
  const avg = (name) => {
    const v = sessions.map((x) => phaseMs(x, name)).filter((m) => m != null);
    return v.length ? { ms: v.reduce((p, c) => p + c, 0) / v.length, n: v.length } : { ms: null, n: 0 };
  };
  const estado = (x) => flow === 'validacion' ? (x.finishedAt ? <span className="tag ok">Validó la empresa</span> : <span className="t-help">Sin terminar</span>) : flow === 'planes' ? (x.finishedAt ? <span className="tag ok">Terminó las tareas</span> : x.phases?.catalogo ? <span className="tag due">Catálogo sin terminar</span> : x.phases?.link ? <span className="tag due">Link sin publicar</span> : <span className="t-help">Plan sin terminar</span>)
    : phaseMs(x, 'validacion') != null ? <span className="tag ok">Validó la empresa</span>
    : x.phases?.validacion ? <span className="tag due">Validación sin terminar</span>
    : phaseMs(x, 'alta') != null ? <span className="tag neutral">Solo alta</span>
    : <span className="t-help">Sin terminar</span>;
  return (
    <div style={{ minHeight: '100%', background: 'var(--lienzo)' }}>
      <div className="mod">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo /><span className="sep" /><span className="t-small">Resultados de las pruebas</span>
          <span className="spacer" />
          <a className="btn btn-secondary btn-s" href={F.inicio} onClick={() => setTimeout(() => location.reload())}>Nueva prueba</a>
        </div>
        <div className="seg" role="tablist" style={{ alignSelf: 'flex-start' }}>
          {Object.entries(FLOWS).map(([k, f]) => <button key={k} className={k === flow ? 'on' : ''} onClick={() => { setFlow(k); setOpen(all.find((x) => flowOf(x) === k)?.id); }}>{f.label} · {all.filter((x) => flowOf(x) === k).length}</button>)}
        </div>
        <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="t-small" style={{ flex: 1 }}>{sessions.length} pruebas de «{F.label}» guardadas en este navegador. Descárgalas antes de borrar el historial del navegador.</span>
          <button className="btn btn-secondary btn-s" disabled={!sessions.length} onClick={() => download(`pruebas-${flow}-reveniu.csv`, toCSV(sessions))}>Descargar CSV</button>
          <button className="btn btn-secondary btn-s" disabled={!sessions.length} onClick={() => download(`pruebas-${flow}-reveniu.json`, JSON.stringify(sessions, null, 2), 'application/json')}>Descargar JSON</button>
          <button className="btn btn-text btn-s" disabled={!sessions.length} onClick={() => { if (confirm('¿Borrar todas las pruebas guardadas (de los dos flujos)?')) { clearSessions(); setSessions([]); } }}>Borrar todo</button>
        </div>
        {!!sessions.length && (
          <div className="resumen" style={{ gridTemplateColumns: `repeat(${F.phases.length}, 1fr)` }}>
            {F.phases.map((k) => [k, DESC[k]]).map(([k, d]) => {
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
              <thead><tr><th>Participante</th><th>Dispositivo</th><th>Fecha</th>{F.phases.map((k) => <th key={k} className="num">{PHASES[k]}</th>)}<th className="num">Total</th><th className="num">Atrás</th><th className="num">Ayuda</th><th>Estado</th></tr></thead>
              <tbody>
                {sessions.map((x) => (
                  <tr key={x.id} onClick={() => setOpen(x.id)} style={{ cursor: 'pointer', background: x.id === open ? 'var(--superficie)' : undefined }}>
                    <td className="t-label">{x.participant}</td>
                    <td>{x.device || 'Desktop'}</td>
                    <td>{new Date(x.startedAt).toLocaleString('es-CL')}</td>
                    {F.phases.map((k) => <td key={k} className="num">{fmt(phaseMs(x, k))}</td>)}
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
            <div style={{ padding: '16px 20px', display: 'flex', gap: 24, alignItems: 'baseline' }}><span className="t-m" style={{ flex: 1 }}>Detalle · {s.participant}</span><span className="t-small">{F.phases.map((k) => `${PHASES[k]} ${fmt(phaseMs(s, k))}`).join(' · ')} · Total {fmt(s.totalMs)}</span></div>
            {F.phases.map((k, n) => {
              const rows = Object.entries(s.steps).filter(([, v]) => (v.phase || F.phases[0]) === k);
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
                        <td><div style={{ height: 8, borderRadius: 4, background: 'var(--suave)' }}><div style={{ width: `${(v.ms / max) * 100}%`, height: '100%', borderRadius: 4, background: n === 0 ? 'var(--texto)' : n === 1 ? 'var(--naranja)' : 'var(--texto-2)' }} /></div></td>
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

const DESC = { alta: 'Del registro a la cuenta lista', validacion: 'Del SII a la empresa aprobada', plan: 'Del catálogo a «Publicar plan»', link: 'Del link a publicado', catalogo: 'Archivar y encontrar archivados' };

const LABEL = {
  fase_inicio_plan: '▸ Empezó a crear el plan', fase_fin_plan: '■ Terminó el plan', fase_inicio_link: '▸ Empezó el link', fase_fin_link: '■ Publicó el plan', fase_inicio_catalogo: '▸ Empezó las tareas del catálogo', fase_fin_catalogo: '■ Terminó las tareas del catálogo',
  menu_nuevo: 'Abrió «+ Nuevo»', nuevo_no_disponible: 'Eligió algo fuera de la prueba', plantilla: 'Eligió plantilla', producto_nuevo: 'Creó un producto', cobro_agregado: 'Agregó un cobro', cobro_quitado: 'Quitó un cobro', caracteristica: 'Agregó una característica', segmento: 'Eligió segmento', editar_estandar: 'Editó la regla estándar en el flujo', desde_cero: 'Eligió crear desde cero', editar_desde_revision: 'Editó desde la revisión', utm_abierto: 'Abrió UTM y meta tags', utm_guardado: 'Guardó UTM y meta tags', link_copiado: 'Copió el link', menu_fila: 'Abrió el menú ⋯', duplicar: 'Duplicó', archivar: 'Archivó', deshacer: 'Deshizo', pausar: 'Pausó ventas', restaurar: 'Restauró', filtro: 'Cambió un filtro', buscar: 'Buscó', tarea_ver: 'Abrió la tarea', atras: 'Volvió atrás', ayuda: 'Abrió ¿Dudas?', ayuda_pregunta: 'Preguntó al asistente', ayuda_videollamada: 'Quiso agendar videollamada', videollamada_agendada: 'Agendó videollamada', guardar_y_salir: 'Guardar y salir', retomar: 'Retomó', revisar_sitio: 'Revisó lo leído del sitio', editar_desde_ficha: 'Editó desde la ficha', codigo_incorrecto: 'Código incorrecto', inicio_alta: 'Empezó las preguntas', final: 'Eligió al final', fase_inicio_alta: '▸ Empezó el alta', fase_fin_alta: '■ Terminó el alta', fase_inicio_validacion: '▸ Empezó la validación', fase_fin_validacion: '■ Terminó la validación', rut_invalido: 'RUT inválido', subir_documentos: 'Eligió subir los documentos', subir_pdf: 'Subió un PDF', reintentar_pdf: 'Reintentó un PDF', pdf_ilegible: 'PDF ilegible', cambiar_pdf: 'Cambió un PDF', documentos_enviados: 'Envió los documentos', ver_documentos: 'Abrió la lista de documentos', ver_guia: 'Abrió una guía «Ver cómo…»', abrir_sii: 'Abrió sii.cl desde la guía', no_es_mi_empresa: 'Dijo que no es su empresa', correccion_enviada: 'Envió una corrección', algo_no_calza: 'Dijo que algo no calza', representante: 'Eligió representante', invitacion_enviada: 'Envió invitación', reenviar_invitacion: 'Reenvió invitación', copiar_link: 'Copió el link', cambiar_correo: 'Cambió el correo', activar_cobros_reales: 'Quiso activar cobros reales' };

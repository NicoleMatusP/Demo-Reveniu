import { useState } from 'react';
import { ChevronLeft, Send, X, CalendarCheck } from 'lucide-react';
import { Chips, Options, TextField } from './ui.jsx';
import { track } from './metrics.js';

const FAQ = {
  '¿Puedo cambiarlo después?': 'Sí. Todo lo que respondes aquí se puede cambiar desde Configuración, cuando quieras. Nada de esto cobra a nadie todavía: estás en modo prueba.',
  '¿Puedo cobrar en UF?': 'Sí. Puedes tener planes en pesos y en UF al mismo tiempo. En los planes en UF, Reveniu calcula el monto en pesos el día del cobro con el valor oficial.',
  '¿Qué es una tarjeta inscrita?': 'Es cuando tu cliente deja su tarjeta guardada una vez y Reveniu le cobra solo cada mes, sin que tenga que pagar a mano.',
  '¿Para qué piden esto?': 'Con tus respuestas armamos tu primer plan, tus reglas de cobro y los mensajes a tus clientes. Así no tienes que configurar todo desde cero.',
};

export default function Assistant({ step, stepNumber, email, name, onClose }) {
  const [view, setView] = useState('chat');
  const [msgs, setMsgs] = useState([{ who: 'bot', text: `Hola ${name || ''} 👋 Estás en «${step}». ¿Qué duda tienes?` }]);
  const [draft, setDraft] = useState('');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [mail, setMail] = useState(email || '');
  const ask = (q) => {
    track('ayuda_pregunta', q);
    const a = FAQ[q] || 'Buena pregunta. Te dejo lo principal: puedes seguir y cambiar esta respuesta después. Si prefieres verlo con una persona, agenda una videollamada de 15 minutos.';
    setMsgs((m) => [...m, { who: 'me', text: q }, { who: 'bot', text: a }]);
    setDraft('');
  };
  const days = ['Hoy', 'Mañana', 'Pasado mañana'];
  return (
    <>
      <div className="drawer-veil" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Asistente Reveniu">
        <div className="drawer-head">
          <div className="avatar">R</div>
          <div style={{ flex: 1 }}><div className="t-label">Asistente Reveniu</div><div className="t-help">Responde al instante sobre este formulario</div></div>
          <button aria-label="Cerrar" onClick={onClose}><X size={18} /></button>
        </div>

        {view === 'chat' && (<>
          <div className="drawer-body">
            {msgs.map((m, i) => <div key={i} className={`bubble ${m.who} pop`}>{m.text}</div>)}
            <div className="t-help">Lo que más se pregunta en este paso</div>
            <Chips size="m" options={Object.keys(FAQ)} value="" onChange={(q) => q && ask(q)} />
            <div className="callout">
              <div className="t-label">¿Prefieres hablarlo con una persona?</div>
              <div className="t-small">Agenda una videollamada de 15 minutos con un experto de Reveniu. Lo que respondiste queda guardado.</div>
              <button className="btn btn-secondary btn-s" style={{ width: 'fit-content' }} onClick={() => { track('ayuda_videollamada'); setView('agendar'); }}>Agendar videollamada</button>
            </div>
          </div>
          <form className="drawer-input" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) ask(draft.trim()); }}>
            <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Escribe tu duda…" />
            <button className="btn btn-primary btn-s" aria-label="Enviar"><Send size={16} /></button>
          </form>
        </>)}

        {view === 'agendar' && (
          <div className="drawer-body fade-in">
            <button className="t-small" style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }} onClick={() => setView('chat')}><ChevronLeft size={16} /> Volver al chat</button>
            <h2 className="t-m">Agenda una videollamada</h2>
            <p className="t-small">Un experto de Reveniu se conecta contigo por videollamada y terminan juntos la configuración. Dura 15 minutos.</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', background: 'var(--superficie)', borderRadius: 12 }}>
              <div className="avatar" style={{ width: 40, height: 40, background: 'var(--suave)', color: 'var(--texto)' }}>JS</div>
              <div><div className="t-label">Javiera Soto</div><div className="t-help">Especialista en cobros. Es quien te atiende en la videollamada.</div></div>
            </div>
            <div className="t-label">¿Qué día?</div>
            <Chips size="m" options={days} value={day} onChange={setDay} />
            <div className="t-label">Horarios disponibles de Javiera</div>
            <Options cols={3} value={time} onChange={setTime} options={[{ t: '10:30' }, { t: '12:00' }, { t: '16:30' }]} />
            <div className="t-help">Hora de Santiago · agenda en vivo desde Calendly</div>
            <TextField label="¿A qué correo te enviamos el link?" value={mail} onChange={setMail} help="Te llega la invitación con el link de la videollamada." />
            <div style={{ background: 'var(--superficie)', borderRadius: 12, padding: '10px 14px' }}><div className="t-help">Tema de la videollamada</div><div className="t-small" style={{ color: 'var(--texto)' }}>{step} · paso {stepNumber}</div></div>
            <button className="btn btn-primary btn-block" disabled={!day || !time || !mail.includes('@')} onClick={() => { track('videollamada_agendada', `${day} ${time}`); setView('listo'); }}>Confirmar videollamada</button>
          </div>
        )}

        {view === 'listo' && (
          <div className="drawer-body fade-in" style={{ alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--ok-fondo)', display: 'grid', placeItems: 'center' }}><CalendarCheck color="var(--ok-texto)" /></div>
            <h2 className="t-m">Listo, nos vemos {day.toLowerCase()} a las {time}</h2>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', background: 'var(--superficie)', borderRadius: 12, textAlign: 'left', width: '100%' }}>
              <div className="avatar" style={{ width: 36, height: 36, background: 'var(--suave)', color: 'var(--texto)' }}>JS</div>
              <div><div className="t-label">Javiera Soto</div><div className="t-help">Te espera en Google Meet.</div></div>
            </div>
            <p className="t-small">Calendly te envió la invitación con el link a {mail}. Desde ahí mismo puedes cambiar la hora o cancelar.</p>
            <button className="btn btn-primary btn-block" onClick={onClose}>Seguir con mi cuenta</button>
          </div>
        )}
      </aside>
    </>
  );
}

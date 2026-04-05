import React from 'react';
import { Lead } from '../types';

interface PipelineDetailModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Lead>) => Promise<void>;
  onGenerateEmail: (lead: Lead) => void;
}

export const PipelineDetailModal: React.FC<PipelineDetailModalProps> = ({ lead, onClose, onUpdate, onGenerateEmail }) => {
  const handleToggleResponse = async () => {
    const newResponse = lead.response === 'YES' ? 'NO' : 'YES';
    const updates: Partial<Lead> = {
      response: newResponse,
      responseDate: new Date().toLocaleDateString('de-DE'),
      status: newResponse === 'YES' ? 'Closed' : 'Open'
    };
    await onUpdate(lead.id!, updates);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // We could debounce this update, but for now we'll just show it
  };

  const saveNotes = async (e: React.FocusEvent<HTMLTextAreaElement>) => {
    await onUpdate(lead.id!, { notes: e.target.value });
  };

  const STEPS = [
    { key: 'outreachSent', label: 'Outreach', action: 'Send Outreach' },
    { key: 'f1Sent', label: 'Follow-up #1', action: 'Send Follow-up #1' },
    { key: 'f2Sent', label: 'Follow-up #2', action: 'Send Follow-up #2' },
    { key: 'f3Sent', label: 'Follow-up #3', action: 'Send Follow-up #3' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
           <div className="pipeline-detail-header">
             <h2>{lead.company}</h2>
             <div className="header-meta">
               <span>👤 {lead.name || 'Unbekannt'}</span>
               <span>📧 {lead.email || 'Keine E-Mail'}</span>
               <a href={`https://${lead.website}`} target="_blank" className="website-link">🔗 {lead.website}</a>
             </div>
           </div>
           <button onClick={onClose} className="btn-secondary">✕</button>
        </div>

        <div className="modal-body">
           <div className="detail-grid">
              <div className="history-section">
                 <h4 className="sidebar-section h4">Outreach Timeline</h4>
                 <div className="history-timeline">
                    {STEPS.map((step) => {
                      const date = (lead as any)[step.key];
                      const isCompleted = !!date;
                      const isCurrent = lead.nextAction === step.action;
                      
                      return (
                        <div key={step.key} className={`timeline-event ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                          <div className="event-header">
                            <span className="event-title">{step.label}</span>
                            <span className="event-date">{date || (isCurrent ? 'JETZT FÄLLIG' : 'Geplant')}</span>
                          </div>
                          {isCompleted && (
                            <div className="event-content">
                              Email gesendet am {date}.
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {lead.status === 'Closed' && (
                      <div className="timeline-event completed">
                        <div className="event-header">
                          <span className="event-title">Abgeschlossen</span>
                          <span className="event-date">{lead.responseDate || lead.lastSent}</span>
                        </div>
                      </div>
                    )}
                 </div>
              </div>

              <div className="detail-sidebar">
                 <div className="sidebar-section">
                    <h4 style={{ color: 'var(--accent)' }}>Response Tracking</h4>
                    <div className="response-controls">
                       <button 
                         className={`btn-primary ${lead.response === 'YES' ? 'btn-copied' : ''}`}
                         onClick={handleToggleResponse}
                         style={{ width: '100%', padding: '0.75rem' }}
                       >
                         {lead.response === 'YES' ? '✓ Positive Rückmeldung!' : 'Hat reagiert?'}
                       </button>
                       {lead.response === 'YES' && (
                         <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            Wurde am {lead.responseDate} auf "Replied" gesetzt.
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="sidebar-section notes-area">
                    <label>Notizen zum Lead</label>
                    <textarea 
                      defaultValue={lead.notes}
                      placeholder="Füge hier Notizen zur Kommunikation hinzu..."
                      onBlur={saveNotes}
                    />
                 </div>

                 <button 
                   className="btn-primary" 
                   style={{ marginTop: 'auto', padding: '1rem' }}
                   onClick={() => onGenerateEmail(lead)}
                 >
                   ✨ Neue E-Mail für diesen Lead
                 </button>
              </div>
           </div>
        </div>
        
        <div className="modal-footer">
           <button onClick={onClose} className="btn-secondary">Schließen</button>
        </div>
      </div>
    </div>
  );
};

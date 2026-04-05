import React, { useMemo } from 'react';
import { Lead, NextAction } from '../types';

interface PipelineViewProps {
  leads: Lead[];
  onUpdateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  onSelectLead: (lead: Lead) => void;
}

const STEPS: NextAction[] = [
  'Send Outreach',
  'Send Follow-up #1',
  'Send Follow-up #2',
  'Send Follow-up #3',
  'Closed'
];

export const PipelineView: React.FC<PipelineViewProps> = ({ leads, onUpdateLead, onSelectLead }) => {
  const columns = useMemo(() => {
    const groups: Record<NextAction, Lead[]> = {
      'Send Outreach': [],
      'Send Follow-up #1': [],
      'Send Follow-up #2': [],
      'Send Follow-up #3': [],
      'Closed': []
    };

    leads.forEach(lead => {
      if (groups[lead.nextAction]) {
        groups[lead.nextAction].push(lead);
      } else {
        groups['Send Outreach'].push(lead);
      }
    });

    return groups;
  }, [leads]);

  const stats = useMemo(() => {
    const total = leads.length;
    const closed = leads.filter(l => l.status === 'Closed').length;
    const active = total - closed;
    const responded = leads.filter(l => l.response === 'YES').length;

    return { total, active, closed, responded };
  }, [leads]);

  const getStepIndex = (action: NextAction) => STEPS.indexOf(action);

  const calculateDaysSinceLastAction = (lastSent: string) => {
    if (!lastSent) return null;
    const lastDate = new Date(lastSent.split('.').reverse().join('-')); // Handles DD.MM.YYYY
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="pipeline-container">
      <div className="pipeline-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Gesamt Leads</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.active}</span>
          <span className="stat-label">Aktiv im Prozess</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--accent)' }}>{stats.responded}</span>
          <span className="stat-label">Positive Rückmeldung</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: '#94a3b8' }}>{stats.closed}</span>
          <span className="stat-label">Abgeschlossen</span>
        </div>
      </div>

      <div className="pipeline-grid">
        {STEPS.map((step) => (
          <div key={step} className="pipeline-column">
            <div className="column-header">
              <h3>{step.replace('Send ', '')}</h3>
              <span className="column-count">{columns[step]?.length || 0}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {columns[step]?.map((lead) => {
                const days = calculateDaysSinceLastAction(lead.lastSent);
                const isOverdue = days !== null && days >= 3 && step !== 'Closed';
                
                return (
                  <div 
                    key={lead.id} 
                    className={`pipeline-card ${isOverdue ? 'urgent' : ''} ${lead.response === 'YES' ? 'highlight' : ''}`}
                    onClick={() => onSelectLead(lead)}
                  >
                    <div className="card-stepper">
                      {STEPS.slice(0, 4).map((s, idx) => (
                        <div 
                          key={s} 
                          className={`step-dot ${getStepIndex(lead.nextAction) > idx ? 'completed' : getStepIndex(lead.nextAction) === idx ? 'current' : ''}`}
                        />
                      ))}
                    </div>
                    
                    <div className="card-company">{lead.company}</div>
                    <span className="card-contact">{lead.name || 'Unbekannter Kontakt'}</span>
                    
                    <div className="card-metrics">
                      <div className={`metrics-days ${isOverdue ? 'overdue' : ''}`}>
                         {lead.lastSent ? `Seit ${days} Tagen` : 'Neu importiert'}
                      </div>
                      {lead.response === 'YES' && <span className="badge badge-primary" style={{ fontSize: '0.6rem' }}>ANTWORT!</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

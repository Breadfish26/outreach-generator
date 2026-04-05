import React, { useState, useEffect } from 'react';
import { FullTemplates, EmailStep, EmailTemplate } from '../types';
import { DEFAULT_TEMPLATES, substituteVariables } from '../logic/templates';

interface TemplateEditorProps {
  templates: FullTemplates;
  onSave: (templates: FullTemplates) => void;
}

const SAMPLE_LEAD = {
  anrede: 'Herr' as any,
  name: 'Müller',
  company: 'Poolbau Müller GmbH',
  website: 'poolbau-mueller.at',
  sender_name: 'Kerstin Grosche'
};

const PAIN_POINTS: { id: string; label: string }[] = [
  { id: 'missing_pool_calculator', label: 'Fehlender Kalkulator' },
  { id: 'missing_contact_option', label: 'Einstieg fehlt' },
  { id: 'broken_link', label: 'Defekter Link' },
  { id: 'no_homepage_cta', label: 'Home-CTA fehlt' }
];

const STEPS: { id: EmailStep; label: string }[] = [
  { id: 'outreach', label: 'Erstkontakt' },
  { id: 'followup1', label: 'Follow-up #1' },
  { id: 'followup2', label: 'Follow-up #2' },
  { id: 'followup3', label: 'Follow-up #3' }
];

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ 
  templates, 
  onSave 
}) => {
  const [selectedPainPoint, setSelectedPainPoint] = useState<string>(PAIN_POINTS[0].id);
  const [selectedStep, setSelectedStep] = useState<EmailStep>('outreach');
  
  const [currentTemplates, setCurrentTemplates] = useState<FullTemplates>(templates);
  
  useEffect(() => {
    setCurrentTemplates(templates);
  }, [templates]);

  const currentTemplate = currentTemplates[selectedPainPoint]?.[selectedStep] || { subject: '', body: '' };

  const handleUpdate = (field: keyof EmailTemplate, value: string) => {
    const updated = { ...currentTemplates };
    if (!updated[selectedPainPoint]) updated[selectedPainPoint] = {} as any;
    updated[selectedPainPoint][selectedStep] = {
      ...currentTemplate,
      [field]: value
    };
    setCurrentTemplates(updated);
  };

  const saveAll = () => {
    onSave(currentTemplates);
    alert('Vorlagen gespeichert!');
  };

  const resetCurrent = () => {
    if (confirm('Aktuelle Vorlage auf Standard zurücksetzen?')) {
      const updated = { ...currentTemplates };
      updated[selectedPainPoint][selectedStep] = { ...DEFAULT_TEMPLATES[selectedPainPoint as any][selectedStep] };
      setCurrentTemplates(updated);
    }
  };

  const resetAll = () => {
    if (confirm('ALLE Vorlagen auf Standards zurücksetzen?')) {
      setCurrentTemplates(JSON.parse(JSON.stringify(DEFAULT_TEMPLATES)));
      onSave(DEFAULT_TEMPLATES);
    }
  };

  const previewSubject = substituteVariables(currentTemplate.subject, SAMPLE_LEAD);
  const previewBody = substituteVariables(currentTemplate.body, SAMPLE_LEAD);

  return (
    <div className="template-editor-view animate-fade-in">
      <div className="controls-bar">
        <div className="grid grid-2 w-full" style={{ alignItems: 'flex-end', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label>Problemstellung (Pain Point)</label>
            <select 
              value={selectedPainPoint} 
              onChange={(e) => setSelectedPainPoint(e.target.value)}
              className="modern-select"
            >
              {PAIN_POINTS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label>Email-Schritt</label>
            <select 
              value={selectedStep} 
              onChange={(e) => setSelectedStep(e.target.value as EmailStep)}
              className="modern-select"
            >
              {STEPS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', width: '100%', justifyContent: 'flex-end' }}>
          <button onClick={saveAll} className="btn-primary">Alle speichern</button>
        </div>
      </div>

      <div className="editor-grid mt-4">
        <div className="editor-panel">
          <div className="card" style={{ height: '100%' }}>
            <h4>Vorlage bearbeiten</h4>
            <div className="placeholder-hint">
              Verfügbar: <code>{'{anrede}'}</code>, <code>{'{name}'}</code>, <code>{'{company}'}</code>, <code>{'{website}'}</code>, <code>{'{sender_name}'}</code>
            </div>
            
            <div className="form-group">
              <label>Betreff</label>
              <input 
                type="text" 
                value={currentTemplate.subject} 
                onChange={(e) => handleUpdate('subject', e.target.value)}
                placeholder="Betreff..."
              />
            </div>

            <div className="form-group">
              <label>Inhalt</label>
              <textarea 
                value={currentTemplate.body} 
                onChange={(e) => handleUpdate('body', e.target.value)}
                placeholder="E-Mail Inhalt..."
                rows={16}
                style={{ fontSize: '0.9rem', lineHeight: '1.5' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                onClick={resetCurrent} 
                className="btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
              >Aktuelle zurücksetzen</button>
              <button 
                onClick={resetAll} 
                className="btn-danger" 
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
              >Alle zurücksetzen</button>
            </div>
          </div>
        </div>

        <div className="preview-panel">
          <div className="card" style={{ height: '100%' }}>
            <h4>Live Vorschau (Simulation)</h4>
            <div className="email-preview-container" style={{ minHeight: '500px' }}>
              <div className="email-section">
                <span className="section-label">Betreff</span>
                <div className="section-content" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                  {previewSubject}
                </div>
              </div>
              <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--glass-border)' }} />
              <div className="email-section">
                <span className="section-label">Inhalt</span>
                <div className="section-content" style={{ fontSize: '1rem' }}>
                  {previewBody.split('\n').map((line, i) => <div key={i}>{line || <br/>}</div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

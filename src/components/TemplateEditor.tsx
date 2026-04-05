import React, { useState, useEffect } from 'react';
import { FullTemplates, PainPoint, EmailStep, EmailTemplate } from '../types';
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
  { id: 'no_homepage_cta', label: 'Home-CTA fehlt' },
  { id: 'custom', label: 'Eigenes Thema' }
];

const STEPS: { id: EmailStep; label: string }[] = [
  { id: 'outreach', label: 'Erstkontakt' },
  { id: 'followup1', label: 'Follow-up #1' },
  { id: 'followup2', label: 'Follow-up #2' },
  { id: 'followup3', label: 'Follow-up #3' }
];

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ templates, onSave }) => {
  const [selectedPainPoint, setSelectedPainPoint] = useState<string>(PAIN_POINTS[0].id);
  const [selectedStep, setSelectedStep] = useState<EmailStep>('outreach');
  
  const [currentTemplates, setCurrentTemplates] = useState<FullTemplates>(templates);
  
  // Sync when props change (e.g. from local storage)
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
    <div className="template-editor-view">
      <div className="editor-controls">
        <div className="selection-group">
          <label>Problemstellung (Pain Point)</label>
          <select 
            value={selectedPainPoint} 
            onChange={(e) => setSelectedPainPoint(e.target.value)}
            className="modern-select"
          >
            {PAIN_POINTS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        
        <div className="selection-group">
          <label>Email-Schritt</label>
          <select 
            value={selectedStep} 
            onChange={(e) => setSelectedStep(e.target.value as EmailStep)}
            className="modern-select"
          >
            {STEPS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div className="action-buttons-editor">
          <button onClick={saveAll} className="btn-primary">Speichern</button>
          <button onClick={resetCurrent} className="btn-secondary">Reset aktuell</button>
          <button onClick={resetAll} className="btn-danger">Alles zurücksetzen</button>
        </div>
      </div>

      <div className="editor-grid">
        <div className="editor-panel card glassy">
          <h4>Vorlage bearbeiten</h4>
          <div className="placeholder-hint">
            Verfügbar: <code>{'{anrede}'}</code>, <code>{'{name}'}</code>, <code>{'{company}'}</code>, <code>{'{website}'}</code>, <code>{'{sender_name}'}</code>
          </div>
          
          <div className="input-field">
            <label>Betreff</label>
            <input 
              type="text" 
              value={currentTemplate.subject} 
              onChange={(e) => handleUpdate('subject', e.target.value)}
              placeholder="Betreff..."
            />
          </div>

          <div className="input-field">
            <label>Inhalt</label>
            <textarea 
              value={currentTemplate.body} 
              onChange={(e) => handleUpdate('body', e.target.value)}
              placeholder="E-Mail Inhalt..."
              rows={15}
            />
          </div>
        </div>

        <div className="preview-panel card glassy">
          <h4>Live Vorschau (Beispiel-Daten)</h4>
          <div className="email-preview-container">
            <div className="preview-item">
              <strong>Betreff:</strong> {previewSubject}
            </div>
            <div className="preview-item body-preview">
              {previewBody.split('\n').map((line, i) => <div key={i}>{line || <br/>}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

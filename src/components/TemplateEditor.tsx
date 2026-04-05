import React, { useState, useEffect } from 'react';
import { FullTemplates, PainPoint, EmailStep, EmailTemplate, ApiSettings } from '../types';
import { DEFAULT_TEMPLATES, substituteVariables } from '../logic/templates';
import { generateAiEmail } from '../logic/aiGenerator';

interface TemplateEditorProps {
  templates: FullTemplates;
  onSave: (templates: FullTemplates) => void;
  apiSettings: ApiSettings;
  onApiSettingsChange: (settings: ApiSettings) => void;
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

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ 
  templates, 
  onSave, 
  apiSettings, 
  onApiSettingsChange 
}) => {
  const [selectedPainPoint, setSelectedPainPoint] = useState<string>(PAIN_POINTS[0].id);
  const [selectedStep, setSelectedStep] = useState<EmailStep>('outreach');
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [niche, setNiche] = useState('Poolbau / Handwerk');
  
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

  const handleAiRefine = async () => {
    if (!apiSettings.geminiKey) {
      alert("Bitte tragen Sie zuerst Ihren Gemini API-Key in den Einstellungen ein.");
      setShowSettings(true);
      return;
    }

    setIsGenerating(true);
    try {
      const template = await generateAiEmail({
        painPoint: PAIN_POINTS.find(p => p.id === selectedPainPoint)?.label || selectedPainPoint,
        company: SAMPLE_LEAD.company,
        website: SAMPLE_LEAD.website,
        niche: niche,
        step: selectedStep
      }, apiSettings.geminiKey);

      handleUpdate('subject', template.subject);
      handleUpdate('body', template.body);
    } catch (err) {
      alert("Fehler bei der KI-Generierung: " + (err instanceof Error ? err.message : "Unbekannter Fehler"));
    } finally {
      setIsGenerating(false);
    }
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <button 
          className="btn-secondary" 
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? '✕ Einstellungen schließen' : '⚙️ API-Einstellungen'}
        </button>
      </div>

      {showSettings && (
        <div className="card variant-glass mb-4" style={{ border: '1px solid var(--primary)' }}>
           <h4 style={{ color: 'var(--primary)', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 800 }}>KI-Engine Konfiguration</h4>
           <div className="grid grid-2">
             <div className="form-group">
               <label>Gemini API Key</label>
               <input 
                 type="password" 
                 value={apiSettings.geminiKey}
                 onChange={(e) => onApiSettingsChange({ ...apiSettings, geminiKey: e.target.value })}
                 placeholder="AI Studio API Key eintragen..."
               />
             </div>
             <div className="form-group">
               <label>Nische / Fokus (für KI-Prompt)</label>
               <input 
                 type="text" 
                 value={niche}
                 onChange={(e) => setNiche(e.target.value)}
                 placeholder="z.B. Poolbau / Handwerk, Software SaaS..."
               />
             </div>
           </div>
        </div>
      )}

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
          <button 
            onClick={handleAiRefine} 
            className="btn-secondary" 
            style={{ 
              color: 'var(--primary)', 
              borderColor: 'var(--primary)',
              background: 'rgba(56, 189, 248, 0.05)',
              fontWeight: 800
            }}
            disabled={isGenerating}
          >
            {isGenerating ? '⌛ Generiere...' : '✨ Mit KI generieren'}
          </button>
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

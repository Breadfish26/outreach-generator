import React, { useState } from 'react';
import { ApiSettings, EmailStep, EmailTemplate } from '../types';
import { generateFullSequenceAi } from '../logic/aiGenerator';
import { substituteVariables } from '../logic/templates';

interface KiWerkstattProps {
  apiSettings: ApiSettings;
}

const SAMPLE_LEAD = {
  anrede: 'Hallo,' as any,
  name: 'Kontaktperson',
  company: 'Musterfirma GmbH',
  website: 'musterfirma.de',
  sender_name: 'Ihr Name'
};

export const KiWerkstatt: React.FC<KiWerkstattProps> = ({ apiSettings }) => {
  const [niche, setNiche] = useState('Anwaltskanzlei');
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [painPoint, setPainPoint] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sequence, setSequence] = useState<Record<EmailStep, EmailTemplate> | null>(null);

  const handleGenerate = async () => {
    if (!apiSettings.geminiKey) {
      alert("Bitte tragen Sie zuerst Ihren Gemini API-Key in den Textbausteine-Einstellungen ein.");
      return;
    }
    if (!painPoint || !company) {
      alert("Bitte geben Sie mindestens die Firma und den Pain Point an.");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateFullSequenceAi({
        painPoint,
        company,
        website,
        niche
      }, apiSettings.geminiKey);
      setSequence(result);
    } catch (err) {
      alert("Generierung fehlgeschlagen: " + (err instanceof Error ? err.message : "Unbekannter Fehler"));
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (template: EmailTemplate) => {
    const data = { ...SAMPLE_LEAD, company: company || SAMPLE_LEAD.company, website: website || SAMPLE_LEAD.website };
    const subject = substituteVariables(template.subject, data);
    const body = substituteVariables(template.body, data);
    navigator.clipboard.writeText(`Betreff: ${subject}\n\n${body}`);
    alert("Email kopiert!");
  };

  return (
    <div className="ki-werkstatt-view animation-fadeIn">
      <div className="card glassy" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>✨ Individuelle KI-Sequenz erstellen</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Beschreiben Sie hier ein spezifisches Problem. Die KI erstellt daraus eine vollständige 4-Schritt-Sequenz 
          basierend auf Ihrer bewährten Outreach-Struktur.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="input-field">
            <label>Nische / Branche</label>
            <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="z.B. Anwaltskanzlei" />
          </div>
          <div className="input-field">
            <label>Firmenname</label>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="z.B. Kanzlei Schmidt" />
          </div>
        </div>

        <div className="input-field">
          <label>Website</label>
          <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="www.beispiel.de" />
        </div>

        <div className="input-field">
          <label>Spezifischer Pain Point (Was ist Ihnen aufgefallen?)</label>
          <textarea 
            value={painPoint} 
            onChange={e => setPainPoint(e.target.value)} 
            placeholder="z.B. Die Website lädt seit 2 Tagen gar nicht mehr / Das Impressum ist fehlerhaft..."
            rows={3}
          />
        </div>

        <button 
          onClick={handleGenerate} 
          className="btn-primary" 
          style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}
          disabled={isGenerating}
        >
          {isGenerating ? '⌛ Erzeuge Sequenz...' : '🚀 Vollständige Sequenz generieren'}
        </button>
      </div>

      {sequence && (
        <div className="sequence-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {(['outreach', 'followup1', 'followup2', 'followup3'] as EmailStep[]).map((step, idx) => (
             <div key={step} className="card glassy" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ color: 'var(--primary)', margin: 0 }}>
                    {idx === 0 ? 'Outreach' : `Follow-up #${idx}`}
                  </h4>
                  <button 
                    onClick={() => copyToClipboard(sequence[step])}
                    className="btn-secondary" 
                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                  >📋 Kopieren</button>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                   {substituteVariables(sequence[step].subject, { ...SAMPLE_LEAD, company, website })}
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: 'var(--text-muted)', 
                  whiteSpace: 'pre-wrap', 
                  flexGrow: 1,
                  background: 'rgba(0,0,0,0.1)',
                  padding: '1rem',
                  borderRadius: '8px'
                }}>
                   {substituteVariables(sequence[step].body, { ...SAMPLE_LEAD, company, website })}
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

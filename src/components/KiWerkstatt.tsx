import React, { useState } from 'react';
import { generateFullSequenceAi } from '../logic/aiGenerator';
import { EmailTemplate, EmailStep, ApiSettings } from '../types';
import { substituteVariables } from '../logic/templates';
import { leadService } from '../lib/leads';
import { Lead } from '../types';

interface KiWerkstattProps {
  apiSettings: ApiSettings;
  senderName: string;
  onSenderNameChange: (name: string) => void;
}

const KiWerkstatt: React.FC<KiWerkstattProps> = ({ apiSettings, senderName, onSenderNameChange }) => {
  const [painPoint, setPainPoint] = useState('');
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [contactName, setContactName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSequence, setGeneratedSequence] = useState<Record<EmailStep, EmailTemplate> | null>(null);

  const handleGenerate = async () => {
    if (!painPoint || !company || !website) {
      alert("Bitte füllen Sie Pain Point, Firmennamen und Website aus.");
      return;
    }

    if (!apiSettings.geminiKey) {
      alert("Bitte hinterlegen Sie zuerst einen Gemini API Key in den Einstellungen.");
      return;
    }

    setIsGenerating(true);
    try {
      const sequence = await generateFullSequenceAi({
        painPoint,
        company,
        website,
        contactName,
      }, apiSettings.geminiKey);
      
      setGeneratedSequence(sequence);

      // --- SAVE TO SUPABASE ---
      try {
          const leadDraft: Lead = {
              company,
              website,
              name: contactName,
              email: '', // Let users add it later if not available
              anrede: '',
              painPoint: 'custom',
              lastSent: '',
              outreachSent: '',
              f1Sent: '',
              f2Sent: '',
              f3Sent: '',
              response: 'NO',
              responseDate: '',
              status: 'Open',
              nextAction: 'Send Outreach',
              notes: painPoint
          };

          // 1. Ensure lead exists in DB and get its ID
          await leadService.upsertLeads([leadDraft]);
          
          // 2. Refresh from DB to get the ID (since it might be auto-generated)
          const allLeads = await leadService.getAllLeads();
          const savedLead = allLeads.find(l => l.company === company);
          
          if (savedLead?.id) {
              // 3. Save the actual sequence
              await leadService.saveSequence(savedLead.id, sequence);
              console.log('Sequence auto-saved to dashboard!');
          }
      } catch (saveError) {
          console.error('Failed to auto-save to dashboard:', saveError);
      }
      // -------------------------

    } catch (error: any) {
      alert("Generierung fehlgeschlagen: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (template: EmailTemplate) => {
    // Data for substitution
    const data = { 
      name: contactName,
      contact_name: contactName,
      company: company,
      website: website,
      sender_name: senderName
    };
    
    const subject = substituteVariables(template.subject, data as any);
    const body = substituteVariables(template.body, data as any);
    
    navigator.clipboard.writeText(`Betreff: ${subject}\n\n${body}`);
    alert("Email kopiert!");
  };

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <h2>🪄 Individuelle KI-Werkstatt</h2>
      </div>
      <div className="card-body">
        <p className="text-secondary mb-4">
          Geben Sie die Basis-Informationen ein. Die KI erstellt daraus eine psychologisch optimierte 4-Schritt-Sequenz basierend auf Ihrem Case.
        </p>

        <div className="grid grid-2">
          <div className="form-group">
            <label htmlFor="contact-name">Ansprechpartner Name (Optional)</label>
            <input 
              id="contact-name"
              type="text" 
              placeholder="z.B. Herr Müller oder Kerstin" 
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="company-name">Firmenname</label>
            <input 
              id="company-name"
              type="text" 
              placeholder="Muster GmbH" 
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input 
              id="website"
              type="url" 
              placeholder="www.muster.de" 
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="sender-name">Dein Absender Name</label>
            <input 
              id="sender-name"
              type="text" 
              placeholder="z.B. Kerstin Grosche" 
              value={senderName}
              onChange={(e) => onSenderNameChange(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="pain-point">Spezifischer Pain Point (Was ist Ihnen aufgefallen?)</label>
          <textarea 
            id="pain-point"
            placeholder="z.B. Das Impressum lädt nicht, oder: Der 'Team'-Link auf der Startseite führt zu einer 404 Fehlerseite."
            rows={4}
            value={painPoint}
            onChange={(e) => setPainPoint(e.target.value)}
          ></textarea>
        </div>

        <button 
          className="btn-primary w-full mt-4" 
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{ padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
        >
          {isGenerating ? (
            <>
              <span className="spinner"></span>
              Erzeuge Sequenz...
            </>
          ) : '🚀 Vollständige Sequenz generieren'}
        </button>

        {generatedSequence && (
          <div className="mt-4 animate-fade-in" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>Generierte E-Mails</h3>
              <button 
                className="btn-secondary"
                onClick={() => {
                  const fullText = (['outreach', 'followup1', 'followup2', 'followup3'] as EmailStep[])
                    .map((step, idx) => {
                      const t = generatedSequence[step];
                      const s = substituteVariables(t.subject, { company, website } as any);
                      const b = substituteVariables(t.body, { name: contactName, company, website, sender_name: senderName } as any);
                      return `--- EMAIL ${idx + 1} (${step}) ---\nBetreff: ${s}\n\n${b}`;
                    }).join('\n\n');
                  navigator.clipboard.writeText(fullText);
                  alert("Vollständige Sequenz kopiert!");
                }}
              >
                Ganze Sequenz kopieren
              </button>
            </div>
            
            <div className="grid grid-2" style={{ gap: '1.5rem' }}>
              {(['outreach', 'followup1', 'followup2', 'followup3'] as EmailStep[]).map((step, idx) => (
                <div key={step} className="variant-glass" style={{ borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-primary">
                      {idx === 0 ? 'Step 1: Outreach' : `Step ${idx + 1}: Follow-up`}
                    </span>
                    <button 
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => copyToClipboard(generatedSequence[step])}
                    >
                      Kopieren
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--primary)', fontWeight: 800 }}>Betreff:</strong> {substituteVariables(generatedSequence[step].subject, { company, website } as any)}
                  </div>
                  <div 
                    style={{ 
                      fontSize: '0.9rem', 
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      padding: '1rem',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    {substituteVariables(generatedSequence[step].body, { 
                      name: contactName, 
                      company, 
                      website, 
                      sender_name: senderName 
                    } as any)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KiWerkstatt;

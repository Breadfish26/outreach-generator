import { useState, useEffect, useMemo } from 'react'
import { Lead, GeneratedEmail, NextAction, FullTemplates } from './types'
import { fetchSheetData, parseCSV } from './logic/sheetParser'
import { generateEmailForLead } from './logic/sequenceGenerator'
import { useLocalStorage } from './hooks'
import { TemplateEditor } from './components/TemplateEditor'
import KiWerkstatt from './components/KiWerkstatt'
import { DEFAULT_TEMPLATES } from './logic/templates'
import { substituteVariables } from './logic/templates'
import { ApiSettings } from './types'
import { generateAiEmail } from './logic/aiGenerator'
import { leadService } from './lib/leads'

const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv";

function App() {
  const [sheetUrl, setSheetUrl] = useLocalStorage<string>('google_sheet_url', DEFAULT_SHEET_URL);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Closed' | 'Today'>('Open');
  
  // Modal State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [previewEmail, setPreviewEmail] = useState<GeneratedEmail | null>(null);
  const [copyStatus, setCopyStatus] = useState(false);
  const [senderName, setSenderName] = useLocalStorage<string>('sender_name', 'Kerstin Grosche');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'templates' | 'ki-werkstatt'>('dashboard');
  const [savedSequence, setSavedSequence] = useState<any | null>(null);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [customTemplates, setCustomTemplates] = useLocalStorage<FullTemplates>('outreach_templates', DEFAULT_TEMPLATES);
  const [apiSettings, setApiSettings] = useLocalStorage<ApiSettings>('api_settings', {
    geminiKey: import.meta.env.VITE_GEMINI_KEY || '',
    useAiFallback: true
  });

  // Ensure default key is applied if storage was initialized as empty
  useEffect(() => {
    if (!apiSettings.geminiKey && import.meta.env.VITE_GEMINI_KEY) {
      setApiSettings({ ...apiSettings, geminiKey: import.meta.env.VITE_GEMINI_KEY });
    }
  }, []);

  // Today Due logic
  const isDueToday = (lead: Lead): boolean => {
    if (lead.status === 'Closed' || lead.response === 'YES' || lead.nextAction === 'Closed') return false;
    return true; // Simplified for now
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const data = parseCSV(text);
        // Sync to Supabase
        await leadService.upsertLeads(data);
        // Reload from source of truth
        await loadData();
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Fehler beim Verarbeiten der CSV. Sind die Supabase-Keys korrekt?");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // First try to load from Supabase
      const dbLeads = await leadService.getAllLeads();
      if (dbLeads.length > 0) {
        setLeads(dbLeads);
      } else if (sheetUrl) {
        // Fallback to Google Sheet if DB is empty
        const data = await fetchSheetData(sheetUrl);
        setLeads(data);
      }
    } catch (err) {
      console.error(err);
      setError("Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sheetUrl) loadData();
  }, [sheetUrl]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = 
        lead.company.toLowerCase().includes(s) || 
        lead.name.toLowerCase().includes(s) ||
        lead.website.toLowerCase().includes(s) ||
        lead.email.toLowerCase().includes(s);
      
      let matchesStatus = true;
      if (statusFilter === 'Open') matchesStatus = lead.status === 'Open';
      else if (statusFilter === 'Closed') matchesStatus = lead.status === 'Closed';
      else if (statusFilter === 'Today') matchesStatus = isDueToday(lead);
      
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  const handlePreview = (lead: Lead) => {
    const email = generateEmailForLead(lead, customTemplates);
    setSelectedLead(lead);
    setPreviewEmail(email);
  };

  const handleViewSavedSequence = async (lead: Lead) => {
      if (!lead.id) return;
      setLoading(true);
      try {
          const seq = await leadService.getSequenceForLead(lead.id);
          if (seq) {
              setSavedSequence(seq);
              setSelectedLead(lead);
              setShowSequenceModal(true);
          } else {
              alert("Keine gespeicherte KI-Sequenz gefunden. Bitte erzeuge eine in der KI-Werkstatt.");
          }
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const handleDeleteLead = async (lead: Lead) => {
    if (!lead.id) return;
    if (window.confirm(`Möchtest du den Lead "${lead.company}" wirklich unwiderruflich löschen?`)) {
      setLoading(true);
      try {
        await leadService.deleteLead(lead.id);
        await loadData();
      } catch (err) {
        console.error(err);
        alert("Fehler beim Löschen des Leads.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAdvanceStep = async (lead: Lead) => {
    if (!lead.id) return;

    const sequence: NextAction[] = [
      'Send Outreach',
      'Send Follow-up #1',
      'Send Follow-up #2',
      'Send Follow-up #3',
      'Closed'
    ];

    const currentIndex = sequence.indexOf(lead.nextAction);
    const nextIndex = Math.min(currentIndex + 1, sequence.length - 1);
    const nextAction = sequence[nextIndex];
    const today = new Date().toLocaleDateString('de-DE');

    const updates: Partial<Lead> = {
      nextAction: nextAction,
      lastSent: today,
      // Record specific date for this step
      ...(lead.nextAction === 'Send Outreach' ? { outreachSent: today } : {}),
      ...(lead.nextAction === 'Send Follow-up #1' ? { f1Sent: today } : {}),
      ...(lead.nextAction === 'Send Follow-up #2' ? { f2Sent: today } : {}),
      ...(lead.nextAction === 'Send Follow-up #3' ? { f3Sent: today } : {}),
      // Automatically close if last step is reached
      status: nextAction === 'Closed' ? 'Closed' : lead.status
    };

    setLoading(true);
    try {
      await leadService.updateLead(lead.id, updates);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Fehler beim Aktualisieren des Status.");
    } finally {
      setLoading(false);
    }
  };

  const handleStepBack = async (lead: Lead) => {
    if (!lead.id) return;

    const sequence: NextAction[] = [
      'Send Outreach',
      'Send Follow-up #1',
      'Send Follow-up #2',
      'Send Follow-up #3',
      'Closed'
    ];

    const currentIndex = sequence.indexOf(lead.nextAction);
    const nextIndex = Math.max(currentIndex - 1, 0);
    const nextAction = sequence[nextIndex];

    const updates: Partial<Lead> = {
      nextAction: nextAction,
      status: 'Open' // Always reopen when stepping back
    };

    setLoading(true);
    try {
      await leadService.updateLead(lead.id, updates);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Fehler beim Zurücksetzen des Status.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!previewEmail) return;
    const textToCopy = `Betreff: ${previewEmail.subject}\n\n${previewEmail.body}`;
    await navigator.clipboard.writeText(textToCopy);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  return (
    <div className="layout">
      <header className="header">
        <h1>Outreach Dashboard</h1>
        <p>Live-Lead-Datenbank & Email-Sequenzer &bull; Kerstin Grosche</p>
      </header>

      <nav className="main-nav">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`nav-item ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Textbausteine
        </button>
        <button 
          className={`nav-item ${activeTab === 'ki-werkstatt' ? 'active' : ''}`}
          onClick={() => setActiveTab('ki-werkstatt')}
        >
          ✨ KI-Werkstatt
        </button>
      </nav>

      {activeTab === 'dashboard' ? (
        <section className="dashboard animate-fade-in">
          {/* ... existing dashboard code ... */}
          <div className="controls-bar">
            {/* Same controls as before */}
            <div className="search-wrapper">
               <span className="search-icon">🔍</span>
               <input 
                 type="text" 
                 placeholder="Suche nach Firma, Name, Website oder E-Mail" 
                 className="search-input"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            
            <div className="filters-group">
              <button 
                className={`filter-btn ${statusFilter === 'Today' ? 'active' : ''}`}
                onClick={() => setStatusFilter('Today')}
              >
                Heute fällig
              </button>
              <button 
                className={`filter-btn ${statusFilter === 'Open' ? 'active' : ''}`}
                onClick={() => setStatusFilter('Open')}
              >
                Offen
              </button>
              <button 
                className={`filter-btn ${statusFilter === 'Closed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('Closed')}
              >
                Abgeschlossen
              </button>
              <button 
                className={`filter-btn ${statusFilter === 'All' ? 'active' : ''}`}
                onClick={() => setStatusFilter('All')}
              >
                Alle
              </button>
            </div>
  
            <div className="flex gap-2">
               <button onClick={loadData} className={`btn-secondary ${loading ? 'loading' : ''}`}>
                  {loading ? 'Lade...' : 'Sync'}
               </button>
               <button 
                 onClick={() => document.getElementById('csv-upload')?.click()} 
                 className="btn-secondary"
               >
                  Upload
               </button>
               <input 
                 id="csv-upload"
                 type="file" 
                 accept=".csv" 
                 onChange={handleFileUpload} 
                 style={{ display: 'none' }} 
               />
               <button onClick={() => {
                 const newUrl = prompt("Google Sheets CSV URL:", sheetUrl);
                 if (newUrl) setSheetUrl(newUrl);
               }} className="btn-secondary">
                 Config
               </button>
            </div>
          </div>
  
          {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 600 }}>{error}</div>}
  
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Firma / Website</th>
                  <th>Kontakt</th>
                  <th>Nächster Schritt</th>
                  <th style={{ textAlign: 'right' }}>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="company-cell">{lead.company}</div>
                      <a href={`https://${lead.website}`} target="_blank" className="website-link">{lead.website}</a>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{lead.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.email}</div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <span className={`action-badge ${
                            lead.status === ('generated' as any) ? 'generated' : 
                            lead.nextAction.toLowerCase().includes('outreach') ? 'outreach' : 
                            'followup'} ${lead.status === 'Closed' ? 'closed' : ''}`}>
                          {lead.status === ('generated' as any) ? 'KI-Plan Bereit' : lead.nextAction}
                        </span>
                        <div className="flex gap-1">
                          {lead.status !== 'Closed' && (
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.6rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                              title="Als gesendet markieren"
                              onClick={() => handleAdvanceStep(lead)}
                            >
                              ✓
                            </button>
                          )}
                          {(lead.nextAction !== 'Send Outreach' || lead.status === 'Closed') && (
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.6rem', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)' }}
                              title="Einen Schritt zurück"
                              onClick={() => handleStepBack(lead)}
                            >
                              ↩
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex gap-2 justify-end">
                        {lead.status === ('generated' as any) && (
                            <button 
                                className="btn-secondary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: '1px solid var(--primary)' }}
                                onClick={() => handleViewSavedSequence(lead)}
                            >
                                ✨ KI-Sequenz
                            </button>
                        )}
                        <button 
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={() => handlePreview(lead)}
                        >
                            Email generieren
                        </button>
                        <button 
                            className="btn-danger-icon"
                            title="Lead löschen"
                            onClick={() => handleDeleteLead(lead)}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Keine Leads gefunden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : activeTab === 'templates' ? (
        <section className="templates">
          <TemplateEditor 
            templates={customTemplates} 
            onSave={(updated) => setCustomTemplates(updated)} 
          />
        </section>
      ) : activeTab === 'ki-werkstatt' ? (
        <section className="ki-werkstatt">
          <KiWerkstatt 
            apiSettings={apiSettings} 
            senderName={senderName} 
            onSenderNameChange={setSenderName}
          />
        </section>
      ) : null}

      {/* Preview Modal */}
      {selectedLead && previewEmail && !showSequenceModal && (
        <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {/* ... existing modal ... */}
            <div className="modal-header">
              <h3>Email-Vorschau: {selectedLead.company}</h3>
              <button onClick={() => setSelectedLead(null)} className="btn-secondary">✕</button>
            </div>
            <div className="modal-body">
               <div className="email-preview-container">
                  <div className="email-section">
                    <span className="section-label">Betreff</span>
                    <div className="section-content" style={{ fontWeight: 600, color: 'var(--primary)' }}>{previewEmail.subject}</div>
                  </div>
                  <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
                  <div className="email-section">
                    <span className="section-label">Inhalt</span>
                    <div className="section-content">{previewEmail.body}</div>
                  </div>
               </div>
            </div>
            <div className="modal-footer">
               <button onClick={handleCopy} className={`btn-primary ${copyStatus ? 'btn-copied' : ''}`}>{copyStatus ? 'Kopiert!' : 'Kopieren & Schließen'}</button>
               <button onClick={() => setSelectedLead(null)} className="btn-secondary">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* SAVED SEQUENCE MODAL */}
      {selectedLead && showSequenceModal && savedSequence && (
          <div className="modal-overlay" onClick={() => { setSelectedLead(null); setShowSequenceModal(false); }}>
              <div className="modal-content" style={{ maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                      <h3>Gespeicherte KI-Sequenz: {selectedLead.company}</h3>
                      <button onClick={() => { setSelectedLead(null); setShowSequenceModal(false); }} className="btn-secondary">✕</button>
                  </div>
                  <div className="modal-body">
                      <div className="grid grid-2" style={{ gap: '1.5rem' }}>
                          {Object.entries(savedSequence).map(([step, email]: [any, any], idx) => (
                              <div key={step} className="variant-glass" style={{ borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <div className="flex justify-between" style={{ justifyContent: 'space-between', width: '100%' }}>
                                      <span className="badge badge-primary">{step.toUpperCase()}</span>
                                      <button 
                                          className="btn-secondary" 
                                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                                          onClick={() => {
                                              const data = { name: selectedLead.name, company: selectedLead.company, website: selectedLead.website, sender_name: senderName };
                                              const s = substituteVariables(email.subject, data as any);
                                              const b = substituteVariables(email.body, data as any);
                                              navigator.clipboard.writeText(`Betreff: ${s}\n\n${b}`);
                                              setCopyStatus(true);
                                              setTimeout(() => setCopyStatus(false), 2000);
                                          }}
                                      >Kopieren</button>
                                  </div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginTop: '0.5rem' }}>
                                      Betreff: {substituteVariables(email.subject, { company: selectedLead.company, website: selectedLead.website } as any)}
                                  </div>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                                      {substituteVariables(email.body, { name: selectedLead.name, company: selectedLead.company, website: selectedLead.website, sender_name: senderName } as any)}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="modal-footer">
                      <button onClick={() => { setSelectedLead(null); setShowSequenceModal(false); }} className="btn-primary">Schließen</button>
                  </div>
              </div>
          </div>
      )}

      {copyStatus && <div className="toast-success">E-Mail in Zwischenablage kopiert!</div>}

      <footer style={{ marginTop: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>&copy; {new Date().getFullYear()} Outreach Generator &bull; Designed for Internal Efficiency</p>
      </footer>
    </div>
  )
}

export default App

import { useState, useEffect, useMemo } from 'react'
import { Lead, GeneratedEmail, NextAction, FullTemplates } from './types'
import { fetchSheetData, parseCSV } from './logic/sheetParser'
import { generateEmailForLead } from './logic/sequenceGenerator'
import { useLocalStorage } from './hooks'
import { TemplateEditor } from './components/TemplateEditor'
import { DEFAULT_TEMPLATES } from './logic/templates'

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
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'templates'>('dashboard');
  const [customTemplates, setCustomTemplates] = useLocalStorage<FullTemplates>('outreach_templates', DEFAULT_TEMPLATES);

  // Today Due logic
  const isDueToday = (lead: Lead): boolean => {
    if (lead.status === 'Closed' || lead.response === 'YES' || lead.nextAction === 'Closed') return false;
    return true; // Simplified for now
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const data = parseCSV(text);
        setLeads(data);
        setError(null);
      } catch (err) {
        setError("Fehler beim Lesen der CSV-Datei. Bitte prüfen Sie das Format.");
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
      const data = await fetchSheetData(sheetUrl);
      setLeads(data);
    } catch (err) {
      setError("Fehler beim Laden der Tabelle. Bitte URL prüfen.");
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
      </nav>

      {activeTab === 'dashboard' ? (
        <section className="dashboard">
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
  
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
               <button onClick={loadData} className={`btn-secondary ${loading ? 'loading' : ''}`} style={{ padding: '0.5rem 1rem' }}>
                  {loading ? 'Lade...' : 'Sync'}
               </button>
               <button 
                 onClick={() => document.getElementById('csv-upload')?.click()} 
                 className="btn-secondary" 
                 style={{ padding: '0.5rem 1rem' }}
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
               }} className="btn-secondary" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)' }}>
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
                      <span className={`action-badge ${lead.nextAction.toLowerCase().includes('outreach') ? 'outreach' : 'followup'} ${lead.status === 'Closed' ? 'closed' : ''}`}>
                         {lead.nextAction}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => handlePreview(lead)}
                      >
                        Email generieren
                      </button>
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
      ) : (
        <section className="templates">
          <TemplateEditor 
            templates={customTemplates} 
            onSave={(updated) => setCustomTemplates(updated)} 
          />
        </section>
      )}

      {/* Preview Modal */}
      {selectedLead && previewEmail && (
        <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Email-Vorschau: {selectedLead.company}</h3>
              <button 
                onClick={() => setSelectedLead(null)} 
                className="btn-secondary" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
              >✕</button>
            </div>
            <div className="modal-body">
               <div className="email-preview-container">
                  <div className="email-section">
                    <span className="section-label">Betreff</span>
                    <div className="section-content" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {previewEmail.subject}
                    </div>
                  </div>
                  <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
                  <div className="email-section">
                    <span className="section-label">Inhalt</span>
                    <div className="section-content">{previewEmail.body}</div>
                  </div>
               </div>
            </div>
            <div className="modal-footer">
               <button 
                 onClick={handleCopy} 
                 className={`btn-primary ${copyStatus ? 'btn-copied' : ''}`}
               >
                 {copyStatus ? 'Kopiert!' : 'Kopieren & Schließen'}
               </button>
               <button onClick={() => setSelectedLead(null)} className="btn-secondary">Abbrechen</button>
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

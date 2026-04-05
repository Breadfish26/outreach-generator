import { useState, useEffect } from 'react'
import { FormSection } from './components/FormSection'
import { PreviewBar } from './components/PreviewBar'
import { EmailCard } from './components/EmailCard'
import { ExportSection } from './components/ExportSection'
import { FormState, EmailSequence } from './types'
import { useLocalStorage } from './hooks'
import { generateSequence } from './logic/sequenceGenerator'

const DEFAULT_DATA: FormState = {
  company_name: "Poolbau Beispiel GmbH",
  website: "poolbau-beispiel.de",
  contact_name: "",
  anrede_type: "formal",
  issue_type: "missing_pool_calculator",
  custom_issue_text: "",
  sender_name: "Kerstin Grosche",
  closing_style: "viele_gruesse"
};

function App() {
  const [formState, setFormState] = useLocalStorage<FormState>('outreach_form_data', DEFAULT_DATA);
  const [sequence, setSequence] = useState<EmailSequence | null>(null);

  // Auto-generate on change
  useEffect(() => {
    const generated = generateSequence(formState);
    setSequence(generated);
  }, [formState]);

  const handleReset = () => {
    if (window.confirm("Alle Eingaben auf Standardwerte zurücksetzen?")) {
      setFormState(DEFAULT_DATA);
    }
  };

  const handleEdit = (step: keyof EmailSequence, newContent: string) => {
    if (!sequence) return;
    setSequence({ ...sequence, [step]: newContent });
  };

  const handleRegenerate = (step: keyof EmailSequence) => {
    const fullGenerated = generateSequence(formState);
    if (!sequence) return;
    setSequence({ ...sequence, [step]: fullGenerated[step] });
  };

  return (
    <div className="layout">
      <header className="header">
        <h1>Outreach Email Generator</h1>
        <p>Erstellen Sie professionelle Outreach-Sequenzen für Pool-Unternehmen.</p>
      </header>
      
      <main className="content">
        <FormSection 
          state={formState} 
          onChange={setFormState} 
          onReset={handleReset}
        />
        
        <PreviewBar state={formState} />

        {sequence && (
          <>
            <div className="email-cards-grid">
              <EmailCard
                title="A) Outreach"
                id="outreach"
                content={sequence.outreach}
                onEdit={(val) => handleEdit('outreach', val)}
                onRegenerate={() => handleRegenerate('outreach')}
              />
              <EmailCard
                title="B) Follow-up 1"
                id="f1"
                content={sequence.followup1}
                onEdit={(val) => handleEdit('followup1', val)}
                onRegenerate={() => handleRegenerate('followup1')}
              />
              <EmailCard
                title="C) Follow-up 2"
                id="f2"
                content={sequence.followup2}
                onEdit={(val) => handleEdit('followup2', val)}
                onRegenerate={() => handleRegenerate('followup2')}
              />
              <EmailCard
                title="D) Follow-up 3"
                id="f3"
                content={sequence.followup3}
                onEdit={(val) => handleEdit('followup3', val)}
                onRegenerate={() => handleRegenerate('followup3')}
              />
            </div>

            <ExportSection sequence={sequence} formState={formState} />
          </>
        )}
      </main>
      
      <footer style={{ marginTop: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <p>&copy; {new Date().getFullYear()} Internal Tool &bull; Made for Kerstin Grosche</p>
      </footer>
    </div>
  )
}

export default App

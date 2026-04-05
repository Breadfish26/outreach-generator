import React, { useState } from 'react';
import { EmailSequence, FormState } from '../types';
import { exportAsTxt, exportAsJson } from '../logic/exportUtils';

interface ExportSectionProps {
  sequence: EmailSequence;
  formState: FormState;
}

export const ExportSection: React.FC<ExportSectionProps> = ({ sequence, formState }) => {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = () => {
    const fullText = [
      "A) OUTREACH",
      "----------------",
      sequence.outreach,
      "",
      "B) FOLLOW-UP 1",
      "----------------",
      sequence.followup1,
      "",
      "C) FOLLOW-UP 2",
      "----------------",
      sequence.followup2,
      "",
      "D) FOLLOW-UP 3",
      "----------------",
      sequence.followup3
    ].join('\n\n');

    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <section className="export-section card">
      <div className="export-header">
        <h2>Komplette Sequenz</h2>
        <div className="export-actions">
          <button 
            className={copiedAll ? "btn-secondary btn-copied" : "btn-secondary"} 
            onClick={handleCopyAll}
          >
            {copiedAll ? "Alle kopiert!" : "Alle kopieren"}
          </button>
          <button className="btn-secondary" onClick={() => exportAsTxt(sequence)}>
            Als TXT exportieren
          </button>
          <button className="btn-secondary" onClick={() => exportAsJson(formState, sequence)}>
            Als JSON exportieren
          </button>
        </div>
      </div>
      
      <div className="export-preview">
        <div className="sequence-block">
          <h4>Outreach</h4>
          <pre>{sequence.outreach}</pre>
        </div>
        <div className="sequence-block">
          <h4>Follow-up 1</h4>
          <pre>{sequence.followup1}</pre>
        </div>
        <div className="sequence-block">
          <h4>Follow-up 2</h4>
          <pre>{sequence.followup2}</pre>
        </div>
        <div className="sequence-block">
          <h4>Follow-up 3</h4>
          <pre>{sequence.followup3}</pre>
        </div>
      </div>
    </section>
  );
};

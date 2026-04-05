import React from 'react';
import { FormState } from '../types';

interface PreviewBarProps {
  state: FormState;
}

export const PreviewBar: React.FC<PreviewBarProps> = ({ state }) => {
  const getIssueLabel = (val: string) => {
    const labels: Record<string, string> = {
      missing_pool_calculator: "Fehlender Rechner",
      calculator_email_only: "Kalkulator suboptimal",
      external_redirect: "Externer Link",
      missing_contact_option: "Kontakt fehlt",
      broken_link: "Defekter Link",
      custom_issue: "Custom"
    };
    return labels[val] || val;
  };

  return (
    <div className="preview-bar card">
      <div className="preview-chip">
        <span className="chip-label">Anrede:</span>
        <span className="chip-value">{state.anrede_type === 'formal' ? 'Formal' : 'Informal'}</span>
      </div>
      <div className="preview-chip">
        <span className="chip-label">Issue:</span>
        <span className="chip-value">{getIssueLabel(state.issue_type)}</span>
      </div>
      <div className="preview-chip">
        <span className="chip-label">Firma:</span>
        <span className="chip-value">{state.company_name}</span>
      </div>
      <div className="preview-chip">
        <span className="chip-label">Website:</span>
        <span className="chip-value">{state.website}</span>
      </div>
    </div>
  );
};

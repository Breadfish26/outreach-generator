import React from 'react';
import { FormState, AnredeType, IssueType, ClosingStyle } from '../types';

interface FormSectionProps {
  state: FormState;
  onChange: (newState: FormState) => void;
  onReset: () => void;
}

export const FormSection: React.FC<FormSectionProps> = ({ state, onChange, onReset }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ ...state, [name]: value });
  };

  return (
    <section className="form-section card">
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="company_name">Firmenname</label>
          <input
            type="text"
            id="company_name"
            name="company_name"
            value={state.company_name}
            onChange={handleChange}
            placeholder="Poolbau Beispiel GmbH"
          />
        </div>

        <div className="form-group">
          <label htmlFor="website">Website URL (ohne https://)</label>
          <input
            type="text"
            id="website"
            name="website"
            value={state.website}
            onChange={handleChange}
            placeholder="poolbau-beispiel.de"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contact_name">Kontaktperson (Optional)</label>
          <input
            type="text"
            id="contact_name"
            name="contact_name"
            value={state.contact_name}
            onChange={handleChange}
            placeholder="Max"
          />
        </div>

        <div className="form-group">
          <label htmlFor="anrede_type">Anrede</label>
          <select id="anrede_type" name="anrede_type" value={state.anrede_type} onChange={handleChange}>
            <option value="formal">Formal (Sehr geehrte...)</option>
            <option value="informal">Informal (Hi/Hallo...)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="issue_type">Problem-Typ</label>
          <select id="issue_type" name="issue_type" value={state.issue_type} onChange={handleChange}>
            <option value="missing_pool_calculator">Fehlender Poolkosten-Kalkulator</option>
            <option value="calculator_email_only">Kalkulator nur per E-Mail</option>
            <option value="external_redirect">Externer Rechner-Link</option>
            <option value="missing_contact_option">Keine direkte Kontaktmöglichkeit</option>
            <option value="broken_link">Defekter Link</option>
            <option value="custom_issue">Eigener Text...</option>
          </select>
        </div>

        {state.issue_type === 'custom_issue' && (
          <div className="form-group full-width">
            <label htmlFor="custom_issue_text">Eigener Beobachtungs-Text</label>
            <textarea
              id="custom_issue_text"
              name="custom_issue_text"
              value={state.custom_issue_text}
              onChange={handleChange}
              rows={3}
              placeholder="Geben Sie hier Ihre Beobachtung ein..."
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="sender_name">Absender Name</label>
          <input
            type="text"
            id="sender_name"
            name="sender_name"
            value={state.sender_name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="closing_style">Grußformel Stil</label>
          <select id="closing_style" name="closing_style" value={state.closing_style} onChange={handleChange}>
            <option value="viele_gruesse">Viele Grüße</option>
            <option value="default">Nur Name</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn-secondary" onClick={onReset}>Zurücksetzen</button>
      </div>
    </section>
  );
};

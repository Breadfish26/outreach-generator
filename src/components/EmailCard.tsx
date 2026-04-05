import React, { useState, useEffect } from 'react';

interface EmailCardProps {
  title: string;
  id: string;
  content: string;
  onEdit: (newContent: string) => void;
  onRegenerate: () => void;
}

export const EmailCard: React.FC<EmailCardProps> = ({ title, id, content, onEdit, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const charCount = content.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="email-card-container card">
      <div className="email-card-header">
        <h3 className="email-card-title">{title}</h3>
        <div className="email-card-actions">
          <button className="btn-icon" onClick={onRegenerate} title="Vom Template wiederherstellen">
            ↺
          </button>
          <button className={copied ? "btn-secondary btn-copied" : "btn-primary"} onClick={handleCopy}>
            {copied ? "Kopiert!" : "Kopieren"}
          </button>
        </div>
      </div>
      
      <div className="email-card-body">
        <textarea
          id={`email-textarea-${id}`}
          className="email-textarea"
          value={content}
          onChange={(e) => onEdit(e.target.value)}
          rows={12}
        />
        <div className="email-card-footer">
          <span className="char-count">{charCount} Zeichen</span>
        </div>
      </div>
    </div>
  );
};

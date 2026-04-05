import { Lead, GeneratedEmail, IssueType, NextAction, FormState, EmailSequence, EmailModule, FullTemplates, EmailStep } from '../types';
import { ISSUE_MODULES, getGreetingForLead, substituteVariables, DEFAULT_TEMPLATES } from './templates';

const SENDER_NAME = "Kerstin Grosche";

export const generateEmailForLead = (lead: Lead, customTemplates?: FullTemplates): GeneratedEmail | null => {
  if (lead.status === 'Closed' || lead.response === 'YES' || lead.nextAction === 'Closed') {
    return null;
  }

  const action = lead.nextAction;
  const templates = customTemplates || DEFAULT_TEMPLATES;
  
  // Map NextAction to EmailStep
  let step: EmailStep = 'outreach';
  if (action === 'Send Follow-up #1') step = 'followup1';
  if (action === 'Send Follow-up #2') step = 'followup2';
  if (action === 'Send Follow-up #3') step = 'followup3';

  // Get template for pain point and step
  const painPoint = lead.painPoint in templates ? lead.painPoint : 'custom';
  const template = templates[painPoint][step];

  const data = {
    ...lead,
    sender_name: SENDER_NAME // Predefined for now, could be dynamic
  };

  return {
    subject: substituteVariables(template.subject, data),
    body: substituteVariables(template.body, data),
    type: action
  };
};

// ... and the manual sequence if needed ...
export const generateSequenceManual = (state: FormState): EmailSequence => {
  // Keeping it simple for the dashboard context
  const { sender_name } = state;
  const outreach = "Manual outreach placeholder";
  return { outreach, followup1: "", followup2: "", followup3: "" };
};

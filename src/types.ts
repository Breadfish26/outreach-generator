export type Anrede = 'Herr' | 'Frau' | 'Familie' | '';

export type IssueType = 
  | 'missing_pool_calculator'
  | 'calculator_email_only'
  | 'external_redirect'
  | 'missing_contact_option'
  | 'broken_link'
  | 'no_homepage_cta'
  | 'custom'
  | 'custom_issue'; // Supporting both versions

export type NextAction = 
  | 'Send Outreach'
  | 'Send Follow-up #1'
  | 'Send Follow-up #2'
  | 'Send Follow-up #3'
  | 'Closed';

export interface Lead {
  anrede: Anrede;
  name: string;
  company: string;
  website: string;
  email: string;
  painPoint: IssueType;
  lastSent: string;
  outreachSent: string;
  f1Sent: string;
  f2Sent: string;
  f3Sent: string;
  response: 'YES' | 'NO';
  responseDate: string;
  status: 'Open' | 'Closed';
  nextAction: NextAction;
  notes: string;
}

export interface EmailModule {
  observation: string;
  consequence: string;
  previewLine: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  type: NextAction;
}

// For the manual form compatibility if needed
export type AnredeType = 'formal' | 'informal';
export type ClosingStyle = 'default' | 'viele_gruesse';
export interface FormState {
  company_name: string;
  website: string;
  contact_name: string;
  anrede_type: AnredeType;
  issue_type: IssueType;
  custom_issue_text: string;
  sender_name: string;
  closing_style: ClosingStyle;
}

export interface EmailSequence {
  outreach: string;
  followup1: string;
  followup2: string;
  followup3: string;
}

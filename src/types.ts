export type AnredeType = 'formal' | 'informal';
export type ClosingStyle = 'default' | 'viele_gruesse';

export type IssueType = 
  | 'missing_pool_calculator'
  | 'calculator_email_only'
  | 'external_redirect'
  | 'missing_contact_option'
  | 'broken_link'
  | 'custom_issue';

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

export interface EmailModule {
  observation: string;
  consequence: string;
  previewLine: string;
}

export interface EmailSequence {
  outreach: string;
  followup1: string;
  followup2: string;
  followup3: string;
}

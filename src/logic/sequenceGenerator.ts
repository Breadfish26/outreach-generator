import { Lead, GeneratedEmail, IssueType, NextAction, FormState, EmailSequence, EmailModule } from '../types';
import { ISSUE_MODULES, getGreetingForLead, substituteVariables } from './templates';

const SENDER_NAME = "Kerstin Grosche";

export const generateEmailForLead = (lead: Lead): GeneratedEmail | null => {
  if (lead.status === 'Closed' || lead.response === 'YES' || lead.nextAction === 'Closed') {
    return null;
  }

  const action = lead.nextAction;
  const greeting = getGreetingForLead(lead);
  const module = ISSUE_MODULES[lead.painPoint] || ISSUE_MODULES.custom;
  
  let subject = "";
  let bodyParts: string[] = [greeting, ""];

  switch (action) {
    case 'Send Outreach':
      subject = `Kosten-Schätzung auf [website]`;
      bodyParts.push(
        substituteVariables(module.observation, lead),
        "",
        substituteVariables(module.consequence, lead),
        "",
        substituteVariables(module.previewLine, lead),
        "",
        "Soll ich Ihnen das kurz schicken?",
        "",
        SENDER_NAME
      );
      break;

    case 'Send Follow-up #1':
      subject = `Re: Kosten-Schätzung auf [website]`;
      bodyParts.push(
        "ich wollte kurz nachfragen, ob meine Nachricht bei Ihnen angekommen ist.",
        "",
        `Viele Besucher auf einer Pool-Website haben bereits konkretes Interesse. ${substituteVariables(module.consequence, lead)}`,
        "",
        substituteVariables(module.previewLine, lead),
        "",
        "Soll ich Ihnen das kurz schicken?",
        "",
        SENDER_NAME
      );
      break;

    case 'Send Follow-up #2':
      subject = `Kurze Rückfrage zu [company]`;
      bodyParts.push(
        "ich wollte mich kurz noch einmal melden.",
        "",
        `Haben Sie meine Skizze zur Optimierung von [website] bereits erhalten? ${substituteVariables(module.previewLine, lead)}`,
        "",
        "Soll ich Ihnen das kurz schicken?",
        "",
        SENDER_NAME
      );
      break;

    case 'Send Follow-up #3':
      subject = `Letzter Versuch / [company]`;
      bodyParts.push(
        "ich wollte den Faden hier nur kurz schließen.",
        "",
        `Soll ich Ihnen das kleine Beispiel für [company] noch schicken?`,
        "",
        "Viele Grüße",
        SENDER_NAME
      );
      break;

    default:
      return null;
  }

  return {
    subject: substituteVariables(subject, lead),
    body: bodyParts.map(p => substituteVariables(p, lead)).join('\n'),
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

import { FormState, EmailSequence, EmailModule, IssueType } from '../types';
import { ISSUE_MODULES, getGreeting, substituteVariables } from './templates';

export const generateSequence = (state: FormState): EmailSequence => {
  const { sender_name, closing_style, issue_type, company_name } = state;
  const closing = closing_style === 'viele_gruesse' ? "Viele Grüße\n" : "";
  const module: EmailModule = issue_type === 'custom_issue' 
    ? {
        observation: state.custom_issue_text,
        consequence: ISSUE_MODULES.custom_issue.consequence,
        previewLine: ISSUE_MODULES.custom_issue.previewLine
      }
    : ISSUE_MODULES[issue_type];

  // A) Outreach
  const outreach = [
    getGreeting('outreach', state),
    "",
    substituteVariables(module.observation, state),
    "",
    substituteVariables(module.consequence, state),
    "",
    substituteVariables(module.previewLine, state),
    "",
    "Soll ich Ihnen das kurz schicken?",
    "",
    `${closing}${sender_name}`
  ].join('\n');

  // B) Follow-up 1
  let f1Content = "";
  if (issue_type === 'missing_pool_calculator') {
    f1Content = [
      "viele Besucher auf einer Pool-Website haben bereits konkretes Interesse. (sie möchten wissen, was ein Pool ungefähr kostet)",
      "",
      "Wenn diese Orientierung in dem Moment fehlt, geht ein Teil dieses Interesses verloren.",
      "",
      "Ich habe eine kurze Vorschau erstellt, die zeigt, wie eine sichtbare „Poolkosten-Schätzung“ auf der Startseite diesen Einstieg erleichtern kann."
    ].join('\n');
  } else {
    // For other issue types, adapt based on provided module info
    f1Content = [
      `viele Besucher auf einer Pool-Website haben bereits konkretes Interesse.`,
      "",
      substituteVariables(module.consequence, state),
      "",
      substituteVariables(module.previewLine, state)
    ].join('\n');
  }

  const followup1 = [
    getGreeting('f1', state),
    "",
    f1Content,
    "",
    "Soll ich sie Ihnen kurz schicken?",
    "",
    `${closing}${sender_name}`
  ].join('\n');

  // C) Follow-up 2
  const getF2Module = (type: IssueType) => {
    switch (type) {
      case 'missing_pool_calculator': return "direkt auf der Startseite eine erste Preis-Orientierung";
      case 'calculator_email_only': return "direkt im Kalkulator eine erste Orientierung";
      case 'external_redirect': return "einen sauberen nächsten Schritt direkt auf Ihrer Website";
      case 'missing_contact_option': return "einen einfacheren Einstieg über die Startseite";
      case 'broken_link': return "einen reibungslosen nächsten Schritt auf der Seite";
      default: return "einen klareren nächsten Schritt auf der Seite";
    }
  };

  const followup2 = [
    "Ich wollte nur kurz nachfragen, ob meine Nachricht bei Ihnen angekommen ist.",
    "",
    `Die kleine Skizze zeigt konkret, wie Besucher ${getF2Module(issue_type)} bekommen könnten.`,
    "",
    "Soll ich sie Ihnen kurz schicken?",
    "",
    `Viele Grüße\n${sender_name}`
  ].join('\n');

  // D) Follow-up 3
  const followup3 = [
    getGreeting('f3', state),
    "",
    "ich wollte den Faden hier nur kurz schließen.",
    "",
    `Soll ich Ihnen das kleine Beispiel für ${company_name} noch schicken?`,
    "",
    `Viele Grüße\n${sender_name}`
  ].join('\n');

  return { outreach, followup1, followup2, followup3 };
};

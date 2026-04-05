import { FormState, Lead, IssueType, EmailModule, AnredeType } from '../types';

export const ISSUE_MODULES: Record<string, EmailModule> = {
  missing_pool_calculator: {
    observation: "dass es auf der Seite [website] keine Möglichkeit gibt, eine grobe Poolkosten-Schätzung zu bekommen.",
    consequence: "Viele, die beginnen einen Pool zu planen, möchten zuerst ein Gefühl dafür bekommen, in welchem Preisbereich sich das Projekt bewegt. Wenn diese Orientierung fehlt, verschieben viele die Anfrage erst einmal.",
    previewLine: "Wenn Sie möchten, erstelle ich eine kurze Skizze, wie eine einfache Poolkosten-Schätzung auf der Seite aussehen könnte."
  },
  calculator_email_only: {
    observation: "dass Ihr Pool-Kalkulator eine Preisorientierung erst im Anschluss per E-Mail bereitstellt.",
    consequence: "Viele Besucher nutzen so einen Kalkulator genau in dem Moment, in dem sie eine direkte Einschätzung erwarten. Wenn sie darauf warten müssen, wird die Anfrage oft verschoben, obwohl das Interesse gerade sehr konkret ist.",
    previewLine: "Ich habe eine kurze Skizze erstellt, wie man diese Orientierung direkt im Kalkulator sichtbar machen könnte."
  },
  external_redirect: {
    observation: "dass der „Pool-Rechner“-Button auf [website] aktuell auf mehrere externe Seiten weiterführt.",
    consequence: "Gerade Besucher, die dort klicken, haben meist bereits ein sehr konkretes Interesse und erwarten an dieser Stelle eine erste Preis-Orientierung. Wenn sie stattdessen auf andere Seiten weitergeleitet werden, geht dieser Einstieg oft verloren.",
    previewLine: "Ich habe eine kurze Skizze erstellt, wie dieser Schritt direkt auf Ihrer Website weiterführen könnte."
  },
  missing_contact_option: {
    observation: "dass auf [website] keine direkte, sichtbare Kontaktmöglichkeit auf der Startseite vorhanden ist.",
    consequence: "Gerade Besucher mit akutem Interesse möchten oft genau in diesem Moment schnell eine Frage stellen oder den nächsten Schritt machen. Wenn diese Möglichkeit nicht sofort sichtbar ist, geht ein Teil dieser Anfragen verloren.",
    previewLine: "Ich habe eine kurze Skizze erstellt, wie man diesen Einstieg auf der Seite sichtbarer machen könnte."
  },
  broken_link: {
    observation: "dass ein wichtiger Link auf [website] aktuell nicht sauber weiterführt.",
    consequence: "Gerade wenn Besucher an dieser Stelle klicken, ist das Interesse oft schon sehr konkret. Wenn der nächste Schritt dort unterbrochen wird, gehen potenzielle Anfragen schnell verloren.",
    previewLine: "Ich habe eine kurze Skizze erstellt, wie dieser Schritt auf der Seite sauber weitergeführt werden könnte."
  },
  no_homepage_cta: {
    observation: "dass es auf der Homepage aktuell keinen klaren „Nächsten Schritt“ gibt, der den Besucher direkt zur Beratung führt.",
    consequence: "Ohne klare Handlungsaufforderung schauen sich Besucher zwar um, verlassen die Seite aber oft wieder, ohne den Kontakt zu suchen.",
    previewLine: "Ich habe eine kurze Skizze erstellt, wie so ein strategischer CTA bei Ihnen wirken könnte."
  },
  custom: {
    observation: "[notes]",
    consequence: "Gerade an diesem Punkt entscheiden sich viele Besucher, ob sie tiefer in die Planung einsteigen oder die Seite wieder verlassen.",
    previewLine: "Ich habe eine kurze Skizze erstellt, wie man diesen Punkt für Ihre Besucher optimieren könnte."
  },
  custom_issue: {
    observation: "[custom_issue_text]",
    consequence: "Gerade an dieser Stelle haben Besucher oft schon ein konkretes Interesse. Wenn der nächste logische Schritt fehlt oder unklar ist, geht ein Teil dieses Interesses verloren.",
    previewLine: "Ich habe eine kurze Skizze erstellt, wie man diesen Schritt auf der Seite klarer lösen könnte."
  }
};

export const getGreetingForLead = (lead: Lead): string => {
  const { anrede, name } = lead;
  const hasName = name && name.trim().length > 0;
  
  if (!hasName) return "Sehr geehrte Damen und Herren,";

  switch (anrede) {
    case 'Herr': return `Hallo Herr ${name},`;
    case 'Frau': return `Hallo Frau ${name},`;
    case 'Familie': return `Hallo Familie ${name},`;
    default: return hasName ? `Hallo ${name},` : "Sehr geehrte Damen und Herren,";
  }
};

export const getGreetingManual = (step: 'outreach' | 'f1' | 'f3', state: FormState): string => {
  const { anrede_type, contact_name } = state;
  const hasName = contact_name.trim().length > 0;

  if (step === 'outreach') {
    if (anrede_type === 'formal') return "Sehr geehrte Damen und Herren,";
    return hasName ? `Hi ${contact_name},` : "Hallo,";
  }

  if (step === 'f1') {
    if (anrede_type === 'formal') return "Hallo,";
    return hasName ? `Hi ${contact_name},` : "Hallo,";
  }

  if (step === 'f3') {
    return hasName ? `Hallo ${contact_name},` : "Hallo,";
  }

  return "Hallo,";
};

export const substituteVariables = (text: string, data: Lead | FormState): string => {
  let result = text;
  
  if ("website" in data) {
    result = result.replace(/\[website\]/g, data.website);
  }
  
  if ("company" in data) {
    result = result.replace(/\[company\]/g, data.company);
  } else if ("company_name" in data) {
    result = result.replace(/\[company\]/g, data.company_name);
  }
  
  if ("notes" in data) {
    result = result.replace(/\[notes\]/g, data.notes);
  }
  
  if ("custom_issue_text" in data) {
    result = result.replace(/\[custom_issue_text\]/g, data.custom_issue_text);
  }

  return result;
};

import { FormState, IssueType, EmailModule, AnredeType } from '../types';

export const ISSUE_MODULES: Record<IssueType, EmailModule> = {
  missing_pool_calculator: {
    observation: "mir ist aufgefallen, dass es auf der Seite [website] keine Möglichkeit gibt, eine grobe Poolkosten-Schätzung zu bekommen.",
    consequence: "Viele, die beginnen einen Pool zu planen, möchten zuerst ein Gefühl dafür bekommen, in welchem Preisbereich sich das Projekt bewegt. Wenn diese Orientierung fehlt, verschieben viele die Anfrage erst einmal.",
    previewLine: "Wenn Sie möchten, erstelle ich eine kurze Skizze, wie eine einfache Poolkosten-Schätzung auf der Seite aussehen könnte."
  },
  calculator_email_only: {
    observation: "mir ist aufgefallen, dass Ihr Pool-Kalkulator eine Preisorientierung erst im Anschluss per E-Mail bereitstellt.",
    consequence: "Viele Besucher nutzen so einen Kalkulator genau in dem Moment, in dem sie eine direkte Einschätzung erwarten. Wenn sie darauf warten müssen, wird die Anfrage oft verschoben, obwohl das Interesse gerade sehr konkret ist.",
    previewLine: "Ich habe eine kurze Skizze erstellt, wie man diese Orientierung direkt im Kalkulator sichtbar machen könnte."
  },
  external_redirect: {
    observation: "mir ist aufgefallen, dass der „Pool-Rechner“-Button auf [website] aktuell auf mehrere externe Seiten weiterführt.",
    consequence: "Gerade Besucher, die dort klicken, haben meist bereits ein sehr konkretes Interesse und erwarten an dieser Stelle eine erste Preis-Orientierung. Wenn sie stattdessen auf andere Seiten weitergeleitet werden, geht dieser Einstieg oft verloren.",
    previewLine: "Ich habe eine kurze Skizze erstellt, wie dieser Schritt direkt auf Ihrer Website weiterführen könnte."
  },
  missing_contact_option: {
    observation: "mir ist aufgefallen, dass auf [website] keine direkte, sichtbare Kontaktmöglichkeit auf der Startseite vorhanden ist.",
    consequence: "Gerade Besucher mit akutem Interesse möchten oft genau in diesem Moment schnell eine Frage stellen oder den nächsten Schritt machen. Wenn diese Möglichkeit nicht sofort sichtbar ist, geht ein Teil dieser Anfragen verloren.",
    previewLine: "Ich habe eine kurze Skizze erstellt, wie man diesen Einstieg auf der Seite sichtbarer machen könnte."
  },
  broken_link: {
    observation: "mir ist aufgefallen, dass ein wichtiger Link auf [website] aktuell nicht sauber weiterführt.",
    consequence: "Gerade wenn Besucher an dieser Stelle klicken, ist das Interesse oft schon sehr konkret. Wenn der nächste Schritt dort unterbrochen wird, gehen potenzielle Anfragen schnell verloren.",
    previewLine: "Ich habe eine kurze Skizze erstellt, wie dieser Schritt auf der Seite sauber weitergeführt werden könnte."
  },
  custom_issue: {
    observation: "[custom_issue_text]",
    consequence: "Gerade an dieser Stelle haben Besucher oft schon ein konkretes Interesse. Wenn der nächste logische Schritt fehlt oder unklar ist, geht ein Teil dieses Interesses verloren.",
    previewLine: "Ich habe eine kurze Skizze erstellt, wie man diesen Schritt auf der Seite klarer lösen könnte."
  }
};

export const getGreeting = (step: 'outreach' | 'f1' | 'f3', state: FormState): string => {
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

export const substituteVariables = (text: string, state: FormState): string => {
  let result = text;
  result = result.replace(/\[website\]/g, state.website);
  result = result.replace(/\[company_name\]/g, state.company_name);
  result = result.replace(/\[custom_issue_text\]/g, state.custom_issue_text);
  
  // Adapt "Ihnen" to "dir" if informal - requested by user to keep it natural
  // But user also said: "Default to 'Ihnen' unless informal wording is clearly better"
  // Given the conservative/professional requirement, we'll stick to Ihnen for now unless asked otherwise.
  
  return result;
};

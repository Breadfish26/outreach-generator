import { FormState, Lead, IssueType, EmailModule, AnredeType, EmailTemplate, EmailStep, FullTemplates } from '../types';

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

export const substituteVariables = (text: string, data: Partial<Lead & FormState>): string => {
  let result = text;
  
  // Support both [placeholder] and {placeholder}
  const replace = (key: string, value: string) => {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`\\[${escapedKey}\\]`, 'g'), value);
    result = result.replace(new RegExp(`\\{${escapedKey}\\}`, 'g'), value);
  };

  if ("website" in data && data.website) replace("website", data.website);
  
  const company = data.company || data.company_name;
  if (company) replace("company", company);
  
  if ("notes" in data && data.notes) replace("notes", data.notes);
  if ("custom_issue_text" in data && data.custom_issue_text) replace("custom_issue_text", data.custom_issue_text);
  if ("sender_name" in data && data.sender_name) replace("sender_name", data.sender_name);
  if ("name" in data && data.name) replace("name", data.name);
  if ("contact_name" in data && data.contact_name) replace("name", data.contact_name);
  
  // Custom logic for greeting
  if (result.includes("{anrede}")) {
    const greeting = "anrede" in data ? getGreetingForLead(data as Lead) : "Hallo,";
    // If it's a lead, getGreetingForLead already returns "Hallo Herr X"
    // So we replace {anrede} with the whole greeting if it's there
    result = result.replace(/\{anrede\}/g, greeting);
  }

  return result;
};

export const DEFAULT_TEMPLATES: FullTemplates = {
  missing_pool_calculator: {
    outreach: {
      subject: "Kosten-Schätzung auf {website}",
      body: "{anrede}\n\nmir ist aufgefallen, dass es auf der Seite {website} keine Möglichkeit gibt, eine grobe Poolkosten-Schätzung zu bekommen.\n\nViele, die beginnen einen Pool zu planen, möchten zuerst ein Gefühl dafür bekommen, in welchem Preisbereich sich das Projekt bewegt. Wenn diese Orientierung fehlt, verschieben viele die Anfrage erst einmal.\n\nWenn Sie möchten, erstelle ich eine kurze Skizze, wie eine einfache Poolkosten-Schätzung auf der Seite aussehen könnte.\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup1: {
      subject: "Re: Kosten-Schätzung auf {website}",
      body: "{anrede}\n\nich wollte kurz nachfragen, ob meine Nachricht bei Ihnen angekommen ist.\n\nViele Besucher auf einer Pool-Website haben bereits konkretes Interesse. Wenn die Preisorientierung fehlt, gehen diese Anfragen oft verloren.\n\nIch habe eine Skizze erstellt, wie man diese Orientierung direkt auf der Seite einbinden könnte.\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup2: {
      subject: "Kurze Rückfrage zu {company}",
      body: "{anrede}\n\nich wollte mich kurz noch einmal melden.\n\nHaben Sie meine Skizze zur Optimierung von {website} bereits erhalten?\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup3: {
      subject: "Letzter Versuch / {company}",
      body: "{anrede}\n\nich wollte den Faden hier nur kurz schließen.\n\nSoll ich Ihnen das kleine Beispiel für {company} noch schicken?\n\nAnsonsten melde ich mich nicht weiter.\n\nViele Grüße\n{sender_name}"
    }
  },
  missing_contact_option: {
    outreach: {
      subject: "Kontakt-Optimierung auf {website}",
      body: "{anrede}\n\nmir ist aufgefallen, dass auf {website} keine direkte, sichtbare Kontaktmöglichkeit auf der Startseite vorhanden ist.\n\nGerade Besucher mit akutem Interesse möchten oft genau in diesem Moment schnell eine Frage stellen. Wenn diese Möglichkeit nicht sofort sichtbar ist, geht ein Teil dieser Anfragen verloren.\n\nIch habe eine Skizze erstellt, wie man diesen Einstieg sichtbarer machen könnte.\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup1: {
      subject: "Re: Kontakt-Optimierung auf {website}",
      body: "{anrede}\n\nich wollte kurz nachfragen, ob meine Nachricht bei Ihnen angekommen ist.\n\nIch habe eine kurze Skizze erstellt, wie man den Kontakt-Einstieg auf der Seite sichtbarer machen könnte.\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup2: {
      subject: "Kurze Rückfrage zu {company}",
      body: "{anrede}\n\nich wollte mich kurz noch einmal melden.\n\nHaben Sie meine Skizze zur Optimierung von {website} bereits erhalten?\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup3: {
      subject: "Letzter Versuch / {company}",
      body: "{anrede}\n\nich wollte den Faden hier nur kurz schließen.\n\nSoll ich Ihnen das kleine Beispiel für {company} noch schicken?\n\nViele Grüße\n{sender_name}"
    }
  },
  broken_link: {
    outreach: {
      subject: "Hinweis zu einem Link auf {website}",
      body: "{anrede}\n\nmir ist aufgefallen, dass ein wichtiger Link auf {website} aktuell nicht sauber weiterführt.\n\nGerade wenn Besucher an dieser Stelle klicken, ist das Interesse oft schon sehr konkret. Wenn der nächste Schritt dort unterbrochen wird, gehen potenzielle Anfragen verloren.\n\nIch habe eine Skizze erstellt, wie dieser Schritt sauber weitergeführt werden könnte.\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup1: {
      subject: "Re: Hinweis zu einem Link auf {website}",
      body: "{anrede}\n\nich wollte kurz nachfragen, ob meine Nachricht bei Ihnen angekommen ist.\n\nIch habe eine kurze Skizze erstellt, wie dieser Schritt auf der Seite sauber weitergeführt werden könnte.\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup2: {
      subject: "Kurze Rückfrage zu {company}",
      body: "{anrede}\n\nich wollte mich kurz noch einmal melden.\n\nHaben Sie meine Skizze für {website} bereits erhalten?\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup3: {
      subject: "Letzter Versuch / {company}",
      body: "{anrede}\n\nich wollte den Faden hier nur kurz schließen.\n\nSoll ich Ihnen das kleine Beispiel für {company} noch schicken?\n\nViele Grüße\n{sender_name}"
    }
  },
  no_homepage_cta: {
    outreach: {
      subject: "Beratungs-Einstieg auf {website}",
      body: "{anrede}\n\nmir ist aufgefallen, dass es auf der Homepage aktuell keinen klaren „Nächsten Schritt“ gibt, der den Besucher direkt zur Beratung führt.\n\nOhne klare Handlungsaufforderung schauen sich Besucher zwar um, verlassen die Seite aber oft wieder, ohne den Kontakt zu suchen.\n\nIch habe eine Skizze erstellt, wie so ein strategischer CTA bei Ihnen wirken könnte.\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup1: {
      subject: "Re: Beratungs-Einstieg auf {website}",
      body: "{anrede}\n\nich wollte kurz nachfragen, ob meine Nachricht bei Ihnen angekommen ist.\n\nIch habe eine Skizze erstellt, wie so ein strategischer CTA bei Ihnen wirken könnte.\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup2: {
      subject: "Kurze Rückfrage zu {company}",
      body: "{anrede}\n\nich wollte mich kurz noch einmal melden.\n\nHaben Sie meine Skizze für {website} bereits erhalten?\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup3: {
      subject: "Letzter Versuch / {company}",
      body: "{anrede}\n\nich wollte den Faden hier nur kurz schließen.\n\nSoll ich Ihnen das kleine Beispiel für {company} noch schicken?\n\nViele Grüße\n{sender_name}"
    }
  },
  custom: {
    outreach: {
      subject: "Frage zu {website}",
      body: "{anrede}\n\nmir ist aufgefallen, dass {notes}.\n\nGerade an diesem Punkt entscheiden sich viele Besucher, ob sie tiefer in die Planung einsteigen oder die Seite wieder verlassen.\n\nIch habe eine kurze Skizze erstellt, wie man diesen Punkt für Ihre Besucher optimieren könnte.\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup1: {
      subject: "Re: Frage zu {website}",
      body: "{anrede}\n\nich wollte kurz nachfragen, ob meine Nachricht bei Ihnen angekommen ist.\n\nIch habe eine kurze Skizze erstellt, wie man diesen Punkt für Ihre Besucher optimieren könnte.\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup2: {
      subject: "Kurze Rückfrage zu {company}",
      body: "{anrede}\n\nich wollte mich kurz noch einmal melden.\n\nHaben Sie meine Skizze für {website} bereits erhalten?\n\nSoll ich Ihnen das kurz schicken?\n\nViele Grüße\n{sender_name}"
    },
    followup3: {
      subject: "Letzter Versuch / {company}",
      body: "{anrede}\n\nich wollte den Faden hier nur kurz schließen.\n\nSoll ich Ihnen das kleine Beispiel für {company} noch schicken?\n\nViele Grüße\n{sender_name}"
    }
  }
};

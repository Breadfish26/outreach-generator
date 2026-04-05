import { AiPromptParams, EmailTemplate, EmailStep } from '../types';

const API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function generateFullSequenceAi(params: AiPromptParams, apiKey: string): Promise<Record<EmailStep, EmailTemplate>> {
  const { painPoint, company, website, niche = "B2B / Handwerk", notes } = params;

  const prompt = `
Du bist ein erstklassiger Copywriter für B2B-Kaltakquise im deutschsprachigen Raum. Dein Stil ist professionell, minimalistisch, ehrlich und niemals aufdringlich (Low-Pressure). 

AUFGABE:
Erzeuge eine vollständige 4-teilige E-Mail-Sequenz basierend auf einem spezifischen Pain Point.

STRUKTUR-VORGABE (Beispiel "Fehlender Kalkulator" - DAS IST DEIN BLUEPRINT):
1. Outreach: Erwähne eine konkrete Beobachtung ("Mir ist aufgefallen..."), erkläre kurz das resultierende Problem ("Consequence") und biete als Lösung eine "Skizze/Vorschau" an. Ende IMMER mit der Frage: "Soll ich Ihnen das kurz schicken?"
2. Follow-up 1 (nach 3 Tagen): Kurz nachfragen, Wert der Skizze verdeutlichen.
3. Follow-up 2 (nach 5 Tagen): Erneut auf die Skizze hinweisen, zeigen dass du den Ball nur kurz hochhalten willst.
4. Follow-up 3 (Letzter Versuch): Den Faden freundlich schließen ("Wenn ich nichts höre, melde ich mich nicht weiter").

HEUTIGER FALL:
- Nische: ${niche}
- Unternehmen: ${company}
- Website: ${website}
- SPEZIFISCHER PAIN POINT: ${painPoint}
${notes ? `- Zusatz-Infos: ${notes}` : ""}

REGELN:
- Sprache: Deutsch
- Platzhalter nutzen: {anrede}, {company}, {website}, {sender_name}.
- Du nutzt KEIN generisches Marketing-Blabla ("Marktführer", "Umsatz steigern", "KI-Revolution").
- Sei maximal konkret auf den Pain Point bezogen.
- Outreach-Mail: Max 3-4 kurze Absätze.
- Follow-ups: Max 2 kurze Absätze.
- Absender ist immer {sender_name}.

ANTWORTE NUR ALS REINES JSON OBJEKT MIT DIESER STRUKTUR:
{
  "outreach": { "subject": "Betreff", "body": "Text" },
  "followup1": { "subject": "Betreff", "body": "Text" },
  "followup2": { "subject": "Betreff", "body": "Text" },
  "followup3": { "subject": "Betreff", "body": "Text" }
}
`;

  try {
    const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "API Request failed");
    }

    const data = await response.json();
    let content = data.candidates[0].content.parts[0].text;
    
    // Clean JSON if the AI wrapped it in code blocks
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(content);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}

export async function generateAiEmail(params: AiPromptParams, apiKey: string): Promise<EmailTemplate> {
  const { painPoint, company, website, niche = "Poolbau / Handwerk", step, notes } = params;

  const prompt = `
Du bist ein Experte für Cold Outreach und Copywriting im deutschen B2B-Bereich (Nische: ${niche}). 
Dein Schreibstil ist professionell, minimalistisch, ehrlich und niemals aufdringlich (Low-Pressure). 

DATEN:
- Unternehmen: ${company}
- Website: ${website}
- Problem/Beobachtung: ${painPoint}
${notes ? `- Notizen: ${notes}` : ""}
- E-Mail Schritt: ${getStepName(step || 'outreach')}

STRUKTUR-VORGABEN:
1. Outreach-Mail: Erwähne kurz die Beobachtung (Einstieg: "Mir ist aufgefallen..."), erkläre kurz die negative Konsequenz für das Business und biete als Lösung eine kostenlose "Skizze/Vorschau" an. Die Mail endet IMMER mit der Frage: "Soll ich Ihnen das kurz schicken?"
2. Follow-ups: Beziehe dich auf die vorherige Idee (die "Skizze"). 

ANTWORTE NUR IM FOLGENDEN JSON FORMAT:
{
  "subject": "Der Betreff",
  "body": "Der E-Mail Body mit Platzhaltern"
}
`;

  try {
    const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API Request failed");
    }

    const data = await response.json();
    let content = data.candidates[0].content.parts[0].text;

    // Clean JSON if the AI wrapped it in code blocks
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(content) as EmailTemplate;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}

function getStepName(step: EmailStep): string {
  switch (step) {
    case 'outreach': return "Erst-Anschreiben (Outreach)";
    case 'followup1': return "1. Follow-up";
    case 'followup2': return "2. Follow-up";
    case 'followup3': return "3. Follow-up (letzter Versuch)";
  }
}

import { AiPromptParams, EmailTemplate, EmailStep } from '../types';

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

async function fetchWithFallback(prompt: string, apiKey: string): Promise<any> {
  let lastError: Error | null = null;

  for (const model of MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    try {
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || "API Request failed";
        throw new Error(`[${model}] ${errorMessage}`);
      }

      const data = await response.json();
      let content = data.candidates[0].content.parts[0].text;
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(content);
    } catch (error: any) {
      console.warn(`Failed with ${model}: ${error.message}`);
      lastError = error;
      // Continue to the next model in the fallback array
      continue;
    }
  }

  throw new Error(`All models failed due to high demand or API limits. Last error: ${lastError?.message}`);
}

export async function generateFullSequenceAi(params: AiPromptParams, apiKey: string): Promise<Record<EmailStep, EmailTemplate>> {
  const { painPoint, company, website, notes } = params;

  const prompt = `
Du bist ein erstklassiger Copywriter für B2B-Kaltakquise. Dein Stil ist professionell, minimalistisch, ehrlich und niemals aufdringlich (Low-Pressure).

AUFGABE:
Erzeuge eine vollständige 4-teilige E-Mail-Sequenz. Du MUSST dich exakt an den folgenden Aufbau halten:

ALLGEMEINE REGELN:
- Betreff für Outreach: "Kurze Homepage-Idee für ${company}?"
- Betreff für Follow-ups: "Kurze Rückfrage / ${company}"
- Keine formalen Anreden wie "Sehr geehrte...". Nutze nur "Hallo {name}," (wenn Name bekannt) oder "Hallo," (wenn Name leer).
- Keine "Haben Sie meine Mail bekommen?" Sätze.
- Keine "MfG" oder "Mit freundlichen Grüßen". Nutze nur "Viele Grüße {sender_name}".
- Nutze Platzhalter: {name}, {company}, {website}, {sender_name}.

SEQUENZ-STRUKTUR (STRENG FOLGEN):
1. Outreach: 
   - Einstieg: "mir ist aufgefallen, dass auf der Seite {website} [PAIN POINT]."
   - Consequence: Erkläre kurz (1-2 Sätze), warum das ein Problem ist (Verlust von Anfragen/Interesse).
   - Skizze: "Wenn Sie möchten, erstelle ich eine kurze Skizze, wie eine Lösung auf der Seite aussehen könnte."
   - Abschluss: "Soll ich Ihnen das kurz schicken?"
   
2. Follow-up 1 (nach 3 Tagen):
   - "viele Besucher auf einer {company}-Website haben bereits konkretes Interesse. [PROBLEM ERKLÄREN]."
   - "Wenn diese Orientierung in dem Moment fehlt, geht ein Teil dieses Interesses verloren."
   - "Ich habe eine kurze Vorschau erstellt, die zeigt, wie man diesen Einstieg erleichtern kann."
   - "Soll ich sie Ihnen kurz schicken?"

3. Follow-up 2 (nach 5 Tagen):
   - "Ich lasse es bei dieser letzten kurzen Nachfrage, da ich weiß, wie voll der Alltag ist."
   - "Die Skizze zeigt, wie man potenziellen Kunden schneller eine Orientierung geben kann, ohne dass sie die Anfrage aufschieben."
   - "Dauert etwa eine Minute zum Anschauen. Soll ich sie Ihnen kurz schicken?"

4. Follow-up 3 (Abschluss):
   - "Hallo, ich wollte den Faden hier nur kurz schließen."
   - "Soll ich Ihnen das kleine Beispiel für {company} noch schicken?"
   - "Viele Grüße {sender_name}"

HEUTIGER FALL:
- Unternehmen: ${company}
- Website: ${website}
- SPEZIFISCHER PAIN POINT (SETZE DIESEN OBEN EIN): ${painPoint}
${notes ? `- Zusatz-Infos: ${notes}` : ""}

ANTWORTE NUR ALS REINES JSON OBJEKT MIT DIESER STRUKTUR:
{
  "outreach": { "subject": "Betreff", "body": "Text" },
  "followup1": { "subject": "Betreff", "body": "Text" },
  "followup2": { "subject": "Betreff", "body": "Text" },
  "followup3": { "subject": "Betreff", "body": "Text" }
}
`;

  try {
    return (await fetchWithFallback(prompt, apiKey)) as Record<EmailStep, EmailTemplate>;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}

export async function generateAiEmail(params: AiPromptParams, apiKey: string): Promise<EmailTemplate> {
  const { painPoint, company, website, step, notes } = params;

  const prompt = `
Du bist ein Experte für Cold Outreach. Dein Stil ist minimalistisch.
Erzeuge eine E-Mail für den Schritt: ${getStepName(step || 'outreach')}.

REGELN:
- Betreff: "Kurze Homepage-Idee für ${company}?"
- Anrede: "Hallo {name}," oder "Hallo,".
- Abschluss: "Viele Grüße {sender_name}".
- Folge exakt der Struktur: Beobachtung [PAIN POINT] -> Konsequenz -> Angebot einer Skizze -> Abschluss-Frage "Soll ich Ihnen das kurz schicken?".

DATEN:
- Unternehmen: ${company}
- Website: ${website}
- Problem/Beobachtung: ${painPoint}
${notes ? `- Notizen: ${notes}` : ""}

ANTWORTE NUR IM FOLGENDEN JSON FORMAT:
{
  "subject": "Der Betreff",
  "body": "Der E-Mail Body mit Platzhaltern"
}
`;

  try {
    return (await fetchWithFallback(prompt, apiKey)) as EmailTemplate;
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

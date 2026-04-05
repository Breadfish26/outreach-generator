import { EmailSequence, FormState } from '../types';

export const exportAsTxt = (sequence: EmailSequence) => {
  const content = [
    "--- OUTREACH EMAIL SEQUENCE ---",
    "",
    "A) OUTREACH",
    "----------------",
    sequence.outreach,
    "",
    "B) FOLLOW-UP 1",
    "----------------",
    sequence.followup1,
    "",
    "C) FOLLOW-UP 2",
    "----------------",
    sequence.followup2,
    "",
    "D) FOLLOW-UP 3",
    "----------------",
    sequence.followup3
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Outreach_Sequence_${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportAsJson = (state: FormState, sequence: EmailSequence) => {
  const content = JSON.stringify({ state, sequence }, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Outreach_Data_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

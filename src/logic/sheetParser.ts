import { Lead, NextAction, IssueType } from '../types';

export const fetchSheetData = async (url: string): Promise<Lead[]> => {
  const response = await fetch(url);
  const csvText = await response.text();
  return parseCSV(csvText);
};

export const parseCSV = (csv: string): Lead[] => {
  const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return [];

  // Detect delimiter (comma or semicolon)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

  // We skip the header line
  return lines.slice(1).map(line => {
    // Better split that handles quotes and delimiters
    const regex = new RegExp(`("${delimiter}"|[^${delimiter}])+`, 'g');
    const cols = (line.match(regex) || []).map(c => c.trim().replace(/^"|"$/g, ''));
    
    // Fallback if regex is too complex
    const simpleCols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
    const finalCols = cols.length >= simpleCols.length ? cols : simpleCols;

    return {
      anrede: (finalCols[0] || '') as any,
      name: finalCols[1] || '',
      company: finalCols[2] || '',
      website: finalCols[3] || '',
      email: finalCols[4] || '',
      painPoint: mapPainPoint(finalCols[5] || ''),
      lastSent: finalCols[6] || '',
      outreachSent: finalCols[7] || '',
      f1Sent: finalCols[8] || '',
      f2Sent: finalCols[9] || '',
      f3Sent: finalCols[10] || '',
      response: (finalCols[11] || 'NO') as any,
      responseDate: finalCols[12] || '',
      status: (finalCols[13] || 'Open') as any,
      nextAction: (finalCols[14] || 'Send Outreach') as NextAction,
      notes: finalCols[15] || ''
    };
  });
};

const mapPainPoint = (val: string): IssueType => {
  const v = val.toLowerCase();
  if (v.includes('rechner') || v.includes('kalkulator')) return 'missing_pool_calculator';
  if (v.includes('kontakt')) return 'missing_contact_option';
  if (v.includes('link')) return 'broken_link';
  if (v.includes('homepage') || v.includes('cta')) return 'no_homepage_cta';
  return 'custom';
};

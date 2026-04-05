import { Lead, NextAction, IssueType } from '../types';

export const fetchSheetData = async (url: string): Promise<Lead[]> => {
  const response = await fetch(url);
  const csvText = await response.text();
  return parseCSV(csvText);
};

export const parseCSV = (csv: string): Lead[] => {
  const lines = csv.split(/\r?\n/);
  // Header: Anrede,Name,Company,Website,Email,Pain Point,Last Sent,Outreach #1 Sent,Follow-up #1 (Day 3),Follow-up #2 (Day 5),Follow-up #3 (Day 7),Response?,Response Date,Status,Next Action,Notes
  // We skip the header line
  return lines.slice(1).filter(line => line.trim().length > 0).map(line => {
    // Basic CSV split (handles quotes if needed, but simple split for now)
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    
    return {
      anrede: cols[0] as any,
      name: cols[1],
      company: cols[2],
      website: cols[3],
      email: cols[4],
      painPoint: mapPainPoint(cols[5]),
      lastSent: cols[6],
      outreachSent: cols[7],
      f1Sent: cols[8],
      f2Sent: cols[9],
      f3Sent: cols[10],
      response: cols[11] as any,
      responseDate: cols[12],
      status: cols[13] as any,
      nextAction: (cols[14] || 'Closed') as NextAction,
      notes: cols[15] || ''
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

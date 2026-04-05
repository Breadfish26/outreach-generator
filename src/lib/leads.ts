import { supabase } from './supabase';
import { Lead } from '../types';

export const leadService = {
  async getAllLeads(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return [];
    }

    return (data || []).map(this.mapDbToLead);
  },

  async upsertLeads(leads: Lead[]): Promise<void> {
    const dbLeads = leads.map(this.mapLeadToDb);
    
    // We use company_name + email as a unique constraint if we had one, 
    // but for now we just insert or update by ID if present
    const { error } = await supabase
      .from('leads')
      .upsert(dbLeads, { onConflict: 'company_name, email' });

    if (error) {
      console.error('Error upserting leads:', error);
      throw error;
    }
  },

  async saveSequence(leadId: string, emails: any): Promise<void> {
    const { error } = await supabase
      .from('outreach_sequences')
      .insert({
        lead_id: leadId,
        emails: emails
      });

    if (error) {
      console.error('Error saving sequence:', error);
      throw error;
    }

    // Also update lead status
    await supabase
      .from('leads')
      .update({ status: 'generated' })
      .eq('id', leadId);
  },

  async getSequenceForLead(leadId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('outreach_sequences')
      .select('*')
      .eq('lead_id', leadId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching sequence:', error);
    }

    return data ? data.emails : null;
  },

  mapLeadToDb(lead: Lead) {
    return {
      id: lead.id,
      company_name: lead.company,
      contact_person: lead.name,
      email: lead.email,
      website: lead.website,
      status: lead.status === 'Open' ? 'new' : 'ignored',
      metadata: {
        anrede: lead.anrede,
        painPoint: lead.painPoint,
        notes: lead.notes,
        lastSent: lead.lastSent,
        nextAction: lead.nextAction
      }
    };
  },

  mapDbToLead(dbLead: any): Lead {
    return {
      id: dbLead.id,
      company: dbLead.company_name,
      name: dbLead.contact_person,
      email: dbLead.email,
      website: dbLead.website,
      anrede: dbLead.metadata?.anrede || '',
      painPoint: dbLead.metadata?.painPoint || 'custom',
      lastSent: dbLead.metadata?.lastSent || '',
      outreachSent: dbLead.metadata?.outreachSent || '',
      f1Sent: dbLead.metadata?.f1Sent || '',
      f2Sent: dbLead.metadata?.f2Sent || '',
      f3Sent: dbLead.metadata?.f3Sent || '',
      response: dbLead.metadata?.response || 'NO',
      responseDate: dbLead.metadata?.responseDate || '',
      status: dbLead.status === 'ignored' ? 'Closed' : 'Open',
      nextAction: dbLead.metadata?.nextAction || 'Send Outreach',
      notes: dbLead.metadata?.notes || ''
    };
  }
};

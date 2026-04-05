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
    // Filter out rows that are missing critical data like Company Name
    const validLeads = leads.filter(l => l.company && l.company.trim() !== '');
    
    if (validLeads.length === 0) return;

    const dbLeads = validLeads.map(this.mapLeadToDb);
    
    const { error } = await supabase
      .from('leads')
      .upsert(dbLeads, { onConflict: 'company_name, email' });

    if (error) {
      console.error('SUPABASE ERROR in upsertLeads:', error.message, error.details, error.hint);
      throw error;
    }
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<void> {
    // 1. Get current lead to preserve existing metadata
    const { data: currentLead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const dbUpdates: any = {};
    if (updates.company !== undefined) dbUpdates.company_name = updates.company;
    if (updates.name !== undefined) dbUpdates.contact_person = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.website !== undefined) dbUpdates.website = updates.website;
    
    if (updates.status !== undefined) {
      dbUpdates.status = updates.status === 'Open' ? 'new' : 
                         updates.status === 'Closed' ? 'ignored' : 'generated';
    }

    // Merge metadata
    const existingMetadata = currentLead.metadata || {};
    dbUpdates.metadata = {
      ...existingMetadata,
      ...(updates.anrede !== undefined ? { anrede: updates.anrede } : {}),
      ...(updates.painPoint !== undefined ? { painPoint: updates.painPoint } : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
      ...(updates.lastSent !== undefined ? { lastSent: updates.lastSent } : {}),
      ...(updates.nextAction !== undefined ? { nextAction: updates.nextAction } : {}),
      ...(updates.outreachSent !== undefined ? { outreachSent: updates.outreachSent } : {}),
      ...(updates.f1Sent !== undefined ? { f1Sent: updates.f1Sent } : {}),
      ...(updates.f2Sent !== undefined ? { f2Sent: updates.f2Sent } : {}),
      ...(updates.f3Sent !== undefined ? { f3Sent: updates.f3Sent } : {}),
      ...(updates.response !== undefined ? { response: updates.response } : {}),
      ...(updates.responseDate !== undefined ? { responseDate: updates.responseDate } : {})
    };

    const { error } = await supabase
      .from('leads')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating lead:', error);
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

  async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  },

  mapLeadToDb(lead: Lead) {
    const dbLead: any = {
      company_name: lead.company,
      contact_person: lead.name || '',
      email: lead.email || null,
      website: lead.website || '',
      status: lead.status === 'Open' ? 'new' : 'ignored',
      metadata: {
        anrede: lead.anrede,
        painPoint: lead.painPoint,
        notes: lead.notes || '',
        lastSent: lead.lastSent || '',
        nextAction: lead.nextAction || 'Send Outreach'
      }
    };

    // Only include ID if it exists (for updates)
    // If it doesn't exist, Supabase will generate a gen_random_uuid()
    if (lead.id) {
      dbLead.id = lead.id;
    }

    return dbLead;
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

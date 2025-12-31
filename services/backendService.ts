/**
 * CLAD Backend Service - Payments & Support
 */

import { SubscriptionTier, TIER_DETAILS } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export const backendService = {
  async createCheckoutSession(tier: SubscriptionTier): Promise<{ url: string }> {
    if (!isSupabaseConfigured()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          alert(`Demo: Would subscribe to ${TIER_DETAILS[tier].name} at ${TIER_DETAILS[tier].price}`);
          resolve({ url: window.location.origin + '/?checkout=success' });
        }, 1000);
      });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { tier, userId: user.id, userEmail: user.email, successUrl: `${window.location.origin}/?checkout=success`, cancelUrl: `${window.location.origin}/` }
    });
    if (error) throw new Error(`Checkout failed: ${error.message}`);
    return { url: data.url };
  },

  async purchaseCreditPack(): Promise<{ url: string }> {
    if (!isSupabaseConfigured()) {
      return new Promise((resolve) => {
        setTimeout(() => {
          alert('Demo: Would purchase 20 credits for $20');
          resolve({ url: window.location.origin + '/?credits=purchased' });
        }, 1000);
      });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { mode: 'payment', userId: user.id, userEmail: user.email, successUrl: `${window.location.origin}/?credits=purchased`, cancelUrl: `${window.location.origin}/` }
    });
    if (error) throw new Error(`Purchase failed: ${error.message}`);
    return { url: data.url };
  },

  async submitSupportTicket(ticket: { type: 'bug' | 'feature' | 'billing' | 'other'; subject: string; description: string; projectId?: string }): Promise<{ ticketId: string }> {
    if (!isSupabaseConfigured()) {
      console.log('[Support] Demo ticket:', ticket);
      alert('Support ticket submitted (Demo Mode)');
      return { ticketId: `DEMO-${Date.now()}` };
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('support_tickets').insert({
      user_id: user?.id, user_email: user?.email, type: ticket.type, subject: ticket.subject, description: ticket.description, project_id: ticket.projectId, status: 'open', created_at: new Date().toISOString()
    }).select('id').single();
    if (error) throw new Error(`Ticket failed: ${error.message}`);
    return { ticketId: data.id };
  },

  async trackEvent(event: string, properties?: Record<string, any>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('analytics_events').insert({ user_id: user?.id, event_name: event, properties, created_at: new Date().toISOString() }).catch(() => {});
  }
};

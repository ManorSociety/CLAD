import { supabase, isSupabaseConfigured } from './supabaseClient';

export const creditsService = {
  async getCredits(userId: string): Promise<{ used: number; limit: number } | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('credits_used, credits_limit')
      .eq('id', userId)
      .single();
    
    if (error || !data) return null;
    
    return {
      used: data.credits_used ?? 0,
      limit: data.credits_limit ?? 0
    };
  },

  async useCredits(userId: string, amount: number = 1): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    
    const current = await this.getCredits(userId);
    if (!current) return false;
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        credits_used: current.used + amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    return !error;
  },

  async syncCredits(userId: string): Promise<{ used: number; limit: number } | null> {
    return this.getCredits(userId);
  }
};

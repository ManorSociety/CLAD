import { supabase, isSupabaseConfigured } from './supabaseClient';

export const creditsService = {
  async getCredits(userId: string): Promise<{ used: number; limit: number } | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('credits_used, credits_limit')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('[creditsService] getCredits error:', error);
      return null;
    }
    
    return {
      used: data.credits_used ?? 0,
      limit: data.credits_limit ?? 0
    };
  },

  async useCredits(userId: string, amount: number = 1): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.log('[creditsService] Supabase not configured');
      return false;
    }
    
    console.log('[creditsService] useCredits called for user:', userId, 'amount:', amount);
    
    const current = await this.getCredits(userId);
    if (!current) {
      console.error('[creditsService] Could not get current credits');
      return false;
    }
    
    console.log('[creditsService] Current credits:', current, 'New credits_used:', current.used + amount);
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        credits_used: current.used + amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      console.error('[creditsService] Update failed:', error);
      return false;
    }
    
    console.log('[creditsService] Credits updated successfully');
    return true;
  },

  async syncCredits(userId: string): Promise<{ used: number; limit: number } | null> {
    return this.getCredits(userId);
  }
};

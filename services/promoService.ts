import { supabase } from './supabaseClient';

export const promoService = {
  async validateCode(code: string): Promise<{ valid: boolean; tier?: string; days?: number; error?: string }> {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) {
      return { valid: false, error: 'Invalid promo code' };
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'This code has expired' };
    }

    if (data.times_used >= data.max_uses) {
      return { valid: false, error: 'This code has reached its limit' };
    }

    return { valid: true, tier: data.tier, days: data.duration_days };
  },

  async redeemCode(code: string, userId: string): Promise<{ success: boolean; tier?: string; error?: string }> {
    const validation = await this.validateCode(code);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Get the promo code
    const { data: promoData } = await supabase
      .from('promo_codes')
      .select('id, tier, duration_days')
      .eq('code', code.toUpperCase())
      .single();

    if (!promoData) {
      return { success: false, error: 'Code not found' };
    }

    // Record the redemption
    await supabase.from('promo_redemptions').insert({
      user_id: userId,
      promo_code_id: promoData.id
    });

    // Increment times_used
    await supabase.rpc('increment_promo_usage', { code_text: code.toUpperCase() });

    // Update user's profile with new tier
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + promoData.duration_days);

    await supabase
      .from('profiles')
      .update({
        tier: promoData.tier,
        promo_expires_at: expiryDate.toISOString()
      })
      .eq('id', userId);

    return { success: true, tier: promoData.tier };
  }
};

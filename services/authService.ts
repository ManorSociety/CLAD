import { supabase } from './supabaseClient';
import { User, SubscriptionTier, TIER_DETAILS } from '../types';

export const authService = {
  async register(email: string, password: string, name?: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || email.split('@')[0] }
      }
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('Registration failed');
    
    return {
      id: data.user.id,
      email: data.user.email!,
      name: name || email.split('@')[0],
      tier: SubscriptionTier.GUEST
    };
  },

  async login(email: string, password: string): Promise<User & { creditsUsed: number; creditsLimit: number }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('Login failed');
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    const tier = (profile?.tier as SubscriptionTier) || SubscriptionTier.GUEST;
    
    return {
      id: data.user.id,
      email: data.user.email!,
      name: profile?.name || email.split('@')[0],
      studioName: profile?.studio_name,
      tier,
      creditsUsed: profile?.credits_used ?? 0,
      creditsLimit: profile?.credits_limit ?? TIER_DETAILS[tier].renders
    };
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getCurrentUser(): Promise<(User & { creditsUsed: number; creditsLimit: number }) | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    const tier = (profile?.tier as SubscriptionTier) || SubscriptionTier.GUEST;
    
    return {
      id: user.id,
      email: user.email!,
      name: profile?.name || user.email!.split('@')[0],
      studioName: profile?.studio_name,
      tier,
      creditsUsed: profile?.credits_used ?? 0,
      creditsLimit: profile?.credits_limit ?? TIER_DETAILS[tier].renders
    };
  },

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  },

  async updateProfile(updates: { name?: string; studioName?: string }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');
    
    const { error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        studio_name: updates.studioName,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (error) throw error;
  }
};

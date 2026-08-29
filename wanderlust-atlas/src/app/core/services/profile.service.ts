import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/types';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private supabase = inject(SupabaseService);

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return !error && data ? (data as Profile) : null;
  }

  async getProfileByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    return !error && data ? (data as Profile) : null;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    return { error };
  }

  async uploadAvatar(userId: string, file: File): Promise<{ url: string | null; error: any }> {
    const ext = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${ext}`;

    // Delete old avatar first
    await this.supabase.client.storage.from('avatars').remove([fileName]);

    const { data, error } = await this.supabase.client.storage
      .from('avatars')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) return { url: null, error };

    const { data: { publicUrl } } = this.supabase.client.storage
      .from('avatars')
      .getPublicUrl(data.path);

    // Update profile with new avatar URL
    await this.updateProfile(userId, { avatar_url: publicUrl });

    return { url: publicUrl, error: null };
  }

  async followUser(followerId: string, followingId: string): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('user_follows')
      .insert({ follower_id: followerId, following_id: followingId });
    return { error };
  }

  async unfollowUser(followerId: string, followingId: string): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    return { error };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data } = await this.supabase.client
      .from('user_follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();
    return !!data;
  }

  async getFollowerCount(userId: string): Promise<number> {
    const { count } = await this.supabase.client
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);
    return count ?? 0;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const { count } = await this.supabase.client
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);
    return count ?? 0;
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { UserActivity } from '../models/types';

@Injectable({ providedIn: 'root' })
export class UserActivitiesService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  private _activities = signal<UserActivity[]>([]);
  readonly activities = this._activities.asReadonly();
  private _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  async loadActivities(): Promise<UserActivity[]> {
    const user = this.auth.currentUser();
    if (!user) {
      this._activities.set([]);
      return [];
    }

    this._loading.set(true);
    const { data, error } = await this.supabase.client
      .from('user_activities')
      .select('*, destination:destinations!left(*)')
      .order('created_at', { ascending: false });

    this._loading.set(false);
    if (!error && data) {
      this._activities.set(data as UserActivity[]);
      return data as UserActivity[];
    }
    return [];
  }

  async getActivitiesByDestination(destinationId: string): Promise<UserActivity[]> {
    const user = this.auth.currentUser();
    if (!user) return [];

    const { data, error } = await this.supabase.client
      .from('user_activities')
      .select('*')
      .eq('destination_id', destinationId)
      .order('created_at', { ascending: false });

    return !error && data ? (data as UserActivity[]) : [];
  }

  async addActivity(payload: Partial<UserActivity>): Promise<{ data: UserActivity | null; error: any }> {
    const user = this.auth.currentUser();
    if (!user) return { data: null, error: 'User not logged in' };

    const { data, error } = await this.supabase.client
      .from('user_activities')
      .insert({ ...payload, user_id: user.id })
      .select('*, destination:destinations!left(*)')
      .single();

    if (!error && data) {
      this._activities.update(list => [data as UserActivity, ...list]);
    }
    return { data: data as UserActivity | null, error };
  }

  async toggleActivityCompleted(id: string, isCompleted: boolean): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('user_activities')
      .update({ is_completed: isCompleted })
      .eq('id', id);

    if (!error) {
      this._activities.update(list =>
        list.map(a => (a.id === id ? { ...a, is_completed: isCompleted } : a))
      );
      return true;
    }
    return false;
  }

  async deleteActivity(id: string): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('user_activities')
      .delete()
      .eq('id', id);

    if (!error) {
      this._activities.update(list => list.filter(a => a.id !== id));
      return true;
    }
    return false;
  }
}

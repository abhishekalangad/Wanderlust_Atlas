import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { BucketListItem, BucketListStatus } from '../models/types';

@Injectable({ providedIn: 'root' })
export class BucketListService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  private _items = signal<BucketListItem[]>([]);
  readonly items = this._items.asReadonly();

  readonly dreamingItems = computed(() =>
    this._items().filter(i => i.status === 'dreaming')
  );
  readonly planningItems = computed(() =>
    this._items().filter(i => i.status === 'planning')
  );
  readonly bookedItems = computed(() =>
    this._items().filter(i => i.status === 'booked')
  );
  readonly completedItems = computed(() =>
    this._items().filter(i => i.status === 'completed')
  );

  readonly stats = computed(() => {
    const items = this._items();
    const countries = new Set(
      items
        .filter(i => i.destination)
        .map(i => i.destination!.country)
    );
    return {
      total: items.length,
      countries: countries.size,
      completed: items.filter(i => i.status === 'completed').length,
      dreaming: items.filter(i => i.status === 'dreaming').length,
    };
  });

  isInList(destinationId: string): boolean {
    return this._items().some(i => i.destination_id === destinationId);
  }

  getItemByDestination(destinationId: string): BucketListItem | undefined {
    return this._items().find(i => i.destination_id === destinationId);
  }

  async loadUserBucketList(userId: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('bucket_list_items')
      .select(`
        *,
        destination:destinations(*)
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (!error && data) {
      this._items.set(data as BucketListItem[]);
    }
  }

  async addToList(
    destinationId: string,
    status: BucketListStatus = 'dreaming',
    details?: Partial<BucketListItem>
  ): Promise<{ data: BucketListItem | null; error: any }> {
    const user = this.auth.currentUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const payload = {
      user_id: user.id,
      destination_id: destinationId,
      status,
      ...details,
    };

    const { data, error } = await this.supabase.client
      .from('bucket_list_items')
      .insert(payload)
      .select(`*, destination:destinations(*)`)
      .single();

    if (!error && data) {
      this._items.update(items => [data as BucketListItem, ...items]);
    }

    return { data: data as BucketListItem | null, error };
  }

  async updateDetailedItem(itemId: string, details: Partial<BucketListItem>): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('bucket_list_items')
      .update(details)
      .eq('id', itemId);

    if (!error) {
      this._items.update(items =>
        items.map(i => i.id === itemId ? { ...i, ...details } : i)
      );
    }

    return { error };
  }

  async updateStatus(itemId: string, status: BucketListStatus): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('bucket_list_items')
      .update({ status })
      .eq('id', itemId);

    if (!error) {
      this._items.update(items =>
        items.map(i => i.id === itemId ? { ...i, status } : i)
      );
    }

    return { error };
  }

  async updateNotes(itemId: string, notes: string, targetYear?: number): Promise<{ error: any }> {
    return this.updateDetailedItem(itemId, { notes, target_year: targetYear ?? null });
  }

  async removeFromList(itemId: string): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('bucket_list_items')
      .delete()
      .eq('id', itemId);

    if (!error) {
      this._items.update(items => items.filter(i => i.id !== itemId));
    }

    return { error };
  }

  subscribeToChanges(userId: string): void {
    this.supabase.client
      .channel('bucket_list_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bucket_list_items',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Reload on any change
          this.loadUserBucketList(userId);
        }
      )
      .subscribe();
  }
}

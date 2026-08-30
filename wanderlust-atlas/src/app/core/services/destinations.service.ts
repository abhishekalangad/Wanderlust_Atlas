import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Destination, DestinationFilters } from '../models/types';

@Injectable({ providedIn: 'root' })
export class DestinationsService {
  private supabase = inject(SupabaseService);

  private _destinations = signal<Destination[]>([]);
  private _featuredDestinations = signal<Destination[]>([]);
  private _loading = signal<boolean>(false);

  readonly destinations = this._destinations.asReadonly();
  readonly featuredDestinations = this._featuredDestinations.asReadonly();
  readonly loading = this._loading.asReadonly();

  async getDestinations(filters?: DestinationFilters): Promise<Destination[]> {
    this._loading.set(true);

    let query = this.supabase.client
      .from('destinations')
      .select('*');

    if (filters?.approvalStatus) {
      query = query.eq('approval_status', filters.approvalStatus);
    } else {
      query = query.eq('approval_status', 'approved');
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.continent) {
      query = query.eq('continent', filters.continent);
    }
    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters?.featured !== undefined) {
      query = query.eq('is_featured', filters.featured);
    }
    if (filters?.minCost !== undefined) {
      query = query.gte('avg_cost_usd', filters.minCost);
    }
    if (filters?.maxCost !== undefined) {
      query = query.lte('avg_cost_usd', filters.maxCost);
    }
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,country.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    // Sorting
    switch (filters?.sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'alphabetical':
        query = query.order('name', { ascending: true });
        break;
      case 'cost_asc':
        query = query.order('avg_cost_usd', { ascending: true });
        break;
      case 'cost_desc':
        query = query.order('avg_cost_usd', { ascending: false });
        break;
      case 'featured':
      default:
        query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
        break;
    }

    const { data, error } = await query;
    this._loading.set(false);

    if (!error && data) {
      this._destinations.set(data as Destination[]);
      return data as Destination[];
    }
    return [];
  }

  async getDestinationById(id: string): Promise<Destination | null> {
    const { data, error } = await this.supabase.client
      .from('destinations')
      .select('*')
      .eq('id', id)
      .single();

    return !error && data ? (data as Destination) : null;
  }

  async getFeaturedDestinations(limit = 9): Promise<Destination[]> {
    const { data, error } = await this.supabase.client
      .from('destinations')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data) {
      this._featuredDestinations.set(data as Destination[]);
      return data as Destination[];
    }
    return [];
  }

  async getRelatedDestinations(destination: Destination, limit = 4): Promise<Destination[]> {
    const { data, error } = await this.supabase.client
      .from('destinations')
      .select('*')
      .eq('category', destination.category)
      .neq('id', destination.id)
      .limit(limit);

    return !error && data ? (data as Destination[]) : [];
  }

  // Admin & User submission operations
  async suggestDestination(dest: Partial<Destination>, userId: string): Promise<{ data: Destination | null; error: any }> {
    const payload = {
      ...dest,
      approval_status: 'pending' as const,
      submitted_by: userId,
    };

    const { data, error } = await this.supabase.client
      .from('destinations')
      .insert(payload)
      .select()
      .single();

    return { data: data as Destination | null, error };
  }

  async getPendingDestinations(): Promise<Destination[]> {
    const { data, error } = await this.supabase.client
      .from('destinations')
      .select('*')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    return !error && data ? (data as Destination[]) : [];
  }

  async approveDestination(id: string): Promise<{ error: any }> {
    return this.updateDestination(id, { approval_status: 'approved' });
  }

  async rejectDestination(id: string): Promise<{ error: any }> {
    return this.updateDestination(id, { approval_status: 'rejected' });
  }

  async createDestination(dest: Partial<Destination>): Promise<{ data: Destination | null; error: any }> {
    const { data, error } = await this.supabase.client
      .from('destinations')
      .insert(dest)
      .select()
      .single();

    if (!error && data) {
      this._destinations.update(d => [data as Destination, ...d]);
    }
    return { data: data as Destination | null, error };
  }

  async updateDestination(id: string, updates: Partial<Destination>): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('destinations')
      .update(updates)
      .eq('id', id);

    if (!error) {
      this._destinations.update(d =>
        d.map(dest => dest.id === id ? { ...dest, ...updates } : dest)
      );
    }
    return { error };
  }

  async deleteDestination(id: string): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('destinations')
      .delete()
      .eq('id', id);

    if (!error) {
      this._destinations.update(d => d.filter(dest => dest.id !== id));
    }
    return { error };
  }

  async uploadDestinationImage(file: File): Promise<{ url: string | null; error: any }> {
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

      const { data, error } = await this.supabase.client.storage
        .from('destination-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) return { url: null, error };

      const { data: { publicUrl } } = this.supabase.client.storage
        .from('destination-images')
        .getPublicUrl(data.path);

      return { url: publicUrl, error: null };
    } catch (err) {
      console.error('Image upload exception:', err);
      return { url: null, error: err };
    }
  }

  async getAllUsers(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    return !error && data ? data : [];
  }

  async toggleAdminStatus(userId: string, isAdmin: boolean): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('id', userId);
    return { error };
  }

  async getDashboardStats(): Promise<{ users: number; destinations: number; bucketItems: number }> {
    const [usersRes, destsRes, itemsRes] = await Promise.all([
      this.supabase.client.from('profiles').select('*', { count: 'exact', head: true }),
      this.supabase.client.from('destinations').select('*', { count: 'exact', head: true }),
      this.supabase.client.from('bucket_list_items').select('*', { count: 'exact', head: true }),
    ]);

    return {
      users: usersRes.count ?? 0,
      destinations: destsRes.count ?? 0,
      bucketItems: itemsRes.count ?? 0,
    };
  }

  async getOrCreateDestinationByName(name: string, userId: string, coverImageUrl?: string): Promise<Destination | null> {
    const cleanName = name.trim();
    if (!cleanName) return null;

    const { data: existing } = await this.supabase.client
      .from('destinations')
      .select('*')
      .ilike('name', cleanName)
      .maybeSingle();

    if (existing) {
      // If destination exists but has no image, auto-update with coverImageUrl
      if (!existing.image_url && coverImageUrl) {
        await this.updateDestination(existing.id, { image_url: coverImageUrl });
        existing.image_url = coverImageUrl;
      }
      return existing as Destination;
    }

    const { data: created, error } = await this.supabase.client
      .from('destinations')
      .insert({
        name: cleanName,
        country: 'India',
        continent: 'Asia',
        category: 'culture',
        description: `Travel destination featured in community travelogue: ${cleanName}`,
        image_url: coverImageUrl || null,
        approval_status: 'approved',
        submitted_by: userId
      })
      .select('*')
      .single();

    if (!error && created) {
      this._destinations.update(d => [created as Destination, ...d]);
      return created as Destination;
    }
    return null;
  }
}

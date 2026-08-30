import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Travelogue } from '../models/types';

@Injectable({ providedIn: 'root' })
export class TravelogueService {
  private supabase = inject(SupabaseService);

  private _travelogues = signal<Travelogue[]>([]);
  private _loading = signal<boolean>(false);

  readonly travelogues = this._travelogues.asReadonly();
  readonly loading = this._loading.asReadonly();

  async getTravelogues(destinationId?: string): Promise<Travelogue[]> {
    this._loading.set(true);

    let query = this.supabase.client
      .from('travelogues')
      .select('*, profile:profiles!left(*), destination:destinations!left(*)')
      .or('is_published.eq.true,is_published.is.null')
      .order('created_at', { ascending: false });

    if (destinationId) {
      query = query.eq('destination_id', destinationId);
    }

    const { data, error } = await query;
    this._loading.set(false);

    if (!error && data) {
      this._travelogues.set(data as Travelogue[]);
      return data as Travelogue[];
    }
    console.error('getTravelogues error:', error);
    return [];
  }

  async getTravelogueById(id: string): Promise<Travelogue | null> {
    const { data, error } = await this.supabase.client
      .from('travelogues')
      .select('*, profile:profiles!left(*), destination:destinations!left(*)')
      .eq('id', id)
      .single();

    return !error && data ? (data as Travelogue) : null;
  }

  async createTravelogue(travelogue: Partial<Travelogue>): Promise<{ data: Travelogue | null; error: any }> {
    const { data, error } = await this.supabase.client
      .from('travelogues')
      .insert(travelogue)
      .select('*, profile:profiles!left(*), destination:destinations!left(*)')
      .single();

    if (!error && data) {
      this._travelogues.update(t => [data as Travelogue, ...t]);
    }
    return { data: data as Travelogue | null, error };
  }

  async updateTravelogue(id: string, updates: Partial<Travelogue>): Promise<{ data: Travelogue | null; error: any }> {
    const { data, error } = await this.supabase.client
      .from('travelogues')
      .update(updates)
      .eq('id', id)
      .select('*, profile:profiles(*), destination:destinations(*)')
      .single();

    if (!error && data) {
      this._travelogues.update(t => t.map(item => item.id === id ? (data as Travelogue) : item));
    }
    return { data: data as Travelogue | null, error };
  }

  async deleteTravelogue(id: string): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('travelogues')
      .delete()
      .eq('id', id);

    if (!error) {
      this._travelogues.update(t => t.filter(item => item.id !== id));
    }
    return { error };
  }

  async uploadPdf(file: File): Promise<{ url: string | null; error: any }> {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

    const { data, error } = await this.supabase.client.storage
      .from('travelogue-pdfs')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) return { url: null, error };

    const { data: { publicUrl } } = this.supabase.client.storage
      .from('travelogue-pdfs')
      .getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Trip, TripTransportation, TripDestination, TripChecklistItem } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class TripPlannerService {
  private supabase = inject(SupabaseService);

  private _trips = signal<Trip[]>([]);
  readonly trips = this._trips.asReadonly();

  private _loading = signal<boolean>(false);
  readonly loading = this._loading.asReadonly();

  async loadUserTrips(userId: string): Promise<Trip[]> {
    if (!userId) return [];
    this._loading.set(true);

    try {
      const { data, error } = await this.supabase.client
        .from('trips')
        .select(`
          *,
          transportation:trip_transportation(*),
          destinations:trip_destinations(*, destination:destinations(*))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Sort destinations by order_index or arrival_date
        const formattedTrips = (data as Trip[]).map(t => ({
          ...t,
          transportation: t.transportation || [],
          destinations: (t.destinations || []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        }));
        this._trips.set(formattedTrips);
        return formattedTrips;
      }
      return [];
    } catch (e) {
      console.error('Error loading trips:', e);
      return [];
    } finally {
      this._loading.set(false);
    }
  }

  async createTrip(trip: Partial<Trip>): Promise<{ data: Trip | null; error: any }> {
    const { data, error } = await this.supabase.client
      .from('trips')
      .insert(trip)
      .select()
      .single();

    if (!error && data) {
      const newTrip: Trip = { ...data, transportation: [], destinations: [] };
      this._trips.update(trips => [newTrip, ...trips]);
      return { data: newTrip, error: null };
    }
    return { data: null, error };
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('trips')
      .update(updates)
      .eq('id', id);

    if (!error) {
      this._trips.update(trips =>
        trips.map(t => t.id === id ? { ...t, ...updates } : t)
      );
    }
    return { error };
  }

  async deleteTrip(id: string): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('trips')
      .delete()
      .eq('id', id);

    if (!error) {
      this._trips.update(trips => trips.filter(t => t.id !== id));
    }
    return { error };
  }

  // Transportation CRUD
  async addTransportation(tripId: string, item: Partial<TripTransportation>): Promise<{ data: TripTransportation | null; error: any }> {
    const payload = { ...item, trip_id: tripId };
    const { data, error } = await this.supabase.client
      .from('trip_transportation')
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      this._trips.update(trips =>
        trips.map(t => t.id === tripId ? { ...t, transportation: [...(t.transportation || []), data as TripTransportation] } : t)
      );
      return { data: data as TripTransportation, error: null };
    }
    return { data: null, error };
  }

  async updateTransportation(tripId: string, transportId: string, updates: Partial<TripTransportation>): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('trip_transportation')
      .update(updates)
      .eq('id', transportId);

    if (!error) {
      this._trips.update(trips =>
        trips.map(t => t.id === tripId ? {
          ...t,
          transportation: (t.transportation || []).map(tr => tr.id === transportId ? { ...tr, ...updates } : tr)
        } : t)
      );
    }
    return { error };
  }

  async deleteTransportation(tripId: string, transportId: string): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('trip_transportation')
      .delete()
      .eq('id', transportId);

    if (!error) {
      this._trips.update(trips =>
        trips.map(t => t.id === tripId ? { ...t, transportation: (t.transportation || []).filter(tr => tr.id !== transportId) } : t)
      );
    }
    return { error };
  }

  // Destinations & Stays CRUD
  async addTripDestination(tripId: string, destItem: Partial<TripDestination>): Promise<{ data: TripDestination | null; error: any }> {
    const payload = { ...destItem, trip_id: tripId, checklist_items: destItem.checklist_items || [] };
    const { data, error } = await this.supabase.client
      .from('trip_destinations')
      .insert(payload)
      .select('*, destination:destinations(*)')
      .single();

    if (!error && data) {
      this._trips.update(trips =>
        trips.map(t => t.id === tripId ? { ...t, destinations: [...(t.destinations || []), data as TripDestination] } : t)
      );
      return { data: data as TripDestination, error: null };
    }
    return { data: null, error };
  }

  async updateTripDestination(tripId: string, destId: string, updates: Partial<TripDestination>): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('trip_destinations')
      .update(updates)
      .eq('id', destId);

    if (!error) {
      this._trips.update(trips =>
        trips.map(t => t.id === tripId ? {
          ...t,
          destinations: (t.destinations || []).map(d => d.id === destId ? { ...d, ...updates } : d)
        } : t)
      );
    }
    return { error };
  }

  async deleteTripDestination(tripId: string, destId: string): Promise<{ error: any }> {
    const { error } = await this.supabase.client
      .from('trip_destinations')
      .delete()
      .eq('id', destId);

    if (!error) {
      this._trips.update(trips =>
        trips.map(t => t.id === tripId ? { ...t, destinations: (t.destinations || []).filter(d => d.id !== destId) } : t)
      );
    }
    return { error };
  }

  async updateChecklist(tripId: string, destId: string, checklist: TripChecklistItem[]): Promise<{ error: any }> {
    return this.updateTripDestination(tripId, destId, { checklist_items: checklist });
  }
}

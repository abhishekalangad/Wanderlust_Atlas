import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Trip, TripTransportation, TripDestination, TripChecklistItem } from '../models/types';

const VALID_DEST_COLUMNS = new Set([
  'id', 'trip_id', 'destination_id', 'place_name',
  'arrival_date', 'departure_date', 'stay_name', 'stay_address',
  'stay_booking_ref', 'checklist_items', 'order_index', 'created_at'
]);

function unpackDestinationMeta(d: TripDestination): TripDestination {
  const items = d.checklist_items || [];
  const ticketMeta = items.find((i: any) => i.id === '__meta_ticket__') as any;
  const stayMeta = items.find((i: any) => i.id === '__meta_stay__') as any;

  return {
    ...d,
    ticket_required: ticketMeta?.ticket_required ?? d.ticket_required ?? null,
    ticket_booking_url: ticketMeta?.ticket_booking_url ?? d.ticket_booking_url ?? null,
    ticket_booking_ref: ticketMeta?.ticket_booking_ref ?? d.ticket_booking_ref ?? null,
    ticket_price: ticketMeta?.ticket_price ?? d.ticket_price ?? null,
    ticket_timing_notes: ticketMeta?.ticket_timing_notes ?? d.ticket_timing_notes ?? null,
    stay_booking_platform: stayMeta?.stay_booking_platform ?? d.stay_booking_platform ?? null,
    stay_check_in: stayMeta?.stay_check_in ?? d.stay_check_in ?? null,
    stay_check_out: stayMeta?.stay_check_out ?? d.stay_check_out ?? null,
  };
}

function packDestinationUpdates(
  currentDestination: TripDestination | undefined,
  updates: Partial<TripDestination>
): Record<string, any> {
  const combined = { ...(currentDestination || {}), ...updates };
  let items = [...(combined.checklist_items || [])];

  // Pack ticket meta if any ticket fields updated or present
  if (
    updates.ticket_required !== undefined ||
    updates.ticket_booking_url !== undefined ||
    updates.ticket_booking_ref !== undefined ||
    updates.ticket_price !== undefined ||
    updates.ticket_timing_notes !== undefined
  ) {
    items = items.filter((i: any) => i.id !== '__meta_ticket__');
    const req = updates.ticket_required ?? currentDestination?.ticket_required ?? null;
    const url = updates.ticket_booking_url ?? currentDestination?.ticket_booking_url ?? null;
    const ref = updates.ticket_booking_ref ?? currentDestination?.ticket_booking_ref ?? null;
    const price = updates.ticket_price ?? currentDestination?.ticket_price ?? null;
    const notes = updates.ticket_timing_notes ?? currentDestination?.ticket_timing_notes ?? null;

    if (req || url || ref || price || notes) {
      items.push({
        id: '__meta_ticket__',
        title: '__meta_ticket__',
        is_completed: false,
        ticket_required: req,
        ticket_booking_url: url,
        ticket_booking_ref: ref,
        ticket_price: price,
        ticket_timing_notes: notes,
      } as any);
    }
  }

  // Pack stay meta if any stay fields updated or present
  if (
    updates.stay_booking_platform !== undefined ||
    updates.stay_check_in !== undefined ||
    updates.stay_check_out !== undefined
  ) {
    items = items.filter((i: any) => i.id !== '__meta_stay__');
    const platform = updates.stay_booking_platform ?? currentDestination?.stay_booking_platform ?? null;
    const checkIn = updates.stay_check_in ?? currentDestination?.stay_check_in ?? null;
    const checkOut = updates.stay_check_out ?? currentDestination?.stay_check_out ?? null;

    if (platform || checkIn || checkOut) {
      items.push({
        id: '__meta_stay__',
        title: '__meta_stay__',
        is_completed: false,
        stay_booking_platform: platform,
        stay_check_in: checkIn,
        stay_check_out: checkOut,
      } as any);
    }
  }

  const mergedPayload: Record<string, any> = {
    ...updates,
    checklist_items: items,
  };

  // Strip non-column keys from DB payload
  const cleanPayload: Record<string, any> = {};
  for (const key of Object.keys(mergedPayload)) {
    if (VALID_DEST_COLUMNS.has(key)) {
      cleanPayload[key] = mergedPayload[key];
    }
  }

  return cleanPayload;
}

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
        // Unpack meta fields and sort destinations by order_index
        const formattedTrips = (data as Trip[]).map(t => ({
          ...t,
          transportation: t.transportation || [],
          destinations: (t.destinations || [])
            .map(d => unpackDestinationMeta(d))
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
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
    const cleanPayload = packDestinationUpdates(undefined, { ...destItem, trip_id: tripId });
    const { data, error } = await this.supabase.client
      .from('trip_destinations')
      .insert(cleanPayload)
      .select('*, destination:destinations(*)')
      .single();

    if (!error && data) {
      const unpacked = unpackDestinationMeta(data as TripDestination);
      this._trips.update(trips =>
        trips.map(t => t.id === tripId ? { ...t, destinations: [...(t.destinations || []), unpacked] } : t)
      );
      return { data: unpacked, error: null };
    } else {
      console.error('Supabase addTripDestination error:', error);
    }
    return { data: null, error };
  }

  async updateTripDestination(tripId: string, destId: string, updates: Partial<TripDestination>): Promise<{ error: any }> {
    const currentTrip = this._trips().find(t => t.id === tripId);
    const currentDest = currentTrip?.destinations?.find(d => d.id === destId);

    const cleanPayload = packDestinationUpdates(currentDest, updates);

    const { error } = await this.supabase.client
      .from('trip_destinations')
      .update(cleanPayload)
      .eq('id', destId);

    if (!error) {
      const updatedFullDest = unpackDestinationMeta({
        ...(currentDest || {}),
        ...updates,
        checklist_items: cleanPayload['checklist_items'] || currentDest?.checklist_items || [],
      } as TripDestination);

      this._trips.update(trips =>
        trips.map(t => t.id === tripId ? {
          ...t,
          destinations: (t.destinations || []).map(d => d.id === destId ? updatedFullDest : d)
        } : t)
      );
    } else {
      console.error('Supabase updateTripDestination error:', error);
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

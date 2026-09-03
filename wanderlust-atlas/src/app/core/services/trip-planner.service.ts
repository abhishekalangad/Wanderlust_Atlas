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
  const statusMeta = items.find((i: any) => i.id === '__meta_dest_status__') as any;

  return {
    ...d,
    is_completed: statusMeta?.is_completed ?? d.is_completed ?? false,
    ticket_required: ticketMeta?.ticket_required ?? d.ticket_required ?? null,
    ticket_booking_url: ticketMeta?.ticket_booking_url ?? d.ticket_booking_url ?? null,
    ticket_booking_ref: ticketMeta?.ticket_booking_ref ?? d.ticket_booking_ref ?? null,
    ticket_price: ticketMeta?.ticket_price ?? d.ticket_price ?? null,
    ticket_timing_notes: ticketMeta?.ticket_timing_notes ?? d.ticket_timing_notes ?? null,

    stay_booking_platform: stayMeta?.stay_booking_platform ?? d.stay_booking_platform ?? null,
    stay_booking_platform_other: stayMeta?.stay_booking_platform_other ?? d.stay_booking_platform_other ?? null,
    stay_check_in: stayMeta?.stay_check_in ?? d.stay_check_in ?? null,
    stay_check_out: stayMeta?.stay_check_out ?? d.stay_check_out ?? null,
    stay_rate: stayMeta?.stay_rate ?? d.stay_rate ?? null,
    stay_status: stayMeta?.stay_status ?? d.stay_status ?? null,
    stay_refund_status: stayMeta?.stay_refund_status ?? d.stay_refund_status ?? null,
    stay_contact: stayMeta?.stay_contact ?? d.stay_contact ?? null,
    stay_room_type: stayMeta?.stay_room_type ?? d.stay_room_type ?? null,
    stay_notes: stayMeta?.stay_notes ?? d.stay_notes ?? null,
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
    const req = updates.ticket_required !== undefined ? updates.ticket_required : (currentDestination?.ticket_required ?? null);
    const url = updates.ticket_booking_url !== undefined ? updates.ticket_booking_url : (currentDestination?.ticket_booking_url ?? null);
    const ref = updates.ticket_booking_ref !== undefined ? updates.ticket_booking_ref : (currentDestination?.ticket_booking_ref ?? null);
    const price = updates.ticket_price !== undefined ? updates.ticket_price : (currentDestination?.ticket_price ?? null);
    const notes = updates.ticket_timing_notes !== undefined ? updates.ticket_timing_notes : (currentDestination?.ticket_timing_notes ?? null);

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
    updates.stay_booking_platform_other !== undefined ||
    updates.stay_check_in !== undefined ||
    updates.stay_check_out !== undefined ||
    updates.stay_rate !== undefined ||
    updates.stay_status !== undefined ||
    updates.stay_refund_status !== undefined ||
    updates.stay_contact !== undefined ||
    updates.stay_room_type !== undefined ||
    updates.stay_notes !== undefined
  ) {
    items = items.filter((i: any) => i.id !== '__meta_stay__');
    const platform = updates.stay_booking_platform !== undefined ? updates.stay_booking_platform : (currentDestination?.stay_booking_platform ?? null);
    const platformOther = updates.stay_booking_platform_other !== undefined ? updates.stay_booking_platform_other : (currentDestination?.stay_booking_platform_other ?? null);
    const checkIn = updates.stay_check_in !== undefined ? updates.stay_check_in : (currentDestination?.stay_check_in ?? null);
    const checkOut = updates.stay_check_out !== undefined ? updates.stay_check_out : (currentDestination?.stay_check_out ?? null);
    const rate = updates.stay_rate !== undefined ? updates.stay_rate : (currentDestination?.stay_rate ?? null);
    const status = updates.stay_status !== undefined ? updates.stay_status : (currentDestination?.stay_status ?? null);
    const refundStatus = updates.stay_refund_status !== undefined ? updates.stay_refund_status : (currentDestination?.stay_refund_status ?? null);
    const contact = updates.stay_contact !== undefined ? updates.stay_contact : (currentDestination?.stay_contact ?? null);
    const roomType = updates.stay_room_type !== undefined ? updates.stay_room_type : (currentDestination?.stay_room_type ?? null);
    const notes = updates.stay_notes !== undefined ? updates.stay_notes : (currentDestination?.stay_notes ?? null);

    if (platform || platformOther || checkIn || checkOut || rate || status || refundStatus || contact || roomType || notes) {
      items.push({
        id: '__meta_stay__',
        title: '__meta_stay__',
        is_completed: false,
        stay_booking_platform: platform,
        stay_booking_platform_other: platformOther,
        stay_check_in: checkIn,
        stay_check_out: checkOut,
        stay_rate: rate,
        stay_status: status,
        stay_refund_status: refundStatus,
        stay_contact: contact,
        stay_room_type: roomType,
        stay_notes: notes,
      } as any);
    }
  }

  // Pack destination completion status if present
  if (updates.is_completed !== undefined) {
    items = items.filter((i: any) => i.id !== '__meta_dest_status__');
    items.push({
      id: '__meta_dest_status__',
      title: '__meta_dest_status__',
      is_completed: !!updates.is_completed,
    } as any);
  }

  const mergedPayload: Record<string, any> = {
    ...updates,
    checklist_items: items,
  };

  // Include direct columns + packed checklist items
  const cleanPayload: Record<string, any> = {};
  for (const key of Object.keys(mergedPayload)) {
    if (VALID_DEST_COLUMNS.has(key)) {
      cleanPayload[key] = mergedPayload[key];
    }
  }

  return cleanPayload;
}

export function unpackTransportationMeta(tr: TripTransportation): TripTransportation {
  if (!tr.notes) return tr;
  if (tr.notes.startsWith('{') && tr.notes.endsWith('}')) {
    try {
      const parsed = JSON.parse(tr.notes);
      return {
        ...tr,
        notes: parsed.user_notes || null,
        pnr_no: parsed.pnr_no || tr.pnr_no || null,
        bus_no: parsed.bus_no || tr.bus_no || null,
        amount: parsed.amount || tr.amount || null,
        booking_platform: parsed.booking_platform || tr.booking_platform || null,
        booking_platform_other: parsed.booking_platform_other || tr.booking_platform_other || null,
      };
    } catch {
      return tr;
    }
  }
  return tr;
}

function packTransportationPayload(item: Partial<TripTransportation>): Record<string, any> {
  const { pnr_no, bus_no, amount, booking_platform, booking_platform_other, notes, ...rest } = item;
  let notesValue = notes || null;

  if (pnr_no || bus_no || amount || booking_platform || booking_platform_other) {
    notesValue = JSON.stringify({
      user_notes: notes || null,
      pnr_no: pnr_no || null,
      bus_no: bus_no || null,
      amount: amount || null,
      booking_platform: booking_platform || null,
      booking_platform_other: booking_platform_other || null,
    });
  }

  return {
    ...rest,
    notes: notesValue,
  };
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
          transportation: (t.transportation || []).map(tr => unpackTransportationMeta(tr)),
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
    const cleanPayload = packTransportationPayload(item);
    const { data, error } = await this.supabase.client
      .from('trip_transportation')
      .insert({ ...cleanPayload, trip_id: tripId })
      .select()
      .single();

    if (!error && data) {
      const unpacked = unpackTransportationMeta({ ...(data as TripTransportation), ...item });
      this._trips.update(trips =>
        trips.map(t => t.id === tripId ? { ...t, transportation: [...(t.transportation || []), unpacked] } : t)
      );
      return { data: unpacked, error: null };
    }
    return { data: null, error };
  }

  async updateTransportation(tripId: string, transportId: string, updates: Partial<TripTransportation>): Promise<{ error: any }> {
    const cleanPayload = packTransportationPayload(updates);
    const { error } = await this.supabase.client
      .from('trip_transportation')
      .update(cleanPayload)
      .eq('id', transportId);

    if (!error) {
      const unpackedUpdates = unpackTransportationMeta({ ...updates, notes: cleanPayload['notes'] } as TripTransportation);
      this._trips.update(trips =>
        trips.map(t => t.id === tripId ? {
          ...t,
          transportation: (t.transportation || []).map(tr => tr.id === transportId ? { ...tr, ...unpackedUpdates } : tr)
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

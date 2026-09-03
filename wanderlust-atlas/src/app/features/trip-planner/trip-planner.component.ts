import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TripPlannerService } from '../../core/services/trip-planner.service';
import { DestinationsService } from '../../core/services/destinations.service';
import { ToastService } from '../../core/services/toast.service';
import { Trip, TripTransportation, TripDestination, TransportationMode, TRANSPORT_MODES, TripChecklistItem } from '../../core/models/types';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { searchSuggestions, lookupStationOrAirport, LocationSuggestion } from '../../core/utils/station-lookup';

export const BOOKING_PLATFORMS = [
  { value: 'booking', label: 'Booking.com', icon: '🔵' },
  { value: 'airbnb', label: 'Airbnb', icon: '🌸' },
  { value: 'hotels', label: 'Hotels.com', icon: '🏨' },
  { value: 'makemytrip', label: 'MakeMyTrip', icon: '🔴' },
  { value: 'goibibo', label: 'Goibibo', icon: '🟢' },
  { value: 'irctc_dormitory', label: 'IRCTC Dormitory / Retiring Room', icon: '🚉' },
  { value: 'oyo', label: 'OYO Rooms', icon: '🔶' },
  { value: 'agoda', label: 'Agoda', icon: '🟤' },
  { value: 'expedia', label: 'Expedia', icon: '🔷' },
  { value: 'cleartrip', label: 'Cleartrip', icon: '⚡' },
  { value: 'direct', label: 'Direct Booking', icon: '📞' },
  { value: 'other', label: 'Other / Walk-in', icon: '🏠' },
];

export const TRANSPORT_BOOKING_PLATFORMS = [
  { value: 'redbus', label: 'RedBus', icon: '🚌' },
  { value: 'abhibus', label: 'AbhiBus', icon: '🚍' },
  { value: 'makemytrip', label: 'MakeMyTrip', icon: '🔴' },
  { value: 'goibibo', label: 'Goibibo', icon: '🟢' },
  { value: 'ixigo', label: 'Ixigo', icon: '⚡' },
  { value: 'irctc', label: 'IRCTC', icon: '🚉' },
  { value: 'state_rtc', label: 'State RTC', icon: '🚌' },
  { value: 'zingbus', label: 'Zingbus / IntrCity', icon: '🚍' },
  { value: 'uber_cab', label: 'Uber / Cab / Taxi', icon: '🚕' },
  { value: 'direct_operator', label: 'Direct Operator / Stand', icon: '🎟️' },
  { value: 'other', label: 'Other', icon: '🏷️' },
];

@Component({
  selector: 'app-trip-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, FooterComponent, LoaderComponent],
  templateUrl: './trip-planner.component.html',
  styleUrls: ['./trip-planner.component.scss']
})
export class TripPlannerComponent implements OnInit {
  auth = inject(AuthService);
  tripService = inject(TripPlannerService);
  destService = inject(DestinationsService);
  private toast = inject(ToastService);
  private router = inject(Router);

  transportModes = TRANSPORT_MODES;
  bookingPlatforms = BOOKING_PLATFORMS;
  transportBookingPlatforms = TRANSPORT_BOOKING_PLATFORMS;

  activeTrip = signal<Trip | null>(null);
  viewMode = signal<'grid' | 'timeline'>('grid');

  showCreateModal = signal<boolean>(false);
  showTransportModal = signal<boolean>(false);
  showStopModal = signal<boolean>(false);
  showStayModal = signal<boolean>(false);
  showTicketModal = signal<boolean>(false);
  isEditingTrip = signal<boolean>(false);

  editingTransport = signal<TripTransportation | null>(null);
  editingStop = signal<TripDestination | null>(null);
  stayForStop = signal<TripDestination | null>(null);
  stayOriginalStopId = signal<string | null>(null);
  ticketForStop = signal<TripDestination | null>(null);

  expandedStayPanels = signal<Record<string, boolean>>({});
  expandedChecklistPanels = signal<Record<string, boolean>>({});

  newTripTitle = signal<string>('');
  newTripStartDate = signal<string>('');
  newTripEndDate = signal<string>('');
  newTripNotes = signal<string>('');

  transMode = signal<TransportationMode>('plane');
  transCarrier = signal<string>('');
  transTicketNo = signal<string>('');
  transPnrNo = signal<string>('');
  transOrigin = signal<string>('');
  transDestination = signal<string>('');
  transDepartureTime = signal<string>('');
  transArrivalTime = signal<string>('');
  transNotes = signal<string>('');
  transBusNo = signal<string>('');
  transAmount = signal<string>('');
  transBookingPlatform = signal<string>('');
  transBookingPlatformOther = signal<string>('');
  transportModeFilter = signal<string>('all');

  // Station & Train Autocomplete signals
  depStationSuggestions = signal<LocationSuggestion[]>([]);
  arrStationSuggestions = signal<LocationSuggestion[]>([]);
  trainSuggestions = signal<LocationSuggestion[]>([]);
  showDepSuggestions = signal<boolean>(false);
  showArrSuggestions = signal<boolean>(false);
  showTrainSuggestions = signal<boolean>(false);

  stopPlaceName = signal<string>('');
  stopDestinationId = signal<string>('');
  stopArrivalDate = signal<string>('');
  stopDepartureDate = signal<string>('');

  stayName = signal<string>('');
  stayAddress = signal<string>('');
  stayBookingRef = signal<string>('');
  stayBookingPlatform = signal<string>('');
  stayBookingPlatformOther = signal<string>('');
  stayCheckIn = signal<string>('');
  stayCheckOut = signal<string>('');
  stayRate = signal<string>('');
  stayStatus = signal<'confirmed' | 'cancelled' | ''>('');
  stayRefundStatus = signal<'complete' | 'pending' | ''>('');
  stayContact = signal<string>('');
  stayRoomType = signal<string>('');
  stayNotes = signal<string>('');
  stayDuration = signal<string>('');
  stayDurationPreset = signal<string>('');

  onStayDurationPresetSelect(preset: string): void {
    this.stayDurationPreset.set(preset);
    if (preset !== 'custom') {
      this.stayDuration.set(preset);
    }
  }

  // Entry Ticket form signals
  ticketRequired = signal<boolean>(false);
  ticketUrl = signal<string>('');
  ticketRef = signal<string>('');
  ticketPrice = signal<string>('');
  ticketTimingNotes = signal<string>('');

  newSpotChecklistInput = signal<Record<string, string>>({});

  getTasksOnly(items?: TripChecklistItem[]): TripChecklistItem[] {
    return (items || []).filter(i => i && i.id && !i.id.includes('__meta_') && !(i.title || '').includes('__meta_'));
  }

  expandedStops = signal<Set<string>>(new Set());
  expandedTimelineItems = signal<Set<string>>(new Set());
  expandedGridTransports = signal<Set<string>>(new Set());
  expandedGridStays = signal<Set<string>>(new Set());

  toggleGridTransportExpanded(transId: string): void {
    this.expandedGridTransports.update(prev => {
      const next = new Set(prev);
      if (next.has(transId)) next.delete(transId);
      else next.add(transId);
      return next;
    });
  }

  isGridTransportExpanded(transId: string): boolean {
    return this.expandedGridTransports().has(transId);
  }

  toggleGridStayExpanded(stayId?: string): void {
    if (!stayId) return;
    this.expandedGridStays.update(prev => {
      const next = new Set(prev);
      if (next.has(stayId)) next.delete(stayId);
      else next.add(stayId);
      return next;
    });
  }

  isGridStayExpanded(stayId?: string): boolean {
    return stayId ? this.expandedGridStays().has(stayId) : false;
  }

  getDepIcon(mode?: string): string {
    if (mode === 'flight') return '🛫';
    if (mode === 'train' || mode === 'irctc_dormitory') return '🚆';
    if (mode === 'bus') return '🚌';
    if (mode === 'car' || mode === 'cab') return '🚗';
    if (mode === 'ferry') return '🚢';
    return '🟢';
  }

  getArrIcon(mode?: string): string {
    if (mode === 'flight') return '🛬';
    if (mode === 'train' || mode === 'irctc_dormitory') return '🏁';
    if (mode === 'bus') return '🚏';
    if (mode === 'car' || mode === 'cab') return '🏁';
    if (mode === 'ferry') return '⚓';
    return '🔴';
  }

  toggleStopExpanded(stopId: string): void {
    this.expandedStops.update(prev => {
      const next = new Set(prev);
      if (next.has(stopId)) {
        next.delete(stopId);
      } else {
        next.add(stopId);
      }
      return next;
    });
  }

  isStopExpanded(stopId: string): boolean {
    return this.expandedStops().has(stopId);
  }

  toggleAllStops(expand: boolean): void {
    const trip = this.activeTrip();
    if (!trip?.destinations) return;
    if (expand) {
      this.expandedStops.set(new Set(trip.destinations.map(d => d.id!)));
    } else {
      this.expandedStops.set(new Set());
    }
  }

  areAllStopsExpanded(): boolean {
    const trip = this.activeTrip();
    if (!trip?.destinations || trip.destinations.length === 0) return false;
    return trip.destinations.every(d => this.expandedStops().has(d.id!));
  }

  toggleTimelineExpanded(id: string): void {
    this.expandedTimelineItems.update(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isTimelineExpanded(id: string): boolean {
    return this.expandedTimelineItems().has(id);
  }

  toggleAllTimelineItems(expand: boolean): void {
    const events = this.timelineEvents();
    if (expand) {
      this.expandedTimelineItems.set(new Set(events.map(e => e.id)));
    } else {
      this.expandedTimelineItems.set(new Set());
    }
  }

  areAllTimelineItemsExpanded(): boolean {
    const events = this.timelineEvents();
    if (events.length === 0) return false;
    return events.every(e => this.expandedTimelineItems().has(e.id));
  }

  activeTripChecklistStats = computed(() => {
    const trip = this.activeTrip();
    if (!trip) return { completed: 0, total: 0, percent: 0 };
    
    let completed = 0;
    let total = 0;
    const now = new Date().getTime();

    // 1. Destination Visits (Visits marked completed)
    const dests = trip.destinations || [];
    total += dests.length;
    completed += dests.filter(d => d.is_completed).length;

    // 2. Spot Checklist Tasks
    dests.forEach(d => {
      const tasks = this.getTasksOnly(d.checklist_items);
      total += tasks.length;
      completed += tasks.filter(i => i.is_completed).length;
    });

    // 3. Transport Passes (Completed automatically if transport date/time has passed)
    const trans = trip.transportation || [];
    total += trans.length;
    trans.forEach(tr => {
      const dateStr = tr.departure_time || tr.arrival_time;
      if (dateStr) {
        const ts = new Date(dateStr).getTime();
        if (!isNaN(ts) && ts <= now) {
          completed++;
        }
      }
    });

    // 4. Hotel Stays (Completed automatically if check-out date/time has passed)
    const stays = dests.filter(d => d.stay_name);
    total += stays.length;
    stays.forEach(s => {
      const stayDate = s.stay_check_out || s.stay_check_in;
      if (stayDate) {
        const ts = new Date(stayDate).getTime();
        if (!isNaN(ts) && ts <= now) {
          completed++;
        }
      }
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  });

  totalStaysAdded = computed(() => {
    const trip = this.activeTrip();
    if (!trip?.destinations) return 0;
    return trip.destinations.filter(d => d.stay_name).length;
  });

  sortedTransportation = computed(() => {
    const trip = this.activeTrip();
    if (!trip?.transportation) return [];
    const filter = this.transportModeFilter();
    let list = [...trip.transportation];
    if (filter !== 'all') {
      list = list.filter(tr => tr.mode === filter);
    }
    list.sort((a, b) => {
      if (!a.departure_time && !b.departure_time) return 0;
      if (!a.departure_time) return 1;
      if (!b.departure_time) return -1;
      return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
    });
    return list;
  });

  getTransportCountByMode(mode: string): number {
    const trip = this.activeTrip();
    if (!trip?.transportation) return 0;
    return trip.transportation.filter(tr => tr.mode === mode).length;
  }

  destinationsWithStays = computed(() => {
    const trip = this.activeTrip();
    if (!trip?.destinations) return [];
    return trip.destinations.filter(d => !!d.stay_name);
  });

  totalTicketsAdded = computed(() => {
    const trip = this.activeTrip();
    if (!trip?.destinations) return 0;
    return trip.destinations.filter(d => d.ticket_booking_url || d.ticket_booking_ref).length;
  });

  activeModeConfig = computed(() => {
    const mode = this.transMode();
    switch (mode) {
      case 'plane': return { nameLabel: 'Airline & Flight No.', namePlaceholder: 'e.g. Emirates EK202', ticketLabel: 'PNR / Ticket Ref', ticketPlaceholder: 'e.g. PNR #894204', originLabel: 'Departure Airport', originPlaceholder: 'e.g. BOM - Chhatrapati Shivaji Intl', destLabel: 'Arrival Airport', destPlaceholder: 'e.g. CDG - Paris Charles de Gaulle', notesLabel: 'Seat / Gate / Terminal', notesPlaceholder: 'e.g. Seat 14A, Terminal 2, Gate G8', modalTitle: 'Add Flight Pass' };
      case 'train': return { nameLabel: 'Train Name & Number', namePlaceholder: 'e.g. Vande Bharat Express #20608', ticketLabel: 'IRCTC PNR Number', ticketPlaceholder: 'e.g. PNR #4829103951', originLabel: 'Departure Station', originPlaceholder: 'e.g. New Delhi (NDLS)', destLabel: 'Arrival Station', destPlaceholder: 'e.g. Varanasi Junction (BSB)', notesLabel: 'Coach & Berth Details', notesPlaceholder: 'e.g. Coach B3, Berth 24 Side Lower', modalTitle: 'Add Train Pass' };
      case 'bus': return { nameLabel: 'Bus Operator & Route', namePlaceholder: 'e.g. KSRTC Airavat / IntrCity Volvo', ticketLabel: 'Bus Ticket / Booking Ref', ticketPlaceholder: 'e.g. RedBus #RB938201', originLabel: 'Boarding Station', originPlaceholder: 'e.g. Majestic Bus Stand Bay 4', destLabel: 'Drop-off Stop', destPlaceholder: 'e.g. MG Road Bus Stop', notesLabel: 'Seat / Boarding Notes', notesPlaceholder: 'e.g. Seat 12 Upper Deck', modalTitle: 'Add Bus Pass' };
      case 'car': return { nameLabel: 'Car Model / Rental Agency', namePlaceholder: 'e.g. Zoomcar Thar / Hertz SUV', ticketLabel: 'License Plate / Rental Ref', ticketPlaceholder: 'e.g. KA-01-AB-1234', originLabel: 'Pick-up Location', originPlaceholder: 'e.g. Airport Car Rental Counter', destLabel: 'Drop-off Location', destPlaceholder: 'e.g. Resort Valet Parking', notesLabel: 'Driver / Fuel / Toll Notes', notesPlaceholder: 'e.g. Fastag enabled, Driver: Ramesh', modalTitle: 'Add Car / Road Trip' };
      case 'ship': return { nameLabel: 'Ship / Cruise Line', namePlaceholder: 'e.g. Cordelia Cruises / Catamaran', ticketLabel: 'Cabin / Ticket Ref', ticketPlaceholder: 'e.g. Cruise Booking #CR-93820', originLabel: 'Boarding Port', originPlaceholder: 'e.g. Mumbai Pier #4', destLabel: 'Arrival Port', destPlaceholder: 'e.g. Mormugao Port, Goa', notesLabel: 'Cabin No & Deck', notesPlaceholder: 'e.g. Ocean View Cabin #402, Deck 6', modalTitle: 'Add Ship / Cruise Pass' };
      case 'bike': return { nameLabel: 'Bike Model / Rental', namePlaceholder: 'e.g. Royal Enfield Himalayan 450', ticketLabel: 'Bike Reg / Rental Contract', ticketPlaceholder: 'e.g. Agreement #BR-502', originLabel: 'Pick-up Point', originPlaceholder: 'e.g. Manali Bike Rental Hub', destLabel: 'Drop-off Point', destPlaceholder: 'e.g. Leh Bike Depot', notesLabel: 'Riding Gear & Notes', notesPlaceholder: 'e.g. Helmets & panniers included', modalTitle: 'Add Bike / Motorbike Pass' };
      case 'irctc_dormitory': return { nameLabel: 'Dormitory / Room Type', namePlaceholder: 'e.g. AC Dormitory 4-Bed / Retiring Room', ticketLabel: 'IRCTC PNR / Booking Ref', ticketPlaceholder: 'e.g. PNR #4829103951', originLabel: 'Railway Station', originPlaceholder: 'e.g. New Delhi (NDLS)', destLabel: 'Amount Paid', destPlaceholder: 'e.g. ₹450 for 12 hrs', notesLabel: 'Additional Notes', notesPlaceholder: 'e.g. Bed no. 3, Bring receipt printout', modalTitle: 'Add IRCTC Dormitory / Retiring Room' };
    }
  });

  // Manual override order for drag-reordered events (keyed by trip id)
  manualTimelineOrder = signal<Record<string, string[]>>({});
  savedTimelineOrder = signal<Record<string, string[]>>({});
  isDraggingOver = signal<string | null>(null);
  draggingId = signal<string | null>(null);

  timelineEvents = computed(() => {
    const trip = this.activeTrip();
    if (!trip) return [];
    const events: any[] = [];

    // Robust timestamp parser supporting DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, text formats, and year normalization
    const parseTs = (val: string | null | undefined): number | null => {
      if (!val || typeof val !== 'string') return null;
      const trimmed = val.trim();
      if (!trimmed) return null;

      const currentYear = trip.start_date ? new Date(trip.start_date).getFullYear() : 2026;

      // 1. Format: DD-MM-YYYY or DD/MM/YYYY (e.g. "25-03-2024" or "25/03/2026")
      const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[T\s](\d{1,2}):(\d{2}))?/);
      if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const monthIdx = parseInt(dmyMatch[2], 10) - 1;
        const hh = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
        const mm = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
        const d = new Date(currentYear, monthIdx, day, hh, mm);
        if (!isNaN(d.getTime())) return d.getTime();
      }

      // 2. Format: YYYY-MM-DD or YYYY/MM/DD (e.g. "2024-03-25" or "2026-03-25T12:38")
      const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{2}))?/);
      if (ymdMatch) {
        const monthIdx = parseInt(ymdMatch[2], 10) - 1;
        const day = parseInt(ymdMatch[3], 10);
        const hh = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0;
        const mm = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
        const d = new Date(currentYear, monthIdx, day, hh, mm);
        if (!isNaN(d.getTime())) return d.getTime();
      }

      // 3. Format: "25 Mar", "Wed 25 Mar", "25 Mar, 12:38"
      const textMatch = trimmed.match(/(?:[A-Za-z]+\s+)?(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?(?:,?\s+(\d{1,2}):(\d{2}))?/);
      if (textMatch) {
        const day = parseInt(textMatch[1], 10);
        const monthStr = textMatch[2].toLowerCase();
        const hh = textMatch[4] ? parseInt(textMatch[4], 10) : 0;
        const mm = textMatch[5] ? parseInt(textMatch[5], 10) : 0;
        const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
        const monthIdx = months.findIndex(m => monthStr.startsWith(m));
        if (monthIdx !== -1) {
          const d = new Date(currentYear, monthIdx, day, hh, mm);
          if (!isNaN(d.getTime())) return d.getTime();
        }
      }

      // 4. Fallback standard Date
      const cleaned = trimmed.includes(' ') && !trimmed.includes('T') ? trimmed.replace(' ', 'T') : trimmed;
      const d = new Date(cleaned);
      if (!isNaN(d.getTime())) {
        d.setFullYear(currentYear);
        return d.getTime();
      }

      return null;
    };

    // 1. TRANSPORTATION EVENTS (typePriority = 0)
    (trip.transportation || []).forEach(tr => {
      const cfg = this.getModeConfig(tr.mode);
      const dateVal = tr.departure_time || tr.arrival_time || null;
      const ts = parseTs(dateVal);

      let arrTimeStr = '';
      if (tr.arrival_time) {
        const arrTs = parseTs(tr.arrival_time);
        if (arrTs) {
          arrTimeStr = ' (Arrive: ' + new Date(arrTs).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }) + ')';
        } else if (typeof tr.arrival_time === 'string' && tr.arrival_time.trim()) {
          arrTimeStr = ' (Arrive: ' + tr.arrival_time + ')';
        }
      }

      events.push({
        id: 'trans-' + tr.id,
        rawDate: dateVal,
        ts,
        type: 'transport',
        typePriority: 0, // 1st Priority on same date/time
        icon: cfg.icon,
        displayDate: dateVal && ts
          ? new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
          : 'Flexible / Undated',
        title: tr.carrier_or_name || cfg.label + ' Pass',
        subtitle: (tr.origin || 'Departure') + ' ➔ ' + (tr.destination_name || 'Arrival') + arrTimeStr,
        refText: tr.ticket_no ? '🎫 Ticket: ' + tr.ticket_no : (tr.pnr_no ? '🔢 PNR: ' + tr.pnr_no : null),
        notes: tr.notes,
        rawTransport: tr,
      });
    });

    // 2. DESTINATIONS AND DEDICATED HOTEL STAYS
    (trip.destinations || []).forEach((stop, idx) => {
      // Create dedicated Hotel Stay event if stay_name is present
      if (stop.stay_name) {
        const stayDate = stop.stay_check_in || stop.arrival_date || null;
        const stayTs = parseTs(stayDate);
        events.push({
          id: 'stay-' + stop.id,
          rawDate: stayDate,
          ts: stayTs,
          type: 'stay',
          typePriority: 1, // 2nd Priority on same date/time (after transport, before destination visit)
          icon: '🏨',
          displayDate: stayDate && stayTs
            ? new Date(stayTs).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
            : 'Hotel Check-in',
          title: stop.stay_name,
          subtitle: stop.stay_address ? ('📍 ' + stop.stay_address) : ('Location: ' + stop.place_name),
          refText: stop.stay_booking_ref ? '🎫 Ref: ' + stop.stay_booking_ref : null,
          notes: stop.stay_notes || null,
          rawStop: stop,
        });
      }

      // Destination Sightseeing Stop event
      const destDate = stop.arrival_date || stop.departure_date || null;
      const destTs = parseTs(destDate);
      events.push({
        id: 'stop-' + stop.id,
        rawDate: destDate,
        ts: destTs,
        type: 'destination',
        typePriority: 2, // 3rd Priority on same date/time
        icon: '📍',
        displayDate: destDate && destTs
          ? (destDate.includes('T') || destDate.includes(':')
              ? new Date(destTs).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
              : new Date(destTs).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }))
          : 'Stop #' + (idx + 1) + ' (Undated)',
        title: stop.place_name,
        subtitle: stop.stay_name ? '🏨 Stay: ' + stop.stay_name : '📍 Destination Visit',
        refText: stop.ticket_price ? ('🎟️ Ticket: ₹' + stop.ticket_price) : null,
        notes: null,
        checklist: this.getTasksOnly(stop.checklist_items),
        rawStop: stop,
      });
    });

    // Assign effective timestamp for date-only Destination/Stay nodes (default to 12:00 PM Noon if no time set)
    // so morning arrival trains (07:08 AM) sort BEFORE the visit, and evening departure trains (19:30 PM) sort AFTER!
    events.forEach(e => {
      if (e.ts !== null && e.typePriority > 0) {
        const raw = String(e.rawDate || '');
        if (!raw.includes('T') && !raw.includes(':')) {
          const d = new Date(e.ts);
          d.setHours(12, 0, 0, 0); // Default date-only visits to 12:00 PM (Noon)
          e.ts = d.getTime();
        }
      }
    });

    // STRICT CHRONOLOGICAL TIME SORT:
    // 1. Undated items (ts === null) go to very end
    // 2. Exact Timestamp Flow (ASC): Morning Train (07:08) -> Daytime Destination Visit (12:00) -> Evening Train (19:30)
    // 3. Same Timestamp / Time: Transport (0) FIRST -> Hotel Stay (1) SECOND -> Destination (2) THIRD
    events.sort((a, b) => {
      if (a.ts === null && b.ts === null) return a.typePriority - b.typePriority;
      if (a.ts === null) return 1;
      if (b.ts === null) return -1;

      // 1. Primary: Compare exact timestamp / time of day (ASC)
      if (a.ts !== b.ts) {
        return a.ts - b.ts;
      }

      // 2. Secondary (Same Date & Time): Transport (0) -> Hotel Stay (1) -> Destination (2)
      return a.typePriority - b.typePriority;
    });

    // Apply manual drag / button reorder override if present for this trip
    const manualOrder = this.manualTimelineOrder()[trip.id];
    if (manualOrder && manualOrder.length > 0) {
      const eventMap = new Map(events.map(e => [e.id, e]));
      const reordered: any[] = [];
      manualOrder.forEach(id => {
        if (eventMap.has(id)) {
          reordered.push(eventMap.get(id));
          eventMap.delete(id);
        }
      });
      eventMap.forEach(e => reordered.push(e));
      return reordered;
    }

    return events;
  });

  moveTimelineItem(eventId: string, direction: 'up' | 'down'): void {
    const trip = this.activeTrip();
    if (!trip) return;
    const events = [...this.timelineEvents()];
    const index = events.findIndex(e => e.id === eventId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= events.length) return;

    const updatedEvents = [...events];
    const temp = updatedEvents[index];
    updatedEvents[index] = updatedEvents[targetIndex];
    updatedEvents[targetIndex] = temp;

    const newOrder = updatedEvents.map(e => e.id);
    this.manualTimelineOrder.update(prev => ({
      ...prev,
      [trip.id]: newOrder
    }));

    this.toast.success(`Position updated!`);
  }

  generateTimeline(): void {
    const trip = this.activeTrip();
    if (trip) {
      // Clear manual drag order so timeline generates strictly in chronological date order
      this.manualTimelineOrder.update(prev => {
        const copy = { ...prev };
        delete copy[trip.id];
        return copy;
      });
    }
    this.viewMode.set('timeline');
    this.toast.success('Timeline generated in strict chronological order!');
  }

  // Drag-and-drop reorder handlers
  onDragStart(eventId: string): void {
    this.draggingId.set(eventId);
  }

  onDragOver(eventId: string, domEvent: DragEvent): void {
    domEvent.preventDefault();
    this.isDraggingOver.set(eventId);
  }

  onDragLeave(): void {
    this.isDraggingOver.set(null);
  }

  onDrop(targetId: string): void {
    const draggedId = this.draggingId();
    if (!draggedId || draggedId === targetId) {
      this.draggingId.set(null);
      this.isDraggingOver.set(null);
      return;
    }

    const trip = this.activeTrip();
    if (!trip) return;

    const events = this.timelineEvents();
    const currentOrder = events.map(e => e.id);
    const fromIdx = currentOrder.indexOf(draggedId);
    const toIdx = currentOrder.indexOf(targetId);

    if (fromIdx === -1 || toIdx === -1) return;

    const newOrder = [...currentOrder];
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedId);

    this.manualTimelineOrder.update(prev => ({ ...prev, [trip.id]: newOrder }));
    this.draggingId.set(null);
    this.isDraggingOver.set(null);
    this.toast.info('Timeline order updated.');
  }

  onDragEnd(): void {
    this.draggingId.set(null);
    this.isDraggingOver.set(null);
  }

  saveTimelineOrder(): void {
    const trip = this.activeTrip();
    if (!trip) return;
    const currentOrder = this.manualTimelineOrder()[trip.id] || [];
    this.savedTimelineOrder.update(prev => ({
      ...prev,
      [trip.id]: currentOrder
    }));
    try {
      localStorage.setItem(`wanderlust_timeline_order_${trip.id}`, JSON.stringify(currentOrder));
    } catch (e) {}
    this.toast.success('💾 Timeline order saved successfully!');
  }

  resetTimelineOrder(): void {
    const trip = this.activeTrip();
    if (!trip) return;
    this.manualTimelineOrder.update(prev => {
      const copy = { ...prev };
      delete copy[trip.id];
      return copy;
    });
    this.savedTimelineOrder.update(prev => {
      const copy = { ...prev };
      delete copy[trip.id];
      return copy;
    });
    try {
      localStorage.removeItem(`wanderlust_timeline_order_${trip.id}`);
    } catch (e) {}
    this.toast.info('🔄 Timeline order reset to strict chronological date order.');
  }

  hasManualOrder(): boolean {
    const trip = this.activeTrip();
    return !!trip && !!(this.manualTimelineOrder()[trip.id] && this.manualTimelineOrder()[trip.id].length > 0);
  }

  hasSavedOrder(): boolean {
    const trip = this.activeTrip();
    return !!trip && !!(this.savedTimelineOrder()[trip.id] && this.savedTimelineOrder()[trip.id].length > 0);
  }

  hasUnsavedOrder(): boolean {
    const trip = this.activeTrip();
    if (!trip) return false;
    const current = JSON.stringify(this.manualTimelineOrder()[trip.id] || []);
    const saved = JSON.stringify(this.savedTimelineOrder()[trip.id] || []);
    return current !== saved;
  }

  loadSavedOrderForActiveTrip(tripId: string): void {
    try {
      const stored = localStorage.getItem(`wanderlust_timeline_order_${tripId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.savedTimelineOrder.update(prev => ({ ...prev, [tripId]: parsed }));
          this.manualTimelineOrder.update(prev => ({ ...prev, [tripId]: parsed }));
        }
      }
    } catch (e) {}
  }

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) { this.toast.info('Please sign in'); this.router.navigate(['/auth'], { queryParams: { returnUrl: '/trips' } }); return; }
    await this.destService.getDestinations();
    const trips = await this.tripService.loadUserTrips(user.id);
    if (trips.length > 0 && !this.activeTrip()) {
      this.activeTrip.set(trips[0]);
      this.loadSavedOrderForActiveTrip(trips[0].id);
    }
  }

  selectTrip(trip: Trip): void {
    this.activeTrip.set(trip);
    this.loadSavedOrderForActiveTrip(trip.id);
    this.viewMode.set('grid');
  }

  openCreateModal(): void { this.isEditingTrip.set(false); this.newTripTitle.set(''); this.newTripStartDate.set(''); this.newTripEndDate.set(''); this.newTripNotes.set(''); this.showCreateModal.set(true); }
  openEditTripModal(trip: Trip): void {
    this.isEditingTrip.set(true);
    this.newTripTitle.set(trip.title);
    this.newTripStartDate.set(this.formatForDateInput(trip.start_date));
    this.newTripEndDate.set(this.formatForDateInput(trip.end_date));
    this.newTripNotes.set(trip.notes || '');
    this.showCreateModal.set(true);
  }

  async saveTrip(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;
    if (!this.newTripTitle().trim()) { this.toast.warning('Please enter a trip name'); return; }
    const payload = { title: this.newTripTitle().trim(), start_date: this.newTripStartDate() || null, end_date: this.newTripEndDate() || null, notes: this.newTripNotes() || null, user_id: user.id };
    if (this.isEditingTrip() && this.activeTrip()) {
      const { error } = await this.tripService.updateTrip(this.activeTrip()!.id, payload);
      if (!error) { this.toast.success('Trip updated!'); this.activeTrip.set({ ...this.activeTrip()!, ...payload }); this.showCreateModal.set(false); } else { this.toast.error('Failed to update.'); }
    } else {
      const { data, error } = await this.tripService.createTrip(payload);
      if (!error && data) { this.toast.success('New trip created!'); this.activeTrip.set(data); this.showCreateModal.set(false); } else { this.toast.error('Failed to create.'); }
    }
  }

  async deleteCurrentTrip(): Promise<void> {
    const current = this.activeTrip();
    if (!current || !confirm('Delete "' + current.title + '" and all its data?')) return;
    const { error } = await this.tripService.deleteTrip(current.id);
    if (!error) { this.toast.info('Trip deleted.'); const r = this.tripService.trips(); this.activeTrip.set(r.length > 0 ? r[0] : null); } else { this.toast.error('Failed to delete.'); }
  }

  openTransportModal(): void {
    this.editingTransport.set(null);
    this.transMode.set('plane');
    this.transCarrier.set('');
    this.transTicketNo.set('');
    this.transPnrNo.set('');
    this.transOrigin.set('');
    this.transDestination.set('');
    this.transDepartureTime.set('');
    this.transArrivalTime.set('');
    this.transNotes.set('');
    this.transBusNo.set('');
    this.transAmount.set('');
    this.transBookingPlatform.set('');
    this.transBookingPlatformOther.set('');
    this.showDepSuggestions.set(false);
    this.showArrSuggestions.set(false);
    this.showTrainSuggestions.set(false);
    this.showTransportModal.set(true);
  }

  openEditTransportModal(tr: TripTransportation): void {
    this.editingTransport.set(tr);
    this.transMode.set(tr.mode);
    this.transCarrier.set(tr.carrier_or_name || '');
    this.transTicketNo.set(tr.ticket_no || '');
    this.transPnrNo.set(tr.pnr_no || '');
    this.transOrigin.set(tr.origin || '');
    this.transDestination.set(tr.destination_name || '');
    this.transDepartureTime.set(this.formatForDateTimeLocalInput(tr.departure_time));
    this.transArrivalTime.set(this.formatForDateTimeLocalInput(tr.arrival_time));
    this.transNotes.set(tr.notes || '');
    this.transBusNo.set(tr.bus_no || '');
    this.transAmount.set(tr.amount || '');
    this.transBookingPlatform.set(tr.booking_platform || '');
    this.transBookingPlatformOther.set(tr.booking_platform_other || '');
    this.showDepSuggestions.set(false);
    this.showArrSuggestions.set(false);
    this.showTrainSuggestions.set(false);
    this.showTransportModal.set(true);
  }

  // Reactive Station Code Autocomplete handlers
  onTransCarrierInput(val: string): void {
    this.transCarrier.set(val);
  }

  onOriginInput(val: string): void {
    this.transOrigin.set(val);
    if (val.trim().length >= 1) {
      const matches = searchSuggestions(val, this.transMode());
      this.depStationSuggestions.set(matches);
      this.showDepSuggestions.set(matches.length > 0);
    } else {
      this.showDepSuggestions.set(false);
    }
  }

  onDestinationInput(val: string): void {
    this.transDestination.set(val);
    if (val.trim().length >= 1) {
      const matches = searchSuggestions(val, this.transMode());
      this.arrStationSuggestions.set(matches);
      this.showArrSuggestions.set(matches.length > 0);
    } else {
      this.showArrSuggestions.set(false);
    }
  }

  selectDepStation(s: LocationSuggestion): void {
    this.transOrigin.set(s.name);
    this.showDepSuggestions.set(false);
  }

  selectArrStation(s: LocationSuggestion): void {
    this.transDestination.set(s.name);
    this.showArrSuggestions.set(false);
  }

  selectTrain(t: LocationSuggestion): void {
    this.transCarrier.set(t.name);
    this.showTrainSuggestions.set(false);
  }

  async addTransport(): Promise<void> {
    const trip = this.activeTrip();
    if (!trip) return;
    const payload: Partial<TripTransportation> = {
      mode: this.transMode(),
      carrier_or_name: this.transCarrier().trim() || null,
      ticket_no: this.transTicketNo().trim() || null,
      pnr_no: this.transPnrNo().trim() || null,
      origin: this.transOrigin().trim() || null,
      destination_name: this.transDestination().trim() || null,
      departure_time: this.transDepartureTime() || null,
      arrival_time: this.transArrivalTime() || null,
      notes: this.transNotes().trim() || null,
      bus_no: this.transBusNo().trim() || null,
      amount: this.transAmount().trim() || null,
      booking_platform: this.transBookingPlatform() || null,
      booking_platform_other: this.transBookingPlatform() === 'other' ? (this.transBookingPlatformOther().trim() || null) : null,
    };
    const editTr = this.editingTransport();
    if (editTr?.id) {
      const { error } = await this.tripService.updateTransportation(trip.id, editTr.id, payload);
      if (!error) { this.toast.success('Transport updated!'); this.refreshActiveTrip(trip.id); this.showTransportModal.set(false); } else { this.toast.error('Failed to update transport.'); }
    } else {
      const { data, error } = await this.tripService.addTransportation(trip.id, payload);
      if (!error && data) { this.toast.success(this.getModeConfig(this.transMode()).label + ' pass added!'); this.refreshActiveTrip(trip.id); this.showTransportModal.set(false); } else { this.toast.error('Failed to save transport.'); }
    }
  }

  async removeTransport(transportId: string): Promise<void> {
    const trip = this.activeTrip();
    if (!trip) return;
    const { error } = await this.tripService.deleteTransportation(trip.id, transportId);
    if (!error) { this.toast.info('Removed.'); this.refreshActiveTrip(trip.id); }
  }

  openStopModal(): void { this.editingStop.set(null); this.stopPlaceName.set(''); this.stopDestinationId.set(''); this.stopArrivalDate.set(''); this.stopDepartureDate.set(''); this.showStopModal.set(true); }

  async toggleDestinationCompleted(stop: TripDestination): Promise<void> {
    const trip = this.activeTrip();
    if (!trip || !stop.id) return;
    const newState = !stop.is_completed;
    const { error } = await this.tripService.updateTripDestination(trip.id, stop.id, {
      is_completed: newState
    });

    if (!error) {
      this.toast.success(newState ? `Marked ${stop.place_name} as Visited! 🎉` : `Unmarked ${stop.place_name}`);
      this.refreshActiveTrip(trip.id);
    } else {
      this.toast.error('Failed to update destination status.');
    }
  }
  openEditStopModal(stop: TripDestination): void {
    this.editingStop.set(stop);
    this.stopPlaceName.set(stop.place_name);
    this.stopDestinationId.set(stop.destination_id || '');
    this.stopArrivalDate.set(this.formatForDateTimeLocalInput(stop.arrival_date));
    this.stopDepartureDate.set(this.formatForDateTimeLocalInput(stop.departure_date));
    this.showStopModal.set(true);
  }

  onDestinationSelect(destId: string): void {
    this.stopDestinationId.set(destId);
    if (destId) { const dest = this.destService.destinations().find(d => d.id === destId); if (dest && !this.stopPlaceName()) this.stopPlaceName.set(dest.name + ', ' + dest.country); }
  }

  async addStop(): Promise<void> {
    const trip = this.activeTrip();
    if (!trip) return;
    if (!this.stopPlaceName().trim()) { this.toast.warning('Please enter a place name'); return; }
    const payload: Partial<TripDestination> = {
      place_name: this.stopPlaceName().trim(),
      destination_id: this.stopDestinationId() || null,
      arrival_date: this.stopArrivalDate() || null,
      departure_date: this.stopDepartureDate() || null
    };
    const editSt = this.editingStop();
    if (editSt?.id) {
      const { error } = await this.tripService.updateTripDestination(trip.id, editSt.id, payload);
      if (!error) { this.toast.success('Destination updated!'); this.refreshActiveTrip(trip.id); this.showStopModal.set(false); } else { this.toast.error('Failed.'); }
    } else {
      const { data, error } = await this.tripService.addTripDestination(trip.id, { ...payload, checklist_items: [], order_index: (trip.destinations?.length || 0) + 1 });
      if (!error && data) { this.toast.success(payload.place_name + ' added!'); this.refreshActiveTrip(trip.id); this.showStopModal.set(false); } else { this.toast.error('Failed.'); }
    }
  }

  async removeStop(stopId: string, placeName: string): Promise<void> {
    const trip = this.activeTrip();
    if (!trip || !confirm('Remove ' + placeName + '?')) return;
    const { error } = await this.tripService.deleteTripDestination(trip.id, stopId);
    if (!error) { this.toast.info('Removed ' + placeName + '.'); this.refreshActiveTrip(trip.id); }
  }

  openAddStayModal(): void {
    this.openStayModal(null);
  }

  openStayModal(stop: TripDestination | null): void {
    this.stayForStop.set(stop);
    this.stayOriginalStopId.set(stop?.id || null);
    this.stayName.set(stop?.stay_name || '');
    this.stayAddress.set(stop?.stay_address || '');
    this.stayBookingRef.set(stop?.stay_booking_ref || '');
    this.stayBookingPlatform.set(stop?.stay_booking_platform || '');
    this.stayBookingPlatformOther.set(stop?.stay_booking_platform_other || '');
    this.stayCheckIn.set(this.formatForDateTimeLocalInput(stop?.stay_check_in));
    this.stayCheckOut.set(this.formatForDateTimeLocalInput(stop?.stay_check_out));
    this.stayRate.set(stop?.stay_rate || '');
    this.stayStatus.set((stop?.stay_status as any) || '');
    this.stayRefundStatus.set((stop?.stay_refund_status as any) || '');
    this.stayContact.set(stop?.stay_contact || '');
    this.stayRoomType.set(stop?.stay_room_type || '');
    this.stayNotes.set(stop?.stay_notes || '');
    const dur = stop?.stay_duration || '';
    this.stayDuration.set(dur);
    if (['6 Hours', '12 Hours', '24 Hours (1 Day)', '48 Hours (2 Days)'].includes(dur)) {
      this.stayDurationPreset.set(dur);
    } else if (dur) {
      this.stayDurationPreset.set('custom');
    } else {
      this.stayDurationPreset.set('');
    }
    this.showStayModal.set(true);
  }

  onStayStopSelect(stopId: string): void {
    const trip = this.activeTrip();
    if (!trip) return;
    if (!stopId || stopId === 'none') {
      this.stayForStop.set(null);
      return;
    }
    const found = (trip.destinations || []).find(d => d.id === stopId);
    if (found) {
      this.stayForStop.set(found);
    }
  }

  async saveStay(): Promise<void> {
    const trip = this.activeTrip();
    if (!trip) return;
    if (!this.stayName().trim()) {
      this.toast.warning('Please enter a Hotel / Stay name!');
      return;
    }

    const payload: Partial<TripDestination> = {
      stay_name: this.stayName().trim() || null,
      stay_address: this.stayAddress().trim() || null,
      stay_booking_ref: this.stayBookingRef().trim() || null,
      stay_booking_platform: this.stayBookingPlatform() || null,
      stay_booking_platform_other: this.stayBookingPlatform() === 'other' ? (this.stayBookingPlatformOther().trim() || null) : null,
      stay_check_in: this.stayCheckIn() || null,
      stay_check_out: this.stayCheckOut() || null,
      stay_rate: this.stayRate().trim() || null,
      stay_status: (this.stayStatus() as any) || null,
      stay_refund_status: this.stayStatus() === 'cancelled' ? ((this.stayRefundStatus() as any) || null) : null,
      stay_contact: this.stayContact().trim() || null,
      stay_room_type: this.stayRoomType().trim() || null,
      stay_notes: this.stayNotes().trim() || null,
      stay_duration: this.stayDuration().trim() || null,
    };

    const stop = this.stayForStop();
    if (stop?.id) {
      const originalStopId = this.stayOriginalStopId();
      if (originalStopId && originalStopId !== stop.id) {
        await this.tripService.updateTripDestination(trip.id, originalStopId, {
          stay_name: null, stay_address: null, stay_booking_ref: null, stay_booking_platform: null,
          stay_booking_platform_other: null, stay_check_in: null, stay_check_out: null,
          stay_rate: null, stay_status: null, stay_refund_status: null,
          stay_contact: null, stay_room_type: null, stay_notes: null,
        });
      }
      const { error } = await this.tripService.updateTripDestination(trip.id, stop.id, payload);
      if (!error) {
        this.toast.success('Stay details saved!');
        this.refreshActiveTrip(trip.id);
        this.showStayModal.set(false);
      } else {
        this.toast.error('Failed to save stay.');
      }
    } else {
      // Create a standalone hotel stay record!
      const placeName = this.stayName().trim() || 'Hotel Stay';
      const { data, error } = await this.tripService.addTripDestination(trip.id, {
        place_name: placeName,
        arrival_date: this.stayCheckIn() || null,
        departure_date: this.stayCheckOut() || null,
        ...payload,
        checklist_items: [],
        order_index: (trip.destinations?.length || 0) + 1
      });
      if (!error && data) {
        this.toast.success(placeName + ' booking added!');
        this.refreshActiveTrip(trip.id);
        this.showStayModal.set(false);
      } else {
        this.toast.error('Failed to add stay.');
      }
    }
  }

  async removeStay(stop: TripDestination): Promise<void> {
    const trip = this.activeTrip();
    if (!trip || !stop?.id) return;
    const { error } = await this.tripService.updateTripDestination(trip.id, stop.id, {
      stay_name: null, stay_address: null, stay_booking_ref: null, stay_booking_platform: null,
      stay_booking_platform_other: null, stay_check_in: null, stay_check_out: null,
      stay_rate: null, stay_status: null, stay_refund_status: null,
      stay_contact: null, stay_room_type: null, stay_notes: null,
    });
    if (!error) { this.toast.info('Stay removed.'); this.refreshActiveTrip(trip.id); }
  }

  // =================== ENTRY TICKET ===================
  openTicketModal(stop: TripDestination): void {
    this.ticketForStop.set(stop);
    this.ticketRequired.set(!!stop.ticket_required);
    this.ticketUrl.set(stop.ticket_booking_url || '');
    this.ticketRef.set(stop.ticket_booking_ref || '');
    this.ticketPrice.set(stop.ticket_price || '');
    this.ticketTimingNotes.set(stop.ticket_timing_notes || '');
    this.showTicketModal.set(true);
  }

  async saveTicket(): Promise<void> {
    const trip = this.activeTrip();
    const stop = this.ticketForStop();
    if (!trip || !stop?.id) return;
    const payload: Partial<TripDestination> = {
      ticket_required: this.ticketRequired(),
      ticket_booking_url: this.ticketUrl().trim() || null,
      ticket_booking_ref: this.ticketRef().trim() || null,
      ticket_price: this.ticketPrice().trim() || null,
      ticket_timing_notes: this.ticketTimingNotes().trim() || null,
    };
    const { error } = await this.tripService.updateTripDestination(trip.id, stop.id, payload);
    if (!error) { this.toast.success('🎟️ Entry ticket details saved!'); this.refreshActiveTrip(trip.id); this.showTicketModal.set(false); } else { this.toast.error('Failed to save ticket.'); }
  }

  async removeTicket(stop: TripDestination): Promise<void> {
    const trip = this.activeTrip();
    if (!trip || !stop?.id) return;
    const { error } = await this.tripService.updateTripDestination(trip.id, stop.id, { ticket_required: null, ticket_booking_url: null, ticket_booking_ref: null, ticket_price: null, ticket_timing_notes: null });
    if (!error) { this.toast.info('Entry ticket details removed.'); this.refreshActiveTrip(trip.id); }
  }

  setChecklistInput(stopId: string, val: string): void { this.newSpotChecklistInput.update(prev => ({ ...prev, [stopId]: val })); }
  getChecklistInput(stopId: string): string { return this.newSpotChecklistInput()[stopId] || ''; }

  async addChecklistItem(stop: TripDestination): Promise<void> {
    const text = this.getChecklistInput(stop.id!).trim();
    if (!text) { this.toast.warning('Enter a task first!'); return; }
    if (!stop.id) return;
    const newItem: TripChecklistItem = { id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 6), title: text, is_completed: false };
    const updatedList = [...(stop.checklist_items || []), newItem];
    const { error } = await this.tripService.updateChecklist(this.activeTrip()!.id, stop.id, updatedList);
    if (!error) { this.setChecklistInput(stop.id, ''); this.refreshActiveTrip(this.activeTrip()!.id); this.toast.success('Task added!'); } else { this.toast.error('Failed to add task.'); }
  }

  async toggleChecklistItem(stop: TripDestination, itemId: string, completed: boolean): Promise<void> {
    if (!stop.id) return;
    const updatedList = (stop.checklist_items || []).map(i => i.id === itemId ? { ...i, is_completed: completed } : i);
    await this.tripService.updateChecklist(this.activeTrip()!.id, stop.id, updatedList);
    this.refreshActiveTrip(this.activeTrip()!.id);
  }

  async removeChecklistItem(stop: TripDestination, itemId: string): Promise<void> {
    if (!stop.id) return;
    const updatedList = (stop.checklist_items || []).filter(i => i.id !== itemId);
    await this.tripService.updateChecklist(this.activeTrip()!.id, stop.id, updatedList);
    this.refreshActiveTrip(this.activeTrip()!.id);
  }

  togglePanel(map: 'stay' | 'checklist', stopId: string): void {
    if (map === 'stay') this.expandedStayPanels.update(prev => ({ ...prev, [stopId]: !prev[stopId] }));
    else this.expandedChecklistPanels.update(prev => ({ ...prev, [stopId]: !prev[stopId] }));
  }

  isPanelOpen(map: 'stay' | 'checklist', stopId: string): boolean {
    return map === 'stay' ? !!this.expandedStayPanels()[stopId] : !!this.expandedChecklistPanels()[stopId];
  }

  getPlatformLabel(val: string): string { return BOOKING_PLATFORMS.find(p => p.value === val)?.label || val; }
  getPlatformIcon(val: string): string { return BOOKING_PLATFORMS.find(p => p.value === val)?.icon || '🏠'; }
  getTransPlatformLabel(val: string): string { return TRANSPORT_BOOKING_PLATFORMS.find(p => p.value === val)?.label || BOOKING_PLATFORMS.find(p => p.value === val)?.label || val; }
  getTransPlatformIcon(val: string): string { return TRANSPORT_BOOKING_PLATFORMS.find(p => p.value === val)?.icon || BOOKING_PLATFORMS.find(p => p.value === val)?.icon || '🌐'; }
  getModeConfig(mode: TransportationMode) { return TRANSPORT_MODES.find(m => m.value === mode) || { label: mode, icon: '✈️' }; }

  /** Helper to format any date string into YYYY-MM-DD for HTML <input type="date"> */
  formatForDateInput(val: string | null | undefined): string {
    if (!val) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val.substring(0, 10);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return val.substring(0, 10);
    }
  }

  /** Helper to format any date/timestamp ISO string into YYYY-MM-DDTHH:mm for HTML <input type="datetime-local"> */
  formatForDateTimeLocalInput(val: string | null | undefined): string {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) {
        return val.replace(' ', 'T').substring(0, 16);
      }
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return val.replace(' ', 'T').substring(0, 16);
    }
  }

  /** Compute human-readable duration between two datetime-local strings */
  getDormitoryDuration(checkIn: string | null | undefined, checkOut: string | null | undefined): string {
    if (!checkIn || !checkOut) return '';
    const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    if (isNaN(diffMs) || diffMs <= 0) return '';
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    if (mins === 0) return `${hrs} hrs`;
    return `${hrs} hrs ${mins} mins`;
  }

  getCompletedCount(stop: TripDestination): number { return this.getTasksOnly(stop.checklist_items).filter(i => i.is_completed).length; }

  private refreshActiveTrip(tripId: string): void {
    const updated = this.tripService.trips().find(t => t.id === tripId);
    if (updated) this.activeTrip.set(updated);
  }

  scrollToSection(sectionId: string): void {
    // If in timeline view, switch back to grid so sections are visible
    if (this.viewMode() === 'timeline') {
      this.viewMode.set('grid');
    }
    // Use a tiny timeout to allow grid to render before scrolling
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Brief highlight flash
        el.classList.add('section-highlight');
        setTimeout(() => el.classList.remove('section-highlight'), 900);
      }
    }, 80);
  }

  scrollToElement(elementId: string): void {
    if (this.viewMode() === 'timeline') {
      this.viewMode.set('grid');
    }
    if (elementId.startsWith('stop-card-')) {
      const stopId = elementId.replace('stop-card-', '');
      this.expandedStops.update(prev => new Set(prev).add(stopId));
    }
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('card-highlight');
        setTimeout(() => el.classList.remove('card-highlight'), 1200);
      }
    }, 80);
  }
}


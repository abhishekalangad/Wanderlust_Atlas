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
  { value: 'oyo', label: 'OYO Rooms', icon: '🔶' },
  { value: 'agoda', label: 'Agoda', icon: '🟤' },
  { value: 'expedia', label: 'Expedia', icon: '🔷' },
  { value: 'cleartrip', label: 'Cleartrip', icon: '⚡' },
  { value: 'direct', label: 'Direct Booking', icon: '📞' },
  { value: 'other', label: 'Other / Walk-in', icon: '🏠' },
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
  transOrigin = signal<string>('');
  transDestination = signal<string>('');
  transDepartureTime = signal<string>('');
  transArrivalTime = signal<string>('');
  transNotes = signal<string>('');

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
  stayCheckIn = signal<string>('');
  stayCheckOut = signal<string>('');

  // Entry Ticket form signals
  ticketRequired = signal<boolean>(false);
  ticketUrl = signal<string>('');
  ticketRef = signal<string>('');
  ticketPrice = signal<string>('');
  ticketTimingNotes = signal<string>('');

  newSpotChecklistInput = signal<Record<string, string>>({});

  getTasksOnly(items?: TripChecklistItem[]): TripChecklistItem[] {
    return (items || []).filter(i => !i.id.startsWith('__meta_'));
  }

  activeTripChecklistStats = computed(() => {
    const trip = this.activeTrip();
    if (!trip?.destinations) return { completed: 0, total: 0, percent: 0 };
    let completed = 0, total = 0;
    trip.destinations.forEach(d => {
      const tasks = this.getTasksOnly(d.checklist_items);
      total += tasks.length;
      completed += tasks.filter(i => i.is_completed).length;
    });
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  });

  totalStaysAdded = computed(() => {
    const trip = this.activeTrip();
    if (!trip?.destinations) return 0;
    return trip.destinations.filter(d => d.stay_name).length;
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
    }
  });

  // Manual override order for drag-reordered events (keyed by trip id)
  manualTimelineOrder = signal<Record<string, string[]>>({});
  isDraggingOver = signal<string | null>(null);
  draggingId = signal<string | null>(null);

  timelineEvents = computed(() => {
    const trip = this.activeTrip();
    if (!trip) return [];
    const events: any[] = [];

    (trip.transportation || []).forEach(tr => {
      const cfg = this.getModeConfig(tr.mode);
      // Use departure_time as primary, fall back to arrival_time
      const dateVal = tr.departure_time || tr.arrival_time || trip.start_date || '';
      const ts = dateVal ? new Date(dateVal).getTime() : null;
      events.push({
        id: 'trans-' + tr.id,
        rawDate: dateVal,
        ts,
        type: 'transport',
        typePriority: 0, // transports come first when dates match
        icon: cfg.icon,
        displayDate: dateVal
          ? new Date(dateVal).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'Flexible',
        title: tr.carrier_or_name || cfg.label + ' Pass',
        subtitle: (tr.origin || 'Departure') + ' ➔ ' + (tr.destination_name || 'Arrival'),
        refText: tr.ticket_no ? '🎫 ' + tr.ticket_no : null,
        notes: tr.notes,
        rawTransport: tr,
      });
    });

    (trip.destinations || []).forEach((stop, idx) => {
      // Use arrival_date as the primary date for the destination
      const dateVal = stop.arrival_date || stop.departure_date || trip.start_date || '';
      const ts = dateVal ? new Date(dateVal).getTime() : null;
      events.push({
        id: 'stop-' + stop.id,
        rawDate: dateVal,
        ts,
        type: 'destination',
        typePriority: 1, // destinations come after transports on the same date
        icon: '📍',
        displayDate: dateVal
          ? new Date(dateVal).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
          : 'Stop #' + (idx + 1),
        title: stop.place_name,
        subtitle: stop.stay_name ? '🏨 ' + stop.stay_name : '📍 Destination Stop',
        refText: stop.stay_booking_ref ? '🎫 ' + stop.stay_booking_ref : null,
        notes: stop.stay_address || null,
        checklist: stop.checklist_items || [],
        rawStop: stop,
      });
    });

    // Default chronological sort: date ASC, then transport before destination on same date
    events.sort((a, b) => {
      if (!a.ts && !b.ts) return a.typePriority - b.typePriority;
      if (!a.ts) return 1;  // undated go to end
      if (!b.ts) return -1;
      if (a.ts !== b.ts) return a.ts - b.ts; // chronological
      return a.typePriority - b.typePriority; // same timestamp: transport first
    });

    // Apply manual drag-reorder if user has reordered this trip
    const manualOrder = this.manualTimelineOrder()[trip.id];
    if (manualOrder && manualOrder.length === events.length) {
      const eventMap = new Map(events.map(e => [e.id, e]));
      const reordered = manualOrder.map(id => eventMap.get(id)).filter(Boolean);
      if (reordered.length === events.length) return reordered;
    }

    return events;
  });

  generateTimeline(): void { this.viewMode.set('timeline'); this.toast.success('Timeline generated — drag to reorder!'); }

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

  resetTimelineOrder(): void {
    const trip = this.activeTrip();
    if (!trip) return;
    this.manualTimelineOrder.update(prev => {
      const copy = { ...prev };
      delete copy[trip.id];
      return copy;
    });
    this.toast.info('Timeline reset to chronological order.');
  }

  hasManualOrder(): boolean {
    const trip = this.activeTrip();
    return !!trip && !!(this.manualTimelineOrder()[trip.id]);
  }

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) { this.toast.info('Please sign in'); this.router.navigate(['/auth'], { queryParams: { returnUrl: '/trips' } }); return; }
    await this.destService.getDestinations();
    const trips = await this.tripService.loadUserTrips(user.id);
    if (trips.length > 0 && !this.activeTrip()) this.activeTrip.set(trips[0]);
  }

  selectTrip(trip: Trip): void { this.activeTrip.set(trip); this.viewMode.set('grid'); }

  openCreateModal(): void { this.isEditingTrip.set(false); this.newTripTitle.set(''); this.newTripStartDate.set(''); this.newTripEndDate.set(''); this.newTripNotes.set(''); this.showCreateModal.set(true); }
  openEditTripModal(trip: Trip): void { this.isEditingTrip.set(true); this.newTripTitle.set(trip.title); this.newTripStartDate.set(trip.start_date || ''); this.newTripEndDate.set(trip.end_date || ''); this.newTripNotes.set(trip.notes || ''); this.showCreateModal.set(true); }

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
    this.transOrigin.set('');
    this.transDestination.set('');
    this.transDepartureTime.set('');
    this.transArrivalTime.set('');
    this.transNotes.set('');
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
    this.transOrigin.set(tr.origin || '');
    this.transDestination.set(tr.destination_name || '');
    this.transDepartureTime.set(tr.departure_time || '');
    this.transArrivalTime.set(tr.arrival_time || '');
    this.transNotes.set(tr.notes || '');
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
    const payload: Partial<TripTransportation> = { mode: this.transMode(), carrier_or_name: this.transCarrier().trim() || null, ticket_no: this.transTicketNo().trim() || null, origin: this.transOrigin().trim() || null, destination_name: this.transDestination().trim() || null, departure_time: this.transDepartureTime() || null, arrival_time: this.transArrivalTime() || null, notes: this.transNotes().trim() || null };
    const editTr = this.editingTransport();
    if (editTr?.id) {
      const { error } = await this.tripService.updateTransportation(trip.id, editTr.id, payload);
      if (!error) { this.toast.success('Transport updated!'); this.refreshActiveTrip(trip.id); this.showTransportModal.set(false); } else { this.toast.error('Failed.'); }
    } else {
      const { data, error } = await this.tripService.addTransportation(trip.id, payload);
      if (!error && data) { this.toast.success(this.getModeConfig(this.transMode()).label + ' pass added!'); this.refreshActiveTrip(trip.id); this.showTransportModal.set(false); } else { this.toast.error('Failed.'); }
    }
  }

  async removeTransport(transportId: string): Promise<void> {
    const trip = this.activeTrip();
    if (!trip) return;
    const { error } = await this.tripService.deleteTransportation(trip.id, transportId);
    if (!error) { this.toast.info('Removed.'); this.refreshActiveTrip(trip.id); }
  }

  openStopModal(): void { this.editingStop.set(null); this.stopPlaceName.set(''); this.stopDestinationId.set(''); this.stopArrivalDate.set(''); this.stopDepartureDate.set(''); this.showStopModal.set(true); }
  openEditStopModal(stop: TripDestination): void { this.editingStop.set(stop); this.stopPlaceName.set(stop.place_name); this.stopDestinationId.set(stop.destination_id || ''); this.stopArrivalDate.set(stop.arrival_date || ''); this.stopDepartureDate.set(stop.departure_date || ''); this.showStopModal.set(true); }

  onDestinationSelect(destId: string): void {
    this.stopDestinationId.set(destId);
    if (destId) { const dest = this.destService.destinations().find(d => d.id === destId); if (dest && !this.stopPlaceName()) this.stopPlaceName.set(dest.name + ', ' + dest.country); }
  }

  async addStop(): Promise<void> {
    const trip = this.activeTrip();
    if (!trip) return;
    if (!this.stopPlaceName().trim()) { this.toast.warning('Please enter a place name'); return; }
    const payload: Partial<TripDestination> = { place_name: this.stopPlaceName().trim(), destination_id: this.stopDestinationId() || null, arrival_date: this.stopArrivalDate() || null, departure_date: this.stopDepartureDate() || null };
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

  openStayModal(stop: TripDestination): void { this.stayForStop.set(stop); this.stayName.set(stop.stay_name || ''); this.stayAddress.set(stop.stay_address || ''); this.stayBookingRef.set(stop.stay_booking_ref || ''); this.stayBookingPlatform.set(stop.stay_booking_platform || ''); this.stayCheckIn.set(stop.stay_check_in || ''); this.stayCheckOut.set(stop.stay_check_out || ''); this.showStayModal.set(true); }

  async saveStay(): Promise<void> {
    const trip = this.activeTrip();
    const stop = this.stayForStop();
    if (!trip || !stop?.id) return;
    const payload: Partial<TripDestination> = { stay_name: this.stayName().trim() || null, stay_address: this.stayAddress().trim() || null, stay_booking_ref: this.stayBookingRef().trim() || null, stay_booking_platform: this.stayBookingPlatform() || null, stay_check_in: this.stayCheckIn() || null, stay_check_out: this.stayCheckOut() || null };
    const { error } = await this.tripService.updateTripDestination(trip.id, stop.id, payload);
    if (!error) { this.toast.success('Stay details saved!'); this.refreshActiveTrip(trip.id); this.showStayModal.set(false); } else { this.toast.error('Failed to save stay.'); }
  }

  async removeStay(stop: TripDestination): Promise<void> {
    const trip = this.activeTrip();
    if (!trip || !stop?.id) return;
    const { error } = await this.tripService.updateTripDestination(trip.id, stop.id, { stay_name: null, stay_address: null, stay_booking_ref: null, stay_booking_platform: null, stay_check_in: null, stay_check_out: null });
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
  getModeConfig(mode: TransportationMode) { return TRANSPORT_MODES.find(m => m.value === mode) || { label: mode, icon: '✈️' }; }

  getCompletedCount(stop: TripDestination): number { return this.getTasksOnly(stop.checklist_items).filter(i => i.is_completed).length; }

  private refreshActiveTrip(tripId: string): void {
    const updated = this.tripService.trips().find(t => t.id === tripId);
    if (updated) this.activeTrip.set(updated);
  }
}


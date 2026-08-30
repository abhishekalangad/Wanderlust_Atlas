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

  // Selected / Active Trip Detail
  activeTrip = signal<Trip | null>(null);

  // Modals & UI Toggles
  showCreateModal = signal<boolean>(false);
  showTransportModal = signal<boolean>(false);
  showStopModal = signal<boolean>(false);
  isEditingTrip = signal<boolean>(false);
  viewMode = signal<'grid' | 'timeline'>('grid');

  editingTransport = signal<TripTransportation | null>(null);
  editingStop = signal<TripDestination | null>(null);

  // Form Fields - New Trip
  newTripTitle = signal<string>('');
  newTripStartDate = signal<string>('');
  newTripEndDate = signal<string>('');
  newTripNotes = signal<string>('');

  // Form Fields - Transport
  transMode = signal<TransportationMode>('plane');
  transCarrier = signal<string>('');
  transTicketNo = signal<string>('');
  transOrigin = signal<string>('');
  transDestination = signal<string>('');
  transDepartureTime = signal<string>('');
  transArrivalTime = signal<string>('');
  transNotes = signal<string>('');

  // Form Fields - Place Stop & Stay
  stopPlaceName = signal<string>('');
  stopDestinationId = signal<string>('');
  stopArrivalDate = signal<string>('');
  stopDepartureDate = signal<string>('');
  stopStayName = signal<string>('');
  stopStayAddress = signal<string>('');
  stopStayBookingRef = signal<string>('');

  // New Checklist item per stop
  newSpotChecklistInput = signal<Record<string, string>>({});

  // Computed Progress stats
  activeTripChecklistStats = computed(() => {
    const trip = this.activeTrip();
    if (!trip || !trip.destinations) return { completed: 0, total: 0, percent: 0 };
    let completed = 0;
    let total = 0;
    trip.destinations.forEach(d => {
      if (d.checklist_items) {
        total += d.checklist_items.length;
        completed += d.checklist_items.filter(item => item.is_completed).length;
      }
    });
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  });

  // Dynamic Mode Config for Labels & Placeholders
  activeModeConfig = computed(() => {
    const mode = this.transMode();
    switch (mode) {
      case 'plane':
        return {
          nameLabel: 'Airline & Flight No. (Optional)',
          namePlaceholder: 'e.g. Emirates EK202, Indigo 6E-123',
          ticketLabel: 'PNR / Flight Ticket Ref (Optional)',
          ticketPlaceholder: 'e.g. PNR #894204',
          originLabel: 'Departure Airport / Origin (Optional)',
          originPlaceholder: 'e.g. Tokyo Narita Airport (NRT)',
          destLabel: 'Arrival Airport / Destination (Optional)',
          destPlaceholder: 'e.g. Paris Charles de Gaulle (CDG)',
          notesLabel: 'Seat No / Terminal / Gate Details (Optional)',
          notesPlaceholder: 'e.g. Seat 14A Window, Terminal 3 Gate 12',
          modalTitle: '✈️ Add Flight / Aeroplane Pass'
        };
      case 'train':
        return {
          nameLabel: 'Train Name & Number (Optional)',
          namePlaceholder: 'e.g. Vande Bharat Express #20608',
          ticketLabel: 'IRCTC PNR / Ticket Number (Optional)',
          ticketPlaceholder: 'e.g. PNR #4829103951',
          originLabel: 'Departure Railway Station (Optional)',
          originPlaceholder: 'e.g. New Delhi Railway Station (NDLS)',
          destLabel: 'Arrival Railway Station (Optional)',
          destPlaceholder: 'e.g. Varanasi Junction (BSB)',
          notesLabel: 'Coach & Seat / Berth Details (Optional)',
          notesPlaceholder: 'e.g. Coach B3, Berth 24 Side Lower',
          modalTitle: '🚆 Add Train Pass'
        };
      case 'bus':
        return {
          nameLabel: 'Bus Operator & Service Type (Optional)',
          namePlaceholder: 'e.g. KSRTC Swift / IntrCity Volvo AC Sleeper',
          ticketLabel: 'Bus Ticket / Booking Ref (Optional)',
          ticketPlaceholder: 'e.g. RedBus Ticket #RB938201',
          originLabel: 'Boarding Bus Station / Stop (Optional)',
          originPlaceholder: 'e.g. Majestic Bus Stand, Stand 4',
          destLabel: 'Drop-off Bus Stop / Terminal (Optional)',
          destPlaceholder: 'e.g. MG Road Bus Stop',
          notesLabel: 'Seat No / Boarding Point Notes (Optional)',
          notesPlaceholder: 'e.g. Seat 12 Upper Deck, Near Main Gate',
          modalTitle: '🚌 Add Bus Pass'
        };
      case 'car':
        return {
          nameLabel: 'Car Model / Rental Agency Name (Optional)',
          namePlaceholder: 'e.g. Rental Hertz SUV / Self Drive Thar',
          ticketLabel: 'Vehicle License Plate / Rental Ref (Optional)',
          ticketPlaceholder: 'e.g. Plate #KA-01-AB-1234 / Hertz #93820',
          originLabel: 'Starting Point / Pick-up Location (Optional)',
          originPlaceholder: 'e.g. Airport Car Rental Counter',
          destLabel: 'Destination / Drop-off Location (Optional)',
          destPlaceholder: 'e.g. Resort Valet Parking',
          notesLabel: 'Driver Details / Fuel / Toll Pass Notes (Optional)',
          notesPlaceholder: 'e.g. Driver Ramesh (+91-9876543210), Fastag toll active',
          modalTitle: '🚗 Add Car / Road Trip Details'
        };
      case 'ship':
        return {
          nameLabel: 'Ship / Cruise Line Name (Optional)',
          namePlaceholder: 'e.g. Cordelia Cruises / Express Ferry',
          ticketLabel: 'Cabin / Ticket Reference No. (Optional)',
          ticketPlaceholder: 'e.g. Cruise Booking #CR-93820',
          originLabel: 'Boarding Port / Departure Pier (Optional)',
          originPlaceholder: 'e.g. Boarding Pier #4, Mumbai Port',
          destLabel: 'Arrival Port / Pier (Optional)',
          destPlaceholder: 'e.g. Mormugao Port, Goa',
          notesLabel: 'Cabin Number & Deck Details (Optional)',
          notesPlaceholder: 'e.g. Ocean View Cabin #402, Deck 6',
          modalTitle: '🚢 Add Ship / Cruise / Ferry Pass'
        };
      case 'bike':
        return {
          nameLabel: 'Motorbike / Bicycle Model (Optional)',
          namePlaceholder: 'e.g. Royal Enfield Himalayan 450',
          ticketLabel: 'Bike Registration / Rental Contract Ref (Optional)',
          ticketPlaceholder: 'e.g. Rental Agreement #BR-502',
          originLabel: 'Starting City / Rental Pick-up (Optional)',
          originPlaceholder: 'e.g. Manali Bike Rental Hub',
          destLabel: 'Destination / Bike Drop-off (Optional)',
          destPlaceholder: 'e.g. Leh Motorbike Service Depot',
          notesLabel: 'Riding Gear & Luggage Notes (Optional)',
          notesPlaceholder: 'e.g. Helmets & waterproof pannier bags provided',
          modalTitle: '🏍️ Add Motorbike / Bike Details'
        };
    }
  });

  // Computed Timeline Events Signal
  timelineEvents = computed(() => {
    const trip = this.activeTrip();
    if (!trip) return [];

    const events: Array<{
      id: string;
      rawDate: string;
      displayDate: string;
      type: 'transport' | 'destination';
      icon: string;
      title: string;
      subtitle: string;
      refText?: string;
      notes?: string;
      checklist?: TripChecklistItem[];
      rawTransport?: TripTransportation;
      rawStop?: TripDestination;
    }> = [];

    // Add transportation passes
    (trip.transportation || []).forEach(tr => {
      const modeConf = this.getModeConfig(tr.mode);
      const dateVal = tr.departure_time || tr.arrival_time || trip.start_date || '';
      events.push({
        id: `trans-${tr.id}`,
        rawDate: dateVal,
        displayDate: dateVal ? new Date(dateVal).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Flexible Pass',
        type: 'transport',
        icon: modeConf.icon,
        title: tr.carrier_or_name || `${modeConf.label} Pass`,
        subtitle: `Route: ${tr.origin || 'Departure'} ➔ ${tr.destination_name || 'Arrival'}`,
        refText: tr.ticket_no ? `🎫 Ticket: ${tr.ticket_no}` : undefined,
        notes: tr.notes || undefined,
        rawTransport: tr,
      });
    });

    // Add destination stops
    (trip.destinations || []).forEach((stop, index) => {
      const dateVal = stop.arrival_date || stop.departure_date || trip.start_date || '';
      events.push({
        id: `stop-${stop.id}`,
        rawDate: dateVal,
        displayDate: dateVal ? new Date(dateVal).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `Stop #${index + 1}`,
        type: 'destination',
        icon: '📍',
        title: stop.place_name,
        subtitle: stop.stay_name ? `🏨 Stay: ${stop.stay_name}` : '📍 Destination Stop',
        refText: stop.stay_booking_ref ? `🎫 Booking Ref: ${stop.stay_booking_ref}` : undefined,
        notes: stop.stay_address ? `📍 ${stop.stay_address}` : undefined,
        checklist: stop.checklist_items || [],
        rawStop: stop,
      });
    });

    // Sort chronologically by date
    return events.sort((a, b) => {
      if (!a.rawDate) return 1;
      if (!b.rawDate) return -1;
      return new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime();
    });
  });

  generateTimeline(): void {
    this.viewMode.set('timeline');
    this.toast.success('⚡ Visual Timeline generated successfully!');
  }

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) {
      this.toast.info('Please sign in to plan your trips');
      this.router.navigate(['/auth'], { queryParams: { returnUrl: '/trips' } });
      return;
    }
    await this.destService.getDestinations();
    const trips = await this.tripService.loadUserTrips(user.id);
    if (trips.length > 0 && !this.activeTrip()) {
      this.activeTrip.set(trips[0]);
    }
  }

  selectTrip(trip: Trip): void {
    this.activeTrip.set(trip);
  }

  openCreateModal(): void {
    this.isEditingTrip.set(false);
    this.newTripTitle.set('');
    this.newTripStartDate.set('');
    this.newTripEndDate.set('');
    this.newTripNotes.set('');
    this.showCreateModal.set(true);
  }

  openEditTripModal(trip: Trip): void {
    this.isEditingTrip.set(true);
    this.newTripTitle.set(trip.title);
    this.newTripStartDate.set(trip.start_date || '');
    this.newTripEndDate.set(trip.end_date || '');
    this.newTripNotes.set(trip.notes || '');
    this.showCreateModal.set(true);
  }

  async saveTrip(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    if (!this.newTripTitle().trim()) {
      this.toast.warning('Please enter a trip name');
      return;
    }

    const payload = {
      title: this.newTripTitle().trim(),
      start_date: this.newTripStartDate() || null,
      end_date: this.newTripEndDate() || null,
      notes: this.newTripNotes() || null,
      user_id: user.id
    };

    if (this.isEditingTrip() && this.activeTrip()) {
      const { error } = await this.tripService.updateTrip(this.activeTrip()!.id, payload);
      if (!error) {
        this.toast.success('Trip updated successfully!');
        this.activeTrip.set({ ...this.activeTrip()!, ...payload });
        this.showCreateModal.set(false);
      } else {
        this.toast.error('Failed to update trip.');
      }
    } else {
      const { data, error } = await this.tripService.createTrip(payload);
      if (!error && data) {
        this.toast.success('🎉 New trip created!');
        this.activeTrip.set(data);
        this.showCreateModal.set(false);
      } else {
        this.toast.error('Failed to create trip.');
      }
    }
  }

  async deleteCurrentTrip(): Promise<void> {
    const current = this.activeTrip();
    if (!current) return;
    if (!confirm(`Delete "${current.title}" and all its transport & itinerary passes?`)) return;

    const { error } = await this.tripService.deleteTrip(current.id);
    if (!error) {
      this.toast.info('Trip deleted.');
      const remaining = this.tripService.trips();
      this.activeTrip.set(remaining.length > 0 ? remaining[0] : null);
    } else {
      this.toast.error('Failed to delete trip.');
    }
  }

  // Transportation Actions
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
    this.showTransportModal.set(true);
  }

  async addTransport(): Promise<void> {
    const trip = this.activeTrip();
    if (!trip) return;

    const payload: Partial<TripTransportation> = {
      mode: this.transMode(),
      carrier_or_name: this.transCarrier().trim() || null,
      ticket_no: this.transTicketNo().trim() || null,
      origin: this.transOrigin().trim() || null,
      destination_name: this.transDestination().trim() || null,
      departure_time: this.transDepartureTime() || null,
      arrival_time: this.transArrivalTime() || null,
      notes: this.transNotes().trim() || null,
    };

    const editTr = this.editingTransport();

    if (editTr && editTr.id) {
      // Update transport
      const { error } = await this.tripService.updateTransportation(trip.id, editTr.id, payload);

      if (!error) {
        this.toast.success('✏️ Transport details updated!');
        const updatedTrip = this.tripService.trips().find(t => t.id === trip.id);
        if (updatedTrip) this.activeTrip.set(updatedTrip);
        this.showTransportModal.set(false);
      } else {
        this.toast.error('Failed to update transport.');
      }
    } else {
      // Create new transport
      const { data, error } = await this.tripService.addTransportation(trip.id, payload);
      if (!error && data) {
        this.toast.success(`Added ${this.getModeConfig(this.transMode()).label} details!`);
        const updatedTrip = this.tripService.trips().find(t => t.id === trip.id);
        if (updatedTrip) this.activeTrip.set(updatedTrip);
        this.showTransportModal.set(false);
      } else {
        this.toast.error('Failed to add transport info.');
      }
    }
  }

  async removeTransport(transportId: string): Promise<void> {
    const trip = this.activeTrip();
    if (!trip) return;

    const { error } = await this.tripService.deleteTransportation(trip.id, transportId);
    if (!error) {
      this.toast.info('Transport details removed.');
      const updatedTrip = this.tripService.trips().find(t => t.id === trip.id);
      if (updatedTrip) this.activeTrip.set(updatedTrip);
    }
  }

  // Place Stops & Stay Actions
  openStopModal(): void {
    this.editingStop.set(null);
    this.stopPlaceName.set('');
    this.stopDestinationId.set('');
    this.stopArrivalDate.set('');
    this.stopDepartureDate.set('');
    this.stopStayName.set('');
    this.stopStayAddress.set('');
    this.stopStayBookingRef.set('');
    this.showStopModal.set(true);
  }

  openEditStopModal(stop: TripDestination): void {
    this.editingStop.set(stop);
    this.stopPlaceName.set(stop.place_name);
    this.stopDestinationId.set(stop.destination_id || '');
    this.stopArrivalDate.set(stop.arrival_date || '');
    this.stopDepartureDate.set(stop.departure_date || '');
    this.stopStayName.set(stop.stay_name || '');
    this.stopStayAddress.set(stop.stay_address || '');
    this.stopStayBookingRef.set(stop.stay_booking_ref || '');
    this.showStopModal.set(true);
  }

  onDestinationSelect(destId: string): void {
    this.stopDestinationId.set(destId);
    if (destId) {
      const dest = this.destService.destinations().find(d => d.id === destId);
      if (dest && !this.stopPlaceName()) {
        this.stopPlaceName.set(`${dest.name}, ${dest.country}`);
      }
    }
  }

  async addStop(): Promise<void> {
    const trip = this.activeTrip();
    if (!trip) return;

    if (!this.stopPlaceName().trim()) {
      this.toast.warning('Please enter a place name');
      return;
    }

    const payload: Partial<TripDestination> = {
      place_name: this.stopPlaceName().trim(),
      destination_id: this.stopDestinationId() || null,
      arrival_date: this.stopArrivalDate() || null,
      departure_date: this.stopDepartureDate() || null,
      stay_name: this.stopStayName().trim() || null,
      stay_address: this.stopStayAddress().trim() || null,
      stay_booking_ref: this.stopStayBookingRef().trim() || null,
    };

    const editSt = this.editingStop();

    if (editSt && editSt.id) {
      // Update stop
      const { error } = await this.tripService.updateTripDestination(trip.id, editSt.id, payload);
      if (!error) {
        this.toast.success('✏️ Place stop updated!');
        const updatedTrip = this.tripService.trips().find(t => t.id === trip.id);
        if (updatedTrip) this.activeTrip.set(updatedTrip);
        this.showStopModal.set(false);
      } else {
        this.toast.error('Failed to update stop.');
      }
    } else {
      // Create new stop
      const newPayload = { ...payload, checklist_items: [], order_index: (trip.destinations?.length || 0) + 1 };
      const { data, error } = await this.tripService.addTripDestination(trip.id, newPayload);
      if (!error && data) {
        this.toast.success(`📍 ${payload.place_name} added to your itinerary!`);
        const updatedTrip = this.tripService.trips().find(t => t.id === trip.id);
        if (updatedTrip) this.activeTrip.set(updatedTrip);
        this.showStopModal.set(false);
      } else {
        this.toast.error('Failed to add place stop.');
      }
    }
  }

  async removeStop(stopId: string, placeName: string): Promise<void> {
    const trip = this.activeTrip();
    if (!trip) return;

    const { error } = await this.tripService.deleteTripDestination(trip.id, stopId);
    if (!error) {
      this.toast.info(`Removed ${placeName} from itinerary.`);
      const updatedTrip = this.tripService.trips().find(t => t.id === trip.id);
      if (updatedTrip) this.activeTrip.set(updatedTrip);
    }
  }

  // Spot Checklist Actions
  setChecklistInput(stopId: string, val: string): void {
    this.newSpotChecklistInput.update(prev => ({ ...prev, [stopId]: val }));
  }

  getChecklistInput(stopId: string): string {
    return this.newSpotChecklistInput()[stopId] || '';
  }

  async addChecklistItem(stop: TripDestination): Promise<void> {
    const text = this.getChecklistInput(stop.id!).trim();
    if (!text || !stop.id) return;

    const currentList = stop.checklist_items || [];
    const newItem: TripChecklistItem = {
      id: Date.now().toString(),
      title: text,
      is_completed: false,
    };

    const updatedList = [...currentList, newItem];
    const { error } = await this.tripService.updateChecklist(this.activeTrip()!.id, stop.id, updatedList);
    if (!error) {
      this.setChecklistInput(stop.id, '');
      const updatedTrip = this.tripService.trips().find(t => t.id === this.activeTrip()!.id);
      if (updatedTrip) this.activeTrip.set(updatedTrip);
    }
  }

  async toggleChecklistItem(stop: TripDestination, itemId: string, completed: boolean): Promise<void> {
    if (!stop.id) return;
    const currentList = stop.checklist_items || [];
    const updatedList = currentList.map(item => item.id === itemId ? { ...item, is_completed: completed } : item);

    await this.tripService.updateChecklist(this.activeTrip()!.id, stop.id, updatedList);
    const updatedTrip = this.tripService.trips().find(t => t.id === this.activeTrip()!.id);
    if (updatedTrip) this.activeTrip.set(updatedTrip);
  }

  getModeConfig(mode: TransportationMode) {
    return TRANSPORT_MODES.find(m => m.value === mode) || { label: mode, icon: '✈️' };
  }
}

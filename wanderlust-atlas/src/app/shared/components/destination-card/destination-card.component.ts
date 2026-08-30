import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Destination, BucketListItem, BucketListStatus, STATUS_CONFIG } from '../../../core/models/types';
import { BucketListService } from '../../../core/services/bucket-list.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CategoryIconPipe } from '../../pipes/category-icon.pipe';
import { TiltDirective } from '../../directives/tilt.directive';
import { AddBucketListItemModalComponent } from '../add-bucket-list-modal/add-bucket-list-modal.component';

@Component({
  selector: 'app-destination-card',
  standalone: true,
  imports: [CommonModule, RouterModule, CategoryIconPipe, TiltDirective, AddBucketListItemModalComponent],
  templateUrl: './destination-card.component.html',
  styleUrls: ['./destination-card.component.scss'],
})
export class DestinationCardComponent {
  @Input() destination?: Destination;
  @Input() loading = false;
  @Output() added = new EventEmitter<Destination>();
  @Output() removed = new EventEmitter<string>();

  private bucketList = inject(BucketListService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  showModal = signal(false);

  readonly statusConfig = STATUS_CONFIG;
  readonly skeletons = Array(3).fill(0);

  readonly categoryFallbacks: Record<string, string> = {
    beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    nature: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    culture: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    adventure: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80',
    wildlife: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
    city: 'https://images.unsplash.com/photo-1477959858617-67f30ac72604?auto=format&fit=crop&w=1200&q=80',
    road_trip: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    spiritual: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
  };

  getCardImage(): string {
    if (this.destination?.image_url) return this.destination.image_url;
    const cat = this.destination?.category || 'nature';
    return this.categoryFallbacks[cat] || this.categoryFallbacks['nature'];
  }

  isInList(): boolean {
    return this.destination ? this.bucketList.isInList(this.destination.id) : false;
  }

  getItemByDestination(): BucketListItem | undefined {
    return this.destination ? this.bucketList.getItemByDestination(this.destination.id) : undefined;
  }

  currentStatus() {
    if (!this.destination) return null;
    const item = this.bucketList.getItemByDestination(this.destination.id);
    return item ? STATUS_CONFIG[item.status] : null;
  }

  formatMoodTags(): string {
    if (!this.destination?.mood_tags?.length) return '';
    return this.destination.mood_tags.slice(0, 2)
      .map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' · ');
  }

  formatCost(cost: number | null | undefined): string {
    if (!cost) return '';
    return cost.toLocaleString();
  }

  onViewDetails(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.destination) return;

    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/destination', this.destination.id]);
    } else {
      this.toast.info('Please sign in to view destination details & travel guides 🔐');
      this.router.navigate(['/auth'], {
        queryParams: { returnUrl: `/destination/${this.destination.id}` }
      });
    }
  }

  async addToList(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (!this.auth.isLoggedIn()) {
      this.toast.info('Please sign in to add destinations to your list');
      this.router.navigate(['/auth']);
      return;
    }

    this.showModal.set(true);
  }

  onModalSaved(item: any): void {
    if (this.destination) {
      this.added.emit(this.destination);
    }
  }

  async removeFromList(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (!this.destination) return;

    const item = this.bucketList.getItemByDestination(this.destination.id);
    if (!item) return;

    const { error } = await this.bucketList.removeFromList(item.id);
    if (!error) {
      this.toast.info(`${this.destination.name} removed from your list`);
      this.removed.emit(this.destination.id);
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';
  }
}

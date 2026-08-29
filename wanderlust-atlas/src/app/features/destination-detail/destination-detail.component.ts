import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DestinationsService } from '../../core/services/destinations.service';
import { BucketListService } from '../../core/services/bucket-list.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { DestinationCardComponent } from '../../shared/components/destination-card/destination-card.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { CategoryIconPipe } from '../../shared/pipes/category-icon.pipe';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { Destination, BucketListStatus, STATUS_CONFIG, CATEGORIES } from '../../core/models/types';

@Component({
  selector: 'app-destination-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DestinationCardComponent, FooterComponent, CategoryIconPipe, LoaderComponent],
  templateUrl: './destination-detail.component.html',
  styleUrls: ['./destination-detail.component.scss'],
})
export class DestinationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private destService = inject(DestinationsService);
  private bucketList = inject(BucketListService);
  auth = inject(AuthService);
  private toast = inject(ToastService);

  destination = signal<Destination | null>(null);
  relatedDestinations = signal<Destination[]>([]);
  loading = signal(true);

  selectedStatus = signal<BucketListStatus>('dreaming');
  showStatusDropdown = signal(false);

  readonly statusConfig = STATUS_CONFIG;
  readonly statuses: BucketListStatus[] = ['dreaming', 'planning', 'booked', 'completed'];
  readonly categories = CATEGORIES;

  isInList = () => this.destination() ? this.bucketList.isInList(this.destination()!.id) : false;
  currentItem = () => this.destination() ? this.bucketList.getItemByDestination(this.destination()!.id) : null;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const dest = await this.destService.getDestinationById(id);
    this.destination.set(dest);
    this.loading.set(false);

    if (dest) {
      const related = await this.destService.getRelatedDestinations(dest, 4);
      this.relatedDestinations.set(related);
    }
  }

  getCategoryLabel(cat: string): string {
    return this.categories.find(c => c.value === cat)?.label ?? cat;
  }

  async addToList(): Promise<void> {
    if (!this.auth.isLoggedIn()) {
      this.toast.info('Please sign in to add destinations to your list');
      return;
    }
    const dest = this.destination();
    if (!dest) return;

    const { error } = await this.bucketList.addToList(dest.id, this.selectedStatus());
    if (!error) {
      this.toast.success(`✨ ${dest.name} added as "${this.statusConfig[this.selectedStatus()].label}"!`);
    } else {
      this.toast.error('Could not add to list. Please try again.');
    }
    this.showStatusDropdown.set(false);
  }

  async updateStatus(status: BucketListStatus): Promise<void> {
    const item = this.currentItem();
    if (!item) return;

    const { error } = await this.bucketList.updateStatus(item.id, status);
    if (!error) {
      this.toast.success(`Updated to "${this.statusConfig[status].label}"`);
    }
  }

  async removeFromList(): Promise<void> {
    const item = this.currentItem();
    if (!item) return;

    const { error } = await this.bucketList.removeFromList(item.id);
    if (!error) {
      this.toast.info('Removed from your bucket list');
    }
  }

  formatCost(cost: number | null): string {
    if (!cost) return 'Varies';
    return `$${cost.toLocaleString()}`;
  }
}

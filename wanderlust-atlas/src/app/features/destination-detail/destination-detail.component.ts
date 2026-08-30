import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DestinationsService } from '../../core/services/destinations.service';
import { BucketListService } from '../../core/services/bucket-list.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SpeechService } from '../../core/services/speech.service';
import { DestinationCardComponent } from '../../shared/components/destination-card/destination-card.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { CategoryIconPipe } from '../../shared/pipes/category-icon.pipe';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { UserActivitiesService } from '../../core/services/user-activities.service';
import { Destination, BucketListStatus, STATUS_CONFIG, CATEGORIES, UserActivity } from '../../core/models/types';

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

  activitiesService = inject(UserActivitiesService);
  personalActivities = signal<UserActivity[]>([]);
  newPersonalTask = signal('');

  private router = inject(Router);

  async ngOnInit(): Promise<void> {
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (!id) return;

      if (!this.auth.isLoggedIn()) {
        this.toast.info('Please sign in to view destination details & travel guides 🔐');
        this.router.navigate(['/auth'], { queryParams: { returnUrl: `/destination/${id}` } });
        return;
      }

      window.scrollTo({ top: 0, behavior: 'instant' });
      this.loading.set(true);
      this.destination.set(null);

      const dest = await this.destService.getDestinationById(id);
      this.destination.set(dest);
      this.loading.set(false);

      if (dest) {
        const [related, activities] = await Promise.all([
          this.destService.getRelatedDestinations(dest, 4),
          this.activitiesService.getActivitiesByDestination(dest.id)
        ]);
        this.relatedDestinations.set(related);
        this.personalActivities.set(activities);
      }
    });
  }

  async addPersonalTask(): Promise<void> {
    const title = this.newPersonalTask().trim();
    if (!title || !this.destination()) return;

    const { data, error } = await this.activitiesService.addActivity({
      title,
      destination_id: this.destination()!.id,
      category: 'must_do',
      is_completed: false,
    });

    if (!error && data) {
      this.toast.success('🎯 Added to your personal checklist for this place!');
      this.personalActivities.update(l => [data, ...l]);
      this.newPersonalTask.set('');
    }
  }

  async togglePersonalTask(id: string, completed: boolean): Promise<void> {
    const ok = await this.activitiesService.toggleActivityCompleted(id, completed);
    if (ok) {
      this.personalActivities.update(l => l.map(a => a.id === id ? { ...a, is_completed: completed } : a));
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

  speech = inject(SpeechService);

  listenOverview(): void {
    const d = this.destination();
    if (!d) return;
    const text = `${d.description}. Best season to visit is ${d.best_season || 'year round'}. Must try activities include ${d.must_try_activities || 'local sightseeing'}.`;
    this.speech.speak(text, `${d.name}, ${d.country}`);
  }

  formatCost(cost: number | null): string {
    if (!cost) return 'Varies';
    return `$${cost.toLocaleString()}`;
  }

  ngOnDestroy(): void {
    this.speech.stop();
  }
}

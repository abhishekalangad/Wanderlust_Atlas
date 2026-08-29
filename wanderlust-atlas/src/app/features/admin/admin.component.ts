import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DestinationsService } from '../../core/services/destinations.service';
import { ToastService } from '../../core/services/toast.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { CategoryIconPipe } from '../../shared/pipes/category-icon.pipe';
import { Destination, CATEGORIES, CONTINENTS, SEASONS } from '../../core/models/types';

type AdminTab = 'dashboard' | 'destinations' | 'pending' | 'users';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, LoaderComponent, CategoryIconPipe],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  private destService = inject(DestinationsService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  activeTab = signal<AdminTab>('dashboard');
  loading = signal(true);

  stats = signal({ users: 0, destinations: 0, bucketItems: 0, pending: 0 });
  destinations = signal<Destination[]>([]);
  pendingDestinations = signal<Destination[]>([]);
  users = signal<any[]>([]);

  showAddForm = signal(false);
  editingDestination = signal<Destination | null>(null);
  uploadingImage = signal(false);

  readonly categories = CATEGORIES;
  readonly continents = CONTINENTS;
  readonly seasons = SEASONS;
  readonly difficulties = ['easy', 'moderate', 'challenging'];

  // All fields optional as requested
  destForm: FormGroup = this.fb.group({
    name: [''],
    country: [''],
    continent: [''],
    category: [''],
    description: [''],
    image_url: [''],
    mood_tags: [''],
    difficulty: ['easy'],
    best_season: [''],
    avg_cost_usd: [null],
    recommended_duration_days: [''],
    nearest_airport: [''],
    local_currency_language: [''],
    visa_info: [''],
    must_try_activities: [''],
    is_featured: [false],
  });

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
    this.loading.set(false);
  }

  async loadDashboard(): Promise<void> {
    const [stats, destinations, pending, users] = await Promise.all([
      this.destService.getDashboardStats(),
      this.destService.getDestinations({ sortBy: 'newest' }),
      this.destService.getPendingDestinations(),
      this.destService.getAllUsers(),
    ]);
    this.stats.set({ ...stats, pending: pending.length });
    this.destinations.set(destinations);
    this.pendingDestinations.set(pending);
    this.users.set(users);
  }

  async approveDestination(id: string, name: string): Promise<void> {
    const { error } = await this.destService.approveDestination(id);
    if (!error) {
      this.toast.success(`"${name}" has been approved! 🎉`);
      await this.loadDashboard();
    } else {
      this.toast.error('Approval failed.');
    }
  }

  async rejectDestination(id: string, name: string): Promise<void> {
    const { error } = await this.destService.rejectDestination(id);
    if (!error) {
      this.toast.info(`"${name}" rejected.`);
      await this.loadDashboard();
    } else {
      this.toast.error('Rejection failed.');
    }
  }

  async onImageUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingImage.set(true);
    const { url, error } = await this.destService.uploadDestinationImage(file);
    this.uploadingImage.set(false);

    if (!error && url) {
      this.destForm.patchValue({ image_url: url });
      this.toast.success('Image uploaded!');
    } else {
      this.toast.error('Image upload failed.');
    }
  }

  startEdit(dest: Destination): void {
    this.editingDestination.set(dest);
    this.destForm.patchValue({
      ...dest,
      mood_tags: dest.mood_tags?.join(', ') ?? '',
    });
    this.showAddForm.set(true);
  }

  cancelForm(): void {
    this.showAddForm.set(false);
    this.editingDestination.set(null);
    this.destForm.reset({ difficulty: 'easy', is_featured: false });
  }

  async submitDestination(): Promise<void> {
    if (this.destForm.invalid) { this.destForm.markAllAsTouched(); return; }

    const formVal = this.destForm.value;
    const data = {
      ...formVal,
      mood_tags: formVal.mood_tags
        ? formVal.mood_tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [],
      avg_cost_usd: formVal.avg_cost_usd ? parseInt(formVal.avg_cost_usd) : null,
    };

    const editing = this.editingDestination();

    if (editing) {
      const { error } = await this.destService.updateDestination(editing.id, data);
      if (!error) {
        this.toast.success('Destination updated!');
        await this.loadDashboard();
        this.cancelForm();
      } else {
        this.toast.error('Update failed.');
      }
    } else {
      const { error } = await this.destService.createDestination(data);
      if (!error) {
        this.toast.success('Destination created!');
        await this.loadDashboard();
        this.cancelForm();
      } else {
        this.toast.error('Create failed.');
      }
    }
  }

  async deleteDestination(id: string, name: string): Promise<void> {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error } = await this.destService.deleteDestination(id);
    if (!error) {
      this.toast.success(`"${name}" deleted.`);
    } else {
      this.toast.error('Delete failed.');
    }
  }

  async toggleFeatured(dest: Destination): Promise<void> {
    await this.destService.updateDestination(dest.id, { is_featured: !dest.is_featured });
    this.toast.success(`${dest.name} ${!dest.is_featured ? 'featured' : 'unfeatured'}.`);
    await this.loadDashboard();
  }

  async toggleAdmin(userId: string, isAdmin: boolean): Promise<void> {
    const { error } = await this.destService.toggleAdminStatus(userId, !isAdmin);
    if (!error) {
      this.toast.success('Admin status updated.');
      await this.loadDashboard();
    }
  }
}

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { BucketListService } from '../../core/services/bucket-list.service';
import { ToastService } from '../../core/services/toast.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { CategoryIconPipe } from '../../shared/pipes/category-icon.pipe';
import { UserActivitiesService } from '../../core/services/user-activities.service';
import { BucketListItem, BucketListStatus, STATUS_CONFIG, UserActivity, ACTIVITY_CATEGORIES, ActivityCategory } from '../../core/models/types';

type BucketTab = 'all' | BucketListStatus | 'activities';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, LoaderComponent, FooterComponent, CategoryIconPipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private profileService = inject(ProfileService);
  bucketList = inject(BucketListService);
  activitiesService = inject(UserActivitiesService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  editMode = signal(false);
  uploadingAvatar = signal(false);

  activeTab = signal<BucketTab>('all');

  // Personal Activity Form state
  showActivityForm = signal(false);
  newActivityTitle = signal('');
  newActivityCategory = signal<ActivityCategory>('must_do');
  newActivityNotes = signal('');
  newActivityDestinationId = signal<string>('');

  readonly statusConfig = STATUS_CONFIG;
  readonly activityCategories = ACTIVITY_CATEGORIES;
  readonly statusKeys: BucketListStatus[] = ['dreaming', 'planning', 'booked', 'completed'];
  readonly tabs: { value: BucketTab; label: string; icon: string }[] = [
    { value: 'all', label: 'All Places', icon: '🌍' },
    { value: 'dreaming', label: 'Dreaming', icon: '✨' },
    { value: 'planning', label: 'Planning', icon: '📋' },
    { value: 'booked', label: 'Booked', icon: '✈️' },
    { value: 'completed', label: 'Completed', icon: '✅' },
    { value: 'activities', label: 'My Checklist', icon: '🎯' },
  ];

  profileForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    full_name: [''],
    bio: [''],
  });

  completedActivitiesCount = computed(() => this.activitiesService.activities().filter(a => a.is_completed).length);
  totalActivitiesCount = computed(() => this.activitiesService.activities().length);
  activitiesProgressPercent = computed(() => {
    const total = this.totalActivitiesCount();
    if (!total) return 0;
    return Math.round((this.completedActivitiesCount() / total) * 100);
  });

  filteredItems = computed<BucketListItem[]>(() => {
    const tab = this.activeTab();
    const items = this.bucketList.items();
    if (tab === 'all') return items;
    return items.filter(i => i.status === tab);
  });

  stats = this.bucketList.stats;

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    await Promise.all([
      this.bucketList.loadUserBucketList(user.id),
      this.activitiesService.loadActivities()
    ]);
    this.bucketList.subscribeToChanges(user.id);

    const profile = this.auth.currentProfile();
    if (profile) {
      this.profileForm.patchValue({
        username: profile.username,
        full_name: profile.full_name ?? '',
        bio: profile.bio ?? '',
      });
    }

    this.loading.set(false);
  }

  ngOnDestroy(): void {}

  async createActivity(): Promise<void> {
    const title = this.newActivityTitle().trim();
    if (!title) {
      this.toast.error('Please enter an activity description');
      return;
    }

    const { error } = await this.activitiesService.addActivity({
      title,
      category: this.newActivityCategory(),
      notes: this.newActivityNotes().trim() || null,
      destination_id: this.newActivityDestinationId() || null,
      is_completed: false,
    });

    if (!error) {
      this.toast.success('🎯 Personal activity added to your checklist!');
      this.newActivityTitle.set('');
      this.newActivityNotes.set('');
      this.newActivityDestinationId.set('');
      this.showActivityForm.set(false);
    } else {
      this.toast.error('Failed to add activity. Please try again.');
    }
  }

  async toggleActivity(id: string, isCompleted: boolean): Promise<void> {
    const success = await this.activitiesService.toggleActivityCompleted(id, isCompleted);
    if (success) {
      if (isCompleted) {
        this.toast.success('🎉 Activity completed!');
      }
    }
  }

  async deleteActivity(id: string): Promise<void> {
    const success = await this.activitiesService.deleteActivity(id);
    if (success) {
      this.toast.info('Activity removed from checklist');
    }
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) return;
    const user = this.auth.currentUser();
    if (!user) return;

    const { error } = await this.profileService.updateProfile(user.id, this.profileForm.value);
    if (!error) {
      await this.auth.refreshProfile();
      this.toast.success('Profile updated!');
      this.editMode.set(false);
    } else {
      this.toast.error('Could not update profile. Please try again.');
    }
  }

  async onAvatarUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.auth.currentUser()) return;

    this.uploadingAvatar.set(true);
    const { url, error } = await this.profileService.uploadAvatar(this.auth.currentUser()!.id, file);
    this.uploadingAvatar.set(false);

    if (!error && url) {
      await this.auth.refreshProfile();
      this.toast.success('Avatar updated!');
    } else {
      this.toast.error('Failed to upload avatar. Please try again.');
    }
  }

  async removeFromList(itemId: string): Promise<void> {
    const { error } = await this.bucketList.removeFromList(itemId);
    if (!error) this.toast.info('Removed from bucket list');
  }

  async updateStatus(itemId: string, status: BucketListStatus): Promise<void> {
    await this.bucketList.updateStatus(itemId, status);
  }

  getTabCount(tab: BucketTab): number {
    if (tab === 'all') return this.bucketList.items().length;
    if (tab === 'activities') return this.activitiesService.activities().length;
    return this.bucketList.items().filter(i => i.status === tab).length;
  }
}

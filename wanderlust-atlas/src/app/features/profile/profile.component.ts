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
import { BucketListItem, BucketListStatus, STATUS_CONFIG } from '../../core/models/types';

type BucketTab = 'all' | BucketListStatus;

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
  private bucketList = inject(BucketListService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  editMode = signal(false);
  uploadingAvatar = signal(false);

  activeTab = signal<BucketTab>('all');

  readonly statusConfig = STATUS_CONFIG;
  readonly statusKeys: BucketListStatus[] = ['dreaming', 'planning', 'booked', 'completed'];
  readonly tabs: { value: BucketTab; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '🌍' },
    { value: 'dreaming', label: 'Dreaming', icon: '✨' },
    { value: 'planning', label: 'Planning', icon: '📋' },
    { value: 'booked', label: 'Booked', icon: '✈️' },
    { value: 'completed', label: 'Completed', icon: '✅' },
  ];

  profileForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    full_name: [''],
    bio: [''],
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

    await this.bucketList.loadUserBucketList(user.id);
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
    return this.bucketList.items().filter(i => i.status === tab).length;
  }
}

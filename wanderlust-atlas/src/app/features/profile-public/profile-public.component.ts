import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProfileService } from '../../core/services/profile.service';
import { BucketListService } from '../../core/services/bucket-list.service';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { CategoryIconPipe } from '../../shared/pipes/category-icon.pipe';
import { Profile, BucketListItem, STATUS_CONFIG } from '../../core/models/types';

@Component({
  selector: 'app-profile-public',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent, LoaderComponent, CategoryIconPipe],
  template: `
    <div class="public-profile-page">
      @if (loading()) {
        <div style="padding-top: 120px"><app-loader /></div>
      } @else if (!profile()) {
        <div class="not-found container">
          <h2>User not found</h2>
          <a routerLink="/explore" class="btn-primary">Browse Destinations</a>
        </div>
      } @else {
        <div class="profile-hero">
          <div class="container">
            <div class="pub-profile-header">
              <div class="pub-avatar-wrap">
                @if (profile()!.avatar_url) {
                  <img [src]="profile()!.avatar_url!" class="pub-avatar" [alt]="profile()!.username">
                } @else {
                  <div class="pub-avatar-placeholder">
                    {{ profile()!.username.charAt(0).toUpperCase() }}
                  </div>
                }
              </div>
              <div class="pub-info">
                <h1 class="pub-name">{{ profile()!.full_name || profile()!.username }}</h1>
                <p class="pub-username">&#64;{{ profile()!.username }}</p>
                @if (profile()!.bio) {
                  <p class="pub-bio">{{ profile()!.bio }}</p>
                }
                @if (auth.isLoggedIn() && auth.currentUser()?.id !== profile()!.id) {
                  <button
                    class="follow-btn"
                    [class.following]="isFollowing()"
                    (click)="toggleFollow()"
                  >
                    {{ isFollowing() ? '✓ Following' : '+ Follow' }}
                  </button>
                }
              </div>
              <div class="pub-stats">
                <div class="pub-stat">
                  <span class="pub-stat-num">{{ bucketItems().length }}</span>
                  <span class="pub-stat-lbl">Dreams</span>
                </div>
                <div class="pub-stat">
                  <span class="pub-stat-num">{{ completedCount() }}</span>
                  <span class="pub-stat-lbl">Completed</span>
                </div>
                <div class="pub-stat">
                  <span class="pub-stat-num">{{ followerCount() }}</span>
                  <span class="pub-stat-lbl">Followers</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="container pub-body">
          <h2 class="section-title pub-list-title">{{ profile()!.username }}'s Bucket List</h2>
          @if (bucketItems().length === 0) {
            <div class="empty">
              <p>No destinations added yet.</p>
            </div>
          } @else {
            <div class="pub-grid">
              @for (item of bucketItems(); track item.id) {
                @if (item.destination) {
                  <a [routerLink]="['/destination', item.destination.id]" class="pub-card glass-card">
                    <div class="pub-card-img-wrap">
                      <img [src]="item.destination.image_url || 'assets/images/placeholder.jpg'" [alt]="item.destination.name">
                      <span class="pub-status-badge" [class]="item.status">
                        {{ statusConfig[item.status].icon }} {{ statusConfig[item.status].label }}
                      </span>
                    </div>
                    <div class="pub-card-info">
                      <h3>{{ item.destination.name }}</h3>
                      <p>{{ item.destination.country }} · {{ item.destination.category | categoryIcon }}</p>
                    </div>
                  </a>
                }
              }
            </div>
          }
        </div>
      }
    </div>
    <app-footer />
  `,
  styleUrls: ['./profile-public.component.scss'],
})
export class ProfilePublicComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private profileService = inject(ProfileService);
  private bucketListService = inject(BucketListService);
  private supabase = inject(SupabaseService);
  auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly statusConfig = STATUS_CONFIG;

  profile = signal<Profile | null>(null);
  bucketItems = signal<BucketListItem[]>([]);
  loading = signal(true);
  isFollowing = signal(false);
  followerCount = signal(0);

  completedCount = () => this.bucketItems().filter(i => i.status === 'completed').length;

  async ngOnInit(): Promise<void> {
    const username = this.route.snapshot.paramMap.get('username');
    if (!username) return;

    const profile = await this.profileService.getProfileByUsername(username);
    this.profile.set(profile);

    if (profile) {
      const items = await this.loadPublicBucketList(profile.id);
      this.bucketItems.set(items);

      const count = await this.profileService.getFollowerCount(profile.id);
      this.followerCount.set(count);

      if (this.auth.isLoggedIn() && this.auth.currentUser()?.id !== profile.id) {
        const following = await this.profileService.isFollowing(this.auth.currentUser()!.id, profile.id);
        this.isFollowing.set(following);
      }
    }

    this.loading.set(false);
  }

  private async loadPublicBucketList(userId: string): Promise<BucketListItem[]> {
    const { data } = await this.supabase.client
      .from('bucket_list_items')
      .select('*, destination:destinations(*)')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });
    return data ?? [];
  }

  async toggleFollow(): Promise<void> {
    const currentUser = this.auth.currentUser();
    const targetUser = this.profile();
    if (!currentUser || !targetUser) return;

    if (this.isFollowing()) {
      await this.profileService.unfollowUser(currentUser.id, targetUser.id);
      this.isFollowing.set(false);
      this.followerCount.update(n => n - 1);
    } else {
      await this.profileService.followUser(currentUser.id, targetUser.id);
      this.isFollowing.set(true);
      this.followerCount.update(n => n + 1);
    }
  }
}

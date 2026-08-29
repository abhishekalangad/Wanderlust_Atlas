import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav [class.scrolled]="isScrolled()">
      <a routerLink="/" class="nav-logo">
        <img src="assets/images/logo.png" alt="Wanderlust Atlas Logo" class="logo-img">
        <span>Wanderlust Atlas</span>
      </a>

      <ul class="nav-links" [class.open]="menuOpen()">
        <li><a routerLink="/explore" routerLinkActive="active" (click)="closeMenu()">Explore</a></li>
        <li><a routerLink="/travelogues" routerLinkActive="active" (click)="closeMenu()">Travelogues</a></li>
        @if (auth.isLoggedIn()) {
          <li><a routerLink="/profile" routerLinkActive="active" (click)="closeMenu()">My List</a></li>
          <li><a routerLink="/suggest-destination" routerLinkActive="active" (click)="closeMenu()">+ Suggest Place</a></li>
        }
        @if (auth.isAdmin()) {
          <li><a routerLink="/admin" routerLinkActive="active" (click)="closeMenu()">Admin</a></li>
        }
        @if (auth.isLoggedIn()) {
          <li class="mobile-only-link"><a (click)="signOut(); closeMenu()" class="text-coral">Sign Out</a></li>
        } @else {
          <li class="mobile-only-link"><a routerLink="/auth" (click)="closeMenu()" class="text-coral">Sign In / Sign Up</a></li>
        }
      </ul>

      <div class="nav-actions">
        @if (auth.isLoggedIn()) {
          <a routerLink="/profile" class="nav-avatar-btn" (click)="closeMenu()">
            @if (auth.currentProfile()?.avatar_url) {
              <img [src]="auth.currentProfile()!.avatar_url!" [alt]="auth.currentProfile()?.username" class="nav-avatar">
            } @else {
              <div class="nav-avatar-placeholder">
                {{ (auth.currentProfile()?.username ?? 'U').charAt(0).toUpperCase() }}
              </div>
            }
          </a>
          <button class="btn-ghost-sm" (click)="signOut()">Sign Out</button>
        } @else {
          <a routerLink="/auth" class="nav-cta">Start Exploring</a>
        }
      </div>

      <button class="hamburger" (click)="toggleMenu()" [class.open]="menuOpen()" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </nav>
  `,
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  auth = inject(AuthService);
  private toasts = inject(ToastService);
  private router = inject(Router);

  isScrolled = signal(false);
  menuOpen = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 80);
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.toasts.success('Signed out successfully');
    this.closeMenu();
  }
}

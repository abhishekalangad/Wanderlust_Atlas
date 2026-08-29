import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer>
      <video class="footer-video" autoplay muted loop playsinline [muted]="true">
        <source src="assets/videos/footer.mp4" type="video/mp4">
      </video>
      <div class="footer-overlay"></div>
      <div class="footer-content">
        <p class="footer-eyebrow">Start Your Journey</p>
        <h2 class="footer-title">
          Your next <em>adventure</em><br>awaits discovery
        </h2>
        <p class="footer-sub">
          Join thousands of travellers building their dream bucket lists.<br>
          Every great journey begins with a single destination.
        </p>
        <div class="footer-form">
          <input
            type="email"
            placeholder="Enter your email"
            class="footer-input"
            #emailInput
          >
          <button class="btn-primary" (click)="subscribe(emailInput.value)">
            Join Free
          </button>
        </div>
        <div class="footer-bottom">
          <p class="footer-copy">© 2025 Wanderlust Atlas. All rights reserved.</p>
          <div class="footer-links">
            <a routerLink="/explore">Explore</a>
            <a routerLink="/auth">Sign In</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  subscribe(email: string): void {
    if (email) {
      console.log('Subscribe:', email);
      // TODO: integrate newsletter signup
    }
  }
}

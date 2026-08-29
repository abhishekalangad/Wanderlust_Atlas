import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TravelogueService } from '../../core/services/travelogue.service';
import { AuthService } from '../../core/services/auth.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { Travelogue } from '../../core/models/types';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-travelogue-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent, LoaderComponent],
  template: `
    <div class="travelogue-detail-page">
      @if (loading()) {
        <div style="padding-top: 120px"><app-loader /></div>
      } @else if (!travelogue()) {
        <div class="not-found container">
          <h2>Travelogue not found</h2>
          <a routerLink="/travelogues" class="btn-primary">Back to Travelogues</a>
        </div>
      } @else {
        <!-- HERO COVER -->
        <div class="story-hero">
          @if (travelogue()!.cover_image_url) {
            <img [src]="travelogue()!.cover_image_url!" [alt]="travelogue()!.title" class="story-cover">
          }
          <div class="story-hero-overlay"></div>
          <div class="story-hero-content container">
            <div class="story-meta">
              <a routerLink="/travelogues">← Travelogues</a>
              @if (travelogue()!.destination) {
                <span>•</span>
                <a [routerLink]="['/destination', travelogue()!.destination!.id]">
                  📍 {{ travelogue()!.destination!.name }}
                </a>
              }
              @if (canEdit()) {
                <span>•</span>
                <a [routerLink]="['/travelogues', travelogue()!.id, 'edit']" class="edit-link">
                  ✏️ Edit Travelogue
                </a>
              }
            </div>
            <h1 class="story-title">{{ travelogue()!.title }}</h1>
            <div class="story-author-bar">
              @if (travelogue()!.profile?.avatar_url) {
                <img [src]="travelogue()!.profile!.avatar_url!" class="author-avatar" [alt]="travelogue()!.profile?.username">
              }
              <div>
                <span class="author-name">By {{ travelogue()!.profile?.full_name || travelogue()!.profile?.username }}</span>
                <span class="story-date">{{ travelogue()!.created_at | date:'longDate' }}</span>
              </div>
              @if (canEdit()) {
                <a [routerLink]="['/travelogues', travelogue()!.id, 'edit']" class="btn-ghost edit-btn">
                  ✏️ Edit Story
                </a>
              }
            </div>
          </div>
        </div>

        <!-- STORY CONTENT -->
        <main class="container story-main">
          @if (travelogue()!.excerpt) {
            <p class="story-lead">{{ travelogue()!.excerpt }}</p>
          }

          <div class="story-body" [innerHTML]="formattedContent()"></div>

          <!-- PDF DOWNLOAD & EMBED ATTACHMENT -->
          @if (travelogue()!.pdf_url) {
            <section class="pdf-attachment-box glass-card">
              <div class="pdf-header">
                <div class="pdf-icon">📄</div>
                <div>
                  <h3>Attached Travel Guide / PDF Journal</h3>
                  <p>View inline or download the official PDF guide for this travelogue.</p>
                </div>
                <a [href]="travelogue()!.pdf_url!" target="_blank" download class="btn-primary">
                  ⬇ Download PDF
                </a>
              </div>

              <!-- Inline PDF preview iframe -->
              <div class="pdf-preview-wrap">
                <iframe [src]="safePdfUrl()" width="100%" height="500px"></iframe>
              </div>
            </section>
          }
        </main>
      }
    </div>
    <app-footer />
  `,
  styleUrls: ['./travelogue-detail.component.scss'],
})
export class TravelogueDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private travelogueService = inject(TravelogueService);
  private auth = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  travelogue = signal<Travelogue | null>(null);
  loading = signal(true);
  safePdfUrl = signal<SafeResourceUrl | null>(null);

  canEdit = computed(() => {
    const user = this.auth.currentUser();
    const isAdmin = this.auth.isAdmin();
    const t = this.travelogue();
    if (!user || !t) return false;
    return user.id === t.user_id || isAdmin;
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const data = await this.travelogueService.getTravelogueById(id);
    this.loading.set(false);

    if (data) {
      this.travelogue.set(data);
      if (data.pdf_url) {
        this.safePdfUrl.set(
          this.sanitizer.bypassSecurityTrustResourceUrl(data.pdf_url)
        );
      }
    }
  }

  formattedContent(): string {
    const content = this.travelogue()?.content || '';
    return content.replace(/\n/g, '<br>');
  }
}

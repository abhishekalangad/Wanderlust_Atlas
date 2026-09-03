import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TravelogueService } from '../../core/services/travelogue.service';
import { AuthService } from '../../core/services/auth.service';
import { SpeechService } from '../../core/services/speech.service';
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
          <!-- AUDIO PLAYER BAR -->
          <div class="story-audio-bar glass-card" [class.active]="speech.isPlaying()">
            <div class="audio-info">
              <div class="audio-pulse-wrap">
                <span class="audio-icon">{{ speech.isPlaying() && !speech.isPaused() ? '🔊' : '🎧' }}</span>
                @if (speech.isPlaying() && !speech.isPaused()) {
                  <span class="audio-waves">
                    <span></span><span></span><span></span>
                  </span>
                }
              </div>
              <div>
                <h4 class="audio-title">Audio Story Reader</h4>
                <p class="audio-sub">
                  {{ speech.isPlaying() ? (speech.isPaused() ? 'Paused' : 'Reading story aloud...') : 'Too lazy to read? Listen to this travel story!' }}
                </p>
              </div>
            </div>

            <div class="audio-actions">
              <!-- SLEEK PLAYBACK SPEED TOGGLE PILL -->
              <button
                type="button"
                class="btn-speed-toggle"
                (click)="cyclePlaybackRate()"
                [title]="'Playback Speed: ' + speech.playbackRate() + 'x (Click to change)'"
              >
                <span class="speed-icon">⚡</span>
                <span class="speed-val">{{ speech.playbackRate() }}x</span>
              </button>

              @if (speech.isPlaying()) {
                @if (speech.isPaused()) {
                  <button type="button" class="btn-audio play" (click)="speech.resume()">▶️ Resume</button>
                } @else {
                  <button type="button" class="btn-audio pause" (click)="speech.pause()">⏸️ Pause</button>
                }
                <button type="button" class="btn-audio stop" (click)="speech.stop()">⏹️ Stop</button>
              } @else {
                <button type="button" class="btn-audio listen" (click)="listenStory()">🔊 Listen to Story</button>
              }
            </div>
          </div>

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
export class TravelogueDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private travelogueService = inject(TravelogueService);
  private auth = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  speech = inject(SpeechService);

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
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (!id) return;

      this.speech.stop();
      window.scrollTo({ top: 0, behavior: 'instant' });
      this.loading.set(true);
      this.travelogue.set(null);

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
    });
  }

  listenStory(): void {
    const t = this.travelogue();
    if (!t) return;
    const bodyText = (t.excerpt ? `${t.excerpt}. ` : '') + t.content;
    this.speech.speak(bodyText, t.title);
  }

  cyclePlaybackRate(): void {
    const current = this.speech.playbackRate();
    const rates = [1.0, 1.25, 1.5, 2.0, 0.75];
    const idx = rates.indexOf(current);
    const nextRate = rates[(idx + 1) % rates.length];
    this.speech.setPlaybackRate(nextRate);
  }

  formattedContent(): string {
    const content = this.travelogue()?.content || '';
    const paragraphs = content.split(/\n\s*\n/);
    return paragraphs
      .filter(p => p.trim().length > 0)
      .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  ngOnDestroy(): void {
    this.speech.stop();
  }
}

import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DestinationsService } from '../../core/services/destinations.service';
import { BucketListService } from '../../core/services/bucket-list.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { DestinationCardComponent } from '../../shared/components/destination-card/destination-card.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Destination } from '../../core/models/types';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, DestinationCardComponent, FooterComponent, RevealDirective],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heroCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private destService = inject(DestinationsService);
  auth = inject(AuthService);
  private bucketList = inject(BucketListService);
  private toast = inject(ToastService);

  featuredDestinations = signal<Destination[]>([]);
  loadingDestinations = signal(true);
  skeletons = Array(6).fill(0);

  // Animated counters
  counters = [
    { label: 'Dream Destinations', value: 0, target: 500, suffix: '+' },
    { label: 'Active Travellers', value: 0, target: 12000, suffix: '+' },
    { label: 'Countries Covered', value: 0, target: 195, suffix: '' },
    { label: 'Lists Created', value: 0, target: 45000, suffix: '+' },
  ];

  private animationFrame: number | null = null;
  private particles: Particle[] = [];
  private ctx!: CanvasRenderingContext2D;
  private counterObserver!: IntersectionObserver;
  private countersAnimated = false;

  async ngOnInit(): Promise<void> {
    const destinations = await this.destService.getFeaturedDestinations(6);
    this.featuredDestinations.set(destinations);
    this.loadingDestinations.set(false);
  }

  ngAfterViewInit(): void {
    this.initParticles();
    this.initCounterObserver();
  }

  ngOnDestroy(): void {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.counterObserver?.disconnect();
  }

  // ===== PARTICLE SYSTEM =====
  private initParticles(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.particles = Array.from({ length: 120 }, () => this.createParticle());
    this.animateParticles();
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private createParticle(): Particle {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.7 + 0.1,
      speed: Math.random() * 0.3 + 0.05,
      direction: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
    };
  }

  private animateParticles(): void {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    this.particles.forEach(p => {
      p.twinklePhase += p.twinkleSpeed;
      const opacity = p.opacity * (0.5 + 0.5 * Math.sin(p.twinklePhase));

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      this.ctx.fill();

      p.x += Math.cos(p.direction) * p.speed;
      p.y += Math.sin(p.direction) * p.speed;

      // Wrap around
      if (p.x < -10) p.x = window.innerWidth + 10;
      if (p.x > window.innerWidth + 10) p.x = -10;
      if (p.y < -10) p.y = window.innerHeight + 10;
      if (p.y > window.innerHeight + 10) p.y = -10;
    });

    this.animationFrame = requestAnimationFrame(() => this.animateParticles());
  }

  // ===== COUNTER ANIMATION =====
  private initCounterObserver(): void {
    const statsEl = document.getElementById('stats');
    if (!statsEl) return;

    this.counterObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.countersAnimated) {
          this.countersAnimated = true;
          this.animateCounters();
        }
      },
      { threshold: 0.3 }
    );

    this.counterObserver.observe(statsEl);
  }

  private animateCounters(): void {
    const duration = 2000;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic

      this.counters = this.counters.map(c => ({
        ...c,
        value: Math.round(c.target * eased),
      }));

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  // Steps data for "How It Works"
  howSteps = [
    {
      icon: '🗺️',
      step: 'Step 01',
      title: 'Discover Destinations',
      desc: 'Browse our curated collection of 500+ extraordinary destinations across every continent. Filter by mood, budget, or adventure level.',
    },
    {
      icon: '✨',
      step: 'Step 02',
      title: 'Build Your Dream List',
      desc: 'Add destinations to your personal bucket list. Tag them as dreaming, planning, or booked as your journey unfolds.',
    },
    {
      icon: '✈️',
      step: 'Step 03',
      title: 'Travel & Track',
      desc: 'Mark destinations as completed, share your adventures, and inspire others with your travel story.',
    },
  ];

  teaserFeatures = [
    { icon: '✨', title: 'Dream Mode', desc: 'Save destinations you\'re dreaming about visiting someday' },
    { icon: '📋', title: 'Smart Planning', desc: 'Set target years, add notes, and plan your perfect trip' },
    { icon: '✅', title: 'Track Progress', desc: 'Mark as booked or completed and celebrate every milestone' },
    { icon: '🌍', title: 'Country Stats', desc: 'See how many countries you\'ve conquered or planned to visit' },
  ];
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speed: number;
  direction: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

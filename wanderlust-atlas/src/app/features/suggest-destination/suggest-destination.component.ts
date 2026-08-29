import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { DestinationsService } from '../../core/services/destinations.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { CATEGORIES, CONTINENTS, SEASONS } from '../../core/models/types';

@Component({
  selector: 'app-suggest-destination',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, FooterComponent],
  templateUrl: './suggest-destination.component.html',
  styleUrls: ['./suggest-destination.component.scss'],
})
export class SuggestDestinationComponent {
  private fb = inject(FormBuilder);
  private destService = inject(DestinationsService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = signal(false);
  uploadingImage = signal(false);

  readonly categories = CATEGORIES;
  readonly continents = CONTINENTS;
  readonly seasons = SEASONS;
  readonly difficulties = ['easy', 'moderate', 'challenging'];

  // All fields optional as requested
  form: FormGroup = this.fb.group({
    name: [''],
    country: [''],
    continent: [''],
    category: [''],
    description: [''],
    image_url: [''],
    mood_tags: [''],
    difficulty: ['moderate'],
    best_season: [''],
    avg_cost_usd: [null],
    recommended_duration_days: [''],
    nearest_airport: [''],
    local_currency_language: [''],
    visa_info: [''],
    must_try_activities: [''],
  });

  async onImageUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingImage.set(true);
    try {
      const { url, error } = await this.destService.uploadDestinationImage(file);
      if (!error && url) {
        this.form.patchValue({ image_url: url });
      this.toast.success('Destination image uploaded!');
      } else {
        this.toast.error('Image upload failed. You can also paste a direct image URL.');
      }
    } catch (e) {
      console.error('Image upload error:', e);
      this.toast.error('Image upload failed.');
    } finally {
      this.uploadingImage.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) {
      this.toast.error('Please sign in to suggest a destination');
      return;
    }

    this.loading.set(true);

    const val = this.form.value;
    const payload = {
      ...val,
      name: val.name || 'Unnamed Place',
      mood_tags: val.mood_tags ? val.mood_tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      avg_cost_usd: val.avg_cost_usd ? parseInt(val.avg_cost_usd) : null,
    };

    const { error } = await this.destService.suggestDestination(payload, user.id);
    this.loading.set(false);

    if (!error) {
      this.toast.success('🎉 Destination submitted for admin approval!');
      this.router.navigate(['/explore']);
    } else {
      this.toast.error('Submission failed. Please try again.');
    }
  }
}

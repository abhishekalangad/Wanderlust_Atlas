import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TravelogueService } from '../../core/services/travelogue.service';
import { DestinationsService } from '../../core/services/destinations.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { Destination } from '../../core/models/types';

@Component({
  selector: 'app-travelogue-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, FooterComponent],
  templateUrl: './travelogue-create.component.html',
  styleUrls: ['./travelogue-create.component.scss'],
})
export class TravelogueCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private travelogueService = inject(TravelogueService);
  private destService = inject(DestinationsService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  destinations = signal<Destination[]>([]);
  loading = signal(false);
  uploadingPdf = signal(false);
  uploadingImage = signal(false);

  pdfFileName = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    destination_id: [''],
    excerpt: [''],
    content: ['', [Validators.required, Validators.minLength(50)]],
    cover_image_url: [''],
    pdf_url: [''],
  });

  async ngOnInit(): Promise<void> {
    const list = await this.destService.getDestinations();
    this.destinations.set(list);
  }

  async onPdfUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.toast.error('Please upload a valid PDF document.');
      return;
    }

    this.uploadingPdf.set(true);
    const { url, error } = await this.travelogueService.uploadPdf(file);
    this.uploadingPdf.set(false);

    if (!error && url) {
      this.form.patchValue({ pdf_url: url });
      this.pdfFileName.set(file.name);
      this.toast.success('PDF document attached successfully!');
    } else {
      this.toast.error('PDF upload failed. Please try again.');
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
      this.form.patchValue({ cover_image_url: url });
      this.toast.success('Cover image uploaded!');
    } else {
      this.toast.error('Image upload failed.');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.auth.currentUser();
    if (!user) {
      this.toast.error('Please sign in to publish your story');
      return;
    }

    this.loading.set(true);

    const payload = {
      ...this.form.value,
      user_id: user.id,
      destination_id: this.form.value.destination_id || null,
    };

    const { data, error } = await this.travelogueService.createTravelogue(payload);
    this.loading.set(false);

    if (!error && data) {
      this.toast.success('🎉 Your travelogue has been published!');
      this.router.navigate(['/travelogues', data.id]);
    } else {
      this.toast.error('Publish failed. Please check your form and try again.');
    }
  }
}

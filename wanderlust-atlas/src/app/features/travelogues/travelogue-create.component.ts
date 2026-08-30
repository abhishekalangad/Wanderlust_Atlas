import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, FooterComponent, LoaderComponent],
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
  private route = inject(ActivatedRoute);

  destinations = signal<Destination[]>([]);
  loading = signal(false);
  initialLoading = signal(false);
  isEditMode = signal(false);
  editId = signal<string | null>(null);

  uploadingPdf = signal(false);
  uploadingImage = signal(false);
  pdfFileName = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    destination_id: [''],
    custom_destination_name: [''],
    excerpt: [''],
    content: ['', [Validators.required, Validators.minLength(50)]],
    cover_image_url: [''],
    pdf_url: [''],
  });

  async ngOnInit(): Promise<void> {
    const list = await this.destService.getDestinations();
    this.destinations.set(list);

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.editId.set(id);
      this.initialLoading.set(true);

      const existing = await this.travelogueService.getTravelogueById(id);
      this.initialLoading.set(false);

      if (existing) {
        const user = this.auth.currentUser();
        const isOwner = user && existing.user_id === user.id;
        const isAdmin = this.auth.isAdmin();

        if (!isOwner && !isAdmin) {
          this.toast.error('You do not have permission to edit this travelogue.');
          this.router.navigate(['/travelogues', id]);
          return;
        }

        this.form.patchValue({
          title: existing.title,
          destination_id: existing.destination_id || '',
          custom_destination_name: existing.destination ? existing.destination.name : '',
          excerpt: existing.excerpt || '',
          content: existing.content,
          cover_image_url: existing.cover_image_url || '',
          pdf_url: existing.pdf_url || '',
        });

        if (existing.pdf_url) {
          this.pdfFileName.set('Attached PDF Document');
        }
      } else {
        this.toast.error('Travelogue not found.');
        this.router.navigate(['/travelogues']);
      }
    }
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

    let finalDestinationId = this.form.value.destination_id || null;
    const customName = this.form.value.custom_destination_name?.trim();
    const coverUrl = this.form.value.cover_image_url || undefined;

    if (customName) {
      const destObj = await this.destService.findExistingDestinationByName(customName, coverUrl);
      if (destObj) {
        finalDestinationId = destObj.id;
      }
    } else if (finalDestinationId && coverUrl) {
      // If user selected an existing destination that currently has no image, auto-update destination image!
      const existingDest = this.destService.destinations().find(d => d.id === finalDestinationId);
      if (existingDest && !existingDest.image_url) {
        await this.destService.updateDestination(finalDestinationId, { image_url: coverUrl });
      }
    }

    const payload = {
      title: this.form.value.title,
      excerpt: this.form.value.excerpt,
      content: this.form.value.content,
      cover_image_url: this.form.value.cover_image_url,
      pdf_url: this.form.value.pdf_url,
      user_id: user.id,
      destination_id: finalDestinationId,
      is_published: true,
    };

    if (this.isEditMode() && this.editId()) {
      const { data, error } = await this.travelogueService.updateTravelogue(this.editId()!, payload);
      this.loading.set(false);

      if (!error && data) {
        this.toast.success('✏️ Your travelogue has been updated!');
        this.router.navigate(['/travelogues', data.id]);
      } else {
        this.toast.error('Update failed. Please check your form and try again.');
      }
    } else {
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
}

import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Destination, BucketListItem, BucketListStatus, PriorityLevel, MONTHS, STATUS_CONFIG } from '../../../core/models/types';
import { BucketListService } from '../../../core/services/bucket-list.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-add-bucket-list-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-bucket-list-modal.component.html',
  styleUrls: ['./add-bucket-list-modal.component.scss'],
})
export class AddBucketListItemModalComponent implements OnInit {
  @Input() destination?: Destination;
  @Input() existingItem?: BucketListItem;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<BucketListItem>();

  private fb = inject(FormBuilder);
  private bucketList = inject(BucketListService);
  private toast = inject(ToastService);

  loading = signal(false);

  readonly statusConfig = STATUS_CONFIG;
  readonly months = MONTHS;
  readonly statuses: BucketListStatus[] = ['dreaming', 'planning', 'booked', 'completed'];
  readonly priorities: PriorityLevel[] = ['low', 'medium', 'high'];

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      status: [this.existingItem?.status || 'dreaming', Validators.required],
      target_year: [this.existingItem?.target_year || new Date().getFullYear()],
      target_month: [this.existingItem?.target_month || ''],
      estimated_budget_usd: [this.existingItem?.estimated_budget_usd || this.destination?.avg_cost_usd || null],
      priority: [this.existingItem?.priority || 'medium'],
      notes: [this.existingItem?.notes || ''],
      travel_tips: [this.existingItem?.travel_tips || ''],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || !this.destination) return;

    this.loading.set(true);
    const val = this.form.value;

    const payload: Partial<BucketListItem> = {
      status: val.status,
      target_year: val.target_year ? parseInt(val.target_year) : null,
      target_month: val.target_month || null,
      estimated_budget_usd: val.estimated_budget_usd ? parseFloat(val.estimated_budget_usd) : null,
      priority: val.priority,
      notes: val.notes || null,
      travel_tips: val.travel_tips || null,
    };

    if (this.existingItem) {
      const { error } = await this.bucketList.updateDetailedItem(this.existingItem.id, payload);
      this.loading.set(false);
      if (!error) {
        this.toast.success(`Updated details for ${this.destination.name}!`);
        this.saved.emit({ ...this.existingItem, ...payload } as BucketListItem);
        this.close();
      } else {
        this.toast.error('Failed to update item.');
      }
    } else {
      const { data, error } = await this.bucketList.addToList(this.destination.id, val.status, payload);
      this.loading.set(false);
      if (!error && data) {
        this.toast.success(`✨ Added ${this.destination.name} to your bucket list!`);
        this.saved.emit(data);
        this.close();
      } else {
        this.toast.error('Could not add to bucket list.');
      }
    }
  }

  close(): void {
    this.closed.emit();
  }
}

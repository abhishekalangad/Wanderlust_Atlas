import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ToastService } from '../../../core/services/toast.service';
import { Toast } from '../../../core/models/types';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('toastAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%) scale(0.9)' }),
        animate('300ms cubic-bezier(0.23, 1, 0.32, 1)',
          style({ opacity: 1, transform: 'translateX(0) scale(1)' })
        ),
      ]),
      transition(':leave', [
        animate('200ms ease-in',
          style({ opacity: 0, transform: 'translateX(100%) scale(0.9)' })
        ),
      ]),
    ]),
  ],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="toast.type" [@toastAnim]>
          <span class="toast-icon">{{ getIcon(toast) }}</span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 380px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-radius: 14px;
      backdrop-filter: blur(20px);
      border: 1px solid;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      font-size: 0.9rem;
      font-family: 'Inter', sans-serif;

      &.success {
        background: rgba(34, 197, 94, 0.15);
        border-color: rgba(34, 197, 94, 0.3);
        color: #86efac;
      }
      &.error {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.3);
        color: #fca5a5;
      }
      &.info {
        background: rgba(96, 165, 250, 0.15);
        border-color: rgba(96, 165, 250, 0.3);
        color: #93c5fd;
      }
      &.warning {
        background: rgba(245, 200, 66, 0.15);
        border-color: rgba(245, 200, 66, 0.3);
        color: #f5c842;
      }
    }

    .toast-icon { font-size: 1.1rem; flex-shrink: 0; }
    .toast-message { flex: 1; line-height: 1.4; }

    .toast-close {
      background: none;
      border: none;
      color: inherit;
      opacity: 0.5;
      cursor: pointer;
      font-size: 0.8rem;
      padding: 2px 4px;
      border-radius: 4px;
      transition: opacity 0.2s;
      flex-shrink: 0;

      &:hover { opacity: 1; }
    }
  `],
})
export class ToastComponent {
  toastService = inject(ToastService);

  getIcon(toast: Toast): string {
    const icons: Record<Toast['type'], string> = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️',
    };
    return icons[toast.type];
  }
}

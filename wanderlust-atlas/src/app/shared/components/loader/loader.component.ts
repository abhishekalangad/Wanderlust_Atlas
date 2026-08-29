import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-wrapper">
      <div class="loader-ring">
        <div></div><div></div><div></div><div></div>
      </div>
      <p class="loader-text">Discovering destinations…</p>
    </div>
  `,
  styles: [`
    .loader-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: 80px 0;
    }

    .loader-ring {
      display: inline-block;
      position: relative;
      width: 64px;
      height: 64px;

      div {
        box-sizing: border-box;
        display: block;
        position: absolute;
        width: 52px;
        height: 52px;
        margin: 6px;
        border: 3px solid transparent;
        border-radius: 50%;
        animation: ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;

        &:nth-child(1) { border-top-color: var(--coral); animation-delay: -0.45s; }
        &:nth-child(2) { border-top-color: var(--amber); animation-delay: -0.3s; }
        &:nth-child(3) { border-top-color: var(--coral); animation-delay: -0.15s; }
        &:nth-child(4) { border-top-color: var(--amber); }
      }
    }

    .loader-text {
      color: var(--white-60);
      font-size: 0.9rem;
      letter-spacing: 0.05em;
      animation: pulse 2s ease infinite;
    }

    @keyframes ring {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
  `],
})
export class LoaderComponent {}

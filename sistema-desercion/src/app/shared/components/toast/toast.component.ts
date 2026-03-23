import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../shared/services/toast.service';
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast"
             [class.toast--exito]="toast.tipo === 'exito'"
             [class.toast--error]="toast.tipo === 'error'"
             [class.toast--aviso]="toast.tipo === 'aviso'"
             (click)="toastService.eliminar(toast.id)">
          <span class="toast-icon">
            @if (toast.tipo === 'exito')  { ✓ }
            @if (toast.tipo === 'error')  { ✕ }
            @if (toast.tipo === 'aviso')  { ⚠ }
          </span>
          {{ toast.mensaje }}
        </div>
      }
    </div>
  `,
  styles: [`
    .toast { cursor: pointer; }
    .toast-icon { font-weight: 800; font-size: 1rem; }
  `],
})
export class ToastComponent {
  toastService = inject(ToastService);
}

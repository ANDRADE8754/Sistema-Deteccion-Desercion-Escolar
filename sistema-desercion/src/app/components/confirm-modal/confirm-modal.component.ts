import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent {
  @Input() titulo: string = 'Confirmar acción';
  @Input() mensaje: string = '¿Estás seguro?';
  @Input() textoConfirmar: string = 'Eliminar';
  @Input() isOpen: boolean = false;
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
  onConfirmar() {
    this.confirmar.emit();
  }
  onCancelar() {
    this.cancelar.emit();
  }
}

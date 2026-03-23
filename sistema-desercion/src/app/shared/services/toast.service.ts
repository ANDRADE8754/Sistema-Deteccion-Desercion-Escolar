import { Injectable, signal, computed } from '@angular/core';
export type ToastTipo = 'exito' | 'error' | 'aviso';
export interface Toast {
  id: string;
  mensaje: string;
  tipo: ToastTipo;
}
@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  toasts = computed(() => this._toasts());
  mostrar(mensaje: string, tipo: ToastTipo = 'exito', duracionMs = 3000): void {
    const id = crypto.randomUUID();
    this._toasts.update(ts => [...ts, { id, mensaje, tipo }]);
    setTimeout(() => this.eliminar(id), duracionMs);
  }
  exito(mensaje: string): void  { this.mostrar(mensaje, 'exito'); }
  error(mensaje: string): void  { this.mostrar(mensaje, 'error', 4500); }
  aviso(mensaje: string): void  { this.mostrar(mensaje, 'aviso'); }
  eliminar(id: string): void {
    this._toasts.update(ts => ts.filter(t => t.id !== id));
  }
}

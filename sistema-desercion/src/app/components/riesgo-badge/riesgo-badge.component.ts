import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-riesgo-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!--
      [ngClass] aplica clases CSS de forma dinámica según el valor de nivel.
      ngClass acepta un objeto donde las llaves son clases y los valores
      son condiciones booleanas.
    -->
    <span class="badge" [ngClass]="'badge--' + nivel">
      {{ etiqueta }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge--bajo   { background: #d4edda; color: #155724; }
    .badge--medio  { background: #fff3cd; color: #856404; }
    .badge--alto   { background: #f8d7da; color: #721c24; }
  `]
})
export class RiesgoBadgeComponent {
  @Input() nivel: 'bajo' | 'medio' | 'alto' = 'bajo';
  get etiqueta(): string{
    const etiquetas = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' };
    return etiquetas[this.nivel];
  }
}

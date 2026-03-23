import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { CursoService } from '../../../services/curso.service';
import { Curso } from '../../../core/models/curso.model';
@Component({
  selector: 'app-curso-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  template: `
    @if (cargando()) {
      <div class="loading-spinner">Cargando curso...</div>
    }
    @if (!cargando() && !curso()) {
      <div class="estado-vacio">
        <div class="vacio-icon"><span class="material-symbols-rounded" style="font-size: inherit;">sentiment_dissatisfied</span></div>
        <p>Curso no encontrado</p>
        <a routerLink="/cursos" class="btn btn--primario">← Volver a Cursos</a>
      </div>
    }
    @if (!cargando() && curso()) {
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="/cursos" class="breadcrumb__link" style="display: flex; align-items: center; gap: 0.3rem;"><span class="material-symbols-rounded" style="font-size: 1.1rem;">library_books</span> Cursos</a>
        <span class="breadcrumb__sep">›</span>
        <span class="breadcrumb__current">{{ curso()!.nombre }}</span>
        <span class="badge badge--bajo">Paralelo {{ curso()!.paralelo }}</span>
      </div>
      <div class="curso-info">
        <div>
          <h1>{{ curso()!.nombre }}</h1>
          <p class="curso-meta" style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="material-symbols-rounded" style="font-size: 1.1rem; color: #64748b;">account_balance</span> {{ curso()!.escuela }} · 
            <span class="material-symbols-rounded" style="font-size: 1.1rem; color: #64748b;">calendar_month</span> {{ curso()!.anioLectivo }}
          </p>
        </div>
      </div>
      <!-- Tab Navigation -->
      <nav class="tab-nav">
        <a [routerLink]="['estudiantes']"
           routerLinkActive="active"
           class="tab-item">
          <span style="display: flex; align-items: center; gap: 0.35rem;"><span class="material-symbols-rounded">groups</span> Estudiantes</span>
        </a>
        <a [routerLink]="['asistencia']"
           routerLinkActive="active"
           class="tab-item">
          <span style="display: flex; align-items: center; gap: 0.35rem;"><span class="material-symbols-rounded">fact_check</span> Asistencia</span>
        </a>
        <a [routerLink]="['calificaciones']"
           routerLinkActive="active"
           class="tab-item">
          <span style="display: flex; align-items: center; gap: 0.35rem;"><span class="material-symbols-rounded">assignment</span> Calificaciones</span>
        </a>
        <a [routerLink]="['dashboard']"
           routerLinkActive="active"
           class="tab-item">
          <span style="display: flex; align-items: center; gap: 0.35rem;"><span class="material-symbols-rounded">insights</span> Dashboard</span>
        </a>
      </nav>
      <router-outlet />
    }
  `,
  styles: [`
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      font-size: 0.875rem;
      flex-wrap: wrap;
      &__link { color: #059669; text-decoration: none; font-weight: 600; &:hover { text-decoration: underline; } }
      &__sep { color: #9ca3af; }
      &__current { color: #374151; font-weight: 600; }
    }
    .curso-info {
      margin-bottom: 1.5rem;
      h1 { font-size: 1.65rem; font-weight: 800; color: #14532d; margin: 0 0 0.25rem; }
    }
    .curso-meta { color: #6b7280; font-size: 0.9rem; margin: 0; }
  `],
})
export class CursoDetalleComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private cursoService = inject(CursoService);
  curso    = signal<Curso | null>(null);
  cargando = signal(true);
  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('cursoId')!;
    const c = await this.cursoService.getById(id);
    this.curso.set(c ?? null);
    this.cargando.set(false);
  }
}

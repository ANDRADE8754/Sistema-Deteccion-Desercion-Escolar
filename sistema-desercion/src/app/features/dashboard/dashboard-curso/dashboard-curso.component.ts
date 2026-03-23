import { Component, OnInit, OnDestroy, inject, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EstudianteService } from '../../../services/estudiante.service';
import { AsistenciaService } from '../../../services/asistencia.service';
import { CalificacionService } from '../../../services/calificacion.service';
import { RiesgoService } from '../../../services/riesgo.service';
import { ResultadoRiesgo, NivelRiesgo } from '../../../core/models/riesgo.model';
import { Estudiante } from '../../../core/models/estudiante.model';
import Chart from 'chart.js/auto';
interface EstadoEstudiante {
  estudiante: Estudiante;
  riesgo: ResultadoRiesgo | null;
}
@Component({
  selector: 'app-dashboard-curso',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-curso.component.html',
  styleUrl: './dashboard-curso.component.scss',
})
export class DashboardCursoComponent implements OnInit, OnDestroy {
  private route         = inject(ActivatedRoute);
  private estudService  = inject(EstudianteService);
  private asistService  = inject(AsistenciaService);
  private califService  = inject(CalificacionService);
  private riesgoService = inject(RiesgoService);
  @ViewChild('chartAsistencia') chartAsistenciaRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartRendimiento') chartRendimientoRef!: ElementRef<HTMLCanvasElement>;
  cursoId   = '';
  cargando  = signal(true);
  estados   = signal<EstadoEstudiante[]>([]);
  private charts: Chart[] = [];
  stats = signal({
    total: 0, riesgoAlto: 0, riesgoMedio: 0, riesgoBajo: 0,
    promedioCurso: 0, mejorEstudiante: null as EstadoEstudiante | null,
    peorEstudiante: null as EstadoEstudiante | null,
  });
  async ngOnInit(): Promise<void> {
    this.cursoId = this.route.parent?.snapshot.paramMap.get('cursoId') ?? '';
    await this.cargar();
  }
  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }
  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const estudiantes = await this.estudService.getByCurso(this.cursoId);
      const estadosList = await Promise.all(
        estudiantes.map(async e => {
          const riesgo = await this.riesgoService.calcular(e.id, this.cursoId);
          return { estudiante: e, riesgo };
        })
      );
      this.estados.set(estadosList);
      this.calcularStats(estadosList);
    } finally {
      this.cargando.set(false);
      setTimeout(() => this.renderCharts(), 50);
    }
  }
  private calcularStats(estados: EstadoEstudiante[]): void {
    const conRiesgo = estados.filter(e => e.riesgo);
    const promedios = conRiesgo.map(e => e.riesgo!.detalles.promedio).filter(p => p > 0);
    const promedioCurso = promedios.length
      ? Math.round((promedios.reduce((s, p) => s + p, 0) / promedios.length) * 10) / 10
      : 0;
    const sorted = [...conRiesgo].sort((a, b) =>
      (b.riesgo?.detalles.promedio ?? 0) - (a.riesgo?.detalles.promedio ?? 0)
    );
    this.stats.set({
      total: estados.length,
      riesgoAlto:  conRiesgo.filter(e => e.riesgo?.nivel === 'alto').length,
      riesgoMedio: conRiesgo.filter(e => e.riesgo?.nivel === 'medio').length,
      riesgoBajo:  conRiesgo.filter(e => e.riesgo?.nivel === 'bajo').length,
      promedioCurso,
      mejorEstudiante: sorted[0] ?? null,
      peorEstudiante: sorted[sorted.length - 1] ?? null,
    });
  }
  private renderCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    const est = this.estados();
    if (!est.length) return;
    if (this.chartAsistenciaRef?.nativeElement) {
      const s = this.stats();
      const chart = new Chart(this.chartAsistenciaRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Riesgo Bajo', 'Riesgo Medio', 'Riesgo Alto'],
          datasets: [{
            data: [s.riesgoBajo, s.riesgoMedio, s.riesgoAlto],
            backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
            borderWidth: 2,
            borderColor: '#fff',
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } },
          cutout: '60%',
        },
      });
      this.charts.push(chart);
    }
    if (this.chartRendimientoRef?.nativeElement) {
      const labels = est.map(e => `${e.estudiante.nombres.split(' ')[0]} ${e.estudiante.apellidos.split(' ')[0]}`);
      const data   = est.map(e => e.riesgo?.detalles.promedio ?? 0);
      const colors = est.map(e => {
        const n = e.riesgo?.nivel;
        return n === 'alto' ? '#ef4444' : n === 'medio' ? '#f59e0b' : '#22c55e';
      });
      const chart = new Chart(this.chartRendimientoRef.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Promedio',
            data,
            backgroundColor: colors,
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          scales: {
            y: { min: 0, max: 10, ticks: { stepSize: 1 } },
          },
          plugins: { legend: { display: false } },
        },
      });
      this.charts.push(chart);
    }
  }
  getNombre(e: Estudiante): string {
    return this.estudService.getNombreCompleto(e);
  }
}

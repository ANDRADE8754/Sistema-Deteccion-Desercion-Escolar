import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CursoService } from '../../../services/curso.service';
import { EstudianteService } from '../../../services/estudiante.service';
import { RiesgoService } from '../../../services/riesgo.service';
import { Curso } from '../../../core/models/curso.model';
import { Estudiante } from '../../../core/models/estudiante.model';
import { ResultadoRiesgo } from '../../../core/models/riesgo.model';
import Chart from 'chart.js/auto';
interface ResumenCurso {
  curso: Curso;
  totalEstudiantes: number;
  riesgoAlto: number;
  riesgoMedio: number;
  riesgoBajo: number;
  promedio: number;
}
interface DatosGlobal {
  totalCursos: number;
  totalEstudiantes: number;
  totalRiesgoAlto: number;
  totalRiesgoMedio: number;
  totalRiesgoBajo: number;
  promedioGeneral: number;
  totalHombres: number;
  totalMujeres: number;
  edadPromedio: number;
}
@Component({
  selector: 'app-dashboard-general',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-general.component.html',
  styleUrl: './dashboard-general.component.scss',
})
export class DashboardGeneralComponent implements OnInit, OnDestroy {
  private cursoService  = inject(CursoService);
  private estudService  = inject(EstudianteService);
  private riesgoService = inject(RiesgoService);
  @ViewChild('chartGlobal') chartGlobalRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartGenero') chartGeneroRef!: ElementRef<HTMLCanvasElement>;
  cargando       = signal(true);
  resumenCursos  = signal<ResumenCurso[]>([]);
  global         = signal<DatosGlobal | null>(null);
  private charts: Chart[] = [];
  async ngOnInit(): Promise<void> {
    await this.cargar();
  }
  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }
  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const cursos = await this.cursoService.getAll();
      const resumenList: ResumenCurso[] = [];
      let totalEstudiantes = 0, totalAlto = 0, totalMedio = 0, totalBajo = 0;
      let promedioSum = 0, promedioCount = 0;
      let hombres = 0, mujeres = 0;
      let edadSum = 0, edadCount = 0;
      for (const curso of cursos) {
        const estudiantes = await this.estudService.getByCurso(curso.id);
        let cursoAlto = 0, cursoMedio = 0, cursoBajo = 0, cursoPromedioSum = 0, cursoPromedioCount = 0;
        for (const e of estudiantes) {
          const r = await this.riesgoService.calcular(e.id, curso.id);
          if (r.nivel === 'alto')  cursoAlto++;
          if (r.nivel === 'medio') cursoMedio++;
          if (r.nivel === 'bajo')  cursoBajo++;
          if (r.detalles.promedio > 0) {
            cursoPromedioSum += r.detalles.promedio;
            cursoPromedioCount++;
            promedioSum += r.detalles.promedio;
            promedioCount++;
          }
          if (e.genero === 'M') hombres++;
          if (e.genero === 'F') mujeres++;
          edadSum += e.edad;
          edadCount++;
        }
        totalEstudiantes += estudiantes.length;
        totalAlto  += cursoAlto;
        totalMedio += cursoMedio;
        totalBajo  += cursoBajo;
        resumenList.push({
          curso, totalEstudiantes: estudiantes.length,
          riesgoAlto: cursoAlto, riesgoMedio: cursoMedio, riesgoBajo: cursoBajo,
          promedio: cursoPromedioCount ? Math.round(cursoPromedioSum / cursoPromedioCount * 10) / 10 : 0,
        });
      }
      this.resumenCursos.set(resumenList);
      this.global.set({
        totalCursos: cursos.length,
        totalEstudiantes,
        totalRiesgoAlto: totalAlto,
        totalRiesgoMedio: totalMedio,
        totalRiesgoBajo: totalBajo,
        promedioGeneral: promedioCount ? Math.round(promedioSum / promedioCount * 10) / 10 : 0,
        totalHombres: hombres,
        totalMujeres: mujeres,
        edadPromedio: edadCount ? Math.round(edadSum / edadCount * 10) / 10 : 0,
      });
    } finally {
      this.cargando.set(false);
      setTimeout(() => this.renderCharts(), 50);
    }
  }
  private renderCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    const g = this.global();
    if (!g) return;
    if (this.chartGlobalRef?.nativeElement) {
      const chart = new Chart(this.chartGlobalRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Riesgo Bajo', 'Riesgo Medio', 'Riesgo Alto'],
          datasets: [{
            data: [g.totalRiesgoBajo, g.totalRiesgoMedio, g.totalRiesgoAlto],
            backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
            borderWidth: 2, borderColor: '#fff',
          }],
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '60%' },
      });
      this.charts.push(chart);
    }
    if (this.chartGeneroRef?.nativeElement) {
      const chart = new Chart(this.chartGeneroRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Hombres', 'Mujeres'],
          datasets: [{
            data: [g.totalHombres, g.totalMujeres],
            backgroundColor: ['#3b82f6', '#ec4899'],
            borderWidth: 2, borderColor: '#fff',
          }],
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '60%' },
      });
      this.charts.push(chart);
    }
  }
}

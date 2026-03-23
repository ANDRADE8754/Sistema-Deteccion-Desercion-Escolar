import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AsistenciaService } from '../../services/asistencia.service';
import { EstudianteService } from '../../services/estudiante.service';
import { ToastService } from '../../shared/services/toast.service';
import { Estudiante } from '../../core/models/estudiante.model';
import { EstadoAsistencia, RegistroAsistencia } from '../../core/models/asistencia.model';
interface FilaAsistencia {
  estudiante: Estudiante;
  estado: EstadoAsistencia | null;
  guardando: boolean;
}
@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencia.component.html',
  styleUrl: './asistencia.component.scss',
})
export class AsistenciaComponent implements OnInit {
  private route         = inject(ActivatedRoute);
  private asistService  = inject(AsistenciaService);
  private estudService  = inject(EstudianteService);
  private toast         = inject(ToastService);
  cursoId   = '';
  fechaHoy  = new Date().toISOString().slice(0, 10);
  fechaSel  = signal(this.fechaHoy);
  filas     = signal<FilaAsistencia[]>([]);
  cargando  = signal(true);
  fechas    = signal<string[]>([]);
  resumen = computed(() => ({
    presentes:    this.filas().filter(f => f.estado === 'presente').length,
    ausentes:     this.filas().filter(f => f.estado === 'ausente').length,
    justificados: this.filas().filter(f => f.estado === 'justificado').length,
    tardanzas:    this.filas().filter(f => f.estado === 'tardanza').length,
  }));
  estados: EstadoAsistencia[] = ['presente', 'ausente', 'justificado', 'tardanza'];
  etiquetaEstado: Record<EstadoAsistencia, string> = {
    presente: 'Presente',
    ausente: 'Ausente',
    justificado: 'Justificado',
    tardanza: 'Tardanza',
  };
  async ngOnInit(): Promise<void> {
    this.cursoId = this.route.parent?.snapshot.paramMap.get('cursoId') ?? '';
    await this.cargarFechas();
    await this.cargarAsistencia();
  }
  private async cargarFechas(): Promise<void> {
    const fechas = await this.asistService.getFechasDeCurso(this.cursoId);
    if (!fechas.includes(this.fechaHoy)) fechas.push(this.fechaHoy);
    this.fechas.set(fechas.sort().reverse());
  }
  async cargarAsistencia(): Promise<void> {
    this.cargando.set(true);
    try {
      const [estudiantes, registros] = await Promise.all([
        this.estudService.getByCurso(this.cursoId),
        this.asistService.getPorFecha(this.cursoId, this.fechaSel()),
      ]);
      const mapaEstados = new Map<string, EstadoAsistencia>(
        registros.map(r => [r.estudianteId, r.estado])
      );
      this.filas.set(
        estudiantes.map(e => ({
          estudiante: e,
          estado: mapaEstados.get(e.id) ?? null,
          guardando: false,
        }))
      );
    } finally {
      this.cargando.set(false);
    }
  }
  async cambiarFecha(fecha: string): Promise<void> {
    this.fechaSel.set(fecha);
    await this.cargarAsistencia();
  }
  async setEstado(index: number, estado: EstadoAsistencia): Promise<void> {
    const fila = this.filas()[index];
    if (fila.estado === estado) return;
    this.filas.update(lista => {
      const c = [...lista];
      c[index] = { ...c[index], guardando: true };
      return c;
    });
    try {
      await this.asistService.setEstado(
        this.cursoId, fila.estudiante.id, this.fechaSel(), estado
      );
      this.filas.update(lista => {
        const c = [...lista];
        c[index] = { ...c[index], estado, guardando: false };
        return c;
      });
    } catch {
      this.toast.error('Error al guardar asistencia');
      this.filas.update(lista => {
        const c = [...lista];
        c[index] = { ...c[index], guardando: false };
        return c;
      });
    }
  }
  async marcarTodosPresentes(): Promise<void> {
    const ids = this.filas().map(f => f.estudiante.id);
    try {
      await this.asistService.marcarTodosPresentes(this.cursoId, ids, this.fechaSel());
      this.filas.update(lista => lista.map(f => ({ ...f, estado: 'presente' as EstadoAsistencia })));
      this.toast.exito('Todos marcados como presentes');
    } catch {
      this.toast.error('Error al marcar asistencia');
    }
  }
  getNombreCompleto(e: Estudiante): string {
    return this.estudService.getNombreCompleto(e);
  }
}

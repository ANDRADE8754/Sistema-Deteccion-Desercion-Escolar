import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CalificacionService } from '../../services/calificacion.service';
import { EstudianteService } from '../../services/estudiante.service';
import { ToastService } from '../../shared/services/toast.service';
import { Actividad, TipoActividad } from '../../core/models/actividad.model';
import { Estudiante } from '../../core/models/estudiante.model';
interface FilaCalificacion {
  estudiante: Estudiante;
  notas: Map<string, number | null>;
  guardando: Map<string, boolean>;
  inputs: Map<string, string>;
  erroresNota: Map<string, string>;
}
type ModalActividad = 'cerrado' | 'crear' | 'editar' | 'eliminar';
@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calificaciones.component.html',
  styleUrl: './calificaciones.component.scss',
})
export class CalificacionesComponent implements OnInit {
  private route         = inject(ActivatedRoute);
  private califService  = inject(CalificacionService);
  private estudService  = inject(EstudianteService);
  private toast         = inject(ToastService);
  cursoId     = '';
  actividades = signal<Actividad[]>([]);
  filas       = signal<FilaCalificacion[]>([]);
  cargando    = signal(true);
  modalEstado   = signal<ModalActividad>('cerrado');
  actividadSel  = signal<Actividad | null>(null);
  guardandoModal = signal(false);
  tipos: TipoActividad[] = ['tarea', 'examen', 'participacion', 'proyecto'];
  iconoTipo: Record<TipoActividad, string> = {
    tarea: 'menu_book', examen: 'school', participacion: 'front_hand', proyecto: 'build',
  };
  form = {
    nombre: '', tipo: 'tarea' as TipoActividad,
    fecha: new Date().toISOString().slice(0, 10),
    ponderacion: 10, notaMaxima: 10,
  };
  erroresForm: Partial<Record<keyof typeof this.form, string>> = {};
  private readonly TECLAS_CONTROL = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
  filtrarNombreActividad(event: KeyboardEvent): void {
    if (this.TECLAS_CONTROL.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s]$/.test(event.key)) event.preventDefault();
  }
  filtrarNumeroPositivo(event: KeyboardEvent): void {
    if (this.TECLAS_CONTROL.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-' || event.key === '.') {
      event.preventDefault(); return;
    }
    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
  }
  sanitizarNombreActividad(): void {
    this.form.nombre = this.form.nombre.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s]/g, '');
  }
  async ngOnInit(): Promise<void> {
    this.cursoId = this.route.parent?.snapshot.paramMap.get('cursoId') ?? '';
    await this.cargar();
  }
  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const [actividades, estudiantes] = await Promise.all([
        this.califService.getActividades(this.cursoId),
        this.estudService.getByCurso(this.cursoId),
      ]);
      this.actividades.set(actividades);
      const filas: FilaCalificacion[] = await Promise.all(
        estudiantes.map(async e => {
          const califs = await this.califService.getCalificacionesPorEstudiante(e.id, this.cursoId);
          const mapaNotas = new Map<string, number | null>(califs.map(c => [c.actividadId, c.nota]));
          return {
            estudiante: e,
            notas: mapaNotas,
            guardando: new Map(),
            inputs: new Map(actividades.map(a => [a.id, this.notaToStr(mapaNotas.get(a.id))])),
            erroresNota: new Map(),
          };
        })
      );
      this.filas.set(filas);
    } finally {
      this.cargando.set(false);
    }
  }
  private notaToStr(nota: number | null | undefined): string {
    if (nota === null || nota === undefined) return '';
    return nota.toString();
  }
  async guardarNota(filaIndex: number, actividadId: string): Promise<void> {
    const fila = this.filas()[filaIndex];
    const rawVal = fila.inputs.get(actividadId) ?? '';
    const actividad = this.actividades().find(a => a.id === actividadId)!;
    let nota: number | null = null;
    if (rawVal.trim() !== '') {
      const parsed = parseFloat(rawVal.replace(',', '.'));
      if (isNaN(parsed) || parsed < 0 || parsed > actividad.notaMaxima) {
        this.actualizarFila(filaIndex, actividadId, {
          errorNota: `Nota entre 0 y ${actividad.notaMaxima}`,
        });
        return;
      }
      nota = Math.round(parsed * 10) / 10;
    }
    this.actualizarFila(filaIndex, actividadId, { guardando: true, errorNota: '' });
    try {
      await this.califService.setCalificacion(actividadId, fila.estudiante.id, this.cursoId, nota);
      this.actualizarFila(filaIndex, actividadId, {
        guardando: false, nota, input: nota !== null ? nota.toString() : '',
      });
    } catch {
      this.toast.error('Error al guardar la nota');
      this.actualizarFila(filaIndex, actividadId, { guardando: false });
    }
  }
  onInputKeydown(event: KeyboardEvent, filaIndex: number, actividadId: string): void {
    if (event.key === 'Enter' || event.key === 'Tab') {
      this.guardarNota(filaIndex, actividadId);
    }
  }
  onInputChange(filaIndex: number, actividadId: string, value: string): void {
    this.filas.update(lista => {
      const copia = lista.map(f => ({ ...f, inputs: new Map(f.inputs), erroresNota: new Map(f.erroresNota) }));
      copia[filaIndex].inputs.set(actividadId, value);
      copia[filaIndex].erroresNota.delete(actividadId);
      return copia;
    });
  }
  private actualizarFila(
    index: number,
    actividadId: string,
    { guardando, nota, input, errorNota }: { guardando?: boolean; nota?: number | null; input?: string; errorNota?: string }
  ): void {
    this.filas.update(lista => {
      const copia = lista.map(f => ({
        ...f,
        notas: new Map(f.notas),
        guardando: new Map(f.guardando),
        inputs: new Map(f.inputs),
        erroresNota: new Map(f.erroresNota),
      }));
      if (guardando !== undefined) copia[index].guardando.set(actividadId, guardando);
      if (nota !== undefined)      copia[index].notas.set(actividadId, nota);
      if (input !== undefined)     copia[index].inputs.set(actividadId, input);
      if (errorNota !== undefined) {
        if (errorNota) copia[index].erroresNota.set(actividadId, errorNota);
        else           copia[index].erroresNota.delete(actividadId);
      }
      return copia;
    });
  }
  abrirCrearActividad(): void {
    this.form = { nombre: '', tipo: 'tarea', fecha: new Date().toISOString().slice(0,10), ponderacion: 10, notaMaxima: 10 };
    this.erroresForm = {};
    this.modalEstado.set('crear');
  }
  abrirEditarActividad(a: Actividad): void {
    this.form = { nombre: a.nombre, tipo: a.tipo, fecha: a.fecha, ponderacion: a.ponderacion, notaMaxima: a.notaMaxima };
    this.erroresForm = {};
    this.actividadSel.set(a);
    this.modalEstado.set('editar');
  }
  abrirEliminarActividad(a: Actividad): void {
    this.actividadSel.set(a);
    this.modalEstado.set('eliminar');
  }
  cerrarModal(): void {
    this.modalEstado.set('cerrado');
    this.actividadSel.set(null);
  }
  async guardarActividad(): Promise<void> {
    if (!this.validarForm()) return;
    this.guardandoModal.set(true);
    try {
      if (this.modalEstado() === 'crear') {
        await this.califService.createActividad({ cursoId: this.cursoId, ...this.form });
        this.toast.exito('Actividad creada correctamente');
      } else {
        await this.califService.updateActividad(this.actividadSel()!.id, this.form);
        this.toast.exito('Actividad actualizada');
      }
      this.cerrarModal();
      await this.cargar();
    } catch { this.toast.error('Error al guardar la actividad'); }
    finally { this.guardandoModal.set(false); }
  }
  async eliminarActividad(): Promise<void> {
    this.guardandoModal.set(true);
    try {
      await this.califService.deleteActividad(this.actividadSel()!.id);
      this.toast.exito('Actividad eliminada');
      this.cerrarModal();
      await this.cargar();
    } catch { this.toast.error('Error al eliminar'); }
    finally { this.guardandoModal.set(false); }
  }
  private validarForm(): boolean {
    this.erroresForm = {};
    const nombre = this.form.nombre.trim();
    if (!nombre) this.erroresForm.nombre = 'El nombre es obligatorio';
    else if (nombre.length < 3) this.erroresForm.nombre = 'Mínimo 3 caracteres';
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s]+$/.test(nombre)) this.erroresForm.nombre = 'Solo letras, números y espacios';
    if (this.form.ponderacion < 1 || this.form.ponderacion > 100) this.erroresForm.ponderacion = 'Entre 1 y 100';
    if (this.form.notaMaxima < 1 || this.form.notaMaxima > 10) this.erroresForm.notaMaxima = 'Entre 1 y 10';
    return Object.keys(this.erroresForm).length === 0;
  }
  getNombreCompleto(e: Estudiante): string { return this.estudService.getNombreCompleto(e); }
  getInput(fila: FilaCalificacion, actId: string): string { return fila.inputs.get(actId) ?? ''; }
  isGuardando(fila: FilaCalificacion, actId: string): boolean { return fila.guardando.get(actId) ?? false; }
  getError(fila: FilaCalificacion, actId: string): string { return fila.erroresNota.get(actId) ?? ''; }
  getNota(fila: FilaCalificacion, actId: string): number | null | undefined { return fila.notas.get(actId); }
}

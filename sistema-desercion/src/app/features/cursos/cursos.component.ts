import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CursoService } from '../../services/curso.service';
import { EstudianteService } from '../../services/estudiante.service';
import { ToastService } from '../../shared/services/toast.service';
import { Curso } from '../../core/models/curso.model';
interface CursoConConteo extends Curso {
  totalEstudiantes: number;
}
type ModalEstado = 'cerrado' | 'crear' | 'editar' | 'confirmarEliminar';
@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cursos.component.html',
  styleUrl: './cursos.component.scss',
})
export class CursosComponent implements OnInit {
  private cursoService  = inject(CursoService);
  private estudService  = inject(EstudianteService);
  private toast         = inject(ToastService);
  cursos   = signal<CursoConConteo[]>([]);
  cargando = signal(true);
  modalEstado  = signal<ModalEstado>('cerrado');
  cursoSel     = signal<Curso | null>(null);
  guardando    = signal(false);
  form = {
    nombre:      '',
    escuela:     '',
    anioLectivo: '',
    paralelo:    '',
    descripcion: '',
  };
  errores: Partial<typeof this.form> = {};
  private readonly REGEX_NOMBRE_CURSO = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s]$/;
  private readonly REGEX_ESCUELA = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.#\-]$/;
  private readonly REGEX_ANIO = /^[0-9\-]$/;
  private readonly REGEX_PARALELO = /^[a-zA-Z]$/;
  private readonly REGEX_DESCRIPCION = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,;:()\-\/]$/;
  private readonly TECLAS_CONTROL = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
  filtrarNombreCurso(event: KeyboardEvent): void {
    if (this.TECLAS_CONTROL.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!this.REGEX_NOMBRE_CURSO.test(event.key)) event.preventDefault();
  }
  filtrarEscuela(event: KeyboardEvent): void {
    if (this.TECLAS_CONTROL.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!this.REGEX_ESCUELA.test(event.key)) event.preventDefault();
  }
  filtrarAnio(event: KeyboardEvent): void {
    if (this.TECLAS_CONTROL.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!this.REGEX_ANIO.test(event.key)) { event.preventDefault(); return; }
    const input = event.target as HTMLInputElement;
    if (input.value.length >= 9) event.preventDefault();
  }
  filtrarParalelo(event: KeyboardEvent): void {
    if (this.TECLAS_CONTROL.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!this.REGEX_PARALELO.test(event.key)) { event.preventDefault(); return; }
    const input = event.target as HTMLInputElement;
    if (input.value.length >= 1) event.preventDefault();
  }
  filtrarDescripcion(event: KeyboardEvent): void {
    if (this.TECLAS_CONTROL.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Enter') return;
    if (!this.REGEX_DESCRIPCION.test(event.key)) event.preventDefault();
  }
  sanitizarNombreCurso(): void {
    this.form.nombre = this.form.nombre.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s]/g, '');
  }
  sanitizarEscuela(): void {
    this.form.escuela = this.form.escuela.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.#\-]/g, '');
  }
  sanitizarAnio(): void {
    this.form.anioLectivo = this.form.anioLectivo.replace(/[^0-9\-]/g, '').slice(0, 9);
  }
  sanitizarParalelo(): void {
    this.form.paralelo = this.form.paralelo.replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase();
  }
  sanitizarDescripcion(): void {
    this.form.descripcion = this.form.descripcion.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,;:()\-\/\n]/g, '');
  }
  async ngOnInit(): Promise<void> {
    await this.cargarCursos();
  }
  async cargarCursos(): Promise<void> {
    this.cargando.set(true);
    try {
      const cursos = await this.cursoService.getAll();
      const cursosConConteo = await Promise.all(
        cursos.map(async c => ({
          ...c,
          totalEstudiantes: (await this.estudService.getByCurso(c.id)).length,
        })),
      );
      this.cursos.set(cursosConConteo.sort((a, b) => b.creadoEn - a.creadoEn));
    } finally {
      this.cargando.set(false);
    }
  }
  abrirCrear(): void {
    this.limpiarForm();
    this.cursoSel.set(null);
    this.modalEstado.set('crear');
  }
  abrirEditar(curso: Curso): void {
    this.form = {
      nombre:      curso.nombre,
      escuela:     curso.escuela,
      anioLectivo: curso.anioLectivo,
      paralelo:    curso.paralelo,
      descripcion: curso.descripcion ?? '',
    };
    this.errores = {};
    this.cursoSel.set(curso);
    this.modalEstado.set('editar');
  }
  abrirEliminar(curso: Curso): void {
    this.cursoSel.set(curso);
    this.modalEstado.set('confirmarEliminar');
  }
  cerrarModal(): void {
    this.modalEstado.set('cerrado');
    this.cursoSel.set(null);
    this.limpiarForm();
  }
  async guardar(): Promise<void> {
    if (!this.validar()) return;
    this.guardando.set(true);
    try {
      if (this.modalEstado() === 'crear') {
        await this.cursoService.create(this.form);
        this.toast.exito('Curso creado exitosamente');
      } else {
        await this.cursoService.update(this.cursoSel()!.id, this.form);
        this.toast.exito('Curso actualizado correctamente');
      }
      this.cerrarModal();
      await this.cargarCursos();
    } catch {
      this.toast.error('Error al guardar el curso. Intenta de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }
  async eliminar(): Promise<void> {
    const curso = this.cursoSel();
    if (!curso) return;
    this.guardando.set(true);
    try {
      await this.cursoService.delete(curso.id);
      await this.estudService.deleteByCurso(curso.id);
      this.toast.exito('Curso eliminado correctamente');
      this.cerrarModal();
      await this.cargarCursos();
    } catch {
      this.toast.error('Error al eliminar el curso.');
    } finally {
      this.guardando.set(false);
    }
  }
  private validar(): boolean {
    this.errores = {};
    const nombre = this.form.nombre.trim();
    if (!nombre) this.errores.nombre = 'El nombre es obligatorio';
    else if (nombre.length < 3) this.errores.nombre = 'Mínimo 3 caracteres';
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s]+$/.test(nombre)) this.errores.nombre = 'Solo letras, números y espacios';
    const escuela = this.form.escuela.trim();
    if (!escuela) this.errores.escuela = 'La escuela es obligatoria';
    else if (escuela.length < 3) this.errores.escuela = 'Mínimo 3 caracteres';
    const anio = this.form.anioLectivo.trim();
    if (!anio) this.errores.anioLectivo = 'El año lectivo es obligatorio';
    else if (!/^\d{4}-\d{4}$/.test(anio)) this.errores.anioLectivo = 'Formato: AAAA-AAAA (Ej: 2024-2025)';
    else {
      const [inicio, fin] = anio.split('-').map(Number);
      if (fin !== inicio + 1) this.errores.anioLectivo = 'El segundo año debe ser consecutivo';
    }
    const paralelo = this.form.paralelo.trim();
    if (!paralelo) this.errores.paralelo = 'El paralelo es obligatorio';
    else if (!/^[A-Z]$/.test(paralelo)) this.errores.paralelo = 'Solo una letra (A-Z)';
    return Object.keys(this.errores).length === 0;
  }
  private limpiarForm(): void {
    this.form = { nombre: '', escuela: '', anioLectivo: '', paralelo: '', descripcion: '' };
    this.errores = {};
  }
  protected readonly modalAbierto = () => this.modalEstado() !== 'cerrado';
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EstudianteService } from '../../services/estudiante.service';
import { RiesgoService } from '../../services/riesgo.service';
import { AsistenciaService } from '../../services/asistencia.service';
import { CalificacionService } from '../../services/calificacion.service';
import { ToastService } from '../../shared/services/toast.service';
import { Estudiante, Genero } from '../../core/models/estudiante.model';
import { ResultadoRiesgo } from '../../core/models/riesgo.model';
interface EstudianteConRiesgo extends Estudiante {
  riesgo?: ResultadoRiesgo;
  cargandoRiesgo: boolean;
}
type ModalEstado = 'cerrado' | 'crear' | 'editar' | 'eliminar' | 'verRiesgo';
@Component({
  selector: 'app-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estudiantes.component.html',
  styleUrl: './estudiantes.component.scss',
})
export class EstudiantesComponent implements OnInit {
  private route         = inject(ActivatedRoute);
  private estudService  = inject(EstudianteService);
  private riesgoService = inject(RiesgoService);
  private asistService  = inject(AsistenciaService);
  private califService  = inject(CalificacionService);
  private toast         = inject(ToastService);
  cursoId  = '';
  estudiantes = signal<EstudianteConRiesgo[]>([]);
  cargando    = signal(true);
  modalEstado  = signal<ModalEstado>('cerrado');
  estudianteSel = signal<EstudianteConRiesgo | null>(null);
  guardando     = signal(false);
  form = {
    nombres: '', apellidos: '', edad: null as number | null,
    genero: 'M' as Genero, telefonoFamiliar: '', observaciones: '',
  };
  errores: Partial<Record<keyof typeof this.form, string>> = {};
  private readonly REGEX_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]$/;
  private readonly REGEX_TELEFONO = /^[0-9]$/;
  private readonly REGEX_OBSERVACIONES = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,;:()\-\/]$/;
  private readonly TECLAS_CONTROL = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
  filtrarNombre(event: KeyboardEvent): void {
    if (this.TECLAS_CONTROL.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!this.REGEX_NOMBRE.test(event.key)) { event.preventDefault(); }
  }
  filtrarEdad(event: KeyboardEvent): void {
    if (this.TECLAS_CONTROL.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-' || event.key === '.') {
      event.preventDefault(); return;
    }
    if (!/^[0-9]$/.test(event.key)) { event.preventDefault(); return; }
    const input = event.target as HTMLInputElement;
    const currentVal = input.value;
    if (currentVal.length >= 2) { event.preventDefault(); }
  }
  filtrarTelefono(event: KeyboardEvent): void {
    if (this.TECLAS_CONTROL.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (!this.REGEX_TELEFONO.test(event.key)) { event.preventDefault(); return; }
    const input = event.target as HTMLInputElement;
    if (input.value.length >= 10) { event.preventDefault(); return; }
    if (input.value.length === 0 && event.key !== '0') { event.preventDefault(); }
  }
  filtrarObservaciones(event: KeyboardEvent): void {
    if (this.TECLAS_CONTROL.includes(event.key) || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Enter') return;
    if (!this.REGEX_OBSERVACIONES.test(event.key)) { event.preventDefault(); }
  }
  /** Sanitiza pegados para nombres */
  sanitizarNombre(campo: 'nombres' | 'apellidos'): void {
    this.form[campo] = this.form[campo].replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
  }
  /** Sanitiza pegados para teléfono */
  sanitizarTelefono(): void {
    let val = this.form.telefonoFamiliar.replace(/[^0-9]/g, '');
    if (val.length > 0 && val[0] !== '0') val = '0' + val;
    this.form.telefonoFamiliar = val.slice(0, 10);
  }
  /** Sanitiza pegados para edad */
  sanitizarEdad(): void {
    if (this.form.edad !== null) {
      const str = String(this.form.edad).replace(/[^0-9]/g, '').slice(0, 2);
      this.form.edad = str ? parseInt(str, 10) : null;
    }
  }
  /** Sanitiza pegados para observaciones */
  sanitizarObservaciones(): void {
    this.form.observaciones = this.form.observaciones.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,;:()\-\/\n]/g, '');
  }
  async ngOnInit(): Promise<void> {
    this.cursoId = this.route.parent?.snapshot.paramMap.get('cursoId') ?? '';
    await this.cargar();
  }
  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const lista = await this.estudService.getByCurso(this.cursoId);
      const withRiesgo: EstudianteConRiesgo[] = lista.map(e => ({
        ...e, riesgo: undefined, cargandoRiesgo: false,
      }));
      this.estudiantes.set(withRiesgo);
      withRiesgo.forEach((_, i) => this.calcularRiesgo(i));
    } finally {
      this.cargando.set(false);
    }
  }
  private async calcularRiesgo(index: number): Promise<void> {
    const lista = this.estudiantes();
    if (!lista[index]) return;
    this.actualizarEstudiante(index, { cargandoRiesgo: true });
    try {
      const riesgo = await this.riesgoService.calcular(lista[index].id, this.cursoId);
      this.actualizarEstudiante(index, { riesgo, cargandoRiesgo: false });
    } catch {
      this.actualizarEstudiante(index, { cargandoRiesgo: false });
    }
  }
  private actualizarEstudiante(index: number, update: Partial<EstudianteConRiesgo>): void {
    this.estudiantes.update(lista => {
      const copia = [...lista];
      copia[index] = { ...copia[index], ...update };
      return copia;
    });
  }
  abrirCrear(): void {
    this.limpiarForm();
    this.estudianteSel.set(null);
    this.modalEstado.set('crear');
  }
  abrirEditar(e: EstudianteConRiesgo): void {
    this.form = {
      nombres: e.nombres, apellidos: e.apellidos, edad: e.edad,
      genero: e.genero, telefonoFamiliar: e.telefonoFamiliar ?? '',
      observaciones: e.observaciones ?? '',
    };
    this.errores = {};
    this.estudianteSel.set(e);
    this.modalEstado.set('editar');
  }
  abrirEliminar(e: EstudianteConRiesgo): void {
    this.estudianteSel.set(e);
    this.modalEstado.set('eliminar');
  }
  verRiesgo(e: EstudianteConRiesgo): void {
    this.estudianteSel.set(e);
    this.modalEstado.set('verRiesgo');
  }
  cerrarModal(): void {
    this.modalEstado.set('cerrado');
    this.estudianteSel.set(null);
    this.limpiarForm();
  }
  async guardar(): Promise<void> {
    if (!this.validar()) return;
    this.guardando.set(true);
    try {
      const data = {
        cursoId: this.cursoId,
        nombres: this.form.nombres.trim(),
        apellidos: this.form.apellidos.trim(),
        edad: this.form.edad!,
        genero: this.form.genero,
        telefonoFamiliar: this.form.telefonoFamiliar.trim() || undefined,
        observaciones: this.form.observaciones.trim() || undefined,
      };
      if (this.modalEstado() === 'crear') {
        await this.estudService.create(data);
        this.toast.exito('Estudiante registrado correctamente');
      } else {
        await this.estudService.update(this.estudianteSel()!.id, data);
        this.toast.exito('Datos del estudiante actualizados');
      }
      this.cerrarModal();
      await this.cargar();
    } catch {
      this.toast.error('Error al guardar. Intenta de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }
  async eliminar(): Promise<void> {
    const e = this.estudianteSel();
    if (!e) return;
    this.guardando.set(true);
    try {
      await this.estudService.delete(e.id);
      await this.asistService.deletePorEstudiante(e.id);
      this.toast.exito('Estudiante eliminado correctamente');
      this.cerrarModal();
      await this.cargar();
    } catch {
      this.toast.error('Error al eliminar el estudiante.');
    } finally {
      this.guardando.set(false);
    }
  }
  private validar(): boolean {
    this.errores = {};
    const n = this.form.nombres.trim();
    const a = this.form.apellidos.trim();
    if (!n) this.errores.nombres = 'Los nombres son obligatorios';
    else if (n.length < 2) this.errores.nombres = 'Mínimo 2 caracteres';
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(n)) this.errores.nombres = 'Solo letras, espacios, tildes y ñ';
    if (!a) this.errores.apellidos = 'Los apellidos son obligatorios';
    else if (a.length < 2) this.errores.apellidos = 'Mínimo 2 caracteres';
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(a)) this.errores.apellidos = 'Solo letras, espacios, tildes y ñ';
    if (this.form.edad === null || this.form.edad === undefined) this.errores.edad = 'La edad es obligatoria';
    else if (this.form.edad < 3 || this.form.edad > 20) this.errores.edad = 'Edad válida: entre 3 y 20 años';
    const tel = this.form.telefonoFamiliar.trim();
    if (tel) {
      if (!/^0[0-9]{9}$/.test(tel)) this.errores.telefonoFamiliar = 'Debe tener 10 dígitos y empezar con 0';
    }
    return Object.keys(this.errores).length === 0;
  }
  private limpiarForm(): void {
    this.form = { nombres: '', apellidos: '', edad: null, genero: 'M', telefonoFamiliar: '', observaciones: '' };
    this.errores = {};
  }
  getNombreCompleto(e: Estudiante): string {
    return this.estudService.getNombreCompleto(e);
  }
  getColorNivel(nivel?: 'bajo' | 'medio' | 'alto'): string {
    if (!nivel) return '';
    return { bajo: '#059669', medio: '#d97706', alto: '#dc2626' }[nivel];
  }
}

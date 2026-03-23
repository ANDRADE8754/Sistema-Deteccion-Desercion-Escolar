import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { RiesgoBadgeComponent } from '../../components/riesgo-badge/riesgo-badge.component';
import { Estudiante, NivelRiesgo } from '../../models/estudiante.model';
import { Curso } from '../../models/curso.model';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';
@Component({
  selector: 'app-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule, RiesgoBadgeComponent, ConfirmModalComponent],
  templateUrl: './estudiantes.component.html',
  styleUrl: './estudiantes.component.scss'
})
export class EstudiantesComponent implements OnInit {
  curso: Curso | undefined;
  estudiantes: Estudiante[] = [];
  mostrarFormulario = false;
  nuevoEstudiante = { nombres: '', apellidos: '' };
  errorNombres = '';
  errorApellidos = '';
  showModal = false;
  estudianteToDelete: string | null = null;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storageService: StorageService
  ) {}
  ngOnInit(): void {
    const cursoId = this.route.snapshot.paramMap.get('cursoId');
    if (!cursoId) { this.router.navigate(['/cursos']); return; }
    this.curso = this.storageService.getCursos().find(c => c.id === cursoId);
    this.cargarEstudiantes(cursoId);
  }
  cargarEstudiantes(cursoId: string): void {
    this.estudiantes = this.storageService.getEstudiantesByCurso(cursoId);
  }
  filtrarLetras(campo: 'nombres' | 'apellidos'): void {
    const valorOriginal = this.nuevoEstudiante[campo];
    const filtrado = valorOriginal.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    if (valorOriginal !== filtrado) {
      this.nuevoEstudiante[campo] = filtrado;
    }
    this.validarEstudiante();
  }
  validarEstudiante(): boolean {
    let valido = true;
    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    this.nuevoEstudiante.nombres = this.nuevoEstudiante.nombres.trim();
    this.nuevoEstudiante.apellidos = this.nuevoEstudiante.apellidos.trim();
    if (!this.nuevoEstudiante.nombres) {
      this.errorNombres = 'El nombre es obligatorio.';
      valido = false;
    } else if (!regexLetras.test(this.nuevoEstudiante.nombres)) {
      this.errorNombres = 'Solo se permiten letras y espacios, no usar números ni símbolos.';
      valido = false;
    } else {
      this.errorNombres = '';
    }
    if (this.nuevoEstudiante.apellidos && !regexLetras.test(this.nuevoEstudiante.apellidos)) {
      this.errorApellidos = 'Solo se permiten letras y espacios, no usar números ni símbolos.';
      valido = false;
    } else {
      this.errorApellidos = '';
    }
    return valido;
  }
  guardarEstudiante(): void {
    if (!this.validarEstudiante() || !this.curso) return;
    const estudiante: Estudiante = {
      id: this.storageService.generateId(),
      cursoId: this.curso.id,
      nombres: this.nuevoEstudiante.nombres,
      apellidos: this.nuevoEstudiante.apellidos,
      creadoEn: Date.now(),
      vecesAusente: 0,
      vecesSinTarea: 0,
      vecesBajoRendimiento: 0,
      nivelRiesgo: 'bajo'
    };
    this.storageService.saveEstudiante(estudiante);
    this.cargarEstudiantes(this.curso.id);
    this.nuevoEstudiante = { nombres: '', apellidos: '' };
    this.mostrarFormulario = false;
    this.errorNombres = '';
    this.errorApellidos = '';
  }
  actualizarChecklist(estudiante: Estudiante): void {
    estudiante.nivelRiesgo = this.calcularNivelRiesgo(estudiante);
    this.storageService.updateEstudiante(estudiante);
  }
  incrementar(estudiante: Estudiante, campo: 'vecesAusente' | 'vecesSinTarea' | 'vecesBajoRendimiento'): void {
    estudiante[campo]++;
    this.actualizarChecklist(estudiante);
  }
  decrementar(estudiante: Estudiante, campo: 'vecesAusente' | 'vecesSinTarea' | 'vecesBajoRendimiento'): void {
    if (estudiante[campo] > 0) {
      estudiante[campo]--;
      this.actualizarChecklist(estudiante);
    }
  }
  pedirEliminar(id: string): void {
    this.estudianteToDelete = id;
    this.showModal = true;
  }
  confirmarEliminar(): void {
    if(this.estudianteToDelete) {
        this.storageService.deleteEstudiante(this.estudianteToDelete);
        if (this.curso) this.cargarEstudiantes(this.curso.id);
    }
    this.cerrarModal();
  }
  cerrarModal(): void {
    this.showModal = false;
    this.estudianteToDelete = null;
  }
  getDescripcionRiesgo(estudiante: Estudiante): string {
    const descripciones: Record<NivelRiesgo, string> = {
      bajo: 'Sin señales de alerta relevantes por el momento.',
      medio: 'Riesgo moderado. Conviene seguimiento académico cercano.',
      alto: 'Riesgo alto. Se recomienda intervención inmediata.'
    };
    return descripciones[estudiante.nivelRiesgo];
  }
  volver(): void {
    this.router.navigate(['/cursos']);
  }
  private calcularNivelRiesgo(estudiante: Estudiante): NivelRiesgo {
    const puntaje =
      estudiante.vecesAusente +
      estudiante.vecesSinTarea +
      (estudiante.vecesBajoRendimiento * 2);
    if (puntaje >= 6) return 'alto';
    if (puntaje >= 3) return 'medio';
    return 'bajo';
  }
  trackById(index: number, est: Estudiante): string { return est.id; }
}

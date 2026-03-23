
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { Curso } from '../../models/curso.model';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './cursos.component.html',
  styleUrl: './cursos.component.scss'
})
export class CursosComponent implements OnInit {

  cursos: Curso[] = [];
  mostrarFormulario: boolean = false;

  nuevoCurso = { nombre: '', descripcion: '' };
  
  errorNombre = '';
  
  showModal = false;
  cursoToDelete: string | null = null;

  constructor(
    private storageService: StorageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarCursos();
  }

  cargarCursos(): void {
    this.cursos = this.storageService.getCursos();
  }

  filtrarAlfanumerico(campo: 'nombre' | 'descripcion'): void {
    const valorOriginal = this.nuevoCurso[campo];
    // Elimina caracteres especiales que no vengan al caso, deja letras, números, guiones y puntos
    const filtrado = valorOriginal.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\-\.\s]/g, '');
    
    if (valorOriginal !== filtrado) {
      this.nuevoCurso[campo] = filtrado;
    }
    if (campo === 'nombre') {
      this.validarNombre();
    }
  }
  
  validarNombre(): boolean {
    const nom = this.nuevoCurso.nombre.trim();
    if (!nom) {
      this.errorNombre = 'El nombre es obligatorio.';
      return false;
    }
    // Letras, números, guiones, puntos y espacios
    const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\-\.\s]+$/;
    if (!regex.test(nom)) {
      this.errorNombre = 'Solo se permiten letras, números, puntos y guiones.';
      return false;
    }
    this.errorNombre = '';
    return true;
  }

  guardarCurso(): void {
    if (!this.validarNombre()) return;

    const curso: Curso = {
      id: this.storageService.generateId(),
      nombre: this.nuevoCurso.nombre.trim(),
      descripcion: this.nuevoCurso.descripcion.trim(),
      creadoEn: Date.now()
    };

    this.storageService.saveCurso(curso);
    this.cursos = this.storageService.getCursos();
    this.nuevoCurso = { nombre: '', descripcion: '' };
    this.mostrarFormulario = false;
  }

  verEstudiantes(cursoId: string): void {
    this.router.navigate(['/cursos', cursoId, 'estudiantes']);
  }

  pedirEliminar(id: string, event: Event): void {
    event.stopPropagation();
    this.cursoToDelete = id;
    this.showModal = true;
  }
  
  confirmarEliminar(): void {
    if(this.cursoToDelete) {
        this.storageService.deleteCurso(this.cursoToDelete);
        this.cargarCursos();
    }
    this.cerrarModal();
  }
  
  cerrarModal(): void {
    this.showModal = false;
    this.cursoToDelete = null;
  }

  trackById(index: number, curso: Curso): string {
    return curso.id;
  }

}


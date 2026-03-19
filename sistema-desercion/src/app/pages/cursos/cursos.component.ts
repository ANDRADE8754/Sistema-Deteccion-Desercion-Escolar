import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { Curso } from '../../models/curso.model';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cursos.component.html',
  styleUrl: './cursos.component.scss'
})
export class CursosComponent implements OnInit {

  cursos: Curso[] = [];
  mostrarFormulario: boolean = false;

  nuevoCurso = { nombre: '', descripcion: '' };

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

  guardarCurso(): void {
    if (!this.nuevoCurso.nombre.trim()) return;

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

  eliminarCurso(id: string, event: Event): void {
    event.stopPropagation();
    if(confirm('¿Estás seguro de eliminar este curso y a todos sus estudiantes?')) {
        this.storageService.deleteCurso(id);
        this.cargarCursos();
    }
  }

  trackById(index: number, curso: Curso): string {
    return curso.id;
  }

}

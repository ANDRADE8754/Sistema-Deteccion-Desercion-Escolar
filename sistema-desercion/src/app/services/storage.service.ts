import { Injectable } from '@angular/core';
import { Curso } from '../models/curso.model';
import { Estudiante, NivelRiesgo } from '../models/estudiante.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly cursosKey = 'sistema-desercion:cursos';
  private readonly estudiantesKey = 'sistema-desercion:estudiantes';

  getCursos(): Curso[] {
    const storage = this.getStorage();
    if (!storage) {
      return [];
    }

    const raw = storage.getItem(this.cursosKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(this.isCurso);
    } catch {
      return [];
    }
  }

  saveCurso(curso: Curso): void {
    const cursos = this.getCursos();
    cursos.push(curso);
    this.setCursos(cursos);
  }

  deleteCurso(id: string): void {
    const cursos = this.getCursos().filter((curso) => curso.id !== id);
    this.setCursos(cursos);
    this.deleteEstudiantesByCurso(id);
  }

  getEstudiantesByCurso(cursoId: string): Estudiante[] {
    return this.getEstudiantes().filter((estudiante) => estudiante.cursoId === cursoId);
  }

  saveEstudiante(estudiante: Estudiante): void {
    const estudiantes = this.getEstudiantes();
    estudiantes.push(estudiante);
    this.setEstudiantes(estudiantes);
  }

  updateEstudiante(estudianteActualizado: Estudiante): void {
    const estudiantes = this.getEstudiantes().map((estudiante) =>
      estudiante.id === estudianteActualizado.id ? estudianteActualizado : estudiante
    );

    this.setEstudiantes(estudiantes);
  }

  deleteEstudiante(id: string): void {
    const estudiantes = this.getEstudiantes().filter((estudiante) => estudiante.id !== id);
    this.setEstudiantes(estudiantes);
  }

  generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private setCursos(cursos: Curso[]): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(this.cursosKey, JSON.stringify(cursos));
  }

  private getEstudiantes(): Estudiante[] {
    const storage = this.getStorage();
    if (!storage) {
      return [];
    }

    const raw = storage.getItem(this.estudiantesKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(this.isEstudiante);
    } catch {
      return [];
    }
  }

  private setEstudiantes(estudiantes: Estudiante[]): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(this.estudiantesKey, JSON.stringify(estudiantes));
  }

  private deleteEstudiantesByCurso(cursoId: string): void {
    const estudiantes = this.getEstudiantes().filter((estudiante) => estudiante.cursoId !== cursoId);
    this.setEstudiantes(estudiantes);
  }

  private getStorage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }

  private isCurso = (value: unknown): value is Curso => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const curso = value as Partial<Curso>;

    return (
      typeof curso.id === 'string' &&
      typeof curso.nombre === 'string' &&
      typeof curso.descripcion === 'string' &&
      typeof curso.creadoEn === 'number'
    );
  };

  private isEstudiante = (value: unknown): value is Estudiante => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const estudiante = value as Partial<Estudiante>;

    return (
      typeof estudiante.id === 'string' &&
      typeof estudiante.cursoId === 'string' &&
      typeof estudiante.nombres === 'string' &&
      typeof estudiante.apellidos === 'string' &&
      typeof estudiante.creadoEn === 'number' &&
      typeof estudiante.vecesAusente === 'number' &&
      typeof estudiante.vecesSinTarea === 'number' &&
      typeof estudiante.vecesBajoRendimiento === 'number' &&
      this.isNivelRiesgo(estudiante.nivelRiesgo)
    );
  };

  private isNivelRiesgo(value: unknown): value is NivelRiesgo {
    return value === 'bajo' || value === 'medio' || value === 'alto';
  }
}
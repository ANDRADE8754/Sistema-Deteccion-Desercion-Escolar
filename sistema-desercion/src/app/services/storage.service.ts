import { Injectable } from '@angular/core';
import { Curso } from '../models/curso.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly cursosKey = 'sistema-desercion:cursos';

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
}
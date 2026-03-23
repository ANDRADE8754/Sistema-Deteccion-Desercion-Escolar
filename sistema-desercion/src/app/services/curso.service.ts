import { Injectable, inject } from '@angular/core';
import { SqliteService } from '../core/db/sqlite.service';
import { Curso } from '../core/models/curso.model';

@Injectable({ providedIn: 'root' })
export class CursoService {
  private sqlite = inject(SqliteService);

  async getAll(): Promise<Curso[]> {
    this.sqlite.checkConnection();
    const res = await this.sqlite.getDb().query('SELECT * FROM cursos');
    return res.values as Curso[] || [];
  }

  async getById(id: string): Promise<Curso | undefined> {
    this.sqlite.checkConnection();
    const res = await this.sqlite.getDb().query('SELECT * FROM cursos WHERE id = ?', [id]);
    return res.values && res.values.length > 0 ? (res.values[0] as Curso) : undefined;
  }

  async create(data: Omit<Curso, 'id' | 'creadoEn'>): Promise<Curso> {
    this.sqlite.checkConnection();
    const curso: Curso = {
      ...data,
      id: this.sqlite.generateId(),
      creadoEn: Date.now(),
    };
    
    // Convert undefined to null for sqlite
    const desc = curso.descripcion || null;

    await this.sqlite.getDb().run(
      'INSERT INTO cursos (id, nombre, escuela, anioLectivo, paralelo, descripcion, creadoEn) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [curso.id, curso.nombre, curso.escuela, curso.anioLectivo, curso.paralelo, desc, curso.creadoEn]
    );
    await this.sqlite.saveToStore();
    return curso;
  }

  async update(id: string, data: Partial<Omit<Curso, 'id' | 'creadoEn'>>): Promise<Curso> {
    this.sqlite.checkConnection();
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Curso ${id} no encontrado`);
    
    const updated: Curso = { ...existing, ...data };
    const desc = updated.descripcion || null;

    await this.sqlite.getDb().run(
      'UPDATE cursos SET nombre = ?, escuela = ?, anioLectivo = ?, paralelo = ?, descripcion = ? WHERE id = ?',
      [updated.nombre, updated.escuela, updated.anioLectivo, updated.paralelo, desc, id]
    );
    await this.sqlite.saveToStore();
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.sqlite.checkConnection();
    await this.sqlite.getDb().run('DELETE FROM cursos WHERE id = ?', [id]);
    await this.sqlite.saveToStore();
  }
}

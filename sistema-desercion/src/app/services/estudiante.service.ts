import { Injectable, inject } from '@angular/core';
import { SqliteService } from '../core/db/sqlite.service';
import { Estudiante } from '../core/models/estudiante.model';

@Injectable({ providedIn: 'root' })
export class EstudianteService {
  private sqlite = inject(SqliteService);

  async getByCurso(cursoId: string): Promise<Estudiante[]> {
    this.sqlite.checkConnection();
    const res = await this.sqlite.getDb().query('SELECT * FROM estudiantes WHERE cursoId = ?', [cursoId]);
    return res.values as Estudiante[] || [];
  }

  async getById(id: string): Promise<Estudiante | undefined> {
    this.sqlite.checkConnection();
    const res = await this.sqlite.getDb().query('SELECT * FROM estudiantes WHERE id = ?', [id]);
    return res.values && res.values.length > 0 ? (res.values[0] as Estudiante) : undefined;
  }

  async getAll(): Promise<Estudiante[]> {
    this.sqlite.checkConnection();
    const res = await this.sqlite.getDb().query('SELECT * FROM estudiantes');
    return res.values as Estudiante[] || [];
  }

  async create(data: Omit<Estudiante, 'id' | 'creadoEn'>): Promise<Estudiante> {
    this.sqlite.checkConnection();
    const estudiante: Estudiante = {
      ...data,
      id: this.sqlite.generateId(),
      creadoEn: Date.now(),
    };

    await this.sqlite.getDb().run(
      'INSERT INTO estudiantes (id, cursoId, nombres, apellidos, edad, genero, telefonoFamiliar, observaciones, creadoEn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        estudiante.id, estudiante.cursoId, estudiante.nombres, estudiante.apellidos, 
        estudiante.edad, estudiante.genero, estudiante.telefonoFamiliar || null, 
        estudiante.observaciones || null, estudiante.creadoEn
      ]
    );
    await this.sqlite.saveToStore();
    return estudiante;
  }

  async update(id: string, data: Partial<Omit<Estudiante, 'id' | 'creadoEn'>>): Promise<Estudiante> {
    this.sqlite.checkConnection();
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Estudiante ${id} no encontrado`);
    
    const updated: Estudiante = { ...existing, ...data };

    await this.sqlite.getDb().run(
      'UPDATE estudiantes SET nombres = ?, apellidos = ?, cursoId = ?, edad = ?, genero = ?, telefonoFamiliar = ?, observaciones = ? WHERE id = ?',
      [
        updated.nombres, updated.apellidos, updated.cursoId, updated.edad, 
        updated.genero, updated.telefonoFamiliar || null, updated.observaciones || null, id
      ]
    );
    await this.sqlite.saveToStore();
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.sqlite.checkConnection();
    await this.sqlite.getDb().run('DELETE FROM estudiantes WHERE id = ?', [id]);
    await this.sqlite.saveToStore();
  }

  async deleteByCurso(cursoId: string): Promise<void> {
    this.sqlite.checkConnection();
    // In SQLite with ON DELETE CASCADE, this might be redundant if the cursor is deleted.
    // However, invoking it directly is fine.
    await this.sqlite.getDb().run('DELETE FROM estudiantes WHERE cursoId = ?', [cursoId]);
    await this.sqlite.saveToStore();
  }

  getNombreCompleto(e: Estudiante): string {
    return `${e.nombres} ${e.apellidos}`;
  }
}

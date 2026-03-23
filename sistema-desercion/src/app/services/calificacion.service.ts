import { Injectable, inject } from '@angular/core';
import { SqliteService } from '../core/db/sqlite.service';
import { Actividad, Calificacion, ResumenCalificaciones } from '../core/models/actividad.model';

@Injectable({ providedIn: 'root' })
export class CalificacionService {
  private sqlite = inject(SqliteService);

  async getActividades(cursoId: string): Promise<Actividad[]> {
    this.sqlite.checkConnection();
    const res = await this.sqlite.getDb().query(
      'SELECT * FROM actividades WHERE cursoId = ? ORDER BY fecha ASC', 
      [cursoId]
    );
    return res.values as Actividad[] || [];
  }

  async getActividadById(id: string): Promise<Actividad | undefined> {
    this.sqlite.checkConnection();
    const res = await this.sqlite.getDb().query('SELECT * FROM actividades WHERE id = ?', [id]);
    return res.values && res.values.length > 0 ? (res.values[0] as Actividad) : undefined;
  }

  async createActividad(data: Omit<Actividad, 'id'>): Promise<Actividad> {
    this.sqlite.checkConnection();
    const actividad: Actividad = { ...data, id: this.sqlite.generateId() };
    await this.sqlite.getDb().run(
      'INSERT INTO actividades (id, cursoId, nombre, fecha, tipo, ponderacion, notaMaxima) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [actividad.id, actividad.cursoId, actividad.nombre, actividad.fecha, actividad.tipo, actividad.ponderacion, actividad.notaMaxima]
    );
    await this.sqlite.saveToStore();
    return actividad;
  }

  async updateActividad(id: string, data: Partial<Omit<Actividad, 'id'>>): Promise<Actividad> {
    this.sqlite.checkConnection();
    const existing = await this.getActividadById(id);
    if (!existing) throw new Error(`Actividad ${id} no encontrada`);
    
    const updated: Actividad = { ...existing, ...data };
    await this.sqlite.getDb().run(
      'UPDATE actividades SET nombre = ?, fecha = ?, tipo = ?, ponderacion = ?, notaMaxima = ? WHERE id = ?',
      [updated.nombre, updated.fecha, updated.tipo, updated.ponderacion, updated.notaMaxima, id]
    );
    await this.sqlite.saveToStore();
    return updated;
  }

  async deleteActividad(id: string): Promise<void> {
    this.sqlite.checkConnection();
    // ON DELETE CASCADE will handle calificaciones deletion implicitly!
    await this.sqlite.getDb().run('DELETE FROM actividades WHERE id = ?', [id]);
    await this.sqlite.saveToStore();
  }

  async getCalificacionesPorActividad(actividadId: string): Promise<Calificacion[]> {
    this.sqlite.checkConnection();
    const res = await this.sqlite.getDb().query('SELECT * FROM calificaciones WHERE actividadId = ?', [actividadId]);
    return res.values as Calificacion[] || [];
  }

  async getCalificacionesPorEstudiante(estudianteId: string, cursoId: string): Promise<Calificacion[]> {
    this.sqlite.checkConnection();
    const res = await this.sqlite.getDb().query(
      'SELECT * FROM calificaciones WHERE estudianteId = ? AND cursoId = ?', 
      [estudianteId, cursoId]
    );
    return res.values as Calificacion[] || [];
  }

  async setCalificacion(
    actividadId: string,
    estudianteId: string,
    cursoId: string,
    nota: number | null,
  ): Promise<Calificacion> {
    this.sqlite.checkConnection();
    const res = await this.sqlite.getDb().query(
      'SELECT * FROM calificaciones WHERE actividadId = ? AND estudianteId = ?',
      [actividadId, estudianteId]
    );

    const existente = res.values && res.values.length > 0 ? (res.values[0] as Calificacion) : undefined;
    const today = new Date().toISOString().slice(0, 10);
    
    let calificacion: Calificacion;

    if (existente) {
      await this.sqlite.getDb().run(
        'UPDATE calificaciones SET nota = ?, fechaRegistro = ? WHERE id = ?',
        [nota, today, existente.id]
      );
      calificacion = { ...existente, nota, fechaRegistro: today };
    } else {
      calificacion = {
        id: this.sqlite.generateId(),
        actividadId,
        estudianteId,
        cursoId,
        nota,
        fechaRegistro: today,
      };
      await this.sqlite.getDb().run(
        'INSERT INTO calificaciones (id, actividadId, estudianteId, cursoId, nota, observaciones, fechaRegistro) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [calificacion.id, calificacion.actividadId, calificacion.estudianteId, calificacion.cursoId, calificacion.nota, null, calificacion.fechaRegistro]
      );
    }
    await this.sqlite.saveToStore();
    return calificacion;
  }

  async getResumen(estudianteId: string, cursoId: string): Promise<ResumenCalificaciones> {
    const actividades = await this.getActividades(cursoId);
    const calificaciones = await this.getCalificacionesPorEstudiante(estudianteId, cursoId);
    
    const tareas = actividades.filter(a => a.tipo === 'tarea');
    const tareasNoEntregadas = tareas.filter(t => {
      const calif = calificaciones.find(c => c.actividadId === t.id);
      return !calif || calif.nota === null;
    }).length;
    
    const entregadas = calificaciones.filter(c => c.nota !== null);
    const promedio = entregadas.length > 0
      ? Math.round((entregadas.reduce((sum, c) => sum + (c.nota ?? 0), 0) / entregadas.length) * 10) / 10
      : 0;
      
    return {
      estudianteId,
      cursoId,
      promedio,
      totalActividades: actividades.length,
      actividadesEntregadas: entregadas.length,
      tareasNoEntregadas,
    };
  }

  async deletePorCurso(cursoId: string): Promise<void> {
    this.sqlite.checkConnection();
    // Again, deleting actividades automatically deletes calificaciones via CASCADE
    await this.sqlite.getDb().run('DELETE FROM actividades WHERE cursoId = ?', [cursoId]);
    await this.sqlite.saveToStore();
  }
}

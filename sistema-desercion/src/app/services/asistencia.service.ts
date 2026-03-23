import { Injectable, inject } from '@angular/core';
import { SqliteService } from '../core/db/sqlite.service';
import { RegistroAsistencia, EstadoAsistencia, ResumenAsistencia } from '../core/models/asistencia.model';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private sqlite = inject(SqliteService);

  async getPorFecha(cursoId: string, fecha: string): Promise<RegistroAsistencia[]> {
    this.sqlite.checkConnection();
    const res = await this.sqlite.getDb().query(
      'SELECT * FROM asistencias WHERE cursoId = ? AND fecha = ?', 
      [cursoId, fecha]
    );
    return res.values as RegistroAsistencia[] || [];
  }

  async getPorEstudiante(estudianteId: string): Promise<RegistroAsistencia[]> {
    this.sqlite.checkConnection();
    const res = await this.sqlite.getDb().query(
      'SELECT * FROM asistencias WHERE estudianteId = ?', 
      [estudianteId]
    );
    return res.values as RegistroAsistencia[] || [];
  }

  async getFechasDeCurso(cursoId: string): Promise<string[]> {
    this.sqlite.checkConnection();
    const res = await this.sqlite.getDb().query(
      'SELECT DISTINCT fecha FROM asistencias WHERE cursoId = ? ORDER BY fecha ASC',
      [cursoId]
    );
    const valores = res.values || [];
    return valores.map(row => row.fecha) as string[];
  }

  async setEstado(
    cursoId: string,
    estudianteId: string,
    fecha: string,
    estado: EstadoAsistencia,
  ): Promise<RegistroAsistencia> {
    this.sqlite.checkConnection();
    const todos = await this.getPorFecha(cursoId, fecha);
    const existente = todos.find(r => r.estudianteId === estudianteId);

    let registro: RegistroAsistencia;

    if (existente) {
      await this.sqlite.getDb().run(
        'UPDATE asistencias SET estado = ? WHERE id = ?',
        [estado, existente.id]
      );
      registro = { ...existente, estado };
    } else {
      registro = {
        id: this.sqlite.generateId(),
        cursoId,
        estudianteId,
        fecha,
        estado,
      };
      await this.sqlite.getDb().run(
        'INSERT INTO asistencias (id, cursoId, estudianteId, fecha, estado, justificacion) VALUES (?, ?, ?, ?, ?, ?)',
        [registro.id, registro.cursoId, registro.estudianteId, registro.fecha, registro.estado, null]
      );
    }
    await this.sqlite.saveToStore();
    return registro;
  }

  async marcarTodosPresentes(cursoId: string, estudianteIds: string[], fecha: string): Promise<void> {
    // Process sequentially or use a transaction
    for (const id of estudianteIds) {
      await this.setEstado(cursoId, id, fecha, 'presente');
    }
  }

  async getResumen(estudianteId: string, cursoId: string): Promise<ResumenAsistencia> {
    const registros = (await this.getPorEstudiante(estudianteId))
      .filter(r => r.cursoId === cursoId);

    const resumen: ResumenAsistencia = {
      estudianteId,
      totalClases: registros.length,
      presentes: registros.filter(r => r.estado === 'presente').length,
      ausentes: registros.filter(r => r.estado === 'ausente').length,
      justificados: registros.filter(r => r.estado === 'justificado').length,
      tardanzas: registros.filter(r => r.estado === 'tardanza').length,
      faltasEfectivas: registros.filter(r => r.estado === 'ausente').length,
    };
    return resumen;
  }

  async deletePorCurso(cursoId: string): Promise<void> {
    this.sqlite.checkConnection();
    await this.sqlite.getDb().run('DELETE FROM asistencias WHERE cursoId = ?', [cursoId]);
    await this.sqlite.saveToStore();
  }

  async deletePorEstudiante(estudianteId: string): Promise<void> {
    this.sqlite.checkConnection();
    await this.sqlite.getDb().run('DELETE FROM asistencias WHERE estudianteId = ?', [estudianteId]);
    await this.sqlite.saveToStore();
  }
}

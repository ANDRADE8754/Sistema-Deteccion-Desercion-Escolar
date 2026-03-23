import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'sistema_desercion_db';

@Injectable({ providedIn: 'root' })
export class SqliteService {
  private sqliteConnection: SQLiteConnection;
  private isMounted = false;
  private db!: SQLiteDBConnection;

  constructor() {
    this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
  }

  async initDB(): Promise<void> {
    if (this.isMounted) return;

    try {
      if (Capacitor.getPlatform() === 'web') {
        const jeepSqliteEl = document.createElement('jeep-sqlite');
        document.body.appendChild(jeepSqliteEl);
        await customElements.whenDefined('jeep-sqlite');
        await this.sqliteConnection.initWebStore();
      }

      const ret = await this.sqliteConnection.checkConnectionsConsistency();
      const isConn = (await this.sqliteConnection.isConnection(DB_NAME, false)).result;

      if (ret.result && isConn) {
        this.db = await this.sqliteConnection.retrieveConnection(DB_NAME, false);
      } else {
        this.db = await this.sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', 1, false);
      }

      await this.db.open();
      await this.crearTablas();

      this.isMounted = true;
    } catch (error) {
      console.error('Error inicializando SQLite', error);
      throw error;
    }
  }

  getDb(): SQLiteDBConnection {
    return this.db;
  }

  checkConnection(): void {
    if (!this.isMounted || !this.db) {
      throw new Error('La base de datos SQLite no ha sido inicializada.');
    }
  }

  private async crearTablas(): Promise<void> {
    const tableCursos = `
      CREATE TABLE IF NOT EXISTS cursos (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        escuela TEXT NOT NULL,
        anioLectivo TEXT NOT NULL,
        paralelo TEXT NOT NULL,
        descripcion TEXT,
        creadoEn INTEGER NOT NULL
      );
    `;
    const tableEstudiantes = `
      CREATE TABLE IF NOT EXISTS estudiantes (
        id TEXT PRIMARY KEY NOT NULL,
        cursoId TEXT NOT NULL,
        nombres TEXT NOT NULL,
        apellidos TEXT NOT NULL,
        edad INTEGER NOT NULL,
        genero TEXT NOT NULL,
        telefonoFamiliar TEXT,
        observaciones TEXT,
        creadoEn INTEGER NOT NULL,
        FOREIGN KEY (cursoId) REFERENCES cursos(id) ON DELETE CASCADE
      );
    `;
    const tableAsistencias = `
      CREATE TABLE IF NOT EXISTS asistencias (
        id TEXT PRIMARY KEY NOT NULL,
        cursoId TEXT NOT NULL,
        estudianteId TEXT NOT NULL,
        fecha TEXT NOT NULL,
        estado TEXT NOT NULL,
        justificacion TEXT,
        FOREIGN KEY (cursoId) REFERENCES cursos(id) ON DELETE CASCADE,
        FOREIGN KEY (estudianteId) REFERENCES estudiantes(id) ON DELETE CASCADE
      );
    `;
    const tableActividades = `
      CREATE TABLE IF NOT EXISTS actividades (
        id TEXT PRIMARY KEY NOT NULL,
        cursoId TEXT NOT NULL,
        nombre TEXT NOT NULL,
        fecha TEXT NOT NULL,
        tipo TEXT NOT NULL,
        ponderacion INTEGER NOT NULL,
        notaMaxima INTEGER NOT NULL,
        FOREIGN KEY (cursoId) REFERENCES cursos(id) ON DELETE CASCADE
      );
    `;
    const tableCalificaciones = `
      CREATE TABLE IF NOT EXISTS calificaciones (
        id TEXT PRIMARY KEY NOT NULL,
        actividadId TEXT NOT NULL,
        estudianteId TEXT NOT NULL,
        cursoId TEXT NOT NULL,
        nota REAL,
        observaciones TEXT,
        FOREIGN KEY (actividadId) REFERENCES actividades(id) ON DELETE CASCADE,
        FOREIGN KEY (estudianteId) REFERENCES estudiantes(id) ON DELETE CASCADE,
        FOREIGN KEY (cursoId) REFERENCES cursos(id) ON DELETE CASCADE
      );
    `;

    await this.db.execute(tableCursos);
    await this.db.execute(tableEstudiantes);
    await this.db.execute(tableAsistencias);
    await this.db.execute(tableActividades);
    await this.db.execute(tableCalificaciones);
  }

  async saveToStore(): Promise<void> {
    if (Capacitor.getPlatform() === 'web' && this.sqliteConnection) {
      this.sqliteConnection.saveToStore(DB_NAME);
    }
  }

  generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

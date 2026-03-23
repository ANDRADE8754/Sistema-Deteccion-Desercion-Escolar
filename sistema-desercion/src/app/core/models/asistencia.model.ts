export type EstadoAsistencia = 'presente' | 'ausente' | 'justificado' | 'tardanza';
export interface RegistroAsistencia {
  id: string;
  cursoId: string;
  estudianteId: string;
  fecha: string;          
  estado: EstadoAsistencia;
}
/** Datos de un día completo de asistencia para un curso */
export interface SesionAsistencia {
  cursoId: string;
  fecha: string;
  registros: RegistroAsistencia[];
}
/** Resumen de asistencia calculado para un estudiante */
export interface ResumenAsistencia {
  estudianteId: string;
  totalClases: number;
  presentes: number;
  ausentes: number;
  justificados: number;
  tardanzas: number;
  /** Faltas que cuentan para riesgo = ausentes (sin justificar) */
  faltasEfectivas: number;
}

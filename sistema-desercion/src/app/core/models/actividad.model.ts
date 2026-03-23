export type TipoActividad = 'tarea' | 'examen' | 'participacion' | 'proyecto';
export interface Actividad {
  id: string;
  cursoId: string;
  nombre: string;
  tipo: TipoActividad;
  fecha: string;          
  ponderacion: number;    
  notaMaxima: number;     
}
export interface Calificacion {
  id: string;
  actividadId: string;
  estudianteId: string;
  cursoId: string;
  /** null indica que el estudiante NO entregó / no se presentó */
  nota: number | null;
  fechaRegistro: string;  
}
/** Resumen de calificaciones calculado para un estudiante en un curso */
export interface ResumenCalificaciones {
  estudianteId: string;
  cursoId: string;
  promedio: number;
  totalActividades: number;
  actividadesEntregadas: number;
  /** Actividades de tipo "tarea" no entregadas */
  tareasNoEntregadas: number;
}

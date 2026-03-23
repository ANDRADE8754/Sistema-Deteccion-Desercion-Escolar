export type NivelRiesgo = 'bajo' | 'medio' | 'alto';

export interface Estudiante {
  id: string;
  cursoId: string;
  nombres: string;
  apellidos: string;
  creadoEn: number;
  vecesAusente: number;
  vecesSinTarea: number;
  vecesBajoRendimiento: number;
  nivelRiesgo: NivelRiesgo;
}
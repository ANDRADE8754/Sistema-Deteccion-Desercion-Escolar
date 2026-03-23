export type Genero = 'M' | 'F' | 'otro';
export interface Estudiante {
  id: string;
  cursoId: string;
  nombres: string;
  apellidos: string;
  edad: number;
  genero: Genero;
  telefonoFamiliar?: string;
  observaciones?: string;
  creadoEn: number;      
}

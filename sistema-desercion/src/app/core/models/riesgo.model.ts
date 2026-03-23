export type NivelRiesgo = 'bajo' | 'medio' | 'alto';
/** Detalle de los factores que generan el nivel de riesgo */
export interface DetalleRiesgo {
  totalFaltas: number;
  promedio: number;
  tareasNoEntregadas: number;
}
/** Resultado completo del cálculo de riesgo de un estudiante */
export interface ResultadoRiesgo {
  estudianteId: string;
  nivel: NivelRiesgo;
  mensaje: string;
  recomendacion: string;
  detalles: DetalleRiesgo;
}
/**
 * Configuración de reglas de riesgo (parametrizable para el futuro).
 * Reglas actuales:
 *   BAJO  → faltas ≤ 1 AND promedio ≥ 8.0 AND tareasNoEntregadas = 0
 *   MEDIO → faltas 2-3  OR promedio 7.0–7.9 OR tareasNoEntregadas = 1
 *   ALTO  → faltas ≥ 4  OR promedio < 7.0  OR tareasNoEntregadas ≥ 2
 *
 * Prioridad: ALTO > MEDIO > BAJO
 */
export const REGLAS_RIESGO = {
  alto: {
    faltasMinimas: 4,
    promedioMaximo: 7.0,
    tareasMinimas: 2,
  },
  medio: {
    faltasMinimas: 2,
    faltasMaximas: 3,
    promedioMinimo: 7.0,
    promedioMaximo: 8.0,
    tareasMinimas: 1,
    tareasMaximas: 1,
  },
  bajo: {
    faltasMaximas: 1,
    promedioMinimo: 8.0,
    tareasMaximas: 0,
  },
} as const;

import { Injectable, inject } from '@angular/core';
import { AsistenciaService } from './asistencia.service';
import { CalificacionService } from './calificacion.service';
import {
  NivelRiesgo,
  ResultadoRiesgo,
  REGLAS_RIESGO,
} from '../core/models/riesgo.model';
@Injectable({ providedIn: 'root' })
export class RiesgoService {
  private asistencia = inject(AsistenciaService);
  private calificaciones = inject(CalificacionService);
  /**
   * Calcula el nivel de riesgo de deserción de un estudiante en un curso.
   *
   * Reglas (prioridad ALTO > MEDIO > BAJO):
   *   ALTO  → faltas ≥ 4  OR  promedio < 7.0  OR  tareasNoEntregadas ≥ 2
   *   MEDIO → faltas 2-3  OR  promedio 7.0-7.9 OR  tareasNoEntregadas = 1
   *   BAJO  → faltas ≤ 1  AND promedio ≥ 8.0   AND tareasNoEntregadas = 0
   */
  async calcular(estudianteId: string, cursoId: string): Promise<ResultadoRiesgo> {
    const [resumenAsistencia, resumenCalif] = await Promise.all([
      this.asistencia.getResumen(estudianteId, cursoId),
      this.calificaciones.getResumen(estudianteId, cursoId),
    ]);
    const faltas = resumenAsistencia.faltasEfectivas;
    const promedio = resumenCalif.promedio;
    const tareasNoEntregadas = resumenCalif.tareasNoEntregadas;
    const nivel = this.determinarNivel(faltas, promedio, tareasNoEntregadas);
    return {
      estudianteId,
      nivel,
      mensaje: this.getMensaje(nivel),
      recomendacion: this.getRecomendacion(nivel),
      detalles: { totalFaltas: faltas, promedio, tareasNoEntregadas },
    };
  }
  private determinarNivel(
    faltas: number,
    promedio: number,
    tareasNoEntregadas: number,
  ): NivelRiesgo {
    const alto = REGLAS_RIESGO.alto;
    if (
      faltas >= alto.faltasMinimas ||
      (promedio < alto.promedioMaximo && promedio > 0) ||
      tareasNoEntregadas >= alto.tareasMinimas
    ) {
      return 'alto';
    }
    const medio = REGLAS_RIESGO.medio;
    if (
      (faltas >= medio.faltasMinimas && faltas <= medio.faltasMaximas) ||
      (promedio >= medio.promedioMinimo && promedio < medio.promedioMaximo && promedio > 0) ||
      tareasNoEntregadas === medio.tareasMinimas
    ) {
      return 'medio';
    }
    return 'bajo';
  }
  private getMensaje(nivel: NivelRiesgo): string {
    const mensajes: Record<NivelRiesgo, string> = {
      bajo: 'El estudiante tiene un rendimiento estable. Sin señales de alerta relevantes.',
      medio: 'Riesgo moderado detectado. Se recomienda seguimiento académico cercano.',
      alto: 'Riesgo alto de deserción. Se requiere intervención inmediata.',
    };
    return mensajes[nivel];
  }
  private getRecomendacion(nivel: NivelRiesgo): string {
    const recomendaciones: Record<NivelRiesgo, string> = {
      bajo: 'Continuar motivando al estudiante y mantener el seguimiento regular.',
      medio:
        'Contactar a la familia para informar sobre la situación. Ofrecer tutorías de apoyo.',
      alto:
        'Visita domiciliaria urgente. Coordinar con directivos para intervención inmediata. Evaluar factores externos (trabajo, transporte, situación familiar).',
    };
    return recomendaciones[nivel];
  }
  /** Descripción corta del nivel para mostrar en badges */
  getLabelNivel(nivel: NivelRiesgo): string {
    const labels: Record<NivelRiesgo, string> = {
      bajo: 'Riesgo Bajo',
      medio: 'Riesgo Medio',
      alto: 'Riesgo Alto',
    };
    return labels[nivel];
  }
}
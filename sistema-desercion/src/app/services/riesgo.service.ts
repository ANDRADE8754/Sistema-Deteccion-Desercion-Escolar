import { Injectable } from '@angular/core';
import { Estudiante, NivelRiesgo } from '../models/estudiante.model';

@Injectable({
  providedIn: 'root'
})
export class RiesgoService {
  calcularNivel(estudiante: Estudiante): NivelRiesgo {
    const puntaje =
      estudiante.vecesAusente +
      estudiante.vecesSinTarea +
      (estudiante.vecesBajoRendimiento * 2);

    if (puntaje >= 6) {
      return 'alto';
    }

    if (puntaje >= 3) {
      return 'medio';
    }

    return 'bajo';
  }

  getDescripcion(nivel: NivelRiesgo): string {
    const descripciones: Record<NivelRiesgo, string> = {
      bajo: 'Sin senales de alerta relevantes por el momento.',
      medio: 'Riesgo moderado. Conviene seguimiento academico cercano.',
      alto: 'Riesgo alto. Se recomienda intervencion inmediata.'
    };

    return descripciones[nivel];
  }
}
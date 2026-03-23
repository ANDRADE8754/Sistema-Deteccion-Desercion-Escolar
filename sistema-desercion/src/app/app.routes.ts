import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard-general/dashboard-general.component').then(
        m => m.DashboardGeneralComponent,
      ),
  },
  {
    path: 'cursos',
    loadComponent: () =>
      import('./features/cursos/cursos.component').then(m => m.CursosComponent),
  },
  {
    path: 'cursos/:cursoId',
    loadComponent: () =>
      import('./features/cursos/curso-detalle/curso-detalle.component').then(
        m => m.CursoDetalleComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'estudiantes',
        pathMatch: 'full',
      },
      {
        path: 'estudiantes',
        loadComponent: () =>
          import('./features/estudiantes/estudiantes.component').then(
            m => m.EstudiantesComponent,
          ),
      },
      {
        path: 'asistencia',
        loadComponent: () =>
          import('./features/asistencia/asistencia.component').then(
            m => m.AsistenciaComponent,
          ),
      },
      {
        path: 'calificaciones',
        loadComponent: () =>
          import('./features/calificaciones/calificaciones.component').then(
            m => m.CalificacionesComponent,
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-curso/dashboard-curso.component').then(
            m => m.DashboardCursoComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

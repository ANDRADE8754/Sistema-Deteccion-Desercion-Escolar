import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'cursos',
        pathMatch: 'full'
    },
    {
        path: 'cursos',
        loadComponent:() =>
            import('./pages/cursos/cursos.component').then(m => m.CursosComponent)
    },
    {
        path: 'cursos/:cursoId/estudiantes',
        loadComponent:() =>
            import('./pages/estudiantes/estudiantes.component').then(m => m.EstudiantesComponent)
    }
];

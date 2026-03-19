import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent
  ],
  template: `
    <app-navbar></app-navbar>
    <main class="contenedor">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .contenedor {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px 16px;
    }
  `]
})
export class AppComponent {
  title = 'sistema-desercion';
}

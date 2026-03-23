import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <div class="app-shell">
      <app-navbar />
      <main class="page-content">
        <router-outlet />
      </main>
      <app-toast />
    </div>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {}

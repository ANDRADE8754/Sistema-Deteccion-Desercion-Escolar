import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar__brand">
        <span class="navbar__logo"><span class="material-symbols-rounded" style="font-size: inherit;">spa</span></span>
        <div>
          <span class="navbar__title">Sistema Yura</span>
          <span class="navbar__subtitle">Detección de Deserción</span>
        </div>
      </div>
      <div class="navbar__links">
        <a routerLink="/dashboard"
           routerLinkActive="active"
           class="nav-link">
          <span class="material-symbols-rounded">insights</span> <span class="nav-text">Dashboard</span>
        </a>
        <a routerLink="/cursos"
           routerLinkActive="active"
           class="nav-link">
          <span class="material-symbols-rounded">library_books</span> <span class="nav-text">Cursos</span>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: linear-gradient(135deg, #052e16, #064e3b);
      color: white;
      padding: 0 1.5rem;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 12px rgba(0,0,0,0.2);
      position: sticky;
      top: 0;
      z-index: 100;
      &__brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
        color: inherit;
      }
      &__logo { font-size: 1.75rem; }
      &__title {
        display: block;
        font-size: 1rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1.2;
      }
      &__subtitle {
        display: block;
        font-size: 0.7rem;
        opacity: 0.65;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      &__links {
        display: flex;
        gap: 0.25rem;
      }
    }
    .nav-link {
      padding: 0.5rem 0.9rem;
      border-radius: 9px;
      color: rgba(255,255,255,0.75);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      &:hover { background: rgba(255,255,255,0.12); color: white; }
      &.active { background: rgba(255,255,255,0.18); color: white; }
    }
    .nav-text { display: inline; }
    @media (max-width: 640px) {
      .navbar { padding: 0 1rem; }
      .navbar__title { font-size: 0.9rem; }
      .navbar__subtitle { font-size: 0.65rem; }
      .nav-link { padding: 0.5rem; }
      .nav-text { display: none; } /* Hide text on small screens, show only icons */
    }
  `],
})
export class NavbarComponent {}

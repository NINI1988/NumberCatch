import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<section class="auth-page">
    <div class="hero-mark">№</div>
    <h1>NumberCatch</h1>
    <p class="muted">Finde die nächste Zahl. Gemeinsam.</p>
    <form (ngSubmit)="submit()">
      <label
        >E-Mail<input
          type="email"
          name="email"
          [(ngModel)]="email"
          required
          autocomplete="email" /></label
      ><label
        >Passwort<input
          type="password"
          name="password"
          [(ngModel)]="password"
          required
          autocomplete="current-password" /></label
      ><button class="primary full" type="submit">Einloggen</button>
      <p class="error" *ngIf="error()">{{ error() }}</p>
    </form>
    <a routerLink="/numbers" class="text-link">Demo ohne Login öffnen</a>
  </section>`,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly error = signal('');
  email = '';
  password = '';
  async submit(): Promise<void> {
    const error = await this.auth.signIn(this.email, this.password);
    if (error) this.error.set(error);
    else void this.router.navigateByUrl('/numbers');
  }
}

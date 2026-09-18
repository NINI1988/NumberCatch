import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `<section class="auth-page">
    <div class="hero-mark">№</div>
    <h1>NumberCatch</h1>
    <p class="muted">Finde die nächste Zahl. Gemeinsam.</p>
    <form (ngSubmit)="submit()">
      <label *ngIf="registerMode"
        >Anzeigename<input
          type="text"
          name="name"
          [(ngModel)]="name"
          required
          maxlength="80"
          autocomplete="name"
      /></label>
      <label
        >E-Mail<input type="email" name="email" [(ngModel)]="email" required autocomplete="email"
      /></label>
      <label
        >Passwort<input
          type="password"
          name="password"
          [(ngModel)]="password"
          required
          minlength="8"
          autocomplete="new-password"
      /></label>
      <button class="primary full" type="submit">
        {{ registerMode ? 'Konto erstellen' : 'Einloggen' }}
      </button>
      <p class="success" *ngIf="message()">{{ message() }}</p>
      <p class="error" *ngIf="error()">{{ error() }}</p>
    </form>
    <button class="text-button" type="button" (click)="toggleMode()">
      {{ registerMode ? 'Schon registriert? Einloggen' : 'Noch kein Konto? Registrieren' }}
    </button>
  </section>`,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly error = signal('');
  readonly message = signal('');
  registerMode = false;
  name = '';
  email = '';
  password = '';
  toggleMode(): void {
    this.registerMode = !this.registerMode;
    this.error.set('');
    this.message.set('');
  }
  async submit(): Promise<void> {
    this.error.set('');
    this.message.set('');
    const error = this.registerMode
      ? await this.auth.signUp(this.email, this.password, this.name)
      : await this.auth.signIn(this.email, this.password);
    if (error) {
      this.error.set(error);
      return;
    }
    if (this.registerMode && !this.auth.authenticated()) {
      this.message.set('Bitte bestätige zuerst deine E-Mail-Adresse.');
      return;
    }
    await this.router.navigateByUrl(
      this.route.snapshot.queryParamMap.get('returnUrl') ?? '/numbers',
    );
  }
}

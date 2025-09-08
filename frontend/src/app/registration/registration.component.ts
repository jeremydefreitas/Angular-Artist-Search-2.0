import { CommonModule } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
} from '@angular/router';
import { RegistrationService } from './registration.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css',
})
export class RegistrationComponent {
  private dataService = inject(RegistrationService);
  data: any;
  fullname: string = '';
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.isLoggedIn$.subscribe((status) => {
      if (status) {
        this.router.navigate(['/search']);
      }
    });
  }

  async onSubmit(): Promise<void> {
    const response = await fetch(
      `${environment.API_BASE_URL}/api/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullname: this.fullname,
          email: this.email,
          password: this.password,
        }),
      }
    );

    this.data = await response.json();
    if (response.ok) {
      this.errorMessage = '';
      await fetch(
        `${environment.API_BASE_URL}/api/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: this.email, password: this.password }),
        }
      );
      this.auth.login();
      this.router.navigate(['/search']);
    } else {
      this.errorMessage = this.data.message;
    }
  }

  clearError(): void {
    this.errorMessage = '';
  }
}

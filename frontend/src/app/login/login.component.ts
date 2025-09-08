import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { LoginService } from './login.service';
import { AuthService } from '../auth/auth.service';
import { FavoritesService } from '../favorites/favorites.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private dataService = inject(LoginService);
  data: any;
  email: string = '';
  password: string = '';
  errorMessage: string | null = null;
  isAuthenticated = false;
  constructor(
    private auth: AuthService,
    private router: Router,
    private favouriteService: FavoritesService
  ) {}

  ngOnInit(): void {
    this.auth.isLoggedIn$.subscribe((status) => {
      this.isAuthenticated = status;
      if (status) {
        this.router.navigate(['/search']);
      }
    });
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = null;
    const response = await fetch(
      `${environment.API_BASE_URL}/api/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: this.email, password: this.password }),
      }
    );
    const data = await response.json();

    if (response.ok) {
      this.auth.login();
      this.router.navigate(['/search']);
      this.favouriteService.resetCache();
    } else {
      this.errorMessage = data.message;
    }
  }

  clearError() {
    this.errorMessage = '';
  }
}

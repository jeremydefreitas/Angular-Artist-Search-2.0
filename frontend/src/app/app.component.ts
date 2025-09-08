import { Component, OnInit } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';
import { NotificationsComponent } from './notifications/notifications.component';
import { FavoritesService } from './favorites/favorites.service';
import { NotificationsService } from './notifications/notifications.service';
import { environment } from '../environments/environment';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    NotificationsComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = '571HW3';
  isLoggedIn = false;
  email = '';
  name = '';
  profileImageUrl = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private favoriteService: FavoritesService,
    private notificationService: NotificationsService
  ) {}

  async ngOnInit() {
    await this.auth.refreshLoginState();
    this.auth.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;

      if (status) {
        this.auth.getUserInfo().subscribe((res) => {
          this.email = res.email;
          this.name = res.name;
          this.profileImageUrl = res.profileImageUrl;
        });
      } else {
        this.email = '';
        this.name = '';
        this.profileImageUrl = '';
      }
    });
  }

  async logout(): Promise<void> {
    try {
      await fetch(
        `${environment.API_BASE_URL}/api/logout`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      this.favoriteService.resetCache();
      this.auth.logout();
      await this.auth.refreshLoginState();
      this.router.navigate(['/search']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  isActive(route: string): boolean {
    return this.router.isActive(route, true);
  }

  async deleteAccount() {
    const email = await this.auth.getEmail();
    const response = await fetch(
      `${environment.API_BASE_URL}/api/delete-account`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }
    );

    if (response.status === 200) {
      this.favoriteService.resetCache();
      await this.logout();
      this.notificationService.show('Account deleted', 'danger');
    }
  }
}

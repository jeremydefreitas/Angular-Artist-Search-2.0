import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FavoritesService } from './favorites.service';
import { Observable } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css',
})
export class FavoritesComponent implements OnInit {
  favorites$!: Observable<any[]>;
  isEmpty = false;
  isAuthenticated = false;

  constructor(
    private favoritesService: FavoritesService,
    private router: Router,
    private auth: AuthService
  ) {}

  async ngOnInit() {
    this.auth.isLoggedIn$.subscribe((status) => {
      this.isAuthenticated = status;
      if (status) {
        this.router.navigate(['/favorites']);
      }
    });
    await this.favoritesService.loadFavoritesIfNeeded();
    this.favorites$ = this.favoritesService.getFavoritesObservable();
  }

  async removeFavorite(id: any) {
    const success = await this.favoritesService.removeFavorite(id);
  }

  onCardClick(id: any) {
    this.router.navigate([`/search/artist/${id}`]);
  }
}

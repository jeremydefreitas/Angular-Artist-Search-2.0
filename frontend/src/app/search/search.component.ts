import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { FavoritesService } from '../favorites/favorites.service';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'search',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterOutlet],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent {
  searchQuery: string = '';
  searchResults: any[] = []; // Store the results from the API
  isAuthenticated: boolean = false;
  isLoading = false;
  favoriteIds = new Set<string>();
  selectedCardId = '';
  hoveredCardId = '';
  isEmpty = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private favoritesService: FavoritesService
  ) {
    this.auth.isLoggedIn$.subscribe((status) => {
      this.isAuthenticated = status;
    });
  }

  ngOnInit(): void {
    this.favoritesService.getFavoritesObservable().subscribe((favorites) => {
      this.favoriteIds = new Set(favorites.map((f) => f.id));
    });
  }

  async onSubmit(): Promise<void> {
    this.selectedCardId = '';
    this.isLoading = true;
    this.isEmpty = false;
    this.router.navigate([`/search`]);
    try {
      const response = await fetch(
        `${environment.API_BASE_URL}/api/artist-search/${this.searchQuery}`
      );
      const data = await response.json();

      this.searchResults = data || [];
      if (this.searchResults.length === 0) {
        this.isEmpty = true;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  onClear(): void {
    this.router.navigate([`/`]);
    this.searchResults = [];
  }

  onCardClick(result: any): void {
    const id = result._links?.self?.href?.split('/')[5] ?? '';
    this.router.navigate([`/search/artist/${id}`]);
    this.selectedCardId = id;
  }

  addToFavorites(result: any): void {
    const id = result._links?.self?.href?.split('/')[5] ?? ''; // Extract the ID from the href
    console.log('🚀 ~ SearchComponent ~ addToFavorites ~ id:', id);
    result.isFavorite = true;
    this.favoritesService.addFavorite(id);
  }

  removeFromFavorites(result: any): void {
    const id = result._links?.self?.href?.split('/')[5] ?? '';

    result.isFavorite = false;
    this.favoritesService.removeFavorite(id);
  }

  isFavorite(result: any): boolean {
    const id = result._links?.self?.href?.split('/')[5] ?? '';
    return this.favoriteIds.has(id);
  }

  isActiveCard(result: any): boolean {
    const id = result._links?.self?.href?.split('/')[5] ?? '';
    return id === this.selectedCardId;
  }

  isHovered(result: any): boolean {
    const id = result._links?.self?.href?.split('/')[5] ?? '';
    return id === this.hoveredCardId;
  }

  onHover(isHovered: boolean, result: any): void {
    const id = result._links?.self?.href?.split('/')[5] ?? '';
    this.hoveredCardId = isHovered ? id : null;
  }
}

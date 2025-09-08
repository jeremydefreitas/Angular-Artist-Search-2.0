import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { FavoritesService } from '../favorites/favorites.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-artist-details',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './artist-details.component.html',
  styleUrl: './artist-details.component.css',
})
export class ArtistDetailsComponent {
  artistDetails: any = {};
  artworkDetails: any[] = [];
  categoryDetails: any[] = [];
  similarArtists: any[] = [];
  id: string = '';
  activeTab: string = 'info';
  isDetailsLoading: boolean = true;
  isArtworkLoading: boolean = false;
  isCategoryLoading: boolean = false;
  isAuthenticated: boolean = false;
  showSimilarArtists: boolean = false;
  isEmpty: boolean = true;
  favoriteIds = new Set<string>();
  selectedCardId = '';
  hoveredCardId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    this.favoritesService.getFavoritesObservable().subscribe((favorites) => {
      this.favoriteIds = new Set(favorites.map((f) => f?.id));
    });

    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id') ?? '';
      this.activeTab = 'info';
      this.onInfoClick();
      this.onArtworksClick();
      this.similarArtists = [];
      this.showSimilarArtists = false;
    });
  }

  async onInfoClick(): Promise<void> {
    this.auth.isLoggedIn$.subscribe((status) => {
      this.isAuthenticated = status;
    });

    this.artistDetails = {};
    try {
      const response = await fetch(
        `${environment.API_BASE_URL}/api/artist-details/${this.id}`
      );
      if (response.ok) {
        const data = await response.json();
        this.artistDetails = data;

        if (this.isAuthenticated) {
          const similarResponse = await fetch(
            `${environment.API_BASE_URL}/api/similar-artist/${this.id}`
          );

          if (similarResponse.ok) {
            const similarData = await similarResponse.json();
            this.similarArtists = similarData._embedded.artists;
            this.showSimilarArtists = true;
          } else {
            this.similarArtists = [];
            this.showSimilarArtists = false;
          }
        }
      }
    } catch (error) {
      this.artistDetails = {};
      console.error('Error fetching data:', error);
    } finally {
      this.isDetailsLoading = false;
    }
  }

  async onArtworksClick(): Promise<void> {
    this.isArtworkLoading = true;
    this.artworkDetails = [];
    this.isEmpty = true;
    try {
      const response = await fetch(
        `${environment.API_BASE_URL}/api/artworks/${this.id}`
      );
      const data = await response.json();
      if (response.ok && data.length != 0) {
        this.artworkDetails = data;
        this.isEmpty = false;
      }
    } catch (error) {
      this.artworkDetails = [];
      console.error('Error fetching data:', error);
    } finally {
      this.isArtworkLoading = false;
    }
  }

  async onCategoryClick(details): Promise<void> {
    this.isCategoryLoading = true;
    this.categoryDetails = [];
    try {
      const response = await fetch(
        `${environment.API_BASE_URL}/api/genes/${details.id}`
      );
      if (response.ok) {
        const data = await response.json();

        this.categoryDetails = data;
      }
    } catch (error) {
      this.categoryDetails = [];
      console.error('Error fetching data:', error);
    } finally {
      this.isCategoryLoading = false;
    }
  }

  addToFavorites(result): void {
    const id = result._links?.self?.href?.split('/')[5] ?? this.id;
    this.favoritesService.addFavorite(id);
  }

  removeFromFavorites(result): void {
    const id = result._links?.self?.href?.split('/')[5] ?? this.id;
    this.favoritesService.removeFavorite(id);
  }

  onCardClick(result): void {
    const id = result._links?.self?.href?.split('/')[5] ?? '';
    this.router.navigate([`/search/artist/${id}`]);
  }

  isFavorite(result): boolean {
    const id = result._links?.self?.href?.split('/')[5] ?? this.id;
    return this.favoriteIds.has(id);
  }

  formatBiography(biography: string): string {
    if (!biography) return '';
    biography = biography.replace(/-\s/g, '');
    biography = biography.replace(/\n\n/g, '<br><br>');

    return biography;
  }

  isActiveCard(result): boolean {
    const id = result._links?.self?.href?.split('/')[5] ?? '';
    return id === this.selectedCardId;
  }

  isHovered(result): boolean {
    const id = result._links?.self?.href?.split('/')[5] ?? '';
    return id === this.hoveredCardId;
  }

  onHover(isHovered: boolean, result: any): void {
    const id = result._links?.self?.href?.split('/')[5] ?? '';
    this.hoveredCardId = isHovered ? id : null;
  }
}

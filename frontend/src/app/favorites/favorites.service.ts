import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private favoritesSubject = new BehaviorSubject<any[]>([]);
  favorites$ = this.favoritesSubject.asObservable();
  private hasLoaded = false;
  private cacheExpirationTime = 30 * 60 * 1000; // 30 minutes in milliseconds
  isEmpty = false;
  isLoading = true;

  constructor(
    private auth: AuthService,
    private notificationService: NotificationsService
  ) {}

  private startRelativeTimeUpdater() {
    interval(1000).subscribe(() => {
      const updated = this.favoritesSubject.value.map((item) => ({
        ...item,
        time: this.getRelativeTime(item.added_at),
      }));
      this.favoritesSubject.next(updated);
    });
  }

  async loadFavoritesIfNeeded() {
    if (!this.hasLoaded) {
      await this.fetchFavorites();
      this.hasLoaded = true;
    }
  }

  async fetchFavorites() {
    const email = await this.auth.getEmail();
    const cacheKey = `favorites_${email}`;
    const cacheTimestampKey = `favorites_timestamp_${email}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    const cacheTimestamp = sessionStorage.getItem(cacheTimestampKey);
    const currentTime = new Date().getTime();

    if (
      cachedData &&
      cacheTimestamp &&
      currentTime - Number(cacheTimestamp) < this.cacheExpirationTime
    ) {
      const data = JSON.parse(cachedData);
      await this.processFavorites(data.favorites);
      return;
    } else {
      console.log('Fetching favorites from API');
      const response = await fetch(
        `${environment.API_BASE_URL}/api/favorites/${email}`
      );
      const data = await response.json();
      console.log('🚀 ~ FavoritesService ~ fetchFavorites ~ data:', data);

      sessionStorage.setItem(cacheKey, JSON.stringify(data));
      sessionStorage.setItem(cacheTimestampKey, currentTime.toString());

      await this.processFavorites(data.favorites);
    }
  }

  private async processFavorites(favorites: any[]) {
    if (favorites?.length > 0) {
      this.isEmpty = true;
      const processedFavorites = await Promise.all(
        favorites.map(async (item: any, index: number) => {
          await new Promise((res) => setTimeout(res, index * 200));

          const artistCacheKey = `artist_details_${item.artist_id}`;
          let artistDetails: any;
          const cachedArtist = sessionStorage.getItem(artistCacheKey);
          if (cachedArtist) {
            artistDetails = JSON.parse(cachedArtist);
          } else {
            const detailsRes = await fetch(
              `${environment.API_BASE_URL}/api/artist-details/${item.artist_id}`
            );
            if (detailsRes.ok) {
              artistDetails = await detailsRes.json();
              console.log(
                '🚀 ~ FavoritesService ~ favorites.map ~ artistDetails:',
                artistDetails
              );
              sessionStorage.setItem(
                artistCacheKey,
                JSON.stringify(artistDetails)
              );
            } else {
              const details = {
                id: item.artist_id,
                nationality: '',
                birthday: '',
                deathday: '',
                _links: {
                  thumbnail: {
                    href: '/assets/shared/missing_image.png',
                  },
                },
              };
              artistDetails = details;
            }
          }

          return {
            ...artistDetails,
            added_at: item.added_at,
            time: this.getRelativeTime(item.added_at),
          };
        })
      );

      this.favoritesSubject.next(processedFavorites);

      if (!this.hasLoaded) {
        this.startRelativeTimeUpdater();
      }
      this.isLoading = false;
    } else {
      this.isEmpty = true;
      this.isLoading = false;
    }
  }

  async removeFavorite(id: any): Promise<boolean> {
    const email = await this.auth.getEmail();
    const response = await fetch(
      `${environment.API_BASE_URL}/api/remove-favorite/${id}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }
    );

    if (response.ok) {
      const updated = this.favoritesSubject.value.filter(
        (item) => item.id !== id
      );
      this.favoritesSubject.next(updated);

      sessionStorage.removeItem(`favorites_${email}`);
      sessionStorage.removeItem(`favorites_timestamp_${email}`);
      this.notificationService.show('Removed from favorites', 'danger');
      return true;
    }

    return false;
  }

  async addFavorite(id: any) {
    if (!id) return;
    try {
      const email = await this.auth.getEmail();

      const response = await fetch(
        `${environment.API_BASE_URL}/api/add-favourite/${id}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      if (response.status === 200) {
        this.notificationService.show('Added to favorites', 'success');
        sessionStorage.removeItem(`favorites_${email}`);
        sessionStorage.removeItem(`favorites_timestamp_${email}`);
      }
    } catch (error) {
      console.error('Error Adding to Fav', error);
    }

    await this.fetchFavorites();
  }

  private getRelativeTime(addedAt: string): string {
    const now = new Date();
    const addedDate = new Date(addedAt);
    const diffMs = now.getTime() - addedDate.getTime();

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return rtf.format(-seconds, 'second');
    else if (minutes < 60) return rtf.format(-minutes, 'minute');
    else if (hours < 24) return rtf.format(-hours, 'hour');
    else return rtf.format(-days, 'day');
  }

  resetCache() {
    this.hasLoaded = false;
  }

  getFavorites() {
    return this.favoritesSubject.value.map((fav) => fav.id);
  }

  tagFavorites(data: any[]): any[] {
    const favoriteIds = this.favoritesSubject.value.map((fav) => fav?.id);

    return data.map((item) => {
      const id = item._links?.self?.href?.split('/')[5] ?? '';
      return {
        ...item,
        isFavorite: favoriteIds.includes(id),
      };
    });
  }

  isFavorite(item: any): any {
    const favoriteIds = new Set(
      this.favoritesSubject.value.map((fav) => fav?.id)
    );

    const id = item._links?.self?.href?.split('/')[5] ?? '';

    return {
      ...item,
      isFavorite: favoriteIds.has(id),
    };
  }

  getFavoritesObservable() {
    this.loadFavoritesIfNeeded();
    return this.favorites$;
  }
}

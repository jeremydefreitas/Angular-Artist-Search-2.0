import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {}

  login() {
    this.isLoggedInSubject.next(true);
    console.log('Logged in, auth status set to true');
  }

  logout() {
    this.isLoggedInSubject.next(false);
    console.log('Logged out, auth status set to false');
  }

  getUserInfo() {
    return this.http.get<{
      email: string;
      name: string;
      profileImageUrl: string;
    }>(`${environment.API_BASE_URL}/me`, {
      withCredentials: true,
    });
  }

  async refreshLoginState(): Promise<void> {
    try {
      const response = await fetch(
        `${environment.API_BASE_URL}/me`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.isLoggedInSubject.next(!!data?.email);
      } else {
        this.isLoggedInSubject.next(false);
      }
    } catch (error) {
      console.error('Error checking login state:', error);
      this.isLoggedInSubject.next(false);
    }
  }

  async getEmail(): Promise<string> {
    try {
      const response = await fetch(
        `${environment.API_BASE_URL}/me`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!response.ok) return '';
      const data = await response.json();
      return data.email ?? '';
    } catch {
      return '';
    }
  }
}

import { Routes } from '@angular/router';
import { SearchComponent } from './search/search.component';
import { ArtistDetailsComponent } from './artist-details/artist-details.component';
import { RegistrationComponent } from './registration/registration.component';
import { LoginComponent } from './login/login.component';
import { FavoritesComponent } from './favorites/favorites.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/search',
    pathMatch: 'full',
  },
  {
    path: 'search',
    component: SearchComponent,
    children: [{ path: 'artist/:id', component: ArtistDetailsComponent }],
  },
  {
    path: 'register',
    component: RegistrationComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'favorites',
    component: FavoritesComponent,
  },
];

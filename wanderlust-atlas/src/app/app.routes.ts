import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
    title: 'Wanderlust Atlas — Your Travel Bucket List',
  },
  {
    path: 'explore',
    loadComponent: () =>
      import('./features/explore/explore.component').then(m => m.ExploreComponent),
    title: 'Explore Destinations — Wanderlust Atlas',
  },
  {
    path: 'destination/:id',
    loadComponent: () =>
      import('./features/destination-detail/destination-detail.component').then(
        m => m.DestinationDetailComponent
      ),
    title: 'Destination — Wanderlust Atlas',
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth.component').then(m => m.AuthComponent),
    title: 'Sign In — Wanderlust Atlas',
  },
  {
    path: 'travelogues',
    loadComponent: () =>
      import('./features/travelogues/travelogues.component').then(m => m.TraveloguesComponent),
    title: 'Travelogues & Journals — Wanderlust Atlas',
  },
  {
    path: 'travelogues/new',
    loadComponent: () =>
      import('./features/travelogues/travelogue-create.component').then(
        m => m.TravelogueCreateComponent
      ),
    title: 'Write a Travelogue — Wanderlust Atlas',
    canActivate: [authGuard],
  },
  {
    path: 'travelogues/:id',
    loadComponent: () =>
      import('./features/travelogues/travelogue-detail.component').then(
        m => m.TravelogueDetailComponent
      ),
    title: 'Travelogue — Wanderlust Atlas',
  },
  {
    path: 'suggest-destination',
    loadComponent: () =>
      import('./features/suggest-destination/suggest-destination.component').then(
        m => m.SuggestDestinationComponent
      ),
    title: 'Suggest a Destination — Wanderlust Atlas',
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent),
    title: 'My Bucket List — Wanderlust Atlas',
    canActivate: [authGuard],
  },
  {
    path: 'profile/:username',
    loadComponent: () =>
      import('./features/profile-public/profile-public.component').then(
        m => m.ProfilePublicComponent
      ),
    title: 'Profile — Wanderlust Atlas',
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin.component').then(m => m.AdminComponent),
    title: 'Admin Dashboard — Wanderlust Atlas',
    canActivate: [authGuard, adminGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

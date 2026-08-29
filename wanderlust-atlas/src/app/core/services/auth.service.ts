import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { User, AuthError } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/types';

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  // Signals
  private _user = signal<User | null>(null);
  private _profile = signal<Profile | null>(null);
  private _loading = signal<boolean>(true);

  // Public computed
  readonly currentUser = this._user.asReadonly();
  readonly currentProfile = this._profile.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isAdmin = computed(() => this._profile()?.is_admin === true);
  readonly loading = this._loading.asReadonly();

  constructor() {
    this.initAuthListener();
  }

  private async initAuthListener(): Promise<void> {
    // Get initial session
    const { data: { session } } = await this.supabase.client.auth.getSession();
    if (session?.user) {
      this._user.set(session.user);
      await this.loadProfile(session.user.id);
    }
    this._loading.set(false);

    // Listen for auth changes
    this.supabase.client.auth.onAuthStateChange(async (event, session) => {
      this._user.set(session?.user ?? null);
      if (session?.user) {
        await this.loadProfile(session.user.id);
      } else {
        this._profile.set(null);
      }
    });
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      this._profile.set(data as Profile);
    }
  }

  async signUp(email: string, password: string, username: string, fullName?: string): Promise<{ error: AuthError | null }> {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName ?? '',
        },
      },
    });

    if (!error && data.user) {
      await this.router.navigate(['/profile']);
    }

    return { error };
  }

  async signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });

    if (!error) {
      await this.router.navigate(['/profile']);
    }

    return { error };
  }

  async signInWithGoogle(): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    });
    return { error };
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this._user.set(null);
    this._profile.set(null);
    await this.router.navigate(['/']);
  }

  async refreshProfile(): Promise<void> {
    const user = this._user();
    if (user) {
      await this.loadProfile(user.id);
    }
  }
}

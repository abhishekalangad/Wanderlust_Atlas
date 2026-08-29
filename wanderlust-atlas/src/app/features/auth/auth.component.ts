import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  activeTab = signal<'signin' | 'signup'>('signin');
  loading = signal(false);
  showPassword = signal(false);

  signInForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  signUpForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-z0-9_]+$/)]],
    fullName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/profile']);
    }
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'signup') this.activeTab.set('signup');
  }

  async onSignIn(): Promise<void> {
    if (this.signInForm.invalid) { this.signInForm.markAllAsTouched(); return; }
    this.loading.set(true);

    const { email, password } = this.signInForm.value;
    const { error } = await this.auth.signIn(email, password);

    this.loading.set(false);
    if (error) {
      this.toast.error(error.message || 'Sign in failed. Please check your credentials.');
    } else {
      this.toast.success('Welcome back! 🌍');
    }
  }

  async onSignUp(): Promise<void> {
    if (this.signUpForm.invalid) { this.signUpForm.markAllAsTouched(); return; }
    this.loading.set(true);

    const { email, password, username, fullName } = this.signUpForm.value;
    const { error } = await this.auth.signUp(email, password, username, fullName);

    this.loading.set(false);
    if (error) {
      this.toast.error(error.message || 'Sign up failed. Please try again.');
    } else {
      this.toast.success('Welcome to Wanderlust Atlas! 🎉 Check your email to confirm.');
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.loading.set(true);
    const { error } = await this.auth.signInWithGoogle();
    if (error) {
      this.toast.error('Google sign-in failed. Please try again.');
      this.loading.set(false);
    }
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  getError(form: FormGroup, field: string): string {
    const control = form.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    if (control.errors['email']) return 'Please enter a valid email';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['pattern']) return 'Only lowercase letters, numbers, and underscores allowed';
    return 'Invalid value';
  }
}

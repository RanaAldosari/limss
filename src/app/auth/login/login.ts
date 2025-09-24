import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loginForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  showPassword = false;

  ngOnInit(): void {
    this.initForm();
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.login(this.loginForm.value).subscribe({
     next: () => {
  this.router.navigate(['/home']);
},

      error: (error) => {
        this.errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
        this.isSubmitting = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  navigateToForgotPassword(): void {
    const email = this.loginForm.get('email')?.value;
    if (email) {
      this.router.navigate(['forget-password'], { state: { email } });
    } else {
      this.router.navigate(['forget-password']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}

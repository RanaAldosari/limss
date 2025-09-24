import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forget-password.html',
  styleUrls: ['./forget-password.scss']
})
export class ForgetPassword implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);

  emailForm!: FormGroup;

  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit(): void {
    this.initEmailForm();

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      const email = navigation.extras.state['email'];
      if (email) {
        this.emailForm.get('email')?.setValue(email);
      }
    }
  }

  initEmailForm(): void {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onEmailSubmit(): void {
    if (this.emailForm.invalid) {
      this.markFormGroupTouched(this.emailForm);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const email = this.emailForm.get('email')?.value;

    this.authService.forgotPassword({ email }).subscribe({
      next: (response: any) => {
        this.isSubmitting.set(false);
        this.successMessage.set(response.message || 'Check your email for reset instructions.');

        this.router.navigate(['/auth/reset-password'], {
          state: { email }
        });
      },
      error: (error: any) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to process request. Please try again.');
      }
    });
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

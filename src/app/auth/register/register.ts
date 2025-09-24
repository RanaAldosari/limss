import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);

  registerForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
 generatedPassword: string = '';


  ngOnInit(): void {
    this.initForm();
  }

initForm(): void {
  this.registerForm = this.fb.group({
    labName: ['', [Validators.required]],
    city: ['', [Validators.required]],
    plan: ['basic', [Validators.required]],

    adminUser: this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()]).{8,}$/)
      ]]
    })
  });
}




generatePassword(): void {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.generatedPassword = password;
  this.registerForm.get('adminUser.password')?.setValue(password);
}


onSubmit(): void {
  if (this.registerForm.invalid) {
    this.markFormGroupTouched(this.registerForm);
    return;
  }

  this.isSubmitting = true;
  this.errorMessage = '';

  const payload = this.registerForm.value;

  this.authService.register(payload).subscribe({
    next: (res) => {
      if (res.token) {
        this.authService.saveToken(res.token);
      }
      this.router.navigate(['/home']);
    },
    error: (error) => {
      this.isSubmitting = false;
      this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
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

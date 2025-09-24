import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss'
})
export class ChangePasswordComponent {
  changeForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.changeForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onChangeSubmit() {
    if (this.changeForm.valid) {
      this.http.put(`/api/v1/auth/change-password`, this.changeForm.value)
        .subscribe({
          next: () => this.successMessage = 'Password changed successfully!',
          error: () => this.errorMessage = 'Failed to change password.'
        });
    }
  }
}

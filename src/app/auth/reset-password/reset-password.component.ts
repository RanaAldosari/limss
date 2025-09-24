import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
@Component({
  selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule, 
    FormsModule   
  ]
})
export class ResetPasswordComponent {
  resetForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  userId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.userId = this.route.snapshot.paramMap.get('userId');
  }

  onResetSubmit() {
    if (this.resetForm.valid && this.userId) {
      this.http.put(`/api/v1/auth/reset-password/${this.userId}`, this.resetForm.value)
        .subscribe({
          next: () => this.successMessage = 'Password reset successful!',
          error: () => this.errorMessage = 'Failed to reset password.'
        });
    }
  }
}

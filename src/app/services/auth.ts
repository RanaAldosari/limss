import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class Auth {
  private identityBaseUrl = 'http://localhost:3001/api/v1'; // identity-service
  private tenantBaseUrl = 'http://localhost:3002/api/v1';   // tenant-service

  constructor(private http: HttpClient) {}

  // login
  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.identityBaseUrl}/auth/login`, data);
  }

  // signup
  register(data: {
    labName: string;
    city: string;
    plan: string;
    adminUser: {
      fullName: string;
      email: string;
      password: string;
    };
  }): Observable<any> {
    return this.http.post(`${this.tenantBaseUrl}/tenants/signup`, data);
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  forgotPassword(data: { email: string }): Observable<any> {
    return this.http.post(`${this.identityBaseUrl}/auth/forgot-password`, data);
  }
}

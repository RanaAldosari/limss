import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'http://localhost:3001/api/v1/users';

  constructor(private http: HttpClient) {}

  // get all users
  getUsers(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(this.baseUrl, { headers });
  }

  // add new user
  addUser(user: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.baseUrl, user, { headers });
  }

  // helper for token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }
}

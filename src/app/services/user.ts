import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'http://localhost:3001/api/v1';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<any> {
    const token = localStorage.getItem('token'); 
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token?.trim()}`
    });

    return this.http.get<any>(`${this.baseUrl}/users`, { headers });
  }

  addUser(userData: any): Observable<any> {
  const token = localStorage.getItem('token');
  const headers = {
    Authorization: `Bearer ${token?.trim()}`
  };
  return this.http.post<any>(`${this.baseUrl}/users`, userData, { headers });
}

}

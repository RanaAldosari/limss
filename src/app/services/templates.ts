import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Template {
  _id: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TemplatesService {
  private baseUrl = 'http://localhost:3004/api/v1/sample-templates';

  constructor(private http: HttpClient) {}

  getTemplates(): Observable<{ data: Template[] }> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<{ data: Template[] }>(this.baseUrl, { headers });
  }
 createTemplate(template: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post(this.baseUrl, template, { headers });
  }

}

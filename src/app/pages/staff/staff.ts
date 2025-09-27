import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff.html',
  styleUrls: ['./staff.scss']
})
export class Staff implements OnInit {
  displayedColumns: string[] = ['fullName', 'email', 'userName', 'status', 'createdAt'];
  staffList: any[] = [];
  showForm = false;
  formData: any = {};


  private readonly DEFAULT_GROUP_ID = '68d43167983fa787f53f54ad';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
// get users
  loadUsers() {
    const headers = this.getAuthHeaders();
    this.http.get<any>('http://localhost:3001/api/v1/users', { headers }).subscribe({
      next: (res) => {
        this.staffList = res.data || [];
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      }
    });
  }

  onAdd() {
    this.showForm = true;
    this.formData = {};
  }

//  new user
  onSave() {
    const headers = this.getAuthHeaders();

    const body = {
      fullName: this.formData.fullName,
      email: this.formData.email,
      userName: this.formData.userName,
      groupIds: [this.DEFAULT_GROUP_ID], 
      password: this.formData.password,
      userDisabled: this.formData.userDisabled || false
    };

    console.log("Sending body:", body);

    this.http.post<any>('http://localhost:3001/api/v1/users', body, { headers }).subscribe({
      next: (res) => {
        const newUser = res.data || res;
        this.staffList.push(newUser);
        this.showForm = false;
        this.formData = {};
      },
      error: (err) => {
        console.error('Error adding user:', err);
        alert(err.error?.message || 'Error adding user');
      }
    });
  }

  onCancel() {
    this.showForm = false;
  }
}

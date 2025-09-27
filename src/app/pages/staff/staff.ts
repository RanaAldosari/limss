import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff.html',
  styleUrls: ['./staff.scss'],
})
export class Staff implements OnInit {
  staffList: any[] = [];
  newUser: any = { userName: '', email: '', fullName: '', groupNames: [], password: '' };
  showForm = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe((res) => {
      this.staffList = res.data;
    });
  }

  onAddUserClick(): void {
    this.showForm = true;
  }

  saveUser(): void {
    this.userService.addUser(this.newUser).subscribe({
      next: (res) => {
        this.staffList.push(res); 
        this.newUser = { userName: '', email: '', fullName: '', groupNames: [], password: '' };
        this.showForm = false;
      },
      error: (err) => {
        console.error('Error adding user:', err);
      },
    });
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar {
    configOpen = false;  
userName: string = '';

constructor(private router: Router) {}

  ngOnInit() {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      this.userName = parsedUser.fullName || parsedUser.userName || parsedUser.email;
    }
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/']); 
  }

  toggleConfig() {
    this.configOpen = !this.configOpen;
  }
}

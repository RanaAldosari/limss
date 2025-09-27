import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../sidebar/sidebar'; 
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Sidebar,RouterOutlet],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {}

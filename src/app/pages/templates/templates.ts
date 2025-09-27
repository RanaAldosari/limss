// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterLink } from '@angular/router';
// import { TemplatesService,Template } from '../../services/templates';

// @Component({
//   selector: 'app-templates',
//   standalone: true,
//   imports: [CommonModule, RouterLink],
//   templateUrl: './templates.html',
//   styleUrls: ['./templates.scss']
// })
// export class Templates implements OnInit {
//   templates: (Template & { status: string })[] = [];

//  constructor(private templatesService: TemplatesService) {}


//   ngOnInit(): void {
//     this.loadTemplates();
//   }

//   loadTemplates() {
//     this.templatesService.getTemplates().subscribe({
//       next: (res:any) => {
//   this.templates = res.data.map((t: Template) => ({
//   ...t,
//   status: t.active ? 'Active' : 'In-Active'
// }));

//       },
//       error: (err:any) => {
//         console.error('Error fetching templates', err);
//       }
//     });
//   }
// }


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TemplatesService,Template } from '../../services/templates';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, RouterLink,FormsModule],
  templateUrl: './templates.html',
  styleUrls: ['./templates.scss']
})
export class Templates implements OnInit {
  templates: (Template & { status: string })[] = [];
filteredTemplates: (Template & { status: string })[] = [];
  searchTerm: string = '';
  constructor(private templatesService: TemplatesService) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates() {
    this.templatesService.getTemplates().subscribe({
      next: (res: { data: Template[] }) => {
        this.templates = res.data.map((t: Template) => ({
          ...t,
          status: t.active ? 'Active' : 'In-Active'
        }));
this.filteredTemplates = [...this.templates];
      },
      error: (err) => {
        console.error('Error fetching templates', err);
      }
    });
  }

onSearch() {
  const term = this.searchTerm.trim().toLowerCase();
  this.filteredTemplates = this.templates.filter(t =>
    t.name.toLowerCase().includes(term) ||
    t.code.toLowerCase().includes(term)
  );
}


}

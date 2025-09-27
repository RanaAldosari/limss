import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TemplatesService } from '../../services/templates';

@Component({
  selector: 'app-new-template',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-template.html',
  styleUrls: ['./new-template.scss']
})
export class NewTemplate {
  template = {
    name: '',
    code: '',
    description: '',
    active: false,
    settings: {
      showSite: false,
      showProcessUnit: false,
      showProduct: false,
      showStage: false,
      showSampleNumber: false,
      showReceivedDate: false,
      showPriority: false,
      showPlant: false,
      showSamplingPoint: false,
      showGrade: false,
      showTestList: false,
      showSamplingDate: false,
      showCollectorName: false,
      showLocation: false
    }
  };

  constructor(
    private templatesService: TemplatesService,
    private router: Router
  ) {}

  saveTemplate() {
    this.templatesService.createTemplate(this.template).subscribe({
      next: (res) => {
        alert('Template created successfully!');
        console.log('Response:', res);

        this.router.navigate(['/home/templates']);
      },
      error: (err) => {
        console.error('Error creating template', err);
        alert('Error creating template');
      }
    });
  }
}

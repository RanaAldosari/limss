import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-template',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-template.html',
  styleUrls: ['./new-template.scss']
})
export class NewTemplate implements OnInit {
  saving = false;

  private readonly alwaysRequiredKeys = new Set<string>(['testListId']);

  readonly settingKeys: string[] = [
    'siteId','plantId','processUnitId','samplingPointId',
    'productId','gradeId','stageId','testListId',
    'organizationId','buildingId','roomId','storageUnitId','shelfId','boxId','positionId',
    'sampleNumber','samplingDate','receivedDate','sampledBy',
    'priority','sampleDescription','location','groupName'
  ];

  template: any = {
    name: '',
    code: '',
    description: '',
    active: true,
    settings: {} as Record<string, { visible: boolean; required: boolean }>
  };

  labels: Record<string, string> = {
    siteId: 'Site', plantId: 'Plant', processUnitId: 'Process Unit', samplingPointId: 'Sampling Point',
    productId: 'Product', gradeId: 'Grade', stageId: 'Stage',
    testListId: 'Test Panel (Test List)',
    organizationId: 'Organization', buildingId: 'Building', roomId: 'Room',
    storageUnitId: 'Storage Unit', shelfId: 'Shelf', boxId: 'Box', positionId: 'Position',
    sampleNumber: 'Sample Number', samplingDate: 'Sampling Date/Time', receivedDate: 'Received Date/Time',
    sampledBy: 'Sampled By', priority: 'Priority', sampleDescription: 'Sample Description',
    location: 'Storage Location', groupName: 'Group'
  };

  private readonly BASE = 'http://localhost:3004/api/v1';
  private get headers() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'X-Tenant-Key': localStorage.getItem('tenantKey') || 'ibnouf_lab_7_testing',
        'Content-Type': 'application/json'
      }),
      withCredentials: true
    };
  }

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.ensureDefaults();
    this.enforceAlwaysRequired();
  }

  private ensureDefaults() {
    this.settingKeys.forEach((k) => {
      if (!this.template.settings[k]) {
        this.template.settings[k] = { visible: false, required: false };
      }
    });
  }

  private enforceAlwaysRequired() {
    this.alwaysRequiredKeys.forEach((k) => {
      this.template.settings[k] = { visible: true, required: true };
    });
  }

  isAlwaysRequired(key: string) { return this.alwaysRequiredKeys.has(key); }

  onToggleVisible(key: string, checked: boolean) {
    if (this.isAlwaysRequired(key)) return;
    const s = this.template.settings[key] ?? { visible: false, required: false };
    s.visible = checked;
    if (!checked) s.required = false;
    this.template.settings[key] = s;
  }

  onToggleRequired(key: string, checked: boolean) {
    if (this.isAlwaysRequired(key)) return;
    const s = this.template.settings[key] ?? { visible: false, required: false };
    s.required = s.visible ? checked : false;
    this.template.settings[key] = s;
  }

  private buildFlatPayloadFromSettings() {
    const s = this.template.settings as Record<string, {visible: boolean; required: boolean}>;
    const flat: any = {};
    this.settingKeys.forEach((k) => {
      const v = s[k] || { visible: false, required: false };
      flat[k] = { visible: !!v.visible, required: !!v.required, modifiable: true };
    });
    return flat;
  }

  saveTemplate() {
    this.ensureDefaults();
    this.enforceAlwaysRequired();

    const flat = this.buildFlatPayloadFromSettings();

    const payload = {
      name: this.template.name,
      code: this.template.code,
      description: this.template.description,
      active: !!this.template.active,
      ...flat
    };

    localStorage.setItem('lastTemplateSettings', JSON.stringify(this.template.settings));

    this.saving = true;
    this.http.post(`${this.BASE}/sample-templates`, payload, this.headers)
      .subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/home/templates']);
        },
        error: () => {
          this.saving = false;
          alert('Error creating template');
        }
      });
  }

  onCancel() { this.router.navigate(['/home/templates']); }
}

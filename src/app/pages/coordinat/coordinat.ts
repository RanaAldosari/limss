import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type CoordTab = 'site' | 'plant' | 'unit' | 'sampling-point';

@Component({
  selector: 'app-coordinat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coordinat.html',
  styleUrls: ['./coordinat.scss'],
})
export class Coordinat {
  activeTab: CoordTab = 'site';

  get currentTitle() {
    switch (this.activeTab) {
      case 'site':  return 'Site';
      case 'plant': return 'Plant';
      case 'unit':  return 'Process Unit';
      default:      return 'Sampling Point';
    }
  }

  get headerSectionLabel() {
    if (this.showForm) {
      return `${this.editMode ? 'Edit' : 'New'} ${this.currentTitle}`;
    }
    return this.currentTitle;
  }

  displayedColumns: string[] = [];
  tableData: any[] = [];
  searchTerm = '';

  showForm = false;
  editMode = false;
  saving = false;
  formData: any = { active: true, _id: undefined };

  // dropdowns
  sites: any[] = [];
  plants: any[] = [];
  units: any[] = [];

  readonly urlBase = 'http://localhost:3004/api/v1';
  constructor(private http: HttpClient) {
    this.loadDropdowns();
    this.loadTableData();
  }

  private get headers() { return { Authorization: `Bearer ${localStorage.getItem('token')}` }; }

  filteredData() {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.tableData;
    return this.tableData.filter((r) =>
      Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }

  setActiveTab(tab: CoordTab) {
    this.activeTab = tab;
      this.editMode = false; 
    this.showForm = false;
    this.editMode = false;
    this.searchTerm = '';
    this.loadTableData();
    if (tab !== 'site') this.loadDropdowns();
  }

  onAdd() {
    this.showForm = true;
    this.editMode = false;
    this.searchTerm = ''; 
    this.formData = { active: true, _id: undefined };
    if (this.activeTab !== 'site') delete this.formData.code;
  }

  onCancel() {
    this.showForm = false;
    this.editMode = false;
    this.searchTerm = '';
  }

  private normalizeCode(v: string) {
    return String(v || '').toUpperCase().replace(/[^A-Z0-9_]/g, '_').trim();
  }
  private clean(obj: any) {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
  }

  loadDropdowns() {
    this.http.get<any>(`${this.urlBase}/sites`, { headers: this.headers }).subscribe({
      next: (r) => (this.sites = r?.data || []), error: () => (this.sites = []),
    });
    this.http.get<any>(`${this.urlBase}/plants`, { headers: this.headers }).subscribe({
      next: (r) => (this.plants = r?.data || []), error: () => (this.plants = []),
    });
    this.http.get<any>(`${this.urlBase}/process-units`, { headers: this.headers }).subscribe({
      next: (r) => (this.units = r?.data || []), error: () => (this.units = []),
    });
  }

  // ===== TABLE =====
  loadTableData() {
    if (this.activeTab === 'site') {
      this.http.get<any>(`${this.urlBase}/sites`, { headers: this.headers }).subscribe({
        next: (r) => {
          this.tableData = (r?.data || []).map((x: any) => ({
            _id: x._id, code: x.code, name: x.name, active: x.active,
          }));
          this.displayedColumns = ['code', 'name', 'active'];
        },
      });
      return;
    }

    if (this.activeTab === 'plant') {
      this.http.get<any>(`${this.urlBase}/plants`, { headers: this.headers }).subscribe({
        next: (r) => {
          this.tableData = (r?.data || []).map((x: any) => ({
            _id: x._id, name: x.name, site: x.siteId?.name || x.site?.name || '', active: x.active,
          }));
          this.displayedColumns = ['name', 'site', 'active'];
        },
      });
      return;
    }

    if (this.activeTab === 'unit') {
      this.http.get<any>(`${this.urlBase}/process-units`, { headers: this.headers }).subscribe({
        next: (r) => {
          this.tableData = (r?.data || []).map((x: any) => ({
            _id: x._id, name: x.name, plant: x.plantId?.name || x.plant?.name || '', active: x.active,
          }));
          this.displayedColumns = ['name', 'plant', 'active'];
        },
      });
      return;
    }

    // sampling point
    this.http.get<any>(`${this.urlBase}/sampling-points`, { headers: this.headers }).subscribe({
      next: (r) => {
        this.tableData = (r?.data || []).map((x: any) => ({
          _id: x._id, name: x.name, processunit: x.processUnitId?.name || x.processUnit?.name || '', active: x.active,
        }));
        this.displayedColumns = ['name', 'processunit', 'active'];
      },
    });
  }

  // ===== SAVE =====
  onSave() {
    let url = ''; let payload: any = {};
    const method: 'post'|'patch' = this.editMode ? 'patch' : 'post';

    if (this.activeTab === 'site') {
      const code = this.normalizeCode(this.formData.code);
      if (!code) return alert('Code required');
      if (!this.formData.name) return alert('Name required');
      url = `${this.urlBase}/sites${this.editMode ? '/' + this.formData._id : ''}`;
      payload = this.clean({ name: this.formData.name, code, active: !!this.formData.active });
    } else if (this.activeTab === 'plant') {
      if (!this.formData.siteId) return alert('Site required');
      if (!this.formData.name) return alert('Name required');
      url = `${this.urlBase}/plants${this.editMode ? '/' + this.formData._id : ''}`;
      payload = this.clean({ siteId: this.formData.siteId, name: this.formData.name, active: !!this.formData.active });
    } else if (this.activeTab === 'unit') {
      if (!this.formData.plantId) return alert('Plant required');
      if (!this.formData.name) return alert('Name required');
      url = `${this.urlBase}/process-units${this.editMode ? '/' + this.formData._id : ''}`;
      payload = this.clean({ plantId: this.formData.plantId, name: this.formData.name, active: !!this.formData.active });
    } else {
      if (!this.formData.processUnitId) return alert('Processing Unit required');
      if (!this.formData.name) return alert('Name required');
      url = `${this.urlBase}/sampling-points${this.editMode ? '/' + this.formData._id : ''}`;
      payload = this.clean({ processUnitId: this.formData.processUnitId, name: this.formData.name, active: !!this.formData.active });
    }

    this.saving = true;
    const req = method === 'post'
      ? this.http.post<any>(url, payload, { headers: this.headers })
      : this.http.patch<any>(url, payload, { headers: this.headers });

    req.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.editMode = false;
        this.loadDropdowns();
        this.loadTableData();
      },
      error: (err) => {
        this.saving = false;
        alert('Error: ' + (err?.error?.details || err?.error?.message || err?.message || 'Unknown'));
      },
    });
  }
}

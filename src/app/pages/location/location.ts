import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

type Row = { name: string; code: string };

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location.html',
  styleUrls: ['./location.scss']
})
export class Location {
  activeTab: 'building'|'room'|'storage-unit'|'shelf'|'box' = 'building';

  tableData: Row[] = [];
  filteredData: Row[] = [];

  showForm = false;
  saving = false;

  searchTerm = '';
  formData: any = {};

  private titleMap: Record<string, string> = {
    'building': 'Building',
    'room': 'Room',
    'storage-unit': 'Storage Unit',
    'shelf': 'Shelf',
    'box': 'Box / Drawer'
  };
  get activeTitle() { return this.titleMap[this.activeTab]; }

  constructor(private http: HttpClient) {
    this.loadTableData();
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  setActiveTab(tab: typeof this.activeTab) {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.showForm = false;
    this.searchTerm = '';
    this.loadTableData();
  }

  /* ===== List ===== */
  loadTableData() {
    const headers = this.authHeaders();
    let url = '';

    switch (this.activeTab) {
      case 'building':     url = 'http://localhost:3004/api/v1/buildings';      break;
      case 'room':         url = 'http://localhost:3004/api/v1/rooms';          break;
      case 'storage-unit': url = 'http://localhost:3004/api/v1/storage-units';  break;
      case 'shelf':        url = 'http://localhost:3004/api/v1/shelves';        break;
      case 'box':          url = 'http://localhost:3004/api/v1/boxes';          break;
    }

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        const data = (res?.data || []) as any[];
        this.tableData = data.map(it => ({ name: it.name, code: it.code })) as Row[];
        this.filteredData = [...this.tableData];
      },
      error: (err) => console.error(`Error fetching ${this.activeTab}:`, err)
    });
  }

  onSearch() {
    const q = (this.searchTerm || '').trim().toLowerCase();
    if (!q) { this.filteredData = [...this.tableData]; return; }
    this.filteredData = this.tableData.filter(r =>
      `${r.name} ${r.code}`.toLowerCase().includes(q)
    );
  }
  clearSearch() { this.searchTerm = ''; this.filteredData = [...this.tableData]; }

  onAdd() {
    this.showForm = true;
    this.saving = false;
    this.formData = {};
  }

  get formInvalid(): boolean {
    return !(this.formData?.name && this.formData?.code);
  }

  onSave() {
    if (this.saving || this.formInvalid) return;
    this.saving = true;

    const headers = this.authHeaders();
    let url = '';
    let body: any = {};
    let newRow: Row = { name: this.formData.name, code: this.formatCode(this.formData.code) };

    switch (this.activeTab) {
      case 'building':
        url = 'http://localhost:3004/api/v1/buildings';
        body = {
          organizationId: '68bef0a90f75cd571c87b28f',
          name: this.formData.name,
          code: newRow.code,
          floor: this.formData.floor || 'G+1',
          description: this.formData.description || '',
          active: true
        };
        break;

      case 'room':
        url = 'http://localhost:3004/api/v1/rooms';
        body = {
          buildingId: '68bef38b0f75cd571c87b2ae',
          name: this.formData.name,
          code: newRow.code,
          roomNumber: this.formData.roomNumber || '',
          description: this.formData.description || '',
          temperature: this.formData.temperature || 22.5,
          humidity: this.formData.humidity || 45,
          active: true
        };
        break;

      case 'storage-unit':
        url = 'http://localhost:3004/api/v1/storage-units';
        body = {
          roomId: '68bef4740f75cd571c87b2c1',
          name: this.formData.name,
          code: newRow.code,
          type: this.formData.type || 'FREEZER',
          description: this.formData.description || '',
          temperature: this.formData.temperature || -80,
          capacity: this.formData.capacity || '400L',
          active: true
        };
        break;

      case 'shelf':
        url = 'http://localhost:3004/api/v1/shelves';
        body = {
          storageUnitId: '68bef83d4e3f92591ffc3030',
          name: this.formData.name,
          code: newRow.code,
          level: this.formData.level || 1,
          description: this.formData.description || '',
          maxCapacity: this.formData.maxCapacity || 50,
          active: true
        };
        break;

      case 'box':
        url = 'http://localhost:3004/api/v1/boxes';
        body = {
          shelfId: '68bef9874e3f92591ffc3048',
          name: this.formData.name,
          code: newRow.code,
          type: this.formData.type || 'BOX',
          description: this.formData.description || '',
          dimensions: this.formData.dimensions || { length: 13, width: 13, height: 5 },
          maxPositions: this.formData.maxPositions || 81,
          active: true
        };
        break;
    }

    this.http.post<any>(url, body, { headers }).subscribe({
      next: () => {
        this.tableData = [newRow, ...this.tableData];
        this.onSearch();
        this.showForm = false;
        this.saving = false;
      },
      error: (err) => {
        this.saving = false;
        console.error('Save error', err);
        alert(err?.error?.error?.details?.[0]?.message || 'Error');
      }
    });
  }

  onCancel() { this.showForm = false; }

  private formatCode(v: string): string {
    return (v || '').toUpperCase().replace(/[^A-Z0-9_]/g, '');
  }
}

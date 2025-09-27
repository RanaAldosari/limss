import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location.html',
  styleUrls: ['./location.scss']
})
export class Location {
  activeTab: string = 'building';
  displayedColumns: string[] = [];
  tableData: any[] = [];
  showForm = false;
  formData: any = {};

  constructor(private http: HttpClient) {
    this.loadTableData();
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.showForm = false;
    this.loadTableData();
  }

  loadTableData() {
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    let url = '';

    switch (this.activeTab) {
      case 'building': url = 'http://localhost:3004/api/v1/buildings'; break;
      case 'room': url = 'http://localhost:3004/api/v1/rooms'; break;
      case 'storage-unit': url = 'http://localhost:3004/api/v1/storage-units'; break;
      case 'shelf': url = 'http://localhost:3004/api/v1/shelves'; break;
      case 'box': url = 'http://localhost:3004/api/v1/boxes'; break;
    }

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        this.tableData = res.data.map((item: any) => ({
          name: item.name,
          code: item.code
        }));
        this.setDisplayedColumns();
      },
      error: (err) => console.error(`Error fetching ${this.activeTab}:`, err)
    });
  }

  setDisplayedColumns() {
    this.displayedColumns = ['name', 'code'];
  }

  onAdd() {
    this.showForm = true;
    this.formData = {};
  }


onSave() {
  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
  let url = '';
  let body: any = {};
  let row: any = {};

  if (this.activeTab === 'building') {
    url = 'http://localhost:3004/api/v1/buildings';
    body = {
      organizationId: '68bef0a90f75cd571c87b28f',
      name: this.formData.name,
      code: (this.formData.code || '').toUpperCase().replace(/[^A-Z0-9_]/g, ''),
      floor: this.formData.floor || 'G+1',
      description: this.formData.description || '',
      active: true
    };
    row = { name: body.name, code: body.code };
  }

  if (this.activeTab === 'room') {
    url = 'http://localhost:3004/api/v1/rooms';
    body = {
      buildingId: '68bef38b0f75cd571c87b2ae',
      name: this.formData.name,
      code: (this.formData.code || '').toUpperCase().replace(/[^A-Z0-9_]/g, ''),
      roomNumber: this.formData.roomNumber || '',
      description: this.formData.description || '',
      temperature: this.formData.temperature || 22.5,
      humidity: this.formData.humidity || 45,
      active: true
    };
    row = { name: body.name, code: body.code };
  }

  if (this.activeTab === 'storage-unit') {
    url = 'http://localhost:3004/api/v1/storage-units';
    body = {
      roomId: '68bef4740f75cd571c87b2c1',
      name: this.formData.name,
      code: (this.formData.code || '').toUpperCase().replace(/[^A-Z0-9_]/g, ''),
      type: this.formData.type || 'FREEZER',
      description: this.formData.description || '',
      temperature: this.formData.temperature || -80,
      capacity: this.formData.capacity || '400L',
      active: true
    };
    row = { name: body.name, code: body.code };
  }

  if (this.activeTab === 'shelf') {
    url = 'http://localhost:3004/api/v1/shelves';
    body = {
      storageUnitId: '68bef83d4e3f92591ffc3030',
      name: this.formData.name,
      code: (this.formData.code || '').toUpperCase().replace(/[^A-Z0-9_]/g, ''),
      level: this.formData.level || 1,
      description: this.formData.description || '',
      maxCapacity: this.formData.maxCapacity || 50,
      active: true
    };
    row = { name: body.name, code: body.code };
  }

  if (this.activeTab === 'box') {
    url = 'http://localhost:3004/api/v1/boxes';
    body = {
      shelfId: '68bef9874e3f92591ffc3048',
      name: this.formData.name,
      code: (this.formData.code || '').toUpperCase().replace(/[^A-Z0-9_]/g, ''),
      type: this.formData.type || 'BOX',
      description: this.formData.description || '',
      dimensions: this.formData.dimensions || { length: 13, width: 13, height: 5 },
      maxPositions: this.formData.maxPositions || 81,
      active: true
    };
    row = { name: body.name, code: body.code };
  }

  this.http.post<any>(url, body, { headers }).subscribe({
    next: (res) => {
      console.log('add success', res);
      this.tableData.push(row); 
      this.showForm = false;
    },
    error: (err) => {
      console.error('error', err);
      alert(err.error?.error?.details?.[0]?.message || 'error');
    }
  });
}

 onCancel() {
    this.showForm = false;
  }
}

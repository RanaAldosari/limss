import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tests.html',
  styleUrls: ['./tests.scss']
})
export class Tests {
  activeTab = 'product-grade';
  displayedColumns: string[] = [];
  tableData: any[] = [];
  showForm = false;
  formData: any = {};

  constructor(private http: HttpClient) {
    this.loadTableData();
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.loadTableData();
  }

  loadTableData() {
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

    if (this.activeTab === 'analysis') {
      this.http.get<any>('http://localhost:3004/api/v1/analyses', { headers }).subscribe({
        next: (res) => {
          this.tableData = res.data.map((item: any) => ({
            code: item.code,
            name: item.name,
            analysisGroupName: item.groupId?.name,
            analysisTypeName: item.AnalysisType,
            description: item.description
          }));
          this.setDisplayedColumns();
        },
        error: (err) => {
          console.error('Error fetching analyses:', err);
          this.tableData = [];
        }
      });

    } else if (this.activeTab === 'product-grade') {
      this.http.get<any>('http://localhost:3004/api/v1/grades', { headers }).subscribe({
        next: (res) => {
          this.tableData = res.data.map((item: any) => ({
            code: item.code,
            name: item.name,
            description: `${item.productId?.name} - ${item.samplingPointId?.name}`
          }));
          this.setDisplayedColumns();
        },
        error: (err) => {
          console.error('Error fetching product-grades:', err);
          this.tableData = [];
        }
      });

    } else if (this.activeTab === 'analysis-type') {
      this.http.get<any>('http://localhost:3004/api/v1/analyses', { headers }).subscribe({
        next: (res) => {
          this.tableData = res.data.map((item: any) => ({
            analysisType: item.name,
            analysisId: item._id
          }));
          this.setDisplayedColumns();
        },
        error: (err) => {
          console.error('Error fetching analysis-types:', err);
          this.tableData = [];
        }
      });

    } else if (this.activeTab === 'analysis-group') {
      this.http.get<any>('http://localhost:3004/api/v1/analyses', { headers }).subscribe({
        next: (res) => {
          this.tableData = res.data.map((item: any) => ({
            code: item.code,
            name: item.name,
            productGradeName: item.productGradeId?.name
          }));
          this.setDisplayedColumns();
        },
        error: (err) => {
          console.error('Error fetching analysis-groups:', err);
          this.tableData = [];
        }
      });

    } else if (this.activeTab === 'test') {
      this.http.get<any>('http://localhost:3004/api/v1/test-lists', { headers }).subscribe({
        next: (res) => {
          this.tableData = res.data.map((item: any) => ({
            code: item.code,
            name: item.name,
            groupName: item.groupId?.name,
            analysisName: item.entries?.[0]?.analysisId?.name,
            analysisId: item.entries?.[0]?.analysisId?._id
          }));
          this.setDisplayedColumns();
        },
        error: (err) => {
          console.error('Error fetching test-lists:', err);
          this.tableData = [];
        }
      });
    }
  }

  setDisplayedColumns() {
    switch (this.activeTab) {
      case 'product-grade':
        this.displayedColumns = ['code', 'name'];
        break;
      case 'analysis-type':
        this.displayedColumns = ['analysisType', ''];
        break;
      case 'analysis-group':
        this.displayedColumns = ['code', 'name', ''];
        break;
      case 'analysis':
        this.displayedColumns = ['code', 'name', 'analysisGroupName', 'analysisTypeName', 'description'];
        break;
      case 'test':
        this.displayedColumns = ['code', 'name', 'groupName', 'analysisName', ''];
        break;
    }
  }

  onAddRole() {
    this.showForm = true;
    this.formData = {};
  }

onSave() {
  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  if (this.activeTab === 'product-grade') {
    const formattedCode = (this.formData.code || '')
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_');

    if (!formattedCode) {
      alert('Code is required and must be uppercase letters, numbers, or underscores');
      return;
    }

    const payload = {
      productId: this.formData.productId || '68d5100fd0d7251811a6acf1',
      samplingPointId: this.formData.samplingPointId || '68d50fcfd0d7251811a6acec',
      name: this.formData.name,
      code: formattedCode, 
      sortOrder: this.formData.sortOrder || 1,
      descreption: this.formData.descreption
    };

   this.http.post<any>('http://localhost:3004/api/v1/grades', payload, { headers }).subscribe({
  next: (res) => {
    console.log('Add succcess :', res);

    const item = res.data; 

    this.tableData.push({
      code: item.code,
      name: item.name,
      description: `${item.productId?.name} - ${item.samplingPointId?.name}`
    });

    this.showForm = false;
  },
  error: (err) => {
    console.error('error:', err);
    alert('error: ' + err.error?.message);
  }
});

  }
}
 onCancel() {
    this.showForm = false;
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Step = 'filters' | 'results';
interface TPRow {
  spec: string;
  user: string;
  total: number;
  failed: number;
  suspended: number;
  date: string;
}

@Component({
  selector: 'app-test-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-reports.html',
  styleUrl: './test-reports.scss'
})
export class TestReportsComponent {
  step: Step = 'filters';
  dateFrom = '';
  dateTo = '';
  spec = 'All';

  rows: TPRow[] = [
    { spec:'Physical', user:'Hassan Ahmed', total:305, failed:20, suspended:35, date:'2025-05-20' },
    { spec:'Physical', user:'Anfal Rayaid', total:305, failed:22, suspended:33, date:'2025-05-21' },
    { spec:'Chemical', user:'Eman Saleh',   total:180, failed:12, suspended:17, date:'2025-05-22' },
  ];
  visible: TPRow[] = [];

  private inRange(d: string) {
    const t = new Date(d).getTime();
    const f = this.dateFrom ? new Date(this.dateFrom).getTime() : -Infinity;
    const to = this.dateTo ? new Date(this.dateTo).getTime() + 86399999 : Infinity;
    return t>=f && t<=to;
  }

  viewResults() {
    this.visible = this.rows.filter(r => this.inRange(r.date) && (this.spec==='All' || r.spec===this.spec));
    this.step = 'results';
  }
  back(){ this.step='filters'; }

  exportCSV() {
    const head = ['Specification','User','No. of Tests','Failed Tests','Suspended Tests'];
    const lines = this.visible.map(r => [r.spec,r.user,r.total,r.failed,r.suspended].join(','));
    const csv = [head.join(','),...lines].join('\n');
    const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='testing-performance.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}

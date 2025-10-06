import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Step = 'filters' | 'results';

interface UARow {
  ts: string;         // ISO-like
  userName: string;
  userType: string;
  description: string;
  ip: string;
}

@Component({
  selector: 'app-user-activity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-activity.html',
  styleUrl: './user-activity.scss'
})
export class UserActivityComponent {
  step: Step = 'filters';

  // Filters
  dateFrom = '';
  dateTo = '';
  userType = 'All';

  // Static data
  rows: UARow[] = [
    { ts: '2025-05-20 09:25:00', userName: 'Mohammed Ali', userType: 'Manager', description: 'Add User',     ip: '192.168.1.10' },
    { ts: '2025-05-20 09:35:00', userName: 'Hassan Ahmed',  userType: 'Sampler', description: 'Add Sample',  ip: '192.168.1.21' },
    { ts: '2025-05-21 10:05:00', userName: 'Eman Saleh',    userType: 'Analyst', description: 'Add Result',  ip: '192.168.1.22' },
    { ts: '2025-05-22 11:12:00', userName: 'Mohammed Ali',  userType: 'Manager', description: 'Update Role', ip: '192.168.1.10' },
  ];
  visible: UARow[] = [];

  private inRange(dt: string): boolean {
    const t = new Date(dt).getTime();
    const from = this.dateFrom ? new Date(this.dateFrom).getTime() : -Infinity;
    const to   = this.dateTo   ? new Date(this.dateTo).getTime() + 86399999 : Infinity;
    return t >= from && t <= to;
  }

  viewResults() {
    this.visible = this.rows.filter(r =>
      this.inRange(r.ts) && (this.userType === 'All' || r.userType === this.userType)
    );
    this.step = 'results';
  }

  back() { this.step = 'filters'; }

  exportCSV() {
    const header = ['Timestamp','User Name','User Type','Description','IP Address'];
    const lines = this.visible.map(r => [r.ts, r.userName, r.userType, r.description, r.ip].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'user-activity.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}

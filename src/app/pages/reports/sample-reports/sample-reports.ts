import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Step = 'filters' | 'results';

interface SRRow {
  sampleId: string;
  sampleType: string;
  client: string;
  received: string;  // date
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
}

@Component({
  selector: 'app-sample-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sample-reports.html',
  styleUrl: './sample-reports.scss'
})
export class SampleReportsComponent {
  step: Step = 'filters';
  dateFrom = '';
  dateTo = '';
  state = 'All';
  service = 'All';
  recordNo = '';

  rows: SRRow[] = [
    { sampleId:'24A985302365', sampleType:'Water',  client:'Abd Al Aziz Ahmed', received:'2025-05-20', status:'In Progress' },
    { sampleId:'24A985302366', sampleType:'Blood',  client:'Hassan Ahmed',      received:'2025-05-20', status:'Completed'  },
    { sampleId:'24A985302367', sampleType:'Soil',   client:'Fawzi Riyad',       received:'2025-05-21', status:'Pending'    },
    { sampleId:'24A985302368', sampleType:'Water',  client:'Ali Askar',         received:'2025-05-22', status:'Completed'  },
  ];
  visible: SRRow[] = [];

  private inRange(d: string) {
    const t = new Date(d).getTime();
    const f = this.dateFrom ? new Date(this.dateFrom).getTime() : -Infinity;
    const to = this.dateTo ? new Date(this.dateTo).getTime() + 86399999 : Infinity;
    return t>=f && t<=to;
  }

  viewResults() {
    this.visible = this.rows.filter(r => {
      const okDate = this.inRange(r.received);
      const okState = this.state==='All' || r.status===this.state;
      const okSrv = this.service==='All' || r.sampleType.toLowerCase()===this.service.toLowerCase();
      const okRec = !this.recordNo || r.sampleId.includes(this.recordNo.trim());
      return okDate && okState && okSrv && okRec;
    });
    this.step = 'results';
  }
  back(){ this.step='filters'; }

  exportCSV() {
    const head = ['Sample ID','Sample Type','Client','Received Date','Status'];
    const lines = this.visible.map(r => [r.sampleId,r.sampleType,r.client,r.received,r.status].join(','));
    const csv = [head.join(','),...lines].join('\n');
    const blob = new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='sample-receipt.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}

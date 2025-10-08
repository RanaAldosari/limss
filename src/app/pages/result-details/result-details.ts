import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type FlatEntry = {
  name: string;
  code?: string;
  unit?: string;
  resultType?: string;
  value: string | number | boolean | null;
  inSpec?: boolean;
};

@Component({
  selector: 'app-result-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result-details.html',
  styleUrls: ['./result-details.scss']
})
export class ResultDetails implements OnInit {
  @ViewChild('pdfArea', { static: false }) pdfArea!: ElementRef;

  testId = '';
  printDate = new Date();

  // Meta
  testMeta: any = null;    
  sampleMeta: any = null;   

  // Results
  resultDocs: any[] = [];   
  entries: FlatEntry[] = []; 

  loading = true;
  error = '';

  private readonly TEST_API = 'http://localhost:3007/api/v1/tests';
  private readonly SAMPLE_API = 'http://localhost:3005/api/v1/samples';

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.testId = this.route.snapshot.paramMap.get('testId') || '';
    if (!this.testId) { this.loading = false; this.error = 'Invalid test id.'; return; }
    this.loadAll();
  }

  // ===== HTTP =====
  private headers() {
    const h: Record<string, string> = {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json'
    };
    const tenant = localStorage.getItem('tenantKey');
    if (tenant) h['X-Tenant-Key'] = tenant;
    return { headers: new HttpHeaders(h) };
  }
get hasOutOfSpec(): boolean {
  return Array.isArray(this.entries) && this.entries.some(e => e.inSpec === false);
}

get outOfSpecEntries() {
  return (this.entries || []).filter(e => e.inSpec === false);
}

  private async loadAll() {
    try {
      const testRes: any = await this.http.get(`${this.TEST_API}/${this.testId}`, this.headers()).toPromise();
      this.testMeta = testRes?.data || null;

      if (this.testMeta?.sampleId) {
        try {
          const sRes: any = await this.http.get(`${this.SAMPLE_API}/${this.testMeta.sampleId}`, this.headers()).toPromise();
          this.sampleMeta = sRes?.data || null;
        } catch {}
      }

      const res: any = await this.http.get(`${this.TEST_API}/${this.testId}/results`, this.headers()).toPromise();
      const data = res?.data;
      this.resultDocs = Array.isArray(data) ? data : (data ? [data] : []);
      this.entries = this.flattenEntries(this.resultDocs);

      this.loading = false;
    } catch (err: any) {
      this.error = err?.error?.error?.message || 'Failed to load results.';
      this.loading = false;
    }
  }

  private flattenEntries(docs: any[]): FlatEntry[] {
    const out: FlatEntry[] = [];
    for (const doc of docs) {
      const es: any[] = Array.isArray(doc?.entries) ? doc.entries : [];
      for (const e of es) {
        const comp = e?.componentId || {};
        const unit = e?.units ?? comp?.units;
        const resultType = (e?.resultType ?? comp?.resultType ?? '').toString().toUpperCase();

        let value: any = null;
        if (resultType === 'N') {
          const places = typeof e?.places === 'number' ? e.places : undefined;
          const num = typeof e?.numericEntry === 'number' ? e.numericEntry : null;
          value = (num != null && places != null) ? Number(num).toFixed(places) : num;
        } else if (resultType === 'B') {
          value = (e?.booleanEntry === true) ? 'Yes' : (e?.booleanEntry === false ? 'No' : null);
        } else {
          value = e?.textEntry ?? e?.value ?? null;
        }

        out.push({
          name: comp?.name || comp?.code || '—',
          code: comp?.code,
          unit: unit,
          resultType,
          value,
          inSpec: e?.inSpec
        });
      }
    }
    return out;
  }

  // ===== UI Helpers =====
  statusText(): string {
    const s = (this.testMeta?.status || '').toString().toUpperCase();
    if (!s) return '—';
    const map: Record<string,string> = {
      I: 'Incomplete', P: 'Pending', C: 'Complete', A: 'Authorized', R: 'Reviewed', M: 'Measured'
    };
    return map[s] || this.testMeta?.status;
  }

  analysisName(): string {
    const a = this.testMeta?.analysis || this.testMeta?.analysisId;
    if (!a) return '—';
    return typeof a === 'string' ? a : (a?.name || a?.code || '—');
  }

  safe(v: any, fallback = '—') { return (v === null || v === undefined || v === '') ? fallback : v; }

  // ===== Export PDF =====
  async exportPdf() {
    if (!this.pdfArea) return;
    const el = this.pdfArea.nativeElement as HTMLElement;
    
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#fff' });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth  = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth  = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = `Result-${this.testMeta?.testNumber || this.testId}.pdf`;
    pdf.save(fileName);
  }

  back() { this.router.navigate(['/home/my-test']); }
}

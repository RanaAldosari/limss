import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

type TestItem = {
  _id?: string;
  testNumber?: string;
  sampleId?: string;
  analysisId?: string | any;
  groupId?: string;
  replicateCount?: number;
  status?: string;
  assignedOperator?: string;
  createdAt?: string;
  updatedAt?: string;
  _source?: 'api' | 'optimistic';
  _fromTestListId?: string;
  nameFromList?: string;
  codeFromList?: string;
};

@Component({
  selector: 'app-my-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-test.html',
  styleUrls: ['./my-test.scss']
})
export class MyTest implements OnInit {
  private readonly API = 'http://localhost:3007/api/v1/tests';

  // قابل للتغيير حسب الكويري
  private operatorId = localStorage.getItem('currentUserId') || '68dd2360fab1dde69389558c';

  loading = false;
  error = '';
  tests: TestItem[] = [];

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const qpOp = this.route.snapshot.queryParamMap.get('operatorId');
    if (qpOp) this.operatorId = qpOp;
    this.loadTests();
  }

  private get headers() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
        'X-Tenant-Code': localStorage.getItem('tenantKey') || 'ibnouf_lab_7_testing'
      })
    };
  }

  private loadTests() {
    this.loading = true; this.error = '';

    this.http.get<any>(`${this.API}?assignedOperator=${this.operatorId}`, this.headers).subscribe({
      next: res => {
        const apiTests: TestItem[] = Array.isArray(res?.data) ? res.data.map((t: any) => ({ ...t, _source: 'api' })) : [];
        const optimistic = this.readOptimistic();
        const merged = this.mergeUnique(apiTests, optimistic);
        this.tests = merged;
        this.loading = false;
      },
      error: err => {
        this.tests = this.readOptimistic();
        this.error = err?.error?.error?.message || 'Failed to load tests.';
        this.loading = false;
      }
    });
  }

  /** يقرأ التعيينات المحلية */
  private readOptimistic(): TestItem[] {
    const key = 'optimistic_assigned_lists';
    const obj = JSON.parse(localStorage.getItem(key) || '{}') as Record<string, Array<any>>;
    const mine = Array.isArray(obj[this.operatorId]) ? obj[this.operatorId] : [];
    return mine.map(it => ({
      _source: 'optimistic',
      _fromTestListId: it.id,
      nameFromList: it.name,
      codeFromList: it.code,
      groupId: it.groupId,
      status: 'I',
      createdAt: it.assignedAt,
      updatedAt: it.assignedAt,
      assignedOperator: this.operatorId,
    }));
  }

  private mergeUnique(apiItems: TestItem[], optimisticItems: TestItem[]): TestItem[] {
    const out: TestItem[] = [];
    const seen = new Set<string>();

    const push = (t: TestItem) => {
      const key = t._id || `${t._source}:${t._fromTestListId || t.testNumber}`;
      if (key && !seen.has(key)) { seen.add(key); out.push(t); }
    };

    apiItems.forEach(push);
    optimisticItems.forEach(push);
    return out;
  }

  mapStatus(s?: string): string {
    const map: Record<string, string> = { I: 'Incomplete', C: 'Completed', R: 'Reviewed', P: 'Pending', AUTHORIZED: 'Authorized' };
    return map[(s || '').toUpperCase()] || s || '-';
  }

  openDetails(t: TestItem) {
    if (t._source === 'api' && t._id) {
      this.router.navigate(['/my-test', t._id]);
    } else {
      this.router.navigate(['/my-test', 'optimistic', t._fromTestListId || 'pending']);
    }
  }
}

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
  _fromTestListId?: string; // مفتاح محلي للتفاؤلي
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
  private operatorId = '';

  loading = false;
  error = '';
  tests: TestItem[] = [];

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(qp => {
      const qpOp = qp.get('operatorId');

      if (qpOp) {
        this.operatorId = qpOp;
        console.log('[MYTEST] operatorId (query) =', this.operatorId);
        localStorage.setItem('mytest_operatorId', this.operatorId);
      } else {
        const saved = localStorage.getItem('mytest_operatorId');
        if (saved) {
          this.operatorId = saved;
          console.log('[MYTEST] operatorId (saved) =', this.operatorId);
        } else {
          try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            if (u && u._id) this.operatorId = u._id;
          } catch {}
          if (!this.operatorId) {
            const cid = localStorage.getItem('currentUserId');
            if (cid) this.operatorId = cid;
          }
          if (!this.operatorId) this.operatorId = '68dd2360fab1dde69389558c';
          console.log('[MYTEST] operatorId (storage/fallback) =', this.operatorId);
          localStorage.setItem('mytest_operatorId', this.operatorId);
        }
      }

      this.loadTests();
    });
  }

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

  private loadTests() {
    this.loading = true; this.error = '';
    const url = `${this.API}?assignedOperator=${encodeURIComponent(this.operatorId)}`;
    console.log('[MYTEST] fetching =', url);

    this.http.get<any>(url, this.headers).subscribe({
      next: res => {
        const apiTests: TestItem[] = Array.isArray(res?.data)
          ? res.data.map((t: any) => ({ ...t, _source: 'api' as const }))
          : [];
        const optimistic = this.readOptimistic();
        this.tests = this.mergeUnique(apiTests, optimistic);
        this.loading = false;
        console.log('[MYTEST] api=', apiTests, ' optimistic=', optimistic);
      },
      error: err => {
        this.tests = this.readOptimistic();
        this.error = err?.error?.error?.message || 'Failed to load tests.';
        this.loading = false;
      }
    });
  }

  /** يقرأ التعيينات التفاؤلية للمستخدم الحالي */
  private readOptimistic(): TestItem[] {
    const KEY = 'optimistic_assigned_lists';
    const obj = JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, Array<any>>;
    const mine = Array.isArray(obj[this.operatorId]) ? obj[this.operatorId] : [];
    console.log('[MYTEST] optimistic for', this.operatorId, '=', mine);

    return mine.map(it => ({
      _source: 'optimistic',
      _fromTestListId: it.id,
      testNumber: it.testNumber,
      sampleId: it.sampleId,
      groupId: it.groupId,
      analysisId: it.analysis,
      status: 'I',
      createdAt: it.assignedAt,
      updatedAt: it.assignedAt,
      assignedOperator: this.operatorId
    }));
  }

  private mergeUnique(apiItems: TestItem[], optimisticItems: TestItem[]): TestItem[] {
    const out: TestItem[] = [];
    const seen = new Set<string>();
    const push = (t: TestItem) => {
      const key =
        (t._id && `api:${t._id}`) ||
        (t._source === 'optimistic' && t._fromTestListId && `opt:${t._fromTestListId}`) ||
        (t.testNumber && `tn:${t.testNumber}`) ||
        Math.random().toString(36).slice(2);
      if (!seen.has(key)) { seen.add(key); out.push(t); }
    };
    apiItems.forEach(push);
    optimisticItems.forEach(push);
    return out;
  }

  mapStatus(s?: string): string {
    const map: Record<string, string> = { I: 'Incomplete', C: 'Completed', R: 'Reviewed', P: 'InProgress', AUTHORIZED: 'Authorized' };
    return map[(s || '').toUpperCase()] || s || '-';
  }

openDetails(t: TestItem) {
  if (t._source === 'api' && t._id) {
    this.router.navigate(['/home/my-test', t._id]);
  } else {
    this.router.navigate(['/home/my-test', 'optimistic', t._fromTestListId || 'pending']);
  }
}


  refresh() { this.loadTests(); }
}

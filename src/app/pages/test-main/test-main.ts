import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

// ====== Types ======
type TestDoc = {
  _id: string;
  testNumber?: string;
  sampleId: string;
  analysis?: { _id?: string; code?: string; name?: string; type?: string };
  analysisId?: string;
  groupId?: string;
  assignedOperator?: string;
  status?: string;
  createdAt?: string;
};

type SampleDoc = {
  _id: string;
  sampleNumber?: string;
  status?: string;
};

type TestRow = {
  id: string;
  testNumber: string;
  sampleId: string;
  sampleNumber: string;
  analysis: string;
  groupId?: string;
  group: string;
  status: string;         // test status
  sampleStatus?: string;  // sample status (Rcv/Received/…)
  operator?: string;
  createdAt?: string;
};

type UserGroupItem = {
  _id: string;
  userId: string;
  groupId: string;
  isPrimary?: boolean;
  user?: { _id: string; userName?: string; email?: string; fullName?: string; userDisabled?: boolean };
  // tenantKey: string;
};

type UserRow = {
  id: string;           // userId
  name: string;
  email?: string;
  groupId: string;
  groupName: string;
  isPrimary?: boolean;
  disabled?: boolean;
  // tenantKey: string;
};

@Component({
  selector: 'app-test-main',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-main.html',
  styleUrls: ['./test-main.scss']
})
export class TestMain implements OnInit {

  // ===== APIs =====
  private readonly API_TESTS_BASE   = 'http://localhost:3007/api/v1/tests';
  private readonly API_SAMPLES_BASE = 'http://localhost:3005/api/v1/samples';
  private readonly API_IDENTITY     = 'http://localhost:3001/api/v1';


// constructor(
//   private http:HttpHeaders,

// )


 
 

  private get headers() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'X-Tenant-Key': localStorage.getItem('tenantKey') || 'ibnouf_lab_7_testing',
        'Content-Type': 'application/json'
      })
    };
  }


  // private get headers() {
  //   return {
  //     headers: new HttpHeaders({
  //       Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  //       'Content-Type': 'application/json',
  //         // 'X-Tenant-Key': this.tenantKey,
  //     })
  //   };
  // }

  // ===== Tests state =====
  t_loading = false;
  t_error = '';
  t_search = '';
  receivedOnly = true; // اعرض فقط اختبارات العينات المستلمة (افتراضي)
  tests: TestRow[] = [];

  private selectedTestIds = new Set<string>();
  get selectedTestsCount(): number { return this.selectedTestIds.size; }
  get selectedTests(): TestRow[] { return this.tests.filter(t => this.selectedTestIds.has(t.id)); }
  isTestSelected(id: string): boolean { return this.selectedTestIds.has(id); }
  toggleTest(id: string, e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    if (checked) this.selectedTestIds.add(id); else this.selectedTestIds.delete(id);
  }
  allTestsSelectedVisible(): boolean {
    const items = this.testsFiltered();
    return items.length > 0 && items.every(r => this.selectedTestIds.has(r.id));
  }
  toggleSelectAllTestsVisible(e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    const items = this.testsFiltered();
    if (checked) items.forEach(r => this.selectedTestIds.add(r.id));
    else items.forEach(r => this.selectedTestIds.delete(r.id));
  }

  // ===== Users (for assignment) =====
  showAssignModal = false;
  usersLoading = false;
  usersError = '';
  usersAll: UserRow[] = [];   // كل المستخدمين (من جميع المجموعات المختارة)
  users: UserRow[] = [];      // المعروض بعد الفلترة/البحث
  userSearch = '';
  pickedUserIds = new Set<string>();
  visibleGroupId: string | null = null; // فلتر المجموعة الحالي
  groupOptions: Array<{ id: string; name: string; count: number }> = [];

  isUserPicked(id: string) { return this.pickedUserIds.has(id); }
  toggleUser(id: string, e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    if (checked) this.pickedUserIds.add(id); else this.pickedUserIds.delete(id);
  }
  onUserSearchChange() { this.applyUsersFilters(); }
  onChangeVisibleGroup(gid: string) { this.visibleGroupId = gid; this.applyUsersFilters(); }

  // ===== Group mapping (ثابت مؤقتًا) =====
  private GROUPS: Record<string, string> = {
    '68dd2360fab1dde693895585': 'Chemistry',
    '68dd2360fab1dde693895586': 'Microbiology',
    '68dd2360fab1dde693895587': 'Quality Control',
    '68dd2360fab1dde693895588': 'Administration'
  };
  mapGroup(id?: string): string { if (!id) return '-'; return this.GROUPS[id] || id; }

  // constructor(
  //   private http: HttpClient,
  //   public route: ActivatedRoute,
  //   private router: Router
  // ) {}
 constructor(private http: HttpClient, private router: Router,public route: ActivatedRoute,) {}

  ngOnInit(): void {
    const sampleId = this.route.snapshot.queryParamMap.get('sampleId') || undefined;
    this.loadTests(sampleId);
  }

  // ===== Load tests =====
  private loadTests(sampleId?: string) {
    this.t_loading = true; this.t_error = '';
    this.tests = []; this.selectedTestIds.clear();

    const url = sampleId
      ? `${this.API_TESTS_BASE}?sampleId=${encodeURIComponent(sampleId)}`
      : `${this.API_TESTS_BASE}`;

    this.http.get<any>(url,this.headers).subscribe({
      next: (res) => {
        const arr: TestDoc[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (!arr.length) { this.t_loading = false; return; }

        const sampleIds = Array.from(new Set(arr.map(t => t.sampleId).filter(Boolean)));
        if (!sampleIds.length) {
          this.tests = arr.map(t => this.toRow(t, undefined));
          this.t_loading = false;
          return;
        }

        const calls = sampleIds.map(id => this.http.get<any>(`${this.API_SAMPLES_BASE}/${id}`, this.headers));
        forkJoin(calls).subscribe({
          next: (samplesRes) => {
            const byId: Record<string, SampleDoc> = {};
            for (const r of samplesRes) {
              const s: SampleDoc = r?.data || r || {};
              if (s?._id) byId[s._id] = s;
            }
            this.tests = arr.map(t => this.toRow(t, byId[t.sampleId]));
            this.t_loading = false;
          },
          error: () => {
            this.tests = arr.map(t => this.toRow(t, undefined));
            this.t_loading = false;
          }
        });
      },
      error: (err) => {
        this.t_loading = false;
        this.t_error = err?.error?.error?.message || 'Failed to load tests';
      }
    });
  }

  private toRow(t: TestDoc, s?: SampleDoc): TestRow {
    const sampleNumber = s?.sampleNumber || t.sampleId;
    const analysisName = t.analysis?.name || (t as any)?.analysisName || (t as any)?.analysis || '-';
    return {
      id: t._id,
      testNumber: t.testNumber || t._id,
      sampleId: t.sampleId,
      sampleNumber,
      analysis: analysisName,
      groupId: t.groupId,
      group: this.mapGroup(t.groupId),
      status: t.status || 'Pending',
      sampleStatus: s?.status,
      operator: t.assignedOperator,
      createdAt: t.createdAt
    };
  }

  // ===== Filters =====
  testsFiltered(): TestRow[] {
    let base = this.tests.slice();

    if (this.receivedOnly) {
      base = base.filter(r => {
        const st = (r.sampleStatus || '').toString().toUpperCase();
        return st === 'RCV' || st === 'RECEIVED';
      });
    }

    const q = this.t_search.trim().toLowerCase();
    if (!q) return base;

    return base.filter(r =>
      [r.testNumber, r.sampleNumber, r.analysis, r.group, r.status, r.operator ?? '', r.createdAt ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }

  // ===== Assign modal =====
  openAssignModal(): void {
    if (!this.selectedTestsCount) return;
    this.showAssignModal = true;
    this.loadUsersForSelectedTestsGroups();
  }
  closeAssignModal(): void {
    this.showAssignModal = false;
    this.usersAll = [];
    this.users = [];
    this.pickedUserIds.clear();
    this.usersError = '';
    this.userSearch = '';
    this.visibleGroupId = null;
    this.groupOptions = [];
  }

  private loadUsersForSelectedTestsGroups() {
    this.usersLoading = true; this.usersError = '';
    this.usersAll = []; this.users = [];
    this.visibleGroupId = null;
    this.groupOptions = [];

    const groupIds = Array.from(
      new Set(this.selectedTests.map(t => t.groupId).filter(Boolean))
    ) as string[];

    if (!groupIds.length) {
      this.usersLoading = false;
      this.usersError = 'No group found on selected tests.';
      return;
    }

    const reqs = groupIds.map(gid =>
      this.http.get<any>(`${this.API_IDENTITY}/user-groups?groupId=${gid}`, this.headers)
    );

    forkJoin(reqs).subscribe({
      next: (responses: any[]) => {
        const rows: UserRow[] = [];
        const counter: Record<string, number> = {};

        for (const r of responses) {
          const list = Array.isArray(r?.data) ? r.data : [];
          for (const it of list as UserGroupItem[]) {
            const uid = it.user?._id || it.userId;
            const gid = it.groupId;
            if (!uid || !gid) continue;

            const name =
              (it.user?.fullName?.trim()) ||
              (it.user?.userName?.trim()) ||
              (it.user?.email ? it.user.email.split('@')[0] : '') ||
              uid;

            rows.push({
              id: uid,
              name,
              email: it.user?.email,
              groupId: gid,
              groupName: this.mapGroup(gid),
              isPrimary: it.isPrimary,
              disabled: it.user?.userDisabled
            });

            counter[gid] = (counter[gid] || 0) + 1;
          }
        }

        const seen = new Set<string>();
        this.usersAll = rows.filter(u => {
          const key = `${u.id}::${u.groupId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        this.groupOptions = groupIds.map(id => ({
          id,
          name: this.mapGroup(id),
          count: counter[id] || 0
        }));

        this.visibleGroupId = this.groupOptions[0]?.id ?? null;

        this.applyUsersFilters();
        this.usersLoading = false;
      },
      error: (err) => {
        this.usersLoading = false;
        this.usersError = err?.error?.error?.message || 'Failed to load users';
      }
    });
  }

  private applyUsersFilters() {
    const groupFiltered = this.usersAll.filter(u =>
      !this.visibleGroupId || u.groupId === this.visibleGroupId
    );

    const q = this.userSearch.trim().toLowerCase();
    this.users = !q ? groupFiltered :
      groupFiltered.filter(u =>
        [u.name, u.email ?? '', u.groupName].join(' ').toLowerCase().includes(q)
      );
  }

  private writeOptimistic(assignments: Array<{ testId: string; assignedOperator: string }>) {
    const key = 'optimistic_assigned_lists';
    const raw = localStorage.getItem(key);
    const store: Record<string, any[]> = raw ? JSON.parse(raw) : {};
    const now = new Date().toISOString();

    const byId: Record<string, TestRow> = {};
    for (const t of this.tests) byId[t.id] = t;

    for (const a of assignments) {
      const row = byId[a.testId];
      if (!row) continue;

      const payload = {
        id: a.testId,
        testNumber: row.testNumber,
        sampleId: row.sampleId,
        groupId: row.groupId,
        analysis: row.analysis,
        assignedAt: now
      };

      if (!Array.isArray(store[a.assignedOperator])) store[a.assignedOperator] = [];
      const exists = store[a.assignedOperator].some(it => it.id === payload.id);
      if (!exists) store[a.assignedOperator].push(payload);
    }

    localStorage.setItem(key, JSON.stringify(store));
  }

  private clearOptimisticForSuccess(successIds: string[], operatorIds: string[]) {
    const key = 'optimistic_assigned_lists';
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const store: Record<string, any[]> = JSON.parse(raw);
    for (const opId of operatorIds) {
      if (!Array.isArray(store[opId])) continue;
      store[opId] = store[opId].filter(it => !successIds.includes(it.id));
    }
    localStorage.setItem(key, JSON.stringify(store));
  }

  // ===== Execute assignment (PATCH /tests/assign) =====
  confirmAssign(): void {
    const users = this.users.filter(u => this.pickedUserIds.has(u.id));
    const tests = this.selectedTests;

    if (!users.length || !tests.length) { this.closeAssignModal(); return; }

    // توزيع Round-Robin
    const assignments: Array<{ testId: string; assignedOperator: string }> = [];
    let idx = 0;
    for (const t of tests) {
      const u = users[idx % users.length];
      assignments.push({ testId: t.id, assignedOperator: u.id });
      idx++;
    }

    this.writeOptimistic(assignments);

    this.http.patch<any>(`${this.API_TESTS_BASE}/assign`, { assignments }, this.headers)
    // this.http.patch<any>(`${this.API_TESTS_BASE}/assign`, { assignments }),{this.headers }
.subscribe({
      next: (res) => {
        const ok = (res?.data?.successful ?? []) as Array<{ testId: string; newOperator?: string; assignedOperator?: string; newOperatorId?: string }>;

        const mapNew: Record<string, string> = {};
        ok.forEach(x => {
          mapNew[x.testId] = x.newOperator || x.assignedOperator || x.newOperatorId || '';
        });
        this.tests = this.tests.map(t => mapNew[t.id] ? { ...t, operator: mapNew[t.id] } : t);

        const successIds = ok.map(x => x.testId);
        const opIds = Array.from(new Set(assignments.map(a => a.assignedOperator)));
        this.clearOptimisticForSuccess(successIds, opIds);

        alert(`Assigned tests: ${ok.length}, failed: ${Math.max(0, assignments.length - ok.length)}`);
        this.closeAssignModal();

        if (users.length === 1) {
          this.router.navigate(['/my-test'], { queryParams: { operatorId: users[0].id } });
        } else {
          const sampleId = this.route.snapshot.queryParamMap.get('sampleId') || undefined;
          this.loadTests(sampleId);
        }
      },
      error: (err) => {
        const msg = err?.error?.error?.message || 'Failed to assign tests';
        alert(msg);
        this.closeAssignModal();
      }
    });
  }

  // ===== Status helpers =====
  prettyStatus(s?: string): string {
    const k = (s || '').toUpperCase();
    switch (k) {
      case 'I':
      case 'INPROGRESS':
      case 'IN-PROGRESS': return 'In progress';
      case 'P':
      case 'PENDING':
      case 'NEW':         return 'Pending';
      case 'C':
      case 'COMPLETE':    return 'Complete';
      case 'A':
      case 'AUTHORIZED':  return 'Authorized';
      case 'R':
      case 'REJECTED':    return 'Rejected';
      case 'X':
      case 'CANCELLED':
      case 'CANCELED':    return 'Cancelled';
      default:            return s || 'Pending';
    }
  }

  statusBadgeClass(s: string): string {
    const k = (s || '').toUpperCase();
    if (k === 'A' || k === 'AUTHORIZED' || k === 'C' || k === 'COMPLETE') return 'badge-completed';
    if (k === 'I' || k === 'INPROGRESS' || k === 'IN-PROGRESS' || k === 'P' || k === 'PENDING' || k === 'NEW') return 'badge-pending';
    if (k === 'R' || k === 'REJECTED' || k === 'X' || k === 'CANCELLED' || k === 'CANCELED') return 'badge-rejected';
    return 'badge-pending';
  }
}

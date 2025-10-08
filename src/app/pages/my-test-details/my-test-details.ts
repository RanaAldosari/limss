import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

type ResultType = 'N' | 'T' | 'L';

type ComponentSpec = {
  _id: string;
  name: string;
  resultType: ResultType;
  units?: string;
  places?: number;
  minimum?: number | null;
  maximum?: number | null;
  specMin?: number | null;
  specMax?: number | null;
  listId?: { _id: string } | string | null;
};

type EntryRow = {
  componentId: string;
  componentName: string;
  resultType: ResultType;
  unit?: string;
  places?: number;
  value?: number | string | null;
  options?: string[];
  isInPlausibility?: boolean;
  isOutOfSpec?: boolean;
  comment?: string;
};

@Component({
  selector: 'app-my-test-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-test-details.html',
  styleUrls: ['./my-test-details.scss']
})
export class MyTestDetailsComponent implements OnInit {
  // state
  loading = signal(false);
  error = signal('');
  test = signal<any | null>(null);

  starting = signal(false);
  saving = signal(false);
  completing = signal(false);


  
private readonly API = {
  // عبر البروكسي بدلاً من http://localhost:3004
  components:  '/md/api/v1/components',
  listEntries: '/md/api/v1/list-entries',

  // 3007 و 3005 كذلك
  tests:   '/tests/api/v1/tests',
  results: '/tests/api/v1/results'
};


// private readonly API = {
//   components:  'http://localhost:3004/api/v1/components',
//   listEntries: 'http://localhost:3004/api/v1/list-entries',
//   tests:       'http://localhost:3007/api/v1/tests',
//   results:     'http://localhost:3007/api/v1/results'
// };


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


  // form
  componentsForAnalysis: ComponentSpec[] = [];
  entryRows: EntryRow[] = [];
  replicateIndex = 1;

  private compById = new Map<string, ComponentSpec>();
  private indexComponents(comps: ComponentSpec[]) {
    this.compById.clear();
    comps.forEach(c => this.compById.set(c._id, c));
  }
  getCompById(id?: string): ComponentSpec | undefined {
    return id ? this.compById.get(id) : undefined;
  }

  isIncomplete(t: any) { const n = (t?.status || '').toUpperCase(); return n === 'I' || n === 'INCOMPLETE'; }
  isInProgress(t: any) { const n = (t?.status || '').toUpperCase(); return n === 'P' || n === 'INPROGRESS' || n === 'IN-PROGRESS'; }
  isComplete(t: any)   { const n = (t?.status || '').toUpperCase(); return n === 'C' || n === 'COMPLETE'; }

  mapStatus(s?: string) {
    const x = (s || '').toUpperCase();
    if (x === 'I' || x === 'INCOMPLETE') return 'Incomplete';
    if (x === 'P' || x === 'INPROGRESS' || x === 'IN-PROGRESS') return 'In progress';
    if (x === 'C' || x === 'COMPLETE') return 'Complete';
    return s || '—';
  }

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.fetchTest(id);
    else {
      const st = history.state?.test;
      if (st) { this.test.set(st); this.afterTestLoaded(st); }
      else this.error.set('Missing test id');
    }
  }

  private fetchTest(id: string) {
    this.loading.set(true);
    this.http.get<any>(`${this.API.tests}/${id}`, this.headers).subscribe({
      next: (res) => {
        const t = res?.data || res;
        this.test.set(t);
        this.afterTestLoaded(t);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error?.message || 'Failed to load test');
      }
    });
  }

  private afterTestLoaded(t: any) {
    this.replicateIndex = Number(t?.replicateCount || 1) || 1;
    const analysisId = t?.analysisId || t?.analysis?._id || t?.analysis;
    if (analysisId && this.isInProgress(t)) this.initEntryFormFromAnalysis(analysisId);
  }

private async fetchComponentsByAnalysis(analysisId: string): Promise<ComponentSpec[]> {
  const url = `${this.API.components}?analysisId=${encodeURIComponent(analysisId)}`;
  const res = await this.http.get<any>(url, this.headers).toPromise();

  const arr: any[] = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
  const list = arr.filter(x => {
    const aid = (x?.analysisId && (x.analysisId._id || x.analysisId)) || x?.analysis;
    return (aid?.toString?.() || aid) === analysisId;
  });

  return list.map((x: any) => ({
    _id: x._id,
    name: x.name,
    resultType: (x.resultType || 'N') as ResultType,
    units: x.units || x.unit,
    places: x.places ?? x.decimals ?? 0,
    minimum: x.minimum ?? x.min ?? null,
    maximum: x.maximum ?? x.max ?? null,
    specMin: x.specMin ?? x.specificationMin ?? null,
    specMax: x.specMax ?? x.specificationMax ?? null,
    listId: x.listId ?? null
  }));
}

 private async fetchListOptions(listId: string): Promise<string[]> {
    const url = `${this.API.listEntries}?listId=${listId}`;
    const res = await this.http.get<any>(url, this.headers).toPromise();
    const arr: any[] = res?.data ?? res?.items ?? res?.data?.items ?? res ?? [];
    return arr.map(x => x.name ?? x.value).filter(Boolean);
  }

  private async initEntryFormFromAnalysis(analysisId: string) {
    const comps = await this.fetchComponentsByAnalysis(analysisId);
    this.componentsForAnalysis = comps;
    this.indexComponents(comps);

    this.entryRows = await Promise.all(comps.map(async (c) => {
      const row: EntryRow = {
        componentId: c._id,
        componentName: c.name,
        resultType: c.resultType,
        unit: c.units,
        places: c.places ?? 0,
        value: null
      };
      if (c.resultType === 'L' && c.listId) {
        const listId = typeof c.listId === 'string' ? c.listId : c.listId?._id;
        if (listId) row.options = await this.fetchListOptions(listId);
      }
      return row;
    }));
  }

  // ------- entry interactions -------
  onValueChange(row: EntryRow, ev: any) {
    const v = (row.resultType === 'N')
      ? (ev?.target?.valueAsNumber ?? Number(ev?.target?.value ?? ev))
      : (ev?.target?.value ?? ev ?? '');

    row.value = (row.resultType === 'N' && Number.isFinite(v)) ? v : v;

    const comp = this.getCompById(row.componentId);
    if (comp && row.resultType === 'N' && typeof row.value === 'number') {
      const num = row.value as number;
      const inPlaus =
        (comp.minimum == null || num >= (comp.minimum as number)) &&
        (comp.maximum == null || num <= (comp.maximum as number));
      const outSpec =
        (comp.specMin != null && num < (comp.specMin as number)) ||
        (comp.specMax != null && num > (comp.specMax as number));
      row.isInPlausibility = inPlaus;
      row.isOutOfSpec = !!outSpec;
    } else {
      row.isInPlausibility = undefined;
      row.isOutOfSpec = undefined;
    }
  }

  private ensureEntryLoaded() {
    const t = this.test();
    if (!t || !this.isInProgress(t)) return;
    if (this.entryRows.length === 0) {
      const analysisId = t?.analysisId || t?.analysis?._id || t?.analysis;
      if (analysisId) this.initEntryFormFromAnalysis(analysisId);
    }
  }

  private validateBeforeSubmit(): { ok: boolean; message?: string } {
    const t = this.test();
    if (!t) return { ok: false, message: 'Test not loaded.' };
    if (!this.isInProgress(t)) return { ok: false, message: 'Start the test first.' };
    if (!this.entryRows.length) return { ok: false, message: 'No components found for this analysis. Cannot submit results.' };

    const missing = this.entryRows.some(r => {
      if (r.resultType === 'N') return !(typeof r.value === 'number' && Number.isFinite(r.value));
      return r.value == null || r.value === '';
    });
    if (missing) return { ok: false, message: 'All replicate results must be entered.' };
    return { ok: true };
  }

 private buildResultPayload(t: any) {
  const sampleId = t?.sampleId;
  const testId   = t?._id || t?.id || t?.testId;

  const entries = this.entryRows.map(r => {
    const e: any = { componentId: r.componentId, resultType: r.resultType };
    if (r.resultType === 'N') e.numericEntry = (typeof r.value === 'number') ? r.value : null;
    if (r.resultType === 'T') e.textEntry    = (typeof r.value === 'string') ? r.value : null;
    if (r.resultType === 'L') e.listEntry    = (r.value ?? null);
    return e;
  });

  return { sampleId, testId, replicateIndex: this.replicateIndex, entries };
}


  // ------- actions -------
  startTest() {
    const t = this.test();
    if (!t) return;
    this.starting.set(true);
    this.http.patch<any>(`${this.API.tests}/${t._id}/start`, {}, this.headers).subscribe({
      next: (res) => {
        this.starting.set(false);
        const updated = res?.data || res;
        this.test.set(updated);

        const analysisId = updated?.analysisId || updated?.analysis?._id || updated?.analysis;
        if (analysisId) this.initEntryFormFromAnalysis(analysisId);
      },
      error: (err) => {
        this.starting.set(false);
        this.error.set(err?.error?.error?.message || 'Failed to start test');
      }
    });
  }

  saveResults() {
    this.ensureEntryLoaded();
    const v = this.validateBeforeSubmit();
    if (!v.ok) {
      this.error.set(v.message || 'Cannot save.');
      setTimeout(() => this.error.set(''), 3000);
      return;
    }

    const t = this.test();
    const body = this.buildResultPayload(t);
    this.saving.set(true);
    this.http.post<any>(this.API.results, body, this.headers).subscribe({
      next: () => { this.saving.set(false); },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.error?.message || 'Failed to save results');
      }
    });
  }

  markComplete() {
    this.ensureEntryLoaded();
    const v = this.validateBeforeSubmit();
    if (!v.ok) {
      this.error.set(v.message || 'Cannot mark complete.');
      setTimeout(() => this.error.set(''), 3000);
      return;
    }

    const t = this.test();
    this.saving.set(true);
    const body = this.buildResultPayload(t);
    this.http.post<any>(this.API.results, body, this.headers).subscribe({
      next: () => {
        this.saving.set(false);
        this.completing.set(true);
        this.http.patch<any>(`${this.API.tests}/${t!._id}/complete`, {}, this.headers).subscribe({
          next: (res2) => { this.completing.set(false); this.test.set(res2?.data || res2); },
          error: () => { this.completing.set(false); }
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.error?.message || 'Failed to save results');
      }
    });
  }

  back() { this.router.navigate(['/home/my-test']); }
}

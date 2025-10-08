// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { ActivatedRoute, Router } from '@angular/router';

// type TestDetail = {
//   _id?: string;
//   testNumber?: string;
//   sampleId?: string;
//   analysisId?: any;
//   groupId?: string;
//   replicateCount?: number;
//   status?: string;
//   assignedOperator?: string;
//   createdAt?: string;
//   updatedAt?: string;
// };

// @Component({
//   selector: 'app-test-detail',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './test-detail.html',
//   styleUrls: ['./test-detail.scss']
// })
// export class TestDetail implements OnInit {
//   private readonly TESTS_API   = 'http://localhost:3007/api/v1/tests';
//   private readonly SAMPLES_API = 'http://localhost:3005/api/v1/samples';

//   loading = false;
//   error = '';
//   test?: TestDetail;
//   sample?: any;

//   isOptimistic = false;
//   optimisticPayload?: any;

//   constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

//   private get headers() {
//     return {
//       headers: new HttpHeaders({
//         Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
//         'Content-Type': 'application/json',
//         'X-Tenant-Code': localStorage.getItem('tenantKey') || 'ibnouf_lab_7_testing'
//       })
//     };
//   }

//   ngOnInit(): void {
//     const id = this.route.snapshot.paramMap.get('id') || '';
//     const optimisticFlag = this.route.snapshot.paramMap.get('optimistic');

//     if (optimisticFlag) {
//       this.isOptimistic = true;
//       this.loadOptimistic(id);
//     } else {
//       this.fetchTest(id);
//     }
//   }

//   private loadOptimistic(localId: string) {
//     const key = 'optimistic_assigned_lists';
//     const store = JSON.parse(localStorage.getItem(key) || '{}');

//     let found: any;
//     Object.values(store).forEach((arr: any) => {
//       if (Array.isArray(arr)) {
//         const f = arr.find((x: any) => String(x.id) === String(localId));
//         if (f) found = f;
//       }
//     });

//     if (!found) {
//       this.error = 'Local item not found.';
//       return;
//     }

//     this.optimisticPayload = found;
//     this.test = {
//       testNumber: found.code,
//       groupId: found.groupId,
//       sampleId: found.sampleId,
//       status: 'I',
//       createdAt: found.assignedAt,
//       updatedAt: found.assignedAt
//     };
//   }

//   private fetchTest(id: string) {
//     this.loading = true; this.error = '';
//     this.http.get<any>(`${this.TESTS_API}/${id}`, this.headers).subscribe({
//       next: (res) => {
//         this.test = res?.data || res;
//         this.loading = false;
//         if (this.test?.sampleId) this.fetchSample(this.test.sampleId as string);
//       },
//       error: (err) => {
//         this.error = err?.error?.error?.message || 'Failed to load test details.';
//         this.loading = false;
//       }
//     });
//   }

//   private fetchSample(sampleId: string) {
//     this.http.get<any>(`${this.SAMPLES_API}/${sampleId}`, this.headers).subscribe({
//       next: (r) => { this.sample = r?.data || r; },
//       error: () => {}
//     });
//   }

//   mapStatus(s?: string): string {
//     const k = (s || '').toUpperCase();
//     if (['AUTHORIZED','A'].includes(k)) return 'Authorized';
//     if (['COMPLETE','C'].includes(k))   return 'Complete';
//     if (['INPROGRESS','IN-PROGRESS','I'].includes(k)) return 'In progress';
//     if (['REJECTED','R'].includes(k))   return 'Rejected';
//     if (['PENDING','NEW','P'].includes(k)) return 'Pending';
//     return s || '-';
//   }

//   back() { history.length > 1 ? history.back() : this.router.navigate(['/home/my-test']); }
// }

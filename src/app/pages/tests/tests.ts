// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { HttpClient, HttpHeaders } from '@angular/common/http';

// type Tabs =
//   | 'product' | 'product-grade' | 'product-stage' | 'product-spec'
//   | 'units' | 'test-list' | 'components' | 'analysis';

// @Component({
//   selector: 'app-tests',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './tests.html',
//   styleUrls: ['./tests.scss']
// })
// export class Tests {
//   // ===== State =====
//   activeTab: Tabs = 'product';
//   displayedColumns: string[] = [];
//   tableData: any[] = [];
//   showForm = false;
//   formData: any = {};
//   searchTerm = '';
//   saving = false;
//   editMode = false; 

//   // ===== Dropdown data =====
//   groups: any[] = [];
//   products: any[] = [];
//   samplingPoints: any[] = [];
//   grades: any[] = [];
//   stages: any[] = [];

//   analyses: any[] = [];
//   lists: any[] = [];
//   components: any[] = [];

//   // ===== Maps + Raw =====
//   private analysisMap = new Map<string, any>();
//   private listMap = new Map<string, any>();
//   private componentsMap = new Map<string, any>();

//   private componentsRaw: any[] = [];
//   private productSpecsRaw: any[] = [];

//   private analysesLoaded = false;
//   private componentsLoaded = false;

//   ruleTypes: string[] = ['range', 'equal'];
//   specTypes: string[] = ['accept', 'reject', 'NONE'];

//   readonly urlBase = 'http://localhost:3004/api/v1';

//   constructor(private http: HttpClient) {
//     const t = localStorage.getItem('token');
//     if (!t) console.warn('⚠️ No auth token in localStorage; requests may return 401.');
//     this.loadTableData();
//     this.loadDropdownData();
//   }

//   get currentTitle(): string {
//     const titles: Record<Tabs, string> = {
//       'product': 'Product',
//       'product-grade': 'Product Grade',
//       'product-stage': 'Product Stage',
//       'product-spec': 'Product Spec',
//       'units': 'Units',
//       'test-list': 'Test List',
//       'components': 'Components',
//       'analysis': 'Analysis',
//     };
//     return titles[this.activeTab];
//   }

//   get headerLabel(): string {
//     return this.showForm ? `${this.editMode ? 'Edit' : 'New'} ${this.currentTitle}` : this.currentTitle;
//   }

//   private get headers() {
//     return {
//       headers: new HttpHeaders({
//         Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
//         'Content-Type': 'application/json',
//         'X-Tenant-Code': localStorage.getItem('tenantKey') || 'ibnouf_lab_6_testing'
//       })
//     };
//   }

//   // ===== Helpers =====
//   private clean(obj: any) {
//     return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
//   }
//   private uniqueById<T extends { _id?: string; id?: string }>(arr: T[]) {
//     const m = new Map<string, T>();
//     arr.forEach((x: any) => {
//       const id = this.getAnyId(x);
//       if (id) m.set(id, x);
//     });
//     return Array.from(m.values());
//   }

//   private getAnyId(x: any): string | undefined {
//     if (x === null || x === undefined) return undefined;
//     if (typeof x === 'string' || typeof x === 'number') return String(x).trim();
//     return (
//       x._id ?? x.id ?? x.$id ?? x.ref ?? x.value ?? undefined
//     )?.toString().trim();
//   }

//   private getId(x: any): string | undefined {
//     return this.getAnyId(x);
//   }

//   private labelFromAny(x: any): string {
//     if (x === null || x === undefined) return '';
//     if (typeof x === 'string' || typeof x === 'number') return String(x);
//     return (x.name ?? x.code ?? x.title ?? x.label ?? x._id ?? x.id ?? '') as string;
//   }

//   // ===== Tabs =====
//   setActiveTab(tab: Tabs) {
//     this.activeTab = tab;
//     this.showForm = false;
//     this.editMode = false;
//     this.searchTerm = '';
//     this.loadTableData();
//     if (tab === 'product-grade') this.ensureSamplingPoints();
//     if (tab === 'components') this.loadComponents();
//   }

//   // ===== Search =====
//   get filteredRows() {
//     const q = (this.searchTerm || '').toLowerCase();
//     if (!q) return this.tableData;
//     return this.tableData.filter((row: any) =>
//       this.displayedColumns.some((c) => String(row[c] ?? '').toLowerCase().includes(q))
//     );
//   }

//   // ===== Dropdown loaders =====
//   loadDropdownData() {
//     // Products + Groups
//     this.http.get<any>(`${this.urlBase}/products`, this.headers).subscribe({
//       next: (res) => {
//         const data = res?.data || [];
//         this.products = data;
//         const allGroups = data.map((p: any) => p.group).filter(Boolean);
//         this.groups = Array.from(new Map(allGroups.map((g: any) => [this.getAnyId(g)!, g])).values());
//       },
//       error: (e) => console.error('GET /products failed', e)
//     });

//     this.http.get<any>(`${this.urlBase}/grades`, this.headers).subscribe({
//       next: (res) => { this.grades = res?.data || []; this.rebuildSamplingPointsFromDeps(); },
//       error: (e) => { this.grades = []; console.error('GET /grades failed', e); }
//     });

//     this.http.get<any>(`${this.urlBase}/stages`, this.headers).subscribe({
//       next: (res) => { this.stages = res?.data || []; this.rebuildSamplingPointsFromDeps(); },
//       error: (e) => { this.stages = []; console.error('GET /stages failed', e); }
//     });

//     this.ensureSamplingPoints();

//     // Analyses
//     this.http.get<any>(`${this.urlBase}/analyses`, this.headers).subscribe({
//       next: (res) => {
//         this.analyses = res?.data || [];
//         this.analysisMap = new Map(this.analyses.map((a: any) => [this.getAnyId(a)!, a]));
//         this.analysesLoaded = true;
//         if (this.productSpecsRaw.length) this.renderProductSpecsTable(); 
//         if (this.activeTab === 'components' && this.componentsRaw.length) this.renderComponentsTable();
//       },
//       error: (e) => { this.analyses = []; this.analysisMap.clear(); this.analysesLoaded = true; console.error('GET /analyses failed', e); }
//     });

//     // Lists
//     this.http.get<any>(`${this.urlBase}/lists`, this.headers).subscribe({
//       next: (res) => {
//         this.lists = res?.data || [];
//         this.listMap = new Map(this.lists.map((l: any) => [this.getAnyId(l)!, l]));
//         if (this.activeTab === 'components' && this.componentsRaw.length) this.renderComponentsTable();
//       },
//       error: (e) => { this.lists = []; this.listMap.clear(); console.error('GET /lists failed', e); }
//     });

//     // Components
//     this.http.get<any>(`${this.urlBase}/components`, this.headers).subscribe({
//       next: (res) => {
//         this.components = res?.data || [];
//         this.componentsMap = new Map(this.components.map((c: any) => [this.getAnyId(c)!, c]));
//         this.componentsLoaded = true;
//         if (this.productSpecsRaw.length) this.renderProductSpecsTable(); 
//       },
//       error: (e) => { this.components = []; this.componentsMap.clear(); this.componentsLoaded = true; console.error('GET /components failed', e); }
//     });
//   }

//   private ensureSamplingPoints() {
//     this.http.get<any>(`${this.urlBase}/sampling-points`, this.headers).subscribe({
//       next: (res) => {
//         const arr = Array.isArray(res?.data) ? res.data : [];
//         if (arr.length) {
//           this.samplingPoints = arr
//             .map((sp: any) => ({ _id: this.getAnyId(sp), name: this.labelFromAny(sp) }))
//             .filter((x: any) => !!x._id)
//             .sort((a: { name?: string }, b: { name?: string }) =>
//               (a.name ?? '').localeCompare(b.name ?? '')
//             );
//         } else {
//           this.rebuildSamplingPointsFromDeps();
//         }
//       },
//       error: () => this.rebuildSamplingPointsFromDeps()
//     });
//   }
//   private rebuildSamplingPointsFromDeps() {
//     const list: any[] = [];
//     (this.grades || []).forEach((g: any) => { const sp = g?.samplingPointId; const id = this.getAnyId(sp); if (id) list.push({ _id: id, name: this.labelFromAny(sp) }); });
//     (this.stages || []).forEach((s: any) => { const sp = s?.samplingPointId; const id = this.getAnyId(sp); if (id) list.push({ _id: id, name: this.labelFromAny(sp) }); });
//     this.samplingPoints = this.uniqueById(list).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
//   }

//   // ===== Table loaders =====
//   loadTableData() {
//     this.searchTerm = '';

//     if (this.activeTab === 'product') {
//       this.http.get<any>(`${this.urlBase}/products`, this.headers).subscribe({
//         next: (res) => {
//           this.tableData = (res?.data || []).map((x: any) => ({
//             code: x.code, name: x.name, category: x.category, group: x.group?.name, active: x.active
//           }));
//           this.displayedColumns = ['code','name','category','group','active'];
//         },
//         error: (e) => { this.tableData = []; console.error('GET /products failed', e); }
//       });
//       return;
//     }

//     if (this.activeTab === 'product-grade') {
//       this.http.get<any>(`${this.urlBase}/grades`, this.headers).subscribe({
//         next: (res) => {
//           this.tableData = (res?.data || []).map((x: any) => ({
//             code: x.code, name: x.name, product: x.productId?.name, samplingPoint: x.samplingPointId?.name, active: x.active
//           }));
//           this.displayedColumns = ['code','name','product','samplingPoint','active'];
//         },
//         error: (e) => { this.tableData = []; console.error('GET /grades failed', e); }
//       });
//       return;
//     }

//     if (this.activeTab === 'product-stage') {
//       this.http.get<any>(`${this.urlBase}/stages`, this.headers).subscribe({
//         next: (res) => {
//           this.tableData = (res?.data || []).map((x:any)=>({
//             code:x.code, name:x.name, specType:(x.spec_type ?? x.specType), description:x.description, active:x.active
//           }));
//           this.displayedColumns = ['code','name','specType','description','active'];
//         },
//         error: (e) => { this.tableData = []; console.error('GET /stages failed', e); }
//       });
//       return;
//     }

//     if (this.activeTab === 'product-spec') {
//       this.http.get<any>(`${this.urlBase}/product-specs`, this.headers).subscribe({
//         next: (res) => { this.productSpecsRaw = res?.data || []; this.renderProductSpecsTable(); },
//         error: (e) => { this.productSpecsRaw = []; this.tableData = []; console.error('GET /product-specs failed', e); }
//       });
//       return;
//     }

//     if (this.activeTab === 'units') {
//       this.http.get<any>(`${this.urlBase}/units`, this.headers).subscribe({
//         next: (res) => {
//           this.tableData = (res?.data || []).map((x:any)=>({
//             code:x.code, name:x.name, base:x.base, category:x.category, group:x.groupId?.name, active:x.active
//           }));
//           this.displayedColumns = ['code','name','base','category','group','active'];
//         },
//         error: (e) => { this.tableData = []; console.error('GET /units failed', e); }
//       });
//       return;
//     }

//     if (this.activeTab === 'test-list') {
//       this.http.get<any>(`${this.urlBase}/test-lists`, this.headers).subscribe({
//         next: (res) => {
//           this.tableData = (res?.data || []).map((x:any)=>({
//             code:x.code, name:x.name, group:x.groupId?.name, active:x.active
//           }));
//           this.displayedColumns = ['code','name','group','active'];
//         },
//         error: (e) => { this.tableData = []; console.error('GET /test-lists failed', e); }
//       });
//       return;
//     }

//     if (this.activeTab === 'components') { this.loadComponents(); return; }

//     if (this.activeTab === 'analysis') {
//       this.http.get<any>(`${this.urlBase}/analyses`, this.headers).subscribe({
//         next: (res) => {
//           const rows = res?.data || [];
//           this.tableData = rows.map((x:any)=>({
//             code:x.code,
//             name:x.name,
//             analysisType: (x.analysisType ?? x.AnalysisType),
//             type:x.type,
//             version:x.version,
//             group:x.groupId?.name,
//             active:x.active
//           }));
//           this.displayedColumns = ['code','name','analysisType','type','version','group','active'];
//         },
//         error: (e) => { this.tableData = []; console.error('GET /analyses failed', e); }
//       });
//       return;
//     }
//   }
//   private renderProductSpecsTable() {
//     const rows = (this.productSpecsRaw || []).map((item:any) => {

//       const rawAnalysis  = item.analysisId  ?? item.analysis  ?? item.analysis_id  ?? item.AnalysisId  ?? item.analysisID;
//       const rawComponent = item.componentId ?? item.component ?? item.component_id ?? item.ComponentId ?? item.componentID;

//       const analysisId  = this.getAnyId(rawAnalysis);
//       const componentId = this.getAnyId(rawComponent);

//       const analysisObj  =
//         (analysisId ? this.analysisMap.get(analysisId) : undefined) ||
//         (typeof rawAnalysis === 'object' ? rawAnalysis : undefined);

//       const componentObj =
//         (componentId ? this.componentsMap.get(componentId) : undefined) ||
//         (typeof rawComponent === 'object' ? rawComponent : undefined);

//       let finalAnalysisObj = analysisObj;
//       if (!finalAnalysisObj && componentObj?.analysisId) {
//         const aId2 = this.getAnyId(componentObj.analysisId);
//         if (aId2) finalAnalysisObj = this.analysisMap.get(aId2) ?? finalAnalysisObj;
//       }

//       const analysisName  = this.labelFromAny(finalAnalysisObj) || (analysisId  ?? '');
//       const componentName = this.labelFromAny(componentObj)     || (componentId ?? '');

//       return {
//         code: item.code,
//         name: item.name,
//         analysis: analysisName,
//         component: componentName,
//         units: item.units,
//         ruleType: item.ruleType ?? item.ruletype ?? item.rule_type,
//         specType: item.specType ?? item.spectype ?? item.spec_type,
//         active: item.active
//       };
//     });

//     this.tableData = rows;
//     this.displayedColumns = ['code','name','units','ruleType','specType','active'];
//   }

//   private loadComponents() {
//     this.http.get<any>(`${this.urlBase}/components`, this.headers).subscribe({
//       next: (res) => { this.componentsRaw = res?.data || []; this.renderComponentsTable(); },
//       error: (e) => { this.componentsRaw = []; this.tableData = []; console.error('GET /components failed', e); }
//     });
//   }
//   private renderComponentsTable() {
//     this.tableData = (this.componentsRaw || []).map((x:any)=>{
//       const aId = this.getAnyId(x.analysisId);
//       const a = aId ? this.analysisMap.get(aId) : undefined;
//       const analysisName = this.labelFromAny(a) || this.labelFromAny(x.analysisId) || (aId ?? '');

//       const lId = this.getAnyId(x.listId);
//       const l = lId ? this.listMap.get(lId) : undefined;
//       const listName = this.labelFromAny(l) || this.labelFromAny(x.listId);

//       return {
//         code:x.code,
//         name:x.name,
//         analysis:analysisName,
//         resultType:x.resultType,
//         list:listName,
//         sortOrder:x.sortOrder,
//         reportedName:x.reportedName,
//         version:x.version,
//         active:x.active
//       };
//     });
//     this.displayedColumns = ['code','name','analysis','resultType','list','sortOrder','reportedName','version','active'];
//   }

//   getListName(id: string | null | undefined): string {
//     const key = (id == null ? '' : String(id)).trim();
//     if (!key) return '—';

//     const fromMap = this.listMap.get(key);
//     if (fromMap) return this.labelFromAny(fromMap);

//     const found = (this.lists || []).find((l: any) => this.getAnyId(l) === key);
//     return this.labelFromAny(found) || '—';
//   }

//   // ===== Add / Save =====
//   onAddRole() {
//     this.showForm = true;
//     this.editMode = false;
//     this.searchTerm = '';
//     this.formData = {
//       active: true,
//       version: 1,
//       ruleType: 'range',
//       specType: 'accept',
//       required: true,
//       numberOfReplications: 1,
//       resultConversion: 'NONE',
//       round: '0.1',
//       places: 1,
//       sortOrder: 1
//     };
//     if (this.activeTab === 'test-list') delete this.formData.code;
//   }

//   onSave() {
//     if (this.saving) return;
//     this.saving = true;

//     let url = '';
//     let payload: any = {};
//     const needsCode = this.activeTab !== 'test-list';

//     let codeValue = '';
//     if (needsCode) {
//       codeValue = String(this.formData.code || '')
//         .toUpperCase()
//         .replace(/[^A-Z0-9_]/g, '_')
//         .trim();
//       if (!codeValue) { alert('Code required'); this.saving = false; return; }
//     }

//     if (this.activeTab === 'product') {
//       if (!this.formData.name || !this.formData.category || !this.formData.groupId) { alert('Fill required fields'); this.saving = false; return; }
//       url = `${this.urlBase}/products`;
//       payload = {
//         code: codeValue, name: this.formData.name, category: this.formData.category,
//         description: this.formData.description, group: this.formData.groupId, active: !!this.formData.active
//       };
//     } else if (this.activeTab === 'product-grade') {
//       if (!this.formData.name || !this.formData.productId || !this.formData.samplingPointId) { alert('Fill required fields'); this.saving = false; return; }
//       url = `${this.urlBase}/grades`;
//       payload = {
//         code: codeValue, name: this.formData.name, productId: this.formData.productId,
//         samplingPointId: this.formData.samplingPointId, sortOrder: this.formData.sortOrder,
//         description: this.formData.description, active: !!this.formData.active
//       };
//     } else if (this.activeTab === 'product-stage') {
//       if (!this.formData.name || !this.formData.productId || !this.formData.gradeId || !this.formData.samplingPointId || !this.formData.spec_type) {
//         alert('Fill required fields'); this.saving = false; return;
//       }
//       url = `${this.urlBase}/stages`;
//       payload = {
//         code: codeValue, name: this.formData.name, productId: this.formData.productId,
//         gradeId: this.formData.gradeId, samplingPointId: this.formData.samplingPointId,
//         spec_type: this.formData.spec_type, numberOfReplications: this.formData.numberOfReplications,
//         method: this.formData.method, description: this.formData.description, active: !!this.formData.active
//       };
//     } else if (this.activeTab === 'product-spec') {
//       if (!this.formData.name || !this.formData.analysisId || !this.formData.componentId || !this.formData.samplingPointId || !this.formData.units) {
//         alert('Fill required fields'); this.saving = false; return;
//       }
//       url = `${this.urlBase}/product-specs`;
//       payload = this.clean({
//         code: codeValue, name: this.formData.name, description: this.formData.description,
//         productId: this.formData.productId, gradeId: this.formData.gradeId, stageId: this.formData.stageId,
//         componentId: this.formData.componentId, samplingPointId: this.formData.samplingPointId, analysisId: this.formData.analysisId,
//         units: this.formData.units, ruleType: this.formData.ruleType || 'range',
//         round: String(this.formData.round ?? '0.1').trim(), places: Number(this.formData.places) || 0,
//         sortOrder: Number(this.formData.sortOrder) || 0, specRule: this.formData.specRule,
//         specType: this.formData.specType || 'accept', required: !!this.formData.required,
//         numberOfReplications: Number(this.formData.numberOfReplications) || 1, resultConversion: this.formData.resultConversion || 'NONE',
//         minValue: this.formData.minValue !== undefined ? Number(this.formData.minValue) : undefined,
//         maxValue: this.formData.maxValue !== undefined ? Number(this.formData.maxValue) : undefined,
//         active: this.formData.active !== undefined ? !!this.formData.active : true
//       });
//     } else if (this.activeTab === 'units') {
//       if (!this.formData.name || !this.formData.base || !this.formData.category || !this.formData.groupId) { alert('Fill required fields'); this.saving = false; return; }
//       url = `${this.urlBase}/units`;
//       payload = {
//         code: codeValue, name: this.formData.name, base: this.formData.base, category: this.formData.category,
//         displayString: this.formData.displayString, groupId: this.formData.groupId, active: !!this.formData.active
//       };
//     } else if (this.activeTab === 'test-list') {
//       const listUrl = `${this.urlBase}/test-lists`;
//       const baseName = (this.formData.name || '').trim();
//       const groupId  = this.formData.groupId;
//       const desc     = (this.formData.description || '').trim();
//       const entries  = Array.isArray(this.formData.entries) ? this.formData.entries : [];
//       if (!baseName || !groupId) { alert('Fill required fields'); this.saving = false; return; }

//       const tryCreate = (proposedName: string, attempt = 0) => {
//         const pl = this.clean({ groupId, name: proposedName, description: desc, entries, active: !!this.formData.active });
//         this.http.post<any>(listUrl, pl, this.headers).subscribe({
//           next: () => { this.showForm = false; this.searchTerm = ''; this.loadTableData(); this.saving = false; },
//           error: (err) => {
//             if (err?.status === 409 && attempt < 1) {
//               const suffix = new Date().getTime().toString().slice(-5);
//               tryCreate(`${baseName}-${suffix}`, attempt + 1);
//               return;
//             }
//             console.error('POST /test-lists failed', err);
//             alert('Error: ' + (err?.error?.details || err?.error?.message || err?.message || 'Unknown'));
//             this.saving = false;
//           }
//         });
//       };
//       tryCreate(baseName);
//       return;
//     } else if (this.activeTab === 'components') {
//       if (!this.formData.name || !this.formData.code || !this.formData.analysisId || !this.formData.resultType) { alert('Fill required fields'); this.saving = false; return; }
//       if (this.formData.resultType === 'L' && !this.formData.listId) { alert('List required when resultType = L'); this.saving = false; return; }
//       url = `${this.urlBase}/components`;
//       payload = {
//         code: codeValue, name: this.formData.name, analysisId: this.formData.analysisId,
//         resultType: this.formData.resultType, listId: this.formData.listId || undefined,
//         sortOrder: Number(this.formData.sortOrder) || 0, reportedName: this.formData.reportedName,
//         version: Number(this.formData.version) || 1, active: !!this.formData.active
//       };
//     } else if (this.activeTab === 'analysis') {
//       if (!this.formData.name || !this.formData.code || !this.formData.type || !this.formData.version || !this.formData.groupId || !this.formData.AnalysisType) {
//         alert('Fill required fields'); this.saving = false; return;
//       }
//       url = `${this.urlBase}/analyses`;
//       payload = {
//         groupId: this.formData.groupId, AnalysisType: this.formData.AnalysisType,
//         code: codeValue, version: Number(this.formData.version) || 1, name: this.formData.name,
//         description: this.formData.description, type: this.formData.type, reportedName: this.formData.reportedName,
//         aliasName: this.formData.aliasName, active: !!this.formData.active
//       };
//     }

//     if (!url) { this.saving = false; return; }
//     this.http.post<any>(url, payload, this.headers).subscribe({
//       next: () => { this.showForm = false; this.searchTerm = ''; this.loadTableData(); this.saving = false; },
//       error: (err) => {
//         console.error('Error saving:', err);
//         alert('Error: ' + (err?.error?.details || err?.error?.message || err?.message || 'Unknown error'));
//         this.saving = false;
//       }
//     });
//   }

//   onCancel() {
//     this.showForm = false;
//     this.editMode = false;
//   }
// }




import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

type Tabs =
  | 'product' | 'product-grade' | 'product-stage' | 'product-spec'
  | 'units' | 'test-list' | 'components' | 'analysis';

type Group = {
  _id: string;
  name: string;
  code?: string;
  description?: string;
};

@Component({
  selector: 'app-tests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tests.html',
  styleUrls: ['./tests.scss']
})
export class Tests {
  // ===== State =====
  activeTab: Tabs = 'product';
  displayedColumns: string[] = [];
  tableData: any[] = [];
  showForm = false;
  formData: any = {};
  searchTerm = '';
  saving = false;
  editMode = false;

  // ===== Dropdown data =====
  groups: Group[] = [];
  products: any[] = [];
  samplingPoints: any[] = [];
  grades: any[] = [];
  stages: any[] = [];

  analyses: any[] = [];
  lists: any[] = [];
  components: any[] = [];

  // ===== Maps + Raw =====
  private analysisMap = new Map<string, any>();
  private listMap = new Map<string, any>();
  private componentsMap = new Map<string, any>();

  private componentsRaw: any[] = [];
  private productSpecsRaw: any[] = [];

  private analysesLoaded = false;
  private componentsLoaded = false;

  ruleTypes: string[] = ['range', 'equal'];
  specTypes: string[] = ['accept', 'reject', 'NONE'];

  // Services
  readonly urlBase = 'http://localhost:3004/api/v1';
  readonly identityBase = 'http://localhost:3001/api/v1'; // Identity Service (/groups)

  constructor(private http: HttpClient) {
    const t = localStorage.getItem('token');
    if (!t) console.warn('No auth token in localStorage; requests may return 401.');
    this.loadTableData();
    this.loadDropdownData();
    this.loadGroups(); 
  }

  get currentTitle(): string {
    const titles: Record<Tabs, string> = {
      'product': 'Product',
      'product-grade': 'Product Grade',
      'product-stage': 'Product Stage',
      'product-spec': 'Product Spec',
      'units': 'Units',
      'test-list': 'Test List',
      'components': 'Components',
      'analysis': 'Analysis',
    };
    return titles[this.activeTab];
  }

  get headerLabel(): string {
    return this.showForm ? `${this.editMode ? 'Edit' : 'New'} ${this.currentTitle}` : this.currentTitle;
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

  // ===== Helpers =====
  private clean(obj: any) {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
  }
  private uniqueById<T extends { _id?: string; id?: string }>(arr: T[]) {
    const m = new Map<string, T>();
    arr.forEach((x: any) => {
      const id = this.getAnyId(x);
      if (id) m.set(id, x);
    });
    return Array.from(m.values());
  }
  private getAnyId(x: any): string | undefined {
    if (x === null || x === undefined) return undefined;
    if (typeof x === 'string' || typeof x === 'number') return String(x).trim();
    return (x._id ?? x.id ?? x.$id ?? x.ref ?? x.value ?? undefined)?.toString().trim();
  }
  private getId(x: any): string | undefined { return this.getAnyId(x); }
  private labelFromAny(x: any): string {
    if (x === null || x === undefined) return '';
    if (typeof x === 'string' || typeof x === 'number') return String(x);
    return (x.name ?? x.code ?? x.title ?? x.label ?? x._id ?? x.id ?? '') as string;
  }

  private getGroupNameSafe(idOrObj: any): string {
    const id = this.getAnyId(idOrObj);
    if (!id) return '—';
    const found = (this.groups || []).find((g: Group) => g._id === id);
    return found?.name ?? this.labelFromAny(idOrObj) ?? '—';
  }

  private reRenderGroupNamesInTable() {
    if (!this.displayedColumns.includes('group')) return;
    this.tableData = (this.tableData || []).map((row: any) => ({
      ...row,
      group: this.getGroupNameSafe(row.group) 
    }));
  }

  // ===== Tabs =====
  setActiveTab(tab: Tabs) {
    this.activeTab = tab;
    this.showForm = false;
    this.editMode = false;
    this.searchTerm = '';
    this.loadTableData();
    if (tab === 'product-grade') this.ensureSamplingPoints();
    if (tab === 'components') this.loadComponents();
  }

  // ===== Search =====
  get filteredRows() {
    const q = (this.searchTerm || '').toLowerCase();
    if (!q) return this.tableData;
    return this.tableData.filter((row: any) =>
      this.displayedColumns.some((c: string) => String((row as any)[c] ?? '').toLowerCase().includes(q))
    );
  }

  // ===== Groups (Identity Service) =====
  private loadGroups() {
    this.http.get<any>(`${this.identityBase}/groups`, this.headers).subscribe({
      next: (res) => {
        const arr: any[] = Array.isArray(res?.data) ? res.data : [];
        this.groups = arr
          .map((g: any): Group => ({ _id: this.getAnyId(g)!, name: this.labelFromAny(g) }))
          .filter((g: Group) => !!g._id);

        this.reRenderGroupNamesInTable();
      },
      error: (e) => {
        console.error('GET /groups failed', e);
        this.groups = [];
      }
    });
  }

  // ===== Dropdown loaders =====
  loadDropdownData() {
    // Products
    this.http.get<any>(`${this.urlBase}/products`, this.headers).subscribe({
      next: (res) => { this.products = res?.data || []; },
      error: (e) => console.error('GET /products failed', e)
    });

    // Grades
    this.http.get<any>(`${this.urlBase}/grades`, this.headers).subscribe({
      next: (res) => { this.grades = res?.data || []; this.rebuildSamplingPointsFromDeps(); },
      error: (e) => { this.grades = []; console.error('GET /grades failed', e); }
    });

    // Stages
    this.http.get<any>(`${this.urlBase}/stages`, this.headers).subscribe({
      next: (res) => { this.stages = res?.data || []; this.rebuildSamplingPointsFromDeps(); },
      error: (e) => { this.stages = []; console.error('GET /stages failed', e); }
    });

    this.ensureSamplingPoints();

    // Analyses
    this.http.get<any>(`${this.urlBase}/analyses`, this.headers).subscribe({
      next: (res) => {
        this.analyses = res?.data || [];
        this.analysisMap = new Map(this.analyses.map((a: any) => [this.getAnyId(a)!, a]));
        this.analysesLoaded = true;
        if (this.productSpecsRaw.length) this.renderProductSpecsTable();
        if (this.activeTab === 'components' && this.componentsRaw.length) this.renderComponentsTable();
      },
      error: (e) => {
        this.analyses = []; this.analysisMap.clear(); this.analysesLoaded = true;
        console.error('GET /analyses failed', e);
      }
    });

    // Lists
    this.http.get<any>(`${this.urlBase}/lists`, this.headers).subscribe({
      next: (res) => {
        this.lists = res?.data || [];
        this.listMap = new Map(this.lists.map((l: any) => [this.getAnyId(l)!, l]));
        if (this.activeTab === 'components' && this.componentsRaw.length) this.renderComponentsTable();
      },
      error: (e) => { this.lists = []; this.listMap.clear(); console.error('GET /lists failed', e); }
    });

    // Components
    this.http.get<any>(`${this.urlBase}/components`, this.headers).subscribe({
      next: (res) => {
        this.components = res?.data || [];
        this.componentsMap = new Map(this.components.map((c: any) => [this.getAnyId(c)!, c]));
        this.componentsLoaded = true;
        if (this.productSpecsRaw.length) this.renderProductSpecsTable();
      },
      error: (e) => { this.components = []; this.componentsMap.clear(); this.componentsLoaded = true; console.error('GET /components failed', e); }
    });
  }

  private ensureSamplingPoints() {
    this.http.get<any>(`${this.urlBase}/sampling-points`, this.headers).subscribe({
      next: (res) => {
        const arr = Array.isArray(res?.data) ? res.data : [];
        if (arr.length) {
          this.samplingPoints = arr
            .map((sp: any) => ({ _id: this.getAnyId(sp), name: this.labelFromAny(sp) }))
            .filter((x: any) => !!x._id)
            .sort((a: { name?: string }, b: { name?: string }) =>
              (a.name ?? '').localeCompare(b.name ?? '')
            );
        } else {
          this.rebuildSamplingPointsFromDeps();
        }
      },
      error: () => this.rebuildSamplingPointsFromDeps()
    });
  }
  private rebuildSamplingPointsFromDeps() {
    const list: any[] = [];
    (this.grades || []).forEach((g: any) => { const sp = g?.samplingPointId; const id = this.getAnyId(sp); if (id) list.push({ _id: id, name: this.labelFromAny(sp) }); });
    (this.stages || []).forEach((s: any) => { const sp = s?.samplingPointId; const id = this.getAnyId(sp); if (id) list.push({ _id: id, name: this.labelFromAny(sp) }); });
    this.samplingPoints = this.uniqueById(list).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  // ===== Table loaders =====
  loadTableData() {
    this.searchTerm = '';

    if (this.activeTab === 'product') {
      this.http.get<any>(`${this.urlBase}/products`, this.headers).subscribe({
        next: (res) => {
          this.tableData = (res?.data || []).map((x: any) => ({
            code: x.code,
            name: x.name,
            category: x.category,
            group: this.getGroupNameSafe(x.group ?? x.groupId),
            active: x.active
          }));
          this.displayedColumns = ['code','name','category','group','active'];
        },
        error: (e) => { this.tableData = []; console.error('GET /products failed', e); }
      });
      return;
    }

    if (this.activeTab === 'product-grade') {
      this.http.get<any>(`${this.urlBase}/grades`, this.headers).subscribe({
        next: (res) => {
          this.tableData = (res?.data || []).map((x: any) => ({
            code: x.code, name: x.name, product: x.productId?.name, samplingPoint: x.samplingPointId?.name, active: x.active
          }));
          this.displayedColumns = ['code','name','product','samplingPoint','active'];
        },
        error: (e) => { this.tableData = []; console.error('GET /grades failed', e); }
      });
      return;
    }

    if (this.activeTab === 'product-stage') {
      this.http.get<any>(`${this.urlBase}/stages`, this.headers).subscribe({
        next: (res) => {
          this.tableData = (res?.data || []).map((x:any)=>({
            code:x.code, name:x.name, specType:(x.spec_type ?? x.specType), description:x.description, active:x.active
          }));
          this.displayedColumns = ['code','name','specType','description','active'];
        },
        error: (e) => { this.tableData = []; console.error('GET /stages failed', e); }
      });
      return;
    }

    if (this.activeTab === 'product-spec') {
      this.http.get<any>(`${this.urlBase}/product-specs`, this.headers).subscribe({
        next: (res) => { this.productSpecsRaw = res?.data || []; this.renderProductSpecsTable(); },
        error: (e) => { this.productSpecsRaw = []; this.tableData = []; console.error('GET /product-specs failed', e); }
      });
      return;
    }

    if (this.activeTab === 'units') {
      this.http.get<any>(`${this.urlBase}/units`, this.headers).subscribe({
        next: (res) => {
          this.tableData = (res?.data || []).map((x:any)=>({
            code:x.code, name:x.name, base:x.base, category:x.category, group: this.getGroupNameSafe(x.groupId), active:x.active
          }));
          this.displayedColumns = ['code','name','base','category','group','active'];
          this.reRenderGroupNamesInTable();
        },
        error: (e) => { this.tableData = []; console.error('GET /units failed', e); }
      });
      return;
    }

    if (this.activeTab === 'test-list') {
      this.http.get<any>(`${this.urlBase}/test-lists`, this.headers).subscribe({
        next: (res) => {
          this.tableData = (res?.data || []).map((x:any)=>({
            code: x.code,
            name: x.name,
            group: this.getGroupNameSafe(x.groupId),
            active: x.active
          }));
          this.displayedColumns = ['code','name','group','active'];
          this.reRenderGroupNamesInTable();
        },
        error: (e) => { this.tableData = []; console.error('GET /test-lists failed', e); }
      });
      return;
    }

    if (this.activeTab === 'components') { this.loadComponents(); return; }

    if (this.activeTab === 'analysis') {
      this.http.get<any>(`${this.urlBase}/analyses`, this.headers).subscribe({
        next: (res) => {
          const rows = res?.data || [];
          this.tableData = rows.map((x:any)=>({
            code: x.code,
            name: x.name,
            analysisType: (x.analysisType ?? x.AnalysisType),
            type: x.type,
            version: x.version,
            group: this.getGroupNameSafe(x.groupId),
            active: x.active
          }));
          this.displayedColumns = ['code','name','analysisType','type','version','group','active'];
          this.reRenderGroupNamesInTable();
        },
        error: (e) => { this.tableData = []; console.error('GET /analyses failed', e); }
      });
      return;
    }
  }

  private renderProductSpecsTable() {
    const rows = (this.productSpecsRaw || []).map((item:any) => {

      const rawAnalysis  = item.analysisId  ?? item.analysis  ?? item.analysis_id  ?? item.AnalysisId  ?? item.analysisID;
      const rawComponent = item.componentId ?? item.component ?? item.component_id ?? item.ComponentId ?? item.componentID;

      const analysisId   = this.getAnyId(rawAnalysis);
      const componentId  = this.getAnyId(rawComponent);

      const analysisObj  =
        (analysisId ? this.analysisMap.get(analysisId) : undefined) ||
        (typeof rawAnalysis === 'object' ? rawAnalysis : undefined);

      const componentObj =
        (componentId ? this.componentsMap.get(componentId) : undefined) ||
        (typeof rawComponent === 'object' ? rawComponent : undefined);

      let finalAnalysisObj = analysisObj;
      if (!finalAnalysisObj && componentObj?.analysisId) {
        const aId2 = this.getAnyId(componentObj.analysisId);
        if (aId2) finalAnalysisObj = this.analysisMap.get(aId2) ?? finalAnalysisObj;
      }

      const analysisName  = this.labelFromAny(finalAnalysisObj) || (analysisId  ?? '');
      const componentName = this.labelFromAny(componentObj)     || (componentId ?? '');

      return {
        code: item.code,
        name: item.name,
        analysis: analysisName,
        component: componentName,
        units: item.units,
        ruleType: item.ruleType ?? item.ruletype ?? item.rule_type,
        specType: item.specType ?? item.spectype ?? item.spec_type,
        active: item.active
      };
    });

    this.tableData = rows;
    this.displayedColumns = ['code','name','units','ruleType','specType','active'];
  }

  private loadComponents() {
    this.http.get<any>(`${this.urlBase}/components`, this.headers).subscribe({
      next: (res) => { this.componentsRaw = res?.data || []; this.renderComponentsTable(); },
      error: (e) => { this.componentsRaw = []; this.tableData = []; console.error('GET /components failed', e); }
    });
  }
  private renderComponentsTable() {
    this.tableData = (this.componentsRaw || []).map((x:any)=>{
      const aId = this.getAnyId(x.analysisId);
      const a = aId ? this.analysisMap.get(aId) : undefined;
      const analysisName = this.labelFromAny(a) || this.labelFromAny(x.analysisId) || (aId ?? '');

      const lId = this.getAnyId(x.listId);
      const l = lId ? this.listMap.get(lId) : undefined;
      const listName = this.labelFromAny(l) || this.labelFromAny(x.listId);

      return {
        code:x.code,
        name:x.name,
        analysis:analysisName,
        resultType:x.resultType,
        list:listName,
        sortOrder:x.sortOrder,
        reportedName:x.reportedName,
        version:x.version,
        active:x.active
      };
    });
    this.displayedColumns = ['code','name','analysis','resultType','list','sortOrder','reportedName','version','active'];
  }

  getListName(id: string | null | undefined): string {
    const key = (id == null ? '' : String(id)).trim();
    if (!key) return '—';
    const fromMap = this.listMap.get(key);
    if (fromMap) return this.labelFromAny(fromMap);
    const found = (this.lists || []).find((l: any) => this.getAnyId(l) === key);
    return this.labelFromAny(found) || '—';
  }

  // ===== Add / Save =====
  onAddRole() {
    this.showForm = true;
    this.editMode = false;
    this.searchTerm = '';
    this.formData = {
      active: true,
      version: 1,
      ruleType: 'range',
      specType: 'accept',
      required: true,
      numberOfReplications: 1,
      resultConversion: 'NONE',
      round: '0.1',
      places: 1,
      sortOrder: 1
    };
    if (this.activeTab === 'test-list') delete this.formData.code;
  }

  onSave() {
    if (this.saving) return;
    this.saving = true;

    let url = '';
    let payload: any = {};
    const needsCode = this.activeTab !== 'test-list';

    let codeValue = '';
    if (needsCode) {
      codeValue = String(this.formData.code || '')
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, '_')
        .trim();
      if (!codeValue) { alert('Code required'); this.saving = false; return; }
    }

    if (this.activeTab === 'product') {
      if (!this.formData.name || !this.formData.category || !this.formData.groupId) { alert('Fill required fields'); this.saving = false; return; }
      url = `${this.urlBase}/products`;
      payload = {
        code: codeValue,
        name: this.formData.name,
        category: this.formData.category,
        description: this.formData.description,
        // بعض الخدمات عندك تستقبل "group" بدل "groupId" — اتركها كما تعمل لديك.
        group: this.formData.groupId,
        active: !!this.formData.active
      };
    } else if (this.activeTab === 'product-grade') {
      if (!this.formData.name || !this.formData.productId || !this.formData.samplingPointId) { alert('Fill required fields'); this.saving = false; return; }
      url = `${this.urlBase}/grades`;
      payload = {
        code: codeValue, name: this.formData.name, productId: this.formData.productId,
        samplingPointId: this.formData.samplingPointId, sortOrder: this.formData.sortOrder,
        description: this.formData.description, active: !!this.formData.active
      };
    } else if (this.activeTab === 'product-stage') {
      if (!this.formData.name || !this.formData.productId || !this.formData.gradeId || !this.formData.samplingPointId || !this.formData.spec_type) {
        alert('Fill required fields'); this.saving = false; return;
      }
      url = `${this.urlBase}/stages`;
      payload = {
        code: codeValue, name: this.formData.name, productId: this.formData.productId,
        gradeId: this.formData.gradeId, samplingPointId: this.formData.samplingPointId,
        spec_type: this.formData.spec_type, numberOfReplications: this.formData.numberOfReplications,
        method: this.formData.method, description: this.formData.description, active: !!this.formData.active
      };
    } else if (this.activeTab === 'product-spec') {
      if (!this.formData.name || !this.formData.analysisId || !this.formData.componentId || !this.formData.samplingPointId || !this.formData.units) {
        alert('Fill required fields'); this.saving = false; return;
      }
      url = `${this.urlBase}/product-specs`;
      payload = this.clean({
        code: codeValue, name: this.formData.name, description: this.formData.description,
        productId: this.formData.productId, gradeId: this.formData.gradeId, stageId: this.formData.stageId,
        componentId: this.formData.componentId, samplingPointId: this.formData.samplingPointId, analysisId: this.formData.analysisId,
        units: this.formData.units, ruleType: this.formData.ruleType || 'range',
        round: String(this.formData.round ?? '0.1').trim(), places: Number(this.formData.places) || 0,
        sortOrder: Number(this.formData.sortOrder) || 0, specRule: this.formData.specRule,
        specType: this.formData.specType || 'accept', required: !!this.formData.required,
        numberOfReplications: Number(this.formData.numberOfReplications) || 1, resultConversion: this.formData.resultConversion || 'NONE',
        minValue: this.formData.minValue !== undefined ? Number(this.formData.minValue) : undefined,
        maxValue: this.formData.maxValue !== undefined ? Number(this.formData.maxValue) : undefined,
        active: this.formData.active !== undefined ? !!this.formData.active : true
      });
    } else if (this.activeTab === 'units') {
      if (!this.formData.name || !this.formData.base || !this.formData.category || !this.formData.groupId) { alert('Fill required fields'); this.saving = false; return; }
      url = `${this.urlBase}/units`;
      payload = {
        code: codeValue, name: this.formData.name, base: this.formData.base, category: this.formData.category,
        displayString: this.formData.displayString, groupId: this.formData.groupId, active: !!this.formData.active
      };
    } else if (this.activeTab === 'test-list') {
      const listUrl = `${this.urlBase}/test-lists`;
      const baseName = (this.formData.name || '').trim();
      const groupId  = this.formData.groupId;
      const desc     = (this.formData.description || '').trim();
      const entries  = Array.isArray(this.formData.entries) ? this.formData.entries : [];
      if (!baseName || !groupId) { alert('Fill required fields'); this.saving = false; return; }

      const tryCreate = (proposedName: string, attempt = 0) => {
        const pl = this.clean({ groupId, name: proposedName, description: desc, entries, active: !!this.formData.active });
        this.http.post<any>(listUrl, pl, this.headers).subscribe({
          next: () => { this.showForm = false; this.searchTerm = ''; this.loadTableData(); this.saving = false; },
          error: (err) => {
            if (err?.status === 409 && attempt < 1) {
              const suffix = new Date().getTime().toString().slice(-5);
              tryCreate(`${baseName}-${suffix}`, attempt + 1);
              return;
            }
            console.error('POST /test-lists failed', err);
            alert('Error: ' + (err?.error?.details || err?.error?.message || err?.message || 'Unknown'));
            this.saving = false;
          }
        });
      };
      tryCreate(baseName);
      return;
    } else if (this.activeTab === 'components') {
      if (!this.formData.name || !this.formData.code || !this.formData.analysisId || !this.formData.resultType) { alert('Fill required fields'); this.saving = false; return; }
      if (this.formData.resultType === 'L' && !this.formData.listId) { alert('List required when resultType = L'); this.saving = false; return; }
      url = `${this.urlBase}/components`;
      payload = {
        code: codeValue, name: this.formData.name, analysisId: this.formData.analysisId,
        resultType: this.formData.resultType, listId: this.formData.listId || undefined,
        sortOrder: Number(this.formData.sortOrder) || 0, reportedName: this.formData.reportedName,
        version: Number(this.formData.version) || 1, active: !!this.formData.active
      };
    } else if (this.activeTab === 'analysis') {
      if (!this.formData.name || !this.formData.code || !this.formData.type || !this.formData.version || !this.formData.groupId || !this.formData.AnalysisType) {
        alert('Fill required fields'); this.saving = false; return;
      }
      url = `${this.urlBase}/analyses`;
      payload = {
        groupId: this.formData.groupId,
        AnalysisType: this.formData.AnalysisType,
        code: codeValue, version: Number(this.formData.version) || 1, name: this.formData.name,
        description: this.formData.description, type: this.formData.type, reportedName: this.formData.reportedName,
        aliasName: this.formData.aliasName, active: !!this.formData.active
      };
    }

    if (!url) { this.saving = false; return; }
    this.http.post<any>(url, payload, this.headers).subscribe({
      next: () => { this.showForm = false; this.searchTerm = ''; this.loadTableData(); this.saving = false; },
      error: (err) => {
        console.error('Error saving:', err);
        alert('Error: ' + (err?.error?.details || err?.error?.message || err?.message || 'Unknown error'));
        this.saving = false;
      }
    });
  }

  onCancel() {
    this.showForm = false;
    this.editMode = false;
  }
}

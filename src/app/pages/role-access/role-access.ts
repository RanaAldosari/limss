import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

type RoleModel = {
  _id: string;
  name: string;
  description?: string;
  active?: boolean;
  createdAt?: string;
};

type FunctionItem = {
  _id?: string;
  code?: string;
  name?: string;
  module?: string;
  category?: string;
  active?: boolean;
  createdAt?: string;

  // إذا الـ API يرجّع كائن nested
  function?: {
    _id?: string;
    code?: string;
    name?: string;
    category?: string;
    active?: boolean;
  };

  functionCode?: string;
  label?: string;

  mappingId?: string;
  functionId?: string;
};

@Component({
  selector: 'app-role-access',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-access.html',
  styleUrls: ['./role-access.scss']
})
export class RoleAccessComponent implements OnInit {
  private readonly urlBase = 'http://localhost:3001/api/v1';
  constructor(private http: HttpClient) {}

  // ===== HTTP headers =====
  get h() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json'
      })
    };
  }

  // ===== Left: Roles =====
  roles: RoleModel[] = [];
  rolesLoading = false;
  roleSearch = '';
  selectedRole: RoleModel | null = null;

  // Add/Edit Role form
  showRoleForm = false;
  roleSaving = false;
  roleEditing = false;
  roleForm: Partial<RoleModel> = { name: '', description: '', active: true };

  // ===== Assign: Role → Functions =====
  allActiveFunctions: FunctionItem[] = []; // catalog (active)
  roleFunctions: FunctionItem[] = [];      // functions of selected role (normalized & enriched)

  pickFunctionCode = '';
  addByCodeValue = '';

  // ===== Functions Catalog (CRUD) =====
  functions: FunctionItem[] = [];
  fLoading = false;
  showFnForm = false;
  fnSaving = false;
  fnEditing = false;
  fnForm: Partial<FunctionItem> = {
    code: '',
    name: '',
    module: '',
    category: '',
    active: true
  };

  // ===== Dropdowns & “Other…” toggles =====
  modulesList: string[] = ['analysis', 'samples', 'results', 'admin'];
  categoriesList: string[] = ['master_data', 'operations', 'reporting', 'security', 'admin'];
  namesSuggestions: string[] = [];

  useCustomName = false;
  useCustomModule = false;
  useCustomCategory = false;

  // Index by code for enrichment
  private fnIndex: Record<string, { name?: string; category?: string; module?: string }> = {};

  ngOnInit(): void {
    this.loadRoles();
    this.loadFunctionsCatalog(); 
  }

  // ================= Roles =================
  loadRoles() {
    this.rolesLoading = true;
    this.http.get<any>(`${this.urlBase}/roles`, this.h).subscribe({
      next: (res) => {
        this.roles = res?.data || [];
        this.rolesLoading = false;
        if (!this.selectedRole && this.roles.length) this.selectRole(this.roles[0]);
      },
      error: () => { this.rolesLoading = false; this.roles = []; }
    });
  }

  filteredRoles(): RoleModel[] {
    const q = this.roleSearch.trim().toLowerCase();
    if (!q) return this.roles;
    return this.roles.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  }

  selectRole(r: RoleModel) {
    this.selectedRole = r;
    this.pickFunctionCode = '';
    this.addByCodeValue = '';
    this.loadAllActiveFunctions(); 
    this.loadRoleFunctions();
  }

  startAddRole() {
    this.roleEditing = false;
    this.showRoleForm = true;
    this.roleForm = { name: '', description: '', active: true };
  }
  startEditRole(r: RoleModel) {
    this.roleEditing = true;
    this.showRoleForm = true;
    this.roleForm = { ...r };
  }
  cancelRoleForm() { this.showRoleForm = false; this.roleSaving = false; }

  saveRole() {
    if (!this.roleForm.name?.trim()) { alert('Role name is required'); return; }
    this.roleSaving = true;
    const body = {
      name: this.roleForm.name!.trim(),
      description: this.roleForm.description || '',
      active: this.roleForm.active !== false
    };
    const req$ = this.roleEditing && this.roleForm._id
      ? this.http.put<any>(`${this.urlBase}/roles/${this.roleForm._id}`, body, this.h)
      : this.http.post<any>(`${this.urlBase}/roles`, body, this.h);

    req$.subscribe({
      next: () => { this.roleSaving = false; this.showRoleForm = false; this.loadRoles(); },
      error: (err) => { this.roleSaving = false; alert(err?.error?.message || 'Failed to save role'); }
    });
  }

  toggleRoleActive(r: RoleModel) {
    const newVal = !r.active; r.active = newVal; // optimistic
    this.http.patch<any>(`${this.urlBase}/roles/${r._id}`, { active: newVal }, this.h).subscribe();
  }
  deleteRole(r: RoleModel) {
    if (!confirm(`Delete role "${r.name}"?`)) return;
    this.http.delete<any>(`${this.urlBase}/roles/${r._id}`, this.h).subscribe({
      next: () => {
        this.roles = this.roles.filter(x => x._id !== r._id);
        if (this.selectedRole?._id === r._id) { this.selectedRole = null; this.roleFunctions = []; }
      },
      error: (err) => alert(err?.error?.message || 'Failed to delete role')
    });
  }

  // ================= Helpers =================
  private normalizeFunctionItem(raw: FunctionItem): {
    code: string;
    name: string;
    category: string;
    active: boolean | undefined;
    mappingId?: string;
    functionId?: string;
  } {
    const f = raw.function || {};
    const code = raw.code || raw.functionCode || f.code || '';
    const name = raw.name || raw.label || f.name || '';
    const category = raw.category || f.category || '';
    const active = typeof raw.active === 'boolean' ? raw.active
                 : typeof f.active === 'boolean' ? f.active
                 : undefined;

    const mappingId = (raw.function || raw.functionId) ? (raw.mappingId || raw._id) : raw.mappingId;
    const functionId = raw.functionId || f._id || raw._id;

    return { code, name, category, active, mappingId, functionId };
  }

  private buildFnIndex(list: FunctionItem[]) {
    const idx: Record<string, { name?: string; category?: string; module?: string }> = {};
    for (const f of list) {
      const code = f.code?.trim();
      if (!code) continue;
      idx[code] = {
        name: f.name,
        category: f.category,
        module: f.module
      };
    }
    this.fnIndex = idx;
  }

  private humanizeCode(code: string): string {
    const [mod, act] = code.split('.');
    const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
    if (mod && act) return `${cap(act)} ${cap(mod)}`;
    return cap(code);
  }

  // ================= Assign (Role ↔ Functions) =================
  private fetchRoleFunctionsPrimary(roleId: string) {
    return this.http.get<any>(`${this.urlBase}/roles/${roleId}/functions`, this.h);
  }
  private fetchRoleFunctionsFallback(roleId: string) {
    return this.http.get<any>(`${this.urlBase}/role-functions?roleId=${encodeURIComponent(roleId)}`, this.h);
  }

  private loadRoleFunctions() {
    if (!this.selectedRole) return;
    const roleId = this.selectedRole._id;

    this.fetchRoleFunctionsPrimary(roleId).subscribe({
      next: (res) => this.applyRoleFunctions(res?.data || []),
      error: () => {
        this.fetchRoleFunctionsFallback(roleId).subscribe({
          next: (res2) => this.applyRoleFunctions(res2?.data || []),
          error: () => (this.roleFunctions = [])
        });
      }
    });
  }

  private applyRoleFunctions(list: FunctionItem[]) {
    this.roleFunctions = list.map(raw => {
      const v = this.normalizeFunctionItem(raw);
      const fromIdx = v.code ? this.fnIndex[v.code] : undefined;
      const filledName = v.name || fromIdx?.name || this.humanizeCode(v.code);
      const filledCategory = v.category || fromIdx?.category || fromIdx?.module || '—';

      return {
        ...raw,
        code: v.code,
        name: filledName,
        category: filledCategory,
        active: v.active,
        mappingId: v.mappingId ?? (raw as any)?._id,
        functionId: v.functionId ?? (raw.function as any)?._id
      } as FunctionItem;
    });
  }

  private tryDelete(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.http.delete<any>(`${this.urlBase}${url}`, this.h).subscribe({
        next: () => resolve(true),
        error: () => resolve(false)
      });
    });
  }

  async removeRoleFunction(f: FunctionItem) {
    if (!this.selectedRole) return;

    const roleId = this.selectedRole._id;
    const code = (f.code || f.functionCode || '').trim();
    const mappingId = (f as any).mappingId || f._id;
    const functionId = (f as any).functionId || f._id;

    if (!confirm(`Remove "${code || 'this function'}" from role "${this.selectedRole.name}"?`)) return;

    const attempts: string[] = [];
    if (mappingId) attempts.push(`/role-functions/${mappingId}`);
    if (functionId) attempts.push(`/roles/${roleId}/functions/${functionId}`);
    if (code)      attempts.push(`/roles/${roleId}/functions/${encodeURIComponent(code)}`);
    if (code)      attempts.push(`/roles/${roleId}/functions?code=${encodeURIComponent(code)}`);

    for (const url of attempts) {
      const ok = await this.tryDelete(url);
      if (ok) { this.loadRoleFunctions(); return; }
    }
    alert('Failed to remove function');
  }

  loadFunctionsCatalog() {
    this.fLoading = true;
    this.http.get<any>(`${this.urlBase}/functions`, this.h).subscribe({
      next: (res) => {
        this.functions = (res?.data || []);
        this.fLoading = false;

        this.buildFnIndex(this.functions);

        const unique = <T>(arr: (T | undefined | null)[]) =>
          Array.from(new Set(arr.filter(Boolean) as T[]));

        this.namesSuggestions = unique(this.functions.map(f => f.name));
        const modulesFromData = unique((this.functions as any[]).map(f => (f as any).module));
        const catsFromData = unique(this.functions.map(f => f.category));

        this.modulesList = unique([...this.modulesList, ...modulesFromData]);
        this.categoriesList = unique([...this.categoriesList, ...catsFromData]);
      },
      error: () => { this.functions = []; this.fLoading = false; }
    });
  }

  private loadAllActiveFunctions() {
    this.http.get<any>(`${this.urlBase}/functions`, this.h).subscribe({
      next: (res) => {
        const list: FunctionItem[] = res?.data || [];
        this.allActiveFunctions = list.filter(x => x.active !== false);
        this.buildFnIndex(this.allActiveFunctions);
      }
    });
  }

  addFunctionByPick() {
    if (!this.selectedRole || !this.pickFunctionCode) return;
    const body = { functionCodes: [this.pickFunctionCode] };
    this.http.post<any>(`${this.urlBase}/roles/${this.selectedRole._id}/functions`, body, this.h).subscribe({
      next: () => { this.pickFunctionCode = ''; this.loadRoleFunctions(); },
      error: (err) => { alert(err?.error?.message || 'Failed to add function'); this.loadAllActiveFunctions(); }
    });
  }

  addFunctionByCode() {
    if (!this.selectedRole) return;
    const raw = this.addByCodeValue.trim();
    if (!raw) return;
    const codes = raw.split(',').map(s => s.trim()).filter(Boolean);
    const body = { functionCodes: codes };
    this.http.post<any>(`${this.urlBase}/roles/${this.selectedRole._id}/functions`, body, this.h).subscribe({
      next: () => { this.addByCodeValue = ''; this.loadRoleFunctions(); },
      error: (err) => alert(err?.error?.message || 'Failed to add by code')
    });
  }

  startAddFn() {
    this.fnEditing = false;
    this.showFnForm = true;
    this.fnForm = { code: '', name: '', module: '', category: '', active: true };
    this.useCustomName = false;
    this.useCustomModule = false;
    this.useCustomCategory = false;
  }

  startEditFn(f: any) {
    this.fnEditing = true;
    this.showFnForm = true;
    this.fnForm = { ...f };

    this.useCustomName = !!(f.name && !this.namesSuggestions.includes(f.name));
    this.useCustomModule = !!(f.module && !this.modulesList.includes(f.module));
    this.useCustomCategory = !!(f.category && !this.categoriesList.includes(f.category));
  }

  cancelFn() { this.showFnForm = false; this.fnSaving = false; }

  onSelectName(val: string) {
    if (val === '__other__') { this.useCustomName = true; this.fnForm.name = ''; }
    else { this.useCustomName = false; this.fnForm.name = val; }
  }
  onSelectModule(val: string) {
    if (val === '__other__') { this.useCustomModule = true; this.fnForm.module = ''; }
    else { this.useCustomModule = false; this.fnForm.module = val; }
  }
  onSelectCategory(val: string) {
    if (val === '__other__') { this.useCustomCategory = true; this.fnForm.category = ''; }
    else { this.useCustomCategory = false; this.fnForm.category = val; }
  }

  saveFn() {
    if (!this.fnForm.code?.trim()) { alert('Function Code is required'); return; }
    this.fnSaving = true;

    const body = {
      code: this.fnForm.code.trim(),
      name: this.fnForm.name || '',
      module: this.fnForm.module || '',
      category: this.fnForm.category || '',
      active: !!this.fnForm.active
    };

    const req$ = this.fnEditing && this.fnForm._id
      ? this.http.put<any>(`${this.urlBase}/functions/${this.fnForm._id}`, body, this.h)
      : this.http.post<any>(`${this.urlBase}/functions`, body, this.h);

    req$.subscribe({
      next: () => {
        this.fnSaving = false;
        this.showFnForm = false;
        this.loadFunctionsCatalog();
        this.loadAllActiveFunctions();
        if (this.selectedRole) this.loadRoleFunctions();
      },
      error: (err) => { this.fnSaving = false; alert(err?.error?.message || 'Failed to save function'); }
    });
  }

  toggleFnActive(f: FunctionItem) {
    const newVal = !f.active; f.active = newVal;
    this.http.patch<any>(`${this.urlBase}/functions/${f._id}`, { active: newVal }, this.h).subscribe();
  }

  deleteFn(f: FunctionItem) {
    if (!confirm(`Delete function "${f.code}"?`)) return;
    this.http.delete<any>(`${this.urlBase}/functions/${f._id}`, this.h).subscribe({
      next: () => {
        this.functions = this.functions.filter(x => x._id !== f._id);
        this.loadAllActiveFunctions();
        if (this.selectedRole) this.loadRoleFunctions();
      },
      error: (err) => alert(err?.error?.message || 'Failed to delete function')
    });
  }

  // Utils
  fmtDate(d?: string): string {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' });
  }
}

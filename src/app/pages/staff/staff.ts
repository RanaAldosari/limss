import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

type ApiList<T> = { data: T[] };

type Role = { _id: string; name: string };
type GroupOption = { _id: string; name: string; code?: string };

type User = {
  _id: string;
  fullName: string;
  email: string;
  userName: string;
  userDisabled?: boolean;

  roleId?: string;
  roleIds?: string[] | string;
  roleNames?: string[];
  roles?: Array<{ _id?: string; name?: string } | { roleId?: string; roleName?: string } | string>;

  groupIds?: string[] | string;
  groupNames?: string[];
  groups?: Array<{ _id?: string; name?: string } | string>;

  createdAt?: string;
};

const GROUPS_FROM_DB: GroupOption[] = [
  { _id: '68dd2360fab1dde693895585', name: 'Chemistry',       code: 'CHEM' },
  { _id: '68dd2360fab1dde693895586', name: 'Microbiology',    code: 'MICRO' },
  { _id: '68dd2360fab1dde693895587', name: 'Quality Control', code: 'QC' },
  { _id: '68dd2360fab1dde693895588', name: 'Administration',  code: 'ADMIN' },
];

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff.html',
  styleUrls: ['./staff.scss'],
})
export class Staff implements OnInit {
  staffList: User[] = [];
  filteredList: User[] = [];

  showForm = false;
  saving = false;
  searchTerm = '';

  formData: { fullName?: string; email?: string; userName?: string; password?: string; active?: boolean } = { active: true };

  roles: Role[] = [];
  selectedRoles: Role[] = [];

  groupsOptions: GroupOption[] = GROUPS_FROM_DB;
  selectedGroups: GroupOption[] = [];

  private rolesMap = new Map<string, string>();
  private groupsMap = new Map<string, string>(GROUPS_FROM_DB.map(g => [g._id, g.name]));

  private readonly BASE = 'http://localhost:3001/api/v1';

  get formInvalid(): boolean {
    return !(
      this.formData.fullName &&
      this.formData.email &&
      this.formData.userName &&
      this.formData.password &&
      this.selectedRoles.length > 0 &&
      this.selectedGroups.length > 0
    );
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadRoles(() => this.loadUsers());
  }

  private headers() {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
  }

  loadUsers() {
    this.http.get<ApiList<User>>(`${this.BASE}/users`, { headers: this.headers() }).subscribe({
      next: (res) => {
        const raw = res?.data ?? [];
        this.staffList = raw.map(u => this.normalizeUser(u));
        this.filteredList = [...this.staffList];
        this.onSearch();
      },
      error: (err) => console.error('GET /users failed', err),
    });
  }

  loadRoles(after?: () => void) {
    this.http.get<ApiList<Role>>(`${this.BASE}/roles`, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.roles = res?.data ?? [];
        this.rolesMap = new Map(this.roles.map(r => [r._id, r.name]));
        after?.();
      },
      error: (err) => { console.error('GET /roles failed', err); after?.(); },
    });
  }

  private toArray<T>(v: T | T[] | undefined | null): T[] {
    if (Array.isArray(v)) return v;
    if (v === undefined || v === null) return [];
    return [v];
  }

  private normalizeUser(u: User): User {
    // Roles
    let roleIds: string[] = [];
    let roleNames: string[] = [];
    roleIds.push(...this.toArray(u.roleId));
    roleIds.push(...this.toArray(u.roleIds) as string[]);
    if (u.roles?.length) {
      u.roles.forEach((r: any) => {
        if (typeof r === 'string') roleIds.push(r);
        else {
          if (r._id) roleIds.push(r._id);
          if (r.roleId) roleIds.push(r.roleId);
          if (r.name) roleNames.push(r.name);
          if (r.roleName) roleNames.push(r.roleName);
        }
      });
    }
    if (u.roleNames?.length) roleNames.push(...u.roleNames);
    roleIds = [...new Set(roleIds.filter(Boolean))];
    roleNames = [...new Set(roleNames.filter(Boolean))];
    if (!roleNames.length && roleIds.length) {
      roleNames = roleIds.map(id => this.rolesMap.get(id)).filter(Boolean) as string[];
    }

    // Groups
    let groupIds: string[] = [];
    let groupNames: string[] = [];
    groupIds.push(...this.toArray(u.groupIds) as string[]);
    if (u.groups?.length) {
      u.groups.forEach((g: any) => {
        if (typeof g === 'string') groupIds.push(g);
        else {
          if (g._id) groupIds.push(g._id);
          if (g.name) groupNames.push(g.name);
        }
      });
    }
    if (u.groupNames?.length) groupNames.push(...u.groupNames);
    groupIds = [...new Set(groupIds.filter(Boolean))];
    groupNames = [...new Set(groupNames.filter(Boolean))];
    if (!groupNames.length && groupIds.length) {
      groupNames = groupIds.map(id => this.groupsMap.get(id)).filter(Boolean) as string[];
    }

    return { ...u, roleIds, roleNames, groupIds, groupNames };
  }

  /* ====== Search ====== */
  onSearch() {
    const q = (this.searchTerm || '').toLowerCase().trim();
    if (!q) { this.filteredList = [...this.staffList]; return; }

    this.filteredList = this.staffList.filter(u => {
      const hay = [
        u.fullName, u.email, u.userName,
        (u.groupNames || []).join(','), (u.roleNames || []).join(','),
        u.userDisabled ? 'inactive' : 'active',
        u.createdAt || ''
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }
  clearSearch() { this.searchTerm = ''; this.filteredList = [...this.staffList]; }

  /* ====== UI Actions ====== */
  onAdd() {
    this.showForm = true; this.saving = false;
    this.formData = { active: true };
    this.selectedRoles = []; this.selectedGroups = [];
  }
  onCancel() { this.showForm = false; }

  onAddRole(ev: Event) {
    const id = (ev.target as HTMLSelectElement).value;
    if (!id) return;
    const found = this.roles.find(r => r._id === id);
    if (found && !this.selectedRoles.some(r => r._id === id)) {
      this.selectedRoles = [...this.selectedRoles, found];
    }
    (ev.target as HTMLSelectElement).value = '';
  }
  removeRole(id: string) { this.selectedRoles = this.selectedRoles.filter(r => r._id !== id); }

  onAddGroup(ev: Event) {
    const id = (ev.target as HTMLSelectElement).value;
    if (!id) return;
    const found = this.groupsOptions.find(g => g._id === id);
    if (found && !this.selectedGroups.some(g => g._id === id)) {
      this.selectedGroups = [...this.selectedGroups, found];
    }
    (ev.target as HTMLSelectElement).value = '';
  }
  removeGroup(id: string) { this.selectedGroups = this.selectedGroups.filter(g => g._id !== id); }

  /* ====== Save (Optimistic) ====== */
  onSave() {
    if (this.saving || this.formInvalid) return;
    this.saving = true;

    const body: any = {
      fullName: this.formData.fullName,
      email: this.formData.email,
      userName: this.formData.userName,
      password: this.formData.password,
      userDisabled: this.formData.active === false, // OFF => Inactive
    };
    if (this.selectedRoles.length)  body.roleIds  = this.selectedRoles.map(r => r._id);
    if (this.selectedGroups.length) body.groupIds = this.selectedGroups.map(g => g._id);

    this.http.post<any>(`${this.BASE}/users`, body, { headers: this.headers() }).subscribe({
      next: (res) => {
        const created: User = (res?.data ?? res) as User;

        created.roleNames  = created.roleNames?.length ? created.roleNames : this.selectedRoles.map(r => r.name);
        created.groupNames = created.groupNames?.length ? created.groupNames : this.selectedGroups.map(g => g.name);
        created.userDisabled = this.formData.active === false;
        created.createdAt = created.createdAt || new Date().toISOString();

        this.staffList = [created, ...this.staffList];
        this.onSearch(); 

        this.showForm = false;
        this.saving = false;
      },
      error: (err) => {
        this.saving = false;
        console.error('POST /users failed', err);
        alert(err?.error?.message || 'Error adding user');
      },
    });
  }
}
